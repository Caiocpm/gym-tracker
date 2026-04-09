// lib/features/social/domain/social_models.dart

// ─── Workout Metadata (embedded in Post.records) ──────────────────────────────

class PostExercise {
  final String name;
  final int setsCount;
  final double totalVolume;
  final bool isCardio;
  final String? cardioSubtype;
  // Distância — corrida, ciclismo, generico
  final double totalDistanceKm;
  // Duração — todos os cardio
  final int totalDurationSeconds;
  // Natação
  final int? totalLaps;
  final int? poolLengthM;
  final String? swimStyle;
  // Corrida / trilha
  final int? elevationGainM;
  final String? runType;
  // Escada
  final int? floorsClimbed;
  // Funcional
  final int? totalRepsCount;
  // Bicicleta ergométrica / spinning
  final int? cadenceRpm;
  final double? inclinePercent;
  // Remo
  final int? strokesPerMin;
  // Outros
  final String? intensity;
  final double? avgRpe;

  const PostExercise({
    required this.name,
    required this.setsCount,
    required this.totalVolume,
    this.isCardio = false,
    this.cardioSubtype,
    this.totalDistanceKm = 0,
    this.totalDurationSeconds = 0,
    this.totalLaps,
    this.poolLengthM,
    this.swimStyle,
    this.elevationGainM,
    this.runType,
    this.floorsClimbed,
    this.totalRepsCount,
    this.cadenceRpm,
    this.inclinePercent,
    this.strokesPerMin,
    this.intensity,
    this.avgRpe,
  });

  factory PostExercise.fromJson(Map<String, dynamic> json) {
    final sets = json['sets'] as List? ?? [];
    final isCardio = json['exerciseType'] == 'cardio';
    return PostExercise(
      name: json['name'] as String? ?? '',
      setsCount: sets.length,
      totalVolume: (json['totalVolume'] as num?)?.toDouble() ?? 0,
      isCardio: isCardio,
      cardioSubtype: json['cardioSubtype'] as String?,
      totalDistanceKm: (json['totalDistance'] as num?)?.toDouble() ?? 0,
      totalDurationSeconds: (json['totalDuration'] as num?)?.toInt() ?? 0,
      totalLaps: (json['totalLaps'] as num?)?.toInt(),
      poolLengthM: (json['poolLengthM'] as num?)?.toInt(),
      swimStyle: json['swimStyle'] as String?,
      elevationGainM: (json['elevationGainM'] as num?)?.toInt(),
      runType: json['runType'] as String?,
      floorsClimbed: (json['floorsClimbed'] as num?)?.toInt(),
      totalRepsCount: (json['repsCount'] as num?)?.toInt(),
      cadenceRpm: (json['cadenceRpm'] as num?)?.toInt(),
      inclinePercent: (json['inclinePercent'] as num?)?.toDouble(),
      strokesPerMin: (json['strokesPerMin'] as num?)?.toInt(),
      intensity: json['intensity'] as String?,
      avgRpe: (json['avgRpe'] as num?)?.toDouble(),
    );
  }

  bool get isSwimming       => cardioSubtype == 'natacao';
  bool get isRunning        => cardioSubtype == 'corrida';
  bool get isWalking        => cardioSubtype == 'caminhada';
  bool get isCyclingOutdoor => cardioSubtype == 'ciclismo';
  bool get isCyclingIndoor  => cardioSubtype == 'bicicleta_ergometrica';
  bool get isCycling        => isCyclingOutdoor || isCyclingIndoor;
  bool get isRowing         => cardioSubtype == 'remo';
  bool get isStairs         => cardioSubtype == 'escada';
  bool get isFunctional     => cardioSubtype == 'funcional';

  /// Pace /km — corrida e generico com distância
  String get paceFormatted {
    if (totalDistanceKm <= 0 || totalDurationSeconds <= 0) return '';
    final secsPerKm = (totalDurationSeconds / totalDistanceKm).round();
    final m = secsPerKm ~/ 60;
    final s = secsPerKm % 60;
    return '$m\'${s.toString().padLeft(2, '0')}"';
  }

  /// Velocidade km/h — ciclismo
  String get speedKmhFormatted {
    if (totalDistanceKm <= 0 || totalDurationSeconds <= 0) return '';
    final kmh = totalDistanceKm / (totalDurationSeconds / 3600);
    return '${kmh.toStringAsFixed(1)} km/h';
  }

