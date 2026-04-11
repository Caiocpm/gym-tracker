// lib/features/auth/providers/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_service.dart';
import '../domain/auth_user.dart';
import '../../notifications/services/push_notification_service.dart';

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
    if (user != null) {
      state = AuthAuthenticated(user);
      PushNotificationService.instance.registerToken();
    } else {
      state = const AuthUnauthenticated();
    }
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
      PushNotificationService.instance.registerToken();
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
        PushNotificationService.instance.registerToken();
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
      PushNotificationService.instance.registerToken();
    } catch (e) {
      state = AuthError(e.toString());
    }
  }

  Future<void> logout() async {
    await PushNotificationService.instance.unregisterToken();
    await _service.logout();
    state = const AuthUnauthenticated();
  }

  Future<void> updateDisplayName(String displayName) =>
      updateProfile(displayName: displayName);

  Future<void> updatePrivacy(bool isPrivate) =>
      updateProfile(isPrivate: isPrivate);

  Future<void> updateProfile({
    String? displayName,
    String? photoURL,
    bool? isPrivate,
    String? birthDate,
    String? sex,
    double? height,
    String? objective,
    String? activityLevel,
    String? bio,
  }) async {
    final current = state;
    if (current is! AuthAuthenticated) return;

    final updated = current.user.copyWith(
      displayName: displayName,
      photoURL: photoURL,
      isPrivate: isPrivate,
      birthDate: birthDate,
      sex: sex,
      height: height,
      objective: objective,
      activityLevel: activityLevel,
      bio: bio,
    );
    state = AuthAuthenticated(updated);

    final body = <String, dynamic>{
      if (displayName != null) 'displayName': displayName,
      if (photoURL != null) 'photoURL': photoURL,
      if (isPrivate != null) 'isPrivate': isPrivate,
      if (birthDate != null) 'birthDate': birthDate,
      if (sex != null) 'sex': sex,
      if (height != null) 'height': height,
      if (objective != null) 'objective': objective,
      if (activityLevel != null) 'activityLevel': activityLevel,
      if (bio != null) 'bio': bio,
    };

    try {
      await _service.dio.put('/auth/profile', data: body);
    } catch (_) {
      state = current; // rollback
    }
  }

  Future<void> uploadAvatar(String filePath) async {
    final current = state;
    if (current is! AuthAuthenticated) return;
    try {
      final updated = await _service.uploadAvatar(filePath);
      state = AuthAuthenticated(updated);
    } catch (_) {
      // mantém estado atual em caso de erro
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
