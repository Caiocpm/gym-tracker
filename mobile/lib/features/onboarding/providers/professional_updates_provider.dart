// lib/features/onboarding/providers/professional_updates_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/professional/providers/professional_provider.dart';
import '../data/professional_updates_service.dart';
import '../domain/professional_update.dart';

final professionalUpdatesProvider =
    FutureProvider.autoDispose<List<ProfessionalUpdate>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  final isPro = ref.watch(isProfessionalProvider);
  if (isPro) return [];
  return ProfessionalUpdatesService.instance.getStudentUpdates();
});
