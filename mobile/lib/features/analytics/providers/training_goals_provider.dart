// lib/features/analytics/providers/training_goals_provider.dart
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ─── Model ────────────────────────────────────────────────────────────────────

enum GoalType { strength, cardioDistance, cardioPace }

class TrainingGoal {
  final String id;
  final GoalType type;
  final String label;                   // display name
  final String? exerciseDefinitionId;   // strength: links to PlannedExercise.exerciseDefinitionId

  // Strength
  final double? targetWeight;
  final double? currentBestWeight;

  // Cardio — distance
  final double? targetDistanceKm;
  final double? currentBestDistanceKm;

  // Cardio — pace (sec/km, lower = better)
  final int? targetPaceSecPerKm;
  final int? currentBestPaceSecPerKm;

  final DateTime createdAt;

  const TrainingGoal({
    required this.id,
    required this.type,
    required this.label,
    this.exerciseDefinitionId,
    this.targetWeight,
    this.currentBestWeight,
    this.targetDistanceKm,
    this.currentBestDistanceKm,
    this.targetPaceSecPerKm,
    this.currentBestPaceSecPerKm,
    required this.createdAt,
  });

  // ── Progress ────────────────────────────────────────────────────────────────

  double get progressPct {
    switch (type) {
      case GoalType.strength:
        if (targetWeight == null || targetWeight! <= 0 || currentBestWeight == null) return 0;
        return (currentBestWeight! / targetWeight! * 100).clamp(0, 100);
      case GoalType.cardioDistance:
        if (targetDistanceKm == null || targetDistanceKm! <= 0 || currentBestDistanceKm == null) return 0;
        return (currentBestDistanceKm! / targetDistanceKm! * 100).clamp(0, 100);
      case GoalType.cardioPace:
        if (targetPaceSecPerKm == null || targetPaceSecPerKm! <= 0 || currentBestPaceSecPerKm == null) return 0;
        if (currentBestPaceSecPerKm! <= targetPaceSecPerKm!) return 100;
        final worst = targetPaceSecPerKm! * 2.0;
        return ((worst - currentBestPaceSecPerKm!) / (worst - targetPaceSecPerKm!) * 100).clamp(0, 100);
    }
  }

  bool get isAchieved {
    switch (type) {
      case GoalType.strength:
        return currentBestWeight != null && targetWeight != null && currentBestWeight! >= targetWeight!;
      case GoalType.cardioDistance:
        return currentBestDistanceKm != null && targetDistanceKm != null && currentBestDistanceKm! >= targetDistanceKm!;
      case GoalType.cardioPace:
        return currentBestPaceSecPerKm != null && targetPaceSecPerKm != null && currentBestPaceSecPerKm! <= targetPaceSecPerKm!;
    }
  }

  String get currentDisplay {
    switch (type) {
      case GoalType.strength:
        return currentBestWeight != null ? '${currentBestWeight!.toStringAsFixed(1)} kg' : '—';
      case GoalType.cardioDistance:
        return currentBestDistanceKm != null ? '${currentBestDistanceKm!.toStringAsFixed(2)} km' : '—';
      case GoalType.cardioPace:
        return currentBestPaceSecPerKm != null ? fmtPace(currentBestPaceSecPerKm!) : '—';
    }
  }

  String get targetDisplay {
    switch (type) {
      case GoalType.strength:
        return targetWeight != null ? '${targetWeight!.toStringAsFixed(1)} kg' : '—';
      case GoalType.cardioDistance:
        return targetDistanceKm != null ? '${targetDistanceKm!.toStringAsFixed(1)} km' : '—';
      case GoalType.cardioPace:
        return targetPaceSecPerKm != null ? '${fmtPace(targetPaceSecPerKm!)}/km' : '—';
    }
  }

  String get typeEmoji {
    switch (type) {
      case GoalType.strength:       return '💪';
      case GoalType.cardioDistance: return '🏃';
      case GoalType.cardioPace:     return '⚡';
    }
  }

  // ── Copy with updated progress ───────────────────────────────────────────────

  TrainingGoal copyWithBest({double? weight, double? distance, int? pace}) =>
      TrainingGoal(
        id: id, type: type, label: label,
        exerciseDefinitionId: exerciseDefinitionId,
        targetWeight: targetWeight,
        currentBestWeight: weight ?? currentBestWeight,
        targetDistanceKm: targetDistanceKm,
        currentBestDistanceKm: distance ?? currentBestDistanceKm,
        targetPaceSecPerKm: targetPaceSecPerKm,
        currentBestPaceSecPerKm: pace ?? currentBestPaceSecPerKm,
        createdAt: createdAt,
      );

