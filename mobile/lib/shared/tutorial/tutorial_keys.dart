// lib/shared/tutorial/tutorial_keys.dart
import 'package:flutter/material.dart';

/// GlobalKeys estáticos para todos os elementos-alvo do tutorial.
/// Cada chave deve ser atribuída ao widget correspondente via key: TutorialKeys.xxx
abstract class TutorialKeys {
  // ── MainScaffold ───────────────────────────────────────────────────────────
  static final bottomNav         = GlobalKey(debugLabel: 'tut_bottomNav');
  static final profileButton     = GlobalKey(debugLabel: 'tut_profileButton');
  static final notifButton       = GlobalKey(debugLabel: 'tut_notifButton');

  // ── Treinos ────────────────────────────────────────────────────────────────
  static final workoutsHeader    = GlobalKey(debugLabel: 'tut_workoutsHeader');
  static final addWorkoutButton  = GlobalKey(debugLabel: 'tut_addWorkoutButton');

  // ── Nutrição ───────────────────────────────────────────────────────────────
  static final nutritionHeader   = GlobalKey(debugLabel: 'tut_nutritionHeader');
  static final caloriesCard      = GlobalKey(debugLabel: 'tut_caloriesCard');
  static final waterCard         = GlobalKey(debugLabel: 'tut_waterCard');
  static final weightCard        = GlobalKey(debugLabel: 'tut_weightCard');

  // ── Social ─────────────────────────────────────────────────────────────────
  static final socialHeader      = GlobalKey(debugLabel: 'tut_socialHeader');
  static final socialTabs        = GlobalKey(debugLabel: 'tut_socialTabs');

  // ── Análises ───────────────────────────────────────────────────────────────
  static final analyticsTabBar   = GlobalKey(debugLabel: 'tut_analyticsTabBar');

  // ── Perfil ─────────────────────────────────────────────────────────────────
  static final profileAppBar     = GlobalKey(debugLabel: 'tut_profileAppBar');
  static final profileSettingsBtn = GlobalKey(debugLabel: 'tut_profileSettingsBtn');
}
