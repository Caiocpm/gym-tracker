// lib/shared/tutorial/tutorial_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'tutorial_step.dart';
import 'tutorial_service.dart';

class TutorialState {
  final bool isActive;
  final List<TutorialStep> steps;
  final int currentIndex;
  final String? activePhase;

  const TutorialState({
    this.isActive = false,
    this.steps = const [],
    this.currentIndex = 0,
    this.activePhase,
  });

  bool get hasNext  => currentIndex < steps.length - 1;
  bool get isLast   => currentIndex == steps.length - 1;
  bool get isDone   => currentIndex >= steps.length;

  TutorialStep? get currentStep =>
      isActive && !isDone ? steps[currentIndex] : null;

  TutorialState copyWith({
    bool? isActive,
    List<TutorialStep>? steps,
    int? currentIndex,
    String? activePhase,
  }) =>
      TutorialState(
        isActive:     isActive     ?? this.isActive,
        steps:        steps        ?? this.steps,
        currentIndex: currentIndex ?? this.currentIndex,
        activePhase:  activePhase  ?? this.activePhase,
      );
}

class TutorialNotifier extends StateNotifier<TutorialState> {
  TutorialNotifier() : super(const TutorialState());

  void start(String phase, List<TutorialStep> steps) {
    if (steps.isEmpty) return;
    state = TutorialState(
      isActive:     true,
      steps:        steps,
      currentIndex: 0,
      activePhase:  phase,
    );
  }

  void next() {
    if (!state.isActive) return;
    if (state.hasNext) {
      state = state.copyWith(currentIndex: state.currentIndex + 1);
    } else {
      _finish();
    }
  }

  void skip() => _finish();

  void _finish() {
    final phase = state.activePhase;
    state = const TutorialState();
    if (phase != null) TutorialService.markPhaseCompleted(phase);
  }
}

final tutorialProvider =
    StateNotifierProvider<TutorialNotifier, TutorialState>(
  (_) => TutorialNotifier(),
);