  /// Pace /100m — natação
  String get swimPaceFormatted {
    final laps = totalLaps ?? 0;
    final pool = poolLengthM ?? 0;
    if (laps <= 0 || pool <= 0 || totalDurationSeconds <= 0) return '';
    final totalMeters = laps * pool;
    final secsPerHundred = (totalDurationSeconds * 100 / totalMeters).round();
    final m = secsPerHundred ~/ 60;
    final s = secsPerHundred % 60;
    return '$m\'${s.toString().padLeft(2, '0')}"/100m';
  }

  /// Distância total em metros ou km — natação
  String get swimDistanceFormatted {
    final laps = totalLaps ?? 0;
    final pool = poolLengthM ?? 0;
    if (laps <= 0 || pool <= 0) return '';
    final meters = laps * pool;
    if (meters >= 1000) return '${(meters / 1000).toStringAsFixed(2)} km';
    return '$meters m';
  }

  String get durationFormatted {
    if (totalDurationSeconds <= 0) return '';
    final h = totalDurationSeconds ~/ 3600;
    final m = (totalDurationSeconds % 3600) ~/ 60;
    final s = totalDurationSeconds % 60;
    if (h > 0) return '${h}h ${m}min';
    if (m > 0) return '${m}min${s > 0 ? ' ${s}s' : ''}';
    return '${s}s';
  }

  String get distanceFormatted {
    if (totalDistanceKm <= 0) return '';
    return '${totalDistanceKm.toStringAsFixed(2)} km';
  }

  String get swimStyleLabel => switch (swimStyle) {
    'livre'      => 'Livre',
    'costas'     => 'Costas',
    'peito'      => 'Peito',
    'borboleta'  => 'Borboleta',
    'medley'     => 'Medley',
    _            => '',
  };

  /// Linha compacta de métricas para exibição no post
  String get metricsLine {
    if (!isCardio) return '';
    final parts = <String>[];
    if (durationFormatted.isNotEmpty) parts.add(durationFormatted);

    if (isSwimming) {
      if (swimDistanceFormatted.isNotEmpty) parts.add(swimDistanceFormatted);
      if (swimPaceFormatted.isNotEmpty) parts.add(swimPaceFormatted);
    } else if (isCycling) {
      if (distanceFormatted.isNotEmpty) parts.add(distanceFormatted);
      if (speedKmhFormatted.isNotEmpty) parts.add(speedKmhFormatted);
      if (cadenceRpm != null) parts.add('$cadenceRpm rpm');
      if (isCyclingOutdoor && (elevationGainM ?? 0) > 0) parts.add('+${elevationGainM}m');
    } else if (isRowing) {
      if (distanceFormatted.isNotEmpty) parts.add(distanceFormatted);
      final rowPace = _rowingPaceFormatted;
      if (rowPace.isNotEmpty) parts.add(rowPace);
      if (strokesPerMin != null) parts.add('$strokesPerMin spm');
    } else if (isStairs) {
      if ((floorsClimbed ?? 0) > 0) parts.add('$floorsClimbed andares');
      if ((inclinePercent ?? 0) > 0) parts.add('nível ${inclinePercent!.toStringAsFixed(0)}%');
    } else if (isFunctional) {
      if ((totalRepsCount ?? 0) > 0) parts.add('$totalRepsCount reps');
    } else {
      // corrida, caminhada, generico
      if (distanceFormatted.isNotEmpty) parts.add(distanceFormatted);
      if (paceFormatted.isNotEmpty) parts.add('${paceFormatted}/km');
      if ((elevationGainM ?? 0) > 0) parts.add('+${elevationGainM}m');
      if ((inclinePercent ?? 0) > 0) parts.add('${inclinePercent!.toStringAsFixed(0)}% incl.');
    }
    return parts.join(' · ');
  }

  String get _rowingPaceFormatted {
    if (totalDistanceKm <= 0 || totalDurationSeconds <= 0) return '';
    final secsP500 = (totalDurationSeconds * 500 / (totalDistanceKm * 1000)).round();
    final m = secsP500 ~/ 60;
    final s = secsP500 % 60;
    return '$m\'${s.toString().padLeft(2, '0')}"/500m';
  }
}

class WorkoutMeta {
  final String workoutName;
  final int durationSeconds;
  final double totalVolume;
  final int prCount;
  final int? bpm;
  final int? kcal;

  const WorkoutMeta({
    required this.workoutName,
    required this.durationSeconds,
    required this.totalVolume,
    required this.prCount,
    this.bpm,
    this.kcal,
  });

