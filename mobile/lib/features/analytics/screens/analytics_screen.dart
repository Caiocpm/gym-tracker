// lib/features/analytics/screens/analytics_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';
import '../providers/analytics_provider.dart';
import '../providers/training_goals_provider.dart';
import '../../../features/workouts/domain/workout_models.dart';
import '../../../features/workouts/screens/story_card_screen.dart';
import '../../../shared/providers/settings_provider.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/theme/brand_colors.dart';
import '../../nutrition/domain/nutrition_models.dart';
import '../../nutrition/providers/weight_provider.dart';
import '../../../shared/tutorial/tutorial_keys.dart';
import '../../../shared/tutorial/tutorial_phases.dart';
import '../../../shared/tutorial/tutorial_trigger.dart';

// ─── Screen ───────────────────────────────────────────────────────────────────

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final analyticsAsync = ref.watch(analyticsProvider);

    final tabs = <({String label, String emoji})>[
      (label: 'Geral',     emoji: '📊'),
      (label: 'Nutrição',  emoji: '🥗'),
      if (settings.musculacaoActive) (label: 'Musculação', emoji: '💪'),
      if (settings.cardioActive)     (label: 'Cardio',     emoji: '❤️'),
      if (settings.crossfitActive)   (label: 'CrossFit',   emoji: '🏋️'),
    ];

    return DefaultTabController(
      key: ValueKey(tabs.length),
      length: tabs.length,
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: Column(
          children: [
            // Tutorial — dispara na primeira visita à aba Análises
            TutorialTrigger(
              phase: TutorialPhases.analytics,
              steps: TutorialPhases.analyticsSteps,
            ),
            _TabBar(tabs: tabs),
            Expanded(
              child: TabBarView(
                children: tabs.map((t) {
                  if (t.label == 'Nutrição') return const _NutritionAnalyticsTab();
                  if (t.label == 'Geral') {
                    return analyticsAsync.when(
                      data: (data) => _GeralTab(
                        analytics: data,
                        settings: settings,
                      ),
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (e, _) => const Center(child: Text('Erro ao carregar dados')),
                    );
                  }
                  return analyticsAsync.when(
                    data: (data) {
                      if (t.label == 'Musculação') return _MusculacaoTab(data: data.musculacao, analytics: data);
                      if (t.label == 'Cardio')     return _CardioTab(data: data.cardio, analytics: data);
                      return _CrossFitTab(data: data.crossfit);
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error_outline, size: 48,
                              color: Theme.of(context).colorScheme.error),
                          const SizedBox(height: 12),
                          const Text('Erro ao carregar dados'),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabBar extends StatelessWidget {
  const _TabBar({required this.tabs});
  final List<({String label, String emoji})> tabs;

  @override
  Widget build(BuildContext context) {
    return Container(
      key: TutorialKeys.analyticsTabBar,
      color: Theme.of(context).appBarTheme.backgroundColor ?? Theme.of(context).colorScheme.surface,
      child: TabBar(
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        tabs: tabs
            .map((t) => Tab(
                  icon: Text(t.emoji, style: const TextStyle(fontSize: 20)),
                  text: t.label,
                ))
            .toList(),
      ),
    );
  }
}

// ─── Tab: Geral ───────────────────────────────────────────────────────────────

class _GeralTab extends StatefulWidget {
  const _GeralTab({required this.analytics, required this.settings});
  final FullAnalytics analytics;
  final AppSettings settings;

  @override
  State<_GeralTab> createState() => _GeralTabState();
}

class _GeralTabState extends State<_GeralTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTime _selectedDay = DateTime.now();

  void _changeDay(DateTime day) => setState(() => _selectedDay = day);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      children: [
        // ── Sub-tab bar ───────────────────────────────────────────────────
        Container(
          color: Theme.of(context).appBarTheme.backgroundColor ??
              cs.surface,
          child: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Visão Geral'),
              Tab(text: 'Histórico'),
            ],
            indicatorSize: TabBarIndicatorSize.label,
            dividerColor: cs.outline.withValues(alpha: 0.2),
          ),
        ),

        // ── Sub-tab views ─────────────────────────────────────────────────
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              // ── Sub-tab 0: Visão Geral (Insights + Heat Map) ─────────
              _GeralOverviewTab(analytics: widget.analytics),

              // ── Sub-tab 1: Histórico (Day navigator + day detail) ────
              _GeralHistoryTab(
                analytics: widget.analytics,
                settings: widget.settings,
                selectedDay: _selectedDay,
                onDayChanged: _changeDay,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Geral sub-tab: Visão Geral ───────────────────────────────────────────────

class _GeralOverviewTab extends StatelessWidget {
  const _GeralOverviewTab({required this.analytics});
  final FullAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final hasInsights = analytics.insights.isNotEmpty;
    final hasActivity = analytics.annualActivity.isNotEmpty;

    if (!hasInsights && !hasActivity) {
      return const _EmptyState(
        icon: Icons.insights,
        message: 'Complete alguns treinos para ver seus insights e atividade anual.',
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(0, 12, 0, 32),
      children: [
        if (hasInsights)
          _SmartInsightsCard(insights: analytics.insights),
        if (hasActivity) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: _AnnualHeatMap(activity: analytics.annualActivity),
          ),
        ],
      ],
    );
  }
}

// ─── Geral sub-tab: Histórico ─────────────────────────────────────────────────

class _GeralHistoryTab extends StatelessWidget {
  const _GeralHistoryTab({
    required this.analytics,
    required this.settings,
    required this.selectedDay,
    required this.onDayChanged,
  });
  final FullAnalytics analytics;
  final AppSettings settings;
  final DateTime selectedDay;
  final void Function(DateTime) onDayChanged;

  static String _dateKey(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final daySessions = analytics.sessionsByDay[_dateKey(selectedDay)] ?? [];

    final dayKcal = daySessions.fold(0, (t, s) => t + s.totalKcalBurned);
    final bpmVals = daySessions.map((s) => s.effectiveAvgBpm).whereType<int>().toList();
    final dayBpm  = bpmVals.isEmpty ? null
        : (bpmVals.fold(0, (a, b) => a + b) / bpmVals.length).round();

    final muscDay   = daySessions.where((s) => s.exercises.any((e) => !e.isCardio && !e.isCrossFit)).toList();
    final cardioDay = daySessions.where((s) => s.exercises.any((e) => e.isCardio && !e.isCrossFit)).toList();
    final cfDay     = daySessions.where((s) => s.exercises.any((e) => e.isCrossFit)).toList();

    final muscVol    = muscDay.fold(0.0, (v, s) => v + s.totalVolume);
    final muscKcal   = muscDay.fold(0, (t, s) => t + s.totalKcalBurned);
    final muscBpmV   = muscDay.map((s) => s.effectiveAvgBpm).whereType<int>().toList();
    final muscBpm    = muscBpmV.isEmpty ? null
        : (muscBpmV.fold(0, (a, b) => a + b) / muscBpmV.length).round();

    final cardioDist = cardioDay.fold(0.0, (v, s) =>
        v + s.exercises.where((e) => e.isCardio && !e.isCrossFit).fold(0.0, (d, e) => d + e.totalDistanceKm));
    final cardioKcal = cardioDay.fold(0, (t, s) => t + s.totalKcalBurned);
    final cardioBpmV = cardioDay.map((s) => s.effectiveAvgBpm).whereType<int>().toList();
    final cardioBpm  = cardioBpmV.isEmpty ? null
        : (cardioBpmV.fold(0, (a, b) => a + b) / cardioBpmV.length).round();
    final cardioMaxBpm = cardioDay.map((s) => s.effectiveMaxBpm).whereType<int>()
        .fold<int?>(null, (mx, v) => mx == null || v > mx ? v : mx);

    final cfKcal  = cfDay.fold(0, (t, s) => t + s.totalKcalBurned);
    final cfBpmV  = cfDay.map((s) => s.effectiveAvgBpm).whereType<int>().toList();
    final cfBpm   = cfBpmV.isEmpty ? null
        : (cfBpmV.fold(0, (a, b) => a + b) / cfBpmV.length).round();

    return ListView(
      padding: const EdgeInsets.fromLTRB(0, 0, 0, 32),
      children: [
        // ── Navegador de dias ───────────────────────────────────────────
        _DayNavigatorBar(
          selectedDay: selectedDay,
          sessionsByDay: analytics.sessionsByDay,
          onDayChanged: onDayChanged,
        ),
        const Divider(height: 1),

        if (daySessions.isEmpty) ...[
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 24, 16, 24),
            child: _EmptyState(
              icon: Icons.calendar_today_outlined,
              message: 'Nenhum treino registrado neste dia.',
            ),
          ),
        ] else ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionHeader('📊 Resumo do Dia'),
                const SizedBox(height: 6),
                Text(
                  _dayModalitiesLabel(muscDay, cardioDay, cfDay),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.55)),
                ),
                const SizedBox(height: 12),
                _StatRow(stats: [
                  _Stat('Treinos', '${daySessions.length}', Icons.fitness_center),
                  _Stat('Duração', _fmtDuration(daySessions.fold(0, (t, s) => t + s.durationSeconds)), Icons.timer_outlined),
                ]),
                if (dayBpm != null || dayKcal > 0) ...[
                  const SizedBox(height: 10),
                  _StatRow(stats: [
                    if (dayBpm != null)
                      _Stat('FC Média',   '$dayBpm bpm', Icons.favorite,              color: Colors.redAccent),
                    if (dayKcal > 0)
                      _Stat('Kcal Total', '$dayKcal',    Icons.local_fire_department, color: Colors.orange),
                  ]),
                ],

                if (settings.musculacaoActive && muscDay.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _SectionHeader('💪 Musculação'),
                  const SizedBox(height: 10),
                  _StatRow(stats: [
                    _Stat('Sessões', '${muscDay.length}',      Icons.fitness_center),
                    if (muscVol > 0)
                      _Stat('Volume', _fmtVolume(muscVol),     Icons.bar_chart),
                  ]),
                  if (muscBpm != null || muscKcal > 0) ...[
                    const SizedBox(height: 10),
                    _StatRow(stats: [
                      if (muscBpm != null)
                        _Stat('FC Média',   '$muscBpm bpm', Icons.favorite,              color: Colors.redAccent),
                      if (muscKcal > 0)
                        _Stat('Kcal',       '$muscKcal',    Icons.local_fire_department, color: Colors.orange),
                    ]),
                  ],
                ],

                if (settings.cardioActive && cardioDay.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _SectionHeader('❤️ Cardio'),
                  const SizedBox(height: 10),
                  _StatRow(stats: [
                    _Stat('Sessões',   '${cardioDay.length}',                     Icons.directions_run),
                    if (cardioDist > 0)
                      _Stat('Distância', '${cardioDist.toStringAsFixed(1)} km',   Icons.route),
                  ]),
                  if (cardioBpm != null || cardioMaxBpm != null || cardioKcal > 0) ...[
                    const SizedBox(height: 10),
                    _StatRow(stats: [
                      if (cardioBpm != null)
                        _Stat('FC Média',  '$cardioBpm bpm',    Icons.favorite,              color: Colors.redAccent),
                      if (cardioMaxBpm != null)
                        _Stat('FC Máx',   '$cardioMaxBpm bpm',  Icons.favorite_border,       color: Colors.red),
                      if (cardioKcal > 0)
                        _Stat('Kcal',     '$cardioKcal',        Icons.local_fire_department, color: Colors.orange),
                    ]),
                  ],
                ],

                if (settings.crossfitActive && cfDay.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _SectionHeader('🏋️ CrossFit'),
                  const SizedBox(height: 10),
                  _StatRow(stats: [
                    _Stat('WODs', '${cfDay.length}', Icons.sports_gymnastics, color: const Color(0xFFFF6D00)),
                  ]),
                  if (cfBpm != null || cfKcal > 0) ...[
                    const SizedBox(height: 10),
                    _StatRow(stats: [
                      if (cfBpm != null)
                        _Stat('FC Média',   '$cfBpm bpm', Icons.favorite,              color: Colors.redAccent),
                      if (cfKcal > 0)
                        _Stat('Kcal',       '$cfKcal',    Icons.local_fire_department, color: Colors.orange),
                    ]),
                  ],
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }

  static String _dayModalitiesLabel(
    List<WorkoutSession> musc,
    List<WorkoutSession> cardio,
    List<WorkoutSession> cf,
  ) {
    final parts = <String>[
      if (musc.isNotEmpty)   'Musculação',
      if (cardio.isNotEmpty) 'Cardio',
      if (cf.isNotEmpty)     'CrossFit',
    ];
    final total = musc.length + cardio.length + cf.length;
    final label = parts.join(' + ');
    return total > 1 ? '$label · $total treinos' : label;
  }
}

// ─── Day Navigator Bar ────────────────────────────────────────────────────────

class _DayNavigatorBar extends StatelessWidget {
  const _DayNavigatorBar({
    required this.selectedDay,
    required this.sessionsByDay,
    required this.onDayChanged,
  });

  final DateTime selectedDay;
  final Map<String, List<WorkoutSession>> sessionsByDay;
  final void Function(DateTime) onDayChanged;

  static String _dateKey(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  String _label() {
    final now = DateTime.now();
    if (isSameDay(selectedDay, now))
      return 'Hoje';
    if (isSameDay(selectedDay, now.subtract(const Duration(days: 1))))
      return 'Ontem';
    return DateFormat('d MMM', 'pt_BR').format(selectedDay);
  }

  void _openCalendar(BuildContext context) {
    showDialog<DateTime>(
      context: context,
      builder: (ctx) => _CalendarDialog(
        selectedDay: selectedDay,
        sessionsByDay: sessionsByDay,
        onDaySelected: (day) {
          Navigator.pop(ctx);
          onDayChanged(day);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isToday = isSameDay(selectedDay, DateTime.now());
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () => onDayChanged(
                selectedDay.subtract(const Duration(days: 1))),
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            padding: EdgeInsets.zero,
          ),
          GestureDetector(
            onTap: () => _openCalendar(context),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Text(
                _label(),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: context.brandPrimary,
                    ),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: isToday
                ? null
                : () => onDayChanged(selectedDay.add(const Duration(days: 1))),
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            padding: EdgeInsets.zero,
          ),
          IconButton(
            icon: const Icon(Icons.calendar_month_outlined, size: 20),
            onPressed: () => _openCalendar(context),
            tooltip: 'Abrir calendário',
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }
}

// ─── Calendar Dialog ──────────────────────────────────────────────────────────

class _CalendarDialog extends StatefulWidget {
  const _CalendarDialog({
    required this.selectedDay,
    required this.sessionsByDay,
    required this.onDaySelected,
  });

  final DateTime selectedDay;
  final Map<String, List<WorkoutSession>> sessionsByDay;
  final void Function(DateTime) onDaySelected;

  @override
  State<_CalendarDialog> createState() => _CalendarDialogState();
}

class _CalendarDialogState extends State<_CalendarDialog> {
  late DateTime _focused;

  static String _dateKey(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  void initState() {
    super.initState();
    _focused = widget.selectedDay;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 12, 8, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TableCalendar<WorkoutSession>(
              firstDay: DateTime.utc(2020, 1, 1),
              lastDay: DateTime.now(),
              focusedDay: _focused,
              locale: 'pt_BR',
              selectedDayPredicate: (day) => isSameDay(widget.selectedDay, day),
              onDaySelected: (selected, focused) {
                widget.onDaySelected(selected);
              },
              onPageChanged: (focused) =>
                  setState(() => _focused = focused),
              eventLoader: (day) =>
                  widget.sessionsByDay[_dateKey(day)] ?? [],
              calendarStyle: CalendarStyle(
                todayDecoration: BoxDecoration(
                  color: context.brandPrimary.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
                selectedDecoration: BoxDecoration(
                  color: context.brandPrimary,
                  shape: BoxShape.circle,
                ),
                markerDecoration: BoxDecoration(
                  color: context.brandPrimary,
                  shape: BoxShape.circle,
                ),
                outsideDaysVisible: false,
              ),
              headerStyle: const HeaderStyle(
                formatButtonVisible: false,
                titleCentered: true,
              ),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Fechar'),
            ),
          ],
        ),
      ),
    );
  }
}

class _DaySessionCard extends StatelessWidget {
  const _DaySessionCard({required this.session});
  final WorkoutSession session;

  IconData _icon() {
    if (session.exercises.any((e) => e.isCrossFit))   return Icons.sports_gymnastics;
    if (session.exercises.any((e) => e.isCardio))     return Icons.directions_run;
    return Icons.fitness_center;
  }

  Color _color(BuildContext context) {
    if (session.exercises.any((e) => e.isCrossFit))   return const Color(0xFFFF6D00);
    if (session.exercises.any((e) => e.isCardio))     return Colors.pinkAccent;
    return context.brandPrimary;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _color(context);
    final bpm   = session.effectiveAvgBpm;
    final kcal  = session.totalKcalBurned;
    final vol   = session.totalVolume;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(_icon(), size: 18, color: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(session.workoutName,
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w700)),
              ),
              Text(_fmtDuration(session.durationSeconds),
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
            ],
          ),
          if (bpm != null || kcal > 0 || vol > 0) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 16,
              runSpacing: 4,
              children: [
                if (vol > 0)
                  _ChipStat(icon: Icons.bar_chart,             color: color,              label: '${_fmtVolume(vol)} kg'),
                if (bpm != null)
                  _ChipStat(icon: Icons.favorite,              color: Colors.redAccent,   label: '$bpm bpm'),
                if (kcal > 0)
                  _ChipStat(icon: Icons.local_fire_department, color: Colors.orange,      label: '$kcal kcal'),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _ChipStat extends StatelessWidget {
  const _ChipStat({required this.icon, required this.color, required this.label});
  final IconData icon;
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 3),
        Text(label,
            style: Theme.of(context).textTheme.bodySmall
                ?.copyWith(color: color, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

// ─── Tab: Musculação ──────────────────────────────────────────────────────────

class _MusculacaoTab extends StatefulWidget {
  const _MusculacaoTab({required this.data, required this.analytics});
  final MusculacaoAnalytics data;
  final FullAnalytics analytics;

  @override
  State<_MusculacaoTab> createState() => _MusculacaoTabState();
}

class _MusculacaoTabState extends State<_MusculacaoTab> {
  int _section = 0; // 0=Resumo 1=PRs 2=Grupos 3=Histórico 4=Evolução

  @override
  Widget build(BuildContext context) {
    if (widget.data.totalSessions == 0) {
      return const _EmptyState(
        icon: Icons.fitness_center,
        message: 'Nenhum treino de musculação registrado ainda.',
      );
    }

    return Column(
      children: [
        _SectionChips(
          selected: _section,
          onSelected: (i) => setState(() => _section = i),
          labels: const ['Resumo', 'PRs', 'Grupos', 'Histórico', 'Evolução'],
        ),
        Expanded(child: _buildSection()),
      ],
    );
  }

  Widget _buildSection() {
    final data = widget.data;
    final cmp  = widget.analytics.periodComparison;
    switch (_section) {
      // ── Resumo ──────────────────────────────────────────────────────────
      case 0:
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            _StatRow(stats: [
              _Stat('Sessões',     '${data.totalSessions}',      Icons.fitness_center),
              _Stat('Volume',      _fmtVolume(data.totalVolume), Icons.bar_chart),
              _Stat('Consistência','${data.consistencyScore}%',  Icons.track_changes,
                  color: _consistencyColor(data.consistencyScore)),
            ]),
            if (data.avgBpm != null || data.totalKcal > 0) ...[
              const SizedBox(height: 12),
              _StatRow(stats: [
                if (data.avgBpm != null)
                  _Stat('FC Média', '${data.avgBpm} bpm', Icons.favorite, color: Colors.redAccent),
                if (data.totalKcal > 0)
                  _Stat('Kcal Total', '${data.totalKcal}', Icons.local_fire_department, color: Colors.orange),
              ]),
            ],
            const SizedBox(height: 20),
            Row(children: [
              Expanded(child: _PRHighlightCard(
                label: 'Melhor Sessão',
                value: _fmtVolume(data.prBestSessionVolume),
                unit: 'kg total',
                icon: Icons.emoji_events_rounded,
              )),
              const SizedBox(width: 10),
              Expanded(child: _PRHighlightCard(
                label: 'Máx. Séries',
                value: '${data.prMaxSets}',
                unit: 'num treino',
                icon: Icons.repeat_rounded,
              )),
            ]),
            // Period comparison
            if (cmp.currentMuscSessions > 0 || cmp.lastMuscSessions > 0) ...[
              const SizedBox(height: 20),
              _PeriodComparisonCard(
                title: 'Este mês vs mês passado',
                rows: [
                  _PeriodRow(
                    label: 'Volume',
                    current: _fmtVolume(cmp.currentVolume) + ' kg',
                    last: _fmtVolume(cmp.lastVolume) + ' kg',
                    deltaPct: cmp.volumeDeltaPct,
                  ),
                  _PeriodRow(
                    label: 'Treinos',
                    current: '${cmp.currentMuscSessions}',
                    last: '${cmp.lastMuscSessions}',
                    deltaPct: cmp.lastMuscSessions > 0
                        ? (cmp.muscSessionsDelta / cmp.lastMuscSessions * 100)
                        : (cmp.currentMuscSessions > 0 ? 100 : 0),
                  ),
                ],
              ),
            ],
            if (widget.analytics.weeklyVolume.any((w) => w.volume > 0)) ...[
              const SizedBox(height: 20),
              _WeeklyVolumeChart(points: widget.analytics.weeklyVolume),
            ],
            if (data.rpeVolumeData.length >= 2) ...[
              const SizedBox(height: 20),
              _RpeVolumeChart(points: data.rpeVolumeData),
            ],
          ],
        );

      // ── PRs ─────────────────────────────────────────────────────────────
      case 1:
        if (data.prByMuscleGroup.isEmpty) {
          return const _EmptyState(
            icon: Icons.emoji_events_outlined,
            message: 'Registe pesos nos treinos para ver seus records.',
          );
        }
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: data.prByMuscleGroup.entries.map((entry) =>
            _MuscleGroupPRExpansion(
              group: entry.key,
              exercises: entry.value,
              sessions: data.recentSessions,
            ),
          ).toList(),
        );

      // ── Grupos ──────────────────────────────────────────────────────────
      case 2:
        if (data.muscleGroups.isEmpty) {
          return const _EmptyState(
            icon: Icons.bar_chart,
            message: 'Sem dados de grupos musculares ainda.',
          );
        }
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            _MuscleVolumeBarChart(groups: data.muscleGroups),
            const SizedBox(height: 16),
            _MuscleGroupDetailGrid(groups: data.muscleGroups),
          ],
        );

      // ── Histórico ───────────────────────────────────────────────────────
      case 3:
        if (data.recentSessions.isEmpty) {
          return const _EmptyState(
            icon: Icons.history,
            message: 'Nenhuma sessão recente.',
          );
        }
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: data.recentSessions.map((s) {
            final muscExercises = s.exercises.where((e) => !e.isCardio).toList();
            final exCount = muscExercises.length;
            return _RecentSessionTile(
              session: s,
              trailing: '${_fmtVolume(s.totalVolume)} kg',
              trailingLabel: _fmtDuration(s.durationSeconds),
              icon: Icons.fitness_center,
              iconColor: context.brandPrimary,
              subtitle: exCount > 0 ? '$exCount exercício${exCount != 1 ? 's' : ''}' : null,
              onStory: () => showStoryFromSession(context, s),
            );
          }).toList(),
        );

      // ── Evolução de Carga ────────────────────────────────────────────────
      default:
        return _ExerciseEvolutionSection(
          exerciseHistory: widget.analytics.exerciseHistory,
        );
    }
  }
}

// ─── RPE × Volume chart ───────────────────────────────────────────────────────

class _RpeVolumeChart extends StatelessWidget {
  const _RpeVolumeChart({required this.points});
  final List<RpeVolumePoint> points;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final primary = context.brandPrimary;
    const rpeColor = Color(0xFFFF9800);

    final maxVol = points.fold<double>(0, (m, p) => p.volume > m ? p.volume : m);
    final hasRpe = points.any((p) => p.avgRpe != null);

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Volume × RPE',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                    color: cs.onSurface),
              ),
              const Spacer(),
              // Legend
              _LegendDot(color: primary, label: 'Volume'),
              if (hasRpe) ...[
                const SizedBox(width: 12),
                _LegendDot(color: rpeColor, label: 'RPE médio'),
              ],
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 150,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxVol > 0 ? maxVol * 1.25 : 1,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipItem: (group, _, rod, __) {
                      final p = points[group.x];
                      final dateStr = DateFormat('dd/MM').format(p.date);
                      final volStr = p.volume >= 1000
                          ? '${(p.volume / 1000).toStringAsFixed(1)}t'
                          : '${p.volume.toInt()} kg';
                      final rpeStr = p.avgRpe != null
                          ? '\nRPE ${p.avgRpe!.toStringAsFixed(1)}'
                          : '';
                      return BarTooltipItem(
                        '$dateStr\n$volStr$rpeStr',
                        TextStyle(fontSize: 11, color: cs.onSurface,
                            fontWeight: FontWeight.w600),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  leftTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 20,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i < 0 || i >= points.length) return const SizedBox();
                        // Show label only on first, middle, last
                        final show = i == 0 ||
                            i == points.length - 1 ||
                            i == points.length ~/ 2;
                        if (!show) return const SizedBox();
                        return Text(
                          DateFormat('dd/MM').format(points[i].date),
                          style: TextStyle(
                              fontSize: 9,
                              color: cs.onSurface.withValues(alpha: 0.45)),
                        );
                      },
                    ),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxVol > 0 ? maxVol / 4 : 1,
                  getDrawingHorizontalLine: (_) => FlLine(
                    color: cs.outlineVariant.withValues(alpha: 0.4),
                    strokeWidth: 0.5,
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: points.asMap().entries.map((entry) {
                  final i = entry.key;
                  final p = entry.value;
                  // RPE overlay: scale RPE (1-10) to volume axis
                  final rpeScaled = p.avgRpe != null && maxVol > 0
                      ? (p.avgRpe! / 10) * maxVol
                      : null;
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: p.volume,
                        color: primary.withValues(alpha: 0.75),
                        width: 14,
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(4)),
                      ),
                      if (rpeScaled != null)
                        BarChartRodData(
                          toY: rpeScaled,
                          color: rpeColor.withValues(alpha: 0.85),
                          width: 5,
                          borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(3)),
                        ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
          if (hasRpe)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                'Barra laranja = RPE médio escalado (10 = topo do volume máximo)',
                style: TextStyle(
                    fontSize: 10,
                    color: cs.onSurface.withValues(alpha: 0.4)),
              ),
            ),
        ],
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label,
            style: TextStyle(
                fontSize: 11,
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.6))),
      ],
    );
  }
}

