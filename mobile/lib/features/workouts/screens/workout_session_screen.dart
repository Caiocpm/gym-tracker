// lib/features/workouts/screens/workout_session_screen.dart
import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/workouts_provider.dart';
import '../providers/rest_timer_provider.dart';
import '../domain/workout_models.dart';
import '../../../shared/providers/settings_provider.dart';
import '../../analytics/providers/training_goals_provider.dart';
import '../../social/data/social_service.dart';
import '../../social/domain/social_models.dart';
import '../data/workouts_service.dart';
import 'story_card_screen.dart';

/// Abre a sessão de treino como modal bottom sheet de tela cheia.
/// [exerciseId] — quando fornecido, inicia/adiciona apenas esse exercício.
/// [adjustedExercise] — valores ajustados (ex: modo Força) para sobrescrever o planejado.
/// Omitir [exerciseId] retoma a sessão completa do dia.
void showWorkoutSessionSheet(
  BuildContext context,
  String dayId, {
  String? exerciseId,
  PlannedExercise? adjustedExercise,
}) {
  showModalBottomSheet(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    useSafeArea: true,
    isDismissible: true,
    enableDrag: true,
    backgroundColor: Colors.transparent,
    builder: (_) => WorkoutSessionSheet(
      dayId: dayId,
      exerciseId: exerciseId,
      adjustedExercise: adjustedExercise,
    ),
  );
}

/// Abre o modal de compartilhamento do treino nos grupos.
Future<void> showShareWorkoutSheet(
  BuildContext context, {
  required String workoutName,
  required List<ActiveExercise> exercises,
  required int durationSeconds,
  required String sessionId,
  required String userId,
}) async {
  await showModalBottomSheet(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => ShareWorkoutSheet(
      workoutName: workoutName,
      exercises: exercises,
      durationSeconds: durationSeconds,
      sessionId: sessionId,
      userId: userId,
    ),
  );
}

// ─── Sheet principal ──────────────────────────────────────────────────────────

class WorkoutSessionSheet extends ConsumerStatefulWidget {
  const WorkoutSessionSheet({
    super.key,
    required this.dayId,
    this.exerciseId,
    this.adjustedExercise,
  });
  final String dayId;
  final String? exerciseId;
  final PlannedExercise? adjustedExercise;

  @override
  ConsumerState<WorkoutSessionSheet> createState() =>
      _WorkoutSessionSheetState();
}

class _WorkoutSessionSheetState extends ConsumerState<WorkoutSessionSheet> {
  // plannedExerciseId do exercício em foco (quando aberto pelo ▶ do exercício)
  String? _focusedPlannedId;

  // Índice atual na sessão completa (sem foco)
  int _currentExerciseIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initSession());
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _initSession() {
    final days = ref.read(workoutDaysProvider).valueOrNull ?? [];
    final day = days.where((d) => d.id == widget.dayId).firstOrNull;
    if (day == null) return;

    if (widget.exerciseId != null) {
      // Modo focado: inicia/adiciona apenas o exercício selecionado
      final planned = day.exercises
          .where((e) => e.id == widget.exerciseId)
          .firstOrNull;
      if (planned != null) {
        // Usa valores ajustados (ex: modo Força) se fornecidos
        final exercise = widget.adjustedExercise ?? planned;
        setState(() => _focusedPlannedId = exercise.id);
        ref
            .read(activeSessionProvider.notifier)
            .startSingleExercise(day.id, day.name, exercise);
      }
    } else {
      // Modo completo: retoma ou inicia com todos os exercícios do dia
      ref
          .read(activeSessionProvider.notifier)
          .resumeOrStart(day.id, day.name, day.exercises);
    }
  }

  void _confirmAbandon() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Abandonar treino?'),
        content: const Text('O progresso atual será perdido.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              ref.read(activeSessionProvider.notifier).clear();
              ref.read(restTimerProvider.notifier).skip();
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('Abandonar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(activeSessionProvider);
    final restTimer = ref.watch(restTimerProvider);
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          if (session.isActive) {
            _confirmAbandon();
          } else {
            Navigator.pop(context);
          }
        }
      },
      child: Container(
      height: MediaQuery.of(context).size.height * 0.93,
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // ── Drag handle ──────────────────────────────────────────────────
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 10),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // ── Header ────────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 8, 8),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Nome do exercício focado ou do dia
                      Text(
                        _focusedPlannedId != null
                            ? (session.exercises
                                    .where((e) =>
                                        e.plannedExerciseId ==
                                        _focusedPlannedId)
                                    .firstOrNull
                                    ?.exerciseName ??
                                session.dayName ??
                                '')
                            : (session.dayName ?? ''),
                        style: theme.textTheme.titleMedium,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (session.dayName != null && _focusedPlannedId != null)
                        Text(
                          session.dayName!,
                          style: theme.textTheme.bodySmall,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  icon: Icon(Icons.more_vert, color: cs.onSurface),
                  onSelected: (v) {
                    if (v == 'abandon') _confirmAbandon();
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(
                      value: 'abandon',
                      child: Row(children: [
                        Icon(Icons.close, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Abandonar treino',
                            style: TextStyle(color: Colors.red)),
                      ]),
                    ),
                  ],
                ),
                OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 8),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Concluir'),
                ),
                const SizedBox(width: 4),
              ],
            ),
          ),

          // ── Rest timer banner ─────────────────────────────────────────────
          if (restTimer.isActive)
            _RestBanner(
              timer: restTimer,
              onSkip: () => ref.read(restTimerProvider.notifier).skip(),
            ),

          Divider(height: 1, color: cs.outlineVariant),

          // ── Lista de exercícios ───────────────────────────────────────────
          Expanded(
            child: session.exercises.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_circle_outline,
                            size: 64,
                            color: cs.onSurface.withValues(alpha: 0.3)),
                        const SizedBox(height: 16),
                        const Text('Nenhum exercício adicionado'),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: () => _showAddExercise(context),
                          icon: const Icon(Icons.add),
                          label: const Text('Adicionar exercício'),
                        ),
                      ],
                    ),
                  )
                : Builder(builder: (context) {
                    // Filtra pelo exercício em foco ou pelo índice atual na sessão completa
                    final entries = session.exercises
                        .asMap()
                        .entries
                        .where((e) {
                          if (_focusedPlannedId != null) {
                            return e.value.plannedExerciseId ==
                                _focusedPlannedId;
                          }
                          return e.key == _currentExerciseIndex.clamp(
                              0, session.exercises.length - 1);
                        })
                        .toList();
                    return ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      itemCount: entries.length,
                      itemBuilder: (_, i) => _ExerciseLogger(
                        exerciseIndex: entries[i].key, // índice real na sessão
                        exercise: entries[i].value,
                        onSetCompleted: (restSec, exName) {
                          final defaultRest =
                              ref.read(settingsProvider).defaultRestSeconds;
                          ref
                              .read(restTimerProvider.notifier)
                              .start(restSec > 0 ? restSec : defaultRest,
                                  exerciseName: exName);
                        },
                      ),
                    );
                  }),
          ),

          // ── Navegação entre exercícios (apenas sessão completa) ───────────
          if (_focusedPlannedId == null && session.exercises.length > 1)
            _ExerciseNavBar(
              currentIndex: _currentExerciseIndex.clamp(
                  0, session.exercises.length - 1),
              total: session.exercises.length,
              onPrev: _currentExerciseIndex > 0
                  ? () => setState(() => _currentExerciseIndex--)
                  : null,
              onNext: _currentExerciseIndex < session.exercises.length - 1
                  ? () => setState(() => _currentExerciseIndex++)
                  : null,
            ),
        ],
      ),
      ),
    ); // PopScope
  }

  void _showAddExercise(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _QuickAddExercise(
        onAdd: (def) =>
            ref.read(activeSessionProvider.notifier).addExercise(def),
      ),
    );
  }
}

// ─── Navegação entre exercícios ───────────────────────────────────────────────

class _ExerciseNavBar extends StatelessWidget {
  const _ExerciseNavBar({
    required this.currentIndex,
    required this.total,
    required this.onPrev,
    required this.onNext,
  });

  final int currentIndex;
  final int total;
  final VoidCallback? onPrev;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final isLast = onNext == null;

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        border: Border(
            top: BorderSide(color: cs.outlineVariant, width: 0.5)),
      ),
      child: Row(
        children: [
          // Botão Anterior
          IconButton.outlined(
            onPressed: onPrev,
            icon: const Icon(Icons.arrow_back, size: 20),
            style: IconButton.styleFrom(
              minimumSize: const Size(40, 40),
              padding: EdgeInsets.zero,
            ),
          ),
          const SizedBox(width: 12),
          // Contador central
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Exercício ${currentIndex + 1} de $total',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withValues(alpha: 0.55),
                  ),
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (currentIndex + 1) / total,
                    minHeight: 4,
                    backgroundColor: cs.outlineVariant,
                    color: const Color(0xFF00D2A0),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Botão Próximo / desativado no último
          if (!isLast)
            FilledButton.icon(
              onPressed: onNext,
              icon: const Icon(Icons.arrow_forward, size: 16),
              label: const Text('Próximo'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF00D2A0),
                foregroundColor: Colors.black,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                minimumSize: const Size(0, 40),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            )
          else
            SizedBox(
              width: 40,
              height: 40,
              child: Icon(Icons.check_circle,
                  color: Colors.green.shade400, size: 28),
            ),
        ],
      ),
    );
  }
}

// ─── Rest timer banner ────────────────────────────────────────────────────────

class _RestBanner extends StatelessWidget {
  const _RestBanner({required this.timer, required this.onSkip});
  final RestTimerState timer;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      color: cs.primaryContainer,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Icon(Icons.hourglass_bottom, size: 20, color: cs.onPrimaryContainer),
          const SizedBox(width: 8),
          Text(
            'Descanso: ${timer.formatted}',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: cs.onPrimaryContainer),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: LinearProgressIndicator(
              value: timer.progress,
              color: cs.primary,
              backgroundColor: cs.onPrimaryContainer.withValues(alpha: 0.2),
            ),
          ),
          const SizedBox(width: 12),
          TextButton(
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              minimumSize: Size.zero,
              foregroundColor: cs.onPrimaryContainer,
            ),
            onPressed: onSkip,
            child: const Text('Pular'),
          ),
        ],
      ),
    );
  }
}

// ─── Rest timer helpers ───────────────────────────────────────────────────────

String _formatRest(int seconds) {
  if (seconds < 60) return '${seconds}s';
  final m = seconds ~/ 60;
  final s = seconds % 60;
  return s == 0 ? '${m}min' : '${m}m${s}s';
}

void _showRestPicker(
    BuildContext context, WidgetRef ref, int exerciseIndex, int current) {
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (_) => _RestTimerPicker(
      current: current,
      onSelected: (seconds) {
        ref
            .read(activeSessionProvider.notifier)
            .updateRestSeconds(exerciseIndex, seconds);
        Navigator.pop(context);
      },
    ),
  );
}

// ─── Exercise card ────────────────────────────────────────────────────────────

class _ExerciseLogger extends ConsumerWidget {
  const _ExerciseLogger({
    required this.exerciseIndex,
    required this.exercise,
    required this.onSetCompleted,
  });

  final int exerciseIndex;
  final ActiveExercise exercise;
  final void Function(int restSeconds, String exerciseName) onSetCompleted;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (exercise.isCrossFit) {
      return _CrossfitExerciseLogger(
        exerciseIndex: exerciseIndex,
        exercise: exercise,
        onSetCompleted: onSetCompleted,
      );
    }
    if (exercise.isCardio) {
      return _CardioExerciseLogger(
        exerciseIndex: exerciseIndex,
        exercise: exercise,
        onSetCompleted: onSetCompleted,
      );
    }

    final notifier = ref.read(activeSessionProvider.notifier);
    final weightIncrement = ref.watch(settingsProvider.select((s) => s.weightIncrement));
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    final allCompleted =
        exercise.sets.isNotEmpty && exercise.sets.every((s) => s.isCompleted);
    final completedCount = exercise.sets.where((s) => s.isCompleted).length;

    // Session-best weight (highest completed set weight for this exercise)
    final maxCompletedWeight = exercise.sets
        .where((s) => s.isCompleted && s.weight > 0)
        .fold<double>(0, (m, s) => s.weight > m ? s.weight : m);
    final hasSessionBest = maxCompletedWeight > 0;

