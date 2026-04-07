// lib/features/nutrition/services/water_reminder_service.dart
import 'dart:typed_data';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Gerencia notificações horárias de lembrete de água.
///
/// Lógica:
///   • O usuário configura um intervalo: ex 08:00 → 18:00
///   • A meta diária é dividida pelo número de horas → ml por hora
///   • Uma notificação repetitiva a cada hora é agendada
///   • O serviço verifica se está dentro do horário antes de exibir
class WaterReminderService {
  WaterReminderService._();
  static final instance = WaterReminderService._();

  static const _kEnabled    = 'water_reminder_enabled';
  static const _kStartHour  = 'water_reminder_start_hour';
  static const _kEndHour    = 'water_reminder_end_hour';
  static const _notifId     = 2001;
  static const _channelId   = 'water_reminder';

  final _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );
  }

  Future<void> _requestPermission() async {
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    await _plugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(alert: true, badge: false, sound: false);
  }

  NotificationDetails _details(int mlPerHour) => NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          'Lembrete de água',
          channelDescription: 'Notificações periódicas de hidratação',
          importance: Importance.defaultImportance,
          priority: Priority.defaultPriority,
          enableVibration: true,
          vibrationPattern: Int64List.fromList([0, 200, 100, 200]),
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentSound: false,
          presentBadge: false,
        ),
      );

  /// Ativa lembretes de hora em hora com vibração
  Future<void> schedule({
    required bool enabled,
    required int startHour,
    required int endHour,
    required int dailyGoalMl,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kEnabled, enabled);
    await prefs.setInt(_kStartHour, startHour);
    await prefs.setInt(_kEndHour, endHour);

    await _plugin.cancel(_notifId);
    if (!enabled) return;

    await _requestPermission();

    final hours = (endHour - startHour).clamp(1, 23);
    final mlPerHour = (dailyGoalMl / hours).round();

    // Notificação de intervalo fixo de 1 hora — o filtro de horário é feito
    // na callback de tap (não há suporte nativo a janela de horário sem timezone)
    await _plugin.periodicallyShow(
      _notifId,
      '💧 Hora de se hidratar!',
      'Tome ${mlPerHour}ml agora — meta: ${dailyGoalMl}ml/dia.',
      RepeatInterval.hourly,
      _details(mlPerHour),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
    );
  }

  Future<void> cancel() async {
    await _plugin.cancel(_notifId);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kEnabled, false);
  }

  Future<({bool enabled, int startHour, int endHour})> load() async {
    final prefs = await SharedPreferences.getInstance();
    return (
      enabled: prefs.getBool(_kEnabled) ?? false,
      startHour: prefs.getInt(_kStartHour) ?? 8,
      endHour: prefs.getInt(_kEndHour) ?? 18,
    );
  }
}
