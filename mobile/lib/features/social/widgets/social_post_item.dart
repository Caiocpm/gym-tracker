// lib/features/social/widgets/social_post_item.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../domain/social_models.dart';
import '../data/social_service.dart';
import 'user_profile_sheet.dart';
import '../../../core/config/env.dart';

// ─── Post palette — resolves against current brightness ──────────────────────

const List<Color> kAvatarGrad = [Color(0xFF8B5CF6), Color(0xFFEC4899)];

class PostPalette {
  PostPalette(BuildContext context) {
    final cs   = Theme.of(context).colorScheme;
    final dark = Theme.of(context).brightness == Brightness.dark;
    bg        = dark ? const Color(0xFF1A1A1A) : (Theme.of(context).cardTheme.color ?? cs.surface);
    primary   = dark ? Colors.white : cs.onSurface;
    secondary = dark ? const Color(0xFF888888) : cs.onSurface.withValues(alpha: 0.5);
    body      = dark ? const Color(0xFFCCCCCC) : cs.onSurface.withValues(alpha: 0.8);
    accent    = cs.primary;
  }
  late final Color bg;
  late final Color primary;
  late final Color secondary;
  late final Color body;
  late final Color accent;
}

// ─── Social Post Item ─────────────────────────────────────────────────────────

class SocialPostItem extends ConsumerWidget {
  const SocialPostItem({
    super.key,
    required this.post,
    required this.currentUserId,
    required this.onLike,
    this.onDelete,
  });

  final Post post;
  final String currentUserId;
  final VoidCallback onLike;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p  = PostPalette(context);
    final vh = MediaQuery.sizeOf(context).height;

