// lib/features/workouts/screens/workout_day_screen.dart
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_exception.dart';
import '../providers/workouts_provider.dart';
import '../data/workouts_service.dart';
import '../data/wods_service.dart';
import '../data/crossfit_movements.dart';
import '../domain/workout_models.dart';
import '../../auth/providers/auth_provider.dart';
import '../../social/data/social_service.dart';
import '../../social/domain/social_models.dart';
import '../../../shared/providers/settings_provider.dart';
import '../../../shared/providers/brand_provider.dart';
import '../../analytics/providers/analytics_provider.dart';
import '../../../shared/tutorial/tutorial_keys.dart';
import '../../../shared/tutorial/tutorial_phases.dart';
import '../../../shared/tutorial/tutorial_trigger.dart';
import 'workout_session_screen.dart';

class WorkoutDayScreen extends ConsumerWidget {
  const WorkoutDayScreen({super.key, required this.dayId});
  final String dayId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final daysAsync = ref.watch(workoutDaysProvider);

    return daysAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('Erro: $e')),
      ),
      data: (days) {
        final day = days.where((d) => d.id == dayId).firstOrNull;
        if (day == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: Text('Treino não encontrado')),
          );
        }
        return _DayDetail(day: day);
      },
    );
  }
}

class _DayDetail extends ConsumerStatefulWidget {
  const _DayDetail({required this.day});
  final WorkoutDay day;

  @override
  ConsumerState<_DayDetail> createState() => _DayDetailState();
}

enum _TrainingMode { resistencia, forca }

/// Toast de overlay com auto-dismiss garantido via Timer.
/// Imune a rebuilds do ScaffoldMessenger e a animações de navegação.
void _showSaveToast(BuildContext context, {required VoidCallback onUndo}) {
  final overlay = Overlay.of(context, rootOverlay: true);
  OverlayEntry? entry;

  void remove() {
    if (entry?.mounted ?? false) entry?.remove();
    entry = null;
  }

  entry = OverlayEntry(
    builder: (_) => Positioned(
      left: 16,
      right: 16,
      bottom: 96,
      child: Material(
        color: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF323232),
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              const Expanded(
                child: Text(
                  'Treino salvo com sucesso',
                  style: TextStyle(color: Colors.white, fontSize: 14),
                ),
              ),
              TextButton(
                onPressed: () { remove(); onUndo(); },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Desfazer',
                  style: TextStyle(
                    color: Color(0xFFBB86FC),
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  overlay.insert(entry!);
  Timer(const Duration(seconds: 4), remove);
}

class _DayDetailState extends ConsumerState<_DayDetail> {
  Timer? _timer;
  bool _saving = false;
  _TrainingMode _mode = _TrainingMode.resistencia;
  // Pesos do último treino concluído para este dia: exerciseDefinitionId → peso máximo
  Map<String, double> _lastWeights = {};

  void _onModeChanged(_TrainingMode m) {
    setState(() => _mode = m);
    // Se há sessão ativa para este dia, atualiza exercícios não iniciados
    final session = ref.read(activeSessionProvider);
    if (session.dayId == widget.day.id && session.isActive) {
      ref.read(activeSessionProvider.notifier).applyTrainingMode(
            plannedExercises: widget.day.exercises,
            forceMode: m == _TrainingMode.forca,
            lastWeights: _lastWeights,
          );
    }
  }

  /// Aplica os ajustes do modo Força: peso do último treino (ou planejado), -4 reps (mín. 1).
  PlannedExercise _applyForce(PlannedExercise ex) {
    final lastWeight = _lastWeights[ex.exerciseDefinitionId];
    final weight = lastWeight ?? (ex.weight > 0 ? ex.weight : 0.0);
    return PlannedExercise(
        id: ex.id,
        exerciseDefinitionId: ex.exerciseDefinitionId,
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        exerciseType: ex.exerciseType,
        cardioSubtype: ex.cardioSubtype,
        sets: ex.sets,
        reps: (ex.reps - 4).clamp(1, 999),
        weight: weight,
        restTime: ex.restTime,
        plannedDurationMinutes: ex.plannedDurationMinutes,
        plannedDistanceKm: ex.plannedDistanceKm,
        intensity: ex.intensity,
        runType: ex.runType,
        plannedPoolLengthM: ex.plannedPoolLengthM,
        plannedSwimStyle: ex.plannedSwimStyle,
        notes: ex.notes,
      );
  }

  @override
  void initState() {
    super.initState();
    // Atualiza o cronômetro a cada segundo quando há sessão ativa
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted &&
          ref.read(activeSessionProvider).dayId == widget.day.id &&
          ref.read(activeSessionProvider).isActive) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

Future<void> _finishDay() async {
    final session = ref.read(activeSessionProvider);
    final userId = ref.read(currentUserProvider)?.uid;
    if (userId == null || !session.isActive) return;

    // ── 1. Diálogo de confirmação ──────────────────────────────────────────
    final confirmed = await _showFinishConfirmation(session);
    if (!confirmed || !mounted) return;

    setState(() => _saving = true);
    final workoutName = session.dayName ?? widget.day.name;
    final exercises = session.exercises;
    final durationSeconds = session.elapsedSeconds;

    // ── 2. Salva a sessão (único ponto de falha exibido ao usuário) ────────
    String? sessionId;
    try {
      sessionId = await WorkoutsService.instance.saveSession(
        userId,
        workoutName: workoutName,
        workoutDayId: session.dayId,
        exercises: exercises,
        durationSeconds: durationSeconds,
        trainingMode: _mode == _TrainingMode.forca ? 'forca' : 'resistencia',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao salvar treino: ${_friendlyError(e)}')),
        );
      }
      if (mounted) setState(() => _saving = false);
      return;
    }

    // Save bem-sucedido — limpa a sessão ativa
    ref.read(activeSessionProvider.notifier).clear();
    ref.invalidate(workoutSessionsProvider);
    if (mounted) setState(() => _saving = false);
    // Vibração de conclusão: 2 pulsos fortes
    HapticFeedback.heavyImpact();
    await Future.delayed(const Duration(milliseconds: 120));
    HapticFeedback.heavyImpact();

    // ── 3. Sheet de compartilhar (erros silenciosos — não afetam o save) ──
    if (mounted) {
      try {
        await showShareWorkoutSheet(
          context,
          workoutName: workoutName,
          exercises: exercises,
          durationSeconds: durationSeconds,
          sessionId: sessionId,
          userId: userId,
        );
      } catch (_) {}
      // Invalida novamente para capturar BPM/Kcal do smartwatch
      ref.invalidate(workoutSessionsProvider);
    }

    // ── 4. Toast com desfazer via Overlay ────────────────────────────────
    if (mounted) {
      _showSaveToast(context, onUndo: () => _undoSave(userId, sessionId!));
    }
  }

  /// Extrai a mensagem real do erro (DioException → ApiException → mensagem do servidor).
  String _friendlyError(Object e) {
    if (e is DioException) {
      // Inclui detalhes de validação do servidor quando disponíveis
      final responseData = e.response?.data;
      if (responseData is Map) {
        final msg = responseData['message'] as String? ?? '';
        final errors = responseData['errors'];
        if (errors != null) return '$msg | $errors';
        if (msg.isNotEmpty) return msg;
      }
      final inner = e.error;
      if (inner is ApiException) return inner.message;
      if (e.response == null) return 'Sem conexão com o servidor';
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        return 'Tempo de resposta esgotado';
      }
    }
    if (e is ApiException) return e.message;
    return e.toString();
  }

  /// Exibe resumo da sessão e pede confirmação antes de salvar.
  Future<bool> _showFinishConfirmation(ActiveSessionState session) async {
    final completedCount = session.exercises
        .where((e) => e.sets.any((s) => s.isCompleted))
        .length;
    final totalSets = session.exercises
        .fold(0, (sum, e) => sum + e.sets.where((s) => s.isCompleted).length);
    final elapsed = _formatElapsed(session.elapsedSeconds);
    final modeLabel =
        _mode == _TrainingMode.forca ? '⚡ Força' : '❤️ Resistência';

    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Finalizar treino?'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ConfirmRow(icon: Icons.timer_outlined, text: elapsed),
                if (widget.day.dayType == 'musculacao')
                  _ConfirmRow(icon: Icons.bolt_outlined, text: modeLabel),
                _ConfirmRow(
                  icon: Icons.fitness_center,
                  text:
                      '$completedCount exercício${completedCount != 1 ? 's' : ''} • $totalSets série${totalSets != 1 ? 's' : ''} concluída${totalSets != 1 ? 's' : ''}',
                ),
                const SizedBox(height: 8),
                Text(
                  'Esses dados serão enviados para as Análises.',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancelar'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Confirmar'),
              ),
            ],
          ),
        ) ??
        false;
  }

  /// Deleta a sessão recém-salva (ação de desfazer).
  Future<void> _undoSave(String userId, String sessionId) async {
    if (sessionId.isEmpty) return;
    try {
      await WorkoutsService.instance.deleteSession(userId, sessionId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Treino removido das Análises')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível desfazer')),
        );
      }
    }
  }

  String _formatElapsed(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = seconds % 60;
    if (h > 0) return '${h}h ${m.toString().padLeft(2, '0')}m';
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(activeSessionProvider);
    final isSessionActive = session.dayId == widget.day.id && session.isActive;
    final day = widget.day;
    final defs = ref.watch(exerciseDefinitionsProvider).valueOrNull ?? [];

    // Computa pesos do último treino concluído para este dia, filtrado pelo modo atual
    final currentMode = _mode == _TrainingMode.forca ? 'forca' : 'resistencia';
    ref.watch(workoutSessionsProvider).whenData((sessions) {
      final compatible = sessions.where((s) =>
          s.workoutDayId == widget.day.id &&
          (s.trainingMode == currentMode || s.trainingMode == null));
      final last = compatible.fold<WorkoutSession?>(null, (prev, s) =>
          prev == null || s.createdAt.isAfter(prev.createdAt) ? s : prev);
      final weights = <String, double>{};
      if (last != null) {
        for (final ex in last.exercises) {
          if (ex.exerciseDefinitionId.isEmpty) continue;
          final maxW = ex.sets
              .where((s) => s.weight > 0)
              .map((s) => s.weight)
              .fold(0.0, (a, b) => a > b ? a : b);
          if (maxW > 0) weights[ex.exerciseDefinitionId] = maxW;
        }
      }
      _lastWeights = weights;
    });

    return Scaffold(
      appBar: AppBar(
        title: Text(day.name),
        actions: isSessionActive
            ? [
                // Elapsed timer + status indicator
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: Colors.green,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Em andamento',
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Theme.of(context)
                              .colorScheme
                              .primary
                              .withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _formatElapsed(session.elapsedSeconds),
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // Finalizar — sempre visível durante sessão ativa
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: _saving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : FilledButton(
                          onPressed: _finishDay,
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 6),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text('Finalizar',
                              style: TextStyle(fontSize: 13)),
                        ),
                ),
              ]
            : null,
      ),
      body: Stack(
        children: [
          // Tutorial — dispara na primeira visita a qualquer dia de treino
          TutorialTrigger(
            phase: TutorialPhases.workoutDay,
            steps: TutorialPhases.workoutDaySteps,
            delayMs: 800,
          ),
          day.exercises.isEmpty
          ? _EmptyExercises(onAdd: () => _showAddExercise(context))
          : Column(
              children: [
                // ── Toggle de modo de treino (só para Musculação) ────────
                if (day.dayType == 'musculacao')
                  _TrainingModeToggle(
                    mode: _mode,
                    onChanged: _onModeChanged,
                    hasLastSession: _lastWeights.isNotEmpty,
                  ),
                // ── Lista de exercícios ──────────────────────────────────
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                    itemCount: day.exercises.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final ex = day.exercises[i];
                      // Resolve muscle group
                      final resolvedMuscle = ex.muscleGroup ??
                          defs
                              .where((d) => d.id == ex.exerciseDefinitionId)
                              .firstOrNull
                              ?.muscleGroup;
                      // Exercício ativo na sessão — usa plannedExerciseId para
                      // matching correto mesmo quando exerciseDefinitionId é ''
                      final activeEx = isSessionActive
                          ? session.exercises
                              .where((ae) => ae.plannedExerciseId == ex.id)
                              .firstOrNull
                          : null;
                      final isCompleted = activeEx != null &&
                          activeEx.sets.isNotEmpty &&
                          activeEx.sets.every((s) => s.isCompleted);
                      final isInSession = activeEx != null;

                      // Aplica modo Força apenas para exercícios ainda não iniciados
                      final isForca = _mode == _TrainingMode.forca;
                      final displayEx =
                          isForca && !isInSession ? _applyForce(ex) : ex;
                      final lastW = _lastWeights[ex.exerciseDefinitionId];
                      final suggestedWeight = isForca && !isInSession && lastW != null
                          ? lastW + 2.5
                          : null;

                      return _ExerciseCard(
                        key: i == 0 ? TutorialKeys.workoutDayExerciseCard : null,
                        exercise: displayEx,
                        muscleGroup: resolvedMuscle,
                        isInSession: isInSession,
                        isCompleted: isCompleted,
                        isForceMode: isForca && !isInSession,
                        suggestedWeight: suggestedWeight,
                        onStart: () => showWorkoutSessionSheet(
                          context,
                          day.id,
                          exerciseId: ex.id,
                          adjustedExercise:
                              isForca && !isInSession ? _applyForce(ex) : null,
                        ),
                        onDelete: isSessionActive
                            ? null
                            : () => ref
                                .read(workoutDaysProvider.notifier)
                                .removeExercise(day.id, ex.id),
                      );
                    },
                  ),
                ),
              ],
            ),
        ],
      ),
      floatingActionButton: _GradientFab(
        tutorialKey: TutorialKeys.workoutDayFab,
        onPressed: () => _showAddExercise(context),
      ),
    );
  }

  void _showAddExercise(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddExerciseSheet(dayId: widget.day.id),
    );
  }
}

