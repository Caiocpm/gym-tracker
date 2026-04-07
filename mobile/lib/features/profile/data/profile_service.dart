// lib/features/profile/data/profile_service.dart
import '../../../core/network/dio_client.dart';
import '../domain/profile_models.dart';

class ProfileService {
  ProfileService._();
  static final ProfileService instance = ProfileService._();

  final _dio = DioClient.instance.dio;

  Future<UserStats> getStats(String userId) async {
    try {
      final res = await _dio.get('/social/stats');
      final data = res.data['data'] as Map<String, dynamic>?;
      if (data == null) return const UserStats();
      return UserStats.fromJson(data);
    } catch (_) {
      return const UserStats();
    }
  }

  Future<List<UserBadge>> getBadges() async {
    try {
      final res = await _dio.get('/social/badges');
      final data = res.data['data'] as List? ?? [];
      return data
          .whereType<Map<String, dynamic>>()
          .map(UserBadge.fromJson)
          .toList()
        ..sort((a, b) => b.earnedAt.compareTo(a.earnedAt));
    } catch (_) {
      return [];
    }
  }

  Future<void> updateProfile(
      String displayName, String? photoURL) async {
    await _dio.put('/auth/profile', data: {
      'displayName': displayName,
      if (photoURL != null) 'photoURL': photoURL,
    });
  }
}
