// lib/features/onboarding/data/professional_updates_service.dart
import '../../../core/network/dio_client.dart';
import '../domain/professional_update.dart';

class ProfessionalUpdatesService {
  ProfessionalUpdatesService._();
  static final instance = ProfessionalUpdatesService._();

  final _dio = DioClient.instance.dio;

  Future<List<ProfessionalUpdate>> getStudentUpdates() async {
    final res = await _dio.get('/professional/student/updates');
    final list = (res.data is Map ? res.data['data'] ?? [] : res.data) as List<dynamic>;
    return list.map((e) => ProfessionalUpdate.fromJson(e as Map<String, dynamic>)).toList();
  }
}