class _ExerciseCard extends ConsumerWidget {
  const _ExerciseCard({
    super.key,
    required this.exercise,
    required this.onStart,
    required this.onDelete,
    this.muscleGroup,
    this.isInSession = false,
    this.isCompleted = false,
    this.isForceMode = false,
    this.suggestedWeight,
  });
  final PlannedExercise exercise;
  final String? muscleGroup;
  final VoidCallback onStart;
  final VoidCallback? onDelete; // null = bloqueado por sessão ativa
  final bool isInSession;
  final bool isCompleted;
  final bool isForceMode;
  final double? suggestedWeight; // sugestão de aumento no modo Força

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: isCompleted
            ? Colors.green.withValues(alpha: 0.06)
            : isInSession
                ? cs.primary.withValues(alpha: 0.04)
                : theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCompleted
              ? Colors.green.shade400
              : isInSession
                  ? cs.primary.withValues(alpha: 0.4)
                  : cs.outlineVariant,
          width: (isCompleted || isInSession) ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
        child: Row(
          children: [
            // Ícone / status
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isCompleted
                    ? Colors.green.withValues(alpha: 0.12)
                    : cs.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: isCompleted
                  ? Icon(Icons.check_circle,
                      color: Colors.green.shade600, size: 24)
                  : exercise.isCrossFit
                      ? Text('🏋️', style: const TextStyle(fontSize: 22))
                      : exercise.isCardio
                          ? Icon(Icons.directions_run, color: cs.primary, size: 22)
                          : Icon(Icons.fitness_center, color: cs.primary, size: 22),
            ),
            const SizedBox(width: 12),
            // Nome + chips + status
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          exercise.exerciseName,
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: isCompleted ? Colors.green.shade700 : null,
                          ),
                        ),
                      ),
                      if (isCompleted) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.green.shade400,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            '✓ Concluído',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ] else if (isInSession) ...[
                        const SizedBox(width: 6),
                        Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: cs.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 5),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      // ── Musculação ──────────────────────────────────
                      if (!exercise.isCardio && !exercise.isCrossFit) ...[
                        if (muscleGroup != null)
                          _Chip('💪 $muscleGroup', primary: true),
                        if (isForceMode) _Chip('⚡ Força', accent: true),
                        _Chip('${exercise.sets}×${exercise.reps} reps'),
                        if (exercise.weight > 0)
                          _Chip('${exercise.weight}kg'),
                        if (suggestedWeight != null)
                          _Chip('💡 Tente ${suggestedWeight!.toStringAsFixed(1).replaceAll('.0', '')}kg', amber: true),
                        if (exercise.restTime > 0)
                          _Chip('⏸ ${exercise.restTime}s'),
                      ],
                      // ── Cardio (não CrossFit) ────────────────────────
                      if (exercise.isCardio && !exercise.isCrossFit) ...[
                        _Chip(_cardioSubtypeLabel(exercise.cardioSubtype), primary: true),
                        if (exercise.plannedDurationMinutes != null)
                          _Chip('⏱ ${exercise.plannedDurationMinutes}min'),
                        if (exercise.plannedDistanceKm != null)
                          _Chip('📍 ${exercise.plannedDistanceKm}km'),
                        if (exercise.intensity != null)
                          _Chip(_intensityLabel(exercise.intensity!)),
                        if (exercise.runType != null)
                          _Chip(_runTypeLabel(exercise.runType!)),
                        if (exercise.plannedPoolLengthM != null)
                          _Chip('🏊 ${exercise.plannedPoolLengthM}m'),
                        if (exercise.plannedSwimStyle != null)
                          _Chip(_swimStyleLabel(exercise.plannedSwimStyle!)),
                      ],
                      // ── CrossFit ────────────────────────────────────
                      if (exercise.isCrossFit) ...[
                        if (exercise.wodFormat != null)
                          _Chip(_wodFormatLabel(exercise.wodFormat!), orange: true),
                        if (exercise.plannedRounds != null)
                          _Chip(_wodRoundsLabel(exercise.wodFormat, exercise.plannedRounds!)),
                      ],
                    ],
                  ),
                  // Movimentos do WOD (CrossFit)
                  if (exercise.isCrossFit && exercise.wodMovements.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    ...exercise.wodMovements.map((m) => Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('• ',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.orange,
                                      fontWeight: FontWeight.w700)),
                              Flexible(
                                child: Text(
                                  [
                                    if (m.targetReps != null) '${m.targetReps}×',
                                    m.name,
                                    if (m.targetWeight != null && m.targetWeight! > 0)
                                      '(${m.targetWeight}kg)',
                                  ].join(' '),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: cs.onSurface.withValues(alpha: 0.75),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )),
                  ],
                  // Descrição WOD / notes
                  if (exercise.isCrossFit &&
                      exercise.wodDescription != null &&
                      exercise.wodDescription!.isNotEmpty) ...[
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        Icon(Icons.notes, size: 12, color: Colors.orange.withValues(alpha: 0.7)),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            exercise.wodDescription!,
                            style: TextStyle(
                              fontSize: 11,
                              color: cs.onSurface.withValues(alpha: 0.55),
                              fontStyle: FontStyle.italic,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ] else if (!exercise.isCrossFit &&
                      exercise.notes != null &&
                      exercise.notes!.isNotEmpty) ...[
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        Icon(Icons.notes,
                            size: 12,
                            color: cs.onSurface.withValues(alpha: 0.4)),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            exercise.notes!,
                            style: TextStyle(
                              fontSize: 11,
                              color: cs.onSurface.withValues(alpha: 0.55),
                              fontStyle: FontStyle.italic,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            // Botão iniciar (oculto quando concluído)
            if (!isCompleted)
              IconButton(
                icon: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    gradient: ref.watch(brandGradientProvider),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    isInSession ? Icons.arrow_forward : Icons.play_arrow,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                onPressed: onStart,
                tooltip: isInSession ? 'Continuar exercício' : 'Iniciar exercício',
              )
            else
              const SizedBox(width: 44),
            // Menu de opções
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert,
                  color: cs.onSurface.withValues(alpha: 0.4)),
              itemBuilder: (_) => [
                PopupMenuItem(
                  value: 'delete',
                  enabled: onDelete != null,
                  child: Row(children: [
                    Icon(
                      onDelete != null ? Icons.delete_outline : Icons.lock_outline,
                      color: onDelete != null
                          ? Colors.red
                          : cs.onSurface.withValues(alpha: 0.35),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      onDelete != null ? 'Remover' : 'Treino em andamento',
                      style: TextStyle(
                        color: onDelete != null
                            ? Colors.red
                            : cs.onSurface.withValues(alpha: 0.45),
                      ),
                    ),
                  ]),
                ),
              ],
              onSelected: (v) {
                if (v == 'delete') onDelete?.call();
              },
            ),
          ],
        ),
      ),
    );
  }

}


