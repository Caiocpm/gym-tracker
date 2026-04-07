// lib/shared/theme/brand_colors.dart
import 'package:flutter/material.dart';

/// Convenient extensions so any widget can access the current brand color
/// without explicitly reading AppTheme.primary (which is hardcoded).
///
/// Usage:
///   color: context.brandPrimary
///   color: context.brandPrimary.withValues(alpha: 0.12)
extension BrandColorsX on BuildContext {
  ColorScheme get cs => Theme.of(this).colorScheme;

  /// The active primary color — app default or professional brand color.
  Color get brandPrimary => Theme.of(this).colorScheme.primary;

  /// A very light tint of the primary color (8% opacity), useful for backgrounds.
  Color get brandPrimaryFaint => Theme.of(this).colorScheme.primary.withValues(alpha: 0.08);

  /// A subtle tint (12% opacity), useful for icon backgrounds and chip fills.
  Color get brandPrimarySubtle => Theme.of(this).colorScheme.primary.withValues(alpha: 0.12);

  /// Primary container from the generated seed scheme.
  Color get brandContainer => Theme.of(this).colorScheme.primaryContainer;

  /// On-primary container.
  Color get brandOnContainer => Theme.of(this).colorScheme.onPrimaryContainer;
}