    // Goal for this exercise (strength only).
    // Match by exerciseDefinitionId when available, otherwise by normalized name
    // (covers professional custom exercises that have no catalog definition ID).
    final _defId = exercise.exerciseDefinitionId;
    final _nameKey = exercise.exerciseName.trim().toLowerCase();
    final goal = ref.watch(trainingGoalsProvider.select((goals) => goals
        .where((g) {
          if (g.type != GoalType.strength) return false;
          final gDefId = g.exerciseDefinitionId;
          if (_defId.isNotEmpty && gDefId != null && gDefId.isNotEmpty) {
            return gDefId == _defId;
          }
          return g.label.trim().toLowerCase() == _nameKey;
        })
        .cast<TrainingGoal?>()
        .firstOrNull));

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: allCompleted
            ? Colors.green.withValues(alpha: 0.06)
            : theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: allCompleted
              ? Colors.green.shade400
              : cs.outline.withValues(alpha: 0.5),
          width: allCompleted ? 1.5 : 1,
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Exercise header ───────────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Flexible(
                        child: Text(exercise.exerciseName,
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: allCompleted
                                  ? Colors.green.shade700
                                  : null,
                            )),
                      ),
                      if (hasSessionBest) ...[
                        const SizedBox(width: 6),
                        _Badge(
                          label: '🏆 Melhor',
                          color: const Color(0xFFD4AF37),
                          textColor: const Color(0xFF1A1A1A),
                        ),
                      ],
                      if (allCompleted) ...[
                        const SizedBox(width: 6),
                        _Badge(
                          label: '✓ Concluído',
                          color: Colors.green.shade400,
                          textColor: Colors.white,
                        ),
                      ],
                    ],
                  ),
                ),
                // Rest time chip
                GestureDetector(
                  onTap: () => _showRestPicker(
                      context, ref, exerciseIndex, exercise.restSeconds),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8),
                      border:
                          Border.all(color: cs.outlineVariant, width: 0.5),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.timer_outlined,
                            size: 13,
                            color: cs.onSurface.withValues(alpha: 0.6)),
                        const SizedBox(width: 3),
                        Text(
                          _formatRest(exercise.restSeconds),
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color:
                                  cs.onSurface.withValues(alpha: 0.7)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                // Progress indicator: X/Y
                Text(
                  '$completedCount/${exercise.sets.length}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: allCompleted
                        ? Colors.green.shade600
                        : cs.onSurface.withValues(alpha: 0.45),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 8),
              ],
            ),

            const SizedBox(height: 8),

            // ── Goal progress bar / definir meta ─────────────────────────
            _GoalProgressBar(
              goal: goal,
              maxCompletedWeight: maxCompletedWeight,
              onEdit: () => _showGoalSheet(context, ref,
                  exercise: exercise, existing: goal),
            ),
            const SizedBox(height: 8),

            // ── Column headers ────────────────────────────────────────────
            Row(
              children: [
                SizedBox(
                    width: 28,
                    child: Text('#',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: cs.onSurface.withValues(alpha: 0.45),
                            fontSize: 12))),
                const SizedBox(width: 8),
                Expanded(
                    child: Text('Peso (kg)',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: cs.onSurface.withValues(alpha: 0.45),
                            fontSize: 12))),
                const SizedBox(width: 8),
                Expanded(
                    child: Text('Reps',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: cs.onSurface.withValues(alpha: 0.45),
                            fontSize: 12))),
                const SizedBox(width: 72),
              ],
            ),
            Divider(height: 8, color: cs.outlineVariant),

            // ── Sets ─────────────────────────────────────────────────────
            ...List.generate(exercise.sets.length, (si) {
              final set = exercise.sets[si];
              final isSessionBest = set.isCompleted &&
                  set.weight > 0 &&
                  set.weight == maxCompletedWeight;
              final canRemove = exercise.sets.length > 1;

              return Dismissible(
                key: ValueKey('${exerciseIndex}_$si'),
                direction: DismissDirection.horizontal,
                confirmDismiss: (direction) async {
                  if (direction == DismissDirection.startToEnd) {
                    // Swipe right → toggle complete (não remove)
                    final completed =
                        notifier.toggleSetComplete(exerciseIndex, si);
                    if (completed) {
                      HapticFeedback.mediumImpact();
                      onSetCompleted(
                          exercise.restSeconds, exercise.exerciseName);
                    } else {
                      HapticFeedback.lightImpact();
                    }
                    return false;
                  } else {
                    // Swipe left → delete (só se canRemove)
                    if (canRemove) {
                      HapticFeedback.lightImpact();
                    }
                    return canRemove;
                  }
                },
                onDismissed: (_) => notifier.removeSet(exerciseIndex, si),
                // Swipe right background (complete)
                background: Container(
                  alignment: Alignment.centerLeft,
                  padding: const EdgeInsets.only(left: 16),
                  decoration: BoxDecoration(
                    color: set.isCompleted
                        ? Colors.orange.withValues(alpha: 0.12)
                        : Colors.green.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    set.isCompleted ? Icons.undo : Icons.check_circle_outline,
                    color: set.isCompleted ? Colors.orange : Colors.green,
                    size: 20,
                  ),
                ),
                // Swipe left background (delete)
                secondaryBackground: Container(
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 16),
                  decoration: BoxDecoration(
                    color: canRemove
                        ? Colors.red.withValues(alpha: 0.12)
                        : Colors.grey.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.delete_outline,
                      color: canRemove ? Colors.red : Colors.grey, size: 20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SetRow(
                      setNumber: si + 1,
                      set: set,
                      isSessionBest: isSessionBest,
                      weightIncrement: weightIncrement,
                      onRepsChanged: (v) =>
                          notifier.updateSet(exerciseIndex, si, reps: v),
                      onWeightChanged: (v) =>
                          notifier.updateSet(exerciseIndex, si, weight: v),
                      onToggle: () {
                        final completed =
                            notifier.toggleSetComplete(exerciseIndex, si);
                        if (completed) {
                          HapticFeedback.mediumImpact();
                          onSetCompleted(
                              exercise.restSeconds, exercise.exerciseName);
                        }
                      },
                      onRemove: canRemove
                          ? () => notifier.removeSet(exerciseIndex, si)
                          : null,
                    ),
                    if (set.isCompleted)
                      _RpeSelector(
                        value: set.rpe,
                        onChanged: (rpe) =>
                            notifier.updateSet(exerciseIndex, si, rpe: rpe),
                      ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () => notifier.addSet(exerciseIndex),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Adicionar série'),
            ),

            // ── Adaptive progression suggestion ──────────────────────────
            if (allCompleted) ...[
              Builder(builder: (context) {
                final ratedSets = exercise.sets
                    .where((s) => s.isCompleted && s.rpe != null)
                    .toList();
                if (ratedSets.isEmpty) return const SizedBox.shrink();

                final avgRpe = ratedSets.fold<double>(
                        0, (v, s) => v + s.rpe!) /
                    ratedSets.length;
                final maxWeight = exercise.sets
                    .where((s) => s.isCompleted && s.weight > 0)
                    .fold<double>(0, (m, s) => s.weight > m ? s.weight : m);

                final String icon;
                final String message;
                final Color color;

                if (avgRpe <= 6) {
                  final next = maxWeight + weightIncrement;
                  final nextStr = next == next.truncateToDouble()
                      ? next.toInt().toString()
                      : next.toString();
                  icon = '↑';
                  message = maxWeight > 0
                      ? 'Tente $nextStr kg na próxima sessão'
                      : 'Aumente o peso na próxima sessão';
                  color = Colors.green.shade600;
                } else if (avgRpe <= 8) {
                  icon = '✓';
                  message = 'Mantenha o peso';
                  color = cs.primary;
                } else {
                  icon = '⚠';
                  message = 'RPE alto — considere reduzir o peso';
                  color = const Color(0xFFF59E0B);
                }

                return Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: color.withValues(alpha: 0.25), width: 1),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(icon,
                          style:
                              TextStyle(fontSize: 13, color: color)),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          message,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: color,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'RPE ${avgRpe.toStringAsFixed(1)}',
                        style: TextStyle(
                          fontSize: 11,
                          color: color.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Goal helpers ─────────────────────────────────────────────────────────────

void _showGoalSheet(
  BuildContext context,
  WidgetRef ref, {
  required ActiveExercise exercise,
  required TrainingGoal? existing,
}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (ctx) => _GoalSheet(
      exerciseName: exercise.exerciseName,
      exerciseDefinitionId: exercise.exerciseDefinitionId,
      existing: existing,
      onSave: (goal) {
        ref.read(trainingGoalsProvider.notifier).upsertForExercise(goal);
        Navigator.pop(ctx);
      },
      onRemove: existing != null
          ? () {
              ref.read(trainingGoalsProvider.notifier).remove(existing.id);
              Navigator.pop(ctx);
            }
          : null,
    ),
  );
}

// ─── Goal progress bar ────────────────────────────────────────────────────────

class _GoalProgressBar extends StatefulWidget {
  const _GoalProgressBar({
    required this.goal,
    required this.maxCompletedWeight,
    required this.onEdit,
  });

  final TrainingGoal? goal;
  final double maxCompletedWeight;
  final VoidCallback onEdit;

  @override
  State<_GoalProgressBar> createState() => _GoalProgressBarState();
}

class _GoalProgressBarState extends State<_GoalProgressBar>
    with SingleTickerProviderStateMixin {
  bool _celebrating = false;
  Timer? _celebrationTimer;
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeInOut);
    _checkGoal();
  }

  @override
  void didUpdateWidget(_GoalProgressBar old) {
    super.didUpdateWidget(old);
    if (widget.maxCompletedWeight != old.maxCompletedWeight) {
      _checkGoal();
    }
  }

  void _checkGoal() {
    final target = widget.goal?.targetWeight;
    if (target == null || target <= 0) return;
    if (widget.maxCompletedWeight >= target && !_celebrating) {
      _triggerCelebration();
    }
  }

  void _triggerCelebration() {
    HapticFeedback.heavyImpact();
    setState(() => _celebrating = true);
    _fadeCtrl.forward();
    _celebrationTimer?.cancel();
    _celebrationTimer = Timer(const Duration(seconds: 4), () {
      if (mounted) {
        _fadeCtrl.reverse().then((_) {
          if (mounted) setState(() => _celebrating = false);
        });
      }
    });
  }

  @override
  void dispose() {
    _celebrationTimer?.cancel();
    _fadeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final goal = widget.goal;
    final current = widget.maxCompletedWeight;

    // No goal set yet — show "Definir meta" button
    if (goal == null) {
      final cs = Theme.of(context).colorScheme;
      return GestureDetector(
        onTap: widget.onEdit,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
                color: cs.outline.withValues(alpha: 0.25), width: 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.flag_outlined,
                  size: 13, color: cs.onSurface.withValues(alpha: 0.45)),
              const SizedBox(width: 5),
              Text(
                'Definir meta de carga',
                style: TextStyle(
                  fontSize: 12,
                  color: cs.onSurface.withValues(alpha: 0.55),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final target = goal.targetWeight ?? 0;

    if (_celebrating) {
      return FadeTransition(
        opacity: _fadeAnim,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.green.shade400,
                Colors.green.shade600,
              ],
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🎯', style: TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Meta atingida! ${current.toStringAsFixed(1)} kg',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (target <= 0) return const SizedBox.shrink();

    final pct = (current / target).clamp(0.0, 1.0);
    final cs = Theme.of(context).colorScheme;
    final progressColor = pct >= 1.0
        ? Colors.green.shade500
        : pct >= 0.75
            ? Colors.orange.shade400
            : cs.primary;

    return GestureDetector(
      onTap: widget.onEdit,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '🎯 Meta: ${goal.targetDisplay}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: cs.onSurface.withValues(alpha: 0.6),
                ),
              ),
              const Spacer(),
              Text(
                current > 0
                    ? '${current.toStringAsFixed(1)} kg  •  ${(pct * 100).toStringAsFixed(0)}%'
                    : '—',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: progressColor,
                ),
              ),
              const SizedBox(width: 4),
              Icon(Icons.edit_outlined,
                  size: 12,
                  color: cs.onSurface.withValues(alpha: 0.35)),
            ],
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 5,
              backgroundColor: cs.outlineVariant.withValues(alpha: 0.3),
              valueColor: AlwaysStoppedAnimation<Color>(progressColor),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Goal bottom sheet ────────────────────────────────────────────────────────

class _GoalSheet extends StatefulWidget {
  const _GoalSheet({
    required this.exerciseName,
    required this.exerciseDefinitionId,
    required this.onSave,
    this.existing,
    this.onRemove,
  });

  final String exerciseName;
  final String exerciseDefinitionId;
  final TrainingGoal? existing;
  final void Function(TrainingGoal) onSave;
  final VoidCallback? onRemove;

  @override
  State<_GoalSheet> createState() => _GoalSheetState();
}

class _GoalSheetState extends State<_GoalSheet> {
  late final TextEditingController _weightCtrl;

  @override
  void initState() {
    super.initState();
    _weightCtrl = TextEditingController(
      text: widget.existing?.targetWeight != null
          ? widget.existing!.targetWeight!
              .toStringAsFixed(1)
              .replaceAll('.0', '')
          : '',
    );
  }

  @override
  void dispose() {
    _weightCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final existing = widget.existing;
    final hasGoal = existing != null;

    return Padding(
      padding: EdgeInsets.fromLTRB(
          24, 20, 24, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Text('🎯', style: TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Meta de carga',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700)),
                  Text(widget.exerciseName,
                      style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.onSurface.withValues(alpha: 0.55))),
                ],
              ),
            ),
            if (hasGoal)
              TextButton.icon(
                onPressed: widget.onRemove,
                icon: const Icon(Icons.delete_outline,
                    size: 16, color: Colors.redAccent),
                label: const Text('Remover',
                    style: TextStyle(color: Colors.redAccent)),
              ),
          ]),

          if (hasGoal && existing.currentBestWeight != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Progresso atual',
                          style: theme.textTheme.labelSmall?.copyWith(
                              color: cs.onSurface.withValues(alpha: 0.5))),
                      const SizedBox(height: 4),
                      Row(children: [
                        Text(existing.currentDisplay,
                            style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF3F5EFB))),
                        Text(' / ${existing.targetDisplay}',
                            style: theme.textTheme.bodySmall?.copyWith(
                                color:
                                    cs.onSurface.withValues(alpha: 0.5))),
                      ]),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(
                          value: existing.progressPct / 100,
                          minHeight: 6,
                          backgroundColor: const Color(0xFF3F5EFB)
                              .withValues(alpha: 0.12),
                          valueColor: AlwaysStoppedAnimation(
                            existing.isAchieved
                                ? const Color(0xFF00D2A0)
                                : const Color(0xFF3F5EFB),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Text('${existing.progressPct.toStringAsFixed(0)}%',
                    style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: existing.isAchieved
                            ? const Color(0xFF00D2A0)
                            : const Color(0xFF3F5EFB))),
              ]),
            ),
          ],

          const SizedBox(height: 16),
          TextField(
            controller: _weightCtrl,
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true),
            autofocus: !hasGoal,
            decoration: InputDecoration(
              labelText: 'Peso alvo (kg)',
              border: const OutlineInputBorder(),
              hintText: 'Ex: 120',
              suffixText: 'kg',
              helperText:
                  hasGoal ? 'Altere o valor para atualizar a meta' : null,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                final w = double.tryParse(
                    _weightCtrl.text.trim().replaceAll(',', '.'));
                if (w == null || w <= 0) return;
                widget.onSave(TrainingGoal(
                  id: existing?.id ??
                      DateTime.now().millisecondsSinceEpoch.toString(),
                  type: GoalType.strength,
                  label: widget.exerciseName,
                  exerciseDefinitionId: widget.exerciseDefinitionId,
                  targetWeight: w,
                  currentBestWeight: existing?.currentBestWeight,
                  createdAt: existing?.createdAt ?? DateTime.now(),
                ));
              },
              child: Text(hasGoal ? 'Atualizar meta' : 'Definir meta'),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Cardio exercise logger ───────────────────────────────────────────────────

class _CardioExerciseLogger extends ConsumerStatefulWidget {
  const _CardioExerciseLogger({
    required this.exerciseIndex,
    required this.exercise,
    required this.onSetCompleted,
  });

  final int exerciseIndex;
  final ActiveExercise exercise;
  final void Function(int restSeconds, String exerciseName) onSetCompleted;

  @override
  ConsumerState<_CardioExerciseLogger> createState() =>
      _CardioExerciseLoggerState();
}

class _CardioExerciseLoggerState extends ConsumerState<_CardioExerciseLogger> {
  Timer? _timer;
  int _elapsedSeconds = 0;

  // false = timer rodando (fase ativa), true = parado (fase de registro)
  bool _isStopped = false;

  final _distanceCtrl  = TextEditingController();
  final _avgBpmCtrl    = TextEditingController();
  final _maxBpmCtrl    = TextEditingController();
  final _kcalCtrl      = TextEditingController();
  final _elevationCtrl = TextEditingController();
  final _lapsCtrl      = TextEditingController(text: '0'); // natação, escada, funcional
  final _cadenceCtrl   = TextEditingController(); // bicicleta ergométrica (rpm), remo (spm)
  final _inclineCtrl   = TextEditingController(); // bicicleta ergométrica (%)

  RunType _runType = RunType.rua;
  CardioIntensity _intensity = CardioIntensity.moderada;
  SwimStyle _swimStyle = SwimStyle.livre;
  int _poolLengthM = 25;

  @override
  void initState() {
    super.initState();
    final set =
        widget.exercise.sets.isNotEmpty ? widget.exercise.sets.first : null;

    // Restaura configurações de natação do planejamento
    _poolLengthM = widget.exercise.plannedPoolLengthM ?? 25;
    if (widget.exercise.plannedSwimStyle != null) {
      _swimStyle = widget.exercise.plannedSwimStyle!;
    }

    if (set != null && set.isCompleted) {
      // Já concluído — restaura valores salvos
      _elapsedSeconds = set.durationSeconds ?? 0;
      _isStopped = true;
      if (set.distanceKm != null) _distanceCtrl.text = set.distanceKm!.toString();
      if (set.avgBpm != null) _avgBpmCtrl.text = set.avgBpm!.toString();
      if (set.maxBpm != null) _maxBpmCtrl.text = set.maxBpm!.toString();
      if (set.kcalBurned != null) _kcalCtrl.text = set.kcalBurned!.toString();
      if (set.elevationGainM != null) _elevationCtrl.text = set.elevationGainM!.toString();
      if (set.runType != null) _runType = set.runType!;
      if (set.intensity != null) _intensity = set.intensity!;
      // Contador: natação=laps, escada=floors, funcional=reps
      if (set.lapsCount != null) _lapsCtrl.text = set.lapsCount!.toString();
      else if (set.floorsClimbed != null) _lapsCtrl.text = set.floorsClimbed!.toString();
      else if (set.repsCount != null) _lapsCtrl.text = set.repsCount!.toString();
      if (set.swimStyle != null) _swimStyle = set.swimStyle!;
      if (set.cadenceRpm != null) _cadenceCtrl.text = set.cadenceRpm!.toString();
      else if (set.strokesPerMin != null) _cadenceCtrl.text = set.strokesPerMin!.toString();
      if (set.inclinePercent != null) _inclineCtrl.text = set.inclinePercent!.toString();
    } else {
      WakelockPlus.enable();
      _startTimer();
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsedSeconds++);
    });
  }

  void _stop() {
    _timer?.cancel();
    setState(() => _isStopped = true);
  }

  void _resume() {
    _startTimer();
    setState(() => _isStopped = false);
  }

  @override
  void dispose() {
    _timer?.cancel();
    WakelockPlus.disable();
    _distanceCtrl.dispose();
    _avgBpmCtrl.dispose();
    _maxBpmCtrl.dispose();
    _kcalCtrl.dispose();
    _elevationCtrl.dispose();
    _lapsCtrl.dispose();
    _cadenceCtrl.dispose();
    _inclineCtrl.dispose();
    super.dispose();
  }

  String _formatTime(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = (seconds % 60).toString().padLeft(2, '0');
    if (h > 0) {
      return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:$s';
    }
    return '${m.toString().padLeft(2, '0')}:$s';
  }

  String? _computePace() {
    final dist = double.tryParse(_distanceCtrl.text.trim());
    if (dist == null || dist <= 0 || _elapsedSeconds <= 0) return null;
    final ps = (_elapsedSeconds / dist).round();
    return '${ps ~/ 60}:${(ps % 60).toString().padLeft(2, '0')} /km';
  }

  /// Velocidade km/h — ciclismo e bicicleta ergométrica
  String? _computeSpeed() {
    final dist = double.tryParse(_distanceCtrl.text.trim());
    if (dist == null || dist <= 0 || _elapsedSeconds <= 0) return null;
    final kmh = dist / (_elapsedSeconds / 3600);
    return '${kmh.toStringAsFixed(1)} km/h';
  }

  /// Pace /500m — remo ergométrico
  String? _computeRowingPace() {
    final dist = double.tryParse(_distanceCtrl.text.trim());
    if (dist == null || dist <= 0 || _elapsedSeconds <= 0) return null;
    final secPer500m = (_elapsedSeconds * 500 / (dist * 1000)).round();
    return '${secPer500m ~/ 60}:${(secPer500m % 60).toString().padLeft(2, '0')} /500m';
  }

  // Pace por 100m para natação (baseado em voltas × pool length)
  String? _computeSwimPace() {
    final laps = int.tryParse(_lapsCtrl.text.trim()) ?? 0;
    if (laps <= 0 || _elapsedSeconds <= 0) return null;
    final totalMeters = laps * _poolLengthM;
    if (totalMeters <= 0) return null;
    final secPer100m = (_elapsedSeconds * 100 / totalMeters).round();
    return '${secPer100m ~/ 60}:${(secPer100m % 60).toString().padLeft(2, '0')} /100m';
  }

  // Distância em metros a partir das voltas
  int _swimDistanceM() {
    final laps = int.tryParse(_lapsCtrl.text.trim()) ?? 0;
    return laps * _poolLengthM;
  }

  void _complete() {
    _timer?.cancel();
    final notifier = ref.read(activeSessionProvider.notifier);
    final ex = widget.exercise;
    final isSwimming    = ex.isSwimming;
    final isStairs      = ex.isStairs;
    final isFunctional  = ex.isFunctional;
    final isCyclingIndoor = ex.isCyclingIndoor;
    final isRowing      = ex.isRowing;

    final counterVal = int.tryParse(_lapsCtrl.text.trim()) ?? 0;
    final swimM = isSwimming ? _swimDistanceM() : 0;

    final double? dist = isSwimming
        ? (swimM > 0 ? swimM / 1000.0 : null)
        : (isStairs || isFunctional)
            ? null
            : double.tryParse(_distanceCtrl.text.trim());

    final avgBpm   = int.tryParse(_avgBpmCtrl.text.trim());
    final maxBpm   = int.tryParse(_maxBpmCtrl.text.trim());
    final kcal     = int.tryParse(_kcalCtrl.text.trim());
    final elevation = (ex.isRunning || ex.isCyclingOutdoor) ? int.tryParse(_elevationCtrl.text.trim()) : null;
    final cadence   = int.tryParse(_cadenceCtrl.text.trim());
    final incline   = double.tryParse(_inclineCtrl.text.trim());

    notifier.updateSet(
      widget.exerciseIndex, 0,
      durationSeconds: _elapsedSeconds,
      distanceKm: dist,
      avgBpm: avgBpm,
      maxBpm: maxBpm,
      kcalBurned: kcal,
      elevationGainM: elevation,
      runType: ex.isRunning ? _runType : null,
      intensity: (!ex.isRunning && !isRowing) ? _intensity : null,
      lapsCount: isSwimming ? counterVal : null,
      swimStyle: isSwimming ? _swimStyle : null,
      repsCount: isFunctional ? counterVal : null,
      floorsClimbed: isStairs ? counterVal : null,
      cadenceRpm: (isCyclingIndoor || ex.isCyclingOutdoor) ? cadence : null,
      strokesPerMin: isRowing ? cadence : null,
      inclinePercent: (isCyclingIndoor || isStairs || ex.isWalking ||
              (ex.isRunning && _runType == RunType.esteira))
          ? incline
          : null,
    );
    notifier.toggleSetComplete(widget.exerciseIndex, 0);
    widget.onSetCompleted(ex.restSeconds, ex.exerciseName);
  }

  // ── Header compartilhado ──────────────────────────────────────────────────

  Widget _buildHeader(ColorScheme cs, ThemeData theme, String subtypeLabel, bool isCompleted) {
    return Row(
      children: [
        Expanded(
          child: Row(
            children: [
              Flexible(
                child: Text(
                  widget.exercise.exerciseName,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: isCompleted ? Colors.green.shade700 : null,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF1DD2AF).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFF1DD2AF).withValues(alpha: 0.5)),
                ),
                child: Text(
                  subtypeLabel,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0B6B5B),
                  ),
                ),
              ),
              if (isCompleted) ...[
                const SizedBox(width: 6),
                _Badge(label: '✓ Concluído', color: Colors.green.shade400, textColor: Colors.white),
              ],
            ],
          ),
        ),
        GestureDetector(
          onTap: () => _showRestPicker(
              context, ref, widget.exerciseIndex, widget.exercise.restSeconds),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: cs.outlineVariant, width: 0.5),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.timer_outlined, size: 13, color: cs.onSurface.withValues(alpha: 0.6)),
                const SizedBox(width: 3),
                Text(
                  _formatRest(widget.exercise.restSeconds),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: cs.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  // ── Fase ativa: cronômetro + progresso + botão Parar ─────────────────────

  Widget _buildIntensityChips(ColorScheme cs) => Wrap(
    spacing: 8,
    children: CardioIntensity.values.map((ci) {
      final labels = {
        CardioIntensity.leve: '🟢 Leve',
        CardioIntensity.moderada: '🟡 Moderada',
        CardioIntensity.intensa: '🔴 Intensa',
      };
      final selected = _intensity == ci;
      return ChoiceChip(
        label: Text(labels[ci]!, style: const TextStyle(fontSize: 12)),
        selected: selected,
        onSelected: (_) => setState(() => _intensity = ci),
        selectedColor: cs.primary,
        labelStyle: TextStyle(color: selected ? cs.onPrimary : cs.onSurface, fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
      );
    }).toList(),
  );

  Widget _buildActivePhase(ColorScheme cs, ThemeData theme) {
    final ex = widget.exercise;
    final isSwimming     = ex.isSwimming;
    final isStairs       = ex.isStairs;
    final isFunctional   = ex.isFunctional;
    final usesCounter    = isSwimming || isStairs || isFunctional;
    final isCycling      = ex.isCycling;
    final isRowing       = ex.isRowing;
    final plannedDur  = ex.plannedDurationMinutes;
    final plannedDist = ex.plannedDistanceKm;

    final pace      = (!usesCounter && !isCycling && !isRowing) ? _computePace() : null;
    final speed     = isCycling     ? _computeSpeed()      : null;
    final rowPace   = isRowing      ? _computeRowingPace() : null;
    final swimPace  = isSwimming    ? _computeSwimPace()   : null;

    final typedDist = double.tryParse(_distanceCtrl.text.trim());
    final currentLaps = usesCounter ? (int.tryParse(_lapsCtrl.text.trim()) ?? 0) : 0;
    final swimDistM = isSwimming ? currentLaps * _poolLengthM : 0;

    final durProgress = plannedDur != null
        ? (_elapsedSeconds / (plannedDur * 60)).clamp(0.0, 1.0)
        : null;
    final distProgress = (plannedDist != null && typedDist != null && typedDist > 0)
        ? (typedDist / plannedDist).clamp(0.0, 1.0)
        : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Cronômetro
        Center(
          child: Column(
            children: [
              Text(
                _formatTime(_elapsedSeconds),
                style: theme.textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2,
                  color: cs.primary,
                ),
              ),
              Text(
                'em andamento',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: cs.onSurface.withValues(alpha: 0.5)),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Progresso de duração
        if (durProgress != null) ...[
          _ProgressRow(
            icon: Icons.timer_outlined,
            value: durProgress,
            label: '${plannedDur}min',
            color: durProgress >= 1.0 ? Colors.green : cs.primary,
            cs: cs,
          ),
          const SizedBox(height: 8),
        ],

        if (usesCounter) ...[
          // ── CONTADOR: natação (voltas), escada (andares), funcional (reps) ──
          Row(
            children: [
              _CircleIconButton(
                icon: Icons.remove,
                onTap: () {
                  final v = (int.tryParse(_lapsCtrl.text.trim()) ?? 0) - 1;
                  if (v >= 0) setState(() => _lapsCtrl.text = v.toString());
                },
                cs: cs,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  children: [
                    Text(
                      _lapsCtrl.text,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: cs.primary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    Text(
                      isSwimming
                          ? '${swimDistM}m  ·  piscina ${_poolLengthM}m'
                          : isStairs
                              ? 'andares subidos'
                              : 'repetições',
                      style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5)),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              _CircleIconButton(
                icon: Icons.add,
                onTap: () {
                  final v = (int.tryParse(_lapsCtrl.text.trim()) ?? 0) + 1;
                  setState(() => _lapsCtrl.text = v.toString());
                },
                cs: cs,
                primary: true,
              ),
            ],
          ),
          if (swimPace != null) ...[
            const SizedBox(height: 8),
            Center(
              child: Text(
                swimPace,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.primary),
              ),
            ),
          ],
        ] else ...[
          // ── DISTÂNCIA: corrida, caminhada, ciclismo, bicicleta erg, remo, genérico ──
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _distanceCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  textAlign: TextAlign.center,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    labelText: 'Distância',
                    suffixText: 'km',
                    isDense: true,
                    filled: true,
                    fillColor: cs.surfaceContainerLow,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: cs.outlineVariant, width: 0.5),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Builder(builder: (_) {
                  final displayVal = speed ?? rowPace ?? pace;
                  final label = isCycling ? 'velocidade' : isRowing ? 'pace /500m' : 'pace /km';
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                    decoration: BoxDecoration(
                      color: displayVal != null
                          ? cs.primaryContainer.withValues(alpha: 0.4)
                          : cs.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: displayVal != null
                            ? cs.primary.withValues(alpha: 0.4)
                            : cs.outlineVariant.withValues(alpha: 0.5),
                      ),
                    ),
                    child: Column(
                      children: [
                        Text(
                          displayVal ?? '--:--',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: displayVal != null
                                ? cs.primary
                                : cs.onSurface.withValues(alpha: 0.3),
                          ),
                        ),
                        Text(label,
                            style: TextStyle(
                                fontSize: 10,
                                color: cs.onSurface.withValues(alpha: 0.45))),
                      ],
                    ),
                  );
                }),
              ),
            ],
          ),

          if (distProgress != null) ...[
            const SizedBox(height: 8),
            _ProgressRow(
              icon: Icons.place_outlined,
              value: distProgress,
              label: '${plannedDist}km',
              color: distProgress >= 1.0 ? Colors.green : Colors.teal,
              cs: cs,
            ),
          ],
        ],

        const SizedBox(height: 20),

        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: _stop,
            icon: const Icon(Icons.stop_circle_outlined),
            label: const Text('Parar'),
            style: FilledButton.styleFrom(backgroundColor: cs.error),
          ),
        ),
      ],
    );
  }

  // ── Fase de registro: preencher resultados após parar ─────────────────────

  Widget _buildLogPhase(ColorScheme cs, ThemeData theme) {
    final ex = widget.exercise;
    final isRunning      = ex.isRunning;
    final isSwimming     = ex.isSwimming;
    final isStairs       = ex.isStairs;
    final isFunctional   = ex.isFunctional;
    final usesCounter    = isSwimming || isStairs || isFunctional;
    final isCycling      = ex.isCycling;
    final isCyclingIndoor = ex.isCyclingIndoor;
    final isRowing       = ex.isRowing;
    final isTrilha = isRunning && (_runType == RunType.trilha);
    final pace    = (!usesCounter && !isCycling && !isRowing) ? _computePace() : null;
    final speed   = isCycling  ? _computeSpeed()      : null;
    final rowPace = isRowing   ? _computeRowingPace() : null;
    final swimPace = isSwimming ? _computeSwimPace()  : null;
    final currentLaps = usesCounter ? (int.tryParse(_lapsCtrl.text.trim()) ?? 0) : 0;
    final swimDistM = isSwimming ? currentLaps * _poolLengthM : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Duração registrada (read-only)
        Center(
          child: Column(
            children: [
              Text(
                _formatTime(_elapsedSeconds),
                style: theme.textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2,
                  color: cs.onSurface.withValues(alpha: 0.75),
                ),
              ),
              Text(
                'duração registrada',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: cs.onSurface.withValues(alpha: 0.45)),
              ),
              const SizedBox(height: 4),
              TextButton.icon(
                onPressed: _resume,
                icon: Icon(Icons.play_arrow, size: 14, color: cs.primary),
                label: Text('Retomar',
                    style: TextStyle(fontSize: 12, color: cs.primary)),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        if (usesCounter) ...[
          // ── CONTADOR: natação, escada, funcional ────────────────────
          Row(
            children: [
              _CircleIconButton(
                icon: Icons.remove,
                onTap: () {
                  final v = (int.tryParse(_lapsCtrl.text.trim()) ?? 0) - 1;
                  if (v >= 0) setState(() => _lapsCtrl.text = v.toString());
                },
                cs: cs,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  children: [
                    Text(
                      _lapsCtrl.text,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: cs.onSurface.withValues(alpha: 0.8),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    Text(
                      isSwimming
                          ? '${swimDistM}m  ·  piscina ${_poolLengthM}m'
                          : isStairs ? 'andares subidos' : 'repetições',
                      style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5)),
                      textAlign: TextAlign.center,
                    ),
                    if (swimPace != null)
                      Text(swimPace,
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: cs.primary),
                          textAlign: TextAlign.center),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              _CircleIconButton(
                icon: Icons.add,
                onTap: () {
                  final v = (int.tryParse(_lapsCtrl.text.trim()) ?? 0) + 1;
                  setState(() => _lapsCtrl.text = v.toString());
                },
                cs: cs,
                primary: true,
              ),
            ],
          ),
        ] else ...[
          // ── DISTÂNCIA: corrida, caminhada, ciclismo, bicicleta erg, remo, genérico ──
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _distanceCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  textAlign: TextAlign.center,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    labelText: 'Distância percorrida',
                    suffixText: 'km',
                    isDense: true,
                    filled: true,
                    fillColor: cs.surfaceContainerLow,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: cs.outlineVariant, width: 0.5),
                    ),
                  ),
                ),
              ),
              Builder(builder: (_) {
                final displayVal = speed ?? rowPace ?? pace;
                final label = isCycling ? 'velocidade' : isRowing ? 'pace /500m' : 'pace /km';
                if (displayVal == null) return const SizedBox.shrink();
                return Row(children: [
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                    decoration: BoxDecoration(
                      color: cs.primaryContainer.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: cs.primary.withValues(alpha: 0.4)),
                    ),
                    child: Column(children: [
                      Text(displayVal,
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: cs.primary)),
                      Text(label,
                          style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.45))),
                    ]),
                  ),
                ]);
              }),
            ],
          ),
        ],

        const SizedBox(height: 12),

        // FC média + FC máxima
        Row(
          children: [
            Expanded(
              child: _LabeledInput(
                label: 'FC média',
                controller: _avgBpmCtrl,
                suffix: 'bpm',
                icon: Icons.favorite,
                iconColor: Colors.redAccent,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _LabeledInput(
                label: 'FC máxima',
                controller: _maxBpmCtrl,
                suffix: 'bpm',
                icon: Icons.favorite,
                iconColor: Colors.red.shade800,
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Kcal
        _LabeledInput(
          label: 'Calorias',
          controller: _kcalCtrl,
          suffix: 'kcal',
          icon: Icons.local_fire_department,
          iconColor: Colors.orange,
        ),

        const SizedBox(height: 12),

        // Campos específicos por subtipo
        if (isSwimming) ...[
          Wrap(
            spacing: 8, runSpacing: 6,
            children: SwimStyle.values.map((s) {
              const labels = {
                SwimStyle.livre: '🏊 Livre', SwimStyle.costas: '🏊 Costas',
                SwimStyle.peito: '🏊 Peito', SwimStyle.borboleta: '🦋 Borboleta',
                SwimStyle.medley: '🔄 Medley',
              };
              final selected = _swimStyle == s;
              return ChoiceChip(
                label: Text(labels[s]!, style: const TextStyle(fontSize: 12)),
                selected: selected, onSelected: (_) => setState(() => _swimStyle = s),
                selectedColor: cs.primary,
                labelStyle: TextStyle(color: selected ? cs.onPrimary : cs.onSurface, fontWeight: FontWeight.w600),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          _buildIntensityChips(cs),
        ] else if (isRunning) ...[
          Wrap(
            spacing: 8,
            children: RunType.values.map((rt) {
              final labels = {RunType.rua: '🏙️ Rua', RunType.esteira: '🏃 Esteira', RunType.trilha: '🌲 Trilha'};
              final selected = _runType == rt;
              return ChoiceChip(
                label: Text(labels[rt]!, style: const TextStyle(fontSize: 12)),
                selected: selected, onSelected: (_) => setState(() => _runType = rt),
                selectedColor: cs.primary,
                labelStyle: TextStyle(color: selected ? cs.onPrimary : cs.onSurface, fontWeight: FontWeight.w600),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 0),
              );
            }).toList(),
          ),
          if (isTrilha) ...[
            const SizedBox(height: 10),
            _LabeledInput(label: 'Ganho de elevação', controller: _elevationCtrl,
                suffix: 'm', icon: Icons.terrain, iconColor: Colors.brown),
          ],
          if (_runType == RunType.esteira) ...[
            const SizedBox(height: 10),
            _LabeledInput(label: 'Inclinação', controller: _inclineCtrl,
                suffix: '%', icon: Icons.trending_up, iconColor: Colors.orange),
          ],
        ] else if (isRowing) ...[
          // Remo: paladas por minuto
          _LabeledInput(
            label: 'Paladas/min', controller: _cadenceCtrl,
            suffix: 'spm', icon: Icons.rowing, iconColor: Colors.teal,
          ),
        ] else if (isCyclingIndoor) ...[
          // Bicicleta ergométrica / spinning
          Row(children: [
            Expanded(child: _LabeledInput(
              label: 'Cadência', controller: _cadenceCtrl,
              suffix: 'rpm', icon: Icons.sync, iconColor: Colors.blue,
            )),
            const SizedBox(width: 12),
            Expanded(child: _LabeledInput(
              label: 'Inclinação', controller: _inclineCtrl,
              suffix: '%', icon: Icons.trending_up, iconColor: Colors.orange,
            )),
          ]),
          const SizedBox(height: 10),
          _buildIntensityChips(cs),
        ] else if (ex.isStairs) ...[
          // Escada rolante: nível/inclinação + intensidade
          _LabeledInput(
            label: 'Nível / Inclinação', controller: _inclineCtrl,
            suffix: '%', icon: Icons.trending_up, iconColor: Colors.orange,
          ),
          const SizedBox(height: 10),
          _buildIntensityChips(cs),
        ] else if (ex.isCyclingOutdoor) ...[
          // Ciclismo outdoor: cadência + ganho de elevação + intensidade
          Row(children: [
            Expanded(child: _LabeledInput(
              label: 'Cadência', controller: _cadenceCtrl,
              suffix: 'rpm', icon: Icons.sync, iconColor: Colors.blue,
            )),
            const SizedBox(width: 12),
            Expanded(child: _LabeledInput(
              label: 'Ganho de elevação', controller: _elevationCtrl,
              suffix: 'm', icon: Icons.terrain, iconColor: Colors.brown,
            )),
          ]),
          const SizedBox(height: 10),
          _buildIntensityChips(cs),
        ] else if (ex.isWalking) ...[
          // Caminhada: inclinação (esteira) + intensidade
          _LabeledInput(
            label: 'Inclinação', controller: _inclineCtrl,
            suffix: '%', icon: Icons.trending_up, iconColor: Colors.orange,
          ),
          const SizedBox(height: 10),
          _buildIntensityChips(cs),
        ] else ...[
          // funcional, genérico
          _buildIntensityChips(cs),
        ],

        const SizedBox(height: 16),

        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: _complete,
            icon: const Icon(Icons.check_circle_outline),
            label: const Text('Salvar atividade'),
            style: FilledButton.styleFrom(backgroundColor: Colors.green.shade600),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final set =
        widget.exercise.sets.isNotEmpty ? widget.exercise.sets.first : null;
    final isCompleted = set?.isCompleted ?? false;

    final subtypeLabel = switch (widget.exercise.cardioSubtype) {
      'corrida'               => '🏃 Corrida',
      'caminhada'             => '🚶 Caminhada',
      'ciclismo'              => '🚴 Ciclismo',
      'bicicleta_ergometrica' => '🚲 Bicicleta Ergométrica',
      'natacao'               => '🏊 Natação',
      'remo'                  => '🚣 Remo',
      'escada'                => '🪜 Escada',
      'funcional'             => '⚡ Funcional',
      _                       => '❤️ Cardio',
    };

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isCompleted
            ? Colors.green.withValues(alpha: 0.06)
            : theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCompleted
              ? Colors.green.shade400
              : cs.outline.withValues(alpha: 0.5),
          width: isCompleted ? 1.5 : 1,
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(cs, theme, subtypeLabel, isCompleted),
            const SizedBox(height: 16),
            if (isCompleted && set != null)
              _CardioSummaryRow(set: set, cardioSubtype: widget.exercise.cardioSubtype)
            else if (!_isStopped)
              _buildActivePhase(cs, theme)
            else
              _buildLogPhase(cs, theme),
          ],
        ),
      ),
    );
  }
}


// ─── CrossFit WOD Logger ──────────────────────────────────────────────────────

class _CrossfitExerciseLogger extends ConsumerStatefulWidget {
  const _CrossfitExerciseLogger({
    required this.exerciseIndex,
    required this.exercise,
    required this.onSetCompleted,
  });
  final int exerciseIndex;
  final ActiveExercise exercise;
  final void Function(int restSeconds, String exerciseName) onSetCompleted;

  @override
  ConsumerState<_CrossfitExerciseLogger> createState() => _CrossfitExerciseLoggerState();
}

class _CrossfitExerciseLoggerState extends ConsumerState<_CrossfitExerciseLogger> {
  Timer? _timer;
  int _elapsedSeconds = 0;
  bool _isStopped = false; // true = fase de registro pós-WOD
  int _rounds = 0;
  final _partialRepsCtrl = TextEditingController(text: '0');
  final _rpeCtrl = TextEditingController(text: '7');
  // Controllers de performance para movimentos pré-definidos: [[actualReps, actualWeight], ...]
  late final List<List<TextEditingController>> _movementCtrls;
  // Movimentos adicionados on-the-fly durante o log: [[name, reps, weight], ...]
  final List<List<TextEditingController>> _extraMovements = [];

  WodFormat get _format => widget.exercise.wodFormat ?? WodFormat.amrap;
  int get _timeCap => widget.exercise.plannedDurationMinutes ?? 20; // minutos
  int get _plannedRounds => widget.exercise.plannedRounds ?? 5;

  bool get _isCompleted {
    final set = widget.exercise.sets.isNotEmpty ? widget.exercise.sets.first : null;
    return set?.isCompleted ?? false;
  }

  // Segundos restantes (para AMRAP/EMOM/Tabata)
  int get _remainingSeconds => (_timeCap * 60 - _elapsedSeconds).clamp(0, _timeCap * 60);

  // Tabata: fase e round a partir do elapsed
  int get _tabataRound => (_elapsedSeconds ~/ 30).clamp(0, 7) + 1;
  bool get _tabataIsWork => (_elapsedSeconds % 30) < 20;
  int get _tabataPhaseRemaining {
    final pos = _elapsedSeconds % 30;
    return pos < 20 ? (20 - pos) : (30 - pos);
  }
  // EMOM: minuto atual e segundos restantes no minuto
  int get _emomMinute => (_elapsedSeconds ~/ 60) + 1;
  int get _emomSecondsLeft => 60 - (_elapsedSeconds % 60);

  @override
  void initState() {
    super.initState();
    // Inicializar controllers de performance por movimento
    final movements = widget.exercise.wodMovements;
    final set = widget.exercise.sets.isNotEmpty ? widget.exercise.sets.first : null;
    _movementCtrls = movements.asMap().entries.map((e) {
      final saved = set?.wodMovements.elementAtOrNull(e.key);
      return [
        TextEditingController(text: saved?.actualReps != null ? '${saved!.actualReps}' : ''),
        TextEditingController(text: saved?.actualWeight != null ? '${saved!.actualWeight}' : ''),
      ];
    }).toList();

    if (set != null && set.isCompleted) {
      _elapsedSeconds = set.durationSeconds ?? 0;
      _rounds = set.completedRounds ?? 0;
      if (set.partialReps != null) _partialRepsCtrl.text = set.partialReps!.toString();
      if (set.rpe != null) _rpeCtrl.text = set.rpe!.toString();
      _isStopped = true;
    } else {
      WakelockPlus.enable();
      _startTimer();
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _elapsedSeconds++);
      // Auto-stop quando tempo esgota (AMRAP/EMOM/Tabata)
      if (_format != WodFormat.forTime) {
        final limit = _format == WodFormat.tabata ? 240 : _timeCap * 60;
        if (_elapsedSeconds >= limit) {
          _timer?.cancel();
          setState(() => _isStopped = true);
        }
      }
    });
  }

  void _stop() {
    _timer?.cancel();
    setState(() => _isStopped = true);
  }

  void _resume() {
    setState(() => _isStopped = false);
    _startTimer();
  }

  void _addExtraMovement() {
    setState(() => _extraMovements.add([
      TextEditingController(), // name
      TextEditingController(), // reps
      TextEditingController(), // weight
    ]));
  }

  void _removeExtraMovement(int i) {
    for (final c in _extraMovements[i]) c.dispose();
    setState(() => _extraMovements.removeAt(i));
  }

  void _complete() {
    _timer?.cancel();
    WakelockPlus.disable();
    final notifier = ref.read(activeSessionProvider.notifier);
    final partial = int.tryParse(_partialRepsCtrl.text.trim());
    final rpe = int.tryParse(_rpeCtrl.text.trim());
    // Movimentos pré-definidos com performance real preenchida
    final movements = <WodMovement>[
      ...widget.exercise.wodMovements.asMap().entries.map((e) {
        final m = e.value;
        final ctrls = _movementCtrls[e.key];
        return m.copyWith(
          actualReps: int.tryParse(ctrls[0].text.trim()),
          actualWeight: double.tryParse(ctrls[1].text.trim().replaceAll(',', '.')),
        );
      }),
      // Movimentos adicionados manualmente no log
      ..._extraMovements
          .where((row) => row[0].text.trim().isNotEmpty)
          .map((row) => WodMovement(
                name: row[0].text.trim(),
                actualReps: int.tryParse(row[1].text.trim()),
                actualWeight: double.tryParse(row[2].text.trim().replaceAll(',', '.')),
              )),
    ];
    notifier.updateSet(
      widget.exerciseIndex, 0,
      durationSeconds: _elapsedSeconds,
      completedRounds: _rounds,
      partialReps: partial,
      rpe: rpe,
      wodMovements: movements,
    );
    notifier.toggleSetComplete(widget.exerciseIndex, 0);
    widget.onSetCompleted(0, widget.exercise.exerciseName);
  }

  @override
  void dispose() {
    _timer?.cancel();
    WakelockPlus.disable();
    _partialRepsCtrl.dispose();
    _rpeCtrl.dispose();
    for (final row in _movementCtrls) { for (final c in row) c.dispose(); }
    for (final row in _extraMovements) { for (final c in row) c.dispose(); }
    super.dispose();
  }

  String _formatTime(int s) {
    final m = s ~/ 60;
    final sec = (s % 60).toString().padLeft(2, '0');
    return '$m:$sec';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    const accent = Color(0xFFFF6B35); // laranja CrossFit

    if (_isCompleted) return _buildSummary(cs, accent);

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Cabeçalho: nome + formato
          Padding(
            padding: const EdgeInsets.fromLTRB(0, 4, 0, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    widget.exercise.exerciseName,
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: accent.withValues(alpha: 0.5)),
                  ),
                  child: Text(
                    _formatLabel,
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: accent),
                  ),
                ),
              ],
            ),
          ),

          // Descrição do WOD
          if (widget.exercise.wodDescription != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.surfaceContainerLow,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: cs.outlineVariant, width: 0.5),
              ),
              child: Text(
                widget.exercise.wodDescription!,
                style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.8)),
              ),
            ),
            const SizedBox(height: 12),
          ],

          if (!_isStopped) _buildActivePhase(cs, theme, accent)
          else _buildLogPhase(cs, theme, accent),
        ],
      ),
    );
  }

  String get _formatLabel => switch (_format) {
    WodFormat.amrap   => '⏱ AMRAP ${_timeCap}min',
    WodFormat.forTime => '🏁 For Time',
    WodFormat.emom    => '🔁 EMOM ${_timeCap}min',
    WodFormat.tabata  => '⚡ Tabata',
  };

  Widget _buildActivePhase(ColorScheme cs, ThemeData theme, Color accent) {
    return Column(
      children: [
        // Timer principal
        Center(
          child: _format == WodFormat.tabata
              ? _buildTabataTimer(cs, theme, accent)
              : _format == WodFormat.emom
                  ? _buildEmomTimer(cs, theme, accent)
                  : _buildMainTimer(cs, theme, accent),
        ),
        const SizedBox(height: 16),

        // Round counter (AMRAP / For Time / EMOM)
        if (_format != WodFormat.tabata) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _CircleIconButton(
                icon: Icons.remove,
                onTap: () { if (_rounds > 0) setState(() => _rounds--); },
                cs: cs,
              ),
              const SizedBox(width: 20),
              Column(
                children: [
                  Text('$_rounds', style: theme.textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.w800, color: accent)),
                  Text(
                    _format == WodFormat.forTime
                        ? 'rounds de $_plannedRounds'
                        : 'rounds',
                    style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5)),
                  ),
                ],
              ),
              const SizedBox(width: 20),
              _CircleIconButton(
                icon: Icons.add,
                onTap: () => setState(() => _rounds++),
                cs: cs,
                primary: true,
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],

        // Referência de movimentos durante o WOD
        if (widget.exercise.wodMovements.isNotEmpty) ...[
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: accent.withValues(alpha: 0.25)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Movimentos',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: accent),
                ),
                const SizedBox(height: 6),
                ...widget.exercise.wodMovements.map((m) {
                  final detail = [
                    if (m.targetReps != null) '${m.targetReps} reps',
                    if (m.targetWeight != null && m.targetWeight! > 0)
                      '${m.targetWeight!.toStringAsFixed(m.targetWeight! % 1 == 0 ? 0 : 1)} kg',
                  ].join(' · ');
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(children: [
                      Icon(Icons.circle, size: 5, color: accent.withValues(alpha: 0.7)),
                      const SizedBox(width: 6),
                      Expanded(child: Text(m.name, style: const TextStyle(fontSize: 12))),
                      if (detail.isNotEmpty)
                        Text(detail, style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.6))),
                    ]),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Botão de ação
        if (_format == WodFormat.forTime && _rounds >= _plannedRounds) ...[
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _stop,
              icon: const Icon(Icons.flag),
              label: const Text('Finalizado!'),
              style: FilledButton.styleFrom(backgroundColor: Colors.green.shade600),
            ),
          ),
        ] else if (_format != WodFormat.tabata) ...[
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _stop,
              icon: const Icon(Icons.stop_circle_outlined),
              label: const Text('Encerrar WOD'),
              style: OutlinedButton.styleFrom(foregroundColor: Colors.red.shade400),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildMainTimer(ColorScheme cs, ThemeData theme, Color accent) {
    final isCountdown = _format == WodFormat.amrap;
    final display = isCountdown ? _remainingSeconds : _elapsedSeconds;
    final isExpired = isCountdown && _remainingSeconds == 0;
    return Column(
      children: [
        Text(
          _formatTime(display),
          style: theme.textTheme.displayMedium?.copyWith(
            fontWeight: FontWeight.w700,
            letterSpacing: 2,
            color: isExpired ? Colors.red : accent,
          ),
        ),
        Text(
          isCountdown ? 'restante' : 'em andamento',
          style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5)),
        ),
      ],
    );
  }

  Widget _buildEmomTimer(ColorScheme cs, ThemeData theme, Color accent) {
    return Column(
      children: [
        Text(
          _formatTime(_emomSecondsLeft),
          style: theme.textTheme.displayMedium?.copyWith(
            fontWeight: FontWeight.w700,
            letterSpacing: 2,
            color: _emomSecondsLeft <= 5 ? Colors.red : accent,
          ),
        ),
        Text(
          'minuto $_emomMinute de $_timeCap',
          style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5)),
        ),
        const SizedBox(height: 6),
        LinearProgressIndicator(
          value: 1 - (_emomSecondsLeft / 60),
          color: accent,
          backgroundColor: accent.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }

  Widget _buildTabataTimer(ColorScheme cs, ThemeData theme, Color accent) {
    final isWork = _tabataIsWork;
    final color = isWork ? accent : Colors.blue;
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            isWork ? 'TRABALHO' : 'DESCANSO',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: color),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _tabataPhaseRemaining.toString(),
          style: theme.textTheme.displayLarge?.copyWith(
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        Text(
          'Round $_tabataRound de 8',
          style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5)),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(8, (i) => Container(
            width: 20, height: 8,
            margin: const EdgeInsets.symmetric(horizontal: 3),
            decoration: BoxDecoration(
              color: i < _tabataRound - 1
                  ? Colors.green
                  : i == _tabataRound - 1
                      ? color
                      : cs.outlineVariant,
              borderRadius: BorderRadius.circular(4),
            ),
          )),
        ),
      ],
    );
  }

  Widget _buildLogPhase(ColorScheme cs, ThemeData theme, Color accent) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Tempo total
        Center(
          child: Column(
            children: [
              Text(
                _formatTime(_elapsedSeconds),
                style: theme.textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface.withValues(alpha: 0.75),
                ),
              ),
              Text('tempo total', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // ── Performance por movimento (SEMPRE visível) ────────────────────────
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: accent.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: accent.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Icon(Icons.fitness_center, size: 14, color: accent),
                const SizedBox(width: 6),
                Text(
                  'Performance por movimento',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: accent),
                ),
              ]),
              const SizedBox(height: 2),
              Text(
                'Preencha o que você realmente realizou em cada movimento',
                style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5)),
              ),
              // Cabeçalho (só se há movimentos)
              if (widget.exercise.wodMovements.isNotEmpty || _extraMovements.isNotEmpty) ...[
                const SizedBox(height: 10),
                Row(children: [
                  const Expanded(flex: 5, child: SizedBox()),
                  SizedBox(width: 55, child: Center(child: Text('Reps', style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5))))),
                  const SizedBox(width: 4),
                  SizedBox(width: 55, child: Center(child: Text('Kg', style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5))))),
                  const SizedBox(width: 4),
                  SizedBox(width: 55, child: Center(child: Text('Meta', style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5))))),
                ]),
                const SizedBox(height: 4),
              ] else ...[
                const SizedBox(height: 8),
              ],

              // Movimentos pré-definidos
              ...widget.exercise.wodMovements.asMap().entries.map((entry) {
                final i = entry.key;
                final m = entry.value;
                final repsCtrl = _movementCtrls[i][0];
                final weightCtrl = _movementCtrls[i][1];
                final targetStr = [
                  if (m.targetReps != null) '${m.targetReps}r',
                  if (m.targetWeight != null && m.targetWeight! > 0)
                    '${m.targetWeight!.toStringAsFixed(m.targetWeight! % 1 == 0 ? 0 : 1)}k',
                ].join('/');
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                    Expanded(
                      flex: 5,
                      child: Text(m.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                    _MovInputField(controller: repsCtrl, hint: '0', width: 55),
                    const SizedBox(width: 4),
                    _MovInputField(controller: weightCtrl, hint: '0', width: 55, decimal: true),
                    const SizedBox(width: 4),
                    SizedBox(
                      width: 55,
                      child: Center(
                        child: Text(
                          targetStr.isEmpty ? '—' : targetStr,
                          style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.45)),
                        ),
                      ),
                    ),
                  ]),
                );
              }),

              // Movimentos adicionados manualmente
              ..._extraMovements.asMap().entries.map((entry) {
                final i = entry.key;
                final nameCtrl = entry.value[0];
                final repsCtrl = entry.value[1];
                final weightCtrl = entry.value[2];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                    Expanded(
                      flex: 5,
                      child: TextField(
                        controller: nameCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                          hintText: 'Movimento',
                          isDense: true,
                          filled: true,
                          fillColor: cs.surfaceContainerLow,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                        ),
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                    const SizedBox(width: 4),
                    _MovInputField(controller: repsCtrl, hint: '0', width: 55),
                    const SizedBox(width: 4),
                    _MovInputField(controller: weightCtrl, hint: '0', width: 55, decimal: true),
                    const SizedBox(width: 4),
                    SizedBox(
                      width: 28,
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        iconSize: 18,
                        icon: Icon(Icons.close, color: cs.error),
                        onPressed: () => _removeExtraMovement(i),
                      ),
                    ),
                  ]),
                );
              }),

              // Botão adicionar movimento
              const SizedBox(height: 6),
              GestureDetector(
                onTap: _addExtraMovement,
                child: Row(children: [
                  Icon(Icons.add_circle_outline, size: 16, color: accent),
                  const SizedBox(width: 6),
                  Text(
                    'Adicionar movimento',
                    style: TextStyle(fontSize: 12, color: accent, fontWeight: FontWeight.w600),
                  ),
                ]),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Rounds completados (editável)
        if (_format != WodFormat.tabata) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _CircleIconButton(icon: Icons.remove, onTap: () { if (_rounds > 0) setState(() => _rounds--); }, cs: cs),
              const SizedBox(width: 20),
              Column(
                children: [
                  Text('$_rounds', style: theme.textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.w800, color: cs.onSurface.withValues(alpha: 0.8))),
                  Text('rounds', style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
                ],
              ),
              const SizedBox(width: 20),
              _CircleIconButton(icon: Icons.add, onTap: () => setState(() => _rounds++), cs: cs, primary: true),
            ],
          ),
          const SizedBox(height: 12),

          // Reps parciais (AMRAP)
          if (_format == WodFormat.amrap)
            _LabeledInput(
              label: 'Reps parciais (último round)',
              controller: _partialRepsCtrl,
              suffix: 'reps',
              icon: Icons.add_circle_outline,
              iconColor: accent,
            ),
          const SizedBox(height: 12),
        ],

        // RPE
        Text('Esforço percebido (RPE)', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6))),
        const SizedBox(height: 6),
        Row(
          children: List.generate(10, (i) {
            final val = i + 1;
            final current = int.tryParse(_rpeCtrl.text.trim()) ?? 7;
            final active = val == current;
            final color = val <= 3 ? Colors.green : val <= 6 ? Colors.orange : Colors.red;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _rpeCtrl.text = val.toString()),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 1.5),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: active ? color : color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '$val',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: active ? FontWeight.w800 : FontWeight.normal,
                      color: active ? Colors.white : color,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 16),

        // Retomar (se parou antes do tempo)
        if (_format == WodFormat.forTime || (_format == WodFormat.amrap && _remainingSeconds > 0)) ...[
          OutlinedButton.icon(
            onPressed: _resume,
            icon: const Icon(Icons.play_arrow),
            label: const Text('Retomar'),
          ),
          const SizedBox(height: 8),
        ],

        FilledButton.icon(
          onPressed: _complete,
          icon: const Icon(Icons.check_circle_outline),
          label: const Text('Salvar WOD'),
          style: FilledButton.styleFrom(backgroundColor: Colors.green.shade600),
        ),
      ],
    );
  }

  Widget _buildSummary(ColorScheme cs, Color accent) {
    final set = widget.exercise.sets.first;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 14,
          runSpacing: 6,
          children: [
            if (set.durationSeconds != null)
              _SummaryChip(Icons.timer, _formatTime(set.durationSeconds!), cs.primary),
            if (set.completedRounds != null)
              _SummaryChip(Icons.repeat, '${set.completedRounds} rounds', accent),
            if (set.partialReps != null && set.partialReps! > 0)
              _SummaryChip(Icons.add_circle_outline, '+${set.partialReps} reps', accent),
            if (set.rpe != null)
              _SummaryChip(Icons.speed, 'RPE ${set.rpe}', Colors.orange),
          ],
        ),
        if (set.wodMovements.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            'Movimentos realizados',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: cs.onSurface.withValues(alpha: 0.6)),
          ),
          const SizedBox(height: 4),
          ...set.wodMovements.map((m) {
            final parts = <String>[];
            if (m.actualReps != null) parts.add('${m.actualReps} reps');
            if (m.actualWeight != null && m.actualWeight! > 0)
              parts.add('${m.actualWeight!.toStringAsFixed(m.actualWeight! % 1 == 0 ? 0 : 1)} kg');
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(children: [
                Icon(Icons.check_circle_outline, size: 13, color: Colors.green.shade400),
                const SizedBox(width: 5),
                Expanded(child: Text(m.name, style: const TextStyle(fontSize: 12))),
                if (parts.isNotEmpty)
                  Text(
                    parts.join(' · '),
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: accent),
                  ),
              ]),
            );
          }),
        ],
      ],
    );
  }
}

