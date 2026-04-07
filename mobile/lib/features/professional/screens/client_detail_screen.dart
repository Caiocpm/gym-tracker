// lib/features/professional/screens/client_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/dio_client.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/gradient_card.dart';
import '../domain/student_link.dart';
import '../providers/professional_provider.dart';

// ─── Provider para detalhes do aluno ──────────────────────────────────────────

final _clientWorkoutsProvider =
    FutureProvider.family.autoDispose<List<Map<String, dynamic>>, String>(
  (ref, studentUserId) async {
    try {
      final res = await DioClient.instance.dio
          .get('/workouts/$studentUserId/sessions', queryParameters: {
        'limit': 10,
      });
      final list = res.data as List<dynamic>;
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  },
);

final _clientNutritionProvider =
    FutureProvider.family.autoDispose<Map<String, dynamic>, String>(
  (ref, studentUserId) async {
    try {
      final today = DateTime.now();
      final date =
          '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
      final res = await DioClient.instance.dio.get(
        '/nutrition/$studentUserId/summary',
        queryParameters: {'date': date},
      );
      return res.data as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  },
);

final _clientGoalsProvider =
    FutureProvider.family.autoDispose<List<Map<String, dynamic>>, String>(
  (ref, linkId) async {
    try {
      final res = await DioClient.instance.dio
          .get('/professional/goals', queryParameters: {'studentLinkId': linkId});
      final list = res.data as List<dynamic>;
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  },
);

final _clientNotesProvider =
    FutureProvider.family.autoDispose<List<Map<String, dynamic>>, String>(
  (ref, linkId) async {
    try {
      final res = await DioClient.instance.dio
          .get('/professional/notes', queryParameters: {'studentLinkId': linkId});
      final list = res.data as List<dynamic>;
      return list.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  },
);

// ─── Tela ─────────────────────────────────────────────────────────────────────

class ClientDetailScreen extends ConsumerWidget {
  const ClientDetailScreen({super.key, required this.linkId});
  final String linkId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.watch(studentsProvider);

    return studentsAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(title: const Text('Cliente')),
        body: const Center(child: Text('Erro ao carregar dados')),
      ),
      data: (students) {
        final link = students.where((s) => s.id == linkId).firstOrNull;
        if (link == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Cliente')),
            body: const Center(child: Text('Cliente não encontrado')),
          );
        }
        return _DetailView(link: link);
      },
    );
  }
}

class _DetailView extends StatelessWidget {
  const _DetailView({required this.link});
  final StudentLink link;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        body: NestedScrollView(
          headerSliverBuilder: (ctx, _) => [
            _ClientSliverAppBar(link: link),
          ],
          body: const TabBarView(
            children: [
              _OverviewTab(),
              _WorkoutsTab(),
              _NutritionTab(),
              _NotesTab(),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── SliverAppBar ─────────────────────────────────────────────────────────────

class _ClientSliverAppBar extends StatelessWidget {
  const _ClientSliverAppBar({required this.link});
  final StudentLink link;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final initials = link.displayName.isNotEmpty
        ? link.displayName[0].toUpperCase()
        : '?';

    return SliverAppBar(
      expandedHeight: 160,
      pinned: true,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () => context.pop(),
        color: Colors.white,
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: AppTheme.gradientPrimary,
          ),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 32),
                CircleAvatar(
                  radius: 32,
                  backgroundColor: Colors.white.withValues(alpha: 0.25),
                  backgroundImage: link.studentPhotoURL != null
                      ? NetworkImage(link.studentPhotoURL!)
                      : null,
                  child: link.studentPhotoURL == null
                      ? Text(
                          initials,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                          ),
                        )
                      : null,
                ),
                const SizedBox(height: 8),
                Text(
                  link.displayName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  link.studentEmail,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.75),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      bottom: TabBar(
        labelColor: Colors.white,
        unselectedLabelColor: Colors.white70,
        indicatorColor: Colors.white,
        indicatorWeight: 3,
        labelStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
        tabs: const [
          Tab(text: 'Visão Geral'),
          Tab(text: 'Treinos'),
          Tab(text: 'Nutrição'),
          Tab(text: 'Notas'),
        ],
      ),
    );
  }
}

