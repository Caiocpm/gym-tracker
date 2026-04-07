// lib/features/social/providers/social_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/social_service.dart';
import '../domain/social_models.dart';

// ─── Meus grupos ──────────────────────────────────────────────────────────────

class MyGroupsNotifier extends StateNotifier<AsyncValue<List<Group>>> {
  MyGroupsNotifier() : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final groups = await SocialService.instance.listMyGroups();
      state = AsyncValue.data(groups);
    } catch (_) {
      state = const AsyncValue.data([]);
    }
  }

  Future<void> add(Group group) async {
    state.whenData((list) => state = AsyncValue.data([group, ...list]));
  }

  Future<void> remove(String groupId) async {
    state.whenData(
      (list) => state =
          AsyncValue.data(list.where((g) => g.id != groupId).toList()),
    );
  }
}

final myGroupsProvider =
    StateNotifierProvider.autoDispose<MyGroupsNotifier, AsyncValue<List<Group>>>(
  (_) => MyGroupsNotifier(),
);

// ─── Discover ─────────────────────────────────────────────────────────────────

final discoverGroupsProvider =
    FutureProvider.autoDispose<List<Group>>((ref) async {
  try {
    return await SocialService.instance.discoverGroups();
  } catch (_) {
    return [];
  }
});

// ─── Posts de um grupo ────────────────────────────────────────────────────────

class PostsNotifier extends StateNotifier<AsyncValue<List<Post>>> {
  PostsNotifier(this._groupId) : super(const AsyncValue.loading()) {
    load();
  }

  final String _groupId;

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final posts = await SocialService.instance.listPosts(_groupId);
      state = AsyncValue.data(posts);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addPost(String content, {String? imageBase64}) async {
    final post = await SocialService.instance.createPost(_groupId, content, imageBase64: imageBase64);
    state.whenData(
      (list) => state = AsyncValue.data([post, ...list]),
    );
  }

  Future<void> toggleLike(String postId, String currentUserId) async {
    state.whenData((posts) {
      final idx = posts.indexWhere((p) => p.id == postId);
      if (idx == -1) return;
      final post = posts[idx];
      final liked = !post.likedByMe;

      // Optimistic update
      final updated = [...posts];
      updated[idx] = post.copyWith(
        likedByMe: liked,
        likesCount: post.likesCount + (liked ? 1 : -1),
      );
      state = AsyncValue.data(updated);

      // API call
      if (liked) {
        SocialService.instance.likePost(postId).catchError((_) => load());
      } else {
        SocialService.instance.unlikePost(postId).catchError((_) => load());
      }
    });
  }

  Future<void> deletePost(String postId) async {
    await SocialService.instance.deletePost(postId);
    state.whenData(
      (list) => state = AsyncValue.data(
        list.where((p) => p.id != postId).toList(),
      ),
    );
  }
}

final postsProvider = StateNotifierProvider.autoDispose
    .family<PostsNotifier, AsyncValue<List<Post>>, String>(
  (_, groupId) => PostsNotifier(groupId),
);

// ─── Feed ─────────────────────────────────────────────────────────────────────

class FeedNotifier extends StateNotifier<AsyncValue<List<Post>>> {
  FeedNotifier() : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final posts = await SocialService.instance.getFeed();
      state = AsyncValue.data(posts);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addPost(Post post) async {
    state.whenData((list) => state = AsyncValue.data([post, ...list]));
  }

  Future<void> toggleLike(String postId) async {
    state.whenData((posts) {
      final idx = posts.indexWhere((p) => p.id == postId);
      if (idx == -1) return;
      final post = posts[idx];
      final liked = !post.likedByMe;
      final updated = [...posts];
      updated[idx] = post.copyWith(
        likedByMe: liked,
        likesCount: post.likesCount + (liked ? 1 : -1),
      );
      state = AsyncValue.data(updated);
      if (liked) {
        SocialService.instance.likePost(postId).catchError((_) => load());
      } else {
        SocialService.instance.unlikePost(postId).catchError((_) => load());
      }
    });
  }

  Future<void> deletePost(String postId) async {
    await SocialService.instance.deletePost(postId);
    state.whenData(
      (list) => state = AsyncValue.data(list.where((p) => p.id != postId).toList()),
    );
  }
}

final feedProvider =
    StateNotifierProvider.autoDispose<FeedNotifier, AsyncValue<List<Post>>>(
  (_) => FeedNotifier(),
);

// ─── Discover Feed ────────────────────────────────────────────────────────────

class DiscoverFeedNotifier extends StateNotifier<AsyncValue<List<Post>>> {
  DiscoverFeedNotifier() : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final posts = await SocialService.instance.getDiscoverFeed();
      state = AsyncValue.data(posts);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> toggleLike(String postId) async {
    state.whenData((posts) {
      final idx = posts.indexWhere((p) => p.id == postId);
      if (idx == -1) return;
      final post = posts[idx];
      final liked = !post.likedByMe;
      final updated = [...posts];
      updated[idx] = post.copyWith(
        likedByMe: liked,
        likesCount: post.likesCount + (liked ? 1 : -1),
      );
      state = AsyncValue.data(updated);
      if (liked) {
        SocialService.instance.likePost(postId).catchError((_) => load());
      } else {
        SocialService.instance.unlikePost(postId).catchError((_) => load());
      }
    });
  }
}

final discoverFeedProvider =
    StateNotifierProvider.autoDispose<DiscoverFeedNotifier, AsyncValue<List<Post>>>(
  (_) => DiscoverFeedNotifier(),
);

// ─── Challenges ───────────────────────────────────────────────────────────────

final challengesProvider = FutureProvider.autoDispose
    .family<List<GroupChallenge>, String>((ref, groupId) async {
  return SocialService.instance.listChallenges(groupId);
});

// ─── Membros ──────────────────────────────────────────────────────────────────

final membersProvider = FutureProvider.autoDispose
    .family<List<GroupMember>, String>((ref, groupId) async {
  return SocialService.instance.getMembers(groupId);
});
