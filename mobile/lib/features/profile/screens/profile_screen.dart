// lib/features/profile/screens/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/theme/brand_colors.dart';
import '../../../shared/providers/brand_provider.dart';
import '../../../shared/widgets/gradient_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/domain/auth_user.dart';
import '../providers/profile_provider.dart';
import '../domain/profile_models.dart';
import '../../../shared/tutorial/tutorial_keys.dart';
import '../../../shared/tutorial/tutorial_phases.dart';
import '../../../shared/tutorial/tutorial_trigger.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return DefaultTabController(
      length: 5,
      child: Scaffold(
        body: NestedScrollView(
          headerSliverBuilder: (context, _) => [
            // Tutorial — dispara na primeira visita ao Perfil
            SliverToBoxAdapter(
              child: TutorialTrigger(
                phase: TutorialPhases.profile,
                steps: TutorialPhases.profileSteps,
              ),
            ),
            _ProfileSliverAppBar(user: user, ref: ref),
          ],
          body: Column(
            children: [
              TabBar(
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                tabs: const [
                  Tab(text: '📊 Dashboard'),
                  Tab(text: '👤 Dados Pessoais'),
                  Tab(text: '📏 Medidas'),
                  Tab(text: '📈 Histórico'),
                  Tab(text: '🏆 Conquistas'),
                ],
              ),
              const Expanded(
                child: TabBarView(
                  children: [
                    _StatsTab(),
                    _PersonalDataTab(),
                    _MeasurementsTab(),
                    _HistoryTab(),
                    _BadgesTab(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── AppBar com perfil ────────────────────────────────────────────────────────

class _ProfileSliverAppBar extends StatelessWidget {
  const _ProfileSliverAppBar({required this.user, required this.ref});
  final AuthUser? user;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      key: TutorialKeys.profileAppBar,
      expandedHeight: 220,
      pinned: true,
      actions: [
        IconButton(
          key: TutorialKeys.profileSettingsBtn,
          icon: const Icon(Icons.settings_outlined),
          onPressed: () => context.push('/settings'),
          tooltip: 'Configurações',
        ),
        IconButton(
          icon: const Icon(Icons.edit_outlined),
          onPressed: () => _showEditSheet(context, ref, user),
          tooltip: 'Editar perfil',
        ),
        IconButton(
          icon: const Icon(Icons.logout),
          onPressed: () => _confirmLogout(context, ref),
          tooltip: 'Sair',
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: ref.watch(brandGradientProvider),
          ),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 8),
                CircleAvatar(
                  radius: 44,
                  backgroundColor: Colors.white.withValues(alpha: 0.3),
                  backgroundImage: user?.photoURL != null
                      ? NetworkImage(user!.photoURL!)
                      : null,
                  child: user?.photoURL == null
                      ? Text(
                          (user?.displayName ?? 'U')[0].toUpperCase(),
                          style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.bold,
                              color: Colors.white),
                        )
                      : null,
                ),
                const SizedBox(height: 12),
                Text(
                  user?.displayName ?? 'Usuário',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? '',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sair?'),
        content: const Text('Deseja encerrar a sessão?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('Sair'),
          ),
        ],
      ),
    );
  }

  void _showEditSheet(BuildContext context, WidgetRef ref, AuthUser? user) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _EditProfileSheet(user: user),
    );
  }
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────────────

class _StatsTab extends ConsumerWidget {
  const _StatsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(userStatsProvider);

    return statsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) =>
          const Center(child: Text('Erro ao carregar estatísticas')),
      data: (stats) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _QuickStatsCard(stats: stats),
          const SizedBox(height: 16),
          _SectionTitle('🔥 Sequências'),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  icon: Icons.local_fire_department,
                  iconColor: Colors.orange,
                  label: 'Sequência atual',
                  value: '${stats.currentStreak} dias',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  icon: Icons.emoji_events,
                  iconColor: Colors.amber,
                  label: 'Maior sequência',
                  value: '${stats.longestStreak} dias',
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _SectionTitle('💪 Volume e Recordes'),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  icon: Icons.fitness_center,
                  iconColor: context.brandPrimary,
                  label: 'Volume total',
                  value: stats.totalVolumeFormatted,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  icon: Icons.star,
                  iconColor: Colors.amber,
                  label: 'Recordes pessoais',
                  value: '${stats.totalPersonalRecords}',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  icon: Icons.timer_outlined,
                  iconColor: const Color(0xFF14B8A6),
                  label: 'Tempo total',
                  value: stats.totalTimeFormatted,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  icon: Icons.repeat,
                  iconColor: context.brandPrimary,
                  label: 'Total de séries',
                  value: '${stats.totalSets}',
                ),
              ),
            ],
          ),
          if (stats.strongestLift != null) ...[
            const SizedBox(height: 16),
            _SectionTitle('🏋️ Melhor levantamento'),
            const SizedBox(height: 8),
            GradientCard(
              child: Row(
                children: [
                  GradientIconBadge(
                      icon: Icons.fitness_center,
                      iconColor: Colors.orange,
                      size: 44),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(stats.strongestLift!.exerciseName,
                        style: Theme.of(context).textTheme.titleMedium),
                  ),
                  Text(
                    '${stats.strongestLift!.weight.toInt()} kg',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.orange,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          _SectionTitle('👥 Social'),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  icon: Icons.group,
                  iconColor: Colors.green,
                  label: 'Grupos',
                  value: '${stats.totalGroups}',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  icon: Icons.emoji_events_outlined,
                  iconColor: Colors.red,
                  label: 'Desafios',
                  value: '${stats.totalChallengesCompleted}',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _StatCard(
                  icon: Icons.military_tech,
                  iconColor: Colors.amber,
                  label: 'Badges',
                  value: '${stats.totalBadges}',
                ),
              ),
            ],
          ),
          if (stats.memberSince != null) ...[
            const SizedBox(height: 20),
            Center(
              child: Text(
                'Membro desde ${_formatDate(stats.memberSince!)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ],
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      return DateFormat('MMM yyyy', 'pt_BR').format(DateTime.parse(iso));
    } catch (_) {
      return '';
    }
  }
}

// ─── Tab: Dados Pessoais ──────────────────────────────────────────────────────

class _PersonalDataTab extends ConsumerStatefulWidget {
  const _PersonalDataTab();

  @override
  ConsumerState<_PersonalDataTab> createState() => _PersonalDataTabState();
}

class _PersonalDataTabState extends ConsumerState<_PersonalDataTab> {
  late TextEditingController _nameCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(currentUserProvider);
    _nameCtrl = TextEditingController(text: user?.displayName ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      await ref
          .read(authProvider.notifier)
          .updateDisplayName(_nameCtrl.text.trim());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Perfil atualizado!')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Erro ao salvar')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GradientCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const GradientIconBadge(emoji: '👤', size: 40),
                  const SizedBox(width: 12),
                  Text('Dados Pessoais',
                      style: Theme.of(context).textTheme.titleLarge),
                ],
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Nome de exibição',
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                readOnly: true,
                decoration: InputDecoration(
                  labelText: 'E-mail',
                  prefixIcon: const Icon(Icons.email_outlined),
                  hintText: user?.email ?? '',
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Salvar'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Tab: Medidas ─────────────────────────────────────────────────────────────

class _MeasurementsTab extends StatefulWidget {
  const _MeasurementsTab();

  @override
  State<_MeasurementsTab> createState() => _MeasurementsTabState();
}

class _MeasurementsTabState extends State<_MeasurementsTab> {
  final _weightCtrl = TextEditingController();
  final _heightCtrl = TextEditingController();
  final _waistCtrl = TextEditingController();
  final _chestCtrl = TextEditingController();
  final _armCtrl = TextEditingController();

  @override
  void dispose() {
    for (final c in [
      _weightCtrl,
      _heightCtrl,
      _waistCtrl,
      _chestCtrl,
      _armCtrl
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GradientCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const GradientIconBadge(emoji: '📏', size: 40),
                  const SizedBox(width: 12),
                  Text('Medidas Corporais',
                      style: Theme.of(context).textTheme.titleLarge),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _weightCtrl,
                      keyboardType: TextInputType.number,
                      decoration:
                          const InputDecoration(labelText: 'Peso (kg)'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _heightCtrl,
                      keyboardType: TextInputType.number,
                      decoration:
                          const InputDecoration(labelText: 'Altura (cm)'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _waistCtrl,
                      keyboardType: TextInputType.number,
                      decoration:
                          const InputDecoration(labelText: 'Cintura (cm)'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _chestCtrl,
                      keyboardType: TextInputType.number,
                      decoration:
                          const InputDecoration(labelText: 'Peito (cm)'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _armCtrl,
                keyboardType: TextInputType.number,
                decoration:
                    const InputDecoration(labelText: 'Braço (cm)'),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Medidas salvas!')),
                    );
                  },
                  child: const Text('Salvar medidas'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Tab: Histórico ───────────────────────────────────────────────────────────

class _HistoryTab extends StatelessWidget {
  const _HistoryTab();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
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
                child: Text('📈', style: TextStyle(fontSize: 40)),
              ),
            ),
            const SizedBox(height: 20),
            Text('Histórico de Medidas',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'O histórico de medidas aparecerá aqui após você salvar suas medidas corporais',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Tab: Conquistas (Badges) ─────────────────────────────────────────────────

class _BadgesTab extends ConsumerWidget {
  const _BadgesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badgesAsync = ref.watch(userBadgesProvider);

    return badgesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) =>
          const Center(child: Text('Erro ao carregar conquistas')),
      data: (badges) => badges.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
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
                      child: Center(
                        child: Icon(Icons.military_tech,
                            size: 48,
                            color: AppTheme.primary.withValues(alpha: 0.4)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text('Nenhuma conquista ainda',
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    Text('Participe de desafios para ganhar badges',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center),
                  ],
                ),
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate:
                  const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.85,
              ),
              itemCount: badges.length,
              itemBuilder: (_, i) => _BadgeTile(badge: badges[i]),
            ),
    );
  }
}

// ─── Widgets de Suporte ───────────────────────────────────────────────────────

class _QuickStatsCard extends StatelessWidget {
  const _QuickStatsCard({required this.stats});
  final UserStats stats;

  @override
  Widget build(BuildContext context) {
    return GradientCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _QuickStat(
              value: '${stats.totalWorkouts}', label: 'Treinos'),
          Container(
            height: 36,
            width: 1,
            color: AppTheme.border,
          ),
          _QuickStat(
              value: '${stats.totalExercises}', label: 'Exercícios'),
          Container(
            height: 36,
            width: 1,
            color: AppTheme.border,
          ),
          _QuickStat(value: '${stats.totalReps}', label: 'Reps'),
        ],
      ),
    );
  }
}

class _QuickStat extends StatelessWidget {
  const _QuickStat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: context.brandPrimary,
                  fontWeight: FontWeight.w800,
                )),
        const SizedBox(height: 4),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(height: 10),
          Text(value, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 2),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ));
  }
}

