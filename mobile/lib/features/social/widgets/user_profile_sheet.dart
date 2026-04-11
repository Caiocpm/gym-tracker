// lib/features/social/widgets/user_profile_sheet.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../data/social_service.dart';
import '../domain/social_models.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../core/config/env.dart';
import '../../profile/screens/profile_screen.dart' show ProfileStatCard, StrongestLiftCard;
import 'package:intl/intl.dart';

class UserProfileSheet extends StatefulWidget {
  const UserProfileSheet({super.key, required this.userId});
  final String userId;

  @override
  State<UserProfileSheet> createState() => _UserProfileSheetState();
}

class _UserProfileSheetState extends State<UserProfileSheet> {
  late Future<PublicUserProfile> _future;

  @override
  void initState() {
    super.initState();
    _future = SocialService.instance.getUserPublicProfile(widget.userId);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: FutureBuilder<PublicUserProfile>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const SizedBox(
              height: 200,
              child: Center(child: CircularProgressIndicator()),
            );
          }
          if (snap.hasError || !snap.hasData) {
            return const SizedBox(
              height: 200,
              child: Center(child: Text('Não foi possível carregar o perfil.')),
            );
          }
          return _UserProfileContent(profile: snap.data!);
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _UserProfileContent extends ConsumerStatefulWidget {
  const _UserProfileContent({required this.profile});
  final PublicUserProfile profile;

  @override
  ConsumerState<_UserProfileContent> createState() => _UserProfileContentState();
}

class _UserProfileContentState extends ConsumerState<_UserProfileContent> {
  late bool _isFollowing;
  bool _followLoading = false;

  @override
  void initState() {
    super.initState();
    _isFollowing = widget.profile.isFollowing;
  }

