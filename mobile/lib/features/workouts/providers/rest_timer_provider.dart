// lib/features/workouts/providers/rest_timer_provider.dart
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/providers/settings_provider.dart';

class RestTimerState {
  final bool isActive;
  final int secondsLeft;
  final int total;
  final String? exerciseName;

  const RestTimerState({
    this.isActive = false,
    this.secondsLeft = 0,
    this.total = 0,
    this.exerciseName,
  });

  RestTimerState copyWith({
    bool? isActive,
    int? secondsLeft,
    int? total,
    String? exerciseName,
  }) =>
      RestTimerState(
        isActive: isActive ?? this.isActive,
        secondsLeft: secondsLeft ?? this.secondsLeft,
        total: total ?? this.total,
        exerciseName: exerciseName ?? this.exerciseName,
      );

  double get progress => total > 0 ? secondsLeft / total : 0.0;

  String get formatted {
    final m = secondsLeft ~/ 60;
    final s = (secondsLeft % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }
}

class RestTimerNotifier extends StateNotifier<RestTimerState> {
  RestTimerNotifier(this._ref) : super(const RestTimerState());

  final Ref _ref;
  Timer? _timer;

  void start(int seconds, {String? exerciseName}) {
    _timer?.cancel();
    state = RestTimerState(
      isActive: true,
      secondsLeft: seconds,
      total: seconds,
      exerciseName: exerciseName,
    );
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (state.secondsLeft <= 1) {
        t.cancel();
        state = state.copyWith(isActive: false, secondsLeft: 0);
        _onComplete();
      } else {
        state = state.copyWith(secondsLeft: state.secondsLeft - 1);
      }
    });
  }

  void _onComplete() {
    final settings = _ref.read(settingsProvider);
    triggerRestEndFeedback(settings);
  }

  void skip() {
    _timer?.cancel();
    state = const RestTimerState();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

// Global — não autoDispose para sobreviver à navegação
final restTimerProvider =
    StateNotifierProvider<RestTimerNotifier, RestTimerState>(
  (ref) => RestTimerNotifier(ref),
);
