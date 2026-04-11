// lib/features/auth/data/auth_service.dart
import 'package:dio/dio.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../auth/domain/auth_user.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/config/env.dart';

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  final _dio = DioClient.instance.dio;
  Dio get dio => _dio;

  final _googleSignIn = GoogleSignIn(
    clientId: Env.googleClientId,
    scopes: ['email', 'profile'],
  );

  // ─── Register ──────────────────────────────────────────────────────────────

  Future<AuthUser> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    final res = await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      'displayName': displayName,
    });
    return _handleAuthResponse(res.data as Map<String, dynamic>);
  }

  // ─── Login com email/senha ──────────────────────────────────────────────────

  Future<AuthUser> loginWithEmailPassword({
    required String email,
    required String password,
  }) async {
    final res = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return _handleAuthResponse(res.data as Map<String, dynamic>);
  }

  // ─── Login com Google ───────────────────────────────────────────────────────

  Future<AuthUser?> loginWithGoogle() async {
    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) return null; // usuário cancelou

    final googleAuth = await googleUser.authentication;
    final idToken = googleAuth.idToken;
    if (idToken == null) throw Exception('Google idToken nulo');

    final res = await _dio.post('/auth/google', data: {'idToken': idToken});
    return _handleAuthResponse(res.data as Map<String, dynamic>);
  }

  // ─── Upload avatar ──────────────────────────────────────────────────────────

  Future<AuthUser> uploadAvatar(String filePath) async {
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(filePath, filename: 'avatar.jpg'),
    });
    final res = await _dio.post('/auth/avatar', data: formData);
    return AuthUser.fromJson(res.data as Map<String, dynamic>);
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  Future<void> logout() async {
    await Future.wait([
      _googleSignIn.signOut().catchError((_) => null),
      SecureStorage.instance.clearAll(),
    ]);
  }

  // ─── Recuperar usuário atual (valida token) ──────────────────────────────────

  Future<AuthUser?> getCurrentUser() async {
    final token = await SecureStorage.instance.getToken();
    if (token == null) return null;

    try {
      final res = await _dio.get('/auth/me');
      final data = res.data['data'] ?? res.data;
      return AuthUser.fromJson(data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  // ─── Refresh token ──────────────────────────────────────────────────────────

  Future<void> refreshToken() async {
    final refreshToken = await SecureStorage.instance.getRefreshToken();
    if (refreshToken == null) return;

    final res = await _dio.post(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    final data = res.data as Map<String, dynamic>;
    await SecureStorage.instance.saveTokens(
      token: data['token'] as String,
      refreshToken: data['refreshToken'] as String,
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  Future<AuthUser> _handleAuthResponse(Map<String, dynamic> data) async {
    final token = data['token'] as String;
    final refreshToken = data['refreshToken'] as String;
    final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);

    await SecureStorage.instance.saveTokens(
      token: token,
      refreshToken: refreshToken,
    );
    await SecureStorage.instance.saveUserId(user.uid);

    return user;
  }
}
