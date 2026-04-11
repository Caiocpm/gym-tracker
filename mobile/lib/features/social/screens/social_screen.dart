// lib/features/social/screens/social_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/theme/brand_colors.dart';
import '../../../shared/widgets/gradient_card.dart';
import '../domain/social_models.dart';
import '../providers/social_provider.dart';
import '../data/social_service.dart';
import '../widgets/social_post_item.dart';
import '../../../shared/tutorial/tutorial_keys.dart';
import '../../../shared/tutorial/tutorial_phases.dart';
import '../../../shared/tutorial/tutorial_trigger.dart';
import '../../auth/providers/auth_provider.dart' show currentUserProvider;
import 'package:shimmer/shimmer.dart';

class SocialScreen extends ConsumerStatefulWidget {
  const SocialScreen({super.key});

  @override
  ConsumerState<SocialScreen> createState() => _SocialScreenState();
}

class _SocialScreenState extends ConsumerState<SocialScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this);
    _tab.addListener(() {
      if (_tab.indexIsChanging) return;
      setState(() => _tabIndex = _tab.index);
    });
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tutorial — dispara na primeira visita à aba Social
            TutorialTrigger(
              phase: TutorialPhases.social,
              steps: TutorialPhases.socialSteps,
            ),
            _SocialHeader(
              showGroupActions: _tabIndex != 0,
              onJoinCode: () => _showJoinCodeSheet(context),
              onCreateGroup: () => _showCreateGroupSheet(context),
            ),
            TabBar(
              key: TutorialKeys.socialTabs,
              controller: _tab,
              tabs: const [
                Tab(text: 'Feed'),
                Tab(text: 'Meus Grupos'),
                Tab(text: 'Descobrir'),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tab,
                children: const [
                  _FeedTab(),
                  _MyGroupsTab(),
                  _DiscoverTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showJoinCodeSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _JoinCodeSheet(
        onJoined: (group) {
          ref.read(myGroupsProvider.notifier).add(group);
          ref.invalidate(discoverGroupsProvider);
          context.push('/social/groups/${group.id}');
        },
      ),
    );
  }

  void _showCreateGroupSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _CreateGroupSheet(
        onCreated: (group) {
          ref.read(myGroupsProvider.notifier).add(group);
        },
      ),
    );
  }
}

// ─── Header ────────────────────────────────────────────────────────────────────

class _SocialHeader extends StatelessWidget {
  const _SocialHeader({
    required this.showGroupActions,
    required this.onJoinCode,
    required this.onCreateGroup,
  });
  final bool showGroupActions;
  final VoidCallback onJoinCode;
  final VoidCallback onCreateGroup;

  @override
  Widget build(BuildContext context) {
    return GradientCard(
      key: TutorialKeys.socialHeader,
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          const GradientIconBadge(emoji: '🌐'),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Social',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        )),
                const SizedBox(height: 2),
                Text(showGroupActions ? 'Treine em comunidade' : 'Feed de quem você segue',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          if (showGroupActions) ...[
            const SizedBox(width: 8),
            _HeaderButton(label: '🔗 Código', onPressed: onJoinCode),
            const SizedBox(width: 8),
            _HeaderButton(label: '➕ Criar', onPressed: onCreateGroup, filled: true),
          ],
        ],
      ),
    );
  }
}

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({
    required this.label,
    required this.onPressed,
    this.filled = false,
  });
  final String label;
  final VoidCallback onPressed;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    if (filled) {
      return FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          padding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        child: Text(label),
      );
    }
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
      ),
      child: Text(label),
    );
  }
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

class _FeedTab extends ConsumerStatefulWidget {
  const _FeedTab();

  @override
  ConsumerState<_FeedTab> createState() => _FeedTabState();
}

class _FeedTabState extends ConsumerState<_FeedTab>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        TabBar(
          controller: _tab,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: 'Seguindo'),
            Tab(text: 'Global'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tab,
            children: const [
              _FollowingFeedList(),
              _GlobalFeedList(),
            ],
          ),
        ),
      ],
    );
  }
}

class _FollowingFeedList extends ConsumerWidget {
  const _FollowingFeedList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(feedProvider);
    final me = ref.watch(currentUserProvider);
    return state.when(
      loading: () => const _FeedSkeleton(),
      error: (_, __) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Erro ao carregar o feed'),
            TextButton(
              onPressed: () => ref.read(feedProvider.notifier).load(),
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
      data: (posts) {
        if (posts.isEmpty) {
          return const _EmptyGroupsState(
            title: 'Seu feed está vazio',
            subtitle: 'Siga outros usuários para ver os treinos deles aqui',
            emoji: '🌐',
          );
        }
        return RefreshIndicator(
          onRefresh: () => ref.read(feedProvider.notifier).load(),
          child: ListView.separated(
            padding: EdgeInsets.zero,
            itemCount: posts.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) => SocialPostItem(
              post: posts[i],
              currentUserId: me?.uid ?? '',
              onLike: () => ref.read(feedProvider.notifier).toggleLike(posts[i].id),
              onDelete: posts[i].userId == (me?.uid ?? '')
                  ? () => ref.read(feedProvider.notifier).deletePost(posts[i].id)
                  : null,
            ),
          ),
        );
      },
    );
  }
}

