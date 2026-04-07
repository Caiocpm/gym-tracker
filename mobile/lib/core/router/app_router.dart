// lib/core/router/app_router.dart
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/onboarding/providers/welcome_provider.dart';
import '../../features/onboarding/screens/welcome_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/workouts/screens/workouts_screen.dart';
import '../../features/workouts/screens/workout_day_screen.dart';
import '../../features/nutrition/screens/nutrition_screen.dart';
import '../../features/social/screens/social_screen.dart';
import '../../features/social/screens/group_detail_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/analytics/screens/analytics_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../features/professional/screens/clients_screen.dart';
import '../../features/professional/screens/client_detail_screen.dart';
import '../../features/marketplace/screens/marketplace_screen.dart';
import '../../features/marketplace/screens/professional_profile_screen.dart';
import '../../features/equipe/screens/equipe_screen.dart';
import '../../features/equipe/screens/professional_detail_screen.dart';
import '../../shared/widgets/main_scaffold.dart';

// Notifier que avisa o GoRouter quando o estado de auth muda
class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(this._ref) {
    _ref.listen<AuthState>(authProvider, (_, __) => notifyListeners());
  }
  final Ref _ref;
  AuthState get authState => _ref.read(authProvider);
}

final routerProvider = Provider<GoRouter>((ref) {
  final authNotifier    = _AuthChangeNotifier(ref);
  final welcomeNotifier = ref.read(welcomeProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: Listenable.merge([authNotifier, welcomeNotifier]),
    redirect: (context, state) {
      final authState       = authNotifier.authState;
      final isAuthenticated = authState is AuthAuthenticated;
      final isLoading       = authState is AuthLoading;
      final loc             = state.matchedLocation;
      final isAuthRoute     = loc == '/login' || loc == '/register';
      final isWelcome       = loc == '/welcome';

      if (isLoading) return null;
      if (!isAuthenticated && !isAuthRoute) return '/login';
      if (isAuthenticated && isAuthRoute) return '/';

      // Redireciona para boas-vindas a cada abertura do app (flag em memória)
      if (isAuthenticated && !isWelcome && !welcomeNotifier.seen) {
        return '/welcome';
      }

      return null;
    },
    routes: [
      // ─── Auth ─────────────────────────────────────────────────────────────
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),

      // ─── Boas-vindas (fora do shell — sem bottom navigation) ──────────────
      GoRoute(path: '/welcome', builder: (_, __) => const WelcomeScreen()),

      // ─── App principal (com bottom navigation) ────────────────────────────
      ShellRoute(
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          GoRoute(
            path: '/',
            builder: (_, __) => const HomeScreen(),
          ),
          GoRoute(
            path: '/workouts',
            builder: (_, __) => const WorkoutsScreen(),
          ),
          GoRoute(
            path: '/nutrition',
            builder: (_, __) => const NutritionScreen(),
          ),
          GoRoute(
            path: '/social',
            builder: (_, __) => const SocialScreen(),
            routes: [
              GoRoute(
                path: 'groups/:groupId',
                builder: (_, state) => GroupDetailScreen(
                  groupId: state.pathParameters['groupId']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/analytics',
            builder: (_, __) => const AnalyticsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (_, __) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (_, __) => const NotificationsScreen(),
          ),
          // ─── Detalhe do dia de treino (dentro do shell — exibe bottom nav) ──
          GoRoute(
            path: '/workout-day/:dayId',
            builder: (_, state) => WorkoutDayScreen(
              dayId: state.pathParameters['dayId']!,
            ),
          ),
          GoRoute(
            path: '/settings',
            builder: (_, __) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/clients',
            builder: (_, __) => const ClientsScreen(),
          ),
          GoRoute(
            path: '/clients/:linkId',
            builder: (_, state) => ClientDetailScreen(
              linkId: state.pathParameters['linkId']!,
            ),
          ),
          // ─── Marketplace (acessível apenas sem vínculo ativo) ─────────────
          GoRoute(
            path: '/marketplace',
            builder: (_, state) => MarketplaceScreen(
              initialType: state.uri.queryParameters['type'],
            ),
          ),
          GoRoute(
            path: '/marketplace/:userId',
            builder: (_, state) => ProfessionalProfileScaffold(
              userId: state.pathParameters['userId']!,
            ),
          ),
          // ─── Equipe (hub do aluno com profissional vinculado) ─────────────
          GoRoute(
            path: '/equipe',
            builder: (_, __) => const EquipeScreen(),
          ),
          GoRoute(
            path: '/equipe/:linkId',
            builder: (_, state) {
              final tabStr = state.uri.queryParameters['tab'];
              final initialTab = int.tryParse(tabStr ?? '') ?? 0;
              return ProfessionalDetailScreen(
                linkId: state.pathParameters['linkId']!,
                initialTab: initialTab.clamp(0, 2),
                initialConversationId: state.uri.queryParameters['conv'],
              );
            },
          ),
        ],
      ),
    ],
  );
});
