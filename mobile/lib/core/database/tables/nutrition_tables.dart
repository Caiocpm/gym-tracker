// lib/core/database/tables/nutrition_tables.dart
import 'package:drift/drift.dart';

class FoodEntries extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get foodName => text()();
  RealColumn get calories => real().withDefault(const Constant(0.0))();
  RealColumn get protein => real().withDefault(const Constant(0.0))();
  RealColumn get carbs => real().withDefault(const Constant(0.0))();
  RealColumn get fat => real().withDefault(const Constant(0.0))();
  RealColumn get quantity => real().withDefault(const Constant(1.0))();
  TextColumn get unit => text().withDefault(const Constant('g'))();
  TextColumn get mealType => text().withDefault(const Constant('lunch'))();
  DateTimeColumn get date => dateTime().withDefault(currentDateAndTime)();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

class WaterEntries extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  IntColumn get amount => integer()(); // ml
  DateTimeColumn get date => dateTime().withDefault(currentDateAndTime)();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}