// ─── Tab: Visão Geral ─────────────────────────────────────────────────────────

class _OverviewTab extends ConsumerWidget {
  const _OverviewTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Reach up for the link from nearest DetailView ancestor
    // Using inherited approach via context — grab from parent
    final scaffold = context.findAncestorWidgetOfExactType<_DetailView>();
    final link = scaffold?.link;
    if (link == null) return const SizedBox.shrink();

    final goalsAsync =
        ref.watch(_clientGoalsProvider(link.id));
    final workoutsAsync =
        ref.watch(_clientWorkoutsProvider(link.studentUserId));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status card
        _InfoCard(
          title: 'Status do Vínculo',
          children: [
            _InfoRow(
              icon: Icons.link,
              label: 'Nível de acesso',
              value: link.accessLevel == 'write'
                  ? 'Leitura e escrita'
                  : 'Somente leitura',
            ),
            _InfoRow(
              icon: Icons.calendar_today_outlined,
              label: 'Vinculado em',
              value: _formatDate(link.linkedAt),
            ),
            _InfoRow(
              icon: Icons.circle,
              label: 'Status',
              value: link.isActive ? 'Ativo' : 'Inativo',
              valueColor: link.isActive ? Colors.green : Colors.orange,
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Metas ativas
        goalsAsync.when(
          loading: () => const _LoadingCard(title: 'Metas'),
          error: (_, __) => const SizedBox.shrink(),
          data: (goals) {
            final active =
                goals.where((g) => g['status'] == 'active').toList();
            return _InfoCard(
              title: 'Metas Ativas (${active.length})',
              children: active.isEmpty
                  ? [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text(
                          'Nenhuma meta ativa',
                          style: TextStyle(
                            color: Theme.of(context)
                                .colorScheme
                                .onSurface
                                .withValues(alpha: 0.45),
                          ),
                        ),
                      )
                    ]
                  : active.take(3).map((g) {
                      final progress =
                          (g['progress'] as num?)?.toDouble() ?? 0;
                      return Padding(
                        padding:
                            const EdgeInsets.symmetric(vertical: 6),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    g['title'] as String? ?? '',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13),
                                  ),
                                ),
                                Text(
                                  '${(progress * 100).toInt()}%',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.primary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            LinearProgressIndicator(
                              value: progress.clamp(0.0, 1.0),
                              backgroundColor: AppTheme.primary
                                  .withValues(alpha: 0.12),
                              valueColor: AlwaysStoppedAnimation<Color>(
                                  AppTheme.primary),
                              minHeight: 5,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
            );
          },
        ),
        const SizedBox(height: 12),

        // Treinos recentes
        workoutsAsync.when(
          loading: () => const _LoadingCard(title: 'Último Treino'),
          error: (_, __) => const SizedBox.shrink(),
          data: (sessions) {
            if (sessions.isEmpty) {
              return _InfoCard(
                title: 'Último Treino',
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      'Sem treinos registrados',
                      style: TextStyle(
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.45),
                      ),
                    ),
                  ),
                ],
              );
            }
            return _SessionCard(session: sessions.first);
          },
        ),
      ],
    );
  }

  String _formatDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }
}

// ─── Tab: Treinos ─────────────────────────────────────────────────────────────

class _WorkoutsTab extends ConsumerWidget {
  const _WorkoutsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scaffold =
        context.findAncestorWidgetOfExactType<_DetailView>();
    final link = scaffold?.link;
    if (link == null) return const SizedBox.shrink();

    final workoutsAsync =
        ref.watch(_clientWorkoutsProvider(link.studentUserId));

    return workoutsAsync.when(
      loading: () =>
          const Center(child: CircularProgressIndicator()),
      error: (_, __) =>
          const Center(child: Text('Erro ao carregar treinos')),
      data: (sessions) => sessions.isEmpty
          ? _EmptyTabState(
              icon: Icons.fitness_center_outlined,
              message: 'Nenhum treino registrado')
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: sessions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final s = sessions[i];
                return _SessionCard(session: s);
              },
            ),
    );
  }
}

class _SessionCard extends StatefulWidget {
  const _SessionCard({required this.session});
  final Map<String, dynamic> session;

  @override
  State<_SessionCard> createState() => _SessionCardState();
}

