// lib/features/analytics/providers/analytics_provider.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../workouts/data/workouts_service.dart';
import '../../workouts/domain/workout_models.dart';

// ─── Sessions provider ────────────────────────────────────────────────────────

final workoutSessionsProvider = FutureProvider<List<WorkoutSession>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return WorkoutsService.instance.listSessions(user.uid);
});

// ─── Models ───────────────────────────────────────────────────────────────────

class ExercisePR {
  final String exerciseDefinitionId;
  final String exerciseName;
  final String muscleGroup;
  final double bestWeight;
  final DateTime date;
  final int timesPerformed;

  const ExercisePR({
    required this.exerciseDefinitionId,
    required this.exerciseName,
    required this.muscleGroup,
    required this.bestWeight,
    required this.date,
    required this.timesPerformed,
  });
}

class MuscleGroupStats {
  final String name;
  double totalVolume;
  double balancePct;
  int uniqueExercises; // distinct exerciseDefinitionIds
  int sessionCount;    // total exercise-session entries (for avg intensity)

  MuscleGroupStats({
    required this.name,
    required this.totalVolume,
    this.balancePct = 0,
    this.uniqueExercises = 0,
    this.sessionCount = 0,
  });

  double get avgIntensity => sessionCount > 0 ? totalVolume / sessionCount : 0;
}

class RpeVolumePoint {
  final DateTime date;
  final double volume;
  final double? avgRpe;
  const RpeVolumePoint({required this.date, required this.volume, this.avgRpe});
}

class MusculacaoAnalytics {
  final int totalSessions;
  final double totalVolume;
  final double avgDurationMin;
  final int consistencyScore;
  final int? avgBpm;
  final int totalKcal;
  // PRs
  final double prBestSessionVolume;
  final int prMaxSets;
  final Map<String, List<ExercisePR>> prByMuscleGroup; // ordered by volume
  // Distribution
  final List<MuscleGroupStats> muscleGroups;
  final List<WorkoutSession> recentSessions;
  // RPE × Volume
  final List<RpeVolumePoint> rpeVolumeData;

  const MusculacaoAnalytics({
    required this.totalSessions,
    required this.totalVolume,
    required this.avgDurationMin,
    required this.consistencyScore,
    this.avgBpm,
    this.totalKcal = 0,
    required this.prBestSessionVolume,
    required this.prMaxSets,
    required this.prByMuscleGroup,
    required this.muscleGroups,
    required this.recentSessions,
    this.rpeVolumeData = const [],
  });
}

class CardioSessionPR {
  final String label;
  final double? distanceKm;
  final int? durationSeconds;
  final int? paceSecondsPerKm;
  final DateTime date;

  const CardioSessionPR({
    required this.label,
    this.distanceKm,
    this.durationSeconds,
    this.paceSecondsPerKm,
    required this.date,
  });
}

class CardioAnalytics {
  final int totalSessions;
  final double totalDistanceKm;
  final int totalDurationSeconds;
  final double avgDurationMin;
  final int consistencyScore;
  // BPM
  final int? avgBpm;
  final int? maxBpm;
  // Kcal
  final int totalKcal;
  // Métricas adicionais
  final int totalFloors;
  final int totalFunctionalReps;
  // PRs
  final CardioSessionPR? prBestDistance;
  final CardioSessionPR? prBestDuration;
  final CardioSessionPR? prBestPace;     // corrida/caminhada — pace /km
  final CardioSessionPR? prBestRowPace;  // remo — pace /500m
  final CardioSessionPR? prBestSpeed;    // ciclismo — km/h
  // Breakdown
  final Map<String, int> bySubtype; // label → count
  final List<WorkoutSession> recentSessions;

  const CardioAnalytics({
    required this.totalSessions,
    required this.totalDistanceKm,
    required this.totalDurationSeconds,
    required this.avgDurationMin,
    required this.consistencyScore,
    this.avgBpm,
    this.maxBpm,
    this.totalKcal = 0,
    this.totalFloors = 0,
    this.totalFunctionalReps = 0,
    this.prBestDistance,
    this.prBestDuration,
    this.prBestPace,
    this.prBestRowPace,
    this.prBestSpeed,
    required this.bySubtype,
    required this.recentSessions,
  });
}

class CrossFitAnalytics {
  final int totalSessions;
  final double weeklyFrequency;
  final int consistencyScore;
  final int? avgBpm;
  final int totalKcal;
  // PRs
  final (String, int, DateTime)? prBestForTime;  // (name, durationSec, date)
  final (String, int, DateTime)? prBestAmrap;    // (name, rounds, date)
  // Breakdown
  final Map<String, int> wodFormatCounts;
  final List<(String, int)> topMovements; // (name, count) top 5
  final List<WorkoutSession> recentSessions;

