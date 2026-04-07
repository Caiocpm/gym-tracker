// lib/features/workouts/providers/workouts_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/workouts_service.dart';
import '../domain/workout_models.dart';

// ─── Workout Days ─────────────────────────────────────────────────────────────

class WorkoutDaysNotifier extends StateNotifier<AsyncValue<List<WorkoutDay>>> {
  WorkoutDaysNotifier(this._userId) : super(const AsyncValue.loading()) {
    load();
  }

  final String _userId;
  final _service = WorkoutsService.instance;

  Future<void> load() async {
    if (!mounted) return;
    state = const AsyncValue.loading();
    try {
      final days = await _service.listWorkoutDays(_userId);
      if (!mounted) return;
      state = AsyncValue.data(days);
    } catch (_) {
      if (!mounted) return;
      state = const AsyncValue.data([]);
    }
  }

  Future<void> addDay(String name, {String dayType = 'musculacao'}) async {
    final day = await _service.createWorkoutDay(_userId, name, dayType: dayType);
    if (!mounted) return;
    state.whenData(
      (days) => state = AsyncValue.data([...days, day]),
    );
  }

  Future<void> deleteDay(String dayId) async {
    await _service.deleteWorkoutDay(_userId, dayId);
    if (!mounted) return;
    state.whenData(
      (days) => state = AsyncValue.data(
        days.where((d) => d.id != dayId).toList(),
      ),
    );
  }

  Future<void> addExercise(String dayId, PlannedExercise exercise) async {
    final updated = await _service.addPlannedExercise(_userId, dayId, exercise);
    if (!mounted) return;
    state.whenData(
      (days) => state = AsyncValue.data(
        days.map((d) => d.id == dayId ? updated : d).toList(),
      ),
    );
  }

  Future<void> removeExercise(String dayId, String exerciseId) async {
    await _service.deletePlannedExercise(_userId, dayId, exerciseId);
    if (!mounted) return;
    state.whenData((days) {
      state = AsyncValue.data(days.map((d) {
        if (d.id != dayId) return d;
        return WorkoutDay(
          id: d.id,
          userId: d.userId,
          name: d.name,
          createdAt: d.createdAt,
          exercises: d.exercises.where((e) => e.id != exerciseId).toList(),
        );
      }).toList());
    });
  }
}

final workoutDaysProvider = StateNotifierProvider.autoDispose<
    WorkoutDaysNotifier, AsyncValue<List<WorkoutDay>>>((ref) {
  final user = ref.watch(currentUserProvider);
  return WorkoutDaysNotifier(user?.uid ?? '');
});

// ─── Exercise Definitions ─────────────────────────────────────────────────────

final exerciseDefinitionsProvider =
    FutureProvider.autoDispose<List<ExerciseDefinition>>((ref) async {
  try {
    return await WorkoutsService.instance.listExercises();
  } catch (_) {
    return [];
  }
});

// ─── Sessão Ativa ─────────────────────────────────────────────────────────────

class ActiveSessionState {
  final String? dayId;
  final String? dayName;
  final List<ActiveExercise> exercises;
  final DateTime? startedAt;

  const ActiveSessionState({
    this.dayId,
    this.dayName,
    this.exercises = const [],
    this.startedAt,
  });

  bool get isActive => dayId != null;

  int get elapsedSeconds =>
      startedAt != null ? DateTime.now().difference(startedAt!).inSeconds : 0;

  ActiveSessionState copyWith({
    String? dayId,
    String? dayName,
    List<ActiveExercise>? exercises,
    DateTime? startedAt,
  }) =>
      ActiveSessionState(
        dayId: dayId ?? this.dayId,
        dayName: dayName ?? this.dayName,
        exercises: exercises ?? this.exercises,
        startedAt: startedAt ?? this.startedAt,
      );
}

class ActiveSessionNotifier extends StateNotifier<ActiveSessionState> {
  ActiveSessionNotifier() : super(const ActiveSessionState());