  void _showPhotoViewer(BuildContext context, List<PublicPhoto> photos, int initial) {
    final cs = Theme.of(context).colorScheme;
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            PageView.builder(
              controller: PageController(initialPage: initial),
              itemCount: photos.length,
              itemBuilder: (_, i) {
                final url = '${Env.serverBaseUrl}${photos[i].url}';
                return InteractiveViewer(
                  child: Center(
                    child: CachedNetworkImage(
                      imageUrl: url,
                      fit: BoxFit.contain,
                      placeholder: (_, __) =>
                          const CircularProgressIndicator(color: Colors.white),
                      errorWidget: (_, __, ___) =>
                          Icon(Icons.broken_image_outlined, color: cs.onSurfaceVariant),
                    ),
                  ),
                );
              },
            ),
            Positioned(
              top: 12, right: 12,
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.close, color: Colors.white, size: 20),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleFollow() async {
    if (_followLoading) return;
    setState(() => _followLoading = true);
    try {
      if (_isFollowing) {
        await SocialService.instance.unfollowUser(widget.profile.id);
        setState(() => _isFollowing = false);
      } else {
        await SocialService.instance.followUser(widget.profile.id);
        setState(() => _isFollowing = true);
      }
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _followLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs    = theme.colorScheme;
    final profile = widget.profile;
    final name  = profile.displayName ?? 'Usuário';

    final coverUrl = profile.photos.isNotEmpty
        ? '${Env.serverBaseUrl}${profile.photos.first.url}'
        : null;

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (_, controller) => ListView(
        controller: controller,
        padding: EdgeInsets.zero,
        children: [
          // ── Cover header ──────────────────────────────────────────────────
          Stack(
            clipBehavior: Clip.none,
            children: [
              // Cover photo / gradient fallback
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: SizedBox(
                  height: 160,
                  width: double.infinity,
                  child: coverUrl != null
                      ? CachedNetworkImage(
                          imageUrl: coverUrl,
                          fit: BoxFit.cover,
                          color: Colors.black.withOpacity(0.35),
                          colorBlendMode: BlendMode.darken,
                          placeholder: (_, __) => Container(
                              color: AppTheme.primary.withOpacity(0.6)),
                          errorWidget: (_, __, ___) =>
                              Container(color: AppTheme.primary.withOpacity(0.6)),
                        )
                      : Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.primary,
                                AppTheme.primary.withOpacity(0.7),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                        ),
                ),
              ),
              // Drag handle
              Positioned(
                top: 10, left: 0, right: 0,
                child: Center(
                  child: Container(
                    width: 40, height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
              // Avatar — sobreposto na borda inferior do cover
              Positioned(
                bottom: -44,
                left: 0, right: 0,
                child: Center(
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: cs.surface, width: 4),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.18),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: GestureDetector(
                      onTap: profile.photoURL != null
                          ? () {
                              final url = profile.photoURL!.startsWith('/')
                                  ? '${Env.serverBaseUrl}${profile.photoURL!}'
                                  : profile.photoURL!;
                              _showPhotoViewer(
                                context,
                                [PublicPhoto(id: 'avatar', url: profile.photoURL!, caption: null)],
                                0,
                              );
                            }
                          : null,
                      child: CircleAvatar(
                        radius: 44,
                        backgroundColor: AppTheme.primary.withOpacity(0.15),
                        backgroundImage: profile.photoURL != null
                            ? NetworkImage(
                                profile.photoURL!.startsWith('/')
                                    ? '${Env.serverBaseUrl}${profile.photoURL!}'
                                    : profile.photoURL!,
                              )
                            : null,
                        child: profile.photoURL == null
                            ? Text(
                                name.isNotEmpty ? name[0].toUpperCase() : '?',
                                style: TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.primary,
                                ),
                              )
                            : null,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),

          // ── Info abaixo do header ─────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 56, 16, 0),
            child: Column(
              children: [
                Text(name,
                    style: theme.textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w800)),
                if (profile.memberSince != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Membro desde ${_fmtDate(profile.memberSince!)}',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: cs.onSurface.withOpacity(0.5)),
                  ),
                ],
                // Bio
                if (profile.bio?.trim().isNotEmpty == true) ...[
                  const SizedBox(height: 10),
                  Text(
                    profile.bio!,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                        color: cs.onSurface.withOpacity(0.75), height: 1.45),
                  ),
                ],
                const SizedBox(height: 16),
                // Seguidores / Seguindo / Botão
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _FollowStat(count: profile.followersCount, label: 'Seguidores'),
                    Container(
                      width: 1, height: 28,
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      color: cs.onSurface.withOpacity(0.12),
                    ),
                    _FollowStat(count: profile.followingCount, label: 'Seguindo'),
                    const SizedBox(width: 20),
                    _followLoading
                        ? const SizedBox(width: 24, height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : FilledButton.icon(
                            onPressed: _toggleFollow,
                            icon: Icon(_isFollowing
                                ? Icons.person_remove_outlined
                                : Icons.person_add_alt_1_outlined,
                                size: 16),
                            label: Text(_isFollowing ? 'Seguindo' : 'Seguir'),
                            style: FilledButton.styleFrom(
                              backgroundColor: _isFollowing
                                  ? cs.surfaceContainerHighest
                                  : AppTheme.primary,
                              foregroundColor: _isFollowing
                                  ? cs.onSurface
                                  : Colors.white,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 8),
                              visualDensity: VisualDensity.compact,
                            ),
                          ),
                  ],
                ),
              ],
            ),
          ),

          // ── Galeria de Fotos ──────────────────────────────────────────────
          if (profile.photos.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Fotos', style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 6,
                      mainAxisSpacing: 6,
                    ),
                    itemCount: profile.photos.length,
                    itemBuilder: (_, i) {
                      final photo = profile.photos[i];
                      return GestureDetector(
                        onTap: () =>
                            _showPhotoViewer(context, profile.photos, i),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: CachedNetworkImage(
                            imageUrl: '${Env.serverBaseUrl}${photo.url}',
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(
                                color: cs.surfaceContainerHighest),
                            errorWidget: (_, __, ___) => Container(
                              color: cs.surfaceContainerHighest,
                              child: Icon(Icons.broken_image_outlined,
                                  color: cs.onSurfaceVariant, size: 20),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: const Divider(),
          ),
          const SizedBox(height: 8),

          // Private profile
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(children: [
          if (profile.isPrivate) ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Icon(Icons.lock_outline_rounded, size: 36,
                      color: cs.onSurface.withOpacity(0.4)),
                  const SizedBox(height: 10),
                  Text('Perfil privado',
                      style: theme.textTheme.titleSmall
                          ?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text('Este usuário optou por manter suas estatísticas privadas.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: cs.onSurface.withOpacity(0.5))),
                ],
              ),
            ),
          ] else ...[
            // 🔥 Sequências
            _PSectionTitle('🔥 Sequências'),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: ProfileStatCard(
                icon: Icons.local_fire_department,
                iconColor: Colors.orange,
                label: 'Sequência atual',
                value: '${profile.currentStreak ?? 0} dias',
              )),
              const SizedBox(width: 8),
              Expanded(child: ProfileStatCard(
                icon: Icons.emoji_events,
                iconColor: Colors.amber,
                label: 'Maior sequência',
                value: '${profile.longestStreak ?? 0} dias',
              )),
            ]),
            const SizedBox(height: 16),

            // 💪 Volume e Recordes
            _PSectionTitle('💪 Volume e Recordes'),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: ProfileStatCard(
                icon: Icons.fitness_center,
                iconColor: AppTheme.primary,
                label: 'Volume total',
                value: profile.totalVolumeFormatted,
              )),
              const SizedBox(width: 8),
              Expanded(child: ProfileStatCard(
                icon: Icons.star,
                iconColor: Colors.amber,
                label: 'Recordes pessoais',
                value: '${profile.totalPersonalRecords ?? 0}',
              )),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: ProfileStatCard(
                icon: Icons.timer_outlined,
                iconColor: const Color(0xFF14B8A6),
                label: 'Tempo total',
                value: profile.totalTimeFormatted,
              )),
              const SizedBox(width: 8),
              Expanded(child: ProfileStatCard(
                icon: Icons.repeat,
                iconColor: AppTheme.primaryDark,
                label: 'Total de séries',
                value: '${profile.totalSets ?? 0}',
              )),
            ]),

