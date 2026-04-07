// lib/shared/tutorial/tutorial_service.dart
import 'package:shared_preferences/shared_preferences.dart';

class TutorialService {
  TutorialService._();

  static const _phasePrefix   = 'tutorial_phase_';
  static const _launchedKey   = 'tutorial_launched';

  static Future<bool> isFirstLaunch() async {
    final prefs = await SharedPreferences.getInstance();
    return !prefs.containsKey(_launchedKey);
  }

  static Future<void> markLaunched() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_launchedKey, true);
  }

  static Future<bool> isPhaseCompleted(String phase) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('$_phasePrefix$phase') ?? false;
  }

  static Future<void> markPhaseCompleted(String phase) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('$_phasePrefix$phase', true);
  }

  /// Reseta tudo — usado em Configurações → "Repetir Tutorial"
  static Future<void> resetAll() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs
        .getKeys()
        .where((k) => k.startsWith(_phasePrefix) || k == _launchedKey)
        .toList();
    for (final k in keys) {
      await prefs.remove(k);
    }
  }
}
