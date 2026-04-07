// lib/shared/tutorial/tutorial_overlay.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'tutorial_provider.dart';
import 'tutorial_step.dart';
import 'spotlight_painter.dart';
import '../theme/app_theme.dart';

class TutorialOverlay extends ConsumerStatefulWidget {
  const TutorialOverlay({super.key});

  @override
  ConsumerState<TutorialOverlay> createState() => _TutorialOverlayState();
}

class _TutorialOverlayState extends ConsumerState<TutorialOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fade;
  Rect? _spotlightRect;
  Timer? _retryTimer;
  String? _lastStepId;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    )..forward();
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _retryTimer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  // ── Utilitário: obtém o Rect global de um GlobalKey ───────────────────────
  Rect? _rectOf(GlobalKey? key) {
    if (key == null) return null;
    try {
      final box = key.currentContext?.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize) return null;
      return box.localToGlobal(Offset.zero) & box.size;
    } catch (_) {
      return null;
    }
  }

  void _refreshRect(TutorialStep step) {
    _retryTimer?.cancel();
    void tryUpdate() {
      if (!mounted) return;
      final r = _rectOf(step.targetKey);
      if (r != _spotlightRect) setState(() => _spotlightRect = r);
    }

    tryUpdate();
    // Retry após o layout se ainda não estiver pronto
    _retryTimer = Timer(const Duration(milliseconds: 200), tryUpdate);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tutorialProvider);
    if (!state.isActive) return const SizedBox.shrink();

    final step = state.currentStep;
    if (step == null) return const SizedBox.shrink();

    // Atualiza rect quando o passo muda
    if (step.id != _lastStepId) {
      _lastStepId = step.id;
      WidgetsBinding.instance
          .addPostFrameCallback((_) => _refreshRect(step));
    }

    final isWelcome = step.targetKey == null;
    final rawRect   = isWelcome ? null : _spotlightRect;
    final paddedRect = rawRect != null ? step.padding.inflateRect(rawRect) : null;

    final totalSteps = state.steps.length;
    final idx        = state.currentIndex;
    final isLast     = state.isLast;

    return FadeTransition(
      opacity: _fade,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // ── Fundo com recorte spotlight ───────────────────────────────────
          IgnorePointer(
            ignoring: isWelcome,
            child: GestureDetector(
              // toque fora não avança — usuário deve usar botão
              onTap: () {},
              child: CustomPaint(
                painter: SpotlightPainter(
                  targetRect:   paddedRect,
                  targetRadius: step.radius,
                ),
              ),
            ),
          ),

          // ── Card de boas-vindas (passo sem targetKey) ─────────────────────
          if (isWelcome)
            Center(
              child: _WelcomeCard(
                step:        step,
                currentIdx:  idx,
                totalSteps:  totalSteps,
                onStart:     () => ref.read(tutorialProvider.notifier).next(),
                onSkip:      () => ref.read(tutorialProvider.notifier).skip(),
              ),
            )

          // ── Tooltip posicionado próximo ao elemento ────────────────────────
          else if (paddedRect != null)
            _PositionedTooltip(
              step:       step,
              targetRect: paddedRect,
              currentIdx: idx,
              totalSteps: totalSteps,
              isLast:     isLast,
              onNext:     () => ref.read(tutorialProvider.notifier).next(),
              onSkip:     () => ref.read(tutorialProvider.notifier).skip(),
            )

          // Fallback enquanto o rect ainda não foi calculado
          else
            Center(
              child: _TooltipCard(
                step:       step,
                currentIdx: idx,
                totalSteps: totalSteps,
                isLast:     isLast,
                onNext:     () => ref.read(tutorialProvider.notifier).next(),
                onSkip:     () => ref.read(tutorialProvider.notifier).skip(),
              ),
            ),

          // ── Botão "Pular" sempre visível (exceto welcome) ─────────────────
          if (!isWelcome)
            Positioned(
              top:   MediaQuery.of(context).padding.top + 12,
              right: 16,
              child: _SkipButton(
                onTap: () => ref.read(tutorialProvider.notifier).skip(),
              ),
            ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Card de boas-vindas
// ─────────────────────────────────────────────────────────────────────────────

class _WelcomeCard extends StatelessWidget {
  const _WelcomeCard({
    required this.step,
    required this.currentIdx,
    required this.totalSteps,
    required this.onStart,
    required this.onSkip,
  });

  final TutorialStep step;
  final int currentIdx;
  final int totalSteps;
  final VoidCallback onStart;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Container(
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 32,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Barra gradiente no topo
            Container(
              height: 5,
              decoration: const BoxDecoration(
                gradient: AppTheme.gradientPrimary,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
              child: Column(
                children: [
                  // Ícone
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      gradient: AppTheme.gradientPrimary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Center(
                      child: Text('🏋️', style: TextStyle(fontSize: 36)),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    step.title,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    step.description,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: cs.onSurface.withValues(alpha: 0.7),
                          height: 1.5,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '$totalSteps passos no total',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: cs.onSurface.withValues(alpha: 0.45),
                        ),
                  ),
                  const SizedBox(height: 24),
                  // Botões
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: onSkip,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            side: BorderSide(
                              color: cs.outline.withValues(alpha: 0.4),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text(
                            'Pular Tutorial',
                            style: TextStyle(
                              color: cs.onSurface.withValues(alpha: 0.5),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _GradientButton(
                          label: 'Começar Tour',
                          onTap: onStart,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip posicionado próximo ao elemento destacado
// ─────────────────────────────────────────────────────────────────────────────

class _PositionedTooltip extends StatelessWidget {
  const _PositionedTooltip({
    required this.step,
    required this.targetRect,
    required this.currentIdx,
    required this.totalSteps,
    required this.isLast,
    required this.onNext,
    required this.onSkip,
  });

  final TutorialStep step;
  final Rect targetRect;
  final int currentIdx;
  final int totalSteps;
  final bool isLast;
  final VoidCallback onNext;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    final screen      = MediaQuery.of(context).size;
    final safePadding = MediaQuery.of(context).padding;
    const cardWidth   = 300.0;
    const cardHeight  = 190.0; // estimativa para cálculo de posição
    const margin      = 16.0;
    const gap         = 14.0;  // distância entre spotlight e tooltip

    // Posição horizontal: centralizar sobre o elemento, clampando nas bordas
    double left = targetRect.center.dx - cardWidth / 2;
    left = left.clamp(margin, screen.width - cardWidth - margin);

    // Posição vertical: preferência declarada, ajustada pelo espaço disponível
    final spaceBelow = screen.height - targetRect.bottom - safePadding.bottom;
    final spaceAbove = targetRect.top - safePadding.top;
    final preferBelow = step.tooltipPosition == TooltipPosition.below
        ? spaceBelow >= cardHeight + gap
        : spaceAbove < cardHeight + gap;

    double top;
    if (preferBelow) {
      top = targetRect.bottom + gap;
    } else {
      top = targetRect.top - cardHeight - gap;
    }
    top = top.clamp(
      safePadding.top + 52, // deixa espaço para o botão Pular
      screen.height - cardHeight - margin,
    );

    return Positioned(
      left:  left,
      top:   top,
      width: cardWidth,
      child: _TooltipCard(
        step:       step,
        currentIdx: currentIdx,
        totalSteps: totalSteps,
        isLast:     isLast,
        onNext:     onNext,
        onSkip:     onSkip,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Card do tooltip
// ─────────────────────────────────────────────────────────────────────────────

class _TooltipCard extends StatelessWidget {
  const _TooltipCard({
    required this.step,
    required this.currentIdx,
    required this.totalSteps,
    required this.isLast,
    required this.onNext,
    required this.onSkip,
  });

  final TutorialStep step;
  final int currentIdx;
  final int totalSteps;
  final bool isLast;
  final VoidCallback onNext;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.22),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
          border: Border.all(
            color: AppTheme.primary.withValues(alpha: 0.25),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Barra gradiente no topo
            Container(
              height: 3,
              decoration: const BoxDecoration(
                gradient: AppTheme.gradientPrimary,
                borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Título
                  Text(
                    step.title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primary,
                        ),
                  ),
                  const SizedBox(height: 6),
                  // Descrição
                  Text(
                    step.description,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: cs.onSurface.withValues(alpha: 0.75),
                          height: 1.45,
                        ),
                  ),
                  const SizedBox(height: 14),
                  // Indicadores de passo + botões
                  Row(
                    children: [
                      // Dots de progresso
                      Expanded(
                        child: _StepDots(
                          current: currentIdx,
                          total:   totalSteps,
                        ),
                      ),
                      // Botão Próximo / Concluir
                      _GradientButton(
                        label:   isLast ? 'Concluir ✓' : 'Próximo',
                        onTap:   onNext,
                        compact: true,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Indicadores de passo (dots)
// ─────────────────────────────────────────────────────────────────────────────

class _StepDots extends StatelessWidget {
  const _StepDots({required this.current, required this.total});
  final int current;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(total, (i) {
        final active = i == current;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width:  active ? 18 : 6,
          height: 6,
          margin: const EdgeInsets.only(right: 4),
          decoration: BoxDecoration(
            color: active
                ? AppTheme.primary
                : AppTheme.primary.withValues(alpha: 0.25),
            borderRadius: BorderRadius.circular(3),
          ),
        );
      }),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Botão gradiente reutilizável
// ─────────────────────────────────────────────────────────────────────────────

class _GradientButton extends StatelessWidget {
  const _GradientButton({
    required this.label,
    required this.onTap,
    this.compact = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: compact
            ? const EdgeInsets.symmetric(horizontal: 16, vertical: 8)
            : const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        decoration: BoxDecoration(
          gradient: AppTheme.gradientPrimary,
          borderRadius: BorderRadius.circular(compact ? 10 : 12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color:      Colors.white,
            fontWeight: FontWeight.w700,
            fontSize:   compact ? 13 : 15,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Botão "Pular Tutorial" (sempre visível, canto superior direito)
// ─────────────────────────────────────────────────────────────────────────────

class _SkipButton extends StatelessWidget {
  const _SkipButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: cs.surface.withValues(alpha: 0.92),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: cs.outline.withValues(alpha: 0.3),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.close_rounded,
              size: 14,
              color: cs.onSurface.withValues(alpha: 0.55),
            ),
            const SizedBox(width: 5),
            Text(
              'Pular Tutorial',
              style: TextStyle(
                fontSize:   13,
                fontWeight: FontWeight.w600,
                color:      cs.onSurface.withValues(alpha: 0.55),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
