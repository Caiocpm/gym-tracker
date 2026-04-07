import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../types/api.types';
import { sseService } from './sse.service';
import type {
  SearchProfessionalsInput,
  CreateContactRequestInput,
} from '../schemas/marketplace.schemas';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function pushNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
) {
  const notif = await prisma.notification.create({
    data: { userId, type, title, message, actionUrl: null },
  });
  sseService.send(userId, 'notification', notif);
}

const TYPE_LABELS: Record<string, string> = {
  personal_trainer:  'Personal Trainer',
  nutritionist:      'Nutricionista',
  physiotherapist:   'Fisioterapeuta',
  coach:             'Coach',
  other:             'Outro',
};

export const marketplaceService = {
  // ─── Public search ──────────────────────────────────────────────────────────

  async searchProfessionals(input: SearchProfessionalsInput, excludeUserIds?: string[]) {
    const { q, type, city, state, lat, lng, radiusKm = 25, page, limit } = input;
    const useGeo = lat !== undefined && lng !== undefined;

    // Bounding box pre-filter when geolocation is active
    let latMin: number | undefined, latMax: number | undefined;
    let lngMin: number | undefined, lngMax: number | undefined;
    if (useGeo) {
      const latDelta = radiusKm / 111.32;
      const lngDelta = radiusKm / (111.32 * Math.cos(lat! * Math.PI / 180));
      latMin = lat! - latDelta; latMax = lat! + latDelta;
      lngMin = lng! - lngDelta; lngMax = lng! + lngDelta;
    }

    const where: Prisma.ProfessionalProfileWhereInput = {
      isPublic:  true,
      isActive:  true,
      ...(type  ? { professionalTypes: { has: type } }  : {}),
      ...(excludeUserIds?.length ? { userId: { notIn: excludeUserIds } } : {}),
      ...(city  ? { city: { contains: city,  mode: 'insensitive' } } : {}),
      ...(state ? { state: { contains: state, mode: 'insensitive' } } : {}),
      ...(useGeo ? {
        latitude:  { gte: latMin, lte: latMax },
        longitude: { gte: lngMin, lte: lngMax },
      } : {}),
      ...(q ? {
        OR: [
          { displayName:  { contains: q, mode: 'insensitive' } },
          { bio:          { contains: q, mode: 'insensitive' } },
          { clinicName:   { contains: q, mode: 'insensitive' } },
          { city:         { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const skip = useGeo ? 0 : (page - 1) * limit; // with geo, fetch all in bbox then sort+paginate in TS
    const take  = useGeo ? 500 : limit;

    const [total, raw] = await Promise.all([
      prisma.professionalProfile.count({ where }),
      prisma.professionalProfile.findMany({
        where,
        skip,
        take,
        orderBy: useGeo ? undefined : { createdAt: 'desc' },
        select: {
          userId: true, displayName: true, professionalTypes: true,
          specialties: true, bio: true, photoURL: true,
          city: true, state: true, priceRange: true,
          yearsExperience: true, availableForHire: true,
          clinicName: true, latitude: true, longitude: true,
          _count: { select: { ratings: true } },
          ratings: { select: { score: true } },
        },
      }),
    ]);

    // Attach distance, filter by exact radius, sort by distance
    type Enriched = (typeof raw)[0] & { distanceKm?: number };
    let items: Enriched[] = raw.map((p) => {
      if (useGeo && p.latitude != null && p.longitude != null) {
        return { ...p, distanceKm: Math.round(haversineKm(lat!, lng!, p.latitude, p.longitude) * 10) / 10 };
      }
      return p;
    });
    if (useGeo) {
      items = items
        .filter((p) => p.distanceKm !== undefined && p.distanceKm <= radiusKm)
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      // paginate after sort
      items = items.slice((page - 1) * limit, page * limit);
    }

    return {
      items: items.map((p) => {
        const avgRating = p.ratings.length > 0
          ? Math.round((p.ratings.reduce((s, r) => s + r.score, 0) / p.ratings.length) * 10) / 10
          : null;
        const { ratings, _count, latitude, longitude, ...rest } = p;
        return {
          ...rest,
          typeLabels: p.professionalTypes.map((t) => TYPE_LABELS[t] ?? t),
          specialties: p.specialties as string[],
          avgRating,
          ratingCount: p.ratings.length,
          distanceKm: (p as Enriched).distanceKm ?? null,
        };
      }),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  },

  // ─── Public profile ─────────────────────────────────────────────────────────

  async getPublicProfile(userId: string, viewerUserId?: string) {
    const profile = await prisma.professionalProfile.findFirst({
      where: { userId, isPublic: true, isActive: true },
      select: {
        userId: true, displayName: true, professionalTypes: true,
        specialties: true, bio: true, photoURL: true,
        city: true, state: true, priceRange: true,
        yearsExperience: true, availableForHire: true,
        clinicName: true, phone: true,
        cref: true, crn: true, crefito: true,
        instagramHandle: true, websiteUrl: true,
        createdAt: true,
        ratings: { select: { score: true } },
      },
    });
    if (!profile) throw new AppError(404, 'Profissional não encontrado');

    const avgRating = profile.ratings.length > 0
      ? Math.round((profile.ratings.reduce((s, r) => s + r.score, 0) / profile.ratings.length) * 10) / 10
      : null;

    let myRating: number | null = null;
    if (viewerUserId) {
      const r = await prisma.professionalRating.findUnique({
        where: { professionalId_studentUserId: { professionalId: userId, studentUserId: viewerUserId } },
      });
      myRating = r?.score ?? null;
    }

    const { ratings, ...rest } = profile;
    return {
      ...rest,
      typeLabels: profile.professionalTypes.map((t) => TYPE_LABELS[t] ?? t),
      specialties: profile.specialties as string[],
      avgRating,
      ratingCount: profile.ratings.length,
      myRating,
    };
  },

  // ─── Rating ─────────────────────────────────────────────────────────────────

  async upsertRating(studentUserId: string, professionalId: string, score: number) {
    // Verify the student has an active link with this professional
    const link = await prisma.studentLink.findFirst({
      where: { professionalId, studentUserId, status: 'active' },
    });
    if (!link) throw new AppError(403, 'Você precisa ser aluno deste profissional para avaliá-lo');

    return prisma.professionalRating.upsert({
      where: { professionalId_studentUserId: { professionalId, studentUserId } },
      create: { professionalId, studentUserId, score },
      update: { score },
    });
  },

  async getMyRating(studentUserId: string, professionalId: string) {
    const r = await prisma.professionalRating.findUnique({
      where: { professionalId_studentUserId: { professionalId, studentUserId } },
    });
    return { score: r?.score ?? null };
  },

  // ─── Contact request (client → professional) ────────────────────────────────

  async createContactRequest(
    clientUserId: string,
    clientEmail: string,
    professionalId: string,
    input: CreateContactRequestInput,
  ) {
    // Verify the professional exists and is public/available
    const profile = await prisma.professionalProfile.findFirst({
      where: { userId: professionalId, isPublic: true, isActive: true },
    });
    if (!profile) throw new AppError(404, 'Profissional não encontrado');
    if (!profile.availableForHire) throw new AppError(409, 'Profissional não está disponível no momento');

    // Prevent duplicate pending requests
    const existing = await prisma.contactRequest.findFirst({
      where: { professionalId, clientUserId, status: 'pending' },
    });
    if (existing) throw new AppError(409, 'Você já enviou uma solicitação para este profissional');

    // Bloqueia apenas se os tipos solicitados já estão todos contratados com este profissional
    const linked = await prisma.studentLink.findFirst({
      where: { professionalId, studentUserId: clientUserId, status: 'active' },
      select: { contractedTypes: true },
    });
    if (linked) {
      const requestedTypes: string[] = input.requestedTypes ?? [];
      const alreadyCovered = requestedTypes.length > 0
        ? requestedTypes.every((t) => linked.contractedTypes.includes(t))
        : true; // sem requestedTypes: comportamento conservador, bloqueia
      if (alreadyCovered) {
        throw new AppError(409, 'Você já possui um contrato ativo para este(s) serviço(s) com este profissional');
      }
    }

    const created = await prisma.contactRequest.create({
      data: {
        professionalId,
        clientUserId,
        clientEmail,
        message:        input.message ?? null,
        requestedTypes: input.requestedTypes ?? [],
        status:         'pending',
      },
    });

    // Notify professional in real-time
    const client = await prisma.user.findUnique({
      where: { id: clientUserId },
      select: { displayName: true },
    });
    pushNotification(
      professionalId,
      'contact_request',
      'Nova solicitação de contato',
      `${client?.displayName ?? clientEmail} quer contratar seus serviços`,
    ).catch(() => {});

    return created;
  },

  // ─── Professional: delete a single request ──────────────────────────────────

  async deleteContactRequest(professionalId: string, requestId: string) {
    const req = await prisma.contactRequest.findFirst({
      where: { id: requestId, professionalId },
    });
    if (!req) throw new AppError(404, 'Solicitação não encontrada');
    await prisma.contactRequest.delete({ where: { id: requestId } });
  },

  // ─── Professional: bulk-delete resolved requests ────────────────────────────

  async clearResolvedRequests(professionalId: string) {
    const { count } = await prisma.contactRequest.deleteMany({
      where: { professionalId, status: { in: ['accepted', 'rejected'] } },
    });
    return { count };
  },

  // ─── Professional: list incoming requests ───────────────────────────────────

  async listContactRequests(professionalId: string, status?: string) {
    return prisma.contactRequest.findMany({
      where: {
        professionalId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { displayName: true, photoURL: true } },
      },
    });
  },

  // ─── Professional: respond to request ───────────────────────────────────────

  async respondToContactRequest(
    professionalId: string,
    requestId: string,
    action: 'accept' | 'reject',
  ) {
    const req = await prisma.contactRequest.findFirst({
      where: { id: requestId, professionalId, status: 'pending' },
    });
    if (!req) throw new AppError(404, 'Solicitação não encontrada');

    if (action === 'reject') {
      const [updated, professional] = await Promise.all([
        prisma.contactRequest.update({
          where: { id: requestId },
          data: { status: 'rejected' },
        }),
        prisma.user.findUnique({ where: { id: professionalId }, select: { displayName: true } }),
      ]);
      pushNotification(
        req.clientUserId,
        'link_rejected',
        'Solicitação recusada',
        `${professional?.displayName ?? 'O profissional'} não pôde aceitar sua solicitação no momento.`,
      ).catch(() => {});
      return updated;
    }

    // Accept: create StudentLink directly (both parties are in the system)
    const existingLink = await prisma.studentLink.findFirst({
      where: { professionalId, studentUserId: req.clientUserId },
    });

    const [updated] = await Promise.all([
      prisma.contactRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      }),
      existingLink
        ? prisma.studentLink.update({
            where: { id: existingLink.id },
            data: {
              status: 'active',
              // Mescla os tipos existentes com os novos sem duplicatas
              contractedTypes: req.requestedTypes.length > 0
                ? [...new Set([...existingLink.contractedTypes, ...req.requestedTypes])]
                : existingLink.contractedTypes,
            },
          })
        : prisma.studentLink.create({
            data: {
              professionalId,
              studentUserId:   req.clientUserId,
              studentEmail:    req.clientEmail,
              status:          'active',
              accessLevel:     'read',
              tags:            [],
              contractedTypes: req.requestedTypes,
            },
          }),
    ]);

    // Notify student in real-time
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      select: { displayName: true },
    });
    const proName = professional?.displayName ?? 'O profissional';
    pushNotification(
      req.clientUserId,
      'link_accepted',
      'Solicitação aceita! 🎉',
      `${proName} aceitou sua solicitação. Acesse sua equipe para começar.`,
    ).catch(() => {});

    return updated;
  },
};
