// lib/features/workouts/domain/workout_models.dart

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Normaliza o nome de grupo muscular: capitaliza a primeira letra, resto minúsculo.
/// "peito" → "Peito", "COSTAS" → "Costas", null → null
String? normalizeMuscleGroup(String? raw) {
  if (raw == null || raw.isEmpty) return raw;
  return raw[0].toUpperCase() + raw.substring(1).toLowerCase();
}

// ─── Tipo de exercício ─────────────────────────────────────────────────────────

enum ExerciseType { forca, cardio }

enum CardioSubtype { corrida, ciclismo, natacao, generico, caminhada, bicicletaErgometrica, remo, escada, funcional }

enum RunType { rua, esteira, trilha }

enum CardioIntensity { leve, moderada, intensa }

enum SwimStyle { livre, costas, peito, borboleta, medley }

enum WodFormat { amrap, forTime, emom, tabata }

// ─── WodMovement ──────────────────────────────────────────────────────────────

class WodMovement {
  final String name;
  final int? targetReps;
  final double? targetWeight; // kg, opcional
  final int? actualReps;
  final double? actualWeight;

  const WodMovement({
    required this.name,
    this.targetReps,
    this.targetWeight,
    this.actualReps,
    this.actualWeight,
  });

  WodMovement copyWith({
    String? name,
    int? targetReps,
    double? targetWeight,
    int? actualReps,
    double? actualWeight,
    bool clearWeight = false,
  }) =>
      WodMovement(
        name: name ?? this.name,
        targetReps: targetReps ?? this.targetReps,
        targetWeight: clearWeight ? null : (targetWeight ?? this.targetWeight),
        actualReps: actualReps ?? this.actualReps,
        actualWeight: actualWeight ?? this.actualWeight,
      );

  factory WodMovement.fromJson(Map<String, dynamic> j) => WodMovement(
        name: j['name'] as String? ?? '',
        targetReps: (j['targetReps'] as num?)?.toInt(),
        targetWeight: (j['targetWeight'] as num?)?.toDouble(),
        actualReps: (j['actualReps'] as num?)?.toInt(),
        actualWeight: (j['actualWeight'] as num?)?.toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        if (targetReps != null) 'targetReps': targetReps,
        if (targetWeight != null) 'targetWeight': targetWeight,
        if (actualReps != null) 'actualReps': actualReps,
        if (actualWeight != null) 'actualWeight': actualWeight,
      };
}

// ─── PlannedExercise ──────────────────────────────────────────────────────────

class PlannedExercise {
  final String id;
  final String exerciseDefinitionId;
  final String exerciseName;
  final String? muscleGroup;
  final ExerciseType exerciseType;
  final String? cardioSubtype;

  // Campos de força
  final int sets;
  final int reps;
  final double weight;
  final int restTime; // segundos

  // Campos de cardio (todos opcionais — preenchidos conforme subtype)
  final int? plannedDurationMinutes;
  final double? plannedDistanceKm;
  final CardioIntensity? intensity;
  final RunType? runType;
  final int? plannedPoolLengthM; // natação: 25 ou 50
  final SwimStyle? plannedSwimStyle; // natação: modalidade preferida

  // CrossFit
  final WodFormat? wodFormat;
  final String? wodDescription; // notas livres do WOD (opcional)
  final int? plannedRounds;    // For Time / EMOM: nº de rounds/minutos
  final List<WodMovement> wodMovements; // movimentos estruturados

  final String? notes;

  const PlannedExercise({
    required this.id,
    required this.exerciseDefinitionId,
    required this.exerciseName,
    this.muscleGroup,
    this.exerciseType = ExerciseType.forca,
    this.cardioSubtype,
    // força
    this.sets = 3,
    this.reps = 10,
    this.weight = 0,
    this.restTime = 60,
    // cardio
    this.plannedDurationMinutes,
    this.plannedDistanceKm,
    this.intensity,
    this.runType,
    this.plannedPoolLengthM,
    this.plannedSwimStyle,
    this.wodFormat,
    this.wodDescription,
    this.plannedRounds,
    this.wodMovements = const [],
    this.notes,
  });

  bool get isCardio => exerciseType == ExerciseType.cardio;
  bool get isRunning => cardioSubtype == 'corrida';
  bool get isSwimming => cardioSubtype == 'natacao';
  bool get isCrossFit => cardioSubtype == 'crossfit';