// ─── Muscle group PR expansion ────────────────────────────────────────────────

class _MuscleGroupPRExpansion extends StatelessWidget {
  const _MuscleGroupPRExpansion({
    required this.group,
    required this.exercises,
    required this.sessions,
  });
  final String group;
  final List<ExercisePR> exercises;
  final List<WorkoutSession> sessions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    // show top PR weight as subtitle
    final topWeight = exercises.isNotEmpty ? exercises.first.bestWeight : 0.0;
    final topWeightStr = topWeight % 1 == 0
        ? '${topWeight.toInt()} kg'
        : '$topWeight kg';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
          childrenPadding: EdgeInsets.zero,
          title: Text(group,
              style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w700, color: context.brandPrimary)),
          subtitle: Text('${exercises.length} exercícios · melhor: $topWeightStr',
              style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.45))),
          children: [
            const Divider(height: 1, thickness: 1),
            ...exercises.map((pr) => _ExercisePRRow(pr: pr, sessions: sessions)),
          ],
        ),
      ),
    );
  }
}

class _ExercisePRRow extends StatelessWidget {
  const _ExercisePRRow({required this.pr, required this.sessions});
  final ExercisePR pr;
  final List<WorkoutSession> sessions;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final dateStr = DateFormat('dd/MM/yy').format(pr.date);

