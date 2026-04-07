// lib/features/auth/providers/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_service.dart';
import '../domain/auth_user.dart';

// Estado de autenticação
sealed class AuthState {
  const AuthState();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  final AuthUser user;
  const AuthAuthenticated(this.user);
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
}

// Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthLoading()) {
    _init();
  }

  final _service = AuthService.instance;

  Future<void> _init() async {
    final user = await _service.getCurrentUser();
    state = user != null
        ? AuthAuthenticated(user)
        : const AuthUnauthenticated();
  }

  Future<void> loginWithEmailPassword({
    required String email,
    required String password,
  }) async {
    state = const AuthLoading();
    try {
      final user = await _service.loginWithEmailPassword(
        email: email,
        password: password,
      );
      state = AuthAuthenticated(user);
    } catch (e) {
      state = AuthError(e.toString());
    }
  }

  Future<void> loginWithGoogle() async {
    state = const AuthLoading();
    try {
      final user = await _service.loginWithGoogle();
      if (user != null) {
        state = AuthAuthenticated(user);
      } else {
        state = const AuthUnauthenticated();
      }
    } catch (e) {
      state = AuthError(e.toString());
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    state = const AuthLoading();
    try {
      final user = await _service.register(
        email: email,
        password: password,
        displayName: displayName,
      );
      state = AuthAuthenticated(user);
    } catch (e) {
      state = AuthError(e.toString());
    }
  }

  Future<void> logout() async {
    await _service.logout();
    state = const AuthUnauthenticated();
  }

  Future<void> updateDisplayName(String displayName) async {
    final current = state;
    if (current is! AuthAuthenticated) return;
    final updated = current.user.copyWith(displayName: displayName);
    state = AuthAuthenticated(updated);
    // Persiste no backend via PUT /auth/profile
    try {
      await _service.dio.put('/auth/profile', data: {'displayName': displayName});
    } catch (_) {
      state = current; // rollback
    }
  }

  Future<void> updatePrivacy(bool isPrivate) async {
    final current = state;
    if (current is! AuthAuthenticated) return;
    final updated = current.user.copyWith(isPrivate: isPrivate);
    state = AuthAuthenticated(updated);
    try {
      await _service.dio.put('/auth/profile', data: {'isPrivate': isPrivate});
    } catch (_) {
      state = current; // rollback
    }
  }

  AuthUser? get currentUser =>
      state is AuthAuthenticated ? (state as AuthAuthenticated).user : null;
}

// Providers
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (_) => AuthNotifier(),
);

final currentUserProvider = Provider<AuthUser?>((ref) {
  final authState = ref.watch(authProvider);
  if (authState is AuthAuthenticated) return authState.user;
  return null;
});
