// lib/core/config/env.dart
// Valores injetados via --dart-define em tempo de build.
// Desenvolvimento: flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api
// (10.0.2.2 é o localhost do host no emulador Android; use o IP da máquina para dispositivo físico)

class Env {
  Env._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api',
  );

  /// Server root — strips the '/api' suffix so uploads can be served from '/uploads/...'.
  static String get serverBaseUrl {
    const base = apiBaseUrl;
    return base.endsWith('/api') ? base.substring(0, base.length - 4) : base;
  }

  static const String googleClientId = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue: '803022989168-aa7i9t855sfgs4v75d91ed7pltkpattk.apps.googleusercontent.com',
  );
}