    return InkWell(
      onTap: () => showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (_) => _ExerciseHistorySheet(pr: pr, sessions: sessions),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        child: Row(
          children: [
            Expanded(
              child: Text(
                pr.exerciseName,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Text(
              '${pr.bestWeight % 1 == 0 ? pr.bestWeight.toInt() : pr.bestWeight} kg',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: context.brandPrimary,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              dateStr,
              style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.4)),
            ),
            const SizedBox(width: 6),
            Icon(Icons.chevron_right, size: 16, color: cs.onSurface.withValues(alpha: 0.3)),
          ],
        ),
      ),
    );
  }
}

// ─── Exercise history sheet ───────────────────────────────────────────────────

class _ExerciseHistorySheet extends StatelessWidget {
  const _ExerciseHistorySheet({required this.pr, required this.sessions});
  final ExercisePR pr;
  final List<WorkoutSession> sessions;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // Build history: one entry per session that contains this exercise
    final history = <({DateTime date, String sessionName, List<SessionSet> sets})>[];
    for (final s in sessions) {
      for (final e in s.exercises) {
        if (e.exerciseDefinitionId == pr.exerciseDefinitionId && !e.isCardio) {
          history.add((date: s.createdAt, sessionName: s.workoutName, sets: e.sets));
        }
      }
    }
    history.sort((a, b) => b.date.compareTo(a.date));

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      expand: false,
      builder: (_, controller) => Column(
        children: [
          // Handle
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 8),
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: cs.onSurface.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        pr.exerciseName,
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: context.brandPrimary,
                        ),
                      ),
                      Text(
                        '${pr.timesPerformed} execuções · PR: ${pr.bestWeight % 1 == 0 ? pr.bestWeight.toInt() : pr.bestWeight} kg',
                        style: TextStyle(
                          fontSize: 12,
                          color: cs.onSurface.withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: cs.outlineVariant),
          // History list
          Expanded(
            child: history.isEmpty
                ? Center(
                    child: Text(
                      'Sem histórico disponível',
                      style: TextStyle(color: cs.onSurface.withValues(alpha: 0.45)),
                    ),
                  )
                : ListView.separated(
                    controller: controller,
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                    itemCount: history.length,
                    separatorBuilder: (_, __) =>
                        Divider(height: 20, color: cs.outlineVariant),
                    itemBuilder: (_, i) {
                      final entry = history[i];
                      final sets = entry.sets;
                      final maxWeight = sets.fold<double>(
                          0, (m, s) => s.weight > m ? s.weight : m);
                      final ratedSets =
                          sets.where((s) => s.rpe != null).toList();
                      final avgRpe = ratedSets.isNotEmpty
                          ? ratedSets.fold<double>(
                                  0, (v, s) => v + s.rpe!) /
                              ratedSets.length
                          : null;

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                DateFormat('dd/MM/yy').format(entry.date),
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  entry.sessionName,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: cs.onSurface.withValues(alpha: 0.45),
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (avgRpe != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: _rpeColor(avgRpe)
                                        .withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'RPE ${avgRpe % 1 == 0 ? avgRpe.toInt() : avgRpe.toStringAsFixed(1)}',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: _rpeColor(avgRpe),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: sets.map((s) {
                              final isPeak = s.weight == maxWeight && maxWeight > 0;
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isPeak
                                      ? context.brandPrimary.withValues(alpha: 0.1)
                                      : cs.surfaceContainerLow,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isPeak
                                        ? context.brandPrimary.withValues(alpha: 0.4)
                                        : cs.outlineVariant,
                                    width: 0.5,
                                  ),
                                ),
                                child: Text(
                                  '${s.reps}× ${s.weight % 1 == 0 ? s.weight.toInt() : s.weight}kg'
                                  '${s.rpe != null ? ' · ${s.rpe}' : ''}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: isPeak
                                        ? FontWeight.w700
                                        : FontWeight.w400,
                                    color: isPeak
                                        ? context.brandPrimary
                                        : cs.onSurface.withValues(alpha: 0.75),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Color _rpeColor(double rpe) {
    if (rpe <= 4) return const Color(0xFF4CAF50);
    if (rpe <= 6) return const Color(0xFFFFC107);
    if (rpe <= 8) return const Color(0xFFFF9800);
    return const Color(0xFFF44336);
  }
}

// ─── Tab: Cardio ──────────────────────────────────────────────────────────────

class _CardioTab extends StatefulWidget {
  const _CardioTab({required this.data, required this.analytics});
  final CardioAnalytics data;
  final FullAnalytics analytics;

  @override
  State<_CardioTab> createState() => _CardioTabState();
}

class _CardioTabState extends State<_CardioTab> {
  int _section = 0; // 0=Resumo 1=PRs 2=Modalidades 3=Sessões

  static const _cardioColor = Color(0xFFE53935);

  @override
  Widget build(BuildContext context) {
    if (widget.data.totalSessions == 0) {
      return const _EmptyState(
        icon: Icons.directions_run,
        message: 'Nenhuma sessão de cardio registrada ainda.',
      );
    }

    return Column(
      children: [
        _SectionChips(
          selected: _section,
          onSelected: (i) => setState(() => _section = i),
          labels: const ['Resumo', 'PRs', 'Modalidades', 'Sessões'],
        ),
        Expanded(child: _buildSection()),
      ],
    );
  }

  Widget _buildSection() {
    final data = widget.data;
    switch (_section) {
      // ── Resumo ──────────────────────────────────────────────────────────
      case 0:
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            _StatRow(stats: [
              _Stat('Sessões',    '${data.totalSessions}',
                  Icons.directions_run, color: _cardioColor),
              _Stat('Distância',
                  '${data.totalDistanceKm.toStringAsFixed(1)} km',
                  Icons.route, color: _cardioColor),
              _Stat('Tempo Total',
                  _fmtDuration(data.totalDurationSeconds),
                  Icons.timer_outlined, color: _cardioColor),
            ]),
            if (data.avgBpm != null || data.totalKcal > 0) ...[
              const SizedBox(height: 12),
              _StatRow(stats: [
                if (data.avgBpm != null)
                  _Stat('FC Média', '${data.avgBpm} bpm',
                      Icons.favorite, color: Colors.redAccent),
                if (data.maxBpm != null)
                  _Stat('FC Máxima', '${data.maxBpm} bpm',
                      Icons.favorite, color: Colors.red.shade800),
                if (data.totalKcal > 0)
                  _Stat('Kcal Total', '${data.totalKcal}',
                      Icons.local_fire_department, color: Colors.orange),
              ]),
            ],
            const SizedBox(height: 20),
            Row(children: [
              Expanded(child: _PRHighlightCard(
                label: 'Melhor Sessão',
                value: data.prBestDistance?.distanceKm != null
                    ? '${data.prBestDistance!.distanceKm!.toStringAsFixed(2)} km'
                    : _fmtDuration(data.prBestDuration?.durationSeconds ?? 0),
                unit: data.prBestDistance != null ? 'distância' : 'duração',
                icon: Icons.emoji_events_rounded,
              )),
              const SizedBox(width: 10),
              Expanded(child: _PRHighlightCard(
                label: 'Melhor Pace',
                value: data.prBestPace != null
                    ? _fmtPace(data.prBestPace!.paceSecondsPerKm)
                    : '—',
                unit: 'min/km',
                icon: Icons.speed_rounded,
              )),
            ]),
            // Period comparison
            () {
              final cmp = widget.analytics.periodComparison;
              if (cmp.currentCardioSessions == 0 && cmp.lastCardioSessions == 0) return const SizedBox();
              return Padding(
                padding: const EdgeInsets.only(top: 20),
                child: _PeriodComparisonCard(
                  title: 'Este mês vs mês passado',
                  rows: [
                    _PeriodRow(
                      label: 'Distância',
                      current: '${cmp.currentDistanceKm.toStringAsFixed(1)} km',
                      last: '${cmp.lastDistanceKm.toStringAsFixed(1)} km',
                      deltaPct: cmp.distanceDeltaPct,
                    ),
                    _PeriodRow(
                      label: 'Treinos',
                      current: '${cmp.currentCardioSessions}',
                      last: '${cmp.lastCardioSessions}',
                      deltaPct: cmp.lastCardioSessions > 0
                          ? (cmp.cardioSessionsDelta / cmp.lastCardioSessions * 100)
                          : (cmp.currentCardioSessions > 0 ? 100 : 0),
                    ),
                  ],
                ),
              );
            }(),
          ],
        );

      // ── PRs ─────────────────────────────────────────────────────────────
      case 1:
        final hasPRs = data.prBestDistance != null ||
            data.prBestDuration != null ||
            data.prBestPace != null ||
            data.prBestRowPace != null ||
            data.prBestSpeed != null;
        if (!hasPRs) {
          return const _EmptyState(
            icon: Icons.emoji_events_outlined,
            message: 'Registre distância ou duração nas sessões para ver seus records.',
          );
        }
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            if (data.prBestDistance != null)
              _CardioSessionPRCard(
                icon: Icons.route_rounded,
                label: 'Maior Distância',
                value: '${data.prBestDistance!.distanceKm?.toStringAsFixed(2) ?? '-'} km',
                sub: _cardioSubInfo(data.prBestDistance!),
                date: data.prBestDistance!.date,
                color: _cardioColor,
              ),
            if (data.prBestDuration != null)
              _CardioSessionPRCard(
                icon: Icons.timer_rounded,
                label: 'Maior Duração',
                value: _fmtDuration(data.prBestDuration!.durationSeconds ?? 0),
                sub: _cardioSubInfo(data.prBestDuration!),
                date: data.prBestDuration!.date,
                color: _cardioColor,
              ),
            if (data.prBestPace != null)
              _CardioSessionPRCard(
                icon: Icons.speed_rounded,
                label: 'Melhor Pace',
                value: _fmtPace(data.prBestPace!.paceSecondsPerKm),
                sub: data.prBestPace!.distanceKm != null
                    ? '${data.prBestPace!.distanceKm!.toStringAsFixed(2)} km · Corrida'
                    : 'Corrida',
                date: data.prBestPace!.date,
                color: _cardioColor,
              ),
            if (data.prBestRowPace != null)
              _CardioSessionPRCard(
                icon: Icons.rowing_rounded,
                label: 'Melhor Pace (Remo)',
                value: _fmtPace(data.prBestRowPace!.paceSecondsPerKm),
                sub: _cardioSubInfo(data.prBestRowPace!),
                date: data.prBestRowPace!.date,
                color: _cardioColor,
              ),
            if (data.prBestSpeed != null)
              _CardioSessionPRCard(
                icon: Icons.pedal_bike_rounded,
                label: 'Maior Velocidade',
                value: data.prBestSpeed!.label,
                sub: _cardioSubInfo(data.prBestSpeed!),
                date: data.prBestSpeed!.date,
                color: _cardioColor,
              ),
          ],
        );

      // ── Modalidades ──────────────────────────────────────────────────────
      case 2:
        if (data.bySubtype.isEmpty) {
          return const _EmptyState(
            icon: Icons.category_outlined,
            message: 'Sem dados de modalidades ainda.',
          );
        }
        final sorted = data.bySubtype.entries.toList()
          ..sort((a, b) => b.value.compareTo(a.value));
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: sorted.map((e) => _CountRow(
            label: e.key,
            count: e.value,
            unit: 'sessões',
            color: _cardioColor,
          )).toList(),
        );

      // ── Sessões ──────────────────────────────────────────────────────────
      default:
        if (data.recentSessions.isEmpty) {
          return const _EmptyState(
            icon: Icons.history,
            message: 'Nenhuma sessão recente.',
          );
        }
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: data.recentSessions.map((s) {
            final dist = s.totalDistanceKm;
            final dur  = s.totalCardioSeconds;
            final bpm  = s.sessionAvgBpm;
            final kcal = s.totalKcalBurned;
            final trailing = dist > 0
                ? '${dist.toStringAsFixed(2)} km'
                : _fmtDuration(dur);
            final sub = [
              if (bpm != null) '❤ ${bpm}bpm',
              if (kcal > 0) '🔥 ${kcal}kcal',
            ].join('  ');
            final cardioExercises =
                s.exercises.where((e) => e.isCardio).toList();
            final exerciseNames = cardioExercises
                .map((e) => e.exerciseName)
                .toSet()
                .join(' · ');
            return _RecentSessionTile(
              session: s,
              trailing: trailing,
              trailingLabel: sub.isNotEmpty ? sub : _fmtDuration(dur),
              icon: Icons.directions_run,
              iconColor: _cardioColor,
              subtitle: exerciseNames.isNotEmpty ? exerciseNames : null,
              onStory: cardioExercises.isEmpty
                  ? null
                  : () => showCardioStoryFromSession(
                        context,
                        cardioExercises: cardioExercises,
                        sessionDate: s.createdAt,
                      ),
            );
          }).toList(),
        );
    }
  }

  String _cardioSubInfo(CardioSessionPR pr) {
    final parts = <String>[];
    if (pr.distanceKm != null && pr.distanceKm! > 0) {
      parts.add('${pr.distanceKm!.toStringAsFixed(2)} km');
    }
    parts.add(pr.label);
    return parts.join(' · ');
  }
}

