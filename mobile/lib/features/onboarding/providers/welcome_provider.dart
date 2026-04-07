// lib/features/onboarding/providers/welcome_provider.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Flag SOMENTE em memória — nunca persiste no disco.
/// Cada vez que o app é aberto (ProviderScope recriado), começa como false
/// e o GoRouter redireciona para /welcome automaticamente.
/// Ao chamar markSeen(), o flag vira true e o router libera a navegação normal.
class WelcomeNotifier extends ChangeNotifier {
  bool _seen = false;

  bool get seen => _seen;

  void markSeen() {
    if (_seen) return;
    _seen = true;
    notifyListeners();
  }
}

final welcomeProvider = ChangeNotifierProvider<WelcomeNotifier>(
  (ref) => WelcomeNotifier(),
);
