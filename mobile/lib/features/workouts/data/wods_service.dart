// lib/features/workouts/data/wods_service.dart
import '../../../core/network/dio_client.dart';
import '../domain/workout_models.dart';

class SharedWod {
  final String id;
  final String code;
  final String format;       // amrap | forTime | emom | tabata
  final int? timeCap;        // minutos
  final int? rounds;
  final String? description;
  final List<WodMovement> movements;
  final String? groupId;
  final String createdBy;
  final String? creatorName;
  final String? creatorPhoto;
  final DateTime createdAt;

  const SharedWod({
    required this.id,
    required this.code,
    required this.format,
    this.timeCap,
    this.rounds,
    this.description,
    this.movements = const [],
    this.groupId,
    required this.createdBy,
    this.creatorName,
    this.creatorPhoto,
    required this.createdAt,
  });

  factory SharedWod.fromJson(Map<String, dynamic> j) => SharedWod(
        id: j['id'] as String,
        code: j['code'] as String,
        format: j['format'] as String,
        timeCap: j['timeCap'] as int?,
        rounds: j['rounds'] as int?,
        description: j['description'] as String?,
        movements: (j['movements'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(WodMovement.fromJson)
            .toList(),
        groupId: j['groupId'] as String?,
        createdBy: j['createdBy'] as String,
        creatorName: (j['creator'] as Map<String, dynamic>?)?['displayName'] as String?,
        creatorPhoto: (j['creator'] as Map<String, dynamic>?)?['photoURL'] as String?,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );
}

class WodsService {
  WodsService._();
  static final WodsService instance = WodsService._();

  final _dio = DioClient.instance.dio;

  /// Cria um WOD e retorna o objeto com o código gerado.
  Future<SharedWod> create({
    required String format,
    int? timeCap,
    int? rounds,
    String? description,
    List<WodMovement> movements = const [],
    String? groupId,
  }) async {
    final res = await _dio.post('/wods', data: {
      'format': format,
      if (timeCap != null) 'timeCap': timeCap,
      if (rounds != null) 'rounds': rounds,
      if (description != null && description.isNotEmpty) 'description': description,
      if (movements.isNotEmpty) 'movements': movements.map((m) => m.toJson()).toList(),
      if (groupId != null) 'groupId': groupId,
    });
    return SharedWod.fromJson(res.data['wod'] as Map<String, dynamic>);
  }

  /// Busca um WOD pelo código (sem autenticação necessária no backend).
  Future<SharedWod?> findByCode(String code) async {
    try {
      final res = await _dio.get('/wods/code/$code');
      return SharedWod.fromJson(res.data['wod'] as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  /// Lista os WODs publicados em um grupo.
  Future<List<SharedWod>> listByGroup(String groupId) async {
    final res = await _dio.get('/social/groups/$groupId/wods');
    final data = res.data['wods'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(SharedWod.fromJson).toList();
  }

  /// Lista os WODs criados pelo usuário autenticado.
  Future<List<SharedWod>> listMine() async {
    final res = await _dio.get('/wods/mine');
    final data = res.data['wods'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(SharedWod.fromJson).toList();
  }

  /// Publica um WOD existente num grupo.
  Future<void> publishToGroup(String wodId, String groupId) async {
    await _dio.patch('/wods/$wodId/publish', data: {'groupId': groupId});
  }
}