class _CardioSessionPRCard extends StatelessWidget {
  const _CardioSessionPRCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.sub,
    required this.date,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final String sub;
  final DateTime date;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12,
                    color: cs.onSurface.withValues(alpha: 0.5))),
                const SizedBox(height: 1),
                Text(sub, style: TextStyle(fontSize: 11,
                    color: cs.onSurface.withValues(alpha: 0.4))),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(value, style: TextStyle(
                  fontSize: 17, fontWeight: FontWeight.w800, color: color)),
              Text(DateFormat('dd/MM/yy').format(date),
                  style: TextStyle(fontSize: 11,
                      color: cs.onSurface.withValues(alpha: 0.4))),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Tab: CrossFit ────────────────────────────────────────────────────────────

class _CrossFitTab extends StatelessWidget {
  const _CrossFitTab({required this.data});
  final CrossFitAnalytics data;

  @override
  Widget build(BuildContext context) {
    if (data.totalSessions == 0) {
      return const _EmptyState(
        icon: Icons.sports_gymnastics,
        message: 'Nenhum WOD registrado ainda.',
      );
    }

    const cfColor = Color(0xFFFF6D00);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        // ── Resumo ──────────────────────────────────────────────────────────
        _StatRow(stats: [
          _Stat('WODs',       '${data.totalSessions}',               Icons.sports_gymnastics, color: cfColor),
          _Stat('Freq./sem',  '${data.weeklyFrequency.toStringAsFixed(1)}×', Icons.repeat,    color: cfColor),
          _Stat('Consistência','${data.consistencyScore}%',           Icons.track_changes,
              color: _consistencyColor(data.consistencyScore)),
        ]),

        if (data.avgBpm != null || data.totalKcal > 0) ...[
          const SizedBox(height: 12),
          _StatRow(stats: [
            if (data.avgBpm != null)
              _Stat('FC Média', '${data.avgBpm} bpm', Icons.favorite, color: Colors.redAccent),
            if (data.totalKcal > 0)
              _Stat('Kcal Total', '${data.totalKcal}', Icons.local_fire_department, color: Colors.orange),
          ]),
        ],

        const SizedBox(height: 24),

        // ── Records Pessoais ─────────────────────────────────────────────────
        const _SectionHeader('🏆 Records Pessoais'),
        const SizedBox(height: 12),

        if (data.prBestForTime != null)
          _CFPRCard(
            icon: Icons.timer_rounded,
            label: 'Melhor For Time',
            wod: data.prBestForTime!.$1,
            value: _fmtDuration(data.prBestForTime!.$2),
            date: data.prBestForTime!.$3,
            color: cfColor,
          ),

        if (data.prBestAmrap != null)
          _CFPRCard(
            icon: Icons.loop_rounded,
            label: 'Melhor AMRAP',
            wod: data.prBestAmrap!.$1,
            value: '${data.prBestAmrap!.$2} rounds',
            date: data.prBestAmrap!.$3,
            color: cfColor,
          ),

        if (data.prBestForTime == null && data.prBestAmrap == null)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text('Complete WODs com duração ou rounds registrados para ver seus records.',
                style: TextStyle(fontSize: 13)),
          ),

        const SizedBox(height: 24),

        // ── Formatos ─────────────────────────────────────────────────────────
        if (data.wodFormatCounts.isNotEmpty)
          _ExpansionSection(
            title: '📋 Formatos de WOD',
            children: data.wodFormatCounts.entries
                .toList()
                .sortedByDescending((e) => e.value)
                .map((e) => _CountRow(
                      label: e.key,
                      count: e.value,
                      unit: 'WODs',
                      color: cfColor,
                    ))
                .toList(),
          ),

        // ── Top Movimentos ────────────────────────────────────────────────────
        if (data.topMovements.isNotEmpty)
          _ExpansionSection(
            title: '⚡ Top Movimentos',
            children: [_TopMovementsCard(movements: data.topMovements, color: cfColor)],
          ),

        // ── Sessões Recentes ─────────────────────────────────────────────────
        if (data.recentSessions.isNotEmpty)
          _ExpansionSection(
            title: '📅 Sessões Recentes',
            children: data.recentSessions.map((s) {
              final cfExercises = s.exercises.where((e) => e.isCrossFit);
              final format = cfExercises.isNotEmpty
                  ? _wodFormatLabel(cfExercises.first.wodFormat)
                  : '';
              return _RecentSessionTile(
                session: s,
                trailing: format,
                trailingLabel: _fmtDuration(s.durationSeconds),
                icon: Icons.sports_gymnastics,
                iconColor: cfColor,
              );
            }).toList(),
          ),

        const SizedBox(height: 16),
      ],
    );
  }
}

String _wodFormatLabel(String? format) {
  switch (format) {
    case 'amrap':   return 'AMRAP';
    case 'forTime': return 'For Time';
    case 'emom':    return 'EMOM';
    case 'tabata':  return 'Tabata';
    default:        return 'WOD';
  }
}

class _CFPRCard extends StatelessWidget {
  const _CFPRCard({
    required this.icon,
    required this.label,
    required this.wod,
    required this.value,
    required this.date,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String wod;
  final String value;
  final DateTime date;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12,
                    color: cs.onSurface.withValues(alpha: 0.5))),
                const SizedBox(height: 1),
                Text(wod, style: const TextStyle(fontSize: 13,
                    fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(value, style: TextStyle(
                  fontSize: 15, fontWeight: FontWeight.w800, color: color)),
              Text(DateFormat('dd/MM/yy').format(date),
                  style: TextStyle(fontSize: 11,
                      color: cs.onSurface.withValues(alpha: 0.4))),
            ],
          ),
        ],
      ),
    );
  }
}

class _TopMovementsCard extends StatelessWidget {
  const _TopMovementsCard({required this.movements, required this.color});
  final List<(String, int)> movements;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final maxCount = movements.isEmpty ? 1 : movements.first.$2;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      child: Column(
        children: movements.asMap().entries.map((entry) {
          final i = entry.key;
          final (name, count) = entry.value;
          final pct = maxCount > 0 ? count / maxCount : 0.0;

          return Padding(
            padding: EdgeInsets.only(bottom: i < movements.length - 1 ? 10 : 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(name,
                          style: const TextStyle(fontSize: 13,
                              fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis),
                    ),
                    Text('$count×',
                        style: TextStyle(fontSize: 13,
                            fontWeight: FontWeight.w700, color: color)),
                  ],
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: pct,
                    minHeight: 4,
                    backgroundColor: color.withValues(alpha: 0.12),
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ─── Section Chips (Musculação internal nav) ──────────────────────────────────

class _SectionChips extends StatelessWidget {
  const _SectionChips({
    required this.selected,
    required this.onSelected,
    required this.labels,
  });

  final int selected;
  final ValueChanged<int> onSelected;
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: labels.asMap().entries.map((entry) {
            final i = entry.key;
            final label = entry.value;
            final isSelected = i == selected;
            return Padding(
              padding: EdgeInsets.only(right: i < labels.length - 1 ? 8 : 0),
              child: ChoiceChip(
                label: Text(label),
                selected: isSelected,
                onSelected: (_) => onSelected(i),
                labelStyle: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isSelected
                      ? cs.onPrimary
                      : cs.onSurface.withValues(alpha: 0.7),
                ),
                selectedColor: context.brandPrimary,
                backgroundColor: cs.surfaceContainerHighest,
                side: BorderSide.none,
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ─── ExpansionSection (collapsible section wrapper) ───────────────────────────

class _ExpansionSection extends StatelessWidget {
  const _ExpansionSection({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            title: Text(title,
                style: theme.textTheme.titleSmall
                    ?.copyWith(fontWeight: FontWeight.w700)),
            expandedCrossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ),
    );
  }
}

// ─── Shared Widgets ───────────────────────────────────────────────────────────

class _Stat {
  final String label;
  final String value;
  final IconData icon;
  final Color? color;
  const _Stat(this.label, this.value, this.icon, {this.color});
}

class _StatRow extends StatelessWidget {
  const _StatRow({required this.stats});
  final List<_Stat> stats;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: stats.asMap().entries.map((entry) {
        final i = entry.key;
        final s = entry.value;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(left: i > 0 ? 8 : 0),
            child: _StatCard(stat: s),
          ),
        );
      }).toList(),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.stat});
  final _Stat stat;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final color = stat.color ?? context.brandPrimary;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(5),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(7),
            ),
            child: Icon(stat.icon, size: 14, color: color),
          ),
          const SizedBox(height: 8),
          Text(
            stat.value,
            style: TextStyle(
                fontSize: 16, fontWeight: FontWeight.w800, color: color),
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 1),
          Text(
            stat.label,
            style: TextStyle(
                fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5)),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context)
          .textTheme
          .titleMedium
          ?.copyWith(fontWeight: FontWeight.w700),
    );
  }
}