// Campo de input compacto para a tabela de movimentos do WOD
class _MovInputField extends StatelessWidget {
  const _MovInputField({
    required this.controller,
    required this.hint,
    required this.width,
    this.decimal = false,
  });
  final TextEditingController controller;
  final String hint;
  final double width;
  final bool decimal;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return SizedBox(
      width: width,
      child: TextField(
        controller: controller,
        keyboardType: decimal
            ? const TextInputType.numberWithOptions(decimal: true)
            : TextInputType.number,
        textAlign: TextAlign.center,
        decoration: InputDecoration(
          hintText: hint,
          isDense: true,
          filled: true,
          fillColor: cs.surfaceContainerLow,
          contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 7),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
        ),
        style: const TextStyle(fontSize: 12),
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip(this.icon, this.text, this.color);
  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 3),
        Text(text, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500,
            color: cs.onSurface.withValues(alpha: 0.8))),
      ],
    );
  }
}

// ─── Circle icon button (natação: + / -) ─────────────────────────────────────

class _CircleIconButton extends StatelessWidget {
  const _CircleIconButton({
    required this.icon,
    required this.onTap,
    required this.cs,
    this.primary = false,
  });
  final IconData icon;
  final VoidCallback onTap;
  final ColorScheme cs;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: primary ? cs.primary : cs.surfaceContainerHighest,
          border: Border.all(
            color: primary ? cs.primary : cs.outlineVariant,
            width: 1.5,
          ),
        ),
        child: Icon(
          icon,
          color: primary ? cs.onPrimary : cs.onSurface,
          size: 24,
        ),
      ),
    );
  }
}