class _Chip extends StatelessWidget {
  const _Chip(this.label, {this.primary = false, this.accent = false, this.orange = false, this.amber = false});
  final String label;
  final bool primary;
  final bool accent; // modo Força — usa cor de destaque
  final bool orange; // CrossFit WOD format
  final bool amber; // sugestão de aumento no modo Força

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (orange) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.orange.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: Colors.orange.withValues(alpha: 0.5), width: 1),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Colors.orange.shade700,
          ),
        ),
      );
    }
    if (amber) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.amber.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: Colors.amber.withValues(alpha: 0.5), width: 1),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Colors.amber.shade800,
          ),
        ),
      );
    }
    if (accent) {
      // Chip de Força: fundo teal/azul da marca com borda
      const accentColor = Color(0xFF1DD2AF);
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: accentColor.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: accentColor.withValues(alpha: 0.5), width: 1),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF0DA882),
          ),
        ),
      );
    }
    final bg = cs.primary.withValues(alpha: primary ? 0.14 : 0.08);
    final fg = cs.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: primary
            ? Border.all(color: cs.primary.withValues(alpha: 0.35), width: 1)
            : null,
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 11,
              fontWeight: primary ? FontWeight.w700 : FontWeight.normal,
              color: fg)),
    );
  }
}

// ─── Label helpers (card info) ────────────────────────────────────────────────

String _cardioSubtypeLabel(String? s) {
  switch (s) {
    case 'corrida':               return '🏃 Corrida';
    case 'caminhada':             return '🚶 Caminhada';
    case 'ciclismo':              return '🚴 Ciclismo';
    case 'bicicleta_ergometrica': return '🚲 Bicicleta Erg.';
    case 'natacao':               return '🏊 Natação';
    case 'remo':                  return '🚣 Remo';
    case 'escada':                return '🪜 Escada';
    case 'funcional':             return '⚡ Funcional';
    default:                      return '❤️ Cardio';
  }
}

String _intensityLabel(CardioIntensity i) {
  switch (i) {
    case CardioIntensity.leve:     return '🟢 Leve';
    case CardioIntensity.moderada: return '🟡 Moderada';
    case CardioIntensity.intensa:  return '🔴 Intensa';
  }
}

String _runTypeLabel(RunType r) {
  switch (r) {
    case RunType.rua:     return '🛣 Rua';
    case RunType.esteira: return '🏃 Esteira';
    case RunType.trilha:  return '🌲 Trilha';
  }
}

String _swimStyleLabel(SwimStyle s) {
  switch (s) {
    case SwimStyle.livre:     return '🏊 Livre';
    case SwimStyle.costas:    return '🏊 Costas';
    case SwimStyle.peito:     return '🏊 Peito';
    case SwimStyle.borboleta: return '🏊 Borboleta';
    case SwimStyle.medley:    return '🏊 Medley';
  }
}

String _wodFormatLabel(WodFormat f) {
  switch (f) {
    case WodFormat.amrap:   return 'AMRAP';
    case WodFormat.forTime: return 'For Time';
    case WodFormat.emom:    return 'EMOM';
    case WodFormat.tabata:  return 'Tabata';
  }
}

String _wodRoundsLabel(WodFormat? format, int rounds) {
  switch (format) {
    case WodFormat.amrap:   return '⏱ ${rounds}min';
    case WodFormat.emom:    return '${rounds} rounds';
    case WodFormat.tabata:  return '${rounds} rounds';
    default:                return '${rounds} rounds';
  }
}

// ─── Linha de resumo no diálogo de confirmação ───────────────────────────────

class _ConfirmRow extends StatelessWidget {
  const _ConfirmRow({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: cs.primary),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(fontSize: 13)),
        ],
      ),
    );
  }
}

// ─── Toggle de modo de treino ─────────────────────────────────────────────────

class _TrainingModeToggle extends StatelessWidget {
  const _TrainingModeToggle({required this.mode, required this.onChanged, this.hasLastSession = false});
  final _TrainingMode mode;
  final ValueChanged<_TrainingMode> onChanged;
  final bool hasLastSession;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isForca = mode == _TrainingMode.forca;
    const teal = Color(0xFF1DD2AF);
    const blue = Color(0xFF3F5EFB);