  /// Inicia uma nova sessão para o dia dado, ou retoma se já estiver ativa.
  void resumeOrStart(
      String dayId, String dayName, List<PlannedExercise> planned) {
    // Já está nessa sessão — apenas retoma sem resetar
    if (state.dayId == dayId && state.isActive) return;

    final exercises = planned
        .map((p) => ActiveExercise(
              plannedExerciseId: p.id,
              exerciseDefinitionId: p.exerciseDefinitionId,
              exerciseName: p.exerciseName,
              muscleGroup: p.muscleGroup,
              exerciseType: p.exerciseType,
              cardioSubtype: p.cardioSubtype,
              plannedDurationMinutes: p.plannedDurationMinutes,
              plannedDistanceKm: p.plannedDistanceKm,
              plannedPoolLengthM: p.plannedPoolLengthM,
              plannedSwimStyle: p.plannedSwimStyle,
              wodFormat: p.wodFormat,
              wodDescription: p.wodDescription,
              plannedRounds: p.plannedRounds,
              sets: p.isCardio
                  ? [LoggedSet()]
                  : List.generate(
                      p.sets.clamp(1, 99),
                      (_) => LoggedSet(reps: p.reps, weight: p.weight),
                    ),
              restSeconds: p.restTime,
              wodMovements: p.wodMovements,
            ))
        .toList();

    state = ActiveSessionState(
      dayId: dayId,
      dayName: dayName,
      exercises: exercises,
      startedAt: DateTime.now(),
    );
  }

  /// Inicia a sessão com apenas UM exercício, ou adiciona ao treino em andamento.
  void startSingleExercise(
      String dayId, String dayName, PlannedExercise planned) {
    final newEx = ActiveExercise(
      plannedExerciseId: planned.id,
      exerciseDefinitionId: planned.exerciseDefinitionId,
      exerciseName: planned.exerciseName,
      muscleGroup: planned.muscleGroup,
      exerciseType: planned.exerciseType,
      cardioSubtype: planned.cardioSubtype,
      plannedDurationMinutes: planned.plannedDurationMinutes,
      plannedDistanceKm: planned.plannedDistanceKm,
      plannedPoolLengthM: planned.plannedPoolLengthM,
      plannedSwimStyle: planned.plannedSwimStyle,
      sets: planned.isCardio
          ? [LoggedSet()]
          : List.generate(
              planned.sets.clamp(1, 99),
              (_) => LoggedSet(reps: planned.reps, weight: planned.weight),
            ),
      restSeconds: planned.restTime,
      wodMovements: planned.wodMovements,
    );

    if (state.dayId == dayId && state.isActive) {
      // Mesmo dia — adiciona o exercício se ainda não estiver (por ID único)
      if (state.exercises.any((e) => e.plannedExerciseId == planned.id)) {
        return;
      }
      state = state.copyWith(exercises: [...state.exercises, newEx]);
      return;
    }

    // Novo dia (ou sem sessão) — começa com apenas esse exercício
    state = ActiveSessionState(
      dayId: dayId,
      dayName: dayName,
      exercises: [newEx],
      startedAt: DateTime.now(),
    );
  }

  void addExercise(
    ExerciseDefinition def, {
    int plannedReps = 10,
    double plannedWeight = 0,
    int restSeconds = 60,
  }) {
    if (state.exercises.any((e) => e.exerciseDefinitionId == def.id)) return;
    state = state.copyWith(
      exercises: [
        ...state.exercises,
        ActiveExercise(
          plannedExerciseId: def.id,
          exerciseDefinitionId: def.id,
          exerciseName: def.name,
          muscleGroup: def.muscleGroup,
          exerciseType: def.exerciseType,
          cardioSubtype: def.cardioSubtype,
          sets: def.isCardio
              ? [LoggedSet()]
              : [LoggedSet(reps: plannedReps, weight: plannedWeight)],
          restSeconds: restSeconds,
        ),
      ],
    );
  }

  void removeExercise(int index) {
    final updated = [...state.exercises]..removeAt(index);
    state = state.copyWith(exercises: updated);
  }

  void addSet(int exerciseIndex) {
    final updated = [...state.exercises];
    final ex = updated[exerciseIndex];
    final last = ex.sets.last;
    updated[exerciseIndex] = ex.copyWith(
      sets: [...ex.sets, LoggedSet(reps: last.reps, weight: last.weight)],
    );
    state = state.copyWith(exercises: updated);
  }

