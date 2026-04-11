// lib/firebase_options.dart
// Gerado manualmente a partir do google-services.json
// Para iOS: adicionar as opções correspondentes do GoogleService-Info.plist

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        // Web / desktop — FCM não suportado neste projeto
        return android;
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyB9ythvF50FVDnAV_4BGT8jCb6XP2CNiqU',
    appId: '1:158669162595:android:68d62e06c437c15ec09056',
    messagingSenderId: '158669162595',
    projectId: 'kinify-app',
    storageBucket: 'kinify-app.firebasestorage.app',
  );

  // Preencher após adicionar o app iOS no Firebase Console
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'SUBSTITUIR_PELA_API_KEY_IOS',
    appId: 'SUBSTITUIR_PELO_APP_ID_IOS',
    messagingSenderId: '158669162595',
    projectId: 'kinify-app',
    storageBucket: 'kinify-app.firebasestorage.app',
    iosBundleId: 'com.kinify.app',
  );
}
