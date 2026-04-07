// lib/shared/providers/settings_provider.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ─── Model ────────────────────────────────────────────────────────────────────

class AppSettings {
  final Set<String> activeModalities; // 'musculacao', 'cardio', 'crossfit'
  final bool restTimerVibrate;
  final bool restTimerSound;
  final String weightUnit; // 'kg' | 'lb'
  final int defaultRestSeconds;
  final double weightIncrement; // kg
  final int firstDayOfWeek; // DateTime.monday=1, DateTime.sunday=7
  final int weeklyGoal; // treinos/semana
  final bool trainingReminder;
  final int reminderHour;
  final int reminderMinute;
  final bool weeklyReport;
  final String themeMode; // 'light' | 'dark' | 'system'
  // Lembrete de água
  final bool waterReminderEnabled;
  final int waterReminderStartHour;
  final int waterReminderEndHour;

  const AppSettings({
    this.activeModalities = const {'musculacao', 'cardio', 'crossfit'},
    this.restTimerVibrate = true,
    this.restTimerSound = true,
    this.weightUnit = 'kg',
    this.defaultRestSeconds = 60,
    this.weightIncrement = 2.5,
    this.firstDayOfWeek = DateTime.monday,
    this.weeklyGoal = 3,
    this.trainingReminder = false,
    this.reminderHour = 7,
    this.reminderMinute = 0,
    this.weeklyReport = true,
    this.themeMode = 'system',
    this.waterReminderEnabled = false,
    this.waterReminderStartHour = 8,
    this.waterReminderEndHour = 18,
  });

  bool get musculacaoActive => activeModalities.contains('musculacao');
  bool get cardioActive => activeModalities.contains('cardio');
  bool get crossfitActive => activeModalities.contains('crossfit');

  TimeOfDay get reminderTime =>
      TimeOfDay(hour: reminderHour, minute: reminderMinute);

  ThemeMode get flutterThemeMode {
    switch (themeMode) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  /// Retorna true se o dayType do treino está ativo nas configurações
  bool isDayTypeActive(String dayType) {
    switch (dayType) {
      case 'crossfit':
        return crossfitActive;
      case 'cardio':
        return cardioActive;
      default:
        return musculacaoActive;
    }
  }

  AppSettings copyWith({
    Set<String>? activeModalities,
    bool? restTimerVibrate,
    bool? restTimerSound,
    String? weightUnit,
    int? defaultRestSeconds,
    double? weightIncrement,
    int? firstDayOfWeek,
    int? weeklyGoal,
    bool? trainingReminder,
    int? reminderHour,
    int? reminderMinute,
    bool? weeklyReport,
    String? themeMode,
    bool? waterReminderEnabled,
    int? waterReminderStartHour,
    int? waterReminderEndHour,
  }) =>
      AppSettings(
        activeModalities: activeModalities ?? this.activeModalities,
        restTimerVibrate: restTimerVibrate ?? this.restTimerVibrate,
        restTimerSound: restTimerSound ?? this.restTimerSound,
        weightUnit: weightUnit ?? this.weightUnit,
        defaultRestSeconds: defaultRestSeconds ?? this.defaultRestSeconds,
        weightIncrement: weightIncrement ?? this.weightIncrement,
        firstDayOfWeek: firstDayOfWeek ?? this.firstDayOfWeek,
        weeklyGoal: weeklyGoal ?? this.weeklyGoal,
        trainingReminder: trainingReminder ?? this.trainingReminder,
        reminderHour: reminderHour ?? this.reminderHour,
        reminderMinute: reminderMinute ?? this.reminderMinute,
        weeklyReport: weeklyReport ?? this.weeklyReport,
        themeMode: themeMode ?? this.themeMode,
        waterReminderEnabled: waterReminderEnabled ?? this.waterReminderEnabled,
        waterReminderStartHour: waterReminderStartHour ?? this.waterReminderStartHour,
        waterReminderEndHour: waterReminderEndHour ?? this.waterReminderEndHour,
      );
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

class SettingsNotifier extends StateNotifier<AppSettings> {
  SettingsNotifier() : super(const AppSettings()) {
    _load();
  }

  static const _kModalities = 'settings_modalities';
  static const _kVibrate = 'settings_rest_vibrate';
  static const _kSound = 'settings_rest_sound';
  static const _kWeightUnit = 'settings_weight_unit';
  static const _kDefaultRest = 'settings_default_rest';
  static const _kWeightIncrement = 'settings_weight_increment';
  static const _kFirstDay = 'settings_first_day';
  static const _kWeeklyGoal = 'settings_weekly_goal';
  static const _kReminder = 'settings_training_reminder';
  static const _kReminderHour = 'settings_reminder_hour';
  static const _kReminderMinute = 'settings_reminder_minute';
  static const _kWeeklyReport = 'settings_weekly_report';
  static const _kThemeMode = 'settings_theme_mode';
  static const _kWaterReminder = 'settings_water_reminder_enabled';
  static const _kWaterStartHour = 'settings_water_reminder_start';
  static const _kWaterEndHour = 'settings_water_reminder_end';

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final modalitiesJson = prefs.getString(_kModalities);
    final modalities = modalitiesJson != null
        ? Set<String>.from(jsonDecode(modalitiesJson) as List)
        : const <String>{'musculacao', 'cardio', 'crossfit'};
    state = AppSettings(
      activeModalities: modalities,
      restTimerVibrate: prefs.getBool(_kVibrate) ?? true,
      restTimerSound: prefs.getBool(_kSound) ?? true,
      weightUnit: prefs.getString(_kWeightUnit) ?? 'kg',
      defaultRestSeconds: prefs.getInt(_kDefaultRest) ?? 60,
      weightIncrement: prefs.getDouble(_kWeightIncrement) ?? 2.5,
      firstDayOfWeek: prefs.getInt(_kFirstDay) ?? DateTime.monday,
      weeklyGoal: prefs.getInt(_kWeeklyGoal) ?? 3,
      trainingReminder: prefs.getBool(_kReminder) ?? false,
      reminderHour: prefs.getInt(_kReminderHour) ?? 7,
      reminderMinute: prefs.getInt(_kReminderMinute) ?? 0,
      weeklyReport: prefs.getBool(_kWeeklyReport) ?? true,
      themeMode: prefs.getString(_kThemeMode) ?? 'system',
      waterReminderEnabled: prefs.getBool(_kWaterReminder) ?? false,
      waterReminderStartHour: prefs.getInt(_kWaterStartHour) ?? 8,
      waterReminderEndHour: prefs.getInt(_kWaterEndHour) ?? 18,
    );
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _kModalities, jsonEncode(state.activeModalities.toList()));
    await prefs.setBool(_kVibrate, state.restTimerVibrate);
    await prefs.setBool(_kSound, state.restTimerSound);
    await prefs.setString(_kWeightUnit, state.weightUnit);
    await prefs.setInt(_kDefaultRest, state.defaultRestSeconds);
    await prefs.setDouble(_kWeightIncrement, state.weightIncrement);
    await prefs.setInt(_kFirstDay, state.firstDayOfWeek);
    await prefs.setInt(_kWeeklyGoal, state.weeklyGoal);
    await prefs.setBool(_kReminder, state.trainingReminder);
    await prefs.setInt(_kReminderHour, state.reminderHour);
    await prefs.setInt(_kReminderMinute, state.reminderMinute);
    await prefs.setBool(_kWeeklyReport, state.weeklyReport);
    await prefs.setString(_kThemeMode, state.themeMode);
    await prefs.setBool(_kWaterReminder, state.waterReminderEnabled);
    await prefs.setInt(_kWaterStartHour, state.waterReminderStartHour);
    await prefs.setInt(_kWaterEndHour, state.waterReminderEndHour);
  }