    void toggle() => onChanged(
          isForca ? _TrainingMode.resistencia : _TrainingMode.forca,
        );

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.only(left: 14, right: 4, top: 6, bottom: 6),
        decoration: BoxDecoration(
          color: isForca ? teal.withValues(alpha: 0.08) : cs.surfaceContainerLow,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isForca ? teal.withValues(alpha: 0.4) : cs.outlineVariant,
            width: 1.2,
          ),
        ),
        child: Row(
          children: [
            // Área esquerda (ícone + texto) — toque independente do Switch
            Expanded(
              child: GestureDetector(
                onTap: toggle,
                behavior: HitTestBehavior.opaque,
                child: Row(
                  children: [
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        isForca ? Icons.bolt : Icons.favorite,
                        key: ValueKey(isForca),
                        size: 20,
                        color: isForca
                            ? teal
                            : cs.onSurface.withValues(alpha: 0.5),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              isForca ? 'Modo Força' : 'Modo Resistência',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: isForca
                                    ? const Color(0xFF0DA882)
                                    : cs.onSurface,
                              ),
                            ),
                            if (isForca) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 1),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [blue, teal],
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                  ),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  hasLastSession
                                      ? 'Último treino  •  −4 reps'
                                      : 'Peso planejado  •  −4 reps',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        if (!isForca)
                          Text(
                            hasLastSession
                                ? 'Força: cargas do último treino, −4 reps'
                                : 'Força: peso planejado, −4 reps',
                            style: TextStyle(
                              fontSize: 11,
                              color: cs.onSurface.withValues(alpha: 0.45),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            // Switch — área de toque própria, sem GestureDetector concorrente
            Switch(
              value: isForca,
              onChanged: (_) => toggle(),
              activeColor: teal,
              activeTrackColor: teal.withValues(alpha: 0.3),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

class _EmptyExercises extends StatelessWidget {
  const _EmptyExercises({required this.onAdd});
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.add_circle_outline, size: 64, color: Colors.white38),
          const SizedBox(height: 16),
          Text('Nenhum exercício',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('Adicione exercícios ao seu treino',
              style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: onAdd,
            icon: const Icon(Icons.add),
            label: const Text('Adicionar exercício'),
          ),
        ],
      ),
    );
  }
}

// ─── Bottom Sheet para adicionar exercício ────────────────────────────────────

class _AddExerciseSheet extends ConsumerStatefulWidget {
  const _AddExerciseSheet({required this.dayId});
  final String dayId;

  @override
  ConsumerState<_AddExerciseSheet> createState() => _AddExerciseSheetState();
}

class _AddExerciseSheetState extends ConsumerState<_AddExerciseSheet> {
  // Phase 1 — library
  String _query = '';
  String _muscleFilter = 'all';
  String _equipFilter = 'all';
  String _typeFilter = 'all'; // 'all' | 'forca' | 'cardio'

  // Phase 2 — config (força)
  ExerciseDefinition? _selected;

  // Phase 3 — create custom exercise
  bool _isCreating = false;
  bool _isSavingCustom = false;
  final _customNameCtrl = TextEditingController();
  String? _customMuscle;
  String? _customEquipment;

  static const _muscleOptions = [
    'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
    'Antebraços', 'Pernas', 'Glúteos', 'Core',
  ];
  static const _equipmentOptions = [
    'Halteres', 'Máquina', 'Peso Corporal', 'Barra', 'Cabo',
  ];
  final _setsCtrl   = TextEditingController(text: '3');
  final _repsCtrl   = TextEditingController(text: '10');
  final _weightCtrl = TextEditingController(text: '0');
  final _restCtrl   = TextEditingController(text: '90');
  final _rpeCtrl    = TextEditingController(text: '7');

  // Phase 2 — config (cardio)
  final _durationCtrl = TextEditingController(text: '30');
  final _distanceCtrl = TextEditingController(text: '');
  final _elevationCtrl = TextEditingController(text: '');
  final _lapsCtrl = TextEditingController(text: '');
  final _wodDescCtrl = TextEditingController();
  final _wodRoundsCtrl = TextEditingController(text: '5');
  CardioIntensity _intensity = CardioIntensity.moderada;
  RunType _runType = RunType.rua;
  int _poolLengthM = 25;
  SwimStyle _swimStyle = SwimStyle.livre;
  WodFormat _wodFormat = WodFormat.amrap;

  // WOD import by code
  final _wodCodeCtrl = TextEditingController();
  bool _wodImporting = false;
  String? _wodImportError;

  // WOD structured movements (cada linha: nameCtrl, repsCtrl, weightCtrl)
  final List<List<TextEditingController>> _movementRows = [];

  void _addMovementRow({String name = '', String reps = '', String weight = ''}) {
    _movementRows.add([
      TextEditingController(text: name),
      TextEditingController(text: reps),
      TextEditingController(text: weight),
    ]);
  }

  void _removeMovementRow(int index) {
    for (final c in _movementRows[index]) c.dispose();
    _movementRows.removeAt(index);
  }

  final _notesCtrl = TextEditingController();

  @override
  void dispose() {
    _setsCtrl.dispose();
    _repsCtrl.dispose();
    _weightCtrl.dispose();
    _restCtrl.dispose();
    _rpeCtrl.dispose();
    _durationCtrl.dispose();
    _distanceCtrl.dispose();
    _elevationCtrl.dispose();
    _lapsCtrl.dispose();
    _wodDescCtrl.dispose();
    _wodRoundsCtrl.dispose();
    _wodCodeCtrl.dispose();
    for (final row in _movementRows) { for (final c in row) c.dispose(); }
    _notesCtrl.dispose();
    _customNameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final exercisesAsync = ref.watch(exerciseDefinitionsProvider);
    final cs = Theme.of(context).colorScheme;
    final theme = Theme.of(context);
    final screenHeight = MediaQuery.of(context).size.height;
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      height: screenHeight * 0.92,
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: cs.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 8, 8),
            child: Row(
              children: [
                if (_selected != null || _isCreating)
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => setState(() {
                      _selected = null;
                      _isCreating = false;
                    }),
                  )
                else
                  const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    _isCreating
                        ? '✏️ Novo Exercício'
                        : _selected == null
                            ? '📚 Biblioteca de Exercícios'
                            : '⚙️ Configurar Exercício',
                    style: theme.textTheme.titleLarge,
                  ),
                ),
                if (!_isCreating && _selected == null)
                  IconButton(
                    icon: const Icon(Icons.add),
                    tooltip: 'Criar exercício personalizado',
                    onPressed: () => setState(() => _isCreating = true),
                  ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isCreating
                ? _buildCreate(cs, theme, bottom)
                : _selected == null
                    ? _buildLibrary(exercisesAsync, cs, theme)
                    : _buildConfig(cs, theme, bottom),
          ),
        ],
      ),
    );
  }

  // ── Phase 1: exercise library ───────────────────────────────────────────────

  Widget _buildLibrary(
    AsyncValue<List<ExerciseDefinition>> exercisesAsync,
    ColorScheme cs,
    ThemeData theme,
  ) {
    return exercisesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) =>
          const Center(child: Text('Erro ao carregar exercícios')),
      data: (all) {
        final settings = ref.read(settingsProvider);

        // Pré-filtra pela modalidade ativa nas configurações
        final modalityFiltered = all.where((e) {
          if (e.isCrossFit) return settings.crossfitActive;
          if (e.isCardio) return settings.cardioActive;
          return settings.musculacaoActive; // forca
        }).toList();

        final typeFiltered = _typeFilter == 'all'
            ? modalityFiltered
            : modalityFiltered.where((e) {
                if (_typeFilter == 'crossfit') return e.isCrossFit;
                if (_typeFilter == 'cardio') return e.isCardio && !e.isCrossFit;
                return !e.isCardio; // forca
              }).toList();
        final muscleGroups = [
          'all',
          ...{...typeFiltered.where((e) => e.muscleGroup != null).map((e) => e.muscleGroup!)},
        ];
        final equipTypes = [
          'all',
          ...{...typeFiltered.where((e) => e.equipment != null).map((e) => e.equipment!)},
        ];
        // Deduplica natação e crossfit: exibe apenas uma entrada por modalidade
        bool seenSwim = false;
        bool seenCrossFit = false;
        ExerciseDefinition? firstSwim;
        ExerciseDefinition? firstCrossFit;
        final deduped = <ExerciseDefinition>[];
        for (final e in typeFiltered) {
          if (e.isSwimming) {
            firstSwim ??= e;
            if (!seenSwim) {
              seenSwim = true;
              deduped.add(ExerciseDefinition(
                id: firstSwim.id,
                name: '🏊 Natação',
                muscleGroup: firstSwim.muscleGroup,
                equipment: firstSwim.equipment,
                createdBy: firstSwim.createdBy,
                exerciseType: firstSwim.exerciseType,
                cardioSubtype: firstSwim.cardioSubtype,
              ));
            }
          } else if (e.isCrossFit) {
            firstCrossFit ??= e;
            if (!seenCrossFit) {
              seenCrossFit = true;
              deduped.add(ExerciseDefinition(
                id: firstCrossFit.id,
                name: '🏋️ CrossFit WOD',
                muscleGroup: firstCrossFit.muscleGroup,
                equipment: firstCrossFit.equipment,
                createdBy: firstCrossFit.createdBy,
                exerciseType: firstCrossFit.exerciseType,
                cardioSubtype: firstCrossFit.cardioSubtype,
              ));
            }
          } else {
            deduped.add(e);
          }
        }

        final filtered = deduped.where((e) {
          final q = _query.isEmpty || e.name.toLowerCase().contains(_query);
          final m = _muscleFilter == 'all' || e.muscleGroup == _muscleFilter;
          final eq = _equipFilter == 'all' || e.equipment == _equipFilter;
          return q && m && eq;
        }).toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: TextField(
                decoration: const InputDecoration(
                  hintText: '🔍 Buscar exercício...',
                  prefixIcon: Icon(Icons.search),
                  isDense: true,
                ),
                onChanged: (v) => setState(() => _query = v.toLowerCase()),
              ),
            ),

            // Filtro força/cardio/crossfit (apenas modalidades ativas)
            Builder(builder: (ctx) {
              final s = ref.read(settingsProvider);
              final types = <String>['all'];
              if (s.musculacaoActive) types.add('forca');
              if (s.cardioActive) types.add('cardio');
              if (s.crossfitActive) types.add('crossfit');
              return _FilterRow(
                label: '🏷️',
                items: types,
                selected: _typeFilter,
                color: cs.primary,
                onColor: cs.onPrimary,
                labelOverride: const {
                  'all': 'Todos',
                  'forca': '💪 Força',
                  'cardio': '🏃 Cardio',
                  'crossfit': '🏋️ CrossFit',
                },
                onChanged: (v) => setState(() {
                  _typeFilter = v;
                  _muscleFilter = 'all';
                  _equipFilter = 'all';
                }),
              );
            }),
            const SizedBox(height: 4),

            // Muscle group filter
            if (muscleGroups.length > 2) ...[
              _FilterRow(
                label: '💪',
                items: muscleGroups,
                selected: _muscleFilter,
                color: cs.primary,
                onColor: cs.onPrimary,
                onChanged: (v) => setState(() => _muscleFilter = v),
              ),
              const SizedBox(height: 4),
            ],

            // Equipment filter
            if (equipTypes.length > 2) ...[
              _FilterRow(
                label: '🏋️',
                items: equipTypes,
                selected: _equipFilter,
                color: cs.secondary,
                onColor: cs.onSecondary,
                onChanged: (v) => setState(() => _equipFilter = v),
              ),
              const SizedBox(height: 4),
            ],

            // Result count
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: Text(
                '${filtered.length} exercício${filtered.length == 1 ? '' : 's'} encontrado${filtered.length == 1 ? '' : 's'}',
                style: TextStyle(
                    fontSize: 12,
                    color: cs.onSurface.withValues(alpha: 0.5)),
              ),
            ),

            // Grid
            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.search_off,
                              size: 48,
                              color: cs.onSurface.withValues(alpha: 0.3)),
                          const SizedBox(height: 12),
                          Text(
                            'Nenhum exercício encontrado',
                            style: TextStyle(
                                color: cs.onSurface.withValues(alpha: 0.5)),
                          ),
                        ],
                      ),
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 2.0,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: filtered.length,
                      itemBuilder: (_, i) {
                        final ex = filtered[i];
                        return InkWell(
                          onTap: () => setState(() => _selected = ex),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: cs.surfaceContainerLow,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: cs.outlineVariant, width: 0.5),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  ex.name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .labelLarge
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    if (ex.isCrossFit)
                                      const Flexible(
                                        child: _MiniChip(
                                          '🏋️ CrossFit',
                                          Color(0xFF7C3AED),
                                          Color(0xFFEDE9FE),
                                        ),
                                      )
                                    else if (ex.isCardio)
                                      Flexible(
                                        child: _MiniChip(
                                          _cardioSubtypeLabel(ex.cardioSubtype),
                                          const Color(0xFF1DD2AF).withValues(alpha: 0.15),
                                          const Color(0xFF0DA882),
                                        ),
                                      )
                                    else if (ex.muscleGroup != null)
                                      Flexible(
                                        child: _MiniChip(
                                          '💪 ${ex.muscleGroup!}',
                                          cs.primary.withValues(alpha: 0.14),
                                          cs.primary,
                                        ),
                                      ),
                                    if (ex.equipment != null) ...[
                                      const SizedBox(width: 4),
                                      Flexible(
                                        child: _MiniChip(
                                          '🏋️ ${ex.equipment!}',
                                          cs.secondary.withValues(alpha: 0.14),
                                          cs.secondary,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }

  // ── Phase 3: create custom exercise ─────────────────────────────────────────

  Future<void> _saveCustomExercise() async {
    final name = _customNameCtrl.text.trim();
    if (name.isEmpty) return;
    final userId = ref.read(currentUserProvider)?.uid;
    if (userId == null) return;

    setState(() => _isSavingCustom = true);
    try {
      await WorkoutsService.instance.createExercise(
        userId,
        name,
        muscleGroup: _customMuscle,
        equipment: _customEquipment,
      );
      ref.invalidate(exerciseDefinitionsProvider);
      if (mounted) {
        setState(() {
          _isCreating = false;
          _customNameCtrl.clear();
          _customMuscle = null;
          _customEquipment = null;
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erro ao criar exercício')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSavingCustom = false);
    }
  }

  Widget _buildCreate(ColorScheme cs, ThemeData theme, double bottom) {
    final canSave = _customNameCtrl.text.trim().isNotEmpty;

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(16, 8, 16, 24 + bottom),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Nome ──────────────────────────────────────────────────────
          TextField(
            controller: _customNameCtrl,
            autofocus: true,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              labelText: 'Nome do exercício',
              hintText: 'Ex: Rosca Direta com Halteres',
              prefixIcon: Icon(Icons.fitness_center),
            ),
            onChanged: (_) => setState(() {}),
          ),

          const SizedBox(height: 24),

          // ── Músculo alvo ──────────────────────────────────────────────
          Text('Músculo alvo', style: theme.textTheme.labelLarge),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _muscleOptions.map((m) {
              final selected = _customMuscle == m;
              return ChoiceChip(
                label: Text(m),
                selected: selected,
                onSelected: (_) => setState(() =>
                    _customMuscle = selected ? null : m),
                selectedColor: cs.primaryContainer,
                labelStyle: TextStyle(
                  color: selected ? cs.onPrimaryContainer : cs.onSurface,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 24),

          // ── Equipamento ───────────────────────────────────────────────
          Text('Equipamento', style: theme.textTheme.labelLarge),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _equipmentOptions.map((e) {
              final selected = _customEquipment == e;
              return ChoiceChip(
                label: Text(e),
                selected: selected,
                onSelected: (_) => setState(() =>
                    _customEquipment = selected ? null : e),
                selectedColor: cs.secondaryContainer,
                labelStyle: TextStyle(
                  color: selected ? cs.onSecondaryContainer : cs.onSurface,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 32),

          // ── Salvar ────────────────────────────────────────────────────
          FilledButton.icon(
            onPressed: canSave && !_isSavingCustom ? _saveCustomExercise : null,
            icon: _isSavingCustom
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.check),
            label: const Text('Criar exercício'),
          ),
        ],
      ),
    );
  }

  // ── Phase 2: config ─────────────────────────────────────────────────────────

  Widget _buildConfig(ColorScheme cs, ThemeData theme, double bottom) {
    final isCardio = _selected!.isCardio;
    final isRunning = _selected!.isRunning;
    final isSwimming = _selected!.isSwimming;
    final isCrossFit = _selected!.isCrossFit;

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 24 + bottom),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Card do exercício selecionado
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isCardio
                  ? const Color(0xFF1DD2AF).withValues(alpha: 0.08)
                  : cs.primaryContainer.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isCardio
                    ? const Color(0xFF1DD2AF).withValues(alpha: 0.4)
                    : cs.primary.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isRunning ? Icons.directions_run
                      : isSwimming ? Icons.pool
                      : isCrossFit ? Icons.fitness_center_outlined
                      : isCardio ? Icons.favorite
                      : Icons.fitness_center,
                  color: isCardio ? const Color(0xFF0DA882) : cs.primary,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_selected!.name, style: theme.textTheme.titleMedium),
                      Text(
                        isCrossFit
                            ? '🏋️ CrossFit WOD'
                            : isCardio
                                ? _cardioSubtypeLabel(_selected!.cardioSubtype)
                                : (_selected!.muscleGroup ?? ''),
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _selected = null),
                  child: const Text('Trocar'),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),
          Row(
            children: [
              Text(
                isCrossFit ? '⚙️ Configurações WOD'
                    : isCardio ? '🎯 Metas do treino'
                    : '⚙️ Configurações',
                style: theme.textTheme.titleSmall,
              ),
              if (isCardio) ...[
                const SizedBox(width: 8),
                Text(
                  '(Opcional, mas recomendado)',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withValues(alpha: 0.45),
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 14),

          if (!isCardio) ...[
            // ── FORÇA ────────────────────────────────────────────────────
            Row(children: [
              Expanded(child: _FieldInput(label: 'Séries', controller: _setsCtrl, suffix: 'x', isInt: true)),
              const SizedBox(width: 10),
              Expanded(child: _FieldInput(label: 'Reps', controller: _repsCtrl, suffix: 'rep', isInt: true)),
              const SizedBox(width: 10),
              Expanded(child: _FieldInput(label: 'Peso', controller: _weightCtrl, suffix: 'kg', isInt: false)),
            ]),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: _FieldInput(label: 'Descanso', controller: _restCtrl, suffix: 's', isInt: true)),
              const SizedBox(width: 10),
              Expanded(child: _FieldInput(label: 'RPE Alvo', controller: _rpeCtrl, suffix: '/10', isInt: true)),
            ]),
          ] else if (isRunning) ...[
            // ── CORRIDA ──────────────────────────────────────────────────
            Text('Tipo', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6))),
            const SizedBox(height: 6),
            Row(children: RunType.values.map((t) {
              final label = t == RunType.rua ? '🏙️ Rua' : t == RunType.esteira ? '🏃 Esteira' : '🌲 Trilha';
              final active = _runType == t;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _runType = t),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: active ? const Color(0xFF1DD2AF).withValues(alpha: 0.15) : cs.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: active ? const Color(0xFF1DD2AF) : cs.outlineVariant,
                        width: active ? 1.5 : 1,
                      ),
                    ),
                    child: Text(label, style: TextStyle(fontSize: 12, fontWeight: active ? FontWeight.w700 : FontWeight.normal)),
                  ),
                ),
              );
            }).toList()),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(child: _FieldInput(label: 'Duração', controller: _durationCtrl, suffix: 'min', isInt: true)),
              const SizedBox(width: 10),
              Expanded(child: _FieldInput(label: 'Distância', controller: _distanceCtrl, suffix: 'km', isInt: false)),
            ]),
            if (_runType == RunType.trilha || _runType == RunType.esteira) ...[
              const SizedBox(height: 10),
              _FieldInput(label: 'Ganho de Elevação', controller: _elevationCtrl, suffix: 'm', isInt: true),
            ],
          ] else if (isSwimming) ...[
            // ── NATAÇÃO ───────────────────────────────────────────────────
            Text('Piscina', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6))),
            const SizedBox(height: 6),
            Row(children: [25, 50].map((len) {
              final active = _poolLengthM == len;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _poolLengthM = len),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: active ? const Color(0xFF1DD2AF).withValues(alpha: 0.15) : cs.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: active ? const Color(0xFF1DD2AF) : cs.outlineVariant,
                        width: active ? 1.5 : 1,
                      ),
                    ),
                    child: Text('${len}m', style: TextStyle(fontSize: 12, fontWeight: active ? FontWeight.w700 : FontWeight.normal)),
                  ),
                ),
              );
            }).toList()),
            const SizedBox(height: 14),
            Text('Modalidade', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6))),
            const SizedBox(height: 6),
            Wrap(spacing: 8, runSpacing: 6, children: SwimStyle.values.map((s) {
              const labels = {
                SwimStyle.livre:      '🏊 Livre',
                SwimStyle.costas:     '🏊 Costas',
                SwimStyle.peito:      '🏊 Peito',
                SwimStyle.borboleta:  '🦋 Borboleta',
                SwimStyle.medley:     '🔄 Medley',
              };
              final active = _swimStyle == s;
              return GestureDetector(
                onTap: () => setState(() => _swimStyle = s),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: active ? const Color(0xFF1DD2AF).withValues(alpha: 0.15) : cs.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: active ? const Color(0xFF1DD2AF) : cs.outlineVariant,
                      width: active ? 1.5 : 1,
                    ),
                  ),
                  child: Text(labels[s]!, style: TextStyle(fontSize: 12, fontWeight: active ? FontWeight.w700 : FontWeight.normal)),
                ),
              );
            }).toList()),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(child: _FieldInput(label: 'Duração', controller: _durationCtrl, suffix: 'min', isInt: true)),
              const SizedBox(width: 10),
              Expanded(child: _FieldInput(label: 'Voltas', controller: _lapsCtrl, suffix: 'vol', isInt: true)),
            ]),
          ] else if (isCrossFit) ...[
            // ── IMPORTAR POR CÓDIGO ───────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1DD2AF).withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF1DD2AF).withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    const Icon(Icons.qr_code_2, size: 16, color: Color(0xFF1DD2AF)),
                    const SizedBox(width: 6),
                    Text('Importar WOD por código',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                            color: cs.onSurface.withValues(alpha: 0.8))),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(
                      child: TextField(
                        controller: _wodCodeCtrl,
                        textCapitalization: TextCapitalization.characters,
                        decoration: InputDecoration(
                          hintText: 'Ex: AB12CD',
                          isDense: true,
                          filled: true,
                          fillColor: cs.surface,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: cs.outlineVariant),
                          ),
                          errorText: _wodImportError,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: _wodImporting ? null : _importWod,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF1DD2AF),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      child: _wodImporting
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Importar', style: TextStyle(fontSize: 13)),
                    ),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // ── CROSSFIT ─────────────────────────────────────────────────
            Text('Formato do WOD', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6))),
            const SizedBox(height: 6),
            Wrap(spacing: 8, runSpacing: 6, children: WodFormat.values.map((f) {
              const labels = {
                WodFormat.amrap:   '⏱ AMRAP',
                WodFormat.forTime: '🏁 For Time',
                WodFormat.emom:    '🔁 EMOM',
                WodFormat.tabata:  '⚡ Tabata',
              };
              const descriptions = {
                WodFormat.amrap:   'Máx rounds em X min',
                WodFormat.forTime: 'Completar X rounds',
                WodFormat.emom:    'X reps a cada minuto',
                WodFormat.tabata:  '20s/10s × 8 rounds',
              };
              final active = _wodFormat == f;
              return GestureDetector(
                onTap: () => setState(() => _wodFormat = f),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: active ? const Color(0xFF1DD2AF).withValues(alpha: 0.15) : cs.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: active ? const Color(0xFF1DD2AF) : cs.outlineVariant,
                      width: active ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(labels[f]!, style: TextStyle(fontSize: 12, fontWeight: active ? FontWeight.w700 : FontWeight.normal)),
                      Text(descriptions[f]!, style: TextStyle(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5))),
                    ],
                  ),
                ),
              );
            }).toList()),
            const SizedBox(height: 14),

            // Tempo cap (AMRAP, For Time, EMOM) ou duração Tabata (automática)
            if (_wodFormat != WodFormat.tabata) ...[
              Row(children: [
                Expanded(child: _FieldInput(label: _wodFormat == WodFormat.emom ? 'Minutos' : 'Tempo cap', controller: _durationCtrl, suffix: 'min', isInt: true)),
                if (_wodFormat == WodFormat.forTime || _wodFormat == WodFormat.emom) ...[
                  const SizedBox(width: 10),
                  Expanded(child: _FieldInput(label: 'Rounds', controller: _wodRoundsCtrl, suffix: 'x', isInt: true)),
                ],
              ]),
              const SizedBox(height: 14),
            ],

            // Movimentos estruturados
            Row(children: [
              Text('Movimentos do WOD',
                  style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6))),
              const Spacer(),
              TextButton.icon(
                onPressed: () => setState(() => _addMovementRow()),
                icon: const Icon(Icons.add, size: 14),
                label: const Text('Adicionar', style: TextStyle(fontSize: 12)),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ]),
            const SizedBox(height: 4),
            // Cabeçalho das colunas
            if (_movementRows.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(children: [
                  const Expanded(flex: 5, child: Text('Exercício', style: TextStyle(fontSize: 10))),
                  const SizedBox(width: 6),
                  const SizedBox(width: 60, child: Text('Reps', style: TextStyle(fontSize: 10), textAlign: TextAlign.center)),
                  const SizedBox(width: 6),
                  const SizedBox(width: 60, child: Text('Kg', style: TextStyle(fontSize: 10), textAlign: TextAlign.center)),
                  const SizedBox(width: 32),
                ]),
              ),
            ..._movementRows.asMap().entries.map((entry) {
              final i = entry.key;
              final row = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(children: [
                  Expanded(
                    flex: 5,
                    child: GestureDetector(
                      onTap: () async {
                        final picked = await showModalBottomSheet<String>(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: cs.surface,
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                          ),
                          builder: (_) => _CrossfitMovementPicker(initialText: row[0].text),
                        );
                        if (picked != null) setState(() => row[0].text = picked);
                      },
                      child: AbsorbPointer(
                        child: TextField(
                          controller: row[0],
                          decoration: InputDecoration(
                            hintText: 'Selecionar movimento...',
                            isDense: true,
                            filled: true,
                            fillColor: cs.surfaceContainerLow,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(6),
                              borderSide: BorderSide(color: cs.outlineVariant, width: 0.5),
                            ),
                            suffixIcon: const Icon(Icons.arrow_drop_down, size: 18),
                          ),
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  SizedBox(
                    width: 60,
                    child: TextField(
                      controller: row[1],
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      decoration: InputDecoration(
                        hintText: '10',
                        isDense: true,
                        filled: true,
                        fillColor: cs.surfaceContainerLow,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(6),
                          borderSide: BorderSide(color: cs.outlineVariant, width: 0.5),
                        ),
                      ),
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                  const SizedBox(width: 6),
                  SizedBox(
                    width: 60,
                    child: TextField(
                      controller: row[2],
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      textAlign: TextAlign.center,
                      decoration: InputDecoration(
                        hintText: '—',
                        isDense: true,
                        filled: true,
                        fillColor: cs.surfaceContainerLow,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(6),
                          borderSide: BorderSide(color: cs.outlineVariant, width: 0.5),
                        ),
                      ),
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close, size: 16, color: cs.error),
                    padding: const EdgeInsets.all(6),
                    constraints: const BoxConstraints(),
                    onPressed: () => setState(() => _removeMovementRow(i)),
                  ),
                ]),
              );
            }),
            if (_movementRows.isEmpty)
              GestureDetector(
                onTap: () => setState(() => _addMovementRow()),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: cs.outlineVariant, width: 0.5),
                  ),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.add_circle_outline, size: 16, color: cs.onSurface.withValues(alpha: 0.4)),
                    const SizedBox(width: 6),
                    Text('Adicionar movimento', style: TextStyle(fontSize: 12,
                        color: cs.onSurface.withValues(alpha: 0.4))),
                  ]),
                ),
              ),
            const SizedBox(height: 8),
            // Notas opcionais
            TextField(
              controller: _wodDescCtrl,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Notas do WOD (opcional)...',
                hintStyle: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.35)),
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
          ] else ...[
            // ── CARDIO GENÉRICO ──────────────────────────────────────────
            Text('Intensidade', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6))),
            const SizedBox(height: 6),
            Row(children: CardioIntensity.values.map((i) {
              final label = i == CardioIntensity.leve ? '🟢 Leve' : i == CardioIntensity.moderada ? '🟡 Moderada' : '🔴 Intensa';
              final active = _intensity == i;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _intensity = i),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: active ? const Color(0xFF1DD2AF).withValues(alpha: 0.15) : cs.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: active ? const Color(0xFF1DD2AF) : cs.outlineVariant,
                        width: active ? 1.5 : 1,
                      ),
                    ),
                    child: Text(label, style: TextStyle(fontSize: 12, fontWeight: active ? FontWeight.w700 : FontWeight.normal)),
                  ),
                ),
              );
            }).toList()),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(child: _FieldInput(label: 'Duração', controller: _durationCtrl, suffix: 'min', isInt: true)),
              const SizedBox(width: 10),
              Expanded(child: _FieldInput(label: 'Distância', controller: _distanceCtrl, suffix: 'km', isInt: false)),
            ]),
          ],

          if (!isCrossFit) ...[
            const SizedBox(height: 14),
            TextField(
              controller: _notesCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Notas',
                hintText: 'Observações opcionais...',
                alignLabelWithHint: true,
              ),
            ),
          ],
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: _add,
            icon: const Icon(Icons.add),
            label: const Text('Adicionar Exercício'),
          ),
          if (_selected?.isCrossFit == true) ...[
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: _shareWod,
              icon: const Icon(Icons.share, size: 16),
              label: const Text('Gerar código / Publicar no grupo'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF1DD2AF),
                side: const BorderSide(color: Color(0xFF1DD2AF)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _importWod() async {
    final code = _wodCodeCtrl.text.trim().toUpperCase();
    if (code.isEmpty) return;
    setState(() { _wodImporting = true; _wodImportError = null; });
    final wod = await WodsService.instance.findByCode(code);
    if (!mounted) return;
    if (wod == null) {
      setState(() { _wodImporting = false; _wodImportError = 'Código inválido'; });
      return;
    }
    setState(() {
      _wodImporting = false;
      _wodImportError = null;
      _wodCodeCtrl.clear();
      // Aplicar formato
      _wodFormat = WodFormat.values.firstWhere(
        (f) => f.name == wod.format,
        orElse: () => WodFormat.amrap,
      );
      if (wod.timeCap != null) _durationCtrl.text = '${wod.timeCap}';
      if (wod.rounds != null) _wodRoundsCtrl.text = '${wod.rounds}';
      if (wod.description != null) _wodDescCtrl.text = wod.description!;
      // Preencher movimentos estruturados
      for (final row in _movementRows) { for (final c in row) c.dispose(); }
      _movementRows.clear();
      for (final m in wod.movements) {
        _addMovementRow(
          name: m.name,
          reps: m.targetReps != null ? '${m.targetReps}' : '',
          weight: m.targetWeight != null ? '${m.targetWeight}' : '',
        );
      }
    });
  }

  Future<void> _shareWod() async {
    if (_selected == null) return;
    final theme = Theme.of(context);

    // Cria o WOD no backend e obtém o código
    SharedWod? wod;
    try {
      final movements = _movementRows
          .where((r) => r[0].text.trim().isNotEmpty)
          .map((r) => WodMovement(
                name: r[0].text.trim(),
                targetReps: int.tryParse(r[1].text.trim()),
                targetWeight: double.tryParse(r[2].text.trim().replaceAll(',', '.')),
              ))
          .toList();
      wod = await WodsService.instance.create(
        format: _wodFormat.name,
        timeCap: int.tryParse(_durationCtrl.text),
        rounds: (_wodFormat == WodFormat.forTime || _wodFormat == WodFormat.emom)
            ? int.tryParse(_wodRoundsCtrl.text)
            : null,
        description: _wodDescCtrl.text.trim().isEmpty ? null : _wodDescCtrl.text.trim(),
        movements: movements,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao gerar código: $e')),
      );
      return;
    }
    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: theme.colorScheme.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => _WodShareSheet(
        wod: wod!,
        userId: ref.read(currentUserProvider)?.uid ?? '',
      ),
    );
  }

  void _add() {
    if (_selected == null) return;
    final isCardio = _selected!.isCardio;
    final isRunning = _selected!.isRunning;
    final isSwimming = _selected!.isSwimming;
    final isCrossFit = _selected!.isCrossFit;

    final notes = _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim();

    ref.read(workoutDaysProvider.notifier).addExercise(
      widget.dayId,
      PlannedExercise(
        id: '',
        exerciseDefinitionId: _selected!.id,
        exerciseName: _selected!.name,
        muscleGroup: _selected!.muscleGroup,
        exerciseType: _selected!.exerciseType,
        cardioSubtype: _selected!.cardioSubtype,
        // força
        sets: int.tryParse(_setsCtrl.text) ?? 3,
        reps: int.tryParse(_repsCtrl.text) ?? 10,
        weight: double.tryParse(_weightCtrl.text.replaceAll(',', '.')) ?? 0,
        restTime: int.tryParse(_restCtrl.text) ?? 90,
        // cardio
        plannedDurationMinutes: isCardio ? (int.tryParse(_durationCtrl.text) ?? 30) : null,
        plannedDistanceKm: (!isCardio || isSwimming)
            ? null
            : double.tryParse(_distanceCtrl.text.replaceAll(',', '.')),
        intensity: (!isCardio || isRunning || isSwimming) ? null : _intensity,
        runType: isRunning ? _runType : null,
        plannedPoolLengthM: isSwimming ? _poolLengthM : null,
        plannedSwimStyle: isSwimming ? _swimStyle : null,
        wodFormat: isCrossFit ? _wodFormat : null,
        wodDescription: isCrossFit && _wodDescCtrl.text.trim().isNotEmpty ? _wodDescCtrl.text.trim() : null,
        plannedRounds: isCrossFit && _wodFormat != WodFormat.amrap && _wodFormat != WodFormat.tabata
            ? (int.tryParse(_wodRoundsCtrl.text) ?? 5)
            : null,
        wodMovements: isCrossFit
            ? _movementRows
                .where((r) => r[0].text.trim().isNotEmpty)
                .map((r) => WodMovement(
                      name: r[0].text.trim(),
                      targetReps: int.tryParse(r[1].text.trim()),
                      targetWeight: double.tryParse(r[2].text.trim().replaceAll(',', '.')),
                    ))
                .toList()
            : const [],
        notes: notes,
      ),
    );
    Navigator.pop(context);
  }

  String _cardioSubtypeLabel(String? subtype) {
    switch (subtype) {
      case 'corrida':               return '🏃 Corrida';
      case 'caminhada':             return '🚶 Caminhada';
      case 'ciclismo':              return '🚴 Ciclismo';
      case 'bicicleta_ergometrica': return '🚲 Bicicleta Erg.';
      case 'natacao':               return '🏊 Natação';
      case 'remo':                  return '🚣 Remo';
      case 'escada':                return '🪜 Escada';
      case 'funcional':             return '⚡ Funcional';
      default:                      return '❤️ Cardio';
    }
  }
}

