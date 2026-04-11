// lib/app.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'features/equipe/providers/equipe_provider.dart';
import 'features/notifications/services/push_notification_service.dart';
import 'shared/theme/app_theme.dart';
import 'shared/providers/settings_provider.dart';
import 'shared/providers/brand_provider.dart';

/// Global key so any widget can show a SnackBar without a BuildContext,
/// and so the ScaffoldMessengerState survives MaterialApp rebuilds.
final rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

class GymTrackerApp extends ConsumerStatefulWidget {
  const GymTrackerApp({super.key});

  @override
  ConsumerState<GymTrackerApp> createState() => _GymTrackerAppState();
}

class _GymTrackerAppState extends ConsumerState<GymTrackerApp>
    with WidgetsBindingObserver {
  Timer? _brandRefreshTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Refresh brand data every 2 minutes while in foreground
    _brandRefreshTimer = Timer.periodic(const Duration(minutes: 2), (_) {
      _refreshLinks();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _brandRefreshTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Refresh links (and therefore brand) when app comes back to foreground
    if (state == AppLifecycleState.resumed) {
      _refreshLinks();
    }
  }

  void _refreshLinks() {
    // Only refresh if the notifier is available (user is logged in, not a pro)
    try {
      ref.read(myLinksProvider.notifier).refresh();
    } catch (_) {
      // Provider may not be active yet — safe to ignore
    }
  }

  @override
  Widget build(BuildContext context) {
    final router          = ref.watch(routerProvider);
    // Passa o router para o PushNotificationService poder navegar ao tocar em notificação
    PushNotificationService.instance.setRouter(router);
    final themeMode       = ref.watch(settingsProvider.select((s) => s.flutterThemeMode));
    final brandColor      = ref.watch(brandColorProvider);
    final brandSurface    = ref.watch(brandSurfaceColorProvider);
    final brandOnSurface  = ref.watch(brandOnSurfaceColorProvider);
    final brandAppBar     = ref.watch(brandAppBarColorProvider);
    final brandNavBar     = ref.watch(brandNavBarColorProvider);
    final brandCard       = ref.watch(brandCardColorProvider);

    return MaterialApp.router(
      title: 'Kinify',
      scaffoldMessengerKey: rootScaffoldMessengerKey,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.withBrandFull(
        primaryColor:    brandColor,
        surfaceColor:    brandSurface,
        onSurfaceColor:  brandOnSurface,
        appBarColor:     brandAppBar,
        navBarColor:     brandNavBar,
        cardColor:       brandCard,
      ),
      darkTheme: AppTheme.darkWithBrandFull(
        primaryColor:    brandColor,
        surfaceColor:    brandSurface,
        onSurfaceColor:  brandOnSurface,
        appBarColor:     brandAppBar,
        navBarColor:     brandNavBar,
        cardColor:       brandCard,
      ),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
