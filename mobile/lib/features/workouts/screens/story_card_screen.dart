// lib/features/workouts/screens/story_card_screen.dart
//
// Gera um card 9:16 com fundo transparente contendo o resumo do treino.
// O usuário copia a imagem para a área de transferência e cola no Instagram Stories.
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gal/gal.dart';
import 'package:pasteboard/pasteboard.dart';

import '../domain/workout_models.dart';
import '../../../shared/providers/brand_provider.dart';

// ─── Entry-point público ──────────────────────────────────────────────────────

Future<void> showStoryShareSheet(
  BuildContext context, {
  required String workoutName,
  required int durationSeconds,
  required List<ActiveExercise> exercises,
  required DateTime sessionDate,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => StoryShareSheet(
      workoutName: workoutName,
      durationSeconds: durationSeconds,
      exercises: exercises,
      sessionDate: sessionDate,
    ),
  );
}

/// Abre o story a partir de uma sessão já finalizada (histórico).
Future<void> showStoryFromSession(BuildContext context, WorkoutSession session) {
  final muscExercises = session.exercises.where((e) => !e.isCardio).toList();
  final totalVolume =
      muscExercises.fold(0.0, (v, e) => v + e.totalVolume);
  final completedSets =
      muscExercises.fold(0, (v, e) => v + e.sets.length);
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => StoryShareSheet(
      workoutName: session.workoutName,
      durationSeconds: session.durationSeconds,
      exercises: const [],
      sessionDate: session.createdAt,
      precomputedVolume: totalVolume,
      precomputedSets: completedSets,
      precomputedExerciseCount: muscExercises.length,
    ),
  );
}

// ─── Bottom sheet ─────────────────────────────────────────────────────────────

class StoryShareSheet extends ConsumerStatefulWidget {
  const StoryShareSheet({
    super.key,
    required this.workoutName,
    required this.durationSeconds,
    required this.exercises,
    required this.sessionDate,
    this.precomputedVolume,
    this.precomputedSets,
    this.precomputedExerciseCount,
  });

  final String workoutName;
  final int durationSeconds;
  final List<ActiveExercise> exercises;
  final DateTime sessionDate;
  final double? precomputedVolume;
  final int? precomputedSets;
  final int? precomputedExerciseCount;

  @override
  ConsumerState<StoryShareSheet> createState() => _StoryShareSheetState();
}

class _StoryShareSheetState extends ConsumerState<StoryShareSheet> {
  bool _busy = false;
  bool _copied = false;
  final _cardKey = GlobalKey();

  double get _totalVolume =>
      widget.precomputedVolume ??
      widget.exercises.fold(0, (v, e) =>
          v + e.sets.where((s) => s.isCompleted).fold<double>(0, (sv, s) => sv + s.weight * s.reps));

  int get _completedSets =>
      widget.precomputedSets ??
      widget.exercises.fold(0, (v, e) => v + e.sets.where((s) => s.isCompleted).length);

  int get _exerciseCount =>
      widget.precomputedExerciseCount ?? widget.exercises.length;