            // 🏋️ Melhor levantamento
            if (profile.strongestLift != null) ...[
              const SizedBox(height: 16),
              _PSectionTitle('🏋️ Melhor levantamento'),
              const SizedBox(height: 8),
              StrongestLiftCard(
                exerciseName: profile.strongestLift!.exerciseName,
                weight: profile.strongestLift!.weight,
              ),
            ],

            // 👥 Social
            const SizedBox(height: 16),
            _PSectionTitle('👥 Social'),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: ProfileStatCard(
                icon: Icons.group,
                iconColor: Colors.green,
                label: 'Grupos',
                value: '${profile.totalGroups ?? 0}',
              )),
              const SizedBox(width: 8),
              Expanded(child: ProfileStatCard(
                icon: Icons.emoji_events_outlined,
                iconColor: Colors.red,
                label: 'Desafios',
                value: '${profile.totalChallengesCompleted ?? 0}',
              )),
              const SizedBox(width: 8),
              Expanded(child: ProfileStatCard(
                icon: Icons.military_tech,
                iconColor: Colors.amber,
                label: 'Badges',
                value: '${profile.totalBadges ?? 0}',
              )),
            ]),

            // 🏅 Conquistas
            if (profile.badges.isNotEmpty) ...[
              const SizedBox(height: 20),
              _PSectionTitle('🏅 Conquistas'),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: profile.badges.map((b) => _BadgeChip(badge: b)).toList(),
              ),
            ],

            // 🏢 Grupos
            if (profile.groups.isNotEmpty) ...[
              const SizedBox(height: 20),
              _PSectionTitle('🏢 Grupos'),
              const SizedBox(height: 10),
              ...profile.groups.map((g) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Icon(Icons.group_outlined, size: 16,
                        color: cs.onSurface.withOpacity(0.5)),
                    const SizedBox(width: 8),
                    Text(g.name, style: theme.textTheme.bodyMedium),
                  ],
                ),
              )),
            ],
          ],
        ]),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _fmtDate(String iso) {
    try {
      return DateFormat('MMM yyyy', 'pt_BR').format(DateTime.parse(iso));
    } catch (_) {
      return '';
    }
  }
}

// ─── Follow Stat ─────────────────────────────────────────────────────────────

class _FollowStat extends StatelessWidget {
  const _FollowStat({required this.count, required this.label});
  final int count;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          _fmt(count),
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.55),
              ),
        ),
      ],
    );
  }

  static String _fmt(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}k';
    return '$n';
  }
}

// ─── Section title ────────────────────────────────────────────────────────────

class _PSectionTitle extends StatelessWidget {
  const _PSectionTitle(this.title);
  final String title;
  @override
  Widget build(BuildContext context) => Text(
        title,
        style: Theme.of(context)
            .textTheme
            .titleSmall
            ?.copyWith(fontWeight: FontWeight.w700),
      );
}

// ─── Badge chip ───────────────────────────────────────────────────────────────

class _BadgeChip extends StatelessWidget {
  const _BadgeChip({required this.badge});
  final PublicBadge badge;

  Color get _color => switch (badge.rarity) {
        'diamond'   => const Color(0xFF00E5FF),
        'gold' || 'legendary' => const Color(0xFFFFD700),
        'silver' || 'epic'    => const Color(0xFF9B59B6),
        'bronze' || 'rare'    => const Color(0xFF3498DB),
        _                     => const Color(0xFF95A5A6),
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _color.withOpacity(0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(badge.icon, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 5),
          Text(badge.name,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: _color,
              )),
        ],
      ),
    );
  }
}