    return ColoredBox(
      color: p.bg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildHeader(context, p),
          _buildContent(context, p),
          if (post.imagesBase64.isNotEmpty || post.imageBase64 != null || post.exercises.isNotEmpty)
            SizedBox(
              height: vh * 0.332,
              child: SocialPostMediaCarousel(post: post, palette: p),
            ),
          SizedBox(height: vh * 0.052, child: _buildActions(context, p)),
          if (post.likesCount > 0)
            SizedBox(height: vh * 0.045, child: _buildLikedBy(p)),
        ],
      ),
    );
  }

  void _openProfile(BuildContext context) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => UserProfileSheet(userId: post.userId),
    );
  }

  Widget _buildHeader(BuildContext context, PostPalette p) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => _openProfile(context),
            child: SizedBox(
              width: 44,
              height: 44,
              child: ClipOval(
                child: post.userPhotoURL != null
                    ? Image.network(
                        post.userPhotoURL!.startsWith('/')
                            ? '${Env.serverBaseUrl}${post.userPhotoURL!}'
                            : post.userPhotoURL!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _avatarFallback())
                    : _avatarFallback(),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: GestureDetector(
              onTap: () => _openProfile(context),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.userDisplayName ?? 'Usuário',
                    style: TextStyle(
                      color: p.primary,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    _timeAgo(post.createdAt),
                    style: TextStyle(color: p.secondary, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          if (post.userId == currentUserId && onDelete != null)
            IconButton(
              icon: Icon(Icons.more_horiz, color: p.primary),
              onPressed: () => _showOptions(context, p),
            )
          else if (post.userId != currentUserId)
            TextButton(
              onPressed: () => _openProfile(context),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                '+ Seguir',
                style: TextStyle(
                  color: p.accent,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _avatarFallback() {
    final letter = post.userDisplayName?.isNotEmpty == true
        ? post.userDisplayName![0].toUpperCase()
        : '?';
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: kAvatarGrad,
        ),
      ),
      child: Center(
        child: Text(
          letter,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, PostPalette p) {
    final meta = post.workoutMeta;
    final hasCaption = post.content?.trim().isNotEmpty == true;

    if (meta == null && !hasCaption) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (meta != null) ...[
            Text(
              meta.workoutName,
              style: TextStyle(
                color: p.primary,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (hasCaption) ...[
              const SizedBox(height: 4),
              Text(
                post.content!,
                style: TextStyle(color: p.body, fontSize: 14, height: 1.4),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 12),
            _StatsRow(meta: meta, palette: p),
          ] else if (hasCaption) ...[
            Text(
              post.content!,
              style: TextStyle(color: p.body, fontSize: 14, height: 1.4),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context, PostPalette p) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          _PostActionBtn(
            icon: post.likedByMe ? Icons.thumb_up : Icons.thumb_up_alt_outlined,
            label: '${post.likesCount}',
            color: post.likedByMe ? p.accent : p.body,
            onTap: onLike,
          ),
          const SizedBox(width: 16),
          _PostActionBtn(
            icon: Icons.chat_bubble_outline,
            label: '${post.commentsCount}',
            color: p.body,
            onTap: () => _showCommentsSheet(context),
          ),
          const Spacer(),
          _PostActionBtn(
            icon: Icons.ios_share_outlined,
            label: '',
            color: p.body,
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildLikedBy(PostPalette p) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
      child: Align(
        alignment: Alignment.centerLeft,
        child: _LikedByRow(count: post.likesCount, bgColor: p.bg),
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'agora';
    if (diff.inMinutes < 60) return '${diff.inMinutes}min atrás';
    if (diff.inHours < 24) return '${diff.inHours}h atrás';
    if (diff.inDays < 7) return '${diff.inDays}d atrás';
    return DateFormat('dd/MM/yyyy').format(dt);
  }

  void _showOptions(BuildContext context, PostPalette p) {
    showModalBottomSheet(
      context: context,
      backgroundColor: p.bg,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.delete_outline, color: Colors.redAccent),
              title: const Text('Excluir post',
                  style: TextStyle(color: Colors.redAccent)),
              onTap: () {
                Navigator.pop(sheetContext);
                _confirmDelete(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Excluir post'),
        content: const Text('Deseja excluir este post?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancelar')),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              onDelete?.call();
            },
            child: const Text('Excluir',
                style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }

  void _showCommentsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => SocialCommentsSheet(postId: post.id),
    );
  }
}

// ─── Post Media Carousel ──────────────────────────────────────────────────────

class SocialPostMediaCarousel extends StatefulWidget {
  const SocialPostMediaCarousel({super.key, required this.post, required this.palette});
  final Post post;
  final PostPalette palette;

  @override
  State<SocialPostMediaCarousel> createState() => _SocialPostMediaCarouselState();
}

class _SocialPostMediaCarouselState extends State<SocialPostMediaCarousel> {
  int _page = 0;
  late final PageController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = PageController();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final p    = widget.palette;

    // Prefer imagesBase64 list (new); fall back to legacy imageBase64 field
    final imagePages = post.imagesBase64.isNotEmpty
        ? post.imagesBase64.map((img) => _ImagePage(imageBase64: img, palette: p)).toList()
        : (post.imageBase64 != null
            ? [_ImagePage(imageBase64: post.imageBase64!, palette: p)]
            : <Widget>[]);

    final pages = <Widget>[
      ...imagePages,
      if (post.exercises.isNotEmpty) _ExerciseListPage(exercises: post.exercises, palette: p),
    ];

    if (pages.length == 1) return pages.first;

    return Stack(
      children: [
        PageView(
          controller: _ctrl,
          onPageChanged: (i) => setState(() => _page = i),
          children: pages,
        ),
        Positioned(
          bottom: 10,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(pages.length, (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width:  _page == i ? 18 : 7,
              height: 7,
              decoration: BoxDecoration(
                color: _page == i
                    ? Colors.white
                    : Colors.white.withOpacity(0.45),
                borderRadius: BorderRadius.circular(4),
              ),
            )),
          ),
        ),
      ],
    );
  }
}

class _ImagePage extends StatelessWidget {
  const _ImagePage({required this.imageBase64, required this.palette});
  final String imageBase64;
  final PostPalette palette;

  @override
  Widget build(BuildContext context) {
    try {
      final bytes = base64Decode(imageBase64);
      return Image.memory(
        bytes,
        fit: BoxFit.cover,
        width: double.infinity,
        gaplessPlayback: true,
        errorBuilder: (_, __, ___) =>
            ColoredBox(color: palette.secondary.withValues(alpha: 0.1)),
      );
    } catch (_) {
      return const SizedBox.shrink();
    }
  }
}

IconData _cardioSectionIcon(List<PostExercise> exercises) {
  if (exercises.every((e) => !e.isCardio)) return Icons.fitness_center;
  if (exercises.any((e) => !e.isCardio)) return Icons.sports; // misto
  // Todos são cardio — ícone do subtipo mais frequente
  final subtype = exercises.first.cardioSubtype;
  return switch (subtype) {
    'corrida'               => Icons.directions_run,
    'caminhada'             => Icons.directions_walk,
    'ciclismo'              => Icons.pedal_bike,
    'bicicleta_ergometrica' => Icons.pedal_bike,
    'natacao'               => Icons.pool,
    'remo'                  => Icons.rowing,
    'escada'                => Icons.stairs,
    'funcional'             => Icons.flash_on,
    _                       => Icons.favorite,
  };
}

class _ExerciseListPage extends StatelessWidget {
  const _ExerciseListPage({required this.exercises, required this.palette});
  final List<PostExercise> exercises;
  final PostPalette palette;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: palette.bg,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                _cardioSectionIcon(exercises),
                size: 15,
                color: palette.secondary,
              ),
              const SizedBox(width: 6),
              Text(
                'Exercícios realizados',
                style: TextStyle(
                  color: palette.secondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.4,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: exercises.length,
              separatorBuilder: (_, __) => Divider(
                height: 1,
                color: palette.secondary.withOpacity(0.15),
              ),
              itemBuilder: (_, i) {
                final ex = exercises[i];
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 7),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Text(
                          ex.name,
                          style: TextStyle(
                            color: palette.primary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (ex.isCardio) ...[
                        // Cardio: linha compacta de métricas (duration · distância · pace/speed)
                        if (ex.metricsLine.isNotEmpty)
                          Text(
                            ex.metricsLine,
                            style: TextStyle(
                              color: palette.secondary,
                              fontSize: 12,
                            ),
                          ),
                      ] else ...[
                        // Força: séries + volume (se > 0)
                        Text(
                          '${ex.setsCount} ${ex.setsCount == 1 ? 'série' : 'séries'}',
                          style: TextStyle(
                            color: palette.secondary,
                            fontSize: 13,
                          ),
                        ),
                        if (ex.totalVolume > 0) ...[
                          const SizedBox(width: 10),
                          Text(
                            '${ex.totalVolume % 1 == 0 ? ex.totalVolume.toInt() : ex.totalVolume.toStringAsFixed(1)} kg',
                            style: TextStyle(
                              color: palette.accent,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                        if (ex.avgRpe != null) ...[
                          const SizedBox(width: 10),
                          Text(
                            'RPE ${ex.avgRpe! % 1 == 0 ? ex.avgRpe!.toInt() : ex.avgRpe!.toStringAsFixed(1)}',
                            style: TextStyle(
                              color: palette.secondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.meta, required this.palette});
  final WorkoutMeta meta;
  final PostPalette palette;

  @override
  Widget build(BuildContext context) {
    final items = <Widget>[
      _StatItem(label: 'Tempo', value: _fmtDuration(meta.durationSeconds), palette: palette),
      if (meta.totalVolume > 0)
        _StatItem(label: 'Volume', value: _fmtVolume(meta.totalVolume), palette: palette),
      if (meta.bpm != null)
        _StatItem(label: 'BPM', value: '${meta.bpm}', palette: palette),
      if (meta.kcal != null)
        _StatItem(label: 'Kcal', value: '${meta.kcal}', palette: palette),
      if (meta.prCount > 0)
        _StatItem(label: 'Recordes', value: '🏅 ${meta.prCount}', palette: palette),
    ];
    return Row(
      children: [
        for (int i = 0; i < items.length; i++) ...[
          if (i > 0) const SizedBox(width: 28),
          items[i],
        ],
      ],
    );
  }

  String _fmtDuration(int secs) {
    final h = secs ~/ 3600;
    final m = (secs % 3600) ~/ 60;
    return h > 0 ? '${h}h ${m}min' : '${m}min';
  }

  String _fmtVolume(double vol) {
    final n = vol.round();
    if (n >= 1000) {
      final t = n ~/ 1000;
      final r = (n % 1000).toString().padLeft(3, '0');
      return '$t.$r kg';
    }
    return '$n kg';
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({required this.label, required this.value, required this.palette});
  final String label;
  final String value;
  final PostPalette palette;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: palette.secondary, fontSize: 11)),
        const SizedBox(height: 2),
        Text(value,
            style: TextStyle(
                color: palette.primary,
                fontSize: 16,
                fontWeight: FontWeight.w600)),
      ],
    );
  }
}

// ─── Post Action Button ───────────────────────────────────────────────────────

class _PostActionBtn extends StatelessWidget {
  const _PostActionBtn({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.color,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: color),
            if (label.isNotEmpty) ...[
              const SizedBox(width: 6),
              Text(label,
                  style: TextStyle(
                      color: color,
                      fontSize: 14,
                      fontWeight: FontWeight.w500)),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Liked By Row ─────────────────────────────────────────────────────────────

class _LikedByRow extends StatelessWidget {
  const _LikedByRow({required this.count, required this.bgColor});
  final int count;
  final Color bgColor;

  static const _grads = [
    [Color(0xFFf97316), Color(0xFFec4899)],
    [Color(0xFF06b6d4), Color(0xFF8b5cf6)],
    [Color(0xFF22c55e), Color(0xFF3b82f6)],
  ];

  @override
  Widget build(BuildContext context) {
    final n = count.clamp(0, 3);
    return Row(
      children: [
        SizedBox(
          width: 22 + (n - 1) * 16.0,
          height: 22,
          child: Stack(
            children: List.generate(
              n,
              (i) => Positioned(
                left: i * 16.0,
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: bgColor, width: 1.5),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: _grads[i],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          count == 1 ? 'Gostado por 1 pessoa' : 'Gostado por $count pessoas',
          style: const TextStyle(color: Color(0xFF999999), fontSize: 12.5),
        ),
      ],
    );
  }
}

// ─── Comments Sheet ───────────────────────────────────────────────────────────

class SocialCommentsSheet extends StatefulWidget {
  const SocialCommentsSheet({super.key, required this.postId});
  final String postId;

  @override
  State<SocialCommentsSheet> createState() => _SocialCommentsSheetState();
}

class _SocialCommentsSheetState extends State<SocialCommentsSheet> {
  List<PostComment> _comments = [];
  bool _loading = true;
  final _ctrl = TextEditingController();
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final comments = await SocialService.instance.getComments(widget.postId);
      if (mounted) setState(() => _comments = comments);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      builder: (_, scrollCtrl) => Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Comentários',
                style: Theme.of(context).textTheme.titleLarge),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: scrollCtrl,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _comments.length,
                    itemBuilder: (_, i) => _CommentTile(_comments[i]),
                  ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
                16, 8, 16, MediaQuery.of(context).viewInsets.bottom + 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    decoration: const InputDecoration(
                      hintText: 'Adicionar comentário...',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _sending ? null : _send,
                  icon: _sending
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _sending = true);
    try {
      final comment = await SocialService.instance.addComment(widget.postId, text);
      _ctrl.clear();
      setState(() => _comments = [..._comments, comment]);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro: $e')));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}

class _CommentTile extends StatelessWidget {
  const _CommentTile(this.comment);
  final PostComment comment;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
            child: Text(
              (comment.userDisplayName?.isNotEmpty ?? false)
                  ? comment.userDisplayName![0].toUpperCase()
                  : '?',
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).colorScheme.onPrimaryContainer,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  comment.userDisplayName ?? 'Usuário',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 2),
                Text(comment.content),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
