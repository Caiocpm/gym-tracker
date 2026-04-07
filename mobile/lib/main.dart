// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'features/nutrition/services/water_reminder_service.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('pt_BR');
  try {
    await WaterReminderService.instance.init();
  } catch (_) {
    // Plugin nativo não disponível neste ambiente (ex: hot restart sem rebuild)
  }
  runApp(
    const ProviderScope(
      child: GymTrackerApp(),
    ),
  );
}
