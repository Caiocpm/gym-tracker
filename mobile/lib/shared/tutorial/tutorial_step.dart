// lib/shared/tutorial/tutorial_step.dart
import 'package:flutter/material.dart';

enum TooltipPosition { above, below }

class TutorialStep {
  final String id;
  final String title;
  final String description;

  /// null = tela inteira (card de boas-vindas, sem spotlight)
  final GlobalKey? targetKey;

  /// Padding ao redor do spotlight
  final EdgeInsets padding;

  /// Border-radius do recorte do spotlight
  final double radius;

  /// Onde o tooltip aparece em relação ao elemento destacado
  final TooltipPosition tooltipPosition;

  const TutorialStep({
    required this.id,
    required this.title,
    required this.description,
    this.targetKey,
    this.padding = const EdgeInsets.all(8),
    this.radius = 12,
    this.tooltipPosition = TooltipPosition.below,
  });
}
