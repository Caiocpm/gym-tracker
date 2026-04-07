// lib/features/profile/providers/profile_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/profile_service.dart';
import '../domain/profile_models.dart';

final userStatsProvider =
    FutureProvider.autoDispose<UserStats>((ref) async {
  final userId = ref.watch(currentUserProvider)?.uid ?? '';
  if (userId.isEmpty) return const UserStats();
  try {
    return await ProfileService.instance.getStats(userId);
  } catch (_) {
    return const UserStats();
  }
});

final userBadgesProvider =
    FutureProvider.autoDispose<List<UserBadge>>((ref) async {
  final userId = ref.watch(currentUserProvider)?.uid;
  if (userId == null) return [];
  try {
    return await ProfileService.instance.getBadges();
  } catch (_) {
    return [];
  }
});