class _SessionCardState extends State<_SessionCard> {
  bool _expanded = false;

  // Parse exercises from raw JSON
  List<_SessionExerciseRow> get _exercises {
    final raw = widget.session['exercises'] as List<dynamic>? ?? [];
    return raw.map((e) {
      final ex = e as Map<String, dynamic>;
      final sets = (ex['sets'] as List<dynamic>? ?? [])
          .map((s) => s as Map<String, dynamic>)
          .toList();

      // Best set by weight
      double bestWeight = 0;
      int bestReps = 0;
      double totalVolume = 0;
      for (final s in sets) {
        final w = (s['weight'] as num?)?.toDouble() ?? 0;
        final r = (s['reps'] as num?)?.toInt() ?? 0;
        totalVolume += w * r;
        if (w > bestWeight) { bestWeight = w; bestReps = r; }
      }

      return _SessionExerciseRow(
        name: ex['exerciseName'] as String? ?? '-',
        muscleGroup: ex['muscleGroup'] as String?,
        exerciseType: ex['exerciseType'] as String? ?? 'forca',
        setsCount: sets.length,
        bestWeight: bestWeight,
        bestReps: bestReps,
        totalVolume: totalVolume,
        isPersonalRecord: sets.any((s) => s['isPersonalRecord'] == true),
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final duration = (widget.session['duration'] as num?)?.toDouble();
    final workoutName = widget.session['workoutName'] as String?;
    final dateRaw = widget.session['date'] as String? ?? '-';
    final exercises = _exercises;
    final muscExercises = exercises.where((e) => e.exerciseType != 'cardio').toList();
    final totalVolume = muscExercises.fold(0.0, (v, e) => v + e.totalVolume);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _expanded ? AppTheme.primary.withValues(alpha: 0.4) : AppTheme.border,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // ── Header ──────────────────────────────────────────────────
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.fitness_center,
                        color: AppTheme.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          workoutName?.isNotEmpty == true
                              ? workoutName!
                              : _fmtDate(dateRaw),
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 14),
                        ),
                        const SizedBox(height: 2),
                        Row(children: [
                          if (workoutName?.isNotEmpty == true) ...[
                            Text(_fmtDate(dateRaw),
                                style: TextStyle(
                                    fontSize: 11,
                                    color: cs.onSurface.withValues(alpha: 0.45))),
                            Text(' · ', style: TextStyle(
                                fontSize: 11,
                                color: cs.onSurface.withValues(alpha: 0.35))),
                          ],
                          Text(
                            '${exercises.length} exercício${exercises.length != 1 ? 's' : ''}',
                            style: TextStyle(
                                fontSize: 12,
                                color: cs.onSurface.withValues(alpha: 0.55)),
                          ),
                          if (duration != null) ...[
                            Text(' · ', style: TextStyle(
                                fontSize: 12,
                                color: cs.onSurface.withValues(alpha: 0.35))),
                            Text('${duration.toStringAsFixed(0)} min',
                                style: TextStyle(
                                    fontSize: 12,
                                    color: cs.onSurface.withValues(alpha: 0.55))),
                          ],
                          if (totalVolume > 0) ...[
                            Text(' · ', style: TextStyle(
                                fontSize: 12,
                                color: cs.onSurface.withValues(alpha: 0.35))),
                            Text('${_fmtVolume(totalVolume)} kg',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.primary)),
                          ],
                        ]),
                      ],
                    ),
                  ),
                  Icon(
                    _expanded ? Icons.expand_less : Icons.expand_more,
                    color: cs.onSurface.withValues(alpha: 0.4),
                    size: 20,
                  ),
                ],
              ),
            ),
          ),

          // ── Exercise list (expanded) ──────────────────────────────
          if (_expanded) ...[
            Divider(height: 1,
                color: cs.onSurface.withValues(alpha: 0.08)),
            ...exercises.asMap().entries.map((entry) {
              final i = entry.key;
              final ex = entry.value;
              return _ExerciseDetailRow(
                exercise: ex,
                isLast: i == exercises.length - 1,
              );
            }),
          ],
        ],
      ),
    );
  }

  String _fmtDate(String raw) {
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    return '${dt.day.toString().padLeft(2, '0')}/'
        '${dt.month.toString().padLeft(2, '0')}/'
        '${dt.year}';
  }

  String _fmtVolume(double v) {
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}k';
    return v.toStringAsFixed(0);
  }
}