// ─── Progress row (timer/distance goal bar) ───────────────────────────────────

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    required this.cs,
  });
  final IconData icon;
  final double value;
  final String label;
  final Color color;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: cs.onSurface.withValues(alpha: 0.5)),
        const SizedBox(width: 6),
        Expanded(
          child: LinearProgressIndicator(
            value: value,
            borderRadius: BorderRadius.circular(4),
            backgroundColor: cs.outlineVariant.withValues(alpha: 0.3),
            color: color,
            minHeight: 6,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
              fontSize: 11, color: cs.onSurface.withValues(alpha: 0.55)),
        ),
      ],
    );
  }
}

// ─── Cardio summary row ───────────────────────────────────────────────────────

class _CardioSummaryRow extends StatelessWidget {
  const _CardioSummaryRow({required this.set, this.cardioSubtype});
  final LoggedSet set;
  final String? cardioSubtype;

  bool get _isCycling => cardioSubtype == 'ciclismo' || cardioSubtype == 'bicicleta_ergometrica';
  bool get _isRowing  => cardioSubtype == 'remo';

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final items = <({IconData icon, String text, Color color})>[];

    // Duração
    if (set.durationSeconds != null) {
      final m = set.durationSeconds! ~/ 60;
      final s = set.durationSeconds! % 60;
      items.add((icon: Icons.timer, text: s == 0 ? '${m}min' : '${m}m${s}s', color: cs.primary));
    }
    // Natação: voltas
    if (set.lapsCount != null && set.lapsCount! > 0) {
      items.add((icon: Icons.pool, text: '${set.lapsCount} voltas', color: Colors.blueAccent));
    }
    // Escada: andares
    if (set.floorsClimbed != null && set.floorsClimbed! > 0) {
      items.add((icon: Icons.stairs, text: '${set.floorsClimbed} andares', color: Colors.deepOrange));
    }
    // Funcional: reps
    if (set.repsCount != null && set.repsCount! > 0) {
      items.add((icon: Icons.repeat, text: '${set.repsCount} reps', color: Colors.purple));
    }
    // Distância
    if (set.distanceKm != null && set.distanceKm! > 0) {
      items.add((icon: Icons.place, text: '${set.distanceKm!.toStringAsFixed(2)}km', color: Colors.teal));
    }
    // Estilo de nado
    if (set.swimStyle != null) {
      const styleLabels = {
        SwimStyle.livre: '🏊 Livre', SwimStyle.costas: '🏊 Costas',
        SwimStyle.peito: '🏊 Peito', SwimStyle.borboleta: '🦋 Borboleta',
        SwimStyle.medley: '🔄 Medley',
      };
      items.add((icon: Icons.waves, text: styleLabels[set.swimStyle!] ?? 'Natação', color: Colors.blue));
    }
    // Pace /km (corrida, caminhada, genérico)
    if (set.paceFormatted != null && set.lapsCount == null && !_isCycling && !_isRowing) {
      items.add((icon: Icons.speed, text: set.paceFormatted!, color: Colors.indigo));
    }
    // Velocidade km/h (ciclismo)
    if (_isCycling && set.speedKmh != null) {
      items.add((icon: Icons.speed, text: '${set.speedKmh!.toStringAsFixed(1)} km/h', color: Colors.indigo));
    }
    // Pace /500m (remo)
    if (_isRowing && set.paceFormatted500m != null) {
      items.add((icon: Icons.speed, text: set.paceFormatted500m!, color: Colors.indigo));
    }
    // Cadência RPM (bicicleta erg) / Paladas (remo)
    if (set.cadenceRpm != null) {
      items.add((icon: Icons.sync, text: '${set.cadenceRpm} rpm', color: Colors.blue));
    }
    if (set.strokesPerMin != null) {
      items.add((icon: Icons.rowing, text: '${set.strokesPerMin} spm', color: Colors.teal));
    }
    // Inclinação
    if (set.inclinePercent != null && set.inclinePercent! > 0) {
      items.add((icon: Icons.trending_up, text: '+${set.inclinePercent}%', color: Colors.orange));
    }
    // FC
    if (set.avgBpm != null) {
      items.add((icon: Icons.favorite, text: '${set.avgBpm}bpm', color: Colors.redAccent));
    }
    // Elevação (trilha)
    if (set.elevationGainM != null && set.elevationGainM! > 0) {
      items.add((icon: Icons.terrain, text: '+${set.elevationGainM}m', color: Colors.brown));
    }

