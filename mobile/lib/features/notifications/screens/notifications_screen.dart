// lib/features/notifications/screens/notifications_screen.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/network/dio_client.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../features/equipe/providers/equipe_provider.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';

// ─── Model ────────────────────────────────────────────────────────────────────

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final String? fromUserName;
  final String? actionUrl;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    this.fromUserName,
    this.actionUrl,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as String,
        type: json['type'] as String? ?? 'info',
        title: json['title'] as String? ?? '',
        message: json['message'] as String? ?? '',
        isRead: json['isRead'] as bool? ?? false,
        fromUserName: json['fromUserName'] as String?,
        actionUrl: json['actionUrl'] as String?,
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
            DateTime.now(),
      );

  AppNotification copyWith({bool? isRead}) => AppNotification(
        id: id,
        type: type,
        title: title,
        message: message,
        isRead: isRead ?? this.isRead,
        fromUserName: fromUserName,
        actionUrl: actionUrl,
        createdAt: createdAt,
      );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

class NotificationsNotifier
    extends StateNotifier<AsyncValue<List<AppNotification>>> {
  NotificationsNotifier(this._ref) : super(const AsyncValue.loading()) {
    _load();
  }

  final Ref _ref;
  final _dio = DioClient.instance.dio;
  StreamSubscription? _sseSub;
  String _sseBuffer = '';

  Future<void> _load() async {
    try {
      final res = await _dio.get('/notifications');
      final data = (res.data['data'] as List?) ?? [];
      state = AsyncValue.data(data
          .whereType<Map<String, dynamic>>()
          .map(AppNotification.fromJson)
          .toList());
      _connectSse();
    } catch (_) {
      state = const AsyncValue.data([]);
    }
  }

  Future<void> _connectSse() async {
    _sseSub?.cancel();
    _sseBuffer = '';
    try {
      final response = await _dio.get(
        '/notifications/stream',
        options: Options(
          responseType: ResponseType.stream,
          receiveTimeout: Duration.zero,
        ),
      );
      final stream = (response.data as ResponseBody).stream;
      _sseSub = stream.listen((bytes) {
        _sseBuffer += utf8.decode(bytes);
        // SSE events are separated by double newline
        final events = _sseBuffer.split('\n\n');
        _sseBuffer = events.removeLast(); // keep incomplete trailing event
        for (final block in events) {
          if (block.trim().isEmpty) continue;
          String? eventType;
          String? data;
          for (final line in block.split('\n')) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              data = line.substring(5).trim();
            }
          }
          if (data != null) {
            _handleEvent(eventType ?? 'notification', data);
          }
        }
      });
    } catch (_) {
      // SSE not available — polling fallback every 60s
      Future.delayed(const Duration(seconds: 60), () { if (this.mounted) _load(); });
    }
  }

  void _handleEvent(String eventType, String data) {
    if (eventType != 'notification') return;
    try {
      final json = jsonDecode(data) as Map<String, dynamic>;
      final notification = AppNotification.fromJson(json);
      state.whenData((list) {
        state = AsyncValue.data([notification, ...list]);
      });
      // When a professional accepts → refresh equipe list + trigger navigation
      if (notification.type == 'link_accepted') {
        _ref.read(myLinksProvider.notifier).refresh();
        _ref.read(linkAcceptedSignalProvider.notifier).update((v) => v + 1);
      }
    } catch (_) {}
  }

  Future<void> markRead(String notificationId) async {
    state.whenData((list) {
      state = AsyncValue.data(list
          .map((n) => n.id == notificationId ? n.copyWith(isRead: true) : n)
          .toList());
    });
    try {
      await _dio.patch('/notifications/$notificationId/read');
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    state.whenData((list) {
      state = AsyncValue.data(list.map((n) => n.copyWith(isRead: true)).toList());
    });
    try {
      await _dio.post('/notifications/read-all');
    } catch (_) {}
  }

  Future<void> reload() => _load();

  @override
  void dispose() {
    _sseSub?.cancel();
    super.dispose();
  }
}

