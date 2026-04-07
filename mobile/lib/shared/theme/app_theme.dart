// lib/shared/theme/app_theme.dart
import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  // ─── Paleta padrão ────────────────────────────────────────────────────────────
  static const primary     = Color(0xFF3F5EFB);
  static const cyan        = Color(0xFF00C6FF);
  static const teal        = Color(0xFF1DD2AF);
  static const primaryDark = Color(0xFF2B4EFF);

  static const textDark   = Color(0xFF1A1A1A);
  static const textMedium = Color(0xFF495057);
  static const textLight  = Color(0xFF6C757D);
  static const border     = Color(0xFFE5E5E5);

  static const gradientPrimary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, cyan, teal],
    stops: [0.0, 0.5, 1.0],
  );

  /// Gradient for a custom brand color — two-stop using tint of the base color.
  static LinearGradient gradientForColor(Color c) => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [c, _lighten(c, 0.15)],
      );

  static Color _lighten(Color c, double amount) => Color.lerp(c, Colors.white, amount) ?? c;

  // ─── Public factories ─────────────────────────────────────────────────────────

  /// Default light theme.
  static ThemeData get light => _buildLight(
        ColorScheme.fromSeed(seedColor: primary, brightness: Brightness.light),
      );

  /// Default dark theme.
  static ThemeData get dark => _buildDark(
        ColorScheme.fromSeed(seedColor: primary, brightness: Brightness.dark),
      );

  /// Full branded light theme from a custom primary color.
  static ThemeData withPrimary(Color p) {
    if (p == primary) return light;
    return _buildLight(
      ColorScheme.fromSeed(seedColor: p, brightness: Brightness.light),
    );
  }

  /// Full branded dark theme from a custom primary color.
  static ThemeData darkWithPrimary(Color p) {
    if (p == primary) return dark;
    return _buildDark(
      ColorScheme.fromSeed(seedColor: p, brightness: Brightness.dark),
    );
  }

  /// Full brand-customised light theme with independent color overrides.
  static ThemeData withBrandFull({
    Color primaryColor = primary,
    Color? surfaceColor,   // scaffold / page background only (cards keep default)
    Color? onSurfaceColor, // primary text & titles
    Color? appBarColor,
    Color? navBarColor,
    Color? cardColor,
  }) {
    // 1. Seed-based palette
    var cs = ColorScheme.fromSeed(seedColor: primaryColor, brightness: Brightness.light);

    // 2. Force exact primary colour (not Material 3 tone-40 derivation)
    if (primaryColor != primary) {
      final lum = primaryColor.computeLuminance();
      cs = cs.copyWith(
        primary:   primaryColor,
        onPrimary: lum > 0.35 ? const Color(0xFF1A1A1A) : Colors.white,
      );
    }

    // 3. Text colour override
    if (onSurfaceColor != null) {
      cs = cs.copyWith(
        onSurface:        onSurfaceColor,
        onSurfaceVariant: onSurfaceColor.withValues(alpha: 0.65),
      );
    }

    // 4. Build theme, then patch scaffold background separately
    //    (cards keep cs.surface so they contrast against the custom background)
    ThemeData theme = _buildLight(cs);
    if (surfaceColor != null) {
      theme = theme.copyWith(scaffoldBackgroundColor: surfaceColor);
    }
    if (appBarColor != null) {
      theme = theme.copyWith(
        appBarTheme: theme.appBarTheme.copyWith(backgroundColor: appBarColor),
      );
    }
    if (navBarColor != null) {
      theme = theme.copyWith(
        bottomNavigationBarTheme: theme.bottomNavigationBarTheme.copyWith(
          backgroundColor: navBarColor,
        ),
      );
    }
    if (cardColor != null) {
      theme = theme.copyWith(
        cardColor: cardColor,
        cardTheme: theme.cardTheme.copyWith(color: cardColor),
      );
    }
    return theme;
  }

  /// Full brand-customised dark theme with independent color overrides.
  static ThemeData darkWithBrandFull({
    Color primaryColor = primary,
    Color? surfaceColor,
    Color? onSurfaceColor,
    Color? appBarColor,
    Color? navBarColor,
    Color? cardColor,
  }) {
    var cs = ColorScheme.fromSeed(seedColor: primaryColor, brightness: Brightness.dark);

    if (primaryColor != primary) {
      final lum = primaryColor.computeLuminance();
      cs = cs.copyWith(
        primary:   primaryColor,
        onPrimary: lum > 0.35 ? const Color(0xFF1A1A1A) : Colors.white,
      );
    }

    if (onSurfaceColor != null) {
      cs = cs.copyWith(
        onSurface:        onSurfaceColor,
        onSurfaceVariant: onSurfaceColor.withValues(alpha: 0.65),
      );
    }

    ThemeData theme = _buildDark(cs);
    if (surfaceColor != null) {
      theme = theme.copyWith(scaffoldBackgroundColor: surfaceColor);
    }
    if (appBarColor != null) {
      theme = theme.copyWith(
        appBarTheme: theme.appBarTheme.copyWith(backgroundColor: appBarColor),
      );
    }
    if (navBarColor != null) {
      theme = theme.copyWith(
        bottomNavigationBarTheme: theme.bottomNavigationBarTheme.copyWith(
          backgroundColor: navBarColor,
        ),
      );
    }
    if (cardColor != null) {
      theme = theme.copyWith(
        cardColor: cardColor,
        cardTheme: theme.cardTheme.copyWith(color: cardColor),
      );
    }
    return theme;
  }

  // ─── Internal builders ────────────────────────────────────────────────────────

  static ThemeData _buildLight(ColorScheme cs) {
    final p = cs.primary;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: cs,
      scaffoldBackgroundColor: cs.surfaceContainerLowest,
      cardColor: cs.surface,

      appBarTheme: AppBarTheme(
        backgroundColor: cs.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: cs.onSurface,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
        iconTheme: IconThemeData(color: cs.onSurface),
        actionsIconTheme: IconThemeData(color: cs.onSurface),
      ),

      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: cs.surface,
        selectedItemColor: p,
        unselectedItemColor: cs.onSurfaceVariant,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),

      cardTheme: CardThemeData(
        color: cs.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: cs.outlineVariant),
        ),
      ),

      tabBarTheme: TabBarThemeData(
        labelColor: p,
        unselectedLabelColor: cs.onSurfaceVariant,
        indicatorColor: p,
        dividerColor: cs.outlineVariant,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cs.surfaceContainerLow,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: cs.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: cs.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: p, width: 2),
        ),
        labelStyle: TextStyle(color: cs.onSurfaceVariant),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),

      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: p,
          foregroundColor: cs.onPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: cs.surfaceContainerHigh,
          foregroundColor: cs.onSurface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: p,
          side: BorderSide(color: p),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: p),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: cs.surfaceContainerLow,
        selectedColor: cs.primaryContainer,
        labelStyle: TextStyle(color: cs.onSurface, fontSize: 13),
        side: BorderSide(color: cs.outlineVariant),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),

      dividerTheme: DividerThemeData(color: cs.outlineVariant, thickness: 0.5),

      textTheme: TextTheme(
        headlineLarge: TextStyle(color: cs.onSurface, fontSize: 28, fontWeight: FontWeight.w800),
        headlineMedium: TextStyle(color: cs.onSurface, fontSize: 22, fontWeight: FontWeight.w700),
        titleLarge: TextStyle(color: cs.onSurface, fontSize: 18, fontWeight: FontWeight.w700),
        titleMedium: TextStyle(color: cs.onSurface, fontSize: 16, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: cs.onSurface, fontSize: 16),
        bodyMedium: TextStyle(color: cs.onSurfaceVariant, fontSize: 14),
        bodySmall: TextStyle(color: cs.onSurfaceVariant, fontSize: 12),
        labelSmall: TextStyle(color: cs.onSurfaceVariant, fontSize: 11),
      ),
    );
  }

  static ThemeData _buildDark(ColorScheme cs) {
    final p = cs.primary;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: cs,
      scaffoldBackgroundColor: cs.surfaceContainerLowest,
      cardColor: cs.surfaceContainer,

      appBarTheme: AppBarTheme(
        backgroundColor: cs.surfaceContainerLowest,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: cs.onSurface,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),

      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: cs.surfaceContainer,
        selectedItemColor: p,
        unselectedItemColor: cs.onSurfaceVariant,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),

      cardTheme: CardThemeData(
        color: cs.surfaceContainer,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cs.surfaceContainerLow,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: p),
        ),
      ),

      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: p,
          foregroundColor: cs.onPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          minimumSize: const Size(double.infinity, 48),
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: p,
          foregroundColor: cs.onPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          minimumSize: const Size(double.infinity, 48),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: p),
      ),

      tabBarTheme: TabBarThemeData(
        labelColor: p,
        unselectedLabelColor: cs.onSurfaceVariant,
        indicatorColor: p,
        dividerColor: cs.outlineVariant,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: cs.surfaceContainerLow,
        selectedColor: cs.primaryContainer,
        labelStyle: TextStyle(color: cs.onSurface, fontSize: 13),
        side: BorderSide(color: cs.outlineVariant),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),

      dividerTheme: DividerThemeData(color: cs.outlineVariant, thickness: 0.5),

      textTheme: TextTheme(
        headlineLarge: TextStyle(color: cs.onSurface, fontSize: 28, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(color: cs.onSurface, fontSize: 22, fontWeight: FontWeight.w600),
        titleLarge: TextStyle(color: cs.onSurface, fontSize: 18, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: cs.onSurface, fontSize: 16),
        bodyMedium: TextStyle(color: cs.onSurfaceVariant, fontSize: 14),
        bodySmall: TextStyle(color: cs.onSurfaceVariant, fontSize: 12),
      ),
    );
  }
}
