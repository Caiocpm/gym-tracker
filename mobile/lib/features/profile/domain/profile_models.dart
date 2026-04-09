// lib/features/profile/domain/profile_models.dart
import 'package:flutter/material.dart';

class UserBadge {
  final String id;
  final String badgeName;
  final String badgeIcon;
  final String badgeCategory;
  final String badgeRarity;
  final DateTime earnedAt;
  final String? challengeTitle;

  const UserBadge({
    required this.id,
    required this.badgeName,
    required this.badgeIcon,
    required this.badgeCategory,
    required this.badgeRarity,
    required this.earnedAt,
    this.challengeTitle,
  });

  factory UserBadge.fromJson(Map<String, dynamic> json) => UserBadge(
        id: json['id'] as String,
        badgeName: json['badgeName'] as String? ?? '',
        badgeIcon: json['badgeIcon'] as String? ?? '🏅',
        badgeCategory: json['badgeCategory'] as String? ?? 'special',
        badgeRarity: json['badgeRarity'] as String? ?? 'common',
        earnedAt:
            DateTime.tryParse(json['earnedAt'] as String? ?? '') ?? DateTime.now(),
        challengeTitle: json['challengeTitle'] as String?,
      );

  Color get rarityColor => switch (badgeRarity) {
        // Challenge tiers
        'diamond' => const Color(0xFF00BFFF),
        'gold'    => const Color(0xFFFFD700),
        'silver'  => const Color(0xFFB0BEC5),
        'bronze'  => const Color(0xFFCD7F32),
        // Legacy tiers
        'legendary' => const Color(0xFFFFD700),
        'epic'      => const Color(0xFF9B59B6),
        'rare'      => const Color(0xFF3498DB),
        _           => const Color(0xFF95A5A6),
      };

  String get rarityLabel => switch (badgeRarity) {
        // Challenge tiers
        'diamond' => 'Diamante',
        'gold'    => 'Ouro',
        'silver'  => 'Prata',
        'bronze'  => 'Bronze',
        // Legacy tiers
        'legendary' => 'Lendário',
        'epic'      => 'Épico',
        'rare'      => 'Raro',
        _           => 'Comum',
      };
}

class UserStats {
  final int totalWorkouts;
  final int totalExercises;
  final int totalSets;
  final int totalReps;
  final double totalVolumeLifted;
  final int totalWorkoutTime;
  final int longestStreak;
  final int currentStreak;
  final int totalPersonalRecords;
  final int totalGroups;
  final int totalChallengesCompleted;
  final int totalBadges;
  final String? memberSince;
  final String? lastWorkout;
  final StrongestLift? strongestLift;

  const UserStats({
    this.totalWorkouts = 0,
    this.totalExercises = 0,
    this.totalSets = 0,
    this.totalReps = 0,
    this.totalVolumeLifted = 0,
    this.totalWorkoutTime = 0,
    this.longestStreak = 0,
    this.currentStreak = 0,
    this.totalPersonalRecords = 0,
    this.totalGroups = 0,
    this.totalChallengesCompleted = 0,
    this.totalBadges = 0,
    this.memberSince,
    this.lastWorkout,
    this.strongestLift,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    final sl = json['strongestLift'];
    return UserStats(
      totalWorkouts: (json['totalWorkouts'] as num?)?.toInt() ?? 0,
      totalExercises: (json['totalExercises'] as num?)?.toInt() ?? 0,
      totalSets: (json['totalSets'] as num?)?.toInt() ?? 0,
      totalReps: (json['totalReps'] as num?)?.toInt() ?? 0,
      totalVolumeLifted: (json['totalVolumeLifted'] as num?)?.toDouble() ?? 0,
      totalWorkoutTime: (json['totalWorkoutTime'] as num?)?.toInt() ?? 0,
      longestStreak: (json['longestStreak'] as num?)?.toInt() ?? 0,
      currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
      totalPersonalRecords:
          (json['totalPersonalRecords'] as num?)?.toInt() ?? 0,
      totalGroups: (json['totalGroups'] as num?)?.toInt() ?? 0,
      totalChallengesCompleted:
          (json['totalChallengesCompleted'] as num?)?.toInt() ?? 0,
      totalBadges: (json['totalBadges'] as num?)?.toInt() ?? 0,
      memberSince: json['memberSince'] as String?,
      lastWorkout: json['lastWorkout'] as String?,
      strongestLift:
          sl is Map<String, dynamic> ? StrongestLift.fromJson(sl) : null,
    );
  }

  String get totalVolumeFormatted {
    if (totalVolumeLifted >= 1000000) {
      return '${(totalVolumeLifted / 1000000).toStringAsFixed(1)}M kg';
    }
    if (totalVolumeLifted >= 1000) {
      return '${(totalVolumeLifted / 1000).toStringAsFixed(1)}k kg';
    }
    return '${totalVolumeLifted.toInt()} kg';
  }

  String get totalTimeFormatted {
    final h = totalWorkoutTime ~/ 3600;
    final m = (totalWorkoutTime % 3600) ~/ 60;
    if (h == 0) return '${m}min';
    return '${h}h ${m}min';
  }
}

class StrongestLift {
  final String exerciseName;
  final double weight;

  const StrongestLift({required this.exerciseName, required this.weight});

  factory StrongestLift.fromJson(Map<String, dynamic> json) => StrongestLift(
        exerciseName: json['exerciseName'] as String? ?? '',
        weight: (json['weight'] as num?)?.toDouble() ?? 0,
      );
}
