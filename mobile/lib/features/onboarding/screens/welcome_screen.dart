// lib/features/onboarding/screens/welcome_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/providers/brand_provider.dart';
import '../../../shared/tutorial/tutorial_provider.dart';
import '../../../shared/tutorial/tutorial_phases.dart';
import '../../../shared/tutorial/tutorial_service.dart';
import '../domain/professional_update.dart';
import '../providers/professional_updates_provider.dart';
import '../providers/welcome_provider.dart';

// ─── Kinify built-in updates ──────────────────────────────────────────────────

class _AppUpdate {
  final String emoji;
  final String title;
  final List<String> items;
  final String date;
  const _AppUpdate({
    required this.emoji,
    required this.title,
    required this.items,
    required this.date,
  });
}

const _kinifyUpdates = <_AppUpdate>[
  _AppUpdate(
    emoji: '🚀',
    title: 'Lançamento do Kinify!',
    date: 'Mar 2026',
    items: [
      'Treinos com timer de descanso e âncora flutuante',
      'Nutrição: calorias, macros, hidratação e peso corporal',
      'Análises com gráficos de progresso e recordes pessoais',
      'Comunidade: grupos, desafios e conquistas',
      'Tour guiado pelo app disponível nas configurações',
    ],
  ),
];

// ─── Tela ─────────────────────────────────────────────────────────────────────

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  /// true = showing Kinify updates; false = showing professional updates
  bool _showingKinify = false;

  Future<void> _continue() async {
    ref.read(welcomeProvider).markSeen();

    final tutorialDone =
        await TutorialService.isPhaseCompleted(TutorialPhases.mainApp);
    if (!tutorialDone && mounted) {
      ref.read(tutorialProvider.notifier).start(
            TutorialPhases.mainApp,
            TutorialPhases.mainAppSteps,
          );
    }

    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final proUpdatesAsync = ref.watch(professionalUpdatesProvider);
    final brand           = ref.watch(brandProvider);
    final bottomPadding   = MediaQuery.of(context).padding.bottom;

    // Determine which updates to show
    final proUpdates = proUpdatesAsync.valueOrNull ?? [];
    final hasProUpdates = proUpdates.isNotEmpty;

    // If no professional updates exist, always show Kinify
    final showingKinify = !hasProUpdates || _showingKinify;

    return PopScope(
      canPop: false,
      child: Scaffold(
        body: Column(
          children: [
            // ── Hero ────────────────────────────────────────────────────────
            _HeroHeader(),

            // ── Toggle (only when professional has updates) ──────────────────
            if (hasProUpdates)
              _SourceToggle(
                showingKinify: showingKinify,
                brandName: brand?.name,
                onToggle: () => setState(() => _showingKinify = !_showingKinify),
              ),

            // ── Updates list ─────────────────────────────────────────────────
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                children: [
                  Row(
                    children: [
                      const Text('📣', style: TextStyle(fontSize: 18)),
                      const SizedBox(width: 8),
                      Text(
                        'Novidades',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  if (showingKinify)
                    ..._kinifyUpdates.map((u) => _KinifyUpdateCard(update: u))
                  else
                    ...proUpdates.map((u) => _ProUpdateCard(update: u)),
                ],
              ),
            ),

            // ── Continue button ───────────────────────────────────────────────
            Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, bottomPadding + 20),
              child: SizedBox(
                width: double.infinity,
                child: _ContinueButton(onTap: _continue),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Source toggle ────────────────────────────────────────────────────────────

class _SourceToggle extends StatelessWidget {
  const _SourceToggle({
    required this.showingKinify,
    required this.brandName,
    required this.onToggle,
  });
  final bool showingKinify;
  final String? brandName;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final cs    = Theme.of(context).colorScheme;
    final label = showingKinify
        ? 'Ver novidades de ${brandName ?? 'seu profissional'}'
        : 'Ver novidades do Kinify';

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      child: GestureDetector(
        onTap: onToggle,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: cs.primaryContainer,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.swap_horiz_rounded, size: 16, color: cs.onPrimaryContainer),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: cs.onPrimaryContainer,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

class _HeroHeader extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topPadding = MediaQuery.of(context).padding.top;
    final cs         = Theme.of(context).colorScheme;
    final brand      = ref.watch(brandProvider);
    final logoUrl    = brand?.logoUrl;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius:
            const BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(24, topPadding + 28, 24, 32),
      child: Column(
        children: [
          logoUrl != null
              ? Image.network(
                  logoUrl,
                  width: 200,
                  height: 80,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => _kinifyLogo(),
                )
              : _kinifyLogo(),
          const SizedBox(height: 16),
          Text(
            'Bem-vindo de volta! 👋',
            style: TextStyle(
              color: cs.onSurface.withValues(alpha: 0.75),
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }

  Widget _kinifyLogo() => Image.asset(
        'assets/images/logo.png',
        width: 200,
        height: 80,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) =>
            const Text('🏋️', style: TextStyle(fontSize: 48)),
      );
}

// ─── Kinify update card ───────────────────────────────────────────────────────

class _KinifyUpdateCard extends ConsumerWidget {
  const _KinifyUpdateCard({required this.update});
  final _AppUpdate update;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme    = Theme.of(context);
    final cs       = theme.colorScheme;
    final cardBg   = theme.cardTheme.color ?? cs.surface;
    final gradient = ref.watch(brandGradientProvider);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
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
            decoration: BoxDecoration(gradient: gradient),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(update.emoji, style: const TextStyle(fontSize: 20)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        update.title,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  update.date,
                  style: TextStyle(
                    fontSize: 12,
                    color: cs.onSurface.withValues(alpha: 0.45),
                  ),
                ),
                const SizedBox(height: 12),
                ...update.items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 5),
                          child: Container(
                            width: 5,
                            height: 5,
                            decoration: BoxDecoration(
                              color: cs.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            item,
                            style: TextStyle(
                              fontSize: 13,
                              color: cs.onSurface.withValues(alpha: 0.75),
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Professional update card ─────────────────────────────────────────────────

class _ProUpdateCard extends ConsumerWidget {
  const _ProUpdateCard({required this.update});
  final ProfessionalUpdate update;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme    = Theme.of(context);
    final cs       = theme.colorScheme;
    final cardBg   = theme.cardTheme.color ?? cs.surface;
    final gradient = ref.watch(brandGradientProvider);

    final dateLabel = _formatDate(update.publishedAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cs.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
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
            decoration: BoxDecoration(gradient: gradient),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(update.emoji, style: const TextStyle(fontSize: 20)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        update.title,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  dateLabel,
                  style: TextStyle(
                    fontSize: 12,
                    color: cs.onSurface.withValues(alpha: 0.45),
                  ),
                ),
                const SizedBox(height: 12),
                ...update.items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 5),
                          child: Container(
                            width: 5,
                            height: 5,
                            decoration: BoxDecoration(
                              color: cs.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            item,
                            style: TextStyle(
                              fontSize: 13,
                              color: cs.onSurface.withValues(alpha: 0.75),
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];
    return '${months[dt.month - 1]} ${dt.year}';
  }
}

// ─── Continue button ──────────────────────────────────────────────────────────

class _ContinueButton extends ConsumerWidget {
  const _ContinueButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs             = Theme.of(context).colorScheme;
    final highlightColor = ref.watch(brandProvider)?.highlightColor;
    final gradient       = ref.watch(brandGradientProvider);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: highlightColor,
          gradient: highlightColor == null ? gradient : null,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: (highlightColor ?? cs.primary).withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Continuar',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            SizedBox(width: 8),
            Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
          ],
        ),
      ),
    );
  }
}
