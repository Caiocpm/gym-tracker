// lib/features/nutrition/data/weight_service.dart
import '../../../core/network/dio_client.dart';
import '../domain/nutrition_models.dart';

class WeightService {
  static final WeightService instance = WeightService._();
  WeightService._();

  final _dio = DioClient.instance.dio;

  Future<List<WeightEntry>> listEntries(String userId) async {
    final res = await _dio.get('/weight/$userId/entries');
    return (res.data['data'] as List)
        .whereType<Map<String, dynamic>>()
        .map(WeightEntry.fromJson)
        .toList();
  }

  Future<WeightEntry> upsert(String userId, double weight, String date, {String? note}) async {
    final res = await _dio.post('/weight/$userId/entries',
        data: {'weight': weight, 'date': date, if (note != null) 'note': note});
    return WeightEntry.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> delete(String userId, String entryId) async {
    await _dio.delete('/weight/$userId/entries/$entryId');
  }

  Future<NutritionStats> getNutritionStats(String userId) async {
    final res = await _dio.get('/weight/$userId/nutrition-stats');
    return NutritionStats.fromJson(res.data['data'] as Map<String, dynamic>);
  }
}
