// lib/features/home/screens/home_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/workouts/providers/workouts_provider.dart';
import '../../../features/workouts/domain/workout_models.dart';
import '../../../features/nutrition/providers/nutrition_provider.dart';
import '../../../features/nutrition/domain/nutrition_models.dart';
import '../../../features/analytics/providers/analytics_provider.dart';
import '../../../shared/providers/brand_provider.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/gradient_progress_bar.dart';
import '../../../shared/widgets/weight_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const _HomeContent();
  }
}

class _HomeContent extends ConsumerWidget {
  const _HomeContent();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      backgroundColor: cs.surface,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(workoutSessionsProvider);
          ref.invalidate(workoutDaysProvider);
          ref.invalidate(nutritionGoalsProvider);
        },
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _GreetingSection()),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _BirthdayCard(),
                  _NutritionCard(),
                  const SizedBox(height: 12),
                  const WeightCard(),
                  const SizedBox(height: 12),
                  _WorkoutStreakCard(),
                  const SizedBox(height: 12),
                  _RecentSessionsSection(),
                  const SizedBox(height: 24),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

class _GreetingSection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final gradient = ref.watch(brandGradientProvider);

    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Bom dia'
        : hour < 18
            ? 'Boa tarde'
            : 'Boa noite';

    final firstName = user?.displayName?.split(' ').first ?? '';

    return Container(
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$greeting${firstName.isNotEmpty ? ', $firstName' : ''}!',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _todayLabel(),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => context.go('/analytics'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.30),
                ),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.bar_chart_rounded, color: Colors.white, size: 22),
                  SizedBox(height: 4),
                  Text(
                    'Análises',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _todayLabel() {
    final now = DateTime.now();
    const days = [
      'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
    ];
    const months = [
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez',
    ];
    final day = days[now.weekday - 1];
    return '$day, ${now.day} de ${months[now.month - 1]}';
  }
}

// ─── Nutrition Card ────────────────────────────────────────────────────────────

class _NutritionCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final summary = ref.watch(dailySummaryProvider);
    final goalsAsync = ref.watch(nutritionGoalsProvider);

    final goals = goalsAsync.valueOrNull ?? const NutritionGoals();
    final calorieProgress = goals.calories > 0
        ? (summary.calories / goals.calories).clamp(0.0, 1.0)
        : 0.0;

    return _HomeCard(
      onTap: () => context.go('/nutrition'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.restaurant_outlined, size: 18, color: cs.primary),
              const SizedBox(width: 8),
              Text(
                'Nutrição de hoje',
                style: theme.textTheme.titleSmall
                    ?.copyWith(fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              Icon(Icons.chevron_right, size: 18,
                  color: cs.onSurface.withValues(alpha: 0.4)),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                summary.calories.toInt().toString(),
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface,
                ),
              ),
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  '/ ${goals.calories.toInt()} kcal',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          GradientProgressBar(value: calorieProgress, height: 7),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _MacroChip(
                label: 'P',
                value: summary.protein.toInt(),
                goal: goals.protein.toInt(),
                color: AppTheme.primary,
              ),
              _MacroChip(
                label: 'C',
                value: summary.carbs.toInt(),
                goal: goals.carbs.toInt(),
                color: AppTheme.cyan,
              ),
              _MacroChip(
                label: 'G',
                value: summary.fat.toInt(),
                goal: goals.fat.toInt(),
                color: AppTheme.teal,
              ),
              _WaterChip(
                water: summary.water,
                goal: goals.water,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MacroChip extends StatelessWidget {
  const _MacroChip({
    required this.label,
    required this.value,
    required this.goal,
    required this.color,
  });

  final String label;
  final int value;
  final int goal;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${value}g',
          style: theme.textTheme.labelSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        Text(
          '/ ${goal}g',
          style: theme.textTheme.labelSmall?.copyWith(
            fontSize: 10,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
          ),
        ),
      ],
    );
  }
}

class _WaterChip extends StatelessWidget {
  const _WaterChip({required this.water, required this.goal});
  final int water;
  final int goal;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const color = Color(0xFF00C6FF);
    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Icon(Icons.water_drop_outlined, color: color, size: 16),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          water >= 1000
              ? '${(water / 1000).toStringAsFixed(1)}L'
              : '${water}ml',
          style: theme.textTheme.labelSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        Text(
          '/ ${(goal / 1000).toStringAsFixed(1)}L',
          style: theme.textTheme.labelSmall?.copyWith(
            fontSize: 10,
            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
          ),
        ),
      ],
    );
  }
}

// ─── Workout Streak Card ───────────────────────────────────────────────────────