  factory PlannedExercise.fromJson(Map<String, dynamic> json) {
    final typeStr = json['exerciseType'] as String? ?? 'forca';
    final muscleGroup = json['muscleGroup'] as String?;
    // Compat: planned exercises added before exerciseType was properly set
    final isCardioByGroup = muscleGroup?.toLowerCase() == 'cardio';
    final effectiveType = (typeStr == 'forca' && isCardioByGroup) ? 'cardio' : typeStr;
    final type = effectiveType == 'cardio' ? ExerciseType.cardio : ExerciseType.forca;

    CardioIntensity? intensity;
    switch (json['intensity'] as String?) {
      case 'leve':     intensity = CardioIntensity.leve; break;
      case 'moderada': intensity = CardioIntensity.moderada; break;
      case 'intensa':  intensity = CardioIntensity.intensa; break;
    }

    RunType? runType;
    switch (json['runType'] as String?) {
      case 'rua':     runType = RunType.rua; break;
      case 'esteira': runType = RunType.esteira; break;
      case 'trilha':  runType = RunType.trilha; break;
    }

    return PlannedExercise(
      id: json['id'] as String? ?? '',
      exerciseDefinitionId: json['exerciseDefinitionId'] as String? ?? '',
      exerciseName: json['exerciseName'] as String? ?? '',
      muscleGroup: normalizeMuscleGroup(muscleGroup),
      exerciseType: type,
      cardioSubtype: json['cardioSubtype'] as String?,
      sets: (json['sets'] as num?)?.toInt() ?? 3,
      reps: (json['reps'] as num?)?.toInt() ?? 10,
      weight: (json['weight'] as num?)?.toDouble() ?? 0.0,
      restTime: (json['restTime'] as num?)?.toInt() ?? 60,
      plannedDurationMinutes: (json['plannedDurationMinutes'] as num?)?.toInt(),
      plannedDistanceKm: (json['plannedDistanceKm'] as num?)?.toDouble(),
      intensity: intensity,
      runType: runType,
      plannedPoolLengthM: (json['plannedPoolLengthM'] as num?)?.toInt(),
      wodFormat: switch (json['wodFormat'] as String?) {
        'amrap'   => WodFormat.amrap,
        'forTime' => WodFormat.forTime,
        'emom'    => WodFormat.emom,
        'tabata'  => WodFormat.tabata,
        _         => null,
      },
      wodDescription: json['wodDescription'] as String?,
      plannedRounds: (json['plannedRounds'] as num?)?.toInt(),
      wodMovements: (json['wodMovements'] as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(WodMovement.fromJson)
          .toList(),
      plannedSwimStyle: switch (json['plannedSwimStyle'] as String?) {
        'livre'     => SwimStyle.livre,
        'costas'    => SwimStyle.costas,
        'peito'     => SwimStyle.peito,
        'borboleta' => SwimStyle.borboleta,
        'medley'    => SwimStyle.medley,
        _           => null,
      },
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        if (exerciseDefinitionId.isNotEmpty) 'exerciseDefinitionId': exerciseDefinitionId,
        'exerciseName': exerciseName,
        if (muscleGroup != null) 'muscleGroup': muscleGroup,
        'exerciseType': exerciseType == ExerciseType.cardio ? 'cardio' : 'forca',
        if (cardioSubtype != null) 'cardioSubtype': cardioSubtype,
        'sets': sets,
        'reps': reps,
        'weight': weight,
        'restTime': restTime,
        if (plannedDurationMinutes != null) 'plannedDurationMinutes': plannedDurationMinutes,
        if (plannedDistanceKm != null) 'plannedDistanceKm': plannedDistanceKm,
        if (intensity != null) 'intensity': intensity!.name,
        if (runType != null) 'runType': runType!.name,
        if (plannedPoolLengthM != null) 'plannedPoolLengthM': plannedPoolLengthM,
        if (plannedSwimStyle != null) 'plannedSwimStyle': plannedSwimStyle!.name,
        if (wodFormat != null) 'wodFormat': wodFormat!.name,
        if (wodDescription != null) 'wodDescription': wodDescription,
        if (plannedRounds != null) 'plannedRounds': plannedRounds,
        if (wodMovements.isNotEmpty) 'wodMovements': wodMovements.map((m) => m.toJson()).toList(),
        if (notes != null) 'notes': notes,
      };
}

// ─── WorkoutDay ───────────────────────────────────────────────────────────────

class WorkoutDay {
  final String id;
  final String userId;
  final String name;
  final String dayType; // 'musculacao' | 'crossfit'
  final List<PlannedExercise> exercises;
  final DateTime createdAt;

  const WorkoutDay({
    required this.id,
    required this.userId,
    required this.name,
    this.dayType = 'musculacao',
    required this.exercises,
    required this.createdAt,
  });

  bool get isCrossFitDay => dayType == 'crossfit';

  factory WorkoutDay.fromJson(Map<String, dynamic> json) {
    final rawExercises = json['exercises'];
    List<PlannedExercise> exercises = [];
    if (rawExercises is List) {
      exercises = rawExercises
          .whereType<Map<String, dynamic>>()
          .map(PlannedExercise.fromJson)
          .toList();
    }
    return WorkoutDay(
      id: json['id'] as String,
      userId: json['userId'] as String? ?? '',
      name: json['name'] as String,
      dayType: json['dayType'] as String? ?? 'musculacao',
      exercises: exercises,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}

// ─── LoggedSet ────────────────────────────────────────────────────────────────

class LoggedSet {
  // Força
  final int reps;
  final double weight;
  final int? rpe;
  final bool isPersonalRecord;
  bool isCompleted;

  // Cardio (preenchidos ao concluir a atividade)
  final int? durationSeconds;    // duração real em segundos
  final double? distanceKm;      // distância percorrida
  final int? avgBpm;             // FC média
  final int? maxBpm;             // FC máxima
  final int? elevationGainM;     // ganho de elevação (corrida de trilha)
  final RunType? runType;
  final CardioIntensity? intensity;
  final int? lapsCount;          // natação: número de voltas
  final SwimStyle? swimStyle;    // natação: estilo
  final int? kcalBurned;        // calorias queimadas (smartwatch)
  final int? repsCount;          // funcional: burpee, polichinelo, pular corda, jump
  final int? floorsClimbed;      // escada: andares subidos
  final double? inclinePercent;  // bicicleta ergométrica / esteira: inclinação %
  final int? cadenceRpm;         // bicicleta ergométrica / spinning: RPM
  final int? strokesPerMin;      // remo ergométrico: paladas por minuto
  final int? completedRounds;    // crossfit: rounds completados
  final int? partialReps;        // crossfit AMRAP: reps parciais no último round
  final List<WodMovement> wodMovements; // crossfit: performance real por movimento

  LoggedSet({
    this.reps = 0,
    this.weight = 0,
    this.rpe,
    this.isPersonalRecord = false,
    this.isCompleted = false,
    this.durationSeconds,
    this.distanceKm,
    this.avgBpm,
    this.maxBpm,
    this.elevationGainM,
    this.runType,
    this.intensity,
    this.lapsCount,
    this.swimStyle,
    this.kcalBurned,
    this.repsCount,
    this.floorsClimbed,
    this.inclinePercent,
    this.cadenceRpm,
    this.strokesPerMin,
    this.completedRounds,
    this.partialReps,
    this.wodMovements = const [],
  });

  bool get isCardioSet => durationSeconds != null;

  /// Pace em segundos por km (corrida, caminhada, generico)
  int? get paceSecondsPerKm {
    if (durationSeconds == null || distanceKm == null || distanceKm! <= 0) {
      return null;
    }
    return (durationSeconds! / distanceKm!).round();
  }

  /// Pace formatado "mm:ss /km"
  String? get paceFormatted {
    final p = paceSecondsPerKm;
    if (p == null) return null;
    final m = p ~/ 60;
    final s = (p % 60).toString().padLeft(2, '0');
    return '$m:$s /km';
  }

  /// Velocidade km/h (ciclismo, bicicleta ergométrica)
  double? get speedKmh {
    if (durationSeconds == null || durationSeconds! <= 0 || distanceKm == null || distanceKm! <= 0) return null;
    return distanceKm! / (durationSeconds! / 3600);
  }

  /// Pace em segundos por 500m (remo ergométrico)
  int? get paceSeconds500m {
    if (durationSeconds == null || distanceKm == null || distanceKm! <= 0) return null;
    return (durationSeconds! * 500 / (distanceKm! * 1000)).round();
  }

  /// Pace formatado "mm:ss /500m"
  String? get paceFormatted500m {
    final p = paceSeconds500m;
    if (p == null) return null;
    final m = p ~/ 60;
    final s = (p % 60).toString().padLeft(2, '0');
    return '$m:$s /500m';
  }

  LoggedSet copyWith({
    int? reps,
    double? weight,
    int? rpe,
    bool? isCompleted,
    bool clearRpe = false,
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
    int? repsCount,
    int? floorsClimbed,
    double? inclinePercent,
    int? cadenceRpm,
    int? strokesPerMin,
    int? completedRounds,
    int? partialReps,
    List<WodMovement>? wodMovements,
  }) {
    return LoggedSet(
      reps: reps ?? this.reps,
      weight: weight ?? this.weight,
      rpe: clearRpe ? null : (rpe ?? this.rpe),
      isPersonalRecord: isPersonalRecord,
      isCompleted: isCompleted ?? this.isCompleted,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      distanceKm: distanceKm ?? this.distanceKm,
      avgBpm: avgBpm ?? this.avgBpm,
      maxBpm: maxBpm ?? this.maxBpm,
      elevationGainM: elevationGainM ?? this.elevationGainM,
      runType: runType ?? this.runType,
      intensity: intensity ?? this.intensity,
      lapsCount: lapsCount ?? this.lapsCount,
      swimStyle: swimStyle ?? this.swimStyle,
      kcalBurned: kcalBurned ?? this.kcalBurned,
      repsCount: repsCount ?? this.repsCount,
      floorsClimbed: floorsClimbed ?? this.floorsClimbed,
      inclinePercent: inclinePercent ?? this.inclinePercent,
      cadenceRpm: cadenceRpm ?? this.cadenceRpm,
      strokesPerMin: strokesPerMin ?? this.strokesPerMin,
      completedRounds: completedRounds ?? this.completedRounds,
      partialReps: partialReps ?? this.partialReps,
      wodMovements: wodMovements ?? this.wodMovements,
    );
  }

  Map<String, dynamic> toJson() => {
        'reps': reps,
        'weight': weight,
        'isPersonalRecord': isPersonalRecord,
        if (rpe != null) 'rpe': rpe,
        if (durationSeconds != null) 'durationSeconds': durationSeconds,
        if (distanceKm != null) 'distanceKm': distanceKm,
        if (avgBpm != null) 'avgBpm': avgBpm,
        if (maxBpm != null) 'maxBpm': maxBpm,
        if (elevationGainM != null) 'elevationGainM': elevationGainM,
        if (runType != null) 'runType': runType!.name,
        if (intensity != null) 'intensity': intensity!.name,
        if (lapsCount != null) 'lapsCount': lapsCount,
        if (swimStyle != null) 'swimStyle': swimStyle!.name,
        if (kcalBurned != null) 'kcalBurned': kcalBurned,
        if (repsCount != null) 'repsCount': repsCount,
        if (floorsClimbed != null) 'floorsClimbed': floorsClimbed,
        if (inclinePercent != null) 'inclinePercent': inclinePercent,
        if (cadenceRpm != null) 'cadenceRpm': cadenceRpm,
        if (strokesPerMin != null) 'strokesPerMin': strokesPerMin,
        if (completedRounds != null) 'completedRounds': completedRounds,
        if (partialReps != null) 'partialReps': partialReps,
        if (wodMovements.isNotEmpty) 'wodMovements': wodMovements.map((m) => m.toJson()).toList(),
      };
}

// ─── ActiveExercise ───────────────────────────────────────────────────────────

class ActiveExercise {
  /// ID único do PlannedExercise de origem — garante matching correto na
  /// tela do dia mesmo quando exerciseDefinitionId está vazio (exercícios
  /// criados por profissionais sem vínculo ao catálogo global).
  final String plannedExerciseId;
  final String exerciseDefinitionId;
  final String exerciseName;
  final String? muscleGroup;
  final List<LoggedSet> sets;
  final int restSeconds;
  final ExerciseType exerciseType;
  final String? cardioSubtype;

  // Planejado (cardio) — exibido como meta na tela de execução
  final int? plannedDurationMinutes;
  final double? plannedDistanceKm;
  final int? plannedPoolLengthM; // natação: 25 ou 50
  final SwimStyle? plannedSwimStyle; // natação: modalidade preferida

  // CrossFit
  final WodFormat? wodFormat;
  final String? wodDescription;
  final int? plannedRounds;
  final List<WodMovement> wodMovements;

  ActiveExercise({
    required this.plannedExerciseId,
    required this.exerciseDefinitionId,
    required this.exerciseName,
    this.muscleGroup,
    required this.sets,
    this.restSeconds = 60,
    this.exerciseType = ExerciseType.forca,
    this.cardioSubtype,
    this.plannedDurationMinutes,
    this.plannedDistanceKm,
    this.plannedPoolLengthM,
    this.plannedSwimStyle,
    this.wodFormat,
    this.wodDescription,
    this.plannedRounds,
    this.wodMovements = const [],
  });

  bool get isCardio          => exerciseType == ExerciseType.cardio;
  bool get isRunning         => cardioSubtype == 'corrida';
  bool get isWalking         => cardioSubtype == 'caminhada';
  bool get isSwimming        => cardioSubtype == 'natacao';
  bool get isCyclingOutdoor  => cardioSubtype == 'ciclismo';
  bool get isCyclingIndoor   => cardioSubtype == 'bicicleta_ergometrica';
  bool get isRowing          => cardioSubtype == 'remo';
  bool get isStairs          => cardioSubtype == 'escada';
  bool get isFunctional      => cardioSubtype == 'funcional';
  bool get isCrossFit        => cardioSubtype == 'crossfit';
  /// True para qualquer modalidade baseada em contador (voltas, andares, reps)
  bool get usesCounter       => isSwimming || isStairs || isFunctional;
  /// True para ciclismo indoor ou outdoor
  bool get isCycling         => isCyclingOutdoor || isCyclingIndoor;

  Map<String, dynamic> toJson() => {
        if (exerciseDefinitionId.isNotEmpty) 'exerciseDefinitionId': exerciseDefinitionId,
        'exerciseName': exerciseName,
        if (muscleGroup != null) 'muscleGroup': muscleGroup,
        'exerciseType': exerciseType == ExerciseType.cardio ? 'cardio' : 'forca',
        if (cardioSubtype != null) 'cardioSubtype': cardioSubtype,
        if (wodFormat != null) 'wodFormat': wodFormat!.name,
        if (wodDescription != null) 'wodDescription': wodDescription,
        if (plannedRounds != null) 'plannedRounds': plannedRounds,
        'sets': sets.map((s) => s.toJson()).toList(),
      };

  ActiveExercise copyWith({
    String? plannedExerciseId,
    String? exerciseDefinitionId,
    String? exerciseName,
    String? muscleGroup,
    List<LoggedSet>? sets,
    int? restSeconds,
    ExerciseType? exerciseType,
    String? cardioSubtype,
    int? plannedDurationMinutes,
    double? plannedDistanceKm,
    int? plannedPoolLengthM,
    SwimStyle? plannedSwimStyle,
    WodFormat? wodFormat,
    String? wodDescription,
    int? plannedRounds,
    List<WodMovement>? wodMovements,
  }) =>
      ActiveExercise(
        plannedExerciseId: plannedExerciseId ?? this.plannedExerciseId,
        exerciseDefinitionId: exerciseDefinitionId ?? this.exerciseDefinitionId,
        exerciseName: exerciseName ?? this.exerciseName,
        muscleGroup: muscleGroup ?? this.muscleGroup,
        sets: sets ?? this.sets,
        restSeconds: restSeconds ?? this.restSeconds,
        exerciseType: exerciseType ?? this.exerciseType,
        cardioSubtype: cardioSubtype ?? this.cardioSubtype,
        plannedDurationMinutes: plannedDurationMinutes ?? this.plannedDurationMinutes,
        plannedDistanceKm: plannedDistanceKm ?? this.plannedDistanceKm,
        plannedPoolLengthM: plannedPoolLengthM ?? this.plannedPoolLengthM,
        plannedSwimStyle: plannedSwimStyle ?? this.plannedSwimStyle,
        wodFormat: wodFormat ?? this.wodFormat,
        wodDescription: wodDescription ?? this.wodDescription,
        plannedRounds: plannedRounds ?? this.plannedRounds,
        wodMovements: wodMovements ?? this.wodMovements,
      );
}

// ─── ExerciseDefinition ───────────────────────────────────────────────────────

class ExerciseDefinition {
  final String id;
  final String name;
  final String? muscleGroup;
  final String? equipment;
  final String? createdBy;
  final ExerciseType exerciseType;
  final String? cardioSubtype;

  const ExerciseDefinition({
    required this.id,
    required this.name,
    this.muscleGroup,
    this.equipment,
    this.createdBy,
    this.exerciseType = ExerciseType.forca,
    this.cardioSubtype,
  });

  bool get isCardio         => exerciseType == ExerciseType.cardio;
  bool get isRunning        => cardioSubtype == 'corrida';
  bool get isWalking        => cardioSubtype == 'caminhada';
  bool get isCyclingOutdoor => cardioSubtype == 'ciclismo';
  bool get isCyclingIndoor  => cardioSubtype == 'bicicleta_ergometrica';
  bool get isCycling        => isCyclingOutdoor || isCyclingIndoor;
  bool get isSwimming       => cardioSubtype == 'natacao';
  bool get isRowing         => cardioSubtype == 'remo';
  bool get isStairs         => cardioSubtype == 'escada';
  bool get isFunctional     => cardioSubtype == 'funcional';
  bool get isCrossFit       => cardioSubtype == 'crossfit';

  factory ExerciseDefinition.fromJson(Map<String, dynamic> json) {
    final typeStr = json['exerciseType'] as String? ?? 'forca';
    final muscleGroup = json['primaryMuscleGroup'] as String? ?? json['muscleGroup'] as String?;
    // Compat: exercises seeded before the exerciseType column are identified
    // as cardio via their primaryMuscleGroup ('Cardio') when still tagged 'forca'.
    final isCardioByGroup = muscleGroup?.toLowerCase() == 'cardio';
    final effectiveType = (typeStr == 'forca' && isCardioByGroup) ? 'cardio' : typeStr;
    return ExerciseDefinition(
      id: json['id'] as String,
      name: json['name'] as String,
      muscleGroup: normalizeMuscleGroup(muscleGroup),
      equipment: json['equipment'] as String?,
      createdBy: json['createdBy'] as String?,
      exerciseType: effectiveType == 'cardio' ? ExerciseType.cardio : ExerciseType.forca,
      cardioSubtype: json['cardioSubtype'] as String?,
    );
  }
}

// ─── SessionSet / SessionExercise / WorkoutSession ────────────────────────────

class SessionSet {
  final int reps;
  final double weight;
  final int? rpe;
  final bool isPersonalRecord;
  // Cardio
  final int? durationSeconds;
  final double? distanceKm;
  final int? avgBpm;
  final int? maxBpm;
  final int? elevationGainM;
  final String? runType;
  final String? intensity;
  final int? lapsCount;
  final String? swimStyle;
  final int? kcalBurned;
  final int? repsCount;
  final int? floorsClimbed;
  final double? inclinePercent;
  final int? cadenceRpm;
  final int? strokesPerMin;
  final int? completedRounds;
  final int? partialReps;
  // CrossFit
  final List<WodMovement> wodMovements;

  const SessionSet({
    required this.reps,
    required this.weight,
    this.rpe,
    this.isPersonalRecord = false,
    this.durationSeconds,
    this.distanceKm,
    this.avgBpm,
    this.maxBpm,
    this.elevationGainM,
    this.runType,
    this.intensity,
    this.lapsCount,
    this.swimStyle,
    this.kcalBurned,
    this.repsCount,
    this.floorsClimbed,
    this.inclinePercent,
    this.cadenceRpm,
    this.strokesPerMin,
    this.completedRounds,
    this.partialReps,
    this.wodMovements = const [],
  });

  factory SessionSet.fromJson(Map<String, dynamic> json) => SessionSet(
        reps: (json['reps'] as num?)?.toInt() ?? 0,
        weight: (json['weight'] as num?)?.toDouble() ?? 0.0,
        rpe: (json['rpe'] as num?)?.toInt(),
        isPersonalRecord: json['isPersonalRecord'] as bool? ?? false,
        durationSeconds: (json['durationSeconds'] as num?)?.toInt(),
        distanceKm: (json['distanceKm'] as num?)?.toDouble(),
        avgBpm: (json['avgBpm'] as num?)?.toInt(),
        maxBpm: (json['maxBpm'] as num?)?.toInt(),
        elevationGainM: (json['elevationGainM'] as num?)?.toInt(),
        runType: json['runType'] as String?,
        intensity: json['intensity'] as String?,
        lapsCount: (json['lapsCount'] as num?)?.toInt(),
        swimStyle: json['swimStyle'] as String?,
        kcalBurned: (json['kcalBurned'] as num?)?.toInt(),
        repsCount: (json['repsCount'] as num?)?.toInt(),
        floorsClimbed: (json['floorsClimbed'] as num?)?.toInt(),
        inclinePercent: (json['inclinePercent'] as num?)?.toDouble(),
        cadenceRpm: (json['cadenceRpm'] as num?)?.toInt(),
        strokesPerMin: (json['strokesPerMin'] as num?)?.toInt(),
        completedRounds: (json['completedRounds'] as num?)?.toInt(),
        partialReps: (json['partialReps'] as num?)?.toInt(),
        wodMovements: (json['wodMovements'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(WodMovement.fromJson)
            .toList(),
      );

  bool get isCardioSet => durationSeconds != null;
  bool get isCrossFitSet => completedRounds != null || wodMovements.isNotEmpty;

  int? get paceSecondsPerKm {
    if (durationSeconds == null || distanceKm == null || distanceKm! <= 0) return null;
    return (durationSeconds! / distanceKm!).round();
  }

  int? get paceSeconds500m {
    if (durationSeconds == null || distanceKm == null || distanceKm! <= 0) return null;
    return (durationSeconds! * 500 / (distanceKm! * 1000)).round();
  }
}

class SessionExercise {
  final String exerciseDefinitionId;
  final String exerciseName;
  final String? muscleGroup;
  final String exerciseType;
  final String? cardioSubtype;
  final List<SessionSet> sets;
  // CrossFit
  final String? wodFormat;
  final String? wodDescription;
  final int? plannedRounds;

  const SessionExercise({
    required this.exerciseDefinitionId,
    required this.exerciseName,
    this.muscleGroup,
    this.exerciseType = 'forca',
    this.cardioSubtype,
    required this.sets,
    this.wodFormat,
    this.wodDescription,
    this.plannedRounds,
  });

  bool get isCardio        => exerciseType == 'cardio';
  bool get isRunning       => cardioSubtype == 'corrida';
  bool get isWalking       => cardioSubtype == 'caminhada';
  bool get isCyclingOutdoor=> cardioSubtype == 'ciclismo';
  bool get isCyclingIndoor => cardioSubtype == 'bicicleta_ergometrica';
  bool get isCycling       => isCyclingOutdoor || isCyclingIndoor;
  bool get isSwimming      => cardioSubtype == 'natacao';
  bool get isRowing        => cardioSubtype == 'remo';
  bool get isStairs        => cardioSubtype == 'escada';
  bool get isFunctional    => cardioSubtype == 'funcional';
  bool get isCrossFit      => cardioSubtype == 'crossfit';

  factory SessionExercise.fromJson(Map<String, dynamic> json) {
    final rawSets = json['sets'] as List? ?? [];
    return SessionExercise(
      exerciseDefinitionId: json['exerciseDefinitionId'] as String? ?? '',
      exerciseName: json['exerciseName'] as String? ?? '',
      muscleGroup: normalizeMuscleGroup(json['muscleGroup'] as String?),
      exerciseType: json['exerciseType'] as String? ?? 'forca',
      cardioSubtype: json['cardioSubtype'] as String?,
      sets: rawSets
          .whereType<Map<String, dynamic>>()
          .map(SessionSet.fromJson)
          .toList(),
      wodFormat: json['wodFormat'] as String?,
      wodDescription: json['wodDescription'] as String?,
      plannedRounds: (json['plannedRounds'] as num?)?.toInt(),
    );
  }

  // Força
  double get totalVolume =>
      sets.fold(0.0, (v, s) => v + s.weight * s.reps);

  double get bestOneRepMax {
    double best = 0;
    for (final s in sets) {
      if (s.reps > 0 && s.reps <= 36 && s.weight > 0) {
        final orm = s.weight * (36.0 / (37.0 - s.reps));
        if (orm > best) best = orm;
      } else if (s.weight > best) {
        best = s.weight;
      }
    }
    return best;
  }

  // Cardio
  int get totalDurationSeconds =>
      sets.fold(0, (t, s) => t + (s.durationSeconds ?? 0));

  double get totalDistanceKm =>
      sets.fold(0.0, (t, s) => t + (s.distanceKm ?? 0));

  int get totalKcalBurned =>
      sets.fold(0, (t, s) => t + (s.kcalBurned ?? 0));

  int get totalLapsCount =>
      sets.fold(0, (t, s) => t + (s.lapsCount ?? 0));

  int get totalRepsCount =>
      sets.fold(0, (t, s) => t + (s.repsCount ?? 0));

  int get totalFloorsClimbed =>
      sets.fold(0, (t, s) => t + (s.floorsClimbed ?? 0));

  int? get avgCadenceRpm {
    final vals = sets.map((s) => s.cadenceRpm).whereType<int>().toList();
    if (vals.isEmpty) return null;
    return (vals.fold(0, (a, b) => a + b) / vals.length).round();
  }

  int? get avgStrokesPerMin {
    final vals = sets.map((s) => s.strokesPerMin).whereType<int>().toList();
    if (vals.isEmpty) return null;
    return (vals.fold(0, (a, b) => a + b) / vals.length).round();
  }

  int? get avgBpm {
    final vals = sets.map((s) => s.avgBpm).whereType<int>().toList();
    if (vals.isEmpty) return null;
    return (vals.fold(0, (a, b) => a + b) / vals.length).round();
  }

  int? get maxBpm {
    final vals = sets.map((s) => s.maxBpm).whereType<int>().toList();
    if (vals.isEmpty) return null;
    return vals.reduce((a, b) => a > b ? a : b);
  }
}

class WorkoutSession {
  final String id;
  final String workoutName;
  final String? workoutDayId;
  final List<SessionExercise> exercises;
  final int durationSeconds;
  final int? sessionAvgBpm;
  final int? sessionKcal;
  final DateTime createdAt;
  final String? trainingMode; // 'forca' | 'resistencia' | null (legado)

  const WorkoutSession({
    required this.id,
    required this.workoutName,
    this.workoutDayId,
    required this.exercises,
    required this.durationSeconds,
    this.sessionAvgBpm,
    this.sessionKcal,
    required this.createdAt,
    this.trainingMode,
  });

  factory WorkoutSession.fromJson(Map<String, dynamic> json) {
    final rawEx = json['exercises'] as List? ?? [];
    return WorkoutSession(
      id: json['id'] as String? ?? '',
      workoutName: json['workoutName'] as String? ?? '',
      workoutDayId: json['workoutDayId'] as String?,
      exercises: rawEx
          .whereType<Map<String, dynamic>>()
          .map(SessionExercise.fromJson)
          .toList(),
      durationSeconds: (json['duration'] as num?)?.toInt() ?? 0,
      sessionAvgBpm: (json['sessionAvgBpm'] as num?)?.toInt(),
      sessionKcal: (json['sessionKcal'] as num?)?.toInt(),
      // Prefer 'date' (YYYY-MM-DD, set by the client at save time) over
      // 'createdAt' (server timestamp, may differ due to UTC offset or late save).
      createdAt: DateTime.tryParse(json['date'] as String? ?? '') ??
          (DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now()).toLocal(),
      trainingMode: json['trainingMode'] as String?,
    );
  }

  double get totalVolume =>
      exercises.where((e) => !e.isCardio).fold(0.0, (v, e) => v + e.totalVolume);

  double get totalDistanceKm =>
      exercises.where((e) => e.isCardio).fold(0.0, (v, e) => v + e.totalDistanceKm);

  int get totalCardioSeconds =>
      exercises.where((e) => e.isCardio).fold(0, (t, e) => t + e.totalDurationSeconds);

  /// Total de kcal: soma dos sets (cardio logger) + fallback para sessionKcal (smartwatch)
  int get totalKcalBurned {
    final fromSets = exercises.fold(0, (t, e) => t + e.totalKcalBurned);
    if (fromSets > 0) return fromSets;
    return sessionKcal ?? 0;
  }

  /// BPM médio: por exercício (cardio logger) ou sessionAvgBpm (smartwatch)
  int? get effectiveAvgBpm {
    final vals = exercises
        .map((e) => e.avgBpm)
        .whereType<int>()
        .toList();
    if (vals.isNotEmpty) {
      return (vals.fold(0, (a, b) => a + b) / vals.length).round();
    }
    return sessionAvgBpm;
  }

  int? get effectiveMaxBpm {
    final vals = exercises
        .map((e) => e.maxBpm)
        .whereType<int>()
        .toList();
    if (vals.isNotEmpty) return vals.reduce((a, b) => a > b ? a : b);
    return null;
  }
}
