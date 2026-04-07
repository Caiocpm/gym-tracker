// lib/shared/providers/brand_provider.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/config/env.dart';
import '../../features/equipe/providers/equipe_provider.dart';
import '../../features/professional/providers/professional_provider.dart';
import '../theme/app_theme.dart';

/// Full brand customisation from a professional's profile.
class BrandData {
  final Color? color;          // seeds Material 3 theme: nav, buttons, inputs, chips
  final Color? highlightColor; // card bars, FABs, session banners
  final Color? surfaceColor;   // scaffold / page background
  final Color? onSurfaceColor; // primary text (headings, body)
  final Color? appBarColor;    // AppBar background
  final Color? navBarColor;    // BottomNavigationBar background
  final Color? cardColor;      // Card background
  final String? logoUrl;
  final String? name;

  const BrandData({
    this.color,
    this.highlightColor,
    this.surfaceColor,
    this.onSurfaceColor,
    this.appBarColor,
    this.navBarColor,
    this.cardColor,
    this.logoUrl,
    this.name,
  });

  static Color? _parseHex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    final clean = hex.replaceAll('#', '');
    if (clean.length != 6) return null;
    final value = int.tryParse('FF$clean', radix: 16);
    return value != null ? Color(value) : null;
  }

  static String? _resolveUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    if (url.startsWith('/')) return '${Env.serverBaseUrl}$url';
    return url;
  }

  factory BrandData.fromMap(Map<String, dynamic> map) {
    return BrandData(
      color:          _parseHex(map['color'] as String?),
      highlightColor: _parseHex(map['highlightColor'] as String?),
      surfaceColor:   _parseHex(map['surfaceColor'] as String?),
      onSurfaceColor: _parseHex(map['onSurfaceColor'] as String?),
      appBarColor:    _parseHex(map['appBarColor'] as String?),
      navBarColor:    _parseHex(map['navBarColor'] as String?),
      cardColor:      _parseHex(map['cardColor']   as String?),
      logoUrl: _resolveUrl(map['logoUrl'] as String?),
      name:    map['name'] as String?,
    );
  }
}

/// Active brand for the current student; null for professionals or unbranded.
final brandProvider = Provider<BrandData?>((ref) {
  final isPro = ref.watch(isProfessionalProvider);
  if (isPro) return null;
  return ref.watch(myLinksProvider).when(
    data: (links) {
      for (final link in links) {
        if (link.isActive && link.brand != null) return link.brand;
      }
      return null;
    },
    loading: () => null,
    error: (_, __) => null,
  );
});

/// Material 3 seed color — brand primary or Kinify default.
final brandColorProvider = Provider<Color>((ref) =>
    ref.watch(brandProvider)?.color ?? AppTheme.primary);

/// Explicit highlight color — null falls back to Kinify default, NOT to primary.
/// Use this for card bars, FABs, session banners — independent from primary.
final brandHighlightProvider = Provider<Color>((ref) {
  final b = ref.watch(brandProvider);
  return b?.highlightColor ?? AppTheme.primary;
});

/// Gradient for prominent surfaces (card bars, FABs, session banners):
/// - No brand OR brand without explicit highlight → original Kinify tri-color gradient
/// - Brand with explicit highlightColor set → solid highlight (no gradient)
final brandGradientProvider = Provider<LinearGradient>((ref) {
  final brand = ref.watch(brandProvider);
  if (brand?.highlightColor == null) return AppTheme.gradientPrimary;
  return LinearGradient(colors: [brand!.highlightColor!, brand.highlightColor!]);
});

/// Surface/background override — null means use theme default.
final brandSurfaceColorProvider = Provider<Color?>((ref) =>
    ref.watch(brandProvider)?.surfaceColor);

/// Text/onSurface override — null means use theme default.
final brandOnSurfaceColorProvider = Provider<Color?>((ref) =>
    ref.watch(brandProvider)?.onSurfaceColor);

/// AppBar background override — null means use theme default.
final brandAppBarColorProvider = Provider<Color?>((ref) =>
    ref.watch(brandProvider)?.appBarColor);

/// BottomNavigationBar background override — null means use theme default.
final brandNavBarColorProvider = Provider<Color?>((ref) =>
    ref.watch(brandProvider)?.navBarColor);

/// Card background override — null means use theme default.
final brandCardColorProvider = Provider<Color?>((ref) =>
    ref.watch(brandProvider)?.cardColor);