class _PRHighlightCard extends StatelessWidget {
  const _PRHighlightCard({
    required this.label,
    required this.value,
    required this.unit,
    required this.icon,
  });

  final String label;
  final String value;
  final String unit;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    const gold = Color(0xFFFFB300);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: gold.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, size: 16, color: gold),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 11,
                color: cs.onSurface.withValues(alpha: 0.55))),
          ]),
          const SizedBox(height: 8),
          Text(value,
              style: const TextStyle(
                  fontSize: 20, fontWeight: FontWeight.w800, color: gold)),
          Text(unit,
              style: TextStyle(fontSize: 11,
                  color: cs.onSurface.withValues(alpha: 0.4))),
        ],
      ),
    );
  }
}


class _CountRow extends StatelessWidget {
  const _CountRow({
    required this.label,
    required this.count,
    required this.unit,
    required this.color,
  });

  final String label;
  final int count;
  final String unit;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(label,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          ),
          Text('$count',
              style: TextStyle(
                  fontSize: 15, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(width: 4),
          Text(unit,
              style: TextStyle(
                  fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
        ],
      ),
    );
  }
}

class _RecentSessionTile extends StatelessWidget {
  const _RecentSessionTile({
    required this.session,
    required this.trailing,
    required this.trailingLabel,
    required this.icon,
    required this.iconColor,
    this.subtitle,
    this.onStory,
  });

  final WorkoutSession session;
  final String trailing;
  final String trailingLabel;
  final IconData icon;
  final Color iconColor;
  final String? subtitle;
  final VoidCallback? onStory;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final dateStr = DateFormat('dd/MM/yy').format(session.createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: iconColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: Icon(icon, size: 18, color: iconColor),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(session.workoutName,
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                          overflow: TextOverflow.ellipsis),
                      if (subtitle != null)
                        Text(subtitle!,
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: iconColor.withValues(alpha: 0.85)),
                            overflow: TextOverflow.ellipsis),
                      Text(dateStr,
                          style: TextStyle(
                              fontSize: 11,
                              color: cs.onSurface.withValues(alpha: 0.45))),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(trailing,
                        style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: iconColor)),
                    Text(trailingLabel,
                        style: TextStyle(
                            fontSize: 11,
                            color: cs.onSurface.withValues(alpha: 0.45))),
                  ],
                ),
              ],
            ),
          ),
          if (onStory != null) ...[
            Divider(height: 1, color: cs.outline.withValues(alpha: 0.2)),
            InkWell(
              onTap: onStory,
              borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(12)),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.auto_awesome,
                        size: 14,
                        color: const Color(0xFF00D2A0)),
                    const SizedBox(width: 6),
                    const Text(
                      'Ver template',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF00D2A0),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Muscle Group Bar Chart ───────────────────────────────────────────────────

const _kMuscleShortNames = <String, String>{
  'Quadriceps': 'Quad',
  'Quadríceps': 'Quad',
  'Bíceps': 'Bíceps',
  'Tríceps': 'Tríceps',
  'Peitoral': 'Peito',
  'Ombros': 'Ombros',
  'Trapézio': 'Trap',
  'Panturrilha': 'Pant',
  'Antebraço': 'Anteb',
  'Abdominais': 'Abdom',
  'Oblíquos': 'Oblíq',
  'Lombar': 'Lombar',
  'Glúteos': 'Glúteo',
  'Isquiotibiais': 'Isquio',
  'Costas': 'Costas',
  'Dorsais': 'Dorsal',
};

String _muscleShortName(String name) {
  return _kMuscleShortNames[name] ?? (name.length > 7 ? name.substring(0, 7) : name);
}

const _kGroupColors = [
  Color(0xFF5C6BC0), // indigo
  Color(0xFF26A69A), // teal
  Color(0xFF42A5F5), // blue
  Color(0xFFEF5350), // red
  Color(0xFFAB47BC), // purple
  Color(0xFFFF7043), // deep orange
  Color(0xFF66BB6A), // green
  Color(0xFFFFCA28), // amber
  Color(0xFF26C6DA), // cyan
  Color(0xFFEC407A), // pink
];

class _MuscleVolumeBarChart extends StatelessWidget {
  const _MuscleVolumeBarChart({required this.groups});
  final List<MuscleGroupStats> groups;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final top = groups.take(8).toList();

    // Guard: se todos os volumes são 0 (ex: treinos sem peso), mostra estado vazio
    final maxVol = top.isEmpty
        ? 0.0
        : top.map((m) => m.totalVolume).reduce((a, b) => a > b ? a : b);
    if (maxVol <= 0) {
      return Container(
        height: 80,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
        ),
        child: Text('Registe pesos nos treinos para ver o gráfico',
            style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.4))),
      );
    }

    return Container(
      height: 210,
      padding: const EdgeInsets.fromLTRB(4, 12, 12, 8),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: maxVol * 1.25,
          borderData: FlBorderData(show: false),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (_) => FlLine(
              color: cs.outline.withValues(alpha: 0.15),
              strokeWidth: 1,
            ),
          ),
          titlesData: FlTitlesData(
            topTitles:   const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            leftTitles:  const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 32,
                getTitlesWidget: (value, meta) {
                  final i = value.toInt();
                  if (i < 0 || i >= top.length) return const SizedBox.shrink();
                  final name = top[i].name;
                  final short = _muscleShortName(name);
                  return Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(short,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: 9,
                            color: cs.onSurface.withValues(alpha: 0.55))),
                  );
                },
              ),
            ),
          ),
          barGroups: List.generate(top.length, (i) {
            final color = _kGroupColors[i % _kGroupColors.length];
            return BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: top[i].totalVolume,
                  width: 18.0,
                  color: color,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
                ),
              ],
            );
          }),
          barTouchData: BarTouchData(
            touchTooltipData: BarTouchTooltipData(
              getTooltipColor: (group) =>
                  _kGroupColors[group.x % _kGroupColors.length].withValues(alpha: 0.9),
              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                if (group.x < 0 || group.x >= top.length) return null;
                final vol = rod.toY;
                final label = top[group.x].name;
                final formatted = vol >= 1000
                    ? '${(vol / 1000).toStringAsFixed(1)}k kg'
                    : '${vol.toStringAsFixed(0)} kg';
                return BarTooltipItem(
                  '$label\n$formatted',
                  const TextStyle(
                      color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Muscle Group Detail Grid ─────────────────────────────────────────────────

class _MuscleGroupDetailGrid extends StatelessWidget {
  const _MuscleGroupDetailGrid({required this.groups});
  final List<MuscleGroupStats> groups;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: groups.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.35,
      ),
      itemBuilder: (context, i) {
        final m = groups[i];
        final color = _kGroupColors[i % _kGroupColors.length];
        return _MuscleGroupDetailCard(stats: m, color: color);
      },
    );
  }
}

class _MuscleGroupDetailCard extends StatelessWidget {
  const _MuscleGroupDetailCard({required this.stats, required this.color});
  final MuscleGroupStats stats;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final vol = stats.totalVolume;
    final volStr = vol >= 1000
        ? '${(vol / 1000).toStringAsFixed(1)}k kg'
        : '${vol.toStringAsFixed(0)} kg';
    final intensStr = stats.avgIntensity >= 1000
        ? '${(stats.avgIntensity / 1000).toStringAsFixed(1)}k'
        : stats.avgIntensity.toStringAsFixed(0);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Name + color dot
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  stats.name,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Volume
          Text(volStr,
              style: TextStyle(
                  fontSize: 15, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 2),
          // Metrics row
          Row(
            children: [
              _MiniMetric(
                label: 'exercícios',
                value: '${stats.uniqueExercises}',
                color: cs.onSurface.withValues(alpha: 0.55),
              ),
              const SizedBox(width: 10),
              _MiniMetric(
                label: 'intens./ex',
                value: intensStr,
                color: cs.onSurface.withValues(alpha: 0.55),
              ),
            ],
          ),
          const Spacer(),
          // Balance bar
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${stats.balancePct.toStringAsFixed(1)}% do volume',
                style: TextStyle(
                    fontSize: 9, color: cs.onSurface.withValues(alpha: 0.45)),
              ),
              const SizedBox(height: 3),
              ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: LinearProgressIndicator(
                  value: stats.balancePct / 100,
                  minHeight: 4,
                  backgroundColor: color.withValues(alpha: 0.15),
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniMetric extends StatelessWidget {
  const _MiniMetric({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value,
            style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w600, color: color)),
        Text(label,
            style: TextStyle(fontSize: 8, color: color)),
      ],
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.message, this.action});
  final IconData icon;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56,
                color: context.brandPrimary.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text(message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium),
            if (action != null) ...[
              const SizedBox(height: 20),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

String _fmtVolume(double v) {
  if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}k';
  return v.toStringAsFixed(0);
}

String _fmtDuration(int seconds) {
  final h = seconds ~/ 3600;
  final m = (seconds % 3600) ~/ 60;
  final s = seconds % 60;
  if (h > 0) return '${h}h ${m}m';
  if (m > 0) return '${m}min';
  return '${s}s';
}

String _fmtPace(int? paceSecondsPerKm) {
  if (paceSecondsPerKm == null) return '-';
  final m = paceSecondsPerKm ~/ 60;
  final s = (paceSecondsPerKm % 60).toString().padLeft(2, '0');
  return '$m:$s /km';
}

Color _consistencyColor(int score) {
  if (score >= 70) return AppTheme.teal;
  if (score >= 40) return AppTheme.cyan;
  return Colors.orange;
}

// ─── Extension ────────────────────────────────────────────────────────────────

extension _ListSort<T> on List<T> {
  List<T> sortedByDescending(Comparable Function(T) key) {
    return [...this]..sort((a, b) => key(b).compareTo(key(a)));
  }
}

// ─── Nutrition Analytics Tab ──────────────────────────────────────────────────

class _NutritionAnalyticsTab extends ConsumerWidget {
  const _NutritionAnalyticsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(nutritionStatsProvider);
    return statsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Erro: $e')),
      data: (stats) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _WeightTrendCard(entries: stats.weightEntries),
          const SizedBox(height: 12),
          _AdherenceCard(stats: stats),
          const SizedBox(height: 12),
          _MacroDistributionCard(distribution: stats.macroDistribution),
          const SizedBox(height: 12),
          _StreakCard(stats: stats),
          const SizedBox(height: 12),
          _WeeklyBalanceCard(stats: stats),
        ],
      ),
    );
  }
}

// ─── Weight Trend ─────────────────────────────────────────────────────────────