  factory WorkoutMeta.fromJson(Map<String, dynamic> json) => WorkoutMeta(
        workoutName: json['workoutName'] as String? ?? '',
        durationSeconds: (json['durationSeconds'] as num?)?.toInt() ?? 0,
        totalVolume: (json['totalVolume'] as num?)?.toDouble() ?? 0,
        prCount: (json['prCount'] as num?)?.toInt() ?? 0,
        bpm: (json['bpm'] as num?)?.toInt(),
        kcal: (json['kcal'] as num?)?.toInt(),
      );
}

class Group {
  final String id;
  final String name;
  final String? description;
  final String? coverPhoto;
  final bool isPrivate;
  final int membersCount;
  final int postsCount;
  final String createdBy;
  final bool isMember;

  const Group({
    required this.id,
    required this.name,
    this.description,
    this.coverPhoto,
    required this.isPrivate,
    required this.membersCount,
    required this.postsCount,
    required this.createdBy,
    this.isMember = false,
  });

  factory Group.fromJson(Map<String, dynamic> json) => Group(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        coverPhoto: json['coverPhoto'] as String?,
        isPrivate: json['isPrivate'] as bool? ?? false,
        membersCount: (json['membersCount'] as num?)?.toInt() ??
            (json['_count'] as Map?)?['members'] as int? ?? 0,
        postsCount: (json['postsCount'] as num?)?.toInt() ??
            (json['_count'] as Map?)?['posts'] as int? ?? 0,
        createdBy: json['createdBy'] as String? ?? '',
        isMember: json['isMember'] as bool? ?? false,
      );
}

class GroupMember {
  final String userId;
  final String? displayName;
  final String? photoURL;
  final String role;

  const GroupMember({
    required this.userId,
    this.displayName,
    this.photoURL,
    required this.role,
  });

  factory GroupMember.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return GroupMember(
      userId: json['userId'] as String? ?? user?['id'] as String? ?? '',
      displayName: user?['displayName'] as String?,
      photoURL: user?['photoURL'] as String?,
      role: json['role'] as String? ?? 'member',
    );
  }
}

class Post {
  final String id;
  final String? groupId;
  final String userId;
  final String? userDisplayName;
  final String? userPhotoURL;
  final String? content;
  final String? imageBase64;
  final List<String> imagesBase64;
  final WorkoutMeta? workoutMeta;
  final List<PostExercise> exercises;
  final int likesCount;
  final int commentsCount;
  final bool likedByMe;
  final DateTime createdAt;
  final List<PostComment> comments;
  final bool isPublic;

  const Post({
    required this.id,
    this.groupId,
    required this.userId,
    this.userDisplayName,
    this.userPhotoURL,
    this.content,
    this.imageBase64,
    this.imagesBase64 = const [],
    this.workoutMeta,
    this.exercises = const [],
    required this.likesCount,
    required this.commentsCount,
    required this.likedByMe,
    required this.createdAt,
    this.comments = const [],
    this.isPublic = false,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    final count = json['_count'] as Map<String, dynamic>?;
    final likes = json['likes'] as List?;
    final exercisesList = json['exercises'] as List? ?? [];
    return Post(
      id: json['id'] as String,
      groupId: json['groupId'] as String?,
      userId: json['userId'] as String? ?? user?['id'] as String? ?? '',
      userDisplayName: user?['displayName'] as String?,
      userPhotoURL: user?['photoURL'] as String?,
      content: json['content'] as String?,
      imageBase64: json['imageBase64'] as String?,
      imagesBase64: (json['imagesBase64'] as List?)
              ?.whereType<String>()
              .toList() ??
          [],
      workoutMeta: json['records'] is Map<String, dynamic>
          ? WorkoutMeta.fromJson(json['records'] as Map<String, dynamic>)
          : null,
      exercises: exercisesList
          .whereType<Map<String, dynamic>>()
          .map(PostExercise.fromJson)
          .toList(),
      likesCount: (json['likesCount'] as num?)?.toInt() ??
          (count?['likes'] as num?)?.toInt() ?? 0,
      commentsCount: (json['commentsCount'] as num?)?.toInt() ??
          (count?['comments'] as num?)?.toInt() ?? 0,
      likedByMe: (likes?.isNotEmpty ?? false),
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      isPublic: json['isPublic'] as bool? ?? false,
    );
  }

  Post copyWith({int? likesCount, bool? likedByMe}) => Post(
        id: id,
        groupId: groupId,
        userId: userId,
        userDisplayName: userDisplayName,
        userPhotoURL: userPhotoURL,
        content: content,
        imageBase64: imageBase64,
        imagesBase64: imagesBase64,
        workoutMeta: workoutMeta,
        exercises: exercises,
        likesCount: likesCount ?? this.likesCount,
        commentsCount: commentsCount,
        likedByMe: likedByMe ?? this.likedByMe,
        createdAt: createdAt,
        comments: comments,
        isPublic: isPublic,
      );
}

class PostComment {
  final String id;
  final String userId;
  final String? userDisplayName;
  final String content;
  final DateTime createdAt;

