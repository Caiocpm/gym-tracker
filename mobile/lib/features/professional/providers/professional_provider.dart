// lib/features/professional/providers/professional_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/professional_service.dart';
import '../domain/professional_profile.dart';
import '../domain/student_link.dart';
import '../domain/professional_invitation.dart';

// ─── Perfil profissional do usuário logado ─────────────────────────────────────

final professionalProfileProvider =
    FutureProvider.autoDispose<ProfessionalProfile?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;
  return ProfessionalService.instance.getProfile(user.uid);
});

// ─── Flag: é profissional? ────────────────────────────────────────────────────

final isProfessionalProvider = Provider<bool>((ref) {
  final profile = ref.watch(professionalProfileProvider);
  return profile.maybeWhen(
    data: (p) => p != null && p.isActive,
    orElse: () => false,
  );
});

// ─── Lista de alunos ──────────────────────────────────────────────────────────

class StudentsNotifier extends AsyncNotifier<List<StudentLink>> {
  @override
  Future<List<StudentLink>> build() async {
    final isPro = ref.watch(isProfessionalProvider);
    if (!isPro) return [];
    return ProfessionalService.instance.listStudents();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ProfessionalService.instance.listStudents(),
    );
  }

  Future<void> unlink(String linkId) async {
    await ProfessionalService.instance.unlinkStudent(linkId);
    await refresh();
  }
}

final studentsProvider =
    AsyncNotifierProvider<StudentsNotifier, List<StudentLink>>(
  StudentsNotifier.new,
);

// ─── Convites pendentes ───────────────────────────────────────────────────────

final invitationsProvider =
    FutureProvider.autoDispose<List<ProfessionalInvitation>>((ref) async {
  final isPro = ref.watch(isProfessionalProvider);
  if (!isPro) return [];
  return ProfessionalService.instance.listInvitations();
});