class _WeightTrendCard extends StatelessWidget {
  const _WeightTrendCard({required this.entries});
  final List<WeightEntry> entries;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('⚖️  Tendência de peso',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            if (entries.length < 2)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Text('Registre pelo menos 2 semanas de peso\npara ver a tendência.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey)),
                ),
              )
            else
              SizedBox(
                height: 160,
                child: LineChart(
                  LineChartData(
                    gridData: const FlGridData(show: false),
                    borderData: FlBorderData(show: false),
                    titlesData: FlTitlesData(
                      leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 40,
                          getTitlesWidget: (v, _) => Text(
                            '${v.toStringAsFixed(0)}kg',
                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                          ),
                        ),
                      ),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 24,
                          interval: 1,
                          getTitlesWidget: (v, _) {
                            final i = v.toInt();
                            if (i < 0 || i >= entries.length) return const SizedBox();
                            final parts = entries[i].date.split('-');
                            return Text(
                              '${parts[2]}/${parts[1]}',
                              style: const TextStyle(fontSize: 9, color: Colors.grey),
                            );
                          },
                        ),
                      ),
                      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    ),
                    lineBarsData: [
                      LineChartBarData(
                        spots: entries.asMap().entries
                            .map((e) => FlSpot(e.key.toDouble(), e.value.weight))
                            .toList(),
                        isCurved: true,
                        color: context.brandPrimary,
                        barWidth: 2.5,
                        dotData: const FlDotData(show: true),
                        belowBarData: BarAreaData(
                          show: true,
                          color: context.brandPrimary.withValues(alpha: 0.1),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─── Adherence ────────────────────────────────────────────────────────────────

class _AdherenceCard extends StatelessWidget {
  const _AdherenceCard({required this.stats});
  final NutritionStats stats;

  @override
  Widget build(BuildContext context) {
    final rate = stats.adherenceRate;
    final color = rate >= 80 ? Colors.green : rate >= 50 ? Colors.orange : Colors.red;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('🎯  Aderência calórica', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text('Dias com ≥90% da meta nos últimos 30 dias',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey)),
            const SizedBox(height: 16),
            Row(
              children: [
                Text('$rate%',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold, color: color)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: rate / 100,
                          minHeight: 8,
                          backgroundColor: color.withValues(alpha: 0.15),
                          valueColor: AlwaysStoppedAnimation(color),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${stats.adherentDays} de ${stats.trackedDays} dias rastreados',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Macro Distribution ───────────────────────────────────────────────────────

class _MacroDistributionCard extends StatelessWidget {
  const _MacroDistributionCard({required this.distribution});
  final MacroDistribution distribution;

  @override
  Widget build(BuildContext context) {
    final total = distribution.protein + distribution.carbs + distribution.fat;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('🍽️  Distribuição de macros',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text('Média dos últimos 30 dias',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey)),
            const SizedBox(height: 16),
            if (total == 0)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Text('Sem dados suficientes',
                      style: TextStyle(color: Colors.grey)),
                ),
              )
            else ...[
              _MacroBar('🥩 Proteína', distribution.protein, const Color(0xFF3B82F6)),
              const SizedBox(height: 8),
              _MacroBar('🍞 Carbs', distribution.carbs, const Color(0xFFF97316)),
              const SizedBox(height: 8),
              _MacroBar('🧈 Gordura', distribution.fat, const Color(0xFF10B981)),
            ],
          ],
        ),
      ),
    );
  }
}

class _MacroBar extends StatelessWidget {
  const _MacroBar(this.label, this.pct, this.color);
  final String label;
  final int pct;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 110,
          child: Text(label, style: Theme.of(context).textTheme.bodySmall),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct / 100,
              minHeight: 10,
              backgroundColor: color.withValues(alpha: 0.15),
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 36,
          child: Text('$pct%',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600),
              textAlign: TextAlign.end),
        ),
      ],
    );
  }
}

// ─── Streak ───────────────────────────────────────────────────────────────────

class _StreakCard extends StatelessWidget {
  const _StreakCard({required this.stats});
  final NutritionStats stats;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('🔥  Consistência', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text('Dias consecutivos atingindo ≥90% da meta calórica',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _StreakItem(
                    label: 'Streak atual',
                    value: stats.streak,
                    color: stats.streak > 0 ? Colors.orange : Colors.grey,
                  ),
                ),
                Container(width: 1, height: 48, color: Colors.grey.shade200),
                Expanded(
                  child: _StreakItem(
                    label: 'Melhor streak',
                    value: stats.bestStreak,
                    color: context.brandPrimary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StreakItem extends StatelessWidget {
  const _StreakItem({required this.label, required this.value, required this.color});
  final String label;
  final int value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('$value',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold, color: color)),
        Text(value == 1 ? 'dia' : 'dias',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color)),
        const SizedBox(height: 4),
        Text(label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
            textAlign: TextAlign.center),
      ],
    );
  }
}

// ─── Weekly Balance ───────────────────────────────────────────────────────────

class _WeeklyBalanceCard extends StatelessWidget {
  const _WeeklyBalanceCard({required this.stats});
  final NutritionStats stats;

  @override
  Widget build(BuildContext context) {
    final pct = stats.weekGoal > 0
        ? (stats.weekConsumed / stats.weekGoal).clamp(0.0, 1.0)
        : 0.0;
    final diff = stats.weekConsumed - stats.weekGoal;
    final color = diff <= 0 ? Colors.green : Colors.red;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('📊  Balanço semanal', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text('Calorias consumidas vs. meta × 7 dias',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey)),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${stats.weekConsumed} kcal',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 8),
                Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: Text(
                    'de ${stats.weekGoal} kcal',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: pct,
                minHeight: 10,
                backgroundColor: context.brandPrimary.withValues(alpha: 0.12),
                valueColor: AlwaysStoppedAnimation(context.brandPrimary),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              diff <= 0
                  ? '${(-diff).round()} kcal abaixo da meta semanal'
                  : '${diff.round()} kcal acima da meta semanal',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: color, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PREMIUM ANALYTICS WIDGETS ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Smart Insights ──────────────────────────────────────────────────────────

class _SmartInsightsCard extends StatelessWidget {
  const _SmartInsightsCard({required this.insights});
  final List<SmartInsight> insights;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: cs.outline.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
              child: Row(
                children: [
                  const Text('✨', style: TextStyle(fontSize: 16)),
                  const SizedBox(width: 6),
                  Text('Insights',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const Divider(height: 1),
            ...insights.map((insight) => _InsightRow(insight: insight)),
          ],
        ),
      ),
    );
  }
}

class _InsightRow extends StatelessWidget {
  const _InsightRow({required this.insight});
  final SmartInsight insight;

  @override
  Widget build(BuildContext context) {
    final color = insight.color(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 4,
            height: 36,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Text(insight.emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              insight.message,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.85)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Annual Heat Map ──────────────────────────────────────────────────────────

class _AnnualHeatMap extends StatelessWidget {
  const _AnnualHeatMap({required this.activity});
  final Map<String, int> activity;

  static String _key(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final primary = context.brandPrimary;
    final now = DateTime.now();

    // Build 52 weeks × 7 days grid ending today
    final endDate = DateTime(now.year, now.month, now.day);
    final startDate = endDate.subtract(const Duration(days: 364));

    final List<List<DateTime?>> weeks = [];
    // Align to Monday
    var cursor = startDate.subtract(Duration(days: (startDate.weekday - 1) % 7));
    while (!cursor.isAfter(endDate)) {
      final week = <DateTime?>[];
      for (int d = 0; d < 7; d++) {
        final day = cursor.add(Duration(days: d));
        week.add(day.isAfter(endDate) || day.isBefore(startDate) ? null : day);
      }
      weeks.add(week);
      cursor = cursor.add(const Duration(days: 7));
    }

    Color cellColor(int count) {
      if (count == 0) return cs.surfaceContainerHighest;
      if (count == 1) return primary.withValues(alpha: 0.3);
      if (count == 2) return primary.withValues(alpha: 0.55);
      return primary;
    }

    final monthLabels = <int, String>{};
    for (var i = 0; i < weeks.length; i++) {
      final first = weeks[i].firstWhere((d) => d != null, orElse: () => null);
      if (first != null && first.day <= 7) {
        monthLabels[i] = DateFormat('MMM', 'pt_BR').format(first);
      }
    }

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.25)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Text('📅', style: TextStyle(fontSize: 15)),
            const SizedBox(width: 6),
            Text('Atividade anual',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700)),
            const Spacer(),
            Text('${activity.length} dias ativos',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withValues(alpha: 0.5))),
          ]),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Month labels row
                Row(
                  children: List.generate(weeks.length, (i) {
                    final label = monthLabels[i];
                    return SizedBox(
                      width: 13,
                      child: label != null
                          ? Text(label,
                              style: TextStyle(fontSize: 8, color: cs.onSurface.withValues(alpha: 0.5)))
                          : null,
                    );
                  }),
                ),
                const SizedBox(height: 4),
                // Grid
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: weeks.map((week) {
                    return Column(
                      children: week.map((day) {
                        if (day == null) {
                          return const SizedBox(width: 11, height: 11, child: SizedBox());
                        }
                        final count = activity[_key(day)] ?? 0;
                        return Tooltip(
                          message: count > 0
                              ? '${DateFormat('dd/MM').format(day)} — $count treino${count > 1 ? 's' : ''}'
                              : DateFormat('dd/MM').format(day),
                          child: Container(
                            width: 11,
                            height: 11,
                            margin: const EdgeInsets.all(1),
                            decoration: BoxDecoration(
                              color: cellColor(count),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 6),
                // Legend
                Row(
                  children: [
                    Text('Menos', style: TextStyle(fontSize: 9, color: cs.onSurface.withValues(alpha: 0.45))),
                    const SizedBox(width: 4),
                    ...List.generate(4, (i) => Container(
                      width: 10, height: 10,
                      margin: const EdgeInsets.only(right: 2),
                      decoration: BoxDecoration(
                        color: cellColor(i),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    )),
                    Text('Mais', style: TextStyle(fontSize: 9, color: cs.onSurface.withValues(alpha: 0.45))),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Period Comparison Card ────────────────────────────────────────────────────

class _PeriodRow {
  final String label;
  final String current;
  final String last;
  final double deltaPct;

  const _PeriodRow({
    required this.label,
    required this.current,
    required this.last,
    required this.deltaPct,
  });
}

class _PeriodComparisonCard extends StatelessWidget {
  const _PeriodComparisonCard({required this.title, required this.rows});
  final String title;
  final List<_PeriodRow> rows;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.25)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Text('🗓️', style: TextStyle(fontSize: 14)),
            const SizedBox(width: 6),
            Text(title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700)),
          ]),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: Container()),
              SizedBox(
                width: 70,
                child: Text('Este mês',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: cs.onSurface.withValues(alpha: 0.55)),
                    textAlign: TextAlign.center),
              ),
              SizedBox(
                width: 70,
                child: Text('Mês passado',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: cs.onSurface.withValues(alpha: 0.55)),
                    textAlign: TextAlign.center),
              ),
              const SizedBox(width: 54),
            ],
          ),
          const SizedBox(height: 6),
          ...rows.map((row) => _PeriodRowWidget(row: row)),
        ],
      ),
    );
  }
}

class _PeriodRowWidget extends StatelessWidget {
  const _PeriodRowWidget({required this.row});
  final _PeriodRow row;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final pct = row.deltaPct;
    final isPositive = pct >= 0;
    final color = pct.abs() < 5
        ? cs.onSurface.withValues(alpha: 0.5)
        : (isPositive ? const Color(0xFF00D2A0) : const Color(0xFFFF5252));
    final arrow = pct.abs() < 5 ? '—' : (isPositive ? '▲' : '▼');
    final pctStr = pct.abs() < 5 ? '' : '${pct.abs().round()}%';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Expanded(
            child: Text(row.label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600)),
          ),
          SizedBox(
            width: 70,
            child: Text(row.current,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w700, color: context.brandPrimary),
                textAlign: TextAlign.center),
          ),
          SizedBox(
            width: 70,
            child: Text(row.last,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withValues(alpha: 0.55)),
                textAlign: TextAlign.center),
          ),
          SizedBox(
            width: 54,
            child: Text('$arrow $pctStr',
                style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w700),
                textAlign: TextAlign.end),
          ),
        ],
      ),
    );
  }
}

// ─── Weekly Volume Chart ──────────────────────────────────────────────────────

class _WeeklyVolumeChart extends StatelessWidget {
  const _WeeklyVolumeChart({required this.points});
  final List<WeeklyVolumePoint> points;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final primary = context.brandPrimary;
    final nonZero = points.where((p) => p.volume > 0).toList();
    if (nonZero.length < 2) return const SizedBox();