  const PostComment({
    required this.id,
    required this.userId,
    this.userDisplayName,
    required this.content,
    required this.createdAt,
  });

  factory PostComment.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return PostComment(
      id: json['id'] as String,
      userId: json['userId'] as String? ?? '',
      userDisplayName: user?['displayName'] as String?,
      content: json['content'] as String? ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

class GroupChallenge {
  final String id;
  final String groupId;
  final String title;
  final String? description;
  final String type;
  final double targetValue;
  final String unit;
  final bool isCompetitive;
  final String? reward;
  final DateTime startDate;
  final DateTime endDate;
  final List<ChallengeParticipant> participants;
  final bool isJoined;
  // filter: muscle group name for muscle_group_volume, cardio subtype for cardio_distance
  final String? exerciseName;

  const GroupChallenge({
    required this.id,
    required this.groupId,
    required this.title,
    this.description,
    required this.type,
    required this.targetValue,
    required this.unit,
    required this.isCompetitive,
    this.reward,
    required this.startDate,
    required this.endDate,
    this.participants = const [],
    this.isJoined = false,
    this.exerciseName,
  });

  factory GroupChallenge.fromJson(Map<String, dynamic> json) {
    final parts = json['participants'] as List? ?? [];
    return GroupChallenge(
      id: json['id'] as String,
      groupId: json['groupId'] as String? ?? '',
      title: json['title'] as String,
      description: json['description'] as String?,
      type: json['type'] as String? ?? 'volume',
      targetValue: (json['targetValue'] as num?)?.toDouble() ?? 0,
      // backend returns 'unit' (mapped from targetUnit) or 'targetUnit' directly
      unit: json['unit'] as String? ?? json['targetUnit'] as String? ?? '',
      isCompetitive: json['isCompetitive'] as bool? ?? false,
      reward: json['reward'] as String?,
      startDate:
          DateTime.tryParse(json['startDate'] as String? ?? '') ?? DateTime.now(),
      endDate:
          DateTime.tryParse(json['endDate'] as String? ?? '') ?? DateTime.now(),
      participants: parts
          .whereType<Map<String, dynamic>>()
          .map(ChallengeParticipant.fromJson)
          .toList(),
      isJoined: json['isJoined'] as bool? ?? false,
      exerciseName: json['exerciseName'] as String?,
    );
  }

  bool get isActive => DateTime.now().isBefore(endDate);

  // Auto-progress types don't allow manual updates
  bool get isAutoProgress =>
      type == 'muscle_group_volume' ||
      type == 'cardio_distance' ||
      type == 'workout_proof';
}

class ChallengeParticipant {
  final String userId;
  final String? displayName;
  final double currentValue;
  final bool isCompleted;

  const ChallengeParticipant({
    required this.userId,
    this.displayName,
    required this.currentValue,
    required this.isCompleted,
  });

  factory ChallengeParticipant.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return ChallengeParticipant(
      userId: json['userId'] as String? ?? '',
      displayName: user?['displayName'] as String?,
      // backend stores as 'progress'; support legacy 'currentValue' too
      currentValue: (json['progress'] as num?)?.toDouble() ??
          (json['currentValue'] as num?)?.toDouble() ?? 0,
      isCompleted: json['completedAt'] != null,
    );
  }
}

// ─── Public User Profile ──────────────────────────────────────────────────────

class PublicBadge {
  final String icon;
  final String name;
  final String rarity;

  const PublicBadge({required this.icon, required this.name, required this.rarity});

  factory PublicBadge.fromJson(Map<String, dynamic> json) => PublicBadge(
        icon:   json['badgeIcon']   as String? ?? '🏅',
        name:   json['badgeName']   as String? ?? '',
        rarity: json['badgeRarity'] as String? ?? 'common',
      );
}

class PublicGroupRef {
  final String id;
  final String name;
  final String? coverPhoto;

  const PublicGroupRef({required this.id, required this.name, this.coverPhoto});

