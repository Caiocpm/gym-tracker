// lib/shared/utils/image_crop.dart
import 'dart:typed_data';
import 'dart:ui' as ui;

/// Center-crops [bytes] to [ratio] (width ÷ height, default 4/5).
/// Scales the result down to at most [maxWidth] pixels wide.
/// Returns PNG-encoded bytes ready for base64 / Image.memory.
Future<Uint8List> cropToAspectRatio(
  Uint8List bytes, {
  double ratio = 4 / 5,
  int maxWidth = 600,
}) async {
  final codec = await ui.instantiateImageCodec(bytes);
  final frame = await codec.getNextFrame();
  final src = frame.image;

  final srcW = src.width.toDouble();
  final srcH = src.height.toDouble();

  // ── Compute center-crop rect ────────────────────────────────────────────────
  double cropW, cropH;
  if (srcW / srcH > ratio) {
    // Wider than target → crop sides
    cropH = srcH;
    cropW = srcH * ratio;
  } else {
    // Taller than target → crop top/bottom
    cropW = srcW;
    cropH = srcW / ratio;
  }
  final ox = (srcW - cropW) / 2;
  final oy = (srcH - cropH) / 2;

  // ── Scale down to maxWidth if needed ────────────────────────────────────────
  final scale = cropW > maxWidth ? maxWidth / cropW : 1.0;
  final outW = (cropW * scale).round();
  final outH = (cropH * scale).round();

  // ── Draw crop + scale onto a fresh canvas ───────────────────────────────────
  final recorder = ui.PictureRecorder();
  final canvas = ui.Canvas(recorder);
  canvas.drawImageRect(
    src,
    ui.Rect.fromLTWH(ox, oy, cropW, cropH),
    ui.Rect.fromLTWH(0, 0, outW.toDouble(), outH.toDouble()),
    ui.Paint()..filterQuality = ui.FilterQuality.medium,
  );

  final picture = recorder.endRecording();
  final out = await picture.toImage(outW, outH);
  final data = await out.toByteData(format: ui.ImageByteFormat.png);

  src.dispose();
  out.dispose();

  return data!.buffer.asUint8List();
}
