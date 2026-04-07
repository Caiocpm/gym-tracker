// lib/shared/tutorial/tutorial_trigger.dart
//
// Widget de tamanho zero que dispara uma fase do tutorial na primeira visita.
// Pode ser adicionado a qualquer tela (ConsumerWidget ou ConsumerStatefulWidget)
// sem precisar converter a classe.

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'tutorial_provider.dart';
import 'tutorial_service.dart';
import 'tutorial_step.dart';

class TutorialTrigger extends ConsumerStatefulWidget {
  const TutorialTrigger({
    super.key,
    required this.phase,
    required this.steps,
    /// Atraso antes de iniciar (ms) — dá tempo à tela de renderizar.
    this.delayMs = 500,
  });

  final String phase;
  final List<TutorialStep> steps;
  final int delayMs;

  @override
  ConsumerState<TutorialTrigger> createState() => _TutorialTriggerState();
}

class _TutorialTriggerState extends ConsumerState<TutorialTrigger> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeStart());
  }

  Future<void> _maybeStart() async {
    if (!mounted) return;
    final done = await TutorialService.isPhaseCompleted(widget.phase);
    if (done) return;
    if (!mounted) return;

    // Aguarda o atraso configurado e verifica se outro tutorial não iniciou
    await Future.delayed(Duration(milliseconds: widget.delayMs));
    if (!mounted) return;
    if (ref.read(tutorialProvider).isActive) return;

    ref.read(tutorialProvider.notifier).start(widget.phase, widget.steps);
  }

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