  factory PublicGroupRef.fromJson(Map<String, dynamic> json) {
    final g = json['group'] as Map<String, dynamic>? ?? json;
    return PublicGroupRef(
      id:         g['id']         as String? ?? '',
      name:       g['name']       as String? ?? '',
      coverPhoto: g['coverPhoto'] as String?,
    );
  }
}

class PublicStrongestLift {
  final String exerciseName;
  final double weight;
  const PublicStrongestLift({required this.exerciseName, required this.weight});
  factory PublicStrongestLift.fromJson(Map<String, dynamic> json) => PublicStrongestLift(
        exerciseName: json['exerciseName'] as String? ?? '',
        weight: (json['weight'] as num?)?.toDouble() ?? 0,
      );
}

class PublicUserProfile {
  final String id;
  final String? displayName;
  final String? photoURL;
  final bool isPrivate;
  final bool isFollowing;
  final int followersCount;
  final int followingCount;
  // Stats — null when isPrivate=true
  final int? totalWorkouts;
  final int? totalSets;
  final double? totalVolumeLifted;
  final int? totalWorkoutTime;
  final int? currentStreak;
  final int? longestStreak;
  final int? totalPersonalRecords;
  final int? totalGroups;
  final int? totalChallengesCompleted;
  final int? totalBadges;
  final String? memberSince;
  final PublicStrongestLift? strongestLift;
  final List<PublicBadge> badges;
  final List<PublicGroupRef> groups;

  const PublicUserProfile({
    required this.id,
    this.displayName,
    this.photoURL,
    required this.isPrivate,
    this.isFollowing = false,
    this.followersCount = 0,
    this.followingCount = 0,
    this.totalWorkouts,
    this.totalSets,
    this.totalVolumeLifted,
    this.totalWorkoutTime,
    this.currentStreak,
    this.longestStreak,
    this.totalPersonalRecords,
    this.totalGroups,
    this.totalChallengesCompleted,
    this.totalBadges,
    this.memberSince,
    this.strongestLift,
    this.badges = const [],
    this.groups = const [],
  });

  factory PublicUserProfile.fromJson(Map<String, dynamic> json) {
    final sl = json['strongestLift'];
    return PublicUserProfile(
      id:          json['id']          as String? ?? '',
      displayName: json['displayName'] as String?,
      photoURL:    json['photoURL']    as String?,
      isPrivate:      json['isPrivate']      as bool? ?? false,
      isFollowing:    json['isFollowing']    as bool? ?? false,
      followersCount: (json['followersCount'] as num?)?.toInt() ?? 0,
      followingCount: (json['followingCount'] as num?)?.toInt() ?? 0,
      totalWorkouts:          (json['totalWorkouts']          as num?)?.toInt(),
      totalSets:              (json['totalSets']              as num?)?.toInt(),
      totalVolumeLifted:      (json['totalVolumeLifted']      as num?)?.toDouble(),
      totalWorkoutTime:       (json['totalWorkoutTime']       as num?)?.toInt(),
      currentStreak:          (json['currentStreak']          as num?)?.toInt(),
      longestStreak:          (json['longestStreak']          as num?)?.toInt(),
      totalPersonalRecords:   (json['totalPersonalRecords']   as num?)?.toInt(),
      totalGroups:            (json['totalGroups']            as num?)?.toInt(),
      totalChallengesCompleted: (json['totalChallengesCompleted'] as num?)?.toInt(),
      totalBadges:            (json['totalBadges']            as num?)?.toInt(),
      memberSince:            json['memberSince']             as String?,
      strongestLift: sl is Map<String, dynamic> ? PublicStrongestLift.fromJson(sl) : null,
      badges: (json['badges'] as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(PublicBadge.fromJson)
          .toList(),
      groups: (json['groupMemberships'] as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(PublicGroupRef.fromJson)
          .toList(),
    );
  }

  PublicUserProfile copyWith({bool? isFollowing}) => PublicUserProfile(
        id: id,
        displayName: displayName,
        photoURL: photoURL,
        isPrivate: isPrivate,
        isFollowing: isFollowing ?? this.isFollowing,
        followersCount: followersCount,
        followingCount: followingCount,
        totalWorkouts: totalWorkouts,
        totalSets: totalSets,
        totalVolumeLifted: totalVolumeLifted,
        totalWorkoutTime: totalWorkoutTime,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        totalPersonalRecords: totalPersonalRecords,
        totalGroups: totalGroups,
        totalChallengesCompleted: totalChallengesCompleted,
        totalBadges: totalBadges,
        memberSince: memberSince,
        strongestLift: strongestLift,
        badges: badges,
        groups: groups,
      );

  String get totalVolumeFormatted {
    final v = totalVolumeLifted ?? 0;
    if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M kg';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}k kg';
    return '${v.toInt()} kg';
  }

  String get totalTimeFormatted {
    final t = totalWorkoutTime ?? 0;
    final h = t ~/ 3600;
    final m = (t % 3600) ~/ 60;
    if (h == 0) return '${m}min';
    return '${h}h ${m}min';
  }
}
