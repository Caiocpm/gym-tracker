// lib/features/nutrition/domain/nutrition_models.dart

enum MealType { breakfast, lunch, dinner, snack }

extension MealTypeExt on MealType {
  String get label => switch (this) {
        MealType.breakfast => 'Café da manhã',
        MealType.lunch => 'Almoço',
        MealType.dinner => 'Jantar',
        MealType.snack => 'Lanche',
      };

  String get emoji => switch (this) {
        MealType.breakfast => '🍳',
        MealType.lunch => '🍽️',
        MealType.dinner => '🌙',
        MealType.snack => '🍎',
      };

  String get value => name;

  static MealType fromString(String v) =>
      MealType.values.firstWhere((e) => e.name == v,
          orElse: () => MealType.snack);
}

class FoodEntry {
  final String id;
  final String userId;
  final String foodName;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double fiber;
  final double quantity;
  final String unit;
  final MealType mealType;
  final DateTime date;
  final String? dietPlanItemId;

  const FoodEntry({
    required this.id,
    required this.userId,
    required this.foodName,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    this.fiber = 0,
    required this.quantity,
    required this.unit,
    required this.mealType,
    required this.date,
    this.dietPlanItemId,
  });

  factory FoodEntry.fromJson(Map<String, dynamic> json) => FoodEntry(
        id: json['id'] as String,
        userId: json['userId'] as String? ?? '',
        foodName: (json['foodName'] ?? json['name']) as String? ?? '',
        calories: (json['calories'] as num?)?.toDouble() ?? 0,
        protein: (json['protein'] as num?)?.toDouble() ?? 0,
        carbs: (json['carbs'] as num?)?.toDouble() ?? 0,
        fat: (json['fat'] as num?)?.toDouble() ?? 0,
        fiber: (json['fiber'] as num?)?.toDouble() ?? 0,
        quantity: (json['quantity'] as num?)?.toDouble() ?? 1,
        unit: json['unit'] as String? ?? 'g',
        mealType: MealTypeExt.fromString(
            (json['mealType'] ?? json['meal']) as String? ?? 'snack'),
        date: DateTime.tryParse(json['date'] as String? ?? '') ?? DateTime.now(),
        dietPlanItemId: json['dietPlanItemId'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'foodName': foodName,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
        'fiber': fiber,
        'quantity': quantity,
        'unit': unit,
        'mealType': mealType.value,
        'date': '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}',
      };
}

// ─── Dieta Base ───────────────────────────────────────────────────────────────

class DietPlanItem {
  final String id;
  final String userId;
  final String name;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double fiber;
  final double quantity;
  final String unit;
  final MealType? mealType;
  final int sortOrder;

  const DietPlanItem({
    required this.id,
    required this.userId,
    required this.name,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    this.fiber = 0,
    this.quantity = 1,
    this.unit = 'g',
    this.mealType,
    this.sortOrder = 0,
  });

  factory DietPlanItem.fromJson(Map<String, dynamic> json) => DietPlanItem(
        id: json['id'] as String,
        userId: json['userId'] as String? ?? '',
        name: json['name'] as String? ?? '',
        calories: (json['calories'] as num?)?.toDouble() ?? 0,
        protein: (json['protein'] as num?)?.toDouble() ?? 0,
        carbs: (json['carbs'] as num?)?.toDouble() ?? 0,
        fat: (json['fat'] as num?)?.toDouble() ?? 0,
        fiber: (json['fiber'] as num?)?.toDouble() ?? 0,
        quantity: (json['quantity'] as num?)?.toDouble() ?? 1,
        unit: json['unit'] as String? ?? 'g',
        mealType: json['meal'] != null
            ? MealTypeExt.fromString(json['meal'] as String)
            : null,
        sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
        'fiber': fiber,
        'quantity': quantity,
        'unit': unit,
        if (mealType != null) 'meal': mealType!.value,
        'sortOrder': sortOrder,
      };
}

/// Alimento da base TACO retornado pela API (PredefinedFood)
class TacoFood {
  final String id;
  final String name;
  final String? category;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double servingSize;
  final String servingUnit;
  final Map<String, dynamic>? micronutrients;

  const TacoFood({
    required this.id,
    required this.name,
    this.category,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    this.servingSize = 100,
    this.servingUnit = 'g',
    this.micronutrients,
  });

  factory TacoFood.fromJson(Map<String, dynamic> json) => TacoFood(
        id: json['id'] as String,
        name: json['name'] as String,
        category: json['category'] as String?,
        calories: (json['calories'] as num?)?.toDouble() ?? 0,
        protein: (json['protein'] as num?)?.toDouble() ?? 0,
        carbs: (json['carbs'] as num?)?.toDouble() ?? 0,
        fat: (json['fat'] as num?)?.toDouble() ?? 0,
        servingSize: (json['servingSize'] as num?)?.toDouble() ?? 100,
        servingUnit: json['servingUnit'] as String? ?? 'g',
        micronutrients: json['micronutrients'] as Map<String, dynamic>?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        if (category != null) 'category': category,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
        'servingSize': servingSize,
        'servingUnit': servingUnit,
        if (micronutrients != null) 'micronutrients': micronutrients,
      };

