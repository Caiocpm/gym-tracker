// lib/core/config/env.dart
// Valores injetados via --dart-define em tempo de build.
// Android emulador:  flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api
// Web (dev):         flutter run -d chrome  (detecta automaticamente)
// Dispositivo físico: flutter run --dart-define=API_BASE_URL=http://<IP>:3000/api

import 'package:flutter/foundation.dart' show kIsWeb;

class Env {
  Env._();

  static const String _apiBaseUrlDefined = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (_apiBaseUrlDefined.isNotEmpty) return _apiBaseUrlDefined;
    if (kIsWeb) return 'http://localhost:3000/api';
    return 'http://10.0.2.2:3000/api';
  }

  /// Server root — strips the '/api' suffix so uploads can be served from '/uploads/...'.
  static String get serverBaseUrl {
    final base = apiBaseUrl;
    return base.endsWith('/api') ? base.substring(0, base.length - 4) : base;
  }

  static const String googleClientId = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue: '803022989168-aa7i9t855sfgs4v75d91ed7pltkpattk.apps.googleusercontent.com',
  );
}