    final maxVol = points.fold<double>(0, (m, p) => p.volume > m ? p.volume : m);
    // Show only last 12 weeks for readability
    final display = points.length > 12 ? points.sublist(points.length - 12) : points;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Volume semanal',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                  color: cs.onSurface)),
          const SizedBox(height: 4),
          Text('Últimas ${display.length} semanas',
              style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
          const SizedBox(height: 16),
          SizedBox(
            height: 140,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxVol > 0 ? maxVol * 1.2 : 1,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipItem: (group, _, rod, __) {
                      final p = display[group.x];
                      final volStr = p.volume >= 1000
                          ? '${(p.volume / 1000).toStringAsFixed(1)}t'
                          : '${p.volume.toInt()} kg';
                      return BarTooltipItem(
                        '${DateFormat('dd/MM').format(p.weekStart)}\n$volStr\n${p.sessions} treino${p.sessions != 1 ? 's' : ''}',
                        TextStyle(fontSize: 11, color: cs.onSurface, fontWeight: FontWeight.w600),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 20,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i < 0 || i >= display.length) return const SizedBox();
                        final show = i == 0 || i == display.length - 1 || i == display.length ~/ 2;
                        if (!show) return const SizedBox();
                        return Text(DateFormat('dd/MM').format(display[i].weekStart),
                            style: TextStyle(fontSize: 9, color: cs.onSurface.withValues(alpha: 0.55)));
                      },
                    ),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxVol > 0 ? maxVol / 3 : 1,
                  getDrawingHorizontalLine: (_) => FlLine(
                    color: cs.outline.withValues(alpha: 0.2), strokeWidth: 1),
                ),
                borderData: FlBorderData(show: false),
                barGroups: List.generate(display.length, (i) {
                  final p = display[i];
                  final isLatest = i == display.length - 1;
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: p.volume,
                        width: 14,
                        color: isLatest ? primary : primary.withValues(alpha: 0.5),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Exercise Evolution Section ───────────────────────────────────────────────

class _ExerciseEvolutionSection extends ConsumerStatefulWidget {
  const _ExerciseEvolutionSection({required this.exerciseHistory});
  final Map<String, List<ExerciseProgressPoint>> exerciseHistory;

  @override
  ConsumerState<_ExerciseEvolutionSection> createState() => _ExerciseEvolutionSectionState();
}

class _ExerciseEvolutionSectionState extends ConsumerState<_ExerciseEvolutionSection> {
  String? _selectedId;
  String? _selectedGroup; // null = todos
  bool _show1RM = false;

  List<ExerciseProgressPoint> get _pts =>
      _selectedId != null ? (widget.exerciseHistory[_selectedId] ?? []) : [];

  // All distinct muscle groups across exercises with >= 2 points
  List<String> get _muscleGroups {
    final groups = <String>{};
    for (final pts in widget.exerciseHistory.values) {
      if (pts.length < 2) continue;
      final g = pts.first.muscleGroup;
      if (g != null && g.isNotEmpty) groups.add(g);
    }
    return groups.toList()..sort();
  }

  // Filtered + sorted entries
  List<MapEntry<String, List<ExerciseProgressPoint>>> get _filteredEntries {
    return widget.exerciseHistory.entries
        .where((e) {
          if (e.value.length < 2) return false;
          if (_selectedGroup == null) return true;
          return e.value.first.muscleGroup == _selectedGroup;
        })
        .toList()
      ..sort((a, b) => a.value.first.exerciseName
          .compareTo(b.value.first.exerciseName));
  }

  @override
  void initState() {
    super.initState();
    _autoSelectBest();
  }

  void _autoSelectBest({String? withinGroup}) {
    final entries = widget.exerciseHistory.entries
        .where((e) => e.value.length >= 2)
        .where((e) => withinGroup == null || e.value.first.muscleGroup == withinGroup);
    final best = entries.fold<MapEntry<String, List<ExerciseProgressPoint>>?>(
        null,
        (prev, e) => prev == null || e.value.length > prev.value.length ? e : prev);
    _selectedId = best?.key;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final groups = _muscleGroups;
    final filtered = _filteredEntries;

    // Goal for the currently selected exercise (matched by normalized name)
    final goals = ref.watch(trainingGoalsProvider);
    final selectedName = _selectedId != null
        ? (widget.exerciseHistory[_selectedId]?.first.exerciseName ?? '')
        : '';
    final goal = selectedName.isNotEmpty
        ? goals
            .where((g) =>
                g.type == GoalType.strength &&
                g.label.trim().toLowerCase() ==
                    selectedName.trim().toLowerCase())
            .cast<TrainingGoal?>()
            .firstOrNull
        : null;

    if (widget.exerciseHistory.isEmpty ||
        widget.exerciseHistory.values.every((l) => l.length < 2)) {
      return const _EmptyState(
        icon: Icons.show_chart,
        message: 'Registre pelo menos 2 sessões com o mesmo exercício para ver a evolução de carga.',
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        // Muscle group filter chips
        if (groups.isNotEmpty) ...[
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(
                  label: 'Todos',
                  selected: _selectedGroup == null,
                  onTap: () => setState(() {
                    _selectedGroup = null;
                    _autoSelectBest();
                  }),
                ),
                ...groups.map((g) => Padding(
                  padding: const EdgeInsets.only(left: 6),
                  child: _FilterChip(
                    label: g,
                    selected: _selectedGroup == g,
                    onTap: () => setState(() {
                      _selectedGroup = g;
                      _autoSelectBest(withinGroup: g);
                    }),
                  ),
                )),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Exercise selector
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: cs.outline.withValues(alpha: 0.4)),
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: filtered.any((e) => e.key == _selectedId) ? _selectedId : null,
              isExpanded: true,
              hint: const Text('Selecione um exercício'),
              onChanged: (v) => setState(() => _selectedId = v),
              items: filtered.map((e) {
                final name = e.value.first.exerciseName;
                final hasGoal = goals.any((g) =>
                    g.type == GoalType.strength &&
                    g.label.trim().toLowerCase() == name.trim().toLowerCase());
                return DropdownMenuItem(
                  value: e.key,
                  child: Row(
                    children: [
                      if (hasGoal) ...[
                        const Text('🎯', style: TextStyle(fontSize: 12)),
                        const SizedBox(width: 4),
                      ],
                      Expanded(
                        child: Text(name, overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Toggle: Peso máximo vs 1RM estimado
        Row(
          children: [
            _ToggleChip(
              label: 'Peso máximo',
              selected: !_show1RM,
              onTap: () => setState(() => _show1RM = false),
            ),
            const SizedBox(width: 8),
            _ToggleChip(
              label: '1RM estimado',
              selected: _show1RM,
              onTap: () => setState(() => _show1RM = true),
            ),
          ],
        ),
        const SizedBox(height: 16),

        if (_selectedId != null && _pts.length >= 2)
          _ExerciseProgressChart(
            points: _pts,
            show1RM: _show1RM,
          ),

        if (_selectedId != null && _pts.isNotEmpty) ...[
          const SizedBox(height: 16),
          _ExerciseProgressStats(points: _pts),
        ],

        if (goal != null) ...[
          const SizedBox(height: 16),
          _GoalProgressCard(goal: goal),
        ],
      ],
    );
  }
}

// ─── Goal progress card (analytics) ──────────────────────────────────────────

class _GoalProgressCard extends StatelessWidget {
  const _GoalProgressCard({required this.goal});
  final TrainingGoal goal;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final pct = goal.progressPct / 100;
    final achieved = goal.isAchieved;
    final color = achieved
        ? Colors.green.shade500
        : pct >= 0.75
            ? Colors.orange.shade400
            : cs.primary;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text(
              achieved ? '🏆 Meta atingida!' : '🎯 Meta de carga',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            const Spacer(),
            Text(
              '${goal.progressPct.toStringAsFixed(0)}%',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
          ]),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct.clamp(0.0, 1.0),
              minHeight: 7,
              backgroundColor: color.withValues(alpha: 0.15),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _GoalStat(
                label: 'Melhor',
                value: goal.currentDisplay,
                color: color,
              ),
              _GoalStat(
                label: 'Alvo',
                value: goal.targetDisplay,
                color: cs.onSurface.withValues(alpha: 0.55),
              ),
              if (!achieved)
                _GoalStat(
                  label: 'Faltam',
                  value: goal.targetWeight != null &&
                          goal.currentBestWeight != null
                      ? '${(goal.targetWeight! - goal.currentBestWeight!).toStringAsFixed(1)} kg'
                      : '—',
                  color: cs.onSurface.withValues(alpha: 0.55),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _GoalStat extends StatelessWidget {
  const _GoalStat({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: theme.textTheme.labelSmall?.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.45))),
        const SizedBox(height: 2),
        Text(value,
            style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w700, color: color)),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final primary = context.brandPrimary;
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? primary.withValues(alpha: 0.12) : Colors.transparent,
          border: Border.all(
            color: selected ? primary : cs.outline.withValues(alpha: 0.35),
            width: selected ? 1.5 : 1,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? primary : cs.onSurface.withValues(alpha: 0.65),
          ),
        ),
      ),
    );
  }
}

class _ToggleChip extends StatelessWidget {
  const _ToggleChip({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final primary = context.brandPrimary;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? primary : Colors.transparent,
          border: Border.all(color: selected ? primary : Theme.of(context).colorScheme.outline.withValues(alpha: 0.4)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
          ),
        ),
      ),
    );
  }
}

class _ExerciseProgressChart extends StatelessWidget {
  const _ExerciseProgressChart({required this.points, required this.show1RM});
  final List<ExerciseProgressPoint> points;
  final bool show1RM;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final primary = context.brandPrimary;
    final values = show1RM
        ? points.map((p) => p.estimated1RM).toList()
        : points.map((p) => p.maxWeight).toList();

    final minVal = values.reduce((a, b) => a < b ? a : b);
    final maxVal = values.reduce((a, b) => a > b ? a : b);
    final padding = (maxVal - minVal) * 0.2;
    final minY = (minVal - padding).clamp(0, double.infinity).toDouble();
    final maxY = maxVal + padding;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline.withValues(alpha: 0.35)),
      ),
      padding: const EdgeInsets.fromLTRB(8, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Text(
              show1RM ? '1RM estimado (Epley)' : 'Peso máximo por sessão',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                  color: cs.onSurface.withValues(alpha: 0.7)),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                minY: minY,
                maxY: maxY,
                clipData: const FlClipData.all(),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxY > minY ? (maxY - minY) / 4 : 1,
                  getDrawingHorizontalLine: (_) => FlLine(
                      color: cs.outline.withValues(alpha: 0.2), strokeWidth: 1),
                ),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (v, _) => Text(
                        '${v.toInt()} kg',
                        style: TextStyle(fontSize: 9, color: cs.onSurface.withValues(alpha: 0.5)),
                      ),
                    ),
                  ),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      getTitlesWidget: (v, _) {
                        final i = v.toInt();
                        if (i < 0 || i >= points.length) return const SizedBox();
                        final show = i == 0 || i == points.length - 1 || i == points.length ~/ 2;
                        if (!show) return const SizedBox();
                        return Text(
                          DateFormat('dd/MM').format(points[i].date),
                          style: TextStyle(fontSize: 9, color: cs.onSurface.withValues(alpha: 0.55)),
                        );
                      },
                    ),
                  ),
                ),
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipItems: (spots) => spots.map((spot) {
                      final p = points[spot.x.toInt()];
                      return LineTooltipItem(
                        '${DateFormat('dd/MM/yy').format(p.date)}\n'
                        '${spot.y.toStringAsFixed(1)} kg',
                        TextStyle(fontSize: 11, color: cs.onSurface, fontWeight: FontWeight.w600),
                      );
                    }).toList(),
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: List.generate(points.length,
                        (i) => FlSpot(i.toDouble(), values[i])),
                    isCurved: true,
                    color: primary,
                    barWidth: 2.5,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, _, __, i) {
                        final isLast = i == points.length - 1;
                        return FlDotCirclePainter(
                          radius: isLast ? 5 : 3,
                          color: isLast ? primary : primary.withValues(alpha: 0.7),
                          strokeWidth: isLast ? 2 : 1,
                          strokeColor: Colors.white,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [primary.withValues(alpha: 0.2), primary.withValues(alpha: 0.02)],
                      ),
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
}

class _ExerciseProgressStats extends StatelessWidget {
  const _ExerciseProgressStats({required this.points});
  final List<ExerciseProgressPoint> points;

  @override
  Widget build(BuildContext context) {
    final first = points.first;
    final last = points.last;
    final best = points.reduce((a, b) => a.maxWeight > b.maxWeight ? a : b);
    final best1RM = points.reduce((a, b) => a.estimated1RM > b.estimated1RM ? a : b);
    final weightDelta = last.maxWeight - first.maxWeight;
    final deltaPct = first.maxWeight > 0 ? (weightDelta / first.maxWeight * 100).round() : 0;

    return Row(
      children: [
        Expanded(child: _MiniStatCard(
          label: 'Melhor peso',
          value: '${best.maxWeight.toStringAsFixed(1)} kg',
          sub: DateFormat('dd/MM/yy').format(best.date),
          color: context.brandPrimary,
        )),
        const SizedBox(width: 8),
        Expanded(child: _MiniStatCard(
          label: '1RM estimado',
          value: '${best1RM.estimated1RM.toStringAsFixed(1)} kg',
          sub: 'Epley',
          color: const Color(0xFF00C6FF),
        )),
        const SizedBox(width: 8),
        Expanded(child: _MiniStatCard(
          label: 'Evolução',
          value: '${weightDelta >= 0 ? '+' : ''}${weightDelta.toStringAsFixed(1)} kg',
          sub: '${deltaPct >= 0 ? '+' : ''}$deltaPct%',
          color: weightDelta >= 0 ? const Color(0xFF00D2A0) : const Color(0xFFFF5252),
        )),
      ],
    );
  }
}