class _BadgeTile extends StatelessWidget {
  const _BadgeTile({required this.badge});
  final UserBadge badge;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showDetail(context),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        padding: const EdgeInsets.all(10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border:
                    Border.all(color: badge.rarityColor, width: 2),
                color: badge.rarityColor.withValues(alpha: 0.1),
              ),
              child: Center(
                child: Text(badge.badgeIcon,
                    style: const TextStyle(fontSize: 26)),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              badge.badgeName,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: badge.rarityColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                badge.rarityLabel,
                style: TextStyle(fontSize: 10, color: badge.rarityColor),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDetail(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Text(badge.badgeIcon, style: const TextStyle(fontSize: 28)),
            const SizedBox(width: 8),
            Expanded(child: Text(badge.badgeName)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: badge.rarityColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(badge.rarityLabel,
                  style: TextStyle(color: badge.rarityColor)),
            ),
            if (badge.challengeTitle != null) ...[
              const SizedBox(height: 8),
              Text('Desafio: ${badge.challengeTitle}'),
            ],
            const SizedBox(height: 8),
            Text(
              'Conquistado em ${DateFormat('d MMM yyyy', 'pt_BR').format(badge.earnedAt)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }
}

// ─── Sheet Editar Perfil ──────────────────────────────────────────────────────

class _EditProfileSheet extends ConsumerStatefulWidget {
  const _EditProfileSheet({this.user});
  final AuthUser? user;

  @override
  ConsumerState<_EditProfileSheet> createState() =>
      _EditProfileSheetState();
}

class _EditProfileSheetState extends ConsumerState<_EditProfileSheet> {
  late final TextEditingController _nameCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl =
        TextEditingController(text: widget.user?.displayName ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      await ref
          .read(authProvider.notifier)
          .updateDisplayName(_nameCtrl.text.trim());
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
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
          Text('Editar perfil',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          TextField(
            controller: _nameCtrl,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Nome de exibição',
              prefixIcon: Icon(Icons.person_outline),
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Salvar'),
          ),
        ],
      ),
    );
  }
}