class _SessionExerciseRow {
  const _SessionExerciseRow({
    required this.name,
    this.muscleGroup,
    required this.exerciseType,
    required this.setsCount,
    required this.bestWeight,
    required this.bestReps,
    required this.totalVolume,
    required this.isPersonalRecord,
  });
  final String name;
  final String? muscleGroup;
  final String exerciseType;
  final int setsCount;
  final double bestWeight;
  final int bestReps;
  final double totalVolume;
  final bool isPersonalRecord;
}

class _ExerciseDetailRow extends StatelessWidget {
  const _ExerciseDetailRow({
    required this.exercise,
    required this.isLast,
  });
  final _SessionExerciseRow exercise;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isCardio = exercise.exerciseType == 'cardio';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : Border(
                bottom: BorderSide(
                    color: cs.onSurface.withValues(alpha: 0.06))),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: isCardio
                  ? Colors.orange.withValues(alpha: 0.1)
                  : cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              isCardio ? Icons.directions_run : Icons.fitness_center,
              size: 15,
              color: isCardio
                  ? Colors.orange
                  : cs.onSurface.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(width: 10),
          // Name + muscle group
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Flexible(
                    child: Text(
                      exercise.name,
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (exercise.isPersonalRecord) ...[
                    const SizedBox(width: 4),
                    const Text('🏆', style: TextStyle(fontSize: 11)),
                  ],
                ]),
                if (exercise.muscleGroup != null)
                  Text(
                    exercise.muscleGroup!,
                    style: TextStyle(
                        fontSize: 11,
                        color: cs.onSurface.withValues(alpha: 0.45)),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Stats
          if (!isCardio && exercise.bestWeight > 0)
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${exercise.bestWeight.toStringAsFixed(exercise.bestWeight == exercise.bestWeight.truncateToDouble() ? 0 : 1)} kg × ${exercise.bestReps} reps',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primary,
                  ),
                ),
                Text(
                  '${exercise.setsCount} série${exercise.setsCount != 1 ? 's' : ''}',
                  style: TextStyle(
                      fontSize: 11,
                      color: cs.onSurface.withValues(alpha: 0.4)),
                ),
              ],
            )
          else if (isCardio)
            Text(
              '${exercise.setsCount} série${exercise.setsCount != 1 ? 's' : ''}',
              style: TextStyle(
                  fontSize: 12,
                  color: cs.onSurface.withValues(alpha: 0.45)),
            ),
        ],
      ),
    );
  }
}

// ─── Tab: Nutrição ────────────────────────────────────────────────────────────

class _NutritionTab extends ConsumerWidget {
  const _NutritionTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scaffold =
        context.findAncestorWidgetOfExactType<_DetailView>();
    final link = scaffold?.link;
    if (link == null) return const SizedBox.shrink();

    final nutritionAsync =
        ref.watch(_clientNutritionProvider(link.studentUserId));

    return nutritionAsync.when(
      loading: () =>
          const Center(child: CircularProgressIndicator()),
      error: (_, __) =>
          const Center(child: Text('Erro ao carregar nutrição')),
      data: (data) {
        if (data.isEmpty) {
          return const _EmptyTabState(
            icon: Icons.restaurant_outlined,
            message: 'Sem dados de nutrição hoje',
          );
        }
        final calories =
            (data['totalCalories'] as num?)?.toDouble() ?? 0;
        final protein =
            (data['totalProtein'] as num?)?.toDouble() ?? 0;
        final carbs =
            (data['totalCarbs'] as num?)?.toDouble() ?? 0;
        final fat = (data['totalFat'] as num?)?.toDouble() ?? 0;

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _InfoCard(
              title: 'Hoje',
              children: [
                _MacroRow(
                    label: 'Calorias',
                    value: '${calories.toStringAsFixed(0)} kcal',
                    color: Colors.orange),
                _MacroRow(
                    label: 'Proteínas',
                    value: '${protein.toStringAsFixed(1)}g',
                    color: Colors.blue),
                _MacroRow(
                    label: 'Carboidratos',
                    value: '${carbs.toStringAsFixed(1)}g',
                    color: Colors.green),
                _MacroRow(
                    label: 'Gorduras',
                    value: '${fat.toStringAsFixed(1)}g',
                    color: Colors.amber),
              ],
            ),
          ],
        );
      },
    );
  }
}