  /// Renderiza o card como PNG com transparência real (sem checker).
  Future<Uint8List?> _capture() async {
    try {
      final boundary =
          _cardKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (_) {
      return null;
    }
  }

  // iOS/macOS: copia direto para área de transferência.
  // Android: não suporta cópia de imagem via pasteboard — salva na galeria
  // e orienta o usuário a abrir o Instagram e escolher a imagem.
  Future<void> _copyToClipboard() async {
    setState(() { _busy = true; _copied = false; });
    try {
      final bytes = await _capture();
      if (bytes == null) throw Exception('Falha ao capturar imagem');

      if (Platform.isAndroid) {
        await Gal.putImageBytes(
          bytes,
          name: 'story_treino_${DateTime.now().millisecondsSinceEpoch}.png',
        );
        if (mounted) {
          setState(() => _copied = true);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: Colors.green.shade700,
              duration: const Duration(seconds: 6),
              content: const Row(
                children: [
                  Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Imagem salva na galeria! Abra o Instagram Stories, toque em "+" e escolha a imagem.',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          );
        }
      } else {
        await Pasteboard.writeImage(bytes);
        if (mounted) {
          setState(() => _copied = true);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: Colors.green.shade700,
              duration: const Duration(seconds: 5),
              content: const Row(
                children: [
                  Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Imagem copiada! Abra o Instagram Stories e segure o dedo na tela para colar.',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _saveToGallery() async {
    setState(() => _busy = true);
    try {
      final bytes = await _capture();
      if (bytes == null) throw Exception('Falha ao capturar imagem');
      await Gal.putImageBytes(
        bytes,
        name: 'treino_${DateTime.now().millisecondsSinceEpoch}.png',
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Imagem salva na galeria!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao salvar: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final brandGradient = ref.watch(brandGradientProvider);
    final brandColor = ref.watch(brandColorProvider);
    final screenHeight = MediaQuery.sizeOf(context).height;

    // Altura do preview: tela menos chrome do sheet (drag handle + header + botões + paddings ~230px)
    final previewH = (screenHeight - 230).clamp(200.0, 460.0);
    final previewW = previewH * 9 / 16;

    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 14),
              decoration: BoxDecoration(
                color: cs.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Cabeçalho
          Row(
            children: [
              const Text('📲', style: TextStyle(fontSize: 22)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Story do Treino', style: theme.textTheme.titleLarge),
                    Text(
                      'Copie e cole no Instagram Stories',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Preview com checker (mostra a transparência)
          SizedBox(
            height: previewH,
            width: previewW,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                children: [
                  // Fundo xadrez — apenas no preview, não entra no PNG capturado
                  const _CheckerBackground(),
                  // Card com fundo transparente
                  RepaintBoundary(
                    key: _cardKey,
                    child: StoryCardWidget(
                      workoutName: widget.workoutName,
                      durationSeconds: widget.durationSeconds,
                      totalVolume: _totalVolume,
                      completedSets: _completedSets,
                      exerciseCount: _exerciseCount,
                      exerciseSummary: const [],
                      sessionDate: widget.sessionDate,
                      brandGradient: brandGradient,
                      brandColor: brandColor,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Botões
          Row(
            children: [
              // Salvar na galeria (secundário)
              OutlinedButton.icon(
                onPressed: _busy ? null : _saveToGallery,
                icon: const Icon(Icons.save_alt_outlined, size: 18),
                label: const Text('Salvar'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 16),
                ),
              ),
              const SizedBox(width: 12),
              // Copiar (primário)
              Expanded(
                child: FilledButton.icon(
                  onPressed: _busy ? null : _copyToClipboard,
                  icon: _busy
                      ? const SizedBox(
                          width: 16, height: 16,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : Icon(_copied ? Icons.check : (Platform.isAndroid ? Icons.save_alt : Icons.copy), size: 18),
                  label: Text(_busy
                      ? 'Processando...'
                      : _copied
                          ? (Platform.isAndroid ? 'Salvo!' : 'Copiado!')
                          : (Platform.isAndroid ? 'Salvar para Stories' : 'Copiar imagem')),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    backgroundColor: _copied ? Colors.green : null,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Card renderizável (fundo 100% transparente) ─────────────────────────────

class StoryCardWidget extends StatelessWidget {
  const StoryCardWidget({
    super.key,
    required this.workoutName,
    required this.durationSeconds,
    required this.totalVolume,
    required this.completedSets,
    required this.exerciseCount,
    required this.exerciseSummary,
    required this.sessionDate,
    required this.brandGradient,
    required this.brandColor,
  });

  final String workoutName;
  final int durationSeconds;
  final double totalVolume;
  final int completedSets;
  final int exerciseCount;
  final List<({String name, double maxWeight, bool isCardio})> exerciseSummary;
  final DateTime sessionDate;
  final LinearGradient brandGradient;
  final Color brandColor;

  String get _durationText {
    final m = durationSeconds ~/ 60;
    if (m < 60) return '${m}min';
    return '${m ~/ 60}h ${m % 60}min';
  }

  String get _volumeText {
    if (totalVolume <= 0) return '—';
    if (totalVolume >= 1000) return '${(totalVolume / 1000).toStringAsFixed(1)}t';
    return '${totalVolume.toStringAsFixed(0)}kg';
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final h = constraints.maxHeight;
        final vPad = h * 0.05;
        final hPad = constraints.maxWidth * 0.08;

        return ColoredBox(
          color: Colors.transparent,
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: hPad, vertical: vPad),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),

                // ── Nome do treino + separador ────────────────────────────
                IntrinsicWidth(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        workoutName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          height: 1.1,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: h * 0.02),
                      Container(
                        height: 3,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF3F5EFB), Color(0xFF00C6FF), Color(0xFF00D2A0)],
                          ),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ],
                  ),
                ),

                SizedBox(height: h * 0.03),

                // ── Duração ────────────────────────────────────────────────
                _StatLine(
                  label: 'Duração',
                  value: _durationText,
                  icon: Icons.timer_outlined,
                ),

                SizedBox(height: h * 0.02),

                // ── Exercícios ─────────────────────────────────────────────
                _StatLine(
                  label: 'Exercícios',
                  value: '$exerciseCount',
                  icon: Icons.fitness_center,
                ),

                SizedBox(height: h * 0.02),

                // ── Volume total ───────────────────────────────────────────
                _StatLine(
                  label: 'Volume total',
                  value: _volumeText,
                  icon: Icons.bar_chart,
                ),

                SizedBox(height: h * 0.03),

                // ── Rodapé logo ────────────────────────────────────────────
                Image.asset(
                  'assets/images/logo.png',
                  height: 32,
                  fit: BoxFit.contain,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

class _AppLogo extends StatelessWidget {
  const _AppLogo({required this.accent});
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/logo.png',
      height: 28,
      fit: BoxFit.contain,
    );
  }
}

class _StatBlock extends StatelessWidget {
  const _StatBlock({
    required this.value,
    required this.label,
    required this.icon,
    required this.accent,
  });
  final String value;
  final String label;
  final IconData icon;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: accent),
            const SizedBox(width: 4),
            Text(label,
                style: const TextStyle(
                    color: Colors.white60,
                    fontSize: 11,
                    fontWeight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 2),
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w800)),
      ],
    );
  }
}

class _StatLine extends StatelessWidget {
  const _StatLine({
    required this.label,
    required this.value,
    required this.icon,
  });
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: Colors.white38),
            const SizedBox(width: 5),
            Text(
              label.toUpperCase(),
              style: const TextStyle(
                color: Colors.white38,
                fontSize: 10,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 26,
            fontWeight: FontWeight.w800,
            height: 1.0,
          ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARDIO STORY CARD
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Dados agregados de cardio ────────────────────────────────────────────────

class CardioStoryData {
  final String exerciseName;
  final String subtype;
  final int totalSeconds;
  final double totalDistanceKm;
  final int totalLaps;
  final int avgBpm;
  final int kcalBurned;
  final int elevationGainM;
  final String? intensityLabel;
  final String? swimStyleLabel;

  const CardioStoryData({
    required this.exerciseName,
    required this.subtype,
    required this.totalSeconds,
    required this.totalDistanceKm,
    required this.totalLaps,
    required this.avgBpm,
    required this.kcalBurned,
    required this.elevationGainM,
    this.intensityLabel,
    this.swimStyleLabel,
  });

  static CardioStoryData fromExercise(ActiveExercise e) {
    final sets = e.sets.where((s) => s.isCompleted).toList();
    final totalSeconds = sets.fold<int>(0, (v, s) => v + (s.durationSeconds ?? 0));
    final totalDist    = sets.fold<double>(0, (v, s) => v + (s.distanceKm ?? 0));
    final totalLaps    = sets.fold<int>(0, (v, s) => v + (s.lapsCount ?? 0));
    final bpms         = sets.where((s) => s.avgBpm != null).map((s) => s.avgBpm!).toList();
    final avgBpm       = bpms.isEmpty ? 0 : (bpms.reduce((a, b) => a + b) / bpms.length).round();
    final kcal         = sets.fold<int>(0, (v, s) => v + (s.kcalBurned ?? 0));
    final elev         = sets.fold<int>(0, (v, s) => v + (s.elevationGainM ?? 0));

    String? intensity;
    if (sets.isNotEmpty && sets.last.intensity != null) {
      intensity = switch (sets.last.intensity!) {
        CardioIntensity.leve     => 'Leve',
        CardioIntensity.moderada => 'Moderada',
        CardioIntensity.intensa  => 'Intensa',
      };
    }

    String? swimStyle;
    if (sets.isNotEmpty && sets.last.swimStyle != null) {
      swimStyle = switch (sets.last.swimStyle!) {
        SwimStyle.livre     => 'Livre',
        SwimStyle.costas    => 'Costas',
        SwimStyle.peito     => 'Peito',
        SwimStyle.borboleta => 'Borboleta',
        SwimStyle.medley    => 'Medley',
      };
    }

    return CardioStoryData(
      exerciseName:  e.exerciseName,
      subtype:       e.cardioSubtype ?? 'generico',
      totalSeconds:  totalSeconds,
      totalDistanceKm: totalDist,
      totalLaps:     totalLaps,
      avgBpm:        avgBpm,
      kcalBurned:    kcal,
      elevationGainM: elev,
      intensityLabel: intensity,
      swimStyleLabel: swimStyle,
    );
  }

  // ── Helpers de exibição ──────────────────────────────────────────────────────

  IconData get icon => switch (subtype) {
        'corrida'               => Icons.directions_run,
        'caminhada'             => Icons.directions_walk,
        'ciclismo'              => Icons.pedal_bike,
        'bicicleta_ergometrica' => Icons.pedal_bike,
        'natacao'               => Icons.pool,
        'remo'                  => Icons.rowing,
        'escada'                => Icons.stairs,
        _                       => Icons.directions_run,
      };

  String get subtypeLabel => switch (subtype) {
        'corrida'               => 'Corrida',
        'caminhada'             => 'Caminhada',
        'ciclismo'              => 'Ciclismo',
        'bicicleta_ergometrica' => 'Bike Indoor',
        'natacao'               => 'Natação',
        'remo'                  => 'Remo',
        'escada'                => 'Escada',
        'funcional'             => 'Funcional',
        _                       => 'Cardio',
      };

  String get durationText {
    final m = totalSeconds ~/ 60;
    final s = totalSeconds % 60;
    if (m >= 60) return '${m ~/ 60}h ${(m % 60).toString().padLeft(2, '0')}min';
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  // Pace: min/km para corrida/caminhada
  String? get paceText {
    if (subtype != 'corrida' && subtype != 'caminhada') return null;
    if (totalDistanceKm <= 0 || totalSeconds <= 0) return null;
    final secPerKm = totalSeconds / totalDistanceKm;
    final m = secPerKm ~/ 60;
    final s = (secPerKm % 60).round();
    return "${m}'${s.toString().padLeft(2, '0')}\"/km";
  }

  // Velocidade média: km/h para ciclismo
  String? get speedText {
    if (subtype != 'ciclismo' && subtype != 'bicicleta_ergometrica') return null;
    if (totalDistanceKm <= 0 || totalSeconds <= 0) return null;
    final kmh = totalDistanceKm / (totalSeconds / 3600);
    return '${kmh.toStringAsFixed(1)} km/h';
  }

  /// Constrói a partir de um [SessionExercise] (histórico).
  static CardioStoryData fromSessionExercise(SessionExercise e) {
    final sets = e.sets;
    final totalSeconds = sets.fold<int>(0, (v, s) => v + (s.durationSeconds ?? 0));
    final totalDist    = sets.fold<double>(0, (v, s) => v + (s.distanceKm ?? 0));
    final totalLaps    = sets.fold<int>(0, (v, s) => v + (s.lapsCount ?? 0));
    final bpms         = sets.where((s) => s.avgBpm != null).map((s) => s.avgBpm!).toList();
    final avgBpm       = bpms.isEmpty ? 0 : (bpms.reduce((a, b) => a + b) / bpms.length).round();
    final kcal         = sets.fold<int>(0, (v, s) => v + (s.kcalBurned ?? 0));
    final elev         = sets.fold<int>(0, (v, s) => v + (s.elevationGainM ?? 0));

    String? intensity;
    if (sets.isNotEmpty && sets.last.intensity != null) {
      intensity = switch (sets.last.intensity) {
        'leve'     => 'Leve',
        'moderada' => 'Moderada',
        'intensa'  => 'Intensa',
        _          => null,
      };
    }

    String? swimStyle;
    if (sets.isNotEmpty && sets.last.swimStyle != null) {
      swimStyle = switch (sets.last.swimStyle) {
        'livre'     => 'Livre',
        'costas'    => 'Costas',
        'peito'     => 'Peito',
        'borboleta' => 'Borboleta',
        'medley'    => 'Medley',
        _           => null,
      };
    }

    return CardioStoryData(
      exerciseName:    e.exerciseName,
      subtype:         e.cardioSubtype ?? 'generico',
      totalSeconds:    totalSeconds,
      totalDistanceKm: totalDist,
      totalLaps:       totalLaps,
      avgBpm:          avgBpm,
      kcalBurned:      kcal,
      elevationGainM:  elev,
      intensityLabel:  intensity,
      swimStyleLabel:  swimStyle,
    );
  }
}

// ─── Entry-points públicos ────────────────────────────────────────────────────

Future<void> showCardioStorySheet(
  BuildContext context, {
  required List<ActiveExercise> cardioExercises,
  required DateTime sessionDate,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => CardioStoryShareSheet(
      items: cardioExercises.map(CardioStoryData.fromExercise).toList(),
      sessionDate: sessionDate,
    ),
  );
}

/// Abre o story de cardio a partir de sessões do histórico.
Future<void> showCardioStoryFromSession(
  BuildContext context, {
  required List<SessionExercise> cardioExercises,
  required DateTime sessionDate,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => CardioStoryShareSheet(
      items: cardioExercises.map(CardioStoryData.fromSessionExercise).toList(),
      sessionDate: sessionDate,
    ),
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

class CardioStoryShareSheet extends ConsumerStatefulWidget {
  const CardioStoryShareSheet({
    super.key,
    required this.items,
    required this.sessionDate,
  });

  final List<CardioStoryData> items;
  final DateTime sessionDate;

  @override
  ConsumerState<CardioStoryShareSheet> createState() => _CardioStoryShareSheetState();
}

class _CardioStoryShareSheetState extends ConsumerState<CardioStoryShareSheet> {
  bool _busy = false;
  bool _copied = false;
  int _selectedIndex = 0;
  final _cardKey = GlobalKey();

  List<CardioStoryData> get _dataList => widget.items;

  Future<Uint8List?> _capture() async {
    try {
      final boundary =
          _cardKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (_) {
      return null;
    }
  }

  Future<void> _copyOrSave() async {
    setState(() { _busy = true; _copied = false; });
    try {
      final bytes = await _capture();
      if (bytes == null) throw Exception('Falha ao capturar imagem');

      if (Platform.isAndroid) {
        await Gal.putImageBytes(bytes,
            name: 'cardio_story_${DateTime.now().millisecondsSinceEpoch}.png');
        if (mounted) {
          setState(() => _copied = true);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            backgroundColor: Colors.green.shade700,
            duration: const Duration(seconds: 6),
            content: const Row(children: [
              Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
              SizedBox(width: 10),
              Expanded(child: Text(
                'Imagem salva na galeria! Abra o Instagram Stories, toque em "+" e escolha a imagem.',
                style: TextStyle(color: Colors.white),
              )),
            ]),
          ));
        }
      } else {
        await Pasteboard.writeImage(bytes);
        if (mounted) {
          setState(() => _copied = true);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            backgroundColor: Colors.green.shade700,
            duration: const Duration(seconds: 5),
            content: const Row(children: [
              Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
              SizedBox(width: 10),
              Expanded(child: Text(
                'Imagem copiada! Abra o Instagram Stories e segure o dedo na tela para colar.',
                style: TextStyle(color: Colors.white),
              )),
            ]),
          ));
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro: $e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _saveToGallery() async {
    setState(() => _busy = true);
    try {
      final bytes = await _capture();
      if (bytes == null) throw Exception('Falha ao capturar imagem');
      await Gal.putImageBytes(bytes,
          name: 'cardio_${DateTime.now().millisecondsSinceEpoch}.png');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Imagem salva na galeria!')),
      );
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao salvar: $e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final brandGradient = ref.watch(brandGradientProvider);
    final brandColor = ref.watch(brandColorProvider);
    final screenHeight = MediaQuery.sizeOf(context).height;
    final dataList = _dataList;
    final data = dataList[_selectedIndex.clamp(0, dataList.length - 1)];

    final previewH = (screenHeight - 230).clamp(200.0, 460.0);
    final previewW = previewH * 9 / 16;

    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 14),
              decoration: BoxDecoration(
                color: cs.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Cabeçalho
          Row(
            children: [
              const Text('🏃', style: TextStyle(fontSize: 22)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Story de Cardio', style: theme.textTheme.titleLarge),
                    Text('Copie e cole no Instagram Stories',
                        style: theme.textTheme.bodySmall),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Seletor de exercício (se houver mais de um)
          if (dataList.length > 1) ...[
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: dataList.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final selected = _selectedIndex == i;
                  return ChoiceChip(
                    avatar: Icon(dataList[i].icon, size: 14),
                    label: Text(dataList[i].subtypeLabel,
                        style: const TextStyle(fontSize: 12)),
                    selected: selected,
                    onSelected: (_) => setState(() {
                      _selectedIndex = i;
                      _copied = false;
                    }),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Preview
          SizedBox(
            height: previewH,
            width: previewW,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                children: [
                  const _CheckerBackground(),
                  RepaintBoundary(
                    key: _cardKey,
                    child: CardioStoryCardWidget(
                      data: data,
                      sessionDate: widget.sessionDate,
                      brandGradient: brandGradient,
                      brandColor: brandColor,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Botões
          Row(
            children: [
              OutlinedButton.icon(
                onPressed: _busy ? null : _saveToGallery,
                icon: const Icon(Icons.save_alt_outlined, size: 18),
                label: const Text('Salvar'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 16),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: _busy ? null : _copyOrSave,
                  icon: _busy
                      ? const SizedBox(width: 16, height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Icon(_copied
                          ? Icons.check
                          : (Platform.isAndroid ? Icons.save_alt : Icons.copy),
                          size: 18),
                  label: Text(_busy
                      ? 'Processando...'
                      : _copied
                          ? (Platform.isAndroid ? 'Salvo!' : 'Copiado!')
                          : (Platform.isAndroid ? 'Salvar para Stories' : 'Copiar imagem')),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    backgroundColor: _copied ? Colors.green : null,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Card de cardio renderizável ─────────────────────────────────────────────

class CardioStoryCardWidget extends StatelessWidget {
  const CardioStoryCardWidget({
    super.key,
    required this.data,
    required this.sessionDate,
    required this.brandGradient,
    required this.brandColor,
  });

  final CardioStoryData data;
  final DateTime sessionDate;
  final LinearGradient brandGradient;
  final Color brandColor;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final h = constraints.maxHeight;
      final vPad = h * 0.07;
      final hPad = constraints.maxWidth * 0.08;

      // Monta lista de stats relevantes para o subtipo, na ordem desejada
      final stats = <({String value, String label, IconData icon})>[];

      // 1. Distância (quando houver)
      if (data.totalDistanceKm > 0) {
        stats.add((
          value: '${data.totalDistanceKm.toStringAsFixed(data.totalDistanceKm >= 10 ? 1 : 2)} km',
          label: 'Distância',
          icon: Icons.straighten,
        ));
      }

      // 2. Pace (corrida/caminhada) ou Velocidade (ciclismo)
      if (data.paceText != null) {
        stats.add((value: data.paceText!, label: 'Ritmo', icon: Icons.speed));
      } else if (data.speedText != null) {
        stats.add((value: data.speedText!, label: 'Velocidade', icon: Icons.speed));
      }

      // 3. Voltas (natação / escada)
      if (data.totalLaps > 0) {
        stats.add((value: '${data.totalLaps}', label: 'Voltas', icon: Icons.loop));
      }

      // 4. FC média
      if (data.avgBpm > 0) {
        stats.add((value: '${data.avgBpm} bpm', label: 'FC Média', icon: Icons.favorite_outline));
      }

      // 5. Calorias
      if (data.kcalBurned > 0) {
        stats.add((value: '${data.kcalBurned} kcal', label: 'Calorias', icon: Icons.local_fire_department_outlined));
      }

      // 6. Elevação
      if (data.elevationGainM > 0) {
        stats.add((value: '+${data.elevationGainM}m', label: 'Elevação', icon: Icons.trending_up));
      }

      final tag = data.intensityLabel ?? data.swimStyleLabel;

      return ColoredBox(
        color: Colors.transparent,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: hPad, vertical: vPad),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),

              // ── Nome da modalidade ─────────────────────────────────────
              Text(
                data.subtypeLabel.toUpperCase(),
                style: const TextStyle(
                  color: Color(0xFF00D2A0),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 6),
              // ── Nome do exercício + separador ─────────────────────────
              IntrinsicWidth(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      data.exerciseName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.w900,
                        height: 1.1,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: h * 0.02),
                    Container(
                      height: 3,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF3F5EFB), Color(0xFF00C6FF), Color(0xFF00D2A0)],
                        ),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
              ),

              SizedBox(height: h * 0.03),

              // ── Stats em linhas individuais ────────────────────────────
              ...stats.map((s) => Padding(
                padding: EdgeInsets.only(bottom: h * 0.02),
                child: _StatLine(value: s.value, label: s.label, icon: s.icon),
              )),

              // ── Duração (sempre última) ────────────────────────────────
              _StatLine(
                value: data.durationText,
                label: 'Duração',
                icon: Icons.timer_outlined,
              ),

              // ── Intensidade / estilo de nado ───────────────────────────
              if (tag != null) ...[
                SizedBox(height: h * 0.025),
                Text(
                  tag.toUpperCase(),
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.45),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.5,
                  ),
                ),
              ],

              SizedBox(height: h * 0.03),

              // ── Rodapé logo ────────────────────────────────────────────
              Image.asset(
                'assets/images/logo.png',
                height: 32,
                fit: BoxFit.contain,
              ),
            ],
          ),
        ),
      );
    });
  }
}

/// Fundo xadrez — exibido apenas no preview, não entra no PNG capturado
/// porque o RepaintBoundary do card está acima desta camada no Stack.
class _CheckerBackground extends StatelessWidget {
  const _CheckerBackground();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _CheckerPainter(),
      child: const SizedBox.expand(),
    );
  }
}

class _CheckerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const cell = 16.0;
    final a = Paint()..color = const Color(0xFF787878);
    final b = Paint()..color = const Color(0xFF9A9A9A);
    int row = 0;
    for (double y = 0; y < size.height; y += cell) {
      int col = row;
      for (double x = 0; x < size.width; x += cell) {
        canvas.drawRect(Rect.fromLTWH(x, y, cell, cell), col % 2 == 0 ? a : b);
        col++;
      }
      row++;
    }
  }

  @override
  bool shouldRepaint(_CheckerPainter _) => false;
}