  // ── Serialization ────────────────────────────────────────────────────────────

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type.name,
    'label': label,
    if (exerciseDefinitionId != null) 'exerciseDefinitionId': exerciseDefinitionId,
    if (targetWeight != null) 'targetWeight': targetWeight,
    if (targetDistanceKm != null) 'targetDistanceKm': targetDistanceKm,
    if (targetPaceSecPerKm != null) 'targetPaceSecPerKm': targetPaceSecPerKm,
    'createdAt': createdAt.toIso8601String(),
  };

  factory TrainingGoal.fromJson(Map<String, dynamic> json) {
    GoalType type;
    switch (json['type'] as String?) {
      case 'cardioDistance': type = GoalType.cardioDistance; break;
      case 'cardioPace':     type = GoalType.cardioPace; break;
      default:               type = GoalType.strength;
    }
    final label = (json['label'] ?? json['exerciseName'] ?? '') as String;
    return TrainingGoal(
      id: json['id'] as String,
      type: type,
      label: label,
      exerciseDefinitionId: json['exerciseDefinitionId'] as String?,
      targetWeight: (json['targetWeight'] as num?)?.toDouble(),
      targetDistanceKm: (json['targetDistanceKm'] as num?)?.toDouble(),
      targetPaceSecPerKm: (json['targetPaceSecPerKm'] as num?)?.toInt(),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

String fmtPace(int secPerKm) {
  final m = secPerKm ~/ 60;
  final s = secPerKm % 60;
  return "$m'${s.toString().padLeft(2, '0')}\"";
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

const _kPrefsKey = 'training_goals_v2';

class TrainingGoalsNotifier extends StateNotifier<List<TrainingGoal>> {
  TrainingGoalsNotifier() : super([]) { _load(); }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kPrefsKey) ?? prefs.getString('training_goals_v1');
    if (raw == null) return;
    try {
      state = (jsonDecode(raw) as List)
          .whereType<Map<String, dynamic>>()
          .map(TrainingGoal.fromJson)
          .toList();
    } catch (_) {}
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kPrefsKey,
        jsonEncode(state.map((g) => g.toJson()).toList()));
  }

  Future<void> add(TrainingGoal goal) async {
    state = [...state, goal];
    await _save();
  }

  Future<void> remove(String id) async {
    state = state.where((g) => g.id != id).toList();
    await _save();
  }

  /// Upsert: replaces existing goal matching by exerciseDefinitionId (when
  /// non-empty) or by normalized label (for professional custom exercises).
  Future<void> upsertForExercise(TrainingGoal goal) async {
    final defId = goal.exerciseDefinitionId;
    final nameKey = goal.label.trim().toLowerCase();
    final existing = (defId != null && defId.isNotEmpty)
        ? state.indexWhere((g) =>
            g.type == GoalType.strength &&
            g.exerciseDefinitionId == defId)
        : state.indexWhere((g) =>
            g.type == GoalType.strength &&
            (g.exerciseDefinitionId == null || g.exerciseDefinitionId!.isEmpty) &&
            g.label.trim().toLowerCase() == nameKey);
    if (existing >= 0) {
      final updated = [...state];
      updated[existing] = goal;
      state = updated;
    } else {
      state = [...state, goal];
    }
    await _save();
  }

  /// Injects current bests from analytics.
  /// All strength goals are looked up by normalized label (exercise name),
  /// which works for both catalog exercises and custom professional exercises.
  void updateProgress({
    required Map<String, double> bestWeightByName,  // normalizedName → best kg
    required Map<String, double> bestDistanceByName,
    required Map<String, int> bestPaceByName,
  }) {
    state = state.map((g) {
      switch (g.type) {
        case GoalType.strength:
          final best = bestWeightByName[g.label.trim().toLowerCase()];
          return best != null ? g.copyWithBest(weight: best) : g;
        case GoalType.cardioDistance:
          final best = bestDistanceByName[g.label.trim().toLowerCase()];
          return best != null ? g.copyWithBest(distance: best) : g;
        case GoalType.cardioPace:
          final best = bestPaceByName[g.label.trim().toLowerCase()];
          return best != null ? g.copyWithBest(pace: best) : g;
      }
    }).toList();
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

final trainingGoalsProvider =
    StateNotifierProvider<TrainingGoalsNotifier, List<TrainingGoal>>(
  (_) => TrainingGoalsNotifier(),
);