    return Wrap(
      spacing: 14,
      runSpacing: 6,
      children: items
          .map((item) => Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(item.icon, size: 13, color: item.color),
                  const SizedBox(width: 3),
                  Text(item.text,
                      style: TextStyle(
                          fontSize: 12,
                          color: cs.onSurface.withValues(alpha: 0.8),
                          fontWeight: FontWeight.w500)),
                ],
              ))
          .toList(),
    );
  }
}

// ─── Labeled input ────────────────────────────────────────────────────────────

class _LabeledInput extends StatelessWidget {
  const _LabeledInput({
    required this.label,
    required this.controller,
    required this.suffix,
    required this.icon,
    required this.iconColor,
    this.enabled = true,
  });

  final String label;
  final TextEditingController controller;
  final String suffix;
  final IconData icon;
  final Color iconColor;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      enabled: enabled,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 16, color: iconColor),
        suffixText: suffix,
        isDense: true,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      ),
    );
  }
}

// ─── Badge inline ─────────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  const _Badge(
      {required this.label, required this.color, required this.textColor});
  final String label;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w700, color: textColor),
      ),
    );
  }
}

// ─── Rest timer picker ────────────────────────────────────────────────────────

class _RestTimerPicker extends StatefulWidget {
  const _RestTimerPicker({required this.current, required this.onSelected});
  final int current;
  final ValueChanged<int> onSelected;

