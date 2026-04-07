// lib/features/nutrition/data/nutrition_service.dart
import '../../../core/network/dio_client.dart';
import '../domain/nutrition_models.dart';

class NutritionService {
  NutritionService._();
  static final NutritionService instance = NutritionService._();

  final _dio = DioClient.instance.dio;

  // ─── Food Entries ────────────────────────────────────────────────────────────

  Future<List<FoodEntry>> listFoodEntries(String userId, DateTime date) async {
    final dateStr = _dateStr(date);
    final res = await _dio.get(
      '/nutrition/$userId/food',
      queryParameters: {'date': dateStr},
    );
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(FoodEntry.fromJson).toList();
  }

  Future<FoodEntry> addFoodEntry(String userId, FoodEntry entry) async {
    final res = await _dio.post(
      '/nutrition/$userId/food',
      data: entry.toJson(),
    );
    return FoodEntry.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> deleteFoodEntry(String userId, String entryId) async {
    await _dio.delete('/nutrition/$userId/food/$entryId');
  }

  // ─── Water ───────────────────────────────────────────────────────────────────

  Future<List<WaterEntry>> listWaterEntries(String userId, DateTime date) async {
    final dateStr = _dateStr(date);
    final res = await _dio.get(
      '/nutrition/$userId/water',
      queryParameters: {'date': dateStr},
    );
    final data = res.data['data'] as List? ?? [];
    return data.whereType<Map<String, dynamic>>().map(WaterEntry.fromJson).toList();
  }

  Future<WaterEntry> addWater(String userId, int amount) async {
    final res = await _dio.post('/nutrition/$userId/water', data: {
      'amount': amount,
      'date': DateTime.now().toIso8601String(),
    });
    return WaterEntry.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> deleteWaterEntry(String userId, String entryId) async {
    await _dio.delete('/nutrition/$userId/water/$entryId');
  }

  // ─── Goals ───────────────────────────────────────────────────────────────────

  Future<NutritionGoals> getGoals(String userId) async {
    try {
      final res = await _dio.get('/nutrition/$userId/goals');
      return NutritionGoals.fromJson(res.data['data'] as Map<String, dynamic>);
    } catch (_) {
      return const NutritionGoals();
    }
  }

  Future<void> updateGoals(String userId, NutritionGoals goals) async {
    await _dio.put('/nutrition/$userId/goals', data: {
      'calories': goals.calories,
      'protein': goals.protein,
      'carbs': goals.carbs,
      'fat': goals.fat,
      'water': goals.water,
    });
  }

  // ─── Predefined Foods ────────────────────────────────────────────────────────

  Future<List<TacoFood>> searchFoods(String query) async {
    if (query.trim().isEmpty) return [];
    try {
      final res = await _dio.get(
        '/nutrition/foods',
        queryParameters: {'search': query},
      );
      final data = res.data['data'] as List? ?? [];
      return data
          .whereType<Map<String, dynamic>>()
          .map(TacoFood.fromJson)
          .toList();
    } catch (_) {
      return [];
    }
  }

  // ─── Dieta Base ──────────────────────────────────────────────────────────────

  Future<List<DietPlanItem>> listDietPlan(String userId) async {
    try {
      final res = await _dio.get('/nutrition/$userId/diet-plan');
      final data = res.data['data'] as List? ?? [];
      return data.whereType<Map<String, dynamic>>().map(DietPlanItem.fromJson).toList();
    } catch (_) {
      return [];
    }
  }

  Future<DietPlanItem> addDietPlanItem(String userId, DietPlanItem item) async {
    final res = await _dio.post('/nutrition/$userId/diet-plan', data: item.toJson());
    return DietPlanItem.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> deleteDietPlanItem(String userId, String itemId) async {
    await _dio.delete('/nutrition/$userId/diet-plan/$itemId');
  }

  Future<FoodEntry> consumeDietPlanItem(String userId, String itemId, DateTime date) async {
    final res = await _dio.post(
      '/nutrition/$userId/diet-plan/$itemId/consume',
      data: {'date': _dateStr(date)},
    );
    return FoodEntry.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> unconsumeDietPlanItem(String userId, String itemId, DateTime date) async {
    await _dio.post(
      '/nutrition/$userId/diet-plan/$itemId/unconsume',
      data: {'date': _dateStr(date)},
    );
  }

  String _dateStr(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
