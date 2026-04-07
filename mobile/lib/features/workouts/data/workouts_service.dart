// lib/features/workouts/data/workouts_service.dart
import '../../../core/network/dio_client.dart';
import '../domain/workout_models.dart';

class WorkoutsService {
  WorkoutsService._();
  static final WorkoutsService instance = WorkoutsService._();

  final _dio = DioClient.instance.dio;

  // ─── Workout Days ────────────────────────────────────────────────────────────

  Future<List<WorkoutDay>> listWorkoutDays(String userId) async {
    final res = await _dio.get('/workouts/$userId/days');
    final data = res.data['data'] as List? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(WorkoutDay.fromJson)
        .toList();
  }

  Future<WorkoutDay> createWorkoutDay(
    String userId,
    String name, {
    String dayType = 'musculacao',
  }) async {
    final res = await _dio.post(
      '/workouts/$userId/days',
      data: {'name': name, 'dayType': dayType},
    );
    return WorkoutDay.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> deleteWorkoutDay(String userId, String dayId) async {
    await _dio.delete('/workouts/$userId/days/$dayId');
  }

  // ─── Planned Exercises ───────────────────────────────────────────────────────

  Future<WorkoutDay> addPlannedExercise(
    String userId,
    String dayId,
    PlannedExercise exercise,
  ) async {
    final res = await _dio.post(
      '/workouts/$userId/days/$dayId/exercises',
      data: exercise.toJson(),
    );
    return WorkoutDay.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> deletePlannedExercise(
    String userId,
    String dayId,
    String exerciseId,
  ) async {
    await _dio.delete('/workouts/$userId/days/$dayId/exercises/$exerciseId');
  }

  // ─── Exercise Definitions ────────────────────────────────────────────────────

  Future<List<ExerciseDefinition>> listExercises() async {
    final res = await _dio.get('/exercises');
    final data = res.data['data'] as List? ?? [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(ExerciseDefinition.fromJson)
        .toList();
  }

  Future<ExerciseDefinition> createExercise(
    String userId,
    String name, {
    String? muscleGroup,
    String? equipment,
    String exerciseType = 'forca',
  }) async {
    final res = await _dio.post('/exercises', data: {
      'name': name,
      if (muscleGroup != null) 'primaryMuscleGroup': muscleGroup,
      if (equipment != null) 'equipment': equipment,
      'exerciseType': exerciseType,
      'createdBy': userId,
    });
    return ExerciseDefinition.fromJson(
        res.data['data'] as Map<String, dynamic>);
  }

  // ─── Workout Sessions ────────────────────────────────────────────────────────

  Future<List<WorkoutSession>> listSessions(String userId) async {
    final res = await _dio.get('/workouts/$userId/sessions');
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(WorkoutSession.fromJson).toList();
  }

  Future<String> saveSession(
    String userId, {
    required String workoutName,
    required String? workoutDayId,
    required List<ActiveExercise> exercises,
    required int durationSeconds,
    String? trainingMode,
  }) async {
    final now = DateTime.now();
    final localDate =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final res = await _dio.post('/workouts/$userId/sessions', data: {
      'workoutName': workoutName,
      if (workoutDayId != null) 'workoutDayId': workoutDayId,
      'exercises': exercises.map((e) => e.toJson()).toList(),
      'duration': durationSeconds,
      'date': localDate, // local date prevents UTC offset shifting the day
      if (trainingMode != null) 'trainingMode': trainingMode,
    });
    final data = res.data['data'] as Map<String, dynamic>? ?? {};
    return data['id'] as String? ?? '';
  }

  Future<void> updateSessionMeta(
    String userId,
    String sessionId, {
    int? avgBpm,
    int? kcal,
  }) async {
    if (avgBpm == null && kcal == null) return;
    await _dio.patch('/workouts/$userId/sessions/$sessionId', data: {
      if (avgBpm != null) 'sessionAvgBpm': avgBpm,
      if (kcal != null) 'sessionKcal': kcal,
    });
  }

  Future<void> deleteSession(String userId, String sessionId) async {
    await _dio.delete('/workouts/$userId/sessions/$sessionId');
  }
}