  const CrossFitAnalytics({
    required this.totalSessions,
    required this.weeklyFrequency,
    required this.consistencyScore,
    this.avgBpm,
    this.totalKcal = 0,
    this.prBestForTime,
    this.prBestAmrap,
    required this.wodFormatCounts,
    required this.topMovements,
    required this.recentSessions,
  });
}

class DailyWorkoutSummary {
  final DateTime date;
  final int totalKcal;
  final int? avgBpm;
  final int sessionCount;
  final Set<String> modalities;

  const DailyWorkoutSummary({
    required this.date,
    required this.totalKcal,
    required this.avgBpm,
    required this.sessionCount,
    required this.modalities,
  });
}

// ── New premium analytics models ──────────────────────────────────────────────

class ExerciseProgressPoint {
  final DateTime date;
  final double maxWeight;
  final int maxReps;
  final double estimated1RM; // Epley: weight * (1 + reps/30)
  final String exerciseName;
  final String? muscleGroup;

  const ExerciseProgressPoint({
    required this.date,
    required this.maxWeight,
    required this.maxReps,
    required this.estimated1RM,
    required this.exerciseName,
    this.muscleGroup,
  });
}

class WeeklyVolumePoint {
  final DateTime weekStart;
  final double volume;
  final int sessions;

  const WeeklyVolumePoint({
    required this.weekStart,
    required this.volume,
    required this.sessions,
  });
}

enum SmartInsightType { positive, warning, info }

class SmartInsight {
  final String emoji;
  final String message;
  final SmartInsightType type;

  const SmartInsight({
    required this.emoji,
    required this.message,
    this.type = SmartInsightType.info,
  });

  Color color(BuildContext context) {
    switch (type) {
      case SmartInsightType.positive: return const Color(0xFF00D2A0);
      case SmartInsightType.warning:  return const Color(0xFFFF9800);
      case SmartInsightType.info:     return const Color(0xFF00C6FF);
    }
  }
}

class PeriodComparison {
  // Musculação
  final double currentVolume;
  final double lastVolume;
  final int currentMuscSessions;
  final int lastMuscSessions;
  // Cardio
  final double currentDistanceKm;
  final double lastDistanceKm;
  final int currentCardioSessions;
  final int lastCardioSessions;

  const PeriodComparison({
    required this.currentVolume,
    required this.lastVolume,
    required this.currentMuscSessions,
    required this.lastMuscSessions,
    required this.currentDistanceKm,
    required this.lastDistanceKm,
    required this.currentCardioSessions,
    required this.lastCardioSessions,
  });

  double get volumeDeltaPct => lastVolume > 0
      ? (currentVolume - lastVolume) / lastVolume * 100
      : (currentVolume > 0 ? 100 : 0);

  int get muscSessionsDelta => currentMuscSessions - lastMuscSessions;

  double get distanceDeltaPct => lastDistanceKm > 0
      ? (currentDistanceKm - lastDistanceKm) / lastDistanceKm * 100
      : (currentDistanceKm > 0 ? 100 : 0);

  int get cardioSessionsDelta => currentCardioSessions - lastCardioSessions;
}

class FullAnalytics {
  final MusculacaoAnalytics musculacao;
  final CardioAnalytics cardio;
  final CrossFitAnalytics crossfit;
  final List<DailyWorkoutSummary> dailyTotals;
  final Map<String, List<WorkoutSession>> sessionsByDay;
  // Premium
  final Map<String, List<ExerciseProgressPoint>> exerciseHistory;
  final List<WeeklyVolumePoint> weeklyVolume;
  final PeriodComparison periodComparison;
  final List<SmartInsight> insights;
  final Map<String, int> annualActivity; // 'YYYY-MM-DD' → session count