class _GlobalFeedList extends ConsumerWidget {
  const _GlobalFeedList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(discoverFeedProvider);
    final me = ref.watch(currentUserProvider);
    return state.when(
      loading: () => const _FeedSkeleton(),
      error: (_, __) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Erro ao carregar o feed global'),
            TextButton(
              onPressed: () => ref.read(discoverFeedProvider.notifier).load(),
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
      data: (posts) {
        if (posts.isEmpty) {
          return const _EmptyGroupsState(
            title: 'Nenhuma postagem pública ainda',
            subtitle: 'Seja o primeiro a compartilhar um treino publicamente!',
            emoji: '🌍',
          );
        }
        return RefreshIndicator(
          onRefresh: () => ref.read(discoverFeedProvider.notifier).load(),
          child: ListView.separated(
            padding: EdgeInsets.zero,
            itemCount: posts.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) => SocialPostItem(
              post: posts[i],
              currentUserId: me?.uid ?? '',
              onLike: () => ref.read(discoverFeedProvider.notifier).toggleLike(posts[i].id),
              onDelete: null,
            ),
          ),
        );
      },
    );
  }
}


// ─── Meus Grupos ──────────────────────────────────────────────────────────────

class _MyGroupsTab extends ConsumerWidget {
  const _MyGroupsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(myGroupsProvider);
    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Erro ao carregar grupos',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.error)),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () =>
                  ref.read(myGroupsProvider.notifier).load(),
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
      data: (groups) {
        if (groups.isEmpty) {
          return _EmptyGroupsState(
            title: 'Você não faz parte de nenhum grupo',
            subtitle:
                'Crie seu primeiro grupo ou entre com um código de convite',
            emoji: '👥',
          );
        }
        return RefreshIndicator(
          onRefresh: () => ref.read(myGroupsProvider.notifier).load(),
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate:
                const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.78,
            ),
            itemCount: groups.length,
            itemBuilder: (_, i) =>
                _GroupCard(group: groups[i], isMine: true),
          ),
        );
      },
    );
  }
}

// ─── Descobrir ────────────────────────────────────────────────────────────────

class _DiscoverTab extends ConsumerWidget {
  const _DiscoverTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(discoverGroupsProvider);
    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Erro ao buscar grupos'),
            TextButton(
              onPressed: () => ref.invalidate(discoverGroupsProvider),
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
      data: (groups) {
        if (groups.isEmpty) {
          return const _EmptyGroupsState(
            title: 'Nenhum grupo disponível',
            subtitle: 'Em breve você poderá descobrir grupos públicos',
            emoji: '🔍',
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(discoverGroupsProvider),
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate:
                const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.78,
            ),
            itemCount: groups.length,
            itemBuilder: (_, i) =>
                _GroupCard(group: groups[i], isMine: false),
          ),
        );
      },
    );
  }
}

// ─── Group Card (cover + info, igual ao web) ──────────────────────────────────

