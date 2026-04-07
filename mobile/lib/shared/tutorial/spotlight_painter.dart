// lib/shared/tutorial/spotlight_painter.dart
import 'package:flutter/material.dart';

class SpotlightPainter extends CustomPainter {
  final Rect? targetRect;
  final double targetRadius;
  final double overlayOpacity;

  const SpotlightPainter({
    required this.targetRect,
    this.targetRadius = 12,
    this.overlayOpacity = 0.78,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final full = Rect.fromLTWH(0, 0, size.width, size.height);
    final overlayPaint = Paint()
      ..color = Color.fromRGBO(0, 0, 0, overlayOpacity);

    if (targetRect == null || targetRect!.isEmpty) {
      canvas.drawRect(full, overlayPaint);
      return;
    }

    // Recorte com evenOdd: pinta tudo menos o spotlight
    final path = Path()
      ..addRect(full)
      ..addRRect(RRect.fromRectAndRadius(
        targetRect!,
        Radius.circular(targetRadius),
      ))
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(path, overlayPaint);

    // Borda brilhante ao redor do spotlight
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        targetRect!,
        Radius.circular(targetRadius),
      ),
      Paint()
        ..color = Colors.white.withValues(alpha: 0.35)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
  }

  @override
  bool shouldRepaint(SpotlightPainter old) =>
      old.targetRect != targetRect ||
      old.targetRadius != targetRadius ||
      old.overlayOpacity != overlayOpacity;
}
