// lib/shared/widgets/gradient_progress_bar.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/brand_provider.dart';

/// Barra de progresso com gradiente da marca.
///
/// Substitui [LinearProgressIndicator] nos cards de destaque.
/// Suporta animação automática via [AnimatedContainer].
class GradientProgressBar extends ConsumerWidget {
  const GradientProgressBar({
    super.key,
    required this.value,
    this.height = 8,
    this.borderRadius = 100.0,
    this.backgroundColor,
    this.gradient,
    this.animate = true,
  });

  /// Progresso de 0.0 a 1.0. Valores acima de 1.0 são clipados.
  final double value;
  final double height;
  final double borderRadius;

  /// Cor de fundo da trilha. Padrão: primary com 12% de opacidade.
  final Color? backgroundColor;

  /// Gradiente customizado. Padrão: gradiente da marca.
  final LinearGradient? gradient;

  /// Se true, anima a transição de valor.
  final bool animate;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs       = Theme.of(context).colorScheme;
    final primary  = cs.primary;
    final brandGradient = ref.watch(brandGradientProvider);
    final bg       = backgroundColor ?? primary.withValues(alpha: 0.10);
    final grad     = gradient ?? brandGradient;
    final clamped  = value.clamp(0.0, 1.0);

    return LayoutBuilder(
      builder: (context, constraints) {
        final totalWidth = constraints.maxWidth;
        final fillWidth  = totalWidth * clamped;

        return Container(
          height: height,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(borderRadius),
          ),
          child: Align(
            alignment: Alignment.centerLeft,
            child: animate
                ? AnimatedContainer(
                    duration: const Duration(milliseconds: 600),
                    curve: Curves.easeOutCubic,
                    width: fillWidth,
                    height: height,
                    decoration: BoxDecoration(
                      gradient: grad,
                      borderRadius: BorderRadius.circular(borderRadius),
                    ),
                  )
                : Container(
                    width: fillWidth,
                    height: height,
                    decoration: BoxDecoration(
                      gradient: grad,
                      borderRadius: BorderRadius.circular(borderRadius),
                    ),
                  ),
          ),
        );
      },
    );
  }
}

/// Label de estatística em destaque — número grande + unidade menor.
///
/// Exemplo: StatLabel(value: '2.4', unit: 'L', label: 'Água')
class StatLabel extends StatelessWidget {
  const StatLabel({
    super.key,
    required this.value,
    this.unit,
    this.label,
    this.valueSize = 28,
    this.color,
    this.crossAxisAlignment = CrossAxisAlignment.start,
  });

  final String value;
  final String? unit;
  final String? label;
  final double valueSize;
  final Color? color;
  final CrossAxisAlignment crossAxisAlignment;

  @override
  Widget build(BuildContext context) {
    final cs      = Theme.of(context).colorScheme;
    final primary = color ?? cs.primary;

    return Column(
      crossAxisAlignment: crossAxisAlignment,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: valueSize,
                fontWeight: FontWeight.w800,
                color: primary,
                height: 1.0,
              ),
            ),
            if (unit != null) ...[
              const SizedBox(width: 2),
              Padding(
                padding: EdgeInsets.only(bottom: valueSize * 0.06),
                child: Text(
                  unit!,
                  style: TextStyle(
                    fontSize: valueSize * 0.48,
                    fontWeight: FontWeight.w600,
                    color: primary.withValues(alpha: 0.75),
                  ),
                ),
              ),
            ],
          ],
        ),
        if (label != null)
          Text(
            label!,
            style: TextStyle(
              fontSize: 12,
              color: cs.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),
      ],
    );
  }
}