class _GroupCard extends ConsumerWidget {
  const _GroupCard({required this.group, required this.isMine});
  final Group group;
  final bool isMine;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () => context.push('/social/groups/${group.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: context.cs.outlineVariant),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover section (igual ao web: 150px)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12)),
              child: Container(
                height: 110,
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFFEEF2FF),
                      Color(0xFFF3E8FF),
                    ],
                  ),
                ),
                child: group.coverPhoto != null
                    ? Image.network(
                        group.coverPhoto!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            _CoverPlaceholder(name: group.name),
                      )
                    : _CoverPlaceholder(name: group.name),
              ),
            ),
            // Info section
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          group.name,
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (group.isPrivate)
                        Icon(Icons.lock_outline,
                            size: 12,
                            color: context.cs.onSurfaceVariant),
                    ],
                  ),
                  if (group.description != null) ...[
                    const SizedBox(height: 3),
                    Text(
                      group.description!,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(fontSize: 11),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text('👥 ${group.membersCount}',
                          style: Theme.of(context).textTheme.labelSmall),
                      const SizedBox(width: 8),
                      Text('📝 ${group.postsCount}',
                          style: Theme.of(context).textTheme.labelSmall),
                    ],
                  ),
                  if (!isMine) ...[
                    const SizedBox(height: 8),
                    _JoinButton(group: group),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CoverPlaceholder extends StatelessWidget {
  const _CoverPlaceholder({required this.name});
  final String name;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('👥', style: const TextStyle(fontSize: 36)),
          const SizedBox(height: 4),
          Text(
            name.isNotEmpty ? name[0].toUpperCase() : '',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: context.brandPrimary.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Feed skeleton ────────────────────────────────────────────────────────────

class _FeedSkeleton extends StatelessWidget {
  const _FeedSkeleton();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Shimmer.fromColors(
      baseColor: cs.surfaceContainerHighest,
      highlightColor: cs.surfaceContainerLow,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: 4,
        itemBuilder: (_, __) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                      width: 40, height: 40,
                      decoration: const BoxDecoration(
                          color: Colors.white, shape: BoxShape.circle)),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(width: 120, height: 12,
                          color: Colors.white,
                          margin: const EdgeInsets.only(bottom: 6)),
                      Container(width: 80, height: 10, color: Colors.white),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(width: double.infinity, height: 14,
                  color: Colors.white,
                  margin: const EdgeInsets.only(bottom: 6)),
              Container(width: 200, height: 14, color: Colors.white),
              const SizedBox(height: 12),
              Container(
                width: double.infinity, height: 160,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyGroupsState extends StatelessWidget {
  const _EmptyGroupsState({
    required this.title,
    required this.subtitle,
    required this.emoji,
  });
  final String title;
  final String subtitle;
  final String emoji;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: context.brandPrimary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                  child:
                      Text(emoji, style: const TextStyle(fontSize: 40))),
            ),
            const SizedBox(height: 16),
            Text(title,
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(subtitle,
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

// ─── Join Button ──────────────────────────────────────────────────────────────

class _JoinButton extends ConsumerStatefulWidget {
  const _JoinButton({required this.group});
  final Group group;

  @override
  ConsumerState<_JoinButton> createState() => _JoinButtonState();
}

class _JoinButtonState extends ConsumerState<_JoinButton> {
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(strokeWidth: 2));
    }
    return SizedBox(
      width: double.infinity,
      child: FilledButton(
        onPressed: _join,
        style: FilledButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 6),
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          textStyle: const TextStyle(fontSize: 13),
        ),
        child: const Text('Entrar'),
      ),
    );
  }

  Future<void> _join() async {
    setState(() => _loading = true);
    try {
      await SocialService.instance.joinGroup(widget.group.id);
      ref.read(myGroupsProvider.notifier).add(widget.group);
      ref.invalidate(discoverGroupsProvider);
      if (mounted) context.push('/social/groups/${widget.group.id}');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

// ─── Join Code Sheet ──────────────────────────────────────────────────────────

class _JoinCodeSheet extends ConsumerStatefulWidget {
  const _JoinCodeSheet({required this.onJoined});
  final void Function(Group group) onJoined;

  @override
  ConsumerState<_JoinCodeSheet> createState() => _JoinCodeSheetState();
}

class _JoinCodeSheetState extends ConsumerState<_JoinCodeSheet> {
  final _codeCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _join() async {
    if (_codeCtrl.text.trim().isEmpty) return;
    setState(() => _loading = true);
    try {
      final group =
          await SocialService.instance.joinByCode(_codeCtrl.text.trim());
      widget.onJoined(group);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Código inválido ou expirado')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Entrar com Código',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text('Digite o código de convite do grupo',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          TextField(
            controller: _codeCtrl,
            autofocus: true,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(
              labelText: 'Código de convite',
              hintText: 'Ex: ABC12345',
              prefixIcon: Icon(Icons.link),
            ),
            onSubmitted: (_) => _join(),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _loading ? null : _join,
            child: _loading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Entrar no Grupo'),
          ),
        ],
      ),
    );
  }
}

// ─── Create Group Sheet ───────────────────────────────────────────────────────

class _CreateGroupSheet extends ConsumerStatefulWidget {
  const _CreateGroupSheet({required this.onCreated});
  final void Function(Group group) onCreated;

  @override
  ConsumerState<_CreateGroupSheet> createState() =>
      _CreateGroupSheetState();
}

class _CreateGroupSheetState extends ConsumerState<_CreateGroupSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _isPrivate = false;
  bool _loading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Criar Grupo',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            Text('Nome do grupo',
                style: Theme.of(context).textTheme.labelLarge
                    ?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(
                hintText: 'Ex: Galera da musculação',
                prefixIcon: Icon(Icons.group),
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Informe o nome' : null,
            ),
            const SizedBox(height: 14),
            Text('Descrição',
                style: Theme.of(context).textTheme.labelLarge
                    ?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            TextFormField(
              controller: _descCtrl,
              decoration: const InputDecoration(
                hintText: 'Opcional — sobre o grupo',
                prefixIcon: Icon(Icons.description_outlined),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Grupo privado'),
              subtitle: const Text('Apenas por convite'),
              value: _isPrivate,
              onChanged: (v) => setState(() => _isPrivate = v),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _loading ? null : _create,
                child: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Criar'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _create() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final group = await SocialService.instance.createGroup(
        name: _nameCtrl.text.trim(),
        description: _descCtrl.text.trim().isEmpty
            ? null
            : _descCtrl.text.trim(),
        isPrivate: _isPrivate,
      );
      widget.onCreated(group);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao criar grupo: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
