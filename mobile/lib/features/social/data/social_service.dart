// lib/features/social/data/social_service.dart
import '../../../core/network/dio_client.dart';
import '../domain/social_models.dart';

class SocialService {
  SocialService._();
  static final SocialService instance = SocialService._();

  final _dio = DioClient.instance.dio;

  // ─── Groups ──────────────────────────────────────────────────────────────────

  Future<List<Group>> listMyGroups() async {
    final res = await _dio.get('/social/groups', queryParameters: {'filter': 'my'});
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(Group.fromJson).toList();
  }

  Future<List<Group>> discoverGroups() async {
    final res = await _dio.get('/social/groups', queryParameters: {'filter': 'discover'});
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(Group.fromJson).toList();
  }

  Future<Group> getGroup(String groupId) async {
    final res = await _dio.get('/social/groups/$groupId');
    return Group.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<Group> createGroup({
    required String name,
    String? description,
    bool isPrivate = false,
  }) async {
    final res = await _dio.post('/social/groups', data: {
      'name': name,
      if (description != null) 'description': description,
      'isPrivate': isPrivate,
    });
    return Group.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> joinGroup(String groupId) async {
    await _dio.post('/social/groups/$groupId/join');
  }

  Future<Group> joinByCode(String inviteCode) async {
    final res = await _dio.post('/social/groups/join-by-code',
        data: {'inviteCode': inviteCode});
    return Group.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> leaveGroup(String groupId) async {
    await _dio.post('/social/groups/$groupId/leave');
  }

  Future<List<GroupMember>> getMembers(String groupId) async {
    final res = await _dio.get('/social/groups/$groupId/members');
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(GroupMember.fromJson).toList();
  }

  // ─── Posts ───────────────────────────────────────────────────────────────────

  Future<List<Post>> listPosts(String groupId) async {
    final res = await _dio.get('/social/groups/$groupId/posts');
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(Post.fromJson).toList();
  }

  Future<Post> createPost(String groupId, String content, {String? imageBase64}) async {
    final res = await _dio.post('/social/groups/$groupId/posts', data: {
      'content': content,
      if (imageBase64 != null) 'imageBase64': imageBase64,
    });
    return Post.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<Post> createWorkoutPost(
    String groupId, {
    required String workoutName,
    required int durationSeconds,
    required double totalVolume,
    required List<Map<String, dynamic>> exercises,
    int? bpm,
    int? kcal,
    List<String> prBadges = const [],
    String? caption,
    List<String> imagesBase64 = const [],
  }) async {
    final res = await _dio.post('/social/groups/$groupId/posts', data: {
      if (caption != null && caption.isNotEmpty) 'content': caption,
      if (imagesBase64.isNotEmpty) 'imagesBase64': imagesBase64,
      'exercises': exercises,
      'records': {
        'workoutName': workoutName,
        'durationSeconds': durationSeconds,
        'totalVolume': totalVolume,
        'prCount': prBadges.length,
        if (bpm != null) 'bpm': bpm,
        if (kcal != null) 'kcal': kcal,
      },
    });
    return Post.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> deletePost(String postId) async {
    await _dio.delete('/social/posts/$postId');
  }

  Future<void> likePost(String postId) async {
    await _dio.post('/social/posts/$postId/like');
  }

  Future<void> unlikePost(String postId) async {
    await _dio.delete('/social/posts/$postId/like');
  }

  Future<List<PostComment>> getComments(String postId) async {
    final res = await _dio.get('/social/posts/$postId/comments');
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(PostComment.fromJson).toList();
  }

  Future<PostComment> addComment(String postId, String content) async {
    final res = await _dio.post('/social/posts/$postId/comments', data: {
      'text': content,
    });
    return PostComment.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  // ─── Challenges ──────────────────────────────────────────────────────────────

  Future<List<GroupChallenge>> listChallenges(String groupId) async {
    final res = await _dio.get('/social/groups/$groupId/challenges');
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(GroupChallenge.fromJson).toList();
  }

  Future<GroupChallenge> createChallenge(
    String groupId, {
    required String title,
    String? description,
    required String type,
    required String difficulty,
    required String unit,
    required bool isCompetitive,
    String? reward,
    required DateTime startDate,
    required DateTime endDate,
    String? exerciseName,
    String createdByName = '',
  }) async {
    final res = await _dio.post('/social/groups/$groupId/challenges', data: {
      'title': title,
      if (description != null) 'description': description,
      'type': type,
      'difficulty': difficulty,
      'targetUnit': unit,
      'isCompetitive': isCompetitive,
      if (reward != null) 'reward': reward,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      if (exerciseName != null && exerciseName.isNotEmpty) 'exerciseName': exerciseName,
      'createdByName': createdByName,
    });
    return GroupChallenge.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  /// Returns computed targetValue for each difficulty given type+dates.
  Future<Map<String, double>> getChallengePresets(
      String type, DateTime startDate, DateTime endDate) async {
    final res = await _dio.get('/social/challenges/presets', queryParameters: {
      'type': type,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
    });
    final list = res.data['data'] as List? ?? [];
    return {
      for (final item in list.whereType<Map<String, dynamic>>())
        item['difficulty'] as String: (item['targetValue'] as num).toDouble(),
    };
  }

  Future<void> joinChallenge(String challengeId) async {
    await _dio.post('/social/challenges/$challengeId/join');
  }

  Future<void> updateChallengeProgress(String challengeId, double progress) async {
    await _dio.patch('/social/challenges/$challengeId/progress', data: {'progress': progress});
  }

  // ─── Follow ──────────────────────────────────────────────────────────────────

  Future<void> followUser(String userId) async {
    await _dio.post('/social/users/$userId/follow');
  }

  Future<void> unfollowUser(String userId) async {
    await _dio.delete('/social/users/$userId/follow');
  }

  // ─── Feed ────────────────────────────────────────────────────────────────────

  Future<List<Post>> getFeed({int page = 1, int limit = 20}) async {
    final res = await _dio.get('/social/feed',
        queryParameters: {'page': page, 'limit': limit});
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(Post.fromJson).toList();
  }

  Future<List<Post>> getDiscoverFeed({int page = 1, int limit = 20}) async {
    final res = await _dio.get('/social/feed/discover',
        queryParameters: {'page': page, 'limit': limit});
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(Post.fromJson).toList();
  }

  Future<Post> createFeedPost({
    required String workoutName,
    required int durationSeconds,
    required double totalVolume,
    required List<Map<String, dynamic>> exercises,
    int? bpm,
    int? kcal,
    List<String> prBadges = const [],
    String? caption,
    List<String> imagesBase64 = const [],
    bool isPublic = false,
  }) async {
    final res = await _dio.post('/social/feed/posts', data: {
      if (caption != null && caption.isNotEmpty) 'content': caption,
      if (imagesBase64.isNotEmpty) 'imagesBase64': imagesBase64,
      'exercises': exercises,
      'records': {
        'workoutName': workoutName,
        'durationSeconds': durationSeconds,
        'totalVolume': totalVolume,
        'prCount': prBadges.length,
        if (bpm != null) 'bpm': bpm,
        if (kcal != null) 'kcal': kcal,
      },
      'isPublic': isPublic,
    });
    return Post.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  // ─── Public Profile ───────────────────────────────────────────────────────────

  Future<PublicUserProfile> getUserPublicProfile(String userId) async {
    final res = await _dio.get('/social/users/$userId/profile');
    return PublicUserProfile.fromJson(res.data['data'] as Map<String, dynamic>);
  }
}