class _WorkoutStreakCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sessionsAsync = ref.watch(workoutSessionsProvider);

    return sessionsAsync.when(
      loading: () => _HomeCard(
        child: SizedBox(
          height: 72,
          child: Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: cs.primary),
            ),
          ),
        ),
      ),
      error: (_, __) => const SizedBox.shrink(),
      data: (sessions) {
        final streak = _computeStreak(sessions);
        final weekCount = _weekCount(sessions);

        return _HomeCard(
          onTap: () => context.go('/workouts'),
          child: Row(
            children: [
              _StatBox(
                icon: Icons.local_fire_department,
                iconColor: const Color(0xFFFF5722),
                value: '$streak',
                label: 'dias seguidos',
              ),
              Container(
                width: 1,
                height: 48,
                color: cs.onSurface.withValues(alpha: 0.1),
                margin: const EdgeInsets.symmetric(horizontal: 16),
              ),
              _StatBox(
                icon: Icons.fitness_center,
                iconColor: cs.primary,
                value: '$weekCount',
                label: 'treinos esta semana',
              ),
              const Spacer(),
              Icon(Icons.chevron_right, size: 18,
                  color: cs.onSurface.withValues(alpha: 0.4)),
            ],
          ),
        );
      },
    );
  }

  int _computeStreak(List<WorkoutSession> sessions) {
    if (sessions.isEmpty) return 0;
    final today = DateTime.now();
    final sessionDays = sessions
        .map((s) => DateTime(s.createdAt.year, s.createdAt.month, s.createdAt.day))
        .toSet()
        .toList()
      ..sort((a, b) => b.compareTo(a));

    int streak = 0;
    DateTime check = DateTime(today.year, today.month, today.day);

    // Allow today or yesterday to start the streak
    if (sessionDays.isNotEmpty) {
      final latest = sessionDays.first;
      final diff = check.difference(latest).inDays;
      if (diff > 1) return 0;
      if (diff == 1) check = latest;
    }

    for (final day in sessionDays) {
      if (day == check) {
        streak++;
        check = check.subtract(const Duration(days: 1));
      } else if (day.isBefore(check)) {
        break;
      }
    }
    return streak;
  }

  int _weekCount(List<WorkoutSession> sessions) {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final start = DateTime(weekStart.year, weekStart.month, weekStart.day);
    // Use local date for comparison (createdAt already converted to local in fromJson)
    return sessions.where((s) {
      final d = DateTime(s.createdAt.year, s.createdAt.month, s.createdAt.day);
      return !d.isBefore(start);
    }).length;
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
  });
  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, color: iconColor, size: 22),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─── Recent Sessions ───────────────────────────────────────────────────────────

class _RecentSessionsSection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final sessionsAsync = ref.watch(workoutSessionsProvider);

    return sessionsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (sessions) {
        if (sessions.isEmpty) return const SizedBox.shrink();

        // Provider returns sessions newest-first (server orderBy date desc)
        final recent = sessions.take(3).toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Treinos recentes',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () => context.go('/workouts'),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    'Ver todos',
                    style: TextStyle(
                      fontSize: 13,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...recent.map((s) => _SessionRow(session: s)),
          ],
        );
      },
    );
  }
}

class _SessionRow extends StatelessWidget {
  const _SessionRow({required this.session});
  final WorkoutSession session;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    final dur = session.durationSeconds;
    final durLabel = dur >= 3600
        ? '${dur ~/ 3600}h ${(dur % 3600) ~/ 60}min'
        : '${dur ~/ 60}min';

    final hasCardio = session.exercises.any((e) => e.isCardio);
    final hasStrength = session.exercises.any((e) => !e.isCardio);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: _HomeCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: cs.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                hasCardio && !hasStrength
                    ? Icons.directions_run
                    : Icons.fitness_center,
                color: cs.primary,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    session.workoutName,
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${_dateLabel(session.createdAt)} · ${session.exercises.length} exercício${session.exercises.length != 1 ? 's' : ''}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: cs.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  durLabel,
                  style: theme.textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                if (!hasCardio && session.totalVolume > 0)
                  Text(
                    _fmtVolume(session.totalVolume),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: cs.onSurface.withValues(alpha: 0.5),
                    ),
                  )
                else if (hasCardio && session.totalDistanceKm > 0)
                  Text(
                    '${session.totalDistanceKm.toStringAsFixed(1)} km',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: cs.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _dateLabel(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final day = DateTime(dt.year, dt.month, dt.day);
    final diff = today.difference(day).inDays;
    if (diff == 0) return 'Hoje';
    if (diff == 1) return 'Ontem';
    if (diff < 7) return 'há $diff dias';
    const months = [
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez',
    ];
    return '${dt.day} ${months[dt.month - 1]}';
  }

  String _fmtVolume(double v) {
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}t';
    return '${v.toStringAsFixed(0)} kg';
  }
}

// ─── Shared card widget ────────────────────────────────────────────────────────

class _HomeCard extends StatelessWidget {
  const _HomeCard({
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: padding,
            child: child,
          ),
        ),
      ),
    );
  }
}

// ─── Birthday Card ────────────────────────────────────────────────────────────

class _BirthdayCard extends ConsumerStatefulWidget {
  @override
  ConsumerState<_BirthdayCard> createState() => _BirthdayCardState();
}

class _BirthdayCardState extends ConsumerState<_BirthdayCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scale = CurvedAnimation(parent: _controller, curve: Curves.elasticOut);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool _isBirthday(String? birthDate) {
    if (birthDate == null) return false;
    try {
      final dob = DateTime.parse(birthDate);
      final now = DateTime.now();
      return dob.month == now.month && dob.day == now.day;
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    if (!_isBirthday(user?.birthDate)) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final firstName = user?.displayName?.split(' ').first ?? '';
    final age = user?.age;

    return ScaleTransition(
      scale: _scale,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFFF6B9D), Color(0xFFFFB347)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFF6B9D).withValues(alpha: 0.35),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              const Text('🎂', style: TextStyle(fontSize: 40)),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Feliz aniversário${firstName.isNotEmpty ? ', $firstName' : ''}!',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    if (age != null)
                      Text(
                        '$age anos de muito treino pela frente! 💪',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
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
