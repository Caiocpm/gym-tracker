// lib/features/workouts/screens/workouts_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../shared/providers/brand_provider.dart';
import '../../../shared/widgets/gradient_card.dart';
import '../providers/workouts_provider.dart';
import '../domain/workout_models.dart';
import '../../../shared/providers/settings_provider.dart';
import '../../../shared/tutorial/tutorial_keys.dart';
import '../../../shared/tutorial/tutorial_phases.dart';
import '../../../shared/tutorial/tutorial_trigger.dart';
import '../../analytics/providers/analytics_provider.dart';
import 'workout_session_screen.dart';

class WorkoutsScreen extends ConsumerWidget {
  const WorkoutsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final daysAsync = ref.watch(workoutDaysProvider);
    final session = ref.watch(activeSessionProvider);
    final settings = ref.watch(settingsProvider);

    return Scaffold(
      body: SafeArea(
        child: daysAsync.when(
          loading: () => const _WorkoutsSkeleton(),
          error: (_, __) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline,
                    size: 48, color: Colors.red),
                const SizedBox(height: 12),
                const Text('Erro ao carregar treinos'),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () =>
                      ref.read(workoutDaysProvider.notifier).load(),
                  child: const Text('Tentar novamente'),
                ),
              ],
            ),
          ),
          data: (days) {
            // Filtra dias pelas modalidades ativas nas configurações
            final filtered = days
                .where((d) => settings.isDayTypeActive(d.dayType))
                .toList();

            return CustomScrollView(
              slivers: [
                // Tutorial — dispara na primeira visita à aba Treinos
                SliverToBoxAdapter(
                  child: TutorialTrigger(
                    phase: TutorialPhases.mainApp,
                    steps: TutorialPhases.mainAppSteps,
                  ),
                ),
                SliverToBoxAdapter(
                  child: _WorkoutsHeader(
                    onAdd: () => _showAddDayDialog(context, ref, settings),
                  ),
                ),
                // Banner de sessão ativa
                if (session.isActive)
                  SliverToBoxAdapter(
                    child: _ActiveSessionBanner(
                      session: session,
                      onResume: () =>
                          showWorkoutSessionSheet(context, session.dayId!),
                      onFinish: () =>
                          ref.read(activeSessionProvider.notifier).clear(),
                    ),
                  ),
                if (filtered.isEmpty)
                  SliverFillRemaining(
                    child: _EmptyState(
                      onAdd: () => _showAddDayDialog(context, ref, settings),
                      hasHiddenDays: days.length > filtered.length,
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    sliver: _DayCardList(
                      days: filtered,
                      activeSessionDayId: session.dayId,
                      onTap: (d) => context.push('/workout-day/${d.id}'),
                      onDelete: (d) => _confirmDelete(context, ref, d),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  void _showAddDayDialog(BuildContext context, WidgetRef ref,
      AppSettings settings) {
    final ctrl = TextEditingController();
    // Começa com a primeira modalidade ativa
    String dayType = settings.musculacaoActive
        ? 'musculacao'
        : settings.cardioActive
            ? 'cardio'
            : 'crossfit';

    // Modalidades disponíveis conforme configurações
    final available = <Map<String, String>>[
      if (settings.musculacaoActive)
        {'key': 'musculacao', 'label': '💪 Musculação'},
      if (settings.cardioActive)
        {'key': 'cardio', 'label': '❤️ Cardio'},
      if (settings.crossfitActive)
        {'key': 'crossfit', 'label': '🏋️ CrossFit'},
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setStateDialog) => AlertDialog(
          title: const Text('Novo dia de treino'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: ctrl,
                autofocus: true,
                decoration: const InputDecoration(hintText: 'Ex: Peito e Tríceps'),
                onSubmitted: (_) => _submit(ctx, ref, ctrl, dayType),
              ),
              if (available.length > 1) ...[
                const SizedBox(height: 16),
                Text(
                  'Modalidade',
                  style: Theme.of(ctx).textTheme.labelMedium?.copyWith(
                        color: Theme.of(ctx)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.6),
                      ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: available.map((m) {
                    final isFirst = available.first == m;
                    return Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(left: isFirst ? 0 : 8),
                        child: _DayTypeChip(
                          label: m['label']!,
                          selected: dayType == m['key'],
                          onTap: () =>
                              setStateDialog(() => dayType = m['key']!),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () => _submit(ctx, ref, ctrl, dayType),
              child: const Text('Criar'),
            ),
          ],
        ),
      ),
    );
  }

  void _submit(
      BuildContext ctx, WidgetRef ref, TextEditingController ctrl, String dayType) {
    final name = ctrl.text.trim();
    if (name.isEmpty) return;
    ref.read(workoutDaysProvider.notifier).addDay(name, dayType: dayType);
    Navigator.pop(ctx);
  }

  void _confirmDelete(
      BuildContext context, WidgetRef ref, WorkoutDay day) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remover treino?'),
        content: Text('Remover "${day.name}" permanentemente?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style:
                FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              ref
                  .read(workoutDaysProvider.notifier)
                  .deleteDay(day.id);
              Navigator.pop(ctx);
            },
            child: const Text('Remover'),
          ),
        ],
      ),
    );
  }
}

// ─── Header com gradiente (igual ao web) ─────────────────────────────────────

class _DayTypeChip extends StatelessWidget {
  const _DayTypeChip({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? cs.primaryContainer : cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? cs.primary : cs.outlineVariant,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: selected ? FontWeight.w700 : FontWeight.normal,
              color: selected ? cs.onPrimaryContainer : cs.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}

class _WorkoutsHeader extends StatelessWidget {
  const _WorkoutsHeader({required this.onAdd});
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return GradientCard(
      key: TutorialKeys.workoutsHeader,
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Row(
        children: [
          const GradientIconBadge(emoji: '💪'),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Treinos',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Selecione um treino e execute seus exercícios',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          _AddButton(onPressed: onAdd),
        ],
      ),
    );
  }
}

class _AddButton extends ConsumerWidget {
  const _AddButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradient = ref.watch(brandGradientProvider);
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        key: TutorialKeys.addWorkoutButton,
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.add, color: Colors.white, size: 22),
      ),
    );
  }
}