  void removeSet(int exerciseIndex, int setIndex) {
    final updated = [...state.exercises];
    final ex = updated[exerciseIndex];
    if (ex.sets.length <= 1) return;
    updated[exerciseIndex] = ex.copyWith(sets: [...ex.sets]..removeAt(setIndex));
    state = state.copyWith(exercises: updated);
  }

  void updateSet(
    int exerciseIndex,
    int setIndex, {
    int? reps,
    double? weight,
    int? rpe,
    int? durationSeconds,
    double? distanceKm,
    int? avgBpm,
    int? maxBpm,
    int? elevationGainM,
    RunType? runType,
    CardioIntensity? intensity,
    int? lapsCount,
    SwimStyle? swimStyle,
    int? kcalBurned,
    int? completedRounds,
    int? partialReps,
    List<WodMovement>? wodMovements,
    int? repsCount,
    int? floorsClimbed,
    double? inclinePercent,
    int? cadenceRpm,
    int? strokesPerMin,
  }) {
    final updated = [...state.exercises];
    final ex = updated[exerciseIndex];
    final sets = [...ex.sets];
    sets[setIndex] = sets[setIndex].copyWith(
      reps: reps,
      weight: weight,
      rpe: rpe,
      durationSeconds: durationSeconds,
      distanceKm: distanceKm,
      avgBpm: avgBpm,
      maxBpm: maxBpm,
      elevationGainM: elevationGainM,
      runType: runType,
      intensity: intensity,
      lapsCount: lapsCount,
      swimStyle: swimStyle,
      kcalBurned: kcalBurned,
      completedRounds: completedRounds,
      partialReps: partialReps,
      wodMovements: wodMovements,
      repsCount: repsCount,
      floorsClimbed: floorsClimbed,
      inclinePercent: inclinePercent,
      cadenceRpm: cadenceRpm,
      strokesPerMin: strokesPerMin,
    );
    updated[exerciseIndex] = ex.copyWith(sets: sets);
    state = state.copyWith(exercises: updated);
  }

  // Retorna true se o set foi marcado como concluído (não desmarcado)
  bool toggleSetComplete(int exerciseIndex, int setIndex) {
    final updated = [...state.exercises];
    final ex = updated[exerciseIndex];
    final sets = [...ex.sets];
    final wasCompleted = sets[setIndex].isCompleted;
    sets[setIndex] = sets[setIndex].copyWith(isCompleted: !wasCompleted);
    updated[exerciseIndex] = ex.copyWith(sets: sets);
    state = state.copyWith(exercises: updated);
    return !wasCompleted;
  }

  void updateRestSeconds(int exerciseIndex, int seconds) {
    final updated = [...state.exercises];
    updated[exerciseIndex] = updated[exerciseIndex].copyWith(restSeconds: seconds);
    state = state.copyWith(exercises: updated);
  }

  /// Reaplica os valores de modo (Força/Resistência) nos exercícios da sessão
  /// que ainda não tiveram nenhuma série concluída.
  void applyTrainingMode({
    required List<PlannedExercise> plannedExercises,
    required bool forceMode,
    Map<String, double> lastWeights = const {},
  }) {
    final updated = state.exercises.map((activeEx) {
      // Preserva exercícios com pelo menos uma série já concluída
      if (activeEx.sets.any((s) => s.isCompleted)) return activeEx;

      final planned = plannedExercises
          .where((p) =>
              p.exerciseDefinitionId == activeEx.exerciseDefinitionId)
          .firstOrNull;
      if (planned == null) return activeEx;

      final targetReps =
          forceMode ? (planned.reps - 4).clamp(1, 999) : planned.reps;
      final lastW = lastWeights[planned.exerciseDefinitionId];
      final targetWeight = forceMode
          ? (lastW ?? (planned.weight > 0 ? planned.weight : 0.0))
          : planned.weight;

      return activeEx.copyWith(
        sets: List.generate(
          activeEx.sets.length,
          (_) => LoggedSet(reps: targetReps, weight: targetWeight),
        ),
      );
    }).toList();

    state = state.copyWith(exercises: updated);
  }

  void clear() => state = const ActiveSessionState();
}

// Global — não autoDispose para sobreviver à navegação entre abas
final activeSessionProvider =
    StateNotifierProvider<ActiveSessionNotifier, ActiveSessionState>(
  (_) => ActiveSessionNotifier(),
);
