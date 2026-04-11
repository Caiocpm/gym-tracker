// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:firebase_core/firebase_core.dart';
import 'features/nutrition/services/water_reminder_service.dart';
import 'features/notifications/services/push_notification_service.dart';
import 'firebase_options.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('pt_BR');

  try {
    await WaterReminderService.instance.init();
  } catch (_) {
    // Plugin nativo não disponível neste ambiente (ex: hot restart sem rebuild)
  }

  // Inicializa Firebase para FCM (requer google-services.json / GoogleService-Info.plist)
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    await PushNotificationService.instance.init();
  } catch (_) {
    // Firebase não configurado — push desabilitado, restante do app funciona normalmente
  }

  runApp(
    const ProviderScope(
      child: GymTrackerApp(),
    ),
  );
}