// ─── Banner sessão ativa ──────────────────────────────────────────────────────

class _ActiveSessionBanner extends ConsumerWidget {
  const _ActiveSessionBanner({
    required this.session,
    required this.onResume,
    required this.onFinish,
  });

  final ActiveSessionState session;
  final VoidCallback onResume;
  final VoidCallback onFinish;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradient = ref.watch(brandGradientProvider);
    final completed = session.exercises
        .fold<int>(0, (s, e) => s + e.sets.where((s) => s.isCompleted).length);
    final total =
        session.exercises.fold<int>(0, (s, e) => s + e.sets.length);

    return GestureDetector(
      onTap: onResume,
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(Icons.fitness_center, color: Colors.white, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    session.dayName ?? 'Treino em andamento',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 14),
                  ),
                  Text(
                    '$completed de $total séries concluídas',
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 12),
                  ),
                ],
              ),
            ),
            FilledButton(
              onPressed: onResume,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white.withValues(alpha: 0.25),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Continuar', style: TextStyle(fontSize: 13)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Lista de Dias ────────────────────────────────────────────────────────────

class _DayCard extends StatelessWidget {
  const _DayCard({
    required this.day,
    required this.onTap,
    required this.onDelete,
    this.isActiveSession = false,
    this.recoveringMuscles = const {},
  });

  final WorkoutDay day;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final bool isActiveSession;
  final Set<String> recoveringMuscles;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Material(
      color: theme.cardTheme.color ?? cs.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isActiveSession ? cs.primary : cs.outlineVariant,
              width: isActiveSession ? 2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color:
                        cs.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.fitness_center,
                      color: cs.primary),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(day.name,
                          style: theme.textTheme.titleMedium),
                      const SizedBox(height: 3),
                      Text(
                        '${day.exercises.length} exercício${day.exercises.length == 1 ? '' : 's'}',
                        style: theme.textTheme.bodySmall,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: day.dayType == 'crossfit'
                                  ? Colors.orange.withValues(alpha: 0.15)
                                  : day.dayType == 'cardio'
                                      ? Colors.red.withValues(alpha: 0.1)
                                      : cs.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              day.dayType == 'crossfit'
                                  ? '🏋️ CrossFit'
                                  : day.dayType == 'cardio'
                                      ? '❤️ Cardio'
                                      : '💪 Musculação',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: day.dayType == 'crossfit'
                                    ? Colors.orange.shade700
                                    : day.dayType == 'cardio'
                                        ? Colors.red.shade600
                                        : cs.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (recoveringMuscles.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.bedtime_outlined,
                                size: 12, color: Colors.amber),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                'Em recuperação: ${recoveringMuscles.take(2).join(', ')}${recoveringMuscles.length > 2 ? '…' : ''}',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: Colors.amber.shade700,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                      if (isActiveSession) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: cs.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              'Em andamento',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: cs.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  color: cs.onSurface.withValues(alpha: 0.35),
                ),
                PopupMenuButton(
                  icon: const Icon(Icons.more_vert),
                  itemBuilder: (_) => const [
                    PopupMenuItem(
                      value: 'edit',
                      child: Row(children: [
                        Icon(Icons.edit_outlined),
                        SizedBox(width: 8),
                        Text('Editar'),
                      ]),
                    ),
                    PopupMenuItem(
                      value: 'delete',
                      child: Row(children: [
                        Icon(Icons.delete_outline, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Remover',
                            style: TextStyle(color: Colors.red)),
                      ]),
                    ),
                  ],
                  onSelected: (v) {
                    if (v == 'edit') onTap();
                    if (v == 'delete') onDelete();
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Skeleton loading ─────────────────────────────────────────────────────────

class _WorkoutsSkeleton extends StatelessWidget {
  const _WorkoutsSkeleton();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Shimmer.fromColors(
      baseColor: cs.surfaceContainerHighest,
      highlightColor: cs.surfaceContainerLow,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        itemCount: 4,
        itemBuilder: (_, __) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Container(
            height: 90,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── List com indicador de recuperação ───────────────────────────────────────

class _DayCardList extends ConsumerWidget {
  const _DayCardList({
    required this.days,
    required this.activeSessionDayId,
    required this.onTap,
    required this.onDelete,
  });

  final List<WorkoutDay> days;
  final String? activeSessionDayId;
  final void Function(WorkoutDay) onTap;
  final void Function(WorkoutDay) onDelete;

  /// Retorna grupos musculares treinados nas últimas [hours] horas
  Set<String> _recentMuscles(
      List<WorkoutSession> sessions, int hours) {
    final cutoff = DateTime.now().subtract(Duration(hours: hours));
    final muscles = <String>{};
    for (final s in sessions) {
      if (s.createdAt.isAfter(cutoff)) {
        for (final e in s.exercises) {
          if (e.muscleGroup != null && e.muscleGroup!.isNotEmpty) {
            muscles.add(e.muscleGroup!.toLowerCase());
          }
        }
      }
    }
    return muscles;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(workoutSessionsProvider);
    final recentMuscles = sessionsAsync.valueOrNull != null
        ? _recentMuscles(sessionsAsync.valueOrNull!, 48)
        : <String>{};

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (_, i) {
          final day = days[i];
          // Verifica se algum músculo deste treino está em recuperação
          final dayMuscles = day.exercises
              .map((e) => e.muscleGroup?.toLowerCase() ?? '')
              .where((m) => m.isNotEmpty)
              .toSet();
          final recovering = recentMuscles.intersection(dayMuscles);

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _DayCard(
              day: day,
              isActiveSession: activeSessionDayId == day.id,
              recoveringMuscles: recovering,
              onTap: () => onTap(day),
              onDelete: () => onDelete(day),
            ),
          );
        },
        childCount: days.length,
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends ConsumerWidget {
  const _EmptyState({
    required this.onAdd,
    this.hasHiddenDays = false,
  });
  final VoidCallback onAdd;
  final bool hasHiddenDays;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final brandColor = ref.watch(brandColorProvider);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: brandColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Center(
                child: Text('💪', style: TextStyle(fontSize: 48)),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              hasHiddenDays ? 'Nenhum treino visível' : 'Nenhum treino ainda',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              hasHiddenDays
                  ? 'Alguns treinos estão ocultos por causa das modalidades selecionadas nas configurações.'
                  : 'Crie seu primeiro dia de treino e comece a registrar seus exercícios',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add),
              label: const Text('Criar treino'),
            ),
          ],
        ),
      ),
    );
  }
}