  /// Ativa/desativa uma modalidade — mantém pelo menos uma sempre ativa
  void toggleModality(String modality) {
    final updated = Set<String>.from(state.activeModalities);
    if (updated.contains(modality)) {
      if (updated.length <= 1) return;
      updated.remove(modality);
    } else {
      updated.add(modality);
    }
    state = state.copyWith(activeModalities: updated);
    _save();
  }

  void setRestVibrate(bool v) {
    state = state.copyWith(restTimerVibrate: v);
    _save();
  }

  void setRestSound(bool v) {
    state = state.copyWith(restTimerSound: v);
    _save();
  }

  void setWeightUnit(String u) {
    state = state.copyWith(weightUnit: u);
    _save();
  }

  void setDefaultRest(int s) {
    state = state.copyWith(defaultRestSeconds: s);
    _save();
  }

  void setWeightIncrement(double i) {
    state = state.copyWith(weightIncrement: i);
    _save();
  }

  void setFirstDayOfWeek(int d) {
    state = state.copyWith(firstDayOfWeek: d);
    _save();
  }

  void setWeeklyGoal(int g) {
    state = state.copyWith(weeklyGoal: g);
    _save();
  }

  void setTrainingReminder(bool v) {
    state = state.copyWith(trainingReminder: v);
    _save();
  }

  void setReminderTime(TimeOfDay t) {
    state =
        state.copyWith(reminderHour: t.hour, reminderMinute: t.minute);
    _save();
  }

  void setWeeklyReport(bool v) {
    state = state.copyWith(weeklyReport: v);
    _save();
  }

  void setThemeMode(String m) {
    state = state.copyWith(themeMode: m);
    _save();
  }

  void setWaterReminder({
    required bool enabled,
    int? startHour,
    int? endHour,
  }) {
    state = state.copyWith(
      waterReminderEnabled: enabled,
      waterReminderStartHour: startHour,
      waterReminderEndHour: endHour,
    );
    _save();
  }
}

// ─── Feedback helpers (sem pacotes externos) ──────────────────────────────────

Future<void> triggerRestEndFeedback(AppSettings settings) async {
  if (settings.restTimerVibrate) {
    // Padrão de vibração: 3 pulsos curtos
    for (int i = 0; i < 3; i++) {
      HapticFeedback.heavyImpact();
      await Future.delayed(const Duration(milliseconds: 150));
    }
  }
  if (settings.restTimerSound) {
    SystemSound.play(SystemSoundType.alert);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

// Global — não autoDispose: settings devem persistir durante toda a sessão
final settingsProvider =
    StateNotifierProvider<SettingsNotifier, AppSettings>(
  (_) => SettingsNotifier(),
);