  /// Converte para FoodEntry com a quantidade informada pelo usuário.
  FoodEntry toFoodEntry({
    required String userId,
    required double quantity,
    required MealType mealType,
    required DateTime date,
  }) {
    final factor = quantity / servingSize;
    final fiberPer100 = (micronutrients?['fiber_g'] as num?)?.toDouble() ?? 0;
    return FoodEntry(
      id: '',
      userId: userId,
      foodName: name,
      calories: calories * factor,
      protein: protein * factor,
      carbs: carbs * factor,
      fat: fat * factor,
      fiber: fiberPer100 * factor,
      quantity: quantity,
      unit: servingUnit,
      mealType: mealType,
      date: date,
    );
  }
}

class WaterEntry {
  final String id;
  final int amount; // ml
  final DateTime date;

  const WaterEntry({
    required this.id,
    required this.amount,
    required this.date,
  });

  factory WaterEntry.fromJson(Map<String, dynamic> json) => WaterEntry(
        id: json['id'] as String,
        amount: (json['amount'] as num).toInt(),
        date: DateTime.tryParse(json['date'] as String? ?? '') ?? DateTime.now(),
      );
}

class NutritionGoals {
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double fiber;
  final int water; // ml
  final double? weightGoal;      // kg — alvo
  final double? weightGoalStart; // kg — peso no momento em que a meta foi definida

  const NutritionGoals({
    this.calories = 2000,
    this.protein = 150,
    this.carbs = 250,
    this.fat = 65,
    this.fiber = 25,
    this.water = 2500,
    this.weightGoal,
    this.weightGoalStart,
  });

  factory NutritionGoals.fromJson(Map<String, dynamic> json) => NutritionGoals(
        calories: (json['calories'] as num?)?.toDouble() ?? 2000,
        protein: (json['protein'] as num?)?.toDouble() ?? 150,
        carbs: (json['carbs'] as num?)?.toDouble() ?? 250,
        fat: (json['fat'] as num?)?.toDouble() ?? 65,
        fiber: (json['fiber'] as num?)?.toDouble() ?? 25,
        water: (json['water'] as num?)?.toInt() ?? 2500,
        weightGoal: (json['weightGoal'] as num?)?.toDouble(),
        weightGoalStart: (json['weightGoalStart'] as num?)?.toDouble(),
      );
}

class DailySummary {
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double fiber;
  final int water;

  const DailySummary({
    this.calories = 0,
    this.protein = 0,
    this.carbs = 0,
    this.fat = 0,
    this.fiber = 0,
    this.water = 0,
  });

  factory DailySummary.fromEntries(
      List<FoodEntry> foods, List<WaterEntry> waters) {
    return DailySummary(
      calories: foods.fold(0, (s, e) => s + e.calories),
      protein: foods.fold(0, (s, e) => s + e.protein),
      carbs: foods.fold(0, (s, e) => s + e.carbs),
      fat: foods.fold(0, (s, e) => s + e.fat),
      fiber: foods.fold(0, (s, e) => s + e.fiber),
      water: waters.fold(0, (s, e) => s + e.amount),
    );
  }
}

class WeightEntry {
  final String id;
  final double weight;
  final String date; // YYYY-MM-DD
  final String? note;

  const WeightEntry({
    required this.id,
    required this.weight,
    required this.date,
    this.note,
  });

  factory WeightEntry.fromJson(Map<String, dynamic> json) => WeightEntry(
        id: json['id'] as String,
        weight: (json['weight'] as num).toDouble(),
        date: json['date'] as String,
        note: json['note'] as String?,
      );
}

class MacroDistribution {
  final int protein;
  final int carbs;
  final int fat;

  const MacroDistribution({required this.protein, required this.carbs, required this.fat});

  factory MacroDistribution.fromJson(Map<String, dynamic> json) => MacroDistribution(
        protein: (json['protein'] as num).toInt(),
        carbs: (json['carbs'] as num).toInt(),
        fat: (json['fat'] as num).toInt(),
      );
}

class NutritionStats {
  final int adherenceRate;
  final int adherentDays;
  final int trackedDays;
  final int streak;
  final int bestStreak;
  final MacroDistribution macroDistribution;
  final int weekConsumed;
  final int weekGoal;
  final List<WeightEntry> weightEntries;

  const NutritionStats({
    required this.adherenceRate,
    required this.adherentDays,
    required this.trackedDays,
    required this.streak,
    required this.bestStreak,
    required this.macroDistribution,
    required this.weekConsumed,
    required this.weekGoal,
    required this.weightEntries,
  });

  factory NutritionStats.fromJson(Map<String, dynamic> json) => NutritionStats(
        adherenceRate: (json['adherenceRate'] as num).toInt(),
        adherentDays: (json['adherentDays'] as num).toInt(),
        trackedDays: (json['trackedDays'] as num).toInt(),
        streak: (json['streak'] as num).toInt(),
        bestStreak: (json['bestStreak'] as num).toInt(),
        macroDistribution: MacroDistribution.fromJson(
            json['macroDistribution'] as Map<String, dynamic>),
        weekConsumed: (json['weekConsumed'] as num).toInt(),
        weekGoal: (json['weekGoal'] as num).toInt(),
        weightEntries: (json['weightEntries'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(WeightEntry.fromJson)
            .toList(),
      );
}
