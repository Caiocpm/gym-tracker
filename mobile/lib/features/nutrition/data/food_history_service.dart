// lib/features/nutrition/data/food_history_service.dart
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/nutrition_models.dart';

class FoodHistoryService {
  FoodHistoryService._();
  static final instance = FoodHistoryService._();

  static const _kRecents = 'nutrition_recent_foods';
  static const _kFavorites = 'nutrition_favorite_foods';

  Future<List<TacoFood>> getRecents() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kRecents);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => TacoFood.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> addRecent(TacoFood food) async {
    final prefs = await SharedPreferences.getInstance();
    var recents = await getRecents();
    recents.removeWhere((f) => f.id == food.id);
    recents.insert(0, food);
    if (recents.length > 10) recents = recents.sublist(0, 10);
    await prefs.setString(
        _kRecents, jsonEncode(recents.map((f) => f.toJson()).toList()));
  }

  Future<List<TacoFood>> getFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kFavorites);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => TacoFood.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> toggleFavorite(TacoFood food) async {
    final prefs = await SharedPreferences.getInstance();
    var favs = await getFavorites();
    if (favs.any((f) => f.id == food.id)) {
      favs.removeWhere((f) => f.id == food.id);
    } else {
      favs.add(food);
    }
    await prefs.setString(
        _kFavorites, jsonEncode(favs.map((f) => f.toJson()).toList()));
  }
}