  @override
  State<_RestTimerPicker> createState() => _RestTimerPickerState();
}

class _RestTimerPickerState extends State<_RestTimerPicker> {
  static const _presets = [30, 45, 60, 90, 120, 180, 240, 300];
  final _ctrl = TextEditingController();
  bool _custom = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.timer_outlined, size: 20),
              const SizedBox(width: 8),
              Text('Tempo de descanso',
                  style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ..._presets.map((s) {
                final selected = !_custom && s == widget.current;
                return ChoiceChip(
                  label: Text(_formatRest(s)),
                  selected: selected,
                  onSelected: (_) => widget.onSelected(s),
                  selectedColor: cs.primary,
                  labelStyle: TextStyle(
                    color: selected ? cs.onPrimary : cs.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                );
              }),
              ChoiceChip(
                label: const Text('Personalizado'),
                selected: _custom,
                onSelected: (_) => setState(() => _custom = true),
                selectedColor: cs.primary,
                labelStyle: TextStyle(
                  color: _custom ? cs.onPrimary : cs.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          if (_custom) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    keyboardType: TextInputType.number,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Segundos',
                      hintText: 'Ex: 75',
                      suffixText: 's',
                    ),
                    onSubmitted: (_) => _submitCustom(),
                  ),
                ),
                const SizedBox(width: 12),
                FilledButton(
                  onPressed: _submitCustom,
                  child: const Text('OK'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  void _submitCustom() {
    final v = int.tryParse(_ctrl.text.trim());
    if (v != null && v > 0) widget.onSelected(v);
  }
}

// ─── RPE ──────────────────────────────────────────────────────────────────────

class _RpeSelector extends StatelessWidget {
  const _RpeSelector({required this.value, required this.onChanged});
  final int? value;
  final ValueChanged<int> onChanged;

  static const _colors = {
    1: Color(0xFF4CAF50), 2: Color(0xFF66BB6A), 3: Color(0xFF8BC34A),
    4: Color(0xFFCDDC39), 5: Color(0xFFFFEB3B), 6: Color(0xFFFFC107),
    7: Color(0xFFFF9800), 8: Color(0xFFFF5722), 9: Color(0xFFF44336),
    10: Color(0xFFB71C1C),
  };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(left: 36, bottom: 6, top: 2),
      child: Row(
        children: [
          Text('RPE ',
              style: TextStyle(
                  fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5))),
          Flexible(
            child: Wrap(
              spacing: 3,
              children: List.generate(10, (i) {
                final v = i + 1;
                final sel = value == v;
                final col = _colors[v] ?? Colors.grey;
                return GestureDetector(
                  onTap: () => onChanged(v),
                  child: Container(
                    width: 24,
                    height: 24,
                    margin: const EdgeInsets.only(bottom: 2),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: sel ? col : cs.surfaceContainerHighest,
                      border: Border.all(
                        color: sel ? col : cs.outlineVariant,
                        width: sel ? 2 : 1,
                      ),
                    ),
                    child: Center(
                      child: Text('$v',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: sel
                                ? Colors.white
                                : cs.onSurface.withValues(alpha: 0.7),
                          )),
                    ),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Set row ──────────────────────────────────────────────────────────────────

class _SetRow extends StatefulWidget {
  const _SetRow({
    required this.setNumber,
    required this.set,
    required this.onRepsChanged,
    required this.onWeightChanged,
    required this.onToggle,
    this.isSessionBest = false,
    this.onRemove,
    this.weightIncrement = 2.5,
  });

  final int setNumber;
  final LoggedSet set;
  final ValueChanged<int> onRepsChanged;
  final ValueChanged<double> onWeightChanged;
  final VoidCallback onToggle;
  final bool isSessionBest;
  final VoidCallback? onRemove;
  final double weightIncrement;

  @override
  State<_SetRow> createState() => _SetRowState();
}

class _SetRowState extends State<_SetRow> with SingleTickerProviderStateMixin {
  late final AnimationController _prCtrl;
  late final Animation<double> _prScale;
  bool _wasBest = false;

  @override
  void initState() {
    super.initState();
    _prCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _prScale = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.6), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 1.6, end: 0.9), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 0.9, end: 1.0), weight: 30),
    ]).animate(CurvedAnimation(parent: _prCtrl, curve: Curves.easeOut));
    _wasBest = widget.isSessionBest;
  }

  @override
  void didUpdateWidget(_SetRow old) {
    super.didUpdateWidget(old);
    if (widget.isSessionBest && !_wasBest) {
      _prCtrl.forward(from: 0);
      HapticFeedback.heavyImpact();
    }
    _wasBest = widget.isSessionBest;
  }

  @override
  void dispose() {
    _prCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final completedBg = widget.set.isCompleted
        ? Colors.green.withValues(alpha: 0.08)
        : Colors.transparent;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: completedBg,
        borderRadius: BorderRadius.circular(8),
      ),
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
      child: Row(
        children: [
          // Set number + PR badge
          SizedBox(
            width: 28,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Text('${widget.setNumber}',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: cs.onSurface.withValues(alpha: 0.5),
                        fontSize: 13)),
                if (widget.isSessionBest)
                  Positioned(
                    top: -2,
                    right: 0,
                    child: ScaleTransition(
                      scale: _prScale,
                      child: const Text('🏆',
                          style: TextStyle(fontSize: 9)),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 3,
            child: _WeightStepper(
              value: widget.set.weight,
              increment: widget.weightIncrement,
              enabled: !widget.set.isCompleted,
              onChanged: widget.onWeightChanged,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 2,
            child: _InlineInput(
              value: widget.set.reps == 0 ? '' : widget.set.reps.toString(),
              hint: '0',
              onChanged: (v) => widget.onRepsChanged(int.tryParse(v) ?? 0),
              suffix: 'x',
              enabled: !widget.set.isCompleted,
            ),
          ),
          // Remove set button
          if (widget.onRemove != null)
            IconButton(
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 40),
              icon: Icon(Icons.remove_circle_outline,
                  size: 18, color: cs.error.withValues(alpha: 0.55)),
              onPressed: widget.onRemove,
            )
          else
            const SizedBox(width: 32),
          // Complete toggle
          IconButton(
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
            icon: Icon(
              widget.set.isCompleted
                  ? Icons.check_circle
                  : Icons.check_circle_outline,
              color: widget.set.isCompleted
                  ? Colors.green.shade500
                  : cs.onSurface.withValues(alpha: 0.35),
              size: 28,
            ),
            onPressed: widget.onToggle,
          ),
        ],
      ),
    );
  }
}

// ─── Weight stepper ───────────────────────────────────────────────────────────

class _WeightStepper extends StatefulWidget {
  const _WeightStepper({
    required this.value,
    required this.increment,
    required this.onChanged,
    this.enabled = true,
  });

  final double value;
  final double increment;
  final ValueChanged<double> onChanged;
  final bool enabled;

  @override
  State<_WeightStepper> createState() => _WeightStepperState();
}

class _WeightStepperState extends State<_WeightStepper> {
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(
      text: widget.value == 0 ? '' : _format(widget.value),
    );
  }

  @override
  void didUpdateWidget(_WeightStepper old) {
    super.didUpdateWidget(old);
    // Sync when the value changes externally (e.g. set marked complete)
    if (old.value != widget.value) {
      final newText = widget.value == 0 ? '' : _format(widget.value);
      if (_ctrl.text != newText) _ctrl.text = newText;
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  String _format(double v) =>
      v == v.truncateToDouble() ? v.toInt().toString() : v.toString();

  void _step(double delta) {
    final current = double.tryParse(_ctrl.text.replaceAll(',', '.')) ?? 0;
    final next = (current + delta).clamp(0.0, double.infinity);
    final text = _format(next);
    _ctrl.text = text;
    _ctrl.selection = TextSelection.collapsed(offset: text.length);
    widget.onChanged(next);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    final stepBtn = (IconData icon, VoidCallback? onTap) => GestureDetector(
          onTap: onTap,
          child: Container(
            width: 28,
            height: 36,
            decoration: BoxDecoration(
              color: widget.enabled
                  ? cs.surfaceContainerLow
                  : cs.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: cs.outlineVariant.withValues(alpha: 0.6),
                width: 0.5,
              ),
            ),
            child: Icon(
              icon,
              size: 14,
              color: widget.enabled
                  ? cs.onSurface.withValues(alpha: 0.7)
                  : cs.onSurface.withValues(alpha: 0.25),
            ),
          ),
        );

    return Row(
      children: [
        stepBtn(
          Icons.remove,
          widget.enabled ? () => _step(-widget.increment) : null,
        ),
        const SizedBox(width: 4),
        Expanded(
          child: TextField(
            controller: _ctrl,
            enabled: widget.enabled,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: widget.enabled
                  ? cs.onSurface
                  : cs.onSurface.withValues(alpha: 0.4),
            ),
            decoration: InputDecoration(
              hintText: '0',
              hintStyle:
                  TextStyle(color: cs.onSurface.withValues(alpha: 0.35)),
              suffixText: 'kg',
              suffixStyle: TextStyle(
                  fontSize: 11,
                  color: cs.onSurface.withValues(alpha: 0.45)),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              isDense: true,
              filled: true,
              fillColor: widget.enabled
                  ? cs.surfaceContainerLow
                  : cs.surfaceContainerLowest,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide:
                    BorderSide(color: cs.outlineVariant, width: 0.5),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide:
                    BorderSide(color: cs.outlineVariant, width: 0.5),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: cs.primary, width: 1.5),
              ),
              disabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                    color: cs.outlineVariant.withValues(alpha: 0.3),
                    width: 0.5),
              ),
            ),
            onChanged: (v) =>
                widget.onChanged(double.tryParse(v.replaceAll(',', '.')) ?? 0),
          ),
        ),
        const SizedBox(width: 4),
        stepBtn(
          Icons.add,
          widget.enabled ? () => _step(widget.increment) : null,
        ),
      ],
    );
  }
}

