// lib/features/notifications/services/push_notification_service.dart
//
// Gerencia FCM push notifications:
//   • Inicializa Firebase + solicita permissão
//   • Registra o FCM token no backend após login
//   • Exibe notificação local quando o app está em foreground
//   • Ao tocar em notificação (background/terminado), navega para a rota correta
//
// Setup necessário (feito 1x por ambiente):
//   Android: colocar google-services.json em android/app/
//   iOS: colocar GoogleService-Info.plist em ios/Runner/
//       + adicionar capability "Push Notifications" no Xcode

import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/dio_client.dart';
import '../../../firebase_options.dart';

// Handler de background — DEVE ser top-level (não pode ser método de classe)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  // Notificações em background são exibidas automaticamente pelo FCM.
}

class PushNotificationService {
  PushNotificationService._();
  static final instance = PushNotificationService._();

  bool _firebaseReady = false;

  // Lazy — só acessado após Firebase.initializeApp() em main.dart
  FirebaseMessaging get _messaging => FirebaseMessaging.instance;
  final _localNotif = FlutterLocalNotificationsPlugin();
  final _dio = DioClient.instance.dio;

  static const _channelId = 'kinify_notifications';
  static const _channelName = 'Kinify';
  static const _channelDesc = 'Notificações do Kinify';

  /// Deve ser chamado após Firebase.initializeApp() em main.dart
  Future<void> init() async {
    _firebaseReady = true;
    // Registra handler para mensagens recebidas com app encerrado ou em background
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Solicita permissão (iOS obrigatório, Android 13+ obrigatório)
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Canal Android para notificações locais (foreground)
    const androidChannel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: _channelDesc,
      importance: Importance.high,
    );
    await _localNotif
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    // Inicializa flutter_local_notifications para exibir em foreground
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    await _localNotif.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
      onDidReceiveNotificationResponse: (details) {
        _handleTap(details.payload);
      },
    );

    // Foreground: exibe como notificação local
    FirebaseMessaging.onMessage.listen((message) {
      _showLocalNotification(message);
    });

    // App aberto a partir de notificação (background → foreground)
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _handleTap(message.data['url'] as String?);
    });

    // App encerrado → aberto por notificação
    final initial = await _messaging.getInitialMessage();
    if (initial != null) {
      _handleTap(initial.data['url'] as String?);
    }
  }

  /// Registra o FCM token no backend. Chamar após login bem-sucedido.
  Future<void> registerToken() async {
    if (!_firebaseReady) return;
    try {
      final token = await _messaging.getToken();
      if (token == null) return;
      await _dio.post('/auth/fcm-token', data: {'token': token});

      // Atualiza quando o token é renovado
      _messaging.onTokenRefresh.listen((newToken) {
        _dio.post('/auth/fcm-token', data: {'token': newToken}).catchError((_) {});
      });
    } catch (_) {
      // Sem push: não bloqueia o app
    }
  }

  /// Remove o token do backend no logout
  Future<void> unregisterToken() async {
    if (!_firebaseReady) return;
    try {
      await _dio.post('/auth/fcm-token', data: {'token': null});
      await _messaging.deleteToken();
    } catch (_) {}
  }

  void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    final id = message.hashCode;
    final payload = message.data['url'] as String?;

    _localNotif.show(
      id,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: _channelDesc,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: payload,
    );
  }

  // Navegação a partir do payload (rota interna: /social/groups/xxx, etc.)
  // O router é passado opcionalmente — se não disponível ainda, ignora.
  GoRouter? _router;
  void setRouter(GoRouter router) => _router = router;

  void _handleTap(String? url) {
    if (url == null || url.isEmpty) return;
    _router?.push(url);
  }
}
