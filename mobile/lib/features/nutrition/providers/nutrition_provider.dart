// lib/features/nutrition/providers/nutrition_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/nutrition_service.dart';
import '../data/food_history_service.dart';
import '../domain/nutrition_models.dart';


// ─── Data selecionada ─────────────────────────────────────────────────────────

final selectedDateProvider = StateProvider<DateTime>(
  (_) => DateTime.now(),
);

// ─── Goals ────────────────────────────────────────────────────────────────────

final nutritionGoalsProvider = FutureProvider.autoDispose<NutritionGoals>((ref) async {
  final userId = ref.watch(currentUserProvider)?.uid ?? '';
  if (userId.isEmpty) return const NutritionGoals();
  try {
    return await NutritionService.instance.getGoals(userId);
  } catch (_) {
    return const NutritionGoals();
  }
});

// ─── Food Entries ─────────────────────────────────────────────────────────────

class FoodEntriesNotifier extends StateNotifier<AsyncValue<List<FoodEntry>>> {
  FoodEntriesNotifier(this._userId, this._date)
      : super(const AsyncValue.loading()) {
    load();
  }

  final String _userId;
  final DateTime _date;

  Future<void> load() async {
    if (_userId.isEmpty) {
      state = const AsyncValue.data([]);
      return;
    }
    state = const AsyncValue.loading();
    try {
      final entries =
          await NutritionService.instance.listFoodEntries(_userId, _date);
      state = AsyncValue.data(entries);
    } catch (_) {
      state = const AsyncValue.data([]);
    }
  }

  Future<void> add(FoodEntry entry) async {
    final saved =
        await NutritionService.instance.addFoodEntry(_userId, entry);
    state.whenData(
      (list) => state = AsyncValue.data([...list, saved]),
    );
  }

  Future<void> remove(String entryId) async {
    await NutritionService.instance.deleteFoodEntry(_userId, entryId);
    state.whenData(
      (list) => state =
          AsyncValue.data(list.where((e) => e.id != entryId).toList()),
    );
  }
}

final foodEntriesProvider = StateNotifierProvider.autoDispose<
    FoodEntriesNotifier, AsyncValue<List<FoodEntry>>>((ref) {
  final userId = ref.watch(currentUserProvider)?.uid ?? '';
  final date = ref.watch(selectedDateProvider);
  return FoodEntriesNotifier(userId, date);
});

// ─── Water Entries ────────────────────────────────────────────────────────────

class WaterEntriesNotifier extends StateNotifier<AsyncValue<List<WaterEntry>>> {
  WaterEntriesNotifier(this._userId, this._date)
      : super(const AsyncValue.loading()) {
    load();
  }

  final String _userId;
  final DateTime _date;

  Future<void> load() async {
    if (_userId.isEmpty) {
      state = const AsyncValue.data([]);
      return;
    }
    state = const AsyncValue.loading();
    try {
      final entries =
          await NutritionService.instance.listWaterEntries(_userId, _date);
      state = AsyncValue.data(entries);
    } catch (_) {
      state = const AsyncValue.data([]);
    }
  }

  Future<void> add(int amount) async {
    final entry = await NutritionService.instance.addWater(_userId, amount);
    state.whenData(
      (list) => state = AsyncValue.data([...list, entry]),
    );
  }

  Future<void> remove(String entryId) async {
    await NutritionService.instance.deleteWaterEntry(_userId, entryId);
    state.whenData(
      (list) => state =
          AsyncValue.data(list.where((e) => e.id != entryId).toList()),
    );
  }
}

final waterEntriesProvider = StateNotifierProvider.autoDispose<
    WaterEntriesNotifier, AsyncValue<List<WaterEntry>>>((ref) {
  final userId = ref.watch(currentUserProvider)?.uid ?? '';
  final date = ref.watch(selectedDateProvider);
  return WaterEntriesNotifier(userId, date);
});

// ─── Recent & Favourite Foods ─────────────────────────────────────────────────

class RecentFoodsNotifier extends StateNotifier<List<TacoFood>> {
  RecentFoodsNotifier() : super([]) { _load(); }

  Future<void> _load() async {
    state = await FoodHistoryService.instance.getRecents();
  }

  Future<void> add(TacoFood food) async {
    await FoodHistoryService.instance.addRecent(food);
    await _load();
  }
}

class FavoriteFoodsNotifier extends StateNotifier<List<TacoFood>> {
  FavoriteFoodsNotifier() : super([]) { _load(); }

  Future<void> _load() async {
    state = await FoodHistoryService.instance.getFavorites();
  }

  Future<void> toggle(TacoFood food) async {
    await FoodHistoryService.instance.toggleFavorite(food);
    await _load();
  }
}

final recentFoodsProvider =
    StateNotifierProvider<RecentFoodsNotifier, List<TacoFood>>(
  (_) => RecentFoodsNotifier(),
);

final favoriteFoodsProvider =
    StateNotifierProvider<FavoriteFoodsNotifier, List<TacoFood>>(
  (_) => FavoriteFoodsNotifier(),
);

// ─── Dieta Base ───────────────────────────────────────────────────────────────

class DietPlanNotifier extends StateNotifier<AsyncValue<List<DietPlanItem>>> {
  DietPlanNotifier(this._userId) : super(const AsyncValue.loading()) {
    load();
  }

  final String _userId;

  Future<void> load() async {
    if (_userId.isEmpty) {
      state = const AsyncValue.data([]);
      return;
    }
    state = const AsyncValue.loading();
    try {
      final items = await NutritionService.instance.listDietPlan(_userId);
      state = AsyncValue.data(items);
    } catch (_) {
      state = const AsyncValue.data([]);
    }
  }

  Future<void> add(DietPlanItem item) async {
    final saved = await NutritionService.instance.addDietPlanItem(_userId, item);
    state.whenData((list) => state = AsyncValue.data([...list, saved]));
  }

  Future<void> remove(String itemId) async {
    await NutritionService.instance.deleteDietPlanItem(_userId, itemId);
    state.whenData(
      (list) => state = AsyncValue.data(list.where((i) => i.id != itemId).toList()),
    );
  }
}

final dietPlanProvider = StateNotifierProvider.autoDispose<DietPlanNotifier, AsyncValue<List<DietPlanItem>>>((ref) {
  final userId = ref.watch(currentUserProvider)?.uid ?? '';
  return DietPlanNotifier(userId);
});

// IDs dos itens da dieta base já consumidos na data selecionada
final consumedDietItemIdsProvider = Provider.autoDispose<Set<String>>((ref) {
  final entries = ref.watch(foodEntriesProvider).valueOrNull ?? [];
  return entries
      .where((e) => e.dietPlanItemId != null)
      .map((e) => e.dietPlanItemId!)
      .toSet();
});

// ─── Daily Summary ────────────────────────────────────────────────────────────

final dailySummaryProvider = Provider.autoDispose<DailySummary>((ref) {
  final foods = ref.watch(foodEntriesProvider).valueOrNull ?? [];
  final waters = ref.watch(waterEntriesProvider).valueOrNull ?? [];
  return DailySummary.fromEntries(foods, waters);
});