// ─── Typed number field ───────────────────────────────────────────────────────

class _FieldInput extends StatelessWidget {
  const _FieldInput({
    required this.label,
    required this.controller,
    required this.suffix,
    this.isInt = true,
  });

  final String label;
  final TextEditingController controller;
  final String suffix;
  final bool isInt;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return TextField(
      controller: controller,
      keyboardType: isInt
          ? TextInputType.number
          : const TextInputType.numberWithOptions(decimal: true),
      textAlign: TextAlign.center,
      onTap: () => controller.selection =
          TextSelection(baseOffset: 0, extentOffset: controller.text.length),
      decoration: InputDecoration(
        labelText: label,
        suffixText: suffix,
        suffixStyle:
            TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5)),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        isDense: true,
      ),
    );
  }
}

// ─── Filter chip row ──────────────────────────────────────────────────────────

class _FilterRow extends StatelessWidget {
  const _FilterRow({
    required this.label,
    required this.items,
    required this.selected,
    required this.color,
    required this.onColor,
    required this.onChanged,
    this.labelOverride,
  });

  final String label;
  final List<String> items;
  final String selected;
  final Color color;
  final Color onColor;
  final ValueChanged<String> onChanged;
  final Map<String, String>? labelOverride;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 34,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (_, i) {
          final item = items[i];
          final active = selected == item;
          final displayLabel = labelOverride?[item] ?? (item == 'all' ? 'Todos' : item);
          return FilterChip(
            label: Text(displayLabel),
            selected: active,
            onSelected: (_) => onChanged(item),
            showCheckmark: false,
            selectedColor: color,
            labelStyle: TextStyle(
              fontSize: 12,
              color: active ? onColor : Theme.of(context).colorScheme.onSurface,
              fontWeight: active ? FontWeight.w600 : FontWeight.normal,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            visualDensity: VisualDensity.compact,
          );
        },
      ),
    );
  }
}