class _MacroRow extends StatelessWidget {
  const _MacroRow(
      {required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label,
                style: const TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w500)),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Tab: Notas ───────────────────────────────────────────────────────────────

class _NotesTab extends ConsumerStatefulWidget {
  const _NotesTab();

  @override
  ConsumerState<_NotesTab> createState() => _NotesTabState();
}

class _NotesTabState extends ConsumerState<_NotesTab> {
  final _ctrl = TextEditingController();
  String _title = '';
  bool _loading = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _addNote(String linkId) async {
    if (_title.trim().isEmpty && _ctrl.text.trim().isEmpty) return;
    setState(() => _loading = true);
    try {
      await DioClient.instance.dio.post('/professional/notes', data: {
        'studentLinkId': linkId,
        'title': _title.trim().isEmpty ? 'Nota' : _title.trim(),
        'content': _ctrl.text.trim(),
      });
      setState(() {
        _title = '';
        _ctrl.clear();
        _loading = false;
      });
      ref.invalidate(_clientNotesProvider(linkId));
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scaffold =
        context.findAncestorWidgetOfExactType<_DetailView>();
    final link = scaffold?.link;
    if (link == null) return const SizedBox.shrink();

    final notesAsync = ref.watch(_clientNotesProvider(link.id));
    final cs = Theme.of(context).colorScheme;

    return Column(
      children: [
        // Input rápido de nota
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          color: cs.surface,
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _ctrl,
                  decoration: InputDecoration(
                    hintText: 'Adicionar nota sobre este cliente...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    isDense: true,
                  ),
                  onChanged: (v) => setState(() => _title = v),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed:
                    _loading ? null : () => _addNote(link.id),
                icon: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : Icon(Icons.send_rounded, color: AppTheme.primary),
              ),
            ],
          ),
        ),
        Divider(height: 1, color: cs.onSurface.withValues(alpha: 0.08)),

        // Lista de notas
        Expanded(
          child: notesAsync.when(
            loading: () =>
                const Center(child: CircularProgressIndicator()),
            error: (_, __) =>
                const Center(child: Text('Erro ao carregar notas')),
            data: (notes) => notes.isEmpty
                ? const _EmptyTabState(
                    icon: Icons.note_outlined,
                    message: 'Nenhuma nota ainda',
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: notes.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: 8),
                    itemBuilder: (_, i) => _NoteCard(note: notes[i]),
                  ),
          ),
        ),
      ],
    );
  }
}

class _NoteCard extends StatelessWidget {
  const _NoteCard({required this.note});
  final Map<String, dynamic> note;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            note['title'] as String? ?? 'Nota',
            style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 14),
          ),
          if ((note['content'] as String?)?.isNotEmpty ?? false) ...[
            const SizedBox(height: 4),
            Text(
              note['content'] as String,
              style: TextStyle(
                fontSize: 13,
                color: cs.onSurface.withValues(alpha: 0.65),
              ),
            ),
          ],
          const SizedBox(height: 6),
          Text(
            _formatDate(note['createdAt'] as String?),
            style: TextStyle(
              fontSize: 11,
              color: cs.onSurface.withValues(alpha: 0.4),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? raw) {
    if (raw == null) return '';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
                fontWeight: FontWeight.w700, fontSize: 14),
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(icon, size: 16, color: cs.onSurface.withValues(alpha: 0.4)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                  fontSize: 13,
                  color: cs.onSurface.withValues(alpha: 0.65)),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 12),
          const LinearProgressIndicator(),
        ],
      ),
    );
  }
}

class _EmptyTabState extends StatelessWidget {
  const _EmptyTabState({required this.icon, required this.message});
  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 48, color: cs.onSurface.withValues(alpha: 0.25)),
          const SizedBox(height: 12),
          Text(
            message,
            style: TextStyle(
              color: cs.onSurface.withValues(alpha: 0.45),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
