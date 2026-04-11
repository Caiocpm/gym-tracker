// lib/shared/widgets/main_scaffold.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/workouts/providers/workouts_provider.dart';
import '../../features/workouts/providers/rest_timer_provider.dart';
import '../../features/workouts/screens/workout_session_screen.dart';
import '../../features/professional/providers/professional_provider.dart';
import '../../features/equipe/providers/equipe_provider.dart';
import '../providers/brand_provider.dart';
import '../tutorial/tutorial_keys.dart';
import '../tutorial/tutorial_overlay.dart';

class MainScaffold extends ConsumerStatefulWidget {
  const MainScaffold({super.key, required this.child});
  final Widget child;

  @override
  ConsumerState<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends ConsumerState<MainScaffold> {
  Timer? _elapsedTimer;
  Offset? _anchorOffset; // null = not yet initialized
  OverlayEntry? _tutorialEntry;

  @override
  void initState() {
    super.initState();
    _elapsedTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      try {
        if (mounted && ref.read(activeSessionProvider).isActive) {
          setState(() {});
        }
      } catch (_) {
        // Widget deactivated mid-tick — ignore safely
      }
    });
    // Insere o overlay do tutorial acima de tudo (inclusive BottomNav)
    WidgetsBinding.instance.addPostFrameCallback((_) => _insertTutorialOverlay());
  }

  void _insertTutorialOverlay() {
    if (!mounted) return;
    final overlay   = Overlay.of(context, rootOverlay: true);
    final container = ProviderScope.containerOf(context);
    _tutorialEntry  = OverlayEntry(
      builder: (_) => UncontrolledProviderScope(
        container: container,
        child: const TutorialOverlay(),
      ),
    );
    overlay.insert(_tutorialEntry!);
  }

  @override
  void dispose() {
    _elapsedTimer?.cancel();
    _tutorialEntry?.remove();
    _tutorialEntry = null;
    super.dispose();
  }

  static const _professionalTabs = [
    (icon: Icons.home_outlined,       label: 'Home',          path: '/'),
    (icon: Icons.fitness_center,      label: 'Treinos',       path: '/workouts'),
    (icon: Icons.restaurant,          label: 'Nutrição',      path: '/nutrition'),
    (icon: Icons.group,               label: 'Social',        path: '/social'),
    (icon: Icons.people_alt_outlined, label: 'Clientes',      path: '/clients'),
  ];

  static const _userTabsMarketplace = [
    (icon: Icons.home_outlined,     label: 'Home',          path: '/'),
    (icon: Icons.fitness_center,    label: 'Treinos',       path: '/workouts'),
    (icon: Icons.restaurant,        label: 'Nutrição',      path: '/nutrition'),
    (icon: Icons.group,             label: 'Social',        path: '/social'),
    (icon: Icons.search,            label: 'Profissionais', path: '/marketplace'),
  ];

  static const _userTabsEquipe = [
    (icon: Icons.home_outlined,     label: 'Home',          path: '/'),
    (icon: Icons.fitness_center,    label: 'Treinos',       path: '/workouts'),
    (icon: Icons.restaurant,        label: 'Nutrição',      path: '/nutrition'),
    (icon: Icons.group,             label: 'Social',        path: '/social'),
    (icon: Icons.people_alt,        label: 'Equipe',        path: '/equipe'),
  ];

  List<({IconData icon, String label, String path})> _tabs(
          bool isProfessional, bool hasActiveLink) {
    if (isProfessional) return _professionalTabs;
    return hasActiveLink ? _userTabsEquipe : _userTabsMarketplace;
  }

  int _currentIndex(BuildContext context, bool isProfessional) {
    final hasActiveLink = ref.read(hasActiveLinkProvider);
    final location = GoRouterState.of(context).matchedLocation;
    final tabs = _tabs(isProfessional, hasActiveLink);
    // /workout-day/... belongs to the Treinos tab
    if (location.startsWith('/workout-day')) {
      final idx = tabs.indexWhere((t) => t.path == '/workouts');
      if (idx >= 0) return idx;
    }
    for (int i = 0; i < tabs.length; i++) {
      final p = tabs[i].path;
      if (p == '/' ? location == '/' : location.startsWith(p)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    // Navigate to /equipe as soon as a link_accepted event arrives
    ref.listen(linkAcceptedSignalProvider, (prev, next) {
      if (prev != null && next > prev) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) context.go('/equipe');
        });
      }
    });

    final notifState = ref.watch(notificationsProvider);
    final session = ref.watch(activeSessionProvider);
    final restTimer = ref.watch(restTimerProvider);
    final isProfessional = ref.watch(isProfessionalProvider);
    final hasActiveLink  = ref.watch(hasActiveLinkProvider);

    final unreadCount = notifState.maybeWhen(
      data: (list) => list.where((n) => !n.isRead).length,
      orElse: () => 0,
    );

    const anchorWidth = 200.0;
    const anchorHeight = 76.0;

    return Scaffold(
      body: Column(
        children: [
          _GlobalAppBar(unreadCount: unreadCount),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                // Inicializa próximo ao canto inferior direito da área real do Stack
                _anchorOffset ??= Offset(
                  constraints.maxWidth - anchorWidth - 12,
                  constraints.maxHeight - anchorHeight - 12,
                );

                return Stack(
                  children: [
                    widget.child,
                    if (session.isActive)
                      Positioned(
                        left: _anchorOffset!.dx,
                        top: _anchorOffset!.dy,
                        child: GestureDetector(
                          onPanUpdate: (d) {
                            setState(() {
                              _anchorOffset = Offset(
                                (_anchorOffset!.dx + d.delta.dx)
                                    .clamp(0, constraints.maxWidth - anchorWidth),
                                (_anchorOffset!.dy + d.delta.dy)
                                    .clamp(0, constraints.maxHeight - anchorHeight),
                              );
                            });
                          },
                          child: SizedBox(
                            width: anchorWidth,
                            child: _SessionAnchor(
                              session: session,
                              restTimer: restTimer,
                              onTap: () =>
                                  showWorkoutSessionSheet(context, session.dayId!),
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: KeyedSubtree(
        key: TutorialKeys.bottomNav,
        child: _FloatingNavBar(
          tabs: _tabs(isProfessional, hasActiveLink),
          currentIndex: _currentIndex(context, isProfessional),
          onTap: (i) => context.go(_tabs(isProfessional, hasActiveLink)[i].path),
        ),
      ),
    );
  }
}

// ─── AppBar global ────────────────────────────────────────────────────────────

class _GlobalAppBar extends ConsumerWidget {
  const _GlobalAppBar({required this.unreadCount});
  final int unreadCount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme  = Theme.of(context);
    final cs     = theme.colorScheme;
    final appBarBg = theme.appBarTheme.backgroundColor ?? cs.surface;
    final brand  = ref.watch(brandProvider);
    return Material(
      color: appBarBg,
      child: SafeArea(
        bottom: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: 44,
              child: Row(
                children: [
                  Expanded(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: IconButton(
                        key: TutorialKeys.profileButton,
                        tooltip: 'Perfil',
                        onPressed: () => GoRouter.of(context).go('/profile'),
                        icon: const Icon(Icons.person_outline),
                      ),
                    ),
                  ),
                  // Brand logo replaces Kinify logo when configured
                  if (brand?.logoUrl != null)
                    Image.network(
                      brand!.logoUrl!,
                      height: 28,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => _BrandNameOrLogo(brand: brand, showName: false),
                    )
                  else if (brand?.name != null)
                    _BrandNameOrLogo(brand: brand!)
                  else
                    Image.asset(
                      'assets/images/logo.png',
                      height: 28,
                      fit: BoxFit.contain,
                    ),
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        IconButton(
                          key: TutorialKeys.notifButton,
                          tooltip: 'Notificações',
                          onPressed: () => GoRouter.of(context).go('/notifications'),
                          icon: unreadCount > 0
                              ? Badge(
                                  label: Text(
                                    unreadCount > 99 ? '99+' : '$unreadCount',
                                    style: const TextStyle(fontSize: 10),
                                  ),
                                  child: const Icon(Icons.notifications_outlined),
                                )
                              : const Icon(Icons.notifications_outlined),
                        ),
                        IconButton(
                          tooltip: 'Configurações',
                          onPressed: () => GoRouter.of(context).go('/settings'),
                          icon: const Icon(Icons.settings_outlined),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Divider(
              height: 1,
              thickness: 0.5,
              color: cs.onSurface.withValues(alpha: 0.1),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Âncora de sessão flutuante ───────────────────────────────────────────────

class _SessionAnchor extends ConsumerWidget {
  const _SessionAnchor({
    required this.session,
    required this.restTimer,
    required this.onTap,
  });

  final ActiveSessionState session;
  final RestTimerState restTimer;
  final VoidCallback onTap;

  String _formatElapsed(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = seconds % 60;
    if (h > 0) return '${h}h ${m.toString().padLeft(2, '0')}m';
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gradient = ref.watch(brandGradientProvider);
    final highlight = ref.watch(brandHighlightProvider);
    final isResting = restTimer.isActive;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: highlight.withValues(alpha: 0.35),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: Row(
                children: [
                  Icon(
                    isResting ? Icons.hourglass_bottom : Icons.fitness_center,
                    color: Colors.white,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isResting
                              ? (restTimer.exerciseName ?? session.dayName ?? 'Treino em andamento')
                              : (session.dayName ?? 'Treino em andamento'),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          isResting
                              ? 'Descansando: ${restTimer.formatted}'
                              : _formatElapsed(session.elapsedSeconds),
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _CompletedBadge(session: session, fgColor: Colors.white, highlight: highlight),
                ],
              ),
            ),
            // Barra neon de progresso do descanso
            if (isResting)
              LinearProgressIndicator(
                value: restTimer.progress,
                minHeight: 4,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                valueColor: AlwaysStoppedAnimation<Color>(highlight),
              ),
          ],
        ),
      ),
    );
  }
}

class _CompletedBadge extends StatelessWidget {
  const _CompletedBadge({
    required this.session,
    required this.fgColor,
    required this.highlight,
  });
  final ActiveSessionState session;
  final Color fgColor;
  final Color highlight;

  @override
  Widget build(BuildContext context) {
    final completed = session.exercises
        .fold<int>(0, (s, e) => s + e.sets.where((s) => s.isCompleted).length);
    final total = session.exercises
        .fold<int>(0, (s, e) => s + e.sets.length);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: highlight.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$completed/$total',
        style: TextStyle(
          color: fgColor,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

// ─── Floating pill navbar ─────────────────────────────────────────────────────

class _FloatingNavBar extends ConsumerWidget {
  const _FloatingNavBar({
    required this.tabs,
    required this.currentIndex,
    required this.onTap,
  });

  final List<({IconData icon, String label, String path})> tabs;
  final int currentIndex;
  final void Function(int) onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme   = Theme.of(context);
    final cs      = theme.colorScheme;
    final isDark  = theme.brightness == Brightness.dark;
    final primary = cs.primary;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: Container(
          height: 62,
          decoration: BoxDecoration(
            color: isDark ? cs.surfaceContainer : cs.surface,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : Colors.black.withValues(alpha: 0.06),
            ),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.45)
                    : Colors.black.withValues(alpha: 0.10),
                blurRadius: 24,
                offset: const Offset(0, 6),
              ),
              if (!isDark)
                BoxShadow(
                  color: primary.withValues(alpha: 0.10),
                  blurRadius: 32,
                  offset: const Offset(0, 10),
                ),
            ],
          ),
          child: Row(
            children: List.generate(tabs.length, (i) {
              final isActive = i == currentIndex;
              final tab = tabs[i];
              return Expanded(
                child: GestureDetector(
                  onTap: () => onTap(i),
                  behavior: HitTestBehavior.opaque,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      curve: Curves.easeInOut,
                      decoration: BoxDecoration(
                        color: isActive
                            ? primary.withValues(alpha: isDark ? 0.18 : 0.12)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(26),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 220),
                            curve: Curves.easeInOut,
                            child: Icon(
                              tab.icon,
                              color: isActive ? primary : cs.onSurfaceVariant,
                              size: 22,
                            ),
                          ),
                          AnimatedSize(
                            duration: const Duration(milliseconds: 200),
                            curve: Curves.easeInOut,
                            child: isActive
                                ? Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      tab.label,
                                      style: TextStyle(
                                        color: primary,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                        height: 1.0,
                                      ),
                                    ),
                                  )
                                : const SizedBox(height: 0),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

// ─── Brand name fallback widget ───────────────────────────────────────────────

class _BrandNameOrLogo extends StatelessWidget {
  const _BrandNameOrLogo({required this.brand, this.showName = true});
  final BrandData brand;
  final bool showName;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: brand.color ?? Theme.of(context).colorScheme.primary,
            borderRadius: BorderRadius.circular(7),
          ),
          child: Center(
            child: Text(
              (brand.name ?? 'B').substring(0, 1).toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 14,
              ),
            ),
          ),
        ),
        if (showName && brand.name != null) ...[
          const SizedBox(width: 8),
          Text(
            brand.name!,
            style: TextStyle(
              color: brand.color ?? Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w800,
              fontSize: 15,
            ),
          ),
        ],
      ],
    );
  }
}
