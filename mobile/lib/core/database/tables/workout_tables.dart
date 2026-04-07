// lib/core/database/tables/workout_tables.dart
import 'package:drift/drift.dart';

class WorkoutDays extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get name => text()();
  TextColumn get exercises => text().withDefault(const Constant('[]'))(); // JSON
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

class WorkoutSessions extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get workoutDayId => text().nullable()();
  TextColumn get workoutName => text()();
  IntColumn get duration => integer().withDefault(const Constant(0))();
  TextColumn get exercises => text().withDefault(const Constant('[]'))(); // JSON
  DateTimeColumn get completedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

class LoggedExercises extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get exerciseDefinitionId => text()();
  TextColumn get exerciseName => text()();
  TextColumn get dayId => text().nullable()();
  IntColumn get reps => integer().withDefault(const Constant(0))();
  RealColumn get weight => real().withDefault(const Constant(0.0))();
  BoolColumn get isPersonalRecord =>
      boolean().withDefault(const Constant(false))();
  DateTimeColumn get date => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('CachedExercise')
class ExerciseDefinitions extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get muscleGroup => text().nullable()();
  TextColumn get equipment => text().nullable()();
  TextColumn get description => text().nullable()();
  TextColumn get createdBy => text().nullable()(); // null = global
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}