  const FullAnalytics({
    required this.musculacao,
    required this.cardio,
    required this.crossfit,
    required this.dailyTotals,
    required this.sessionsByDay,
    this.exerciseHistory = const {},
    this.weeklyVolume = const [],
    required this.periodComparison,
    this.insights = const [],
    this.annualActivity = const {},
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

int _consistencyScore(List<WorkoutSession> sessions) {
  final now = DateTime.now();
  final last30 = sessions.where((s) => now.difference(s.createdAt).inDays <= 30).length;
  return (last30 / 20 * 100).clamp(0, 100).toInt();
}

String _subtypeLabel(String? subtype) {
  switch (subtype) {
    case 'corrida':               return 'Corrida';
    case 'caminhada':             return 'Caminhada';
    case 'ciclismo':              return 'Ciclismo';
    case 'bicicleta_ergometrica': return 'Bicicleta Erg.';
    case 'natacao':               return 'Natação';
    case 'remo':                  return 'Remo';
    case 'escada':                return 'Escada';
    case 'funcional':             return 'Funcional';
    default:                      return 'Aeróbico';
  }
}

String _wodFormatLabel(String? format) {
  switch (format) {
    case 'amrap':   return 'AMRAP';
    case 'forTime': return 'For Time';
    case 'emom':    return 'EMOM';
    case 'tabata':  return 'Tabata';
    default:        return format ?? 'Livre';
  }
}

// ─── Computation ─────────────────────────────────────────────────────────────

class _ExerciseAgg {
  final String exerciseDefinitionId;
  final String exerciseName;
  final String muscleGroup;
  double bestWeight = 0;
  DateTime? bestDate;
  int timesPerformed = 0;

  _ExerciseAgg({
    required this.exerciseDefinitionId,
    required this.exerciseName,
    required this.muscleGroup,
  });
}

FullAnalytics _compute(List<WorkoutSession> sessions) {
  final sorted = [...sessions]..sort((a, b) => a.createdAt.compareTo(b.createdAt));
  final now = DateTime.now();

  // ── Musculação ─────────────────────────────────────────────────────────────

  final muscSessions = sorted
      .where((s) => s.exercises.any((e) => !e.isCardio))
      .toList();

  // Per-exercise PRs (actual best weight lifted).
  // Keyed by normalized name so exercises added by a professional (no
  // exerciseDefinitionId) are tracked correctly alongside catalog exercises.
  final Map<String, _ExerciseAgg> byExercise = {};
  for (final s in muscSessions) {
    for (final e in s.exercises.where((ex) => !ex.isCardio)) {
      final nameKey = e.exerciseName.trim().toLowerCase();
      final agg = byExercise.putIfAbsent(
        nameKey,
        () => _ExerciseAgg(
          exerciseDefinitionId: e.exerciseDefinitionId,
          exerciseName: e.exerciseName,
          muscleGroup: e.muscleGroup ?? 'Outros',
        ),
      );
      agg.timesPerformed++;
      for (final set in e.sets) {
        if (set.weight > agg.bestWeight) {
          agg.bestWeight = set.weight;
          agg.bestDate = s.createdAt;
        }
      }
    }
  }

  // Group by muscle group, sort exercises by bestWeight desc
  final Map<String, List<ExercisePR>> prByMuscle = {};
  for (final agg in byExercise.values) {
    if (agg.bestWeight <= 0) continue;
    prByMuscle.putIfAbsent(agg.muscleGroup, () => []).add(ExercisePR(
      exerciseDefinitionId: agg.exerciseDefinitionId,
      exerciseName: agg.exerciseName,
      muscleGroup: agg.muscleGroup,
      bestWeight: agg.bestWeight,
      date: agg.bestDate ?? now,
      timesPerformed: agg.timesPerformed,
    ));
  }
  for (final list in prByMuscle.values) {
    list.sort((a, b) => b.bestWeight.compareTo(a.bestWeight));
  }

  // Sort muscle groups by total volume descending
  final Map<String, double> muscleVolumes = {};
  for (final s in muscSessions) {
    for (final e in s.exercises.where((ex) => !ex.isCardio)) {
      final g = e.muscleGroup ?? 'Outros';
      muscleVolumes[g] = (muscleVolumes[g] ?? 0) + e.totalVolume;
    }
  }
  final sortedMuscleKeys = prByMuscle.keys.toList()
    ..sort((a, b) => (muscleVolumes[b] ?? 0).compareTo(muscleVolumes[a] ?? 0));
  final sortedPrByMuscle = {for (final k in sortedMuscleKeys) k: prByMuscle[k]!};

  // Muscle group distribution — with unique exercises and session count
  final Map<String, Set<String>> muscleUniqueEx = {};
  final Map<String, int> muscleSessionCount = {};
  for (final s in muscSessions) {
    for (final e in s.exercises.where((ex) => !ex.isCardio)) {
      final g = e.muscleGroup ?? 'Outros';
      muscleUniqueEx.putIfAbsent(g, () => {}).add(e.exerciseName.trim().toLowerCase());
      muscleSessionCount[g] = (muscleSessionCount[g] ?? 0) + 1;
    }
  }
  final muscleGroups = muscleVolumes.entries
      .map((e) => MuscleGroupStats(
            name: e.key,
            totalVolume: e.value,
            uniqueExercises: muscleUniqueEx[e.key]?.length ?? 0,
            sessionCount: muscleSessionCount[e.key] ?? 0,
          ))
      .toList()
    ..sort((a, b) => b.totalVolume.compareTo(a.totalVolume));
  final totalMuscVol = muscleGroups.fold(0.0, (v, m) => v + m.totalVolume);
  for (final m in muscleGroups) {
    m.balancePct = totalMuscVol > 0 ? (m.totalVolume / totalMuscVol * 100) : 0;
  }

  // Session PRs
  double prBestSessionVol = 0;
  int prMaxSets = 0;
  for (final s in muscSessions) {
    if (s.totalVolume > prBestSessionVol) prBestSessionVol = s.totalVolume;
    final sets = s.exercises
        .where((e) => !e.isCardio)
        .fold(0, (t, e) => t + e.sets.length);
    if (sets > prMaxSets) prMaxSets = sets;
  }

  final muscTotalVol = muscSessions.fold(0.0, (v, s) => v + s.totalVolume);
  final avgMuscDur = muscSessions.isEmpty
      ? 0.0
      : muscSessions.fold(0, (t, s) => t + s.durationSeconds) /
            muscSessions.length /
            60;

  final muscBpmVals = muscSessions.map((s) => s.effectiveAvgBpm).whereType<int>().toList();
  final int? muscAvgBpm = muscBpmVals.isEmpty ? null
      : (muscBpmVals.fold(0, (a, b) => a + b) / muscBpmVals.length).round();
  final muscTotalKcal = muscSessions.fold(0, (t, s) => t + s.totalKcalBurned);

  // RPE × Volume — last 12 strength sessions (oldest → newest for chart)
  final rpeVolumeData = muscSessions.reversed.take(12).toList().reversed
      .map((s) {
        final allSets = s.exercises
            .where((e) => !e.isCardio)
            .expand((e) => e.sets)
            .toList();
        final ratedSets = allSets.where((st) => st.rpe != null).toList();
        final avgRpe = ratedSets.isNotEmpty
            ? ratedSets.fold<double>(0, (v, st) => v + st.rpe!) /
                ratedSets.length
            : null;
        return RpeVolumePoint(
          date: s.createdAt,
          volume: s.totalVolume,
          avgRpe: avgRpe,
        );
      })
      .toList();

  final musculacao = MusculacaoAnalytics(
    totalSessions: muscSessions.length,
    totalVolume: muscTotalVol,
    avgDurationMin: avgMuscDur,
    consistencyScore: _consistencyScore(muscSessions),
    avgBpm: muscAvgBpm,
    totalKcal: muscTotalKcal,
    prBestSessionVolume: prBestSessionVol,
    prMaxSets: prMaxSets,
    prByMuscleGroup: sortedPrByMuscle,
    muscleGroups: muscleGroups,
    recentSessions: muscSessions.reversed.take(5).toList(),
    rpeVolumeData: rpeVolumeData,
  );

  // ── Cardio ─────────────────────────────────────────────────────────────────

  final cardioSessions = sorted
      .where((s) => s.exercises.any((e) => e.isCardio && !e.isCrossFit))
      .toList();

  double totalDistKm = 0;
  int totalCardioSec = 0;
  int totalFloors = 0;
  int totalFunctionalReps = 0;
  for (final s in cardioSessions) {
    for (final e in s.exercises.where((ex) => ex.isCardio && !ex.isCrossFit)) {
      totalDistKm += e.totalDistanceKm;
      totalCardioSec += e.totalDurationSeconds;
      totalFloors += e.totalFloorsClimbed;
      totalFunctionalReps += e.totalRepsCount;
    }
  }

  CardioSessionPR? prBestDist;
  CardioSessionPR? prBestDur;
  CardioSessionPR? prBestPace;      // corrida/caminhada — melhor pace /km
  CardioSessionPR? prBestRowPace;   // remo — melhor pace /500m
  CardioSessionPR? prBestSpeed;     // ciclismo — melhor velocidade km/h

  for (final s in cardioSessions) {
    for (final e in s.exercises.where((ex) => ex.isCardio && !ex.isCrossFit)) {
      final dist  = e.totalDistanceKm;
      final dur   = e.totalDurationSeconds;
      final label = _subtypeLabel(e.cardioSubtype);

      if (dist > 0 && dist > (prBestDist?.distanceKm ?? 0)) {
        prBestDist = CardioSessionPR(label: label, distanceKm: dist, durationSeconds: dur, date: s.createdAt);
      }
      if (dur > 0 && dur > (prBestDur?.durationSeconds ?? 0)) {
        prBestDur = CardioSessionPR(label: label, distanceKm: dist, durationSeconds: dur, date: s.createdAt);
      }
      // Pace /km — corrida e caminhada
      if (e.isRunning || e.isWalking) {
        for (final set in e.sets) {
          final pace = set.paceSecondsPerKm;
          if (pace != null && pace > 0) {
            final best = prBestPace?.paceSecondsPerKm ?? 999999;
            if (pace < best) {
              prBestPace = CardioSessionPR(
                label: label, paceSecondsPerKm: pace,
                distanceKm: set.distanceKm, durationSeconds: set.durationSeconds, date: s.createdAt,
              );
            }
          }
        }
      }
      // Pace /500m — remo
      if (e.isRowing) {
        for (final set in e.sets) {
          final pace = set.paceSeconds500m;
          if (pace != null && pace > 0) {
            final best = prBestRowPace?.paceSecondsPerKm ?? 999999; // reuse field for /500m
            if (pace < best) {
              prBestRowPace = CardioSessionPR(
                label: 'Remo', paceSecondsPerKm: pace,
                distanceKm: set.distanceKm, durationSeconds: set.durationSeconds, date: s.createdAt,
              );
            }
          }
        }
      }
      // Velocidade km/h — ciclismo
      if (e.isCycling && dist > 0 && dur > 0) {
        final kmh = dist / (dur / 3600);
        final bestKmh = prBestSpeed != null && prBestSpeed!.distanceKm != null && prBestSpeed!.durationSeconds != null
            ? prBestSpeed!.distanceKm! / (prBestSpeed!.durationSeconds! / 3600)
            : 0.0;
        if (kmh > bestKmh) {
          prBestSpeed = CardioSessionPR(label: label, distanceKm: dist, durationSeconds: dur, date: s.createdAt);
        }
      }
    }
  }

  final Map<String, int> bySubtype = {};
  for (final s in cardioSessions) {
    final subtypes = s.exercises
        .where((e) => e.isCardio && !e.isCrossFit)
        .map((e) => _subtypeLabel(e.cardioSubtype))
        .toSet();
    for (final st in subtypes) { bySubtype[st] = (bySubtype[st] ?? 0) + 1; }
  }

  final avgCardioDur = cardioSessions.isEmpty
      ? 0.0
      : totalCardioSec / cardioSessions.length / 60;

  // BPM aggregation (por exercício + fallback smartwatch)
  final bpmVals = cardioSessions
      .map((s) => s.effectiveAvgBpm)
      .whereType<int>()
      .toList();
  final int? cardioAvgBpm = bpmVals.isEmpty
      ? null
      : (bpmVals.fold(0, (a, b) => a + b) / bpmVals.length).round();
  final maxBpmVals = cardioSessions
      .map((s) => s.effectiveMaxBpm)
      .whereType<int>()
      .toList();
  final int? cardioMaxBpm = maxBpmVals.isEmpty
      ? null
      : maxBpmVals.reduce((a, b) => a > b ? a : b);

  // Kcal aggregation
  final totalKcal = cardioSessions.fold(0, (t, s) => t + s.totalKcalBurned);

  final cardio = CardioAnalytics(
    totalSessions: cardioSessions.length,
    totalDistanceKm: totalDistKm,
    totalDurationSeconds: totalCardioSec,
    avgDurationMin: avgCardioDur,
    consistencyScore: _consistencyScore(cardioSessions),
    avgBpm: cardioAvgBpm,
    maxBpm: cardioMaxBpm,
    totalKcal: totalKcal,
    totalFloors: totalFloors,
    totalFunctionalReps: totalFunctionalReps,
    prBestDistance: prBestDist,
    prBestDuration: prBestDur,
    prBestPace: prBestPace,
    prBestRowPace: prBestRowPace,
    prBestSpeed: prBestSpeed,
    bySubtype: bySubtype,
    recentSessions: cardioSessions.reversed.take(5).toList(),
  );

  // ── CrossFit ───────────────────────────────────────────────────────────────

  final cfSessions = sorted
      .where((s) => s.exercises.any((e) => e.isCrossFit))
      .toList();

  (String, int, DateTime)? prForTime;
  (String, int, DateTime)? prAmrap;

  for (final s in cfSessions) {
    for (final e in s.exercises.where((ex) => ex.isCrossFit)) {
      if (e.wodFormat == 'forTime') {
        final dur = e.totalDurationSeconds;
        if (dur > 0 && (prForTime == null || dur < prForTime.$2)) {
          prForTime = (e.exerciseName, dur, s.createdAt);
        }
      }
      if (e.wodFormat == 'amrap') {
        for (final set in e.sets) {
          final rounds = set.completedRounds ?? 0;
          if (rounds > 0 && (prAmrap == null || rounds > prAmrap.$2)) {
            prAmrap = (e.exerciseName, rounds, s.createdAt);
          }
        }
      }
    }
  }

  final Map<String, int> wodFormatCounts = {};
  final Map<String, int> movementCounts = {};

  for (final s in cfSessions) {
    for (final e in s.exercises.where((ex) => ex.isCrossFit)) {
      if (e.wodFormat != null) {
        final label = _wodFormatLabel(e.wodFormat);
        wodFormatCounts[label] = (wodFormatCounts[label] ?? 0) + 1;
      }
      for (final set in e.sets) {
        for (final m in set.wodMovements) {
          movementCounts[m.name] = (movementCounts[m.name] ?? 0) + 1;
        }
      }
    }
  }

  final topMovements = (movementCounts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value)))
      .take(5)
      .map((e) => (e.key, e.value))
      .toList();

  final cfWeeks = cfSessions.isEmpty
      ? 1.0
      : (now.difference(cfSessions.first.createdAt).inDays / 7.0)
            .clamp(1.0, double.infinity);

  final cfBpmVals = cfSessions.map((s) => s.effectiveAvgBpm).whereType<int>().toList();
  final int? cfAvgBpm = cfBpmVals.isEmpty ? null
      : (cfBpmVals.fold(0, (a, b) => a + b) / cfBpmVals.length).round();
  final cfTotalKcal = cfSessions.fold(0, (t, s) => t + s.totalKcalBurned);

  final crossfit = CrossFitAnalytics(
    totalSessions: cfSessions.length,
    weeklyFrequency: cfSessions.length / cfWeeks,
    consistencyScore: _consistencyScore(cfSessions),
    avgBpm: cfAvgBpm,
    totalKcal: cfTotalKcal,
    prBestForTime: prForTime,
    prBestAmrap: prAmrap,
    wodFormatCounts: wodFormatCounts,
    topMovements: topMovements,
    recentSessions: cfSessions.reversed.take(5).toList(),
  );

  // ── Daily aggregation (cross-modality) ───────────────────────────────────────

  final Map<String, List<WorkoutSession>> byDay = {};
  for (final s in sorted) {
    final d = s.createdAt;
    final key = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    byDay.putIfAbsent(key, () => []).add(s);
  }

  final dailyTotals = byDay.entries.map((entry) {
    final daySessions = entry.value;
    final kcal = daySessions.fold(0, (t, s) => t + s.totalKcalBurned);
    final bpmVals = daySessions.map((s) => s.effectiveAvgBpm).whereType<int>().toList();
    final avgBpm = bpmVals.isEmpty
        ? null
        : (bpmVals.fold(0, (a, b) => a + b) / bpmVals.length).round();
    final modalities = <String>{};
    for (final s in daySessions) {
      if (s.exercises.any((e) => e.isCrossFit)) {
        modalities.add('CrossFit');
      } else if (s.exercises.any((e) => e.isCardio)) {
        modalities.add('Cardio');
      } else {
        modalities.add('Musculação');
      }
    }
    return DailyWorkoutSummary(
      date: daySessions.first.createdAt,
      totalKcal: kcal,
      avgBpm: avgBpm,
      sessionCount: daySessions.length,
      modalities: modalities,
    );
  }).toList()
    ..sort((a, b) => b.date.compareTo(a.date));

  // ── Exercise history + estimated 1RM (Epley) ─────────────────────────────────

  // Keyed by normalized exercise name to avoid duplicates from different IDs
  final Map<String, List<ExerciseProgressPoint>> exerciseHistory = {};
  for (final s in muscSessions) {
    for (final e in s.exercises.where((ex) => !ex.isCardio)) {
      double best1RM = 0;
      double bestWeight = 0;
      int bestReps = 0;
      for (final set in e.sets) {
        if (set.weight <= 0) continue;
        // Use reps=1 as floor so sets logged with weight but no reps still
        // generate a data point (Epley with 1 rep ≈ weight itself).
        final reps = set.reps > 0 ? set.reps : 1;
        final e1rm = set.weight * (1 + reps / 30.0);
        if (e1rm > best1RM) {
          best1RM = e1rm;
          bestWeight = set.weight;
          bestReps = set.reps; // keep original (may be 0)
        }
      }
      if (best1RM <= 0) continue;
      final nameKey = e.exerciseName.trim().toLowerCase();
      exerciseHistory.putIfAbsent(nameKey, () => []).add(
        ExerciseProgressPoint(
          date: s.createdAt,
          maxWeight: bestWeight,
          maxReps: bestReps,
          estimated1RM: best1RM,
          exerciseName: e.exerciseName.trim(),
          muscleGroup: e.muscleGroup,
        ),
      );
    }
  }
  // Sort each exercise's points chronologically
  for (final pts in exerciseHistory.values) {
    pts.sort((a, b) => a.date.compareTo(b.date));
  }

  // ── Weekly volume — last 16 weeks ─────────────────────────────────────────

  DateTime mondayOf(DateTime d) {
    final weekday = d.weekday; // 1=Mon ... 7=Sun
    return DateTime(d.year, d.month, d.day - (weekday - 1));
  }

  final List<WeeklyVolumePoint> weeklyVolume = [];
  for (int i = 15; i >= 0; i--) {
    final weekStart = mondayOf(now.subtract(Duration(days: i * 7)));
    final weekEnd   = weekStart.add(const Duration(days: 7));
    final weekSessions = muscSessions.where(
        (s) => !s.createdAt.isBefore(weekStart) && s.createdAt.isBefore(weekEnd)).toList();
    weeklyVolume.add(WeeklyVolumePoint(
      weekStart: weekStart,
      volume: weekSessions.fold(0.0, (v, s) => v + s.totalVolume),
      sessions: weekSessions.length,
    ));
  }

  // ── Period comparison — current month vs last month ────────────────────────

  final startOfThisMonth = DateTime(now.year, now.month, 1);
  final startOfLastMonth = DateTime(now.year, now.month - 1, 1);

  final thisMusc = muscSessions.where((s) => !s.createdAt.isBefore(startOfThisMonth)).toList();
  final lastMusc = muscSessions.where((s) =>
      !s.createdAt.isBefore(startOfLastMonth) && s.createdAt.isBefore(startOfThisMonth)).toList();

  final thisCardio = cardioSessions.where((s) => !s.createdAt.isBefore(startOfThisMonth)).toList();
  final lastCardio = cardioSessions.where((s) =>
      !s.createdAt.isBefore(startOfLastMonth) && s.createdAt.isBefore(startOfThisMonth)).toList();

  final periodComparison = PeriodComparison(
    currentVolume: thisMusc.fold(0.0, (v, s) => v + s.totalVolume),
    lastVolume: lastMusc.fold(0.0, (v, s) => v + s.totalVolume),
    currentMuscSessions: thisMusc.length,
    lastMuscSessions: lastMusc.length,
    currentDistanceKm: thisCardio.fold(0.0, (v, s) =>
        v + s.exercises.where((e) => e.isCardio && !e.isCrossFit).fold(0.0, (d, e) => d + e.totalDistanceKm)),
    lastDistanceKm: lastCardio.fold(0.0, (v, s) =>
        v + s.exercises.where((e) => e.isCardio && !e.isCrossFit).fold(0.0, (d, e) => d + e.totalDistanceKm)),
    currentCardioSessions: thisCardio.length,
    lastCardioSessions: lastCardio.length,
  );

  // ── Smart Insights ────────────────────────────────────────────────────────

  final List<SmartInsight> insights = [];
  final allSorted = [...sorted];

  if (allSorted.isNotEmpty) {
    final last = allSorted.last;
    final daysSince = now.difference(last.createdAt).inDays;

    if (daysSince >= 7) {
      insights.add(SmartInsight(
        emoji: '⏰',
        message: 'Você não treina há $daysSince dias. Que tal voltar hoje?',
        type: SmartInsightType.warning,
      ));
    } else if (daysSince == 0) {
      insights.add(SmartInsight(
        emoji: '🔥',
        message: 'Treinou hoje! Ótimo trabalho.',
        type: SmartInsightType.positive,
      ));
    } else if (daysSince == 1) {
      insights.add(SmartInsight(
        emoji: '💪',
        message: 'Treinou ontem. Continue assim!',
        type: SmartInsightType.positive,
      ));
    }
  }

  // Consistência
  if (musculacao.consistencyScore >= 80) {
    insights.add(SmartInsight(
      emoji: '⭐',
      message: 'Consistência excelente: ${musculacao.consistencyScore}% nos últimos 30 dias.',
      type: SmartInsightType.positive,
    ));
  } else if (musculacao.totalSessions > 0 && musculacao.consistencyScore < 40) {
    insights.add(SmartInsight(
      emoji: '📉',
      message: 'Consistência baixa este mês (${musculacao.consistencyScore}%). Tente treinar com mais frequência.',
      type: SmartInsightType.warning,
    ));
  }

  // Volume semanal — comparação das duas últimas semanas
  if (weeklyVolume.length >= 2) {
    final thisWeekVol = weeklyVolume.last.volume;
    final lastWeekVol = weeklyVolume[weeklyVolume.length - 2].volume;
    if (lastWeekVol > 0 && thisWeekVol > 0) {
      final pct = ((thisWeekVol - lastWeekVol) / lastWeekVol * 100).round();
      if (pct >= 10) {
        insights.add(SmartInsight(
          emoji: '📈',
          message: 'Volume ${pct > 0 ? "+$pct%" : "$pct%"} esta semana vs semana passada.',
          type: SmartInsightType.positive,
        ));
      } else if (pct <= -20) {
        insights.add(SmartInsight(
          emoji: '📉',
          message: 'Volume $pct% esta semana vs semana passada.',
          type: SmartInsightType.warning,
        ));
      }
    }
  }

  // Desequilíbrio push vs pull
  if (musculacao.muscleGroups.length >= 3) {
    final pushGroups = {'Peito', 'Ombro', 'Ombros', 'Tríceps', 'Triceps'};
    final pullGroups = {'Costas', 'Bíceps', 'Biceps'};
    final pushVol = musculacao.muscleGroups
        .where((m) => pushGroups.any((p) => m.name.contains(p)))
        .fold(0.0, (v, m) => v + m.totalVolume);
    final pullVol = musculacao.muscleGroups
        .where((m) => pullGroups.any((p) => m.name.contains(p)))
        .fold(0.0, (v, m) => v + m.totalVolume);
    if (pullVol > 0 && pushVol / pullVol > 2.0) {
      insights.add(SmartInsight(
        emoji: '⚖️',
        message: 'Possível desequilíbrio: você empurra muito mais do que puxa. Considere mais treinos de costas/bíceps.',
        type: SmartInsightType.warning,
      ));
    } else if (pushVol > 0 && pullVol / pushVol > 2.0) {
      insights.add(SmartInsight(
        emoji: '⚖️',
        message: 'Você puxa mais do que empurra. Considere equilibrar com mais trabalho de peito/ombro.',
        type: SmartInsightType.info,
      ));
    }
  }

  // Grupo muscular sem treinar há mais de 10 dias
  if (muscSessions.length >= 5) {
    final Map<String, DateTime> lastTrainedByGroup = {};
    for (final s in muscSessions) {
      for (final e in s.exercises.where((ex) => !ex.isCardio)) {
        final g = e.muscleGroup ?? 'Outros';
        final prev = lastTrainedByGroup[g];
        if (prev == null || s.createdAt.isAfter(prev)) {
          lastTrainedByGroup[g] = s.createdAt;
        }
      }
    }
    for (final entry in lastTrainedByGroup.entries) {
      final daysAgo = now.difference(entry.value).inDays;
      if (daysAgo >= 10) {
        insights.add(SmartInsight(
          emoji: '🦵',
          message: '${entry.key} não é treinado há $daysAgo dias.',
          type: SmartInsightType.warning,
        ));
        break; // só 1 aviso deste tipo
      }
    }
  }

  // 1RM recorde evoluindo
  if (exerciseHistory.isNotEmpty) {
    for (final entry in exerciseHistory.entries) {
      final pts = entry.value;
      if (pts.length >= 4) {
        final oldAvg = pts.take(pts.length ~/ 2).fold(0.0, (v, p) => v + p.estimated1RM) / (pts.length ~/ 2);
        final newAvg = pts.skip(pts.length ~/ 2).fold(0.0, (v, p) => v + p.estimated1RM) / (pts.length - pts.length ~/ 2);
        final pct = oldAvg > 0 ? ((newAvg - oldAvg) / oldAvg * 100).round() : 0;
        if (pct >= 5) {
          final name = pts.first.exerciseName;
          insights.add(SmartInsight(
            emoji: '🏆',
            message: '1RM estimado de $name cresceu +$pct% no histórico.',
            type: SmartInsightType.positive,
          ));
          break;
        }
      }
    }
  }

  // ── Annual activity map ───────────────────────────────────────────────────

  final Map<String, int> annualActivity = {};
  final oneYearAgo = now.subtract(const Duration(days: 365));
  for (final s in allSorted) {
    if (s.createdAt.isBefore(oneYearAgo)) continue;
    final key = '${s.createdAt.year}-'
        '${s.createdAt.month.toString().padLeft(2, '0')}-'
        '${s.createdAt.day.toString().padLeft(2, '0')}';
    annualActivity[key] = (annualActivity[key] ?? 0) + 1;
  }

  return FullAnalytics(
    musculacao: musculacao,
    cardio: cardio,
    crossfit: crossfit,
    dailyTotals: dailyTotals,
    sessionsByDay: byDay,
    exerciseHistory: exerciseHistory,
    weeklyVolume: weeklyVolume,
    periodComparison: periodComparison,
    insights: insights,
    annualActivity: annualActivity,
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

final analyticsProvider = Provider<AsyncValue<FullAnalytics>>((ref) {
  return ref.watch(workoutSessionsProvider).whenData(_compute);
});
