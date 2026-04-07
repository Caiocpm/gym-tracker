// lib/shared/widgets/gradient_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/brand_provider.dart';
import '../theme/brand_colors.dart';

/// Card com barra de destaque no topo — cor sólida da marca.
class GradientCard extends ConsumerWidget {
  const GradientCard({
    super.key,
    required this.child,
    this.margin,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 16,
  });

  final Widget child;
  final EdgeInsets? margin;
  final EdgeInsets padding;
  final double borderRadius;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme  = Theme.of(context);
    final cs     = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    final cardBg = theme.cardTheme.color ?? cs.surface;
    final gradient = ref.watch(brandGradientProvider);

    return Container(
      margin: margin,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: isDark ? Colors.white12 : cs.outlineVariant,
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 4,
            decoration: BoxDecoration(
              gradient: gradient,
              borderRadius: BorderRadius.vertical(top: Radius.circular(borderRadius)),
            ),
          ),
          Padding(padding: padding, child: child),
        ],
      ),
    );
  }
}

/// Ícone com fundo em cor de destaque suave.
class GradientIconBadge extends StatelessWidget {
  const GradientIconBadge({
    super.key,
    this.emoji,
    this.icon,
    this.iconColor,
    this.size = 52,
  }) : assert(emoji != null || icon != null);

  final String? emoji;
  final IconData? icon;
  final Color? iconColor;
  final double size;

  @override
  Widget build(BuildContext context) {
    final primary = context.brandPrimary;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(size * 0.27),
      ),
      child: Center(
        child: emoji != null
            ? Text(emoji!, style: TextStyle(fontSize: size * 0.48))
            : Icon(icon, color: iconColor ?? primary, size: size * 0.44),
      ),
    );
  }
}