class _MiniStatCard extends StatelessWidget {
  const _MiniStatCard({required this.label, required this.value, required this.sub, required this.color});
  final String label;
  final String value;
  final String sub;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: cs.outline.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5))),
          const SizedBox(height: 4),
          Text(value,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: color)),
          Text(sub,
              style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.45))),
        ],
      ),
    );
  }
}

// ─── Metas Tab ────────────────────────────────────────────────────────────────

class _MetasTab extends ConsumerStatefulWidget {
  const _MetasTab();

  @override
  ConsumerState<_MetasTab> createState() => _MetasTabState();
}

class _MetasTabState extends ConsumerState<_MetasTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final analyticsAsync = ref.read(analyticsProvider);
      analyticsAsync.whenData((analytics) {
        // Strength: best weight by normalized exercise name (works for catalog
        // and professional custom exercises alike — history is already name-keyed)
        final bestWeight = <String, double>{};
        for (final entry in analytics.exerciseHistory.entries) {
          if (entry.value.isEmpty) continue;
          bestWeight[entry.key] =
              entry.value.map((p) => p.maxWeight).reduce((a, b) => a > b ? a : b);
        }

        // Cardio: best distance and pace by subtype label (normalized)
        final bestDist = <String, double>{};
        final bestPace = <String, int>{};
        for (final s in analytics.cardio.recentSessions) {
          for (final e in s.exercises.where((ex) => ex.isCardio && !ex.isCrossFit)) {
            final label = e.cardioSubtype?.trim().toLowerCase() ?? 'cardio';
            final dist = e.totalDistanceKm;
            if (dist > 0) {
              if (!bestDist.containsKey(label) || dist > bestDist[label]!) {
                bestDist[label] = dist;
              }
            }
            for (final set in e.sets) {
              final pace = set.paceSecondsPerKm;
              if (pace != null && pace > 0) {
                if (!bestPace.containsKey(label) || pace < bestPace[label]!) {
                  bestPace[label] = pace;
                }
              }
            }
          }
        }

        ref.read(trainingGoalsProvider.notifier).updateProgress(
          bestWeightByName: bestWeight,
          bestDistanceByName: bestDist,
          bestPaceByName: bestPace,
        );
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final goals = ref.watch(trainingGoalsProvider);
    final analyticsAsync = ref.watch(analyticsProvider);

    final exerciseOptions = analyticsAsync.whenOrNull(
          data: (a) => a.exerciseHistory.entries
              .map((e) => (id: e.key, name: e.value.first.exerciseName))
              .toList()
            ..sort((a, b) => a.name.compareTo(b.name)),
        ) ??
        [];

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: goals.isEmpty
          ? _EmptyState(
              icon: Icons.flag_outlined,
              message: 'Nenhuma meta definida ainda.\nToque em + para adicionar sua primeira meta de treino.',
              action: FilledButton.icon(
                onPressed: () => _showAddGoalDialog(context, exerciseOptions),
                icon: const Icon(Icons.add),
                label: const Text('Adicionar meta'),
              ),
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              children: [
                ...goals.map((g) => _GoalCard(
                      goal: g,
                      onDelete: () => ref.read(trainingGoalsProvider.notifier).remove(g.id),
                    )),
              ],
            ),
      floatingActionButton: goals.isEmpty
          ? null
          : FloatingActionButton(
              onPressed: () => _showAddGoalDialog(context, exerciseOptions),
              child: const Icon(Icons.add),
            ),
    );
  }

  Future<void> _showAddGoalDialog(
      BuildContext context, List<({String id, String name})> options) async {
    GoalType goalType = GoalType.strength;

    // Strength fields
    final nameCtrl = TextEditingController();
    final weightCtrl = TextEditingController();
    String? selectedId;
    String? selectedName;

    // Cardio fields
    final distNameCtrl = TextEditingController();
    final distCtrl = TextEditingController();
    final paceNameCtrl = TextEditingController();
    final paceMinsCtrl = TextEditingController();
    final paceSecsCtrl = TextEditingController();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setModal) {
          final insets = MediaQuery.of(ctx).viewInsets.bottom;
          return SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(24, 24, 24, insets + 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Nova meta de treino',
                    style: Theme.of(ctx).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),

                // ── Type selector ──────────────────────────────────────
                Row(children: [
                  _GoalTypeChip(
                    label: '💪 Força',
                    selected: goalType == GoalType.strength,
                    onTap: () => setModal(() => goalType = GoalType.strength),
                  ),
                  const SizedBox(width: 8),
                  _GoalTypeChip(
                    label: '🏃 Distância',
                    selected: goalType == GoalType.cardioDistance,
                    onTap: () => setModal(() => goalType = GoalType.cardioDistance),
                  ),
                  const SizedBox(width: 8),
                  _GoalTypeChip(
                    label: '⚡ Pace',
                    selected: goalType == GoalType.cardioPace,
                    onTap: () => setModal(() => goalType = GoalType.cardioPace),
                  ),
                ]),
                const SizedBox(height: 20),

                // ── Strength fields ────────────────────────────────────
                if (goalType == GoalType.strength) ...[
                  if (options.isNotEmpty) ...[
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        labelText: 'Exercício (do histórico)',
                        border: OutlineInputBorder(),
                      ),
                      initialValue: selectedId,
                      items: options.map((o) => DropdownMenuItem(
                        value: o.id,
                        child: Text(o.name, overflow: TextOverflow.ellipsis),
                      )).toList(),
                      onChanged: (v) => setModal(() {
                        selectedId = v;
                        selectedName = options.firstWhere((o) => o.id == v).name;
                        nameCtrl.text = selectedName ?? '';
                      }),
                    ),
                    const SizedBox(height: 8),
                    const Center(child: Text('— ou —',
                        style: TextStyle(color: Colors.grey, fontSize: 12))),
                    const SizedBox(height: 8),
                  ],
                  TextField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Exercício',
                      border: OutlineInputBorder(),
                      hintText: 'Ex: Supino Reto, Agachamento...',
                    ),
                    onChanged: (_) => setModal(() {
                      if (selectedName != null && nameCtrl.text != selectedName) {
                        selectedId = null;
                        selectedName = null;
                      }
                    }),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: weightCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Peso alvo (kg)',
                      border: OutlineInputBorder(),
                      hintText: 'Ex: 100',
                    ),
                  ),
                ],

                // ── Cardio distance fields ─────────────────────────────
                if (goalType == GoalType.cardioDistance) ...[
                  TextField(
                    controller: distNameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Modalidade',
                      border: OutlineInputBorder(),
                      hintText: 'Ex: Corrida, Ciclismo...',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: distCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Distância alvo (km)',
                      border: OutlineInputBorder(),
                      hintText: 'Ex: 10',
                    ),
                  ),
                ],

                // ── Cardio pace fields ─────────────────────────────────
                if (goalType == GoalType.cardioPace) ...[
                  TextField(
                    controller: paceNameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Modalidade',
                      border: OutlineInputBorder(),
                      hintText: 'Ex: Corrida, Caminhada...',
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(
                      child: TextField(
                        controller: paceMinsCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Minutos /km',
                          border: OutlineInputBorder(),
                          hintText: '5',
                        ),
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 8),
                      child: Text("'", style: TextStyle(fontSize: 24)),
                    ),
                    Expanded(
                      child: TextField(
                        controller: paceSecsCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Segundos /km',
                          border: OutlineInputBorder(),
                          hintText: '30',
                        ),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 6),
                  Text(
                    'Ex: 5\'30" = pace de 5 min 30 seg por km',
                    style: Theme.of(ctx).textTheme.bodySmall?.copyWith(
                        color: Theme.of(ctx).colorScheme.onSurface.withValues(alpha: 0.5)),
                  ),
                ],

                const SizedBox(height: 20),
                Row(children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () {
                        TrainingGoal? goal;
                        final newId = DateTime.now().millisecondsSinceEpoch.toString();

                        if (goalType == GoalType.strength) {
                          final name = nameCtrl.text.trim();
                          final weight = double.tryParse(weightCtrl.text.replaceAll(',', '.'));
                          if (name.isEmpty || weight == null || weight <= 0) return;
                          goal = TrainingGoal(
                            id: newId, type: GoalType.strength, label: name,
                            targetWeight: weight, createdAt: DateTime.now(),
                          );
                        } else if (goalType == GoalType.cardioDistance) {
                          final name = distNameCtrl.text.trim();
                          final dist = double.tryParse(distCtrl.text.replaceAll(',', '.'));
                          if (name.isEmpty || dist == null || dist <= 0) return;
                          goal = TrainingGoal(
                            id: newId, type: GoalType.cardioDistance,
                            label: name, targetDistanceKm: dist,
                            createdAt: DateTime.now(),
                          );
                        } else {
                          final name = paceNameCtrl.text.trim();
                          final mins = int.tryParse(paceMinsCtrl.text.trim()) ?? 0;
                          final secs = int.tryParse(paceSecsCtrl.text.trim()) ?? 0;
                          final totalSec = mins * 60 + secs;
                          if (name.isEmpty || totalSec <= 0) return;
                          goal = TrainingGoal(
                            id: newId, type: GoalType.cardioPace,
                            label: name, targetPaceSecPerKm: totalSec,
                            createdAt: DateTime.now(),
                          );
                        }

                        if (goal != null) {
                          ref.read(trainingGoalsProvider.notifier).add(goal);
                          Navigator.pop(ctx);
                        }
                      },
                      child: const Text('Salvar'),
                    ),
                  ),
                ]),
              ],
            ),
          );
        });
      },
    );
  }
}

class _GoalTypeChip extends StatelessWidget {
  const _GoalTypeChip({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final primary = context.brandPrimary;
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? primary : Colors.transparent,
          border: Border.all(color: selected ? primary : cs.outline.withValues(alpha: 0.4)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : cs.onSurface.withValues(alpha: 0.65),
            )),
      ),
    );
  }
}

class _GoalCard extends StatelessWidget {
  const _GoalCard({required this.goal, required this.onDelete});
  final TrainingGoal goal;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final primary = context.brandPrimary;
    final pct = goal.progressPct / 100;
    final isAchieved = goal.isAchieved;
    final progressColor = isAchieved
        ? const Color(0xFF00D2A0)
        : (pct >= 0.8 ? const Color(0xFF00C6FF) : primary);

    // Subtitle for cardio pace goals
    String? subtitle;
    if (goal.type == GoalType.cardioPace && goal.targetPaceSecPerKm != null) {
      subtitle = 'Pace alvo: ${goal.targetDisplay}';
    } else if (goal.type == GoalType.cardioDistance && goal.targetDistanceKm != null) {
      subtitle = 'Distância alvo: ${goal.targetDisplay}';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isAchieved
              ? const Color(0xFF00D2A0).withValues(alpha: 0.6)
              : cs.outline.withValues(alpha: 0.25),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(isAchieved ? '🏆 ' : '${goal.typeEmoji} ',
                  style: const TextStyle(fontSize: 18)),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      goal.label,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: isAchieved ? const Color(0xFF00D2A0) : null),
                    ),
                    if (subtitle != null)
                      Text(subtitle,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: cs.onSurface.withValues(alpha: 0.5))),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18),
                onPressed: onDelete,
                visualDensity: VisualDensity.compact,
                color: cs.onSurface.withValues(alpha: 0.4),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                goal.currentDisplay == '—'
                    ? 'Sem dados ainda'
                    : 'Atual: ${goal.currentDisplay}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withValues(alpha: 0.6)),
              ),
              Text(
                'Meta: ${goal.targetDisplay}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w700, color: progressColor),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct.clamp(0.0, 1.0),
              minHeight: 8,
              backgroundColor: progressColor.withValues(alpha: 0.12),
              valueColor: AlwaysStoppedAnimation(progressColor),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            isAchieved
                ? '✓ Meta atingida!'
                : '${goal.progressPct.toStringAsFixed(0)}% concluído',
            style: TextStyle(
              fontSize: 11,
              color: isAchieved
                  ? const Color(0xFF00D2A0)
                  : cs.onSurface.withValues(alpha: 0.5),
              fontWeight: isAchieved ? FontWeight.w700 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Empty State with optional action ────────────────────────────────────────
// (overrides the existing _EmptyState — we keep both compatible by making action optional)
// This is a separate named widget to avoid collision with the existing _EmptyState