final notificationsProvider = StateNotifierProvider.autoDispose<
    NotificationsNotifier, AsyncValue<List<AppNotification>>>(
  (ref) => NotificationsNotifier(ref),
);

// ─── Screen ───────────────────────────────────────────────────────────────────

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);

    return GestureDetector(
      onHorizontalDragEnd: (details) {
        if ((details.primaryVelocity ?? 0) < -300) {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/');
          }
        }
      },
      child: Scaffold(
      appBar: AppBar(
        title: const Text('Notificações'),
        actions: [
          state.maybeWhen(
            data: (list) => list.any((n) => !n.isRead)
                ? TextButton(
                    onPressed: () =>
                        ref.read(notificationsProvider.notifier).markAllRead(),
                    child: const Text('Limpar tudo'),
                  )
                : const SizedBox.shrink(),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Erro ao carregar notificações'),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () =>
                    ref.read(notificationsProvider.notifier).reload(),
                child: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
        data: (notifications) => notifications.isEmpty
            ? _EmptyState()
            : RefreshIndicator(
                onRefresh: () =>
                    ref.read(notificationsProvider.notifier).reload(),
                child: ListView.separated(
                  itemCount: notifications.length,
                  separatorBuilder: (_, __) =>
                      const Divider(height: 1, indent: 60),
                  itemBuilder: (_, i) => _NotificationTile(
                    notification: notifications[i],
                    onTap: () {
                      ref
                          .read(notificationsProvider.notifier)
                          .markRead(notifications[i].id);
                      final url = notifications[i].actionUrl;
                      if (url != null && url.isNotEmpty) {
                        context.push(url);
                      }
                    },
                  ),
                ),
              ),
      ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: Icon(Icons.notifications_none, size: 44),
            ),
          ),
          const SizedBox(height: 20),
          Text('Nenhuma notificação',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('Você será notificado sobre atividades dos seus grupos',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.onTap,
  });

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        color: notification.isRead
            ? Colors.transparent
            : AppTheme.primary.withValues(alpha: 0.06),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _NotifIcon(type: notification.type),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontWeight: notification.isRead
                                ? FontWeight.normal
                                : FontWeight.bold,
                          ),
                        ),
                      ),
                      if (!notification.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.primary,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    notification.message,
                    style: Theme.of(context).textTheme.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTime(notification.createdAt),
                    style: Theme.of(context)
                        .textTheme
                        .labelSmall
                        ?.copyWith(color: Colors.white38),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'agora';
    if (diff.inHours < 1) return 'há ${diff.inMinutes}min';
    if (diff.inDays < 1) return 'há ${diff.inHours}h';
    if (diff.inDays < 7) return 'há ${diff.inDays}d';
    return DateFormat('d MMM', 'pt_BR').format(dt);
  }
}

class _NotifIcon extends StatelessWidget {
  const _NotifIcon({required this.type});
  final String type;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (type) {
      'like' => (Icons.favorite, Colors.red),
      'comment' => (Icons.comment, Colors.blue),
      'group_join' || 'group_invite' => (Icons.group, Colors.green),
      'challenge' || 'badge' => (Icons.emoji_events, Colors.amber),
      'professional' || 'collaboration_invite' || 'collaboration_accepted' || 'collaboration_rejected'
          => (Icons.person, AppTheme.primary),
      'new_message' => (Icons.chat_bubble_outline, const Color(0xFF3F5EFB)),
      'new_goal' => (Icons.flag_outlined, const Color(0xFF8B5CF6)),
      'new_evaluation' => (Icons.assignment_outlined, const Color(0xFFFF7043)),
      _ => (Icons.notifications, Colors.grey),
    };

    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.15),
      ),
      child: Icon(icon, color: color, size: 20),
    );
  }
}