// ─── Mini chip (exercise card badges) ────────────────────────────────────────

class _MiniChip extends StatelessWidget {
  const _MiniChip(this.label, this.bg, this.fg);
  final String label;
  final Color bg;
  final Color fg;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 10, color: fg, fontWeight: FontWeight.w500),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}

// ─── Stepper input ────────────────────────────────────────────────────────────

class _NumInput extends StatelessWidget {
  const _NumInput({
    required this.label,
    required this.value,
    required this.onChanged,
    this.min = 0,
    this.max,
    this.step = 1,
  });

  final String label;
  final int value;
  final ValueChanged<int> onChanged;
  final int min;
  final int? max;
  final int step;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        Text(label,
            style: TextStyle(
                fontSize: 11,
                color: cs.onSurface.withValues(alpha: 0.6),
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 4),
        Container(
          decoration: BoxDecoration(
            color: cs.surfaceContainerLow,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: cs.outlineVariant, width: 0.5),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.remove, size: 16),
                padding: const EdgeInsets.all(6),
                constraints: const BoxConstraints(),
                onPressed: value > min
                    ? () => onChanged(value - step)
                    : null,
              ),
              Text(
                '$value',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
              IconButton(
                icon: const Icon(Icons.add, size: 16),
                padding: const EdgeInsets.all(6),
                constraints: const BoxConstraints(),
                onPressed:
                    max == null || value < max! ? () => onChanged(value + step) : null,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── WOD Share Sheet ──────────────────────────────────────────────────────────

class _WodShareSheet extends StatefulWidget {
  const _WodShareSheet({required this.wod, required this.userId});
  final SharedWod wod;
  final String userId;

  @override
  State<_WodShareSheet> createState() => _WodShareSheetState();
}

class _WodShareSheetState extends State<_WodShareSheet> {
  static const _formatLabels = {
    'amrap': '⏱ AMRAP',
    'forTime': '🏁 For Time',
    'emom': '🔁 EMOM',
    'tabata': '⚡ Tabata',
  };

  List<Group>? _groups;
  String? _selectedGroupId;
  bool _loadingGroups = true;
  bool _publishing = false;
  bool _published = false;

  @override
  void initState() {
    super.initState();
    _loadGroups();
  }

  Future<void> _loadGroups() async {
    try {
      final all = await SocialService.instance.listMyGroups();
      // Mostra só grupos onde o usuário é admin ou moderator
      final adminGroups = all.where((g) => g.createdBy == widget.userId).toList();
      if (mounted) setState(() { _groups = adminGroups; _loadingGroups = false; });
    } catch (_) {
      if (mounted) setState(() { _groups = []; _loadingGroups = false; });
    }
  }

  Future<void> _publish() async {
    if (_selectedGroupId == null) return;
    setState(() => _publishing = true);
    try {
      await WodsService.instance.publishToGroup(widget.wod.id, _selectedGroupId!);
      if (mounted) setState(() { _publishing = false; _published = true; });
    } catch (e) {
      if (mounted) {
        setState(() => _publishing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao publicar: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final wod = widget.wod;
    final label = _formatLabels[wod.format] ?? wod.format;
    final details = [
      if (wod.timeCap != null) '${wod.timeCap} min',
      if (wod.rounds != null) '${wod.rounds} rounds',
    ].join(' • ');

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(width: 40, height: 4,
              decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 20),

          Text('WOD criado!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface)),
          const SizedBox(height: 4),
          Text('$label${details.isNotEmpty ? ' • $details' : ''}',
              style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.6))),
          const SizedBox(height: 20),

          // ── Código copiável ────────────────────────────────────────────
          GestureDetector(
            onTap: () {
              Clipboard.setData(ClipboardData(text: wod.code));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Código copiado!'), duration: Duration(seconds: 2)),
              );
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 18),
              decoration: BoxDecoration(
                color: const Color(0xFF1DD2AF).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1DD2AF), width: 1.5),
              ),
              child: Column(children: [
                Text(wod.code,
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900,
                        letterSpacing: 8, color: Color(0xFF1DD2AF))),
                const SizedBox(height: 4),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.copy, size: 12, color: cs.onSurface.withValues(alpha: 0.4)),
                  const SizedBox(width: 4),
                  Text('Toque para copiar',
                      style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.4))),
                ]),
              ]),
            ),
          ),
          const SizedBox(height: 8),
          Text('Compartilhe este código no WhatsApp ou Telegram.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),

          const SizedBox(height: 20),
          Divider(color: cs.outlineVariant),
          const SizedBox(height: 14),

          // ── Publicar num grupo ─────────────────────────────────────────
          Row(children: [
            const Icon(Icons.group, size: 16),
            const SizedBox(width: 6),
            Text('Publicar num grupo', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                color: cs.onSurface)),
          ]),
          const SizedBox(height: 10),

          if (_published) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
              ),
              child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.check_circle, color: Colors.green, size: 18),
                SizedBox(width: 6),
                Text('WOD publicado no grupo!', style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600)),
              ]),
            ),
          ] else if (_loadingGroups) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ] else if (_groups!.isEmpty) ...[
            Text('Você não é admin de nenhum grupo.',
                style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.5))),
          ] else ...[
            // Lista de grupos (selecionar um)
            ...(_groups!.map((g) {
              final selected = _selectedGroupId == g.id;
              return GestureDetector(
                onTap: () => setState(() => _selectedGroupId = selected ? null : g.id),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: selected ? cs.primary.withValues(alpha: 0.1) : cs.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: selected ? cs.primary : cs.outlineVariant,
                      width: selected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(children: [
                    Icon(Icons.group, size: 16, color: selected ? cs.primary : cs.onSurface.withValues(alpha: 0.5)),
                    const SizedBox(width: 10),
                    Expanded(child: Text(g.name, style: TextStyle(
                        fontSize: 13,
                        fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                        color: selected ? cs.primary : cs.onSurface))),
                    if (selected) Icon(Icons.check_circle, size: 18, color: cs.primary),
                  ]),
                ),
              );
            }).toList()),
            const SizedBox(height: 4),
            FilledButton.icon(
              onPressed: _selectedGroupId == null || _publishing ? null : _publish,
              icon: _publishing
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.send, size: 16),
              label: Text(_publishing ? 'Publicando...' : 'Publicar no grupo'),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(44)),
            ),
          ],

          const SizedBox(height: 16),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }
}