class _InlineInput extends StatefulWidget {
  const _InlineInput({
    required this.value,
    required this.onChanged,
    required this.suffix,
    this.hint = '',
    this.enabled = true,
  });

  final String value;
  final ValueChanged<String> onChanged;
  final String suffix;
  final String hint;
  final bool enabled;

  @override
  State<_InlineInput> createState() => _InlineInputState();
}

class _InlineInputState extends State<_InlineInput> {
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: widget.value);
  }

  @override
  void didUpdateWidget(_InlineInput old) {
    super.didUpdateWidget(old);
    // Only sync externally when the field is not focused (user not typing)
    if (old.value != widget.value &&
        !(_ctrl.selection.isValid &&
            FocusScope.of(context).hasFocus)) {
      _ctrl.text = widget.value;
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return TextField(
      controller: _ctrl,
      enabled: widget.enabled,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      textAlign: TextAlign.center,
      style: TextStyle(
          color: widget.enabled
              ? cs.onSurface
              : cs.onSurface.withValues(alpha: 0.4)),
      decoration: InputDecoration(
        hintText: widget.hint,
        hintStyle: TextStyle(color: cs.onSurface.withValues(alpha: 0.35)),
        suffixText: widget.suffix,
        suffixStyle: TextStyle(
            fontSize: 12, color: cs.onSurface.withValues(alpha: 0.45)),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        isDense: true,
        filled: true,
        fillColor: widget.enabled
            ? cs.surfaceContainerLow
            : cs.surfaceContainerLowest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: cs.outlineVariant, width: 0.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: cs.outlineVariant, width: 0.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: cs.primary, width: 1.5),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
              color: cs.outlineVariant.withValues(alpha: 0.3), width: 0.5),
        ),
      ),
      onChanged: widget.onChanged,
    );
  }
}

// ─── Quick add exercise ───────────────────────────────────────────────────────

class _QuickAddExercise extends ConsumerStatefulWidget {
  const _QuickAddExercise({required this.onAdd});
  final ValueChanged<ExerciseDefinition> onAdd;

  @override
  ConsumerState<_QuickAddExercise> createState() =>
      _QuickAddExerciseState();
}

