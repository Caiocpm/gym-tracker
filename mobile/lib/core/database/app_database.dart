// lib/core/database/app_database.dart
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'tables/workout_tables.dart';
import 'tables/nutrition_tables.dart';

part 'app_database.g.dart';

@DriftDatabase(tables: [
  WorkoutDays,
  WorkoutSessions,
  LoggedExercises,
  ExerciseDefinitions,
  FoodEntries,
  WaterEntries,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  // ─── Singleton ──────────────────────────────────────────────────────────────
  static AppDatabase? _instance;
  static AppDatabase get instance => _instance ??= AppDatabase();
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'gymtracker.db'));
    return NativeDatabase.createInBackground(file);
  });
}