// ─── CrossFit Movement Picker ─────────────────────────────────────────────────

class _CrossfitMovementPicker extends StatefulWidget {
  const _CrossfitMovementPicker({this.initialText = ''});
  final String initialText;

  @override
  State<_CrossfitMovementPicker> createState() => _CrossfitMovementPickerState();
}

class _CrossfitMovementPickerState extends State<_CrossfitMovementPicker> {
  late final TextEditingController _searchCtrl;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _searchCtrl = TextEditingController(text: widget.initialText);
    _query = widget.initialText.toLowerCase();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    final filtered = _query.isEmpty
        ? crossfitMovementCategories
        : crossfitMovementCategories
            .map((cat) => CrossfitMovementCategory(
                  name: cat.name,
                  icon: cat.icon,
                  movements: cat.movements
                      .where((m) => m.toLowerCase().contains(_query))
                      .toList(),
                ))
            .where((cat) => cat.movements.isNotEmpty)
            .toList();

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      expand: false,
      builder: (_, scrollCtrl) => Column(
        children: [
          // Handle
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Container(width: 40, height: 4,
                decoration: BoxDecoration(color: cs.outlineVariant,
                    borderRadius: BorderRadius.circular(2))),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: TextField(
              controller: _searchCtrl,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Buscar movimento...',
                prefixIcon: const Icon(Icons.search, size: 20),
                isDense: true,
                filled: true,
                fillColor: cs.surfaceContainerLow,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: cs.outlineVariant),
                ),
              ),
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: scrollCtrl,
              itemCount: filtered.length,
              itemBuilder: (_, catIdx) {
                final cat = filtered[catIdx];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                      child: Text('${cat.icon} ${cat.name}',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                              color: cs.onSurface.withValues(alpha: 0.5))),
                    ),
                    ...cat.movements.map((m) => ListTile(
                          dense: true,
                          title: Text(m, style: const TextStyle(fontSize: 14)),
                          onTap: () => Navigator.pop(context, m),
                          trailing: const Icon(Icons.add, size: 16),
                        )),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}


// ─── FAB com gradiente (mesma estilização do botão "+" de treinos) ─────────────

class _GradientFab extends ConsumerWidget {
  const _GradientFab({required this.tutorialKey, required this.onPressed});
  final GlobalKey tutorialKey;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradient = ref.watch(brandGradientProvider);
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        key: tutorialKey,
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.20),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Icon(Icons.add, color: Colors.white, size: 26),
      ),
    );
  }
}