class _QuickAddExerciseState extends ConsumerState<_QuickAddExercise> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final exercisesAsync = ref.watch(exerciseDefinitionsProvider);
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    final cs = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: cs.onSurface.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Text('Adicionar exercício',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          TextField(
            autofocus: true,
            decoration: const InputDecoration(
              hintText: 'Buscar...',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (v) => setState(() => _query = v.toLowerCase()),
          ),
          const SizedBox(height: 8),
          exercisesAsync.when(
            loading: () =>
                const Center(child: CircularProgressIndicator()),
            error: (_, __) => const Text('Erro ao carregar exercícios'),
            data: (exercises) {
              final filtered = exercises
                  .where((e) => e.name.toLowerCase().contains(_query))
                  .toList();
              return SizedBox(
                height: 220,
                child: ListView.builder(
                  itemCount: filtered.length,
                  itemBuilder: (_, i) => ListTile(
                    title: Text(filtered[i].name),
                    subtitle: filtered[i].muscleGroup != null
                        ? Text(filtered[i].muscleGroup!)
                        : null,
                    onTap: () {
                      widget.onAdd(filtered[i]);
                      Navigator.pop(context);
                    },
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ─── Share Workout Sheet ──────────────────────────────────────────────────────

class ShareWorkoutSheet extends StatefulWidget {
  const ShareWorkoutSheet({
    required this.workoutName,
    required this.exercises,
    required this.durationSeconds,
    required this.sessionId,
    required this.userId,
  });

  final String workoutName;
  final List<ActiveExercise> exercises;
  final int durationSeconds;
  final String sessionId;
  final String userId;

  @override
  State<ShareWorkoutSheet> createState() => _ShareWorkoutSheetState();
}

class _ShareWorkoutSheetState extends State<ShareWorkoutSheet> {
  final _captionCtrl = TextEditingController();
  final _bpmCtrl = TextEditingController();
  final _kcalCtrl = TextEditingController();
  final Set<String> _selectedGroups = {};
  bool _shareToFeed = true;
  bool _isPublicFeed = false;
  bool _submitting = false;
  List<Group>? _groups;
  String? _error;
  final List<Uint8List> _imagesList = [];
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadGroups();
    // Rebuild summary card when smartwatch fields change
    _bpmCtrl.addListener(() => setState(() {}));
    _kcalCtrl.addListener(() => setState(() {}));
  }

  /// Salva BPM/Kcal do smartwatch na sessão (silenciosamente)
  Future<void> _saveSmartwatch() async {
    final bpm = int.tryParse(_bpmCtrl.text.trim());
    final kcal = int.tryParse(_kcalCtrl.text.trim());
    if (bpm == null && kcal == null) return;
    try {
      await WorkoutsService.instance.updateSessionMeta(
        widget.userId, widget.sessionId,
        avgBpm: bpm, kcal: kcal,
      );
    } catch (_) {}
  }

  @override
  void dispose() {
    _captionCtrl.dispose();
    _bpmCtrl.dispose();
    _kcalCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    if (_imagesList.length >= 3) return;
    final picked = await _picker.pickImage(
      source: source,
      maxWidth: 1080,
      imageQuality: 80,
    );
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    if (mounted) setState(() => _imagesList.add(bytes));
  }

  void _showImageSource() {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Galeria'),
              onTap: () { Navigator.pop(context); _pickImage(ImageSource.gallery); },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Câmera'),
              onTap: () { Navigator.pop(context); _pickImage(ImageSource.camera); },
            ),
          ],
        ),
      ),
    );
  }

  /// PR badges: one per exercise that has at least one completed set with weight > 0.
  List<({String name, double maxWeight})> get _prBadges {
    final badges = <({String name, double maxWeight})>[];
    for (final ex in widget.exercises) {
      final maxW = ex.sets
          .where((s) => s.isCompleted && s.weight > 0)
          .fold<double>(0, (m, s) => s.weight > m ? s.weight : m);
      if (maxW > 0) badges.add((name: ex.exerciseName, maxWeight: maxW));
    }
    return badges;
  }

  Future<void> _loadGroups() async {
    try {
      final groups = await SocialService.instance.listMyGroups();
      if (mounted) setState(() => _groups = groups);
    } catch (e) {
      if (mounted) setState(() => _error = 'Erro ao carregar grupos');
    }
  }

  double get _totalVolume => widget.exercises.fold(
        0,
        (v, e) => v +
            e.sets
                .where((s) => s.isCompleted)
                .fold<double>(0, (sv, s) => sv + s.weight * s.reps),
      );

  String get _durationText {
    final m = widget.durationSeconds ~/ 60;
    final s = widget.durationSeconds % 60;
    if (m < 60) return '${m}min ${s}s';
    final h = m ~/ 60;
    return '${h}h ${(m % 60)}min';
  }

  Future<void> _share() async {
    if (_selectedGroups.isEmpty && !_shareToFeed) return;
    setState(() => _submitting = true);

    final exercisesData = widget.exercises.map((e) {
      final completedSets = e.sets.where((s) => s.isCompleted).toList();
      if (e.isCardio) {
        final subtype = e.cardioSubtype ?? 'generico';
        final totalDuration = completedSets.fold<int>(0, (v, s) => v + (s.durationSeconds ?? 0));
        final intensity = completedSets.isNotEmpty ? completedSets.last.intensity?.name : null;

        if (e.isSwimming) {
          final totalLaps = completedSets.fold<int>(0, (v, s) => v + (s.lapsCount ?? 0));
          return {
            'name': e.exerciseName, 'exerciseType': 'cardio', 'cardioSubtype': subtype,
            'sets': completedSets.map((s) => {'durationSeconds': s.durationSeconds, 'lapsCount': s.lapsCount}).toList(),
            'totalDuration': totalDuration, 'totalLaps': totalLaps,
            'poolLengthM': e.plannedPoolLengthM ?? 25,
            if (completedSets.isNotEmpty && completedSets.last.swimStyle != null)
              'swimStyle': completedSets.last.swimStyle!.name,
          };
        } else if (e.isStairs) {
          final totalFloors = completedSets.fold<int>(0, (v, s) => v + (s.floorsClimbed ?? 0));
          return {
            'name': e.exerciseName, 'exerciseType': 'cardio', 'cardioSubtype': subtype,
            'sets': completedSets.map((s) => {'durationSeconds': s.durationSeconds, 'floorsClimbed': s.floorsClimbed}).toList(),
            'totalDuration': totalDuration,
            if (totalFloors > 0) 'floorsClimbed': totalFloors,
            if (completedSets.isNotEmpty && completedSets.last.inclinePercent != null)
              'inclinePercent': completedSets.last.inclinePercent,
            if (intensity != null) 'intensity': intensity,
          };
        } else if (e.isFunctional) {
          final totalReps = completedSets.fold<int>(0, (v, s) => v + (s.repsCount ?? 0));
          return {
            'name': e.exerciseName, 'exerciseType': 'cardio', 'cardioSubtype': subtype,
            'sets': completedSets.map((s) => {'durationSeconds': s.durationSeconds, 'repsCount': s.repsCount}).toList(),
            'totalDuration': totalDuration,
            if (totalReps > 0) 'repsCount': totalReps,
            if (intensity != null) 'intensity': intensity,
          };
        } else if (e.isCyclingIndoor) {
          final totalDistance = completedSets.fold<double>(0, (v, s) => v + (s.distanceKm ?? 0));
          return {
            'name': e.exerciseName, 'exerciseType': 'cardio', 'cardioSubtype': subtype,
            'sets': completedSets.map((s) => {'durationSeconds': s.durationSeconds, 'distanceKm': s.distanceKm}).toList(),
            'totalDuration': totalDuration, 'totalDistance': totalDistance,
            if (completedSets.isNotEmpty && completedSets.last.cadenceRpm != null)
              'cadenceRpm': completedSets.last.cadenceRpm,
            if (completedSets.isNotEmpty && completedSets.last.inclinePercent != null)
              'inclinePercent': completedSets.last.inclinePercent,
            if (intensity != null) 'intensity': intensity,
          };
        } else if (e.isRowing) {
          final totalDistance = completedSets.fold<double>(0, (v, s) => v + (s.distanceKm ?? 0));
          return {
            'name': e.exerciseName, 'exerciseType': 'cardio', 'cardioSubtype': subtype,
            'sets': completedSets.map((s) => {'durationSeconds': s.durationSeconds, 'distanceKm': s.distanceKm}).toList(),
            'totalDuration': totalDuration, 'totalDistance': totalDistance,
            if (completedSets.isNotEmpty && completedSets.last.strokesPerMin != null)
              'strokesPerMin': completedSets.last.strokesPerMin,
          };
        } else if (e.isCyclingOutdoor) {
          // Ciclismo outdoor: distância + elevação + cadência
          final totalDistance = completedSets.fold<double>(0, (v, s) => v + (s.distanceKm ?? 0));
          final elevationGainM = completedSets.fold<int>(0, (v, s) => v + (s.elevationGainM ?? 0));
          return {
            'name': e.exerciseName, 'exerciseType': 'cardio', 'cardioSubtype': subtype,
            'sets': completedSets.map((s) => {'durationSeconds': s.durationSeconds, 'distanceKm': s.distanceKm}).toList(),
            'totalDuration': totalDuration, 'totalDistance': totalDistance,
            if (elevationGainM > 0) 'elevationGainM': elevationGainM,
            if (completedSets.isNotEmpty && completedSets.last.cadenceRpm != null)
              'cadenceRpm': completedSets.last.cadenceRpm,
            if (intensity != null) 'intensity': intensity,
          };
        } else {
          // corrida, caminhada, generico
          final totalDistance = completedSets.fold<double>(0, (v, s) => v + (s.distanceKm ?? 0));
          final elevationGainM = completedSets.fold<int>(0, (v, s) => v + (s.elevationGainM ?? 0));
          return {
            'name': e.exerciseName, 'exerciseType': 'cardio', 'cardioSubtype': subtype,
            'sets': completedSets.map((s) => {'distanceKm': s.distanceKm, 'durationSeconds': s.durationSeconds}).toList(),
            'totalDistance': totalDistance, 'totalDuration': totalDuration,
            if (elevationGainM > 0) 'elevationGainM': elevationGainM,
            if (completedSets.isNotEmpty && completedSets.last.runType != null)
              'runType': completedSets.last.runType!.name,
            if (completedSets.isNotEmpty && completedSets.last.inclinePercent != null)
              'inclinePercent': completedSets.last.inclinePercent,
            if (intensity != null) 'intensity': intensity,
          };
        }
      }
      // Força
      final totalVolume = completedSets.fold<double>(0, (v, s) => v + s.weight * s.reps);
      final ratedSets = completedSets.where((s) => s.rpe != null).toList();
      final avgRpe = ratedSets.isNotEmpty
          ? ratedSets.fold<double>(0, (v, s) => v + s.rpe!) / ratedSets.length
          : null;
      return {
        'name': e.exerciseName,
        'sets': completedSets.map((s) => {'reps': s.reps, 'weight': s.weight}).toList(),
        if (totalVolume > 0) 'totalVolume': totalVolume,
        if (avgRpe != null) 'avgRpe': double.parse(avgRpe.toStringAsFixed(1)),
      };
    }).toList();

    final bpm = int.tryParse(_bpmCtrl.text.trim());
    final kcal = int.tryParse(_kcalCtrl.text.trim());
    final badges = _prBadges;

    // Salva BPM/Kcal do smartwatch na sessão antes de compartilhar
    await _saveSmartwatch();

    try {
      final caption = _captionCtrl.text.trim().isNotEmpty
          ? _captionCtrl.text.trim()
          : null;
      final imgs = _imagesList.map((b) => base64Encode(b)).toList();
      final prNames = badges.map((b) => b.name).toList();

      if (_shareToFeed) {
        await SocialService.instance.createFeedPost(
          workoutName: widget.workoutName,
          durationSeconds: widget.durationSeconds,
          totalVolume: _totalVolume,
          exercises: exercisesData,
          bpm: bpm,
          kcal: kcal,
          prBadges: prNames,
          caption: caption,
          imagesBase64: imgs,
          isPublic: _isPublicFeed,
        );
      }
      for (final groupId in _selectedGroups) {
        await SocialService.instance.createWorkoutPost(
          groupId,
          workoutName: widget.workoutName,
          durationSeconds: widget.durationSeconds,
          totalVolume: _totalVolume,
          exercises: exercisesData,
          bpm: bpm,
          kcal: kcal,
          prBadges: prNames,
          caption: caption,
          imagesBase64: imgs,
        );
      }
      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao compartilhar: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(
          16, 16, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: cs.onSurface.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            Row(
              children: [
                const Text('🏋️', style: TextStyle(fontSize: 24)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Compartilhar treino',
                          style: theme.textTheme.titleLarge),
                      Text('Compartilhe seu progresso com seus grupos',
                          style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () async {
                    await _saveSmartwatch();
                    if (mounted) Navigator.pop(context);
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Workout summary card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: cs.primaryContainer.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: cs.primary.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.workoutName,
                      style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      _StatChip(
                          icon: Icons.timer_outlined,
                          label: _durationText),
                      _StatChip(
                          icon: Icons.fitness_center,
                          label:
                              '${widget.exercises.length} exercício${widget.exercises.length == 1 ? '' : 's'}'),
                      _StatChip(
                          icon: Icons.bar_chart,
                          label:
                              '${_totalVolume.toStringAsFixed(0)}kg'),
                      if (_bpmCtrl.text.trim().isNotEmpty)
                        _StatChip(
                            icon: Icons.favorite,
                            label: '${_bpmCtrl.text.trim()} bpm',
                            color: Colors.redAccent),
                      if (_kcalCtrl.text.trim().isNotEmpty)
                        _StatChip(
                            icon: Icons.local_fire_department,
                            label: '${_kcalCtrl.text.trim()} kcal',
                            color: Colors.orange),
                    ],
                  ),
                  // PR badges
                  if (_prBadges.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: _prBadges
                          .map((b) => _PrBadgeChip(
                                name: b.name,
                                maxWeight: b.maxWeight,
                              ))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Smartwatch data ───────────────────────────────────────────
            Row(
              children: [
                Icon(Icons.watch_outlined,
                    size: 16,
                    color: cs.onSurface.withValues(alpha: 0.6)),
                const SizedBox(width: 6),
                Text('Smartwatch (opcional)',
                    style: theme.textTheme.titleSmall),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _bpmCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'BPM médio',
                      prefixIcon: Icon(Icons.favorite_border,
                          size: 18, color: Colors.redAccent),
                      suffixText: 'bpm',
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _kcalCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Kcal gastas',
                      prefixIcon: Icon(Icons.local_fire_department_outlined,
                          size: 18, color: Colors.orange),
                      suffixText: 'kcal',
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 10),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Caption
            TextField(
              controller: _captionCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Adicione uma legenda (opcional)...',
                contentPadding: EdgeInsets.all(12),
              ),
            ),
            const SizedBox(height: 12),

            // Story card
            OutlinedButton.icon(
              onPressed: () => showStoryShareSheet(
                context,
                workoutName: widget.workoutName,
                durationSeconds: widget.durationSeconds,
                exercises: widget.exercises,
                sessionDate: DateTime.now(),
              ),
              icon: const Icon(Icons.auto_awesome, size: 18),
              label: const Text('Criar Story para Instagram'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 44),
              ),
            ),
            const SizedBox(height: 12),

            // Cardio story card (only when there are cardio exercises)
            if (widget.exercises.any((e) => e.isCardio)) ...[
              OutlinedButton.icon(
                onPressed: () => showCardioStorySheet(
                  context,
                  cardioExercises:
                      widget.exercises.where((e) => e.isCardio).toList(),
                  sessionDate: DateTime.now(),
                ),
                icon: const Icon(Icons.directions_run, size: 18),
                label: const Text('Criar Story de Cardio'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 44),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Photos (up to 3 thumbnails)
            Row(
              children: [
                ..._imagesList.asMap().entries.map((entry) {
                  final i = entry.key;
                  final bytes = entry.value;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.memory(
                            bytes,
                            width: 80,
                            height: 80,
                            fit: BoxFit.cover,
                            gaplessPlayback: true,
                          ),
                        ),
                        Positioned(
                          top: 2,
                          right: 2,
                          child: GestureDetector(
                            onTap: () => setState(() => _imagesList.removeAt(i)),
                            child: Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.6),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.close, color: Colors.white, size: 14),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                if (_imagesList.length < 3)
                  GestureDetector(
                    onTap: _showImageSource,
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: Theme.of(context).colorScheme.outline,
                        ),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.add_photo_alternate_outlined,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                            size: 26,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _imagesList.isEmpty ? 'Foto' : 'Adicionar',
                            style: TextStyle(
                              fontSize: 11,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Feed toggle
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _shareToFeed,
              onChanged: (v) => setState(() {
                _shareToFeed = v;
                if (!v) _isPublicFeed = false;
              }),
              title: Row(children: [
                const Text('🌐 ', style: TextStyle(fontSize: 16)),
                Text('Compartilhar no feed', style: theme.textTheme.titleSmall),
              ]),
              subtitle: const Text('Aparece para quem te segue'),
            ),
            if (_shareToFeed)
              SwitchListTile(
                contentPadding: const EdgeInsets.only(left: 16),
                value: _isPublicFeed,
                onChanged: (v) => setState(() => _isPublicFeed = v),
                title: Row(children: [
                  const Text('🌍 ', style: TextStyle(fontSize: 14)),
                  Text('Postar no feed Global', style: theme.textTheme.bodyMedium),
                ]),
                subtitle: const Text('Visível para todos, não só seguidores'),
              ),
            const Divider(height: 8),

            // Groups
            Text('Compartilhar em grupos:',
                style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),

            if (_error != null)
              Text(_error!, style: TextStyle(color: cs.error))
            else if (_groups == null)
              const Center(child: CircularProgressIndicator())
            else if (_groups!.isEmpty)
              Text(
                  'Você ainda não faz parte de nenhum grupo.',
                  style: theme.textTheme.bodySmall)
            else
              ...(_groups!.map((g) => _GroupTile(
                    group: g,
                    selected: _selectedGroups.contains(g.id),
                    onToggle: () => setState(() {
                      if (_selectedGroups.contains(g.id)) {
                        _selectedGroups.remove(g.id);
                      } else {
                        _selectedGroups.add(g.id);
                      }
                    }),
                  ))),

            const SizedBox(height: 20),

            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Agora não'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: (_selectedGroups.isEmpty && !_shareToFeed) || _submitting
                        ? null
                        : _share,
                    icon: _submitting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white))
                        : const Icon(Icons.share),
                    label: Text(
                        _submitting ? 'Compartilhando...' : 'Compartilhar'),
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

class _StatChip extends StatelessWidget {
  const _StatChip({required this.icon, required this.label, this.color});
  final IconData icon;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final c = color ?? cs.primary;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: c),
        const SizedBox(width: 4),
        Text(label,
            style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.8))),
      ],
    );
  }
}

class _PrBadgeChip extends StatelessWidget {
  const _PrBadgeChip({required this.name, required this.maxWeight});
  final String name;
  final double maxWeight;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFD4AF37).withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: const Color(0xFFD4AF37).withValues(alpha: 0.5), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🏆', style: TextStyle(fontSize: 11)),
          const SizedBox(width: 4),
          Text(
            '$name — ${maxWeight % 1 == 0 ? maxWeight.toInt() : maxWeight}kg',
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFF8B6914),
            ),
          ),
        ],
      ),
    );
  }
}

class _GroupTile extends StatelessWidget {
  const _GroupTile(
      {required this.group,
      required this.selected,
      required this.onToggle});
  final Group group;
  final bool selected;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onToggle,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? cs.primary : cs.outlineVariant,
            width: selected ? 1.5 : 1,
          ),
          color: selected
              ? cs.primary.withValues(alpha: 0.06)
              : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(
              selected
                  ? Icons.check_box
                  : Icons.check_box_outline_blank,
              color: selected ? cs.primary : cs.onSurface.withValues(alpha: 0.4),
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(group.name,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text('${group.membersCount} membros',
                      style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
