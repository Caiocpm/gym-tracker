// lib/features/equipe/domain/my_professional_link.dart
import '../../../shared/providers/brand_provider.dart';

const _typeLabels = {
  'personal_trainer': 'Personal Trainer',
  'nutritionist':     'Nutricionista',
  'physiotherapist':  'Fisioterapeuta',
  'coach':            'Coach',
  'other':            'Outro',
};

class MyProfessionalLink {
  final String id;
  final String professionalId;
  final String professionalDisplayName;
  final String? professionalPhotoURL;
  /// All types the professional offers (their full profile)
  final List<String> professionalTypes;
  /// Types the student specifically contracted this professional for
  final List<String> contractedTypes;
  final String accessLevel;
  final String status;
  final DateTime linkedAt;

  // Contadores opcionais — preenchidos quando o backend os retorna
  final int unreadMessages;
  final int pendingGoals;
  final int pendingEvaluations;
  final BrandData? brand;

  const MyProfessionalLink({
    required this.id,
    required this.professionalId,
    required this.professionalDisplayName,
    this.professionalPhotoURL,
    required this.professionalTypes,
    required this.contractedTypes,
    required this.accessLevel,
    required this.status,
    required this.linkedAt,
    this.unreadMessages = 0,
    this.pendingGoals = 0,
    this.pendingEvaluations = 0,
    this.brand,
  });

  factory MyProfessionalLink.fromJson(Map<String, dynamic> json) {
    final allTypes = (json['professionalTypes'] as List<dynamic>?)
            ?.map((e) => e as String).toList() ??
        (json['professionalType'] != null
            ? [json['professionalType'] as String]
            : ['other']);
    final contracted = (json['contractedTypes'] as List<dynamic>?)
            ?.map((e) => e as String).toList() ??
        [];
    return MyProfessionalLink(
      id:                       json['id'] as String,
      professionalId:           json['professionalId'] as String,
      professionalDisplayName:  json['professionalDisplayName'] as String? ??
                                json['professionalEmail'] as String? ?? '—',
      professionalPhotoURL:     json['professionalPhotoURL'] as String?,
      professionalTypes:        allTypes,
      contractedTypes:          contracted.isEmpty ? allTypes : contracted,
      accessLevel:              json['accessLevel'] as String? ?? 'read',
      status:                   json['status'] as String? ?? 'active',
      linkedAt: DateTime.tryParse(json['linkedAt'] as String? ?? '') ??
          DateTime.now(),
      unreadMessages:     (json['unreadMessages'] as int?) ?? 0,
      pendingGoals:       (json['pendingGoals'] as int?) ?? 0,
      pendingEvaluations: (json['pendingEvaluations'] as int?) ?? 0,
      brand: json['brand'] != null
          ? BrandData.fromMap(json['brand'] as Map<String, dynamic>)
          : null,
    );
  }

  bool get isActive => status == 'active';

  /// Label of contracted types (what the student hired this professional for)
  String get typeLabel => contractedTypes
      .map((t) => _typeLabels[t] ?? 'Profissional')
      .join(' · ');

  int get totalPending => unreadMessages + pendingGoals + pendingEvaluations;
}

// ─── Preview retornado antes de aceitar o convite ────────────────────────────

class InvitationPreview {
  final String professionalDisplayName;
  final String? professionalPhotoURL;
  final List<String> professionalTypes;

  const InvitationPreview({
    required this.professionalDisplayName,
    this.professionalPhotoURL,
    required this.professionalTypes,
  });

  factory InvitationPreview.fromJson(Map<String, dynamic> json) {
    return InvitationPreview(
      professionalDisplayName: json['professionalDisplayName'] as String,
      professionalPhotoURL:    json['professionalPhotoURL'] as String?,
      professionalTypes: (json['professionalTypes'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
    );
  }
}
