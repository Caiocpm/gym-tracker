// lib/shared/widgets/gradient_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/brand_provider.dart';
import '../theme/brand_colors.dart';

/// Card padrão com barra de destaque no topo e sombra suave.
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
    final theme    = Theme.of(context);
    final cs       = theme.colorScheme;
    final isDark   = theme.brightness == Brightness.dark;
    final cardBg   = theme.cardTheme.color ?? cs.surface;
    final gradient = ref.watch(brandGradientProvider);

    return Container(
      margin: margin,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : cs.outlineVariant,
        ),
        boxShadow: isDark
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.20),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.07),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 1),
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
              borderRadius: BorderRadius.vertical(
                  top: Radius.circular(borderRadius)),
            ),
          ),
          Padding(padding: padding, child: child),
        ],
      ),
    );
  }
}

/// Card de destaque — fundo com gradiente sutil + sombra colorida.
/// Use para o card principal da tela (ex: resumo do dia, treino ativo).
class ElevatedGradientCard extends ConsumerWidget {
  const ElevatedGradientCard({
    super.key,
    required this.child,
    this.margin,
    this.padding = const EdgeInsets.all(20),
    this.borderRadius = 20,
  });

  final Widget child;
  final EdgeInsets? margin;
  final EdgeInsets padding;
  final double borderRadius;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme    = Theme.of(context);
    final cs       = theme.colorScheme;
    final isDark   = theme.brightness == Brightness.dark;
    final gradient = ref.watch(brandGradientProvider);
    final primary  = cs.primary;

    // Fundo: versão muito suave do gradiente da marca
    final bgGradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: isDark
          ? [
              primary.withValues(alpha: 0.18),
              primary.withValues(alpha: 0.08),
            ]
          : [
              primary.withValues(alpha: 0.07),
              primary.withValues(alpha: 0.03),
            ],
    );

    return Container(
      margin: margin,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        gradient: bgGradient,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: isDark
              ? primary.withValues(alpha: 0.20)
              : primary.withValues(alpha: 0.15),
        ),
        boxShadow: [
          BoxShadow(
            color: primary.withValues(alpha: isDark ? 0.18 : 0.14),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.30 : 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 3,
            decoration: BoxDecoration(
              gradient: gradient,
              borderRadius: BorderRadius.vertical(
                  top: Radius.circular(borderRadius)),
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
