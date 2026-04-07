// lib/core/network/dio_client.dart
import 'package:dio/dio.dart';
import '../config/env.dart';
import '../storage/secure_storage.dart';
import 'api_exception.dart';

class DioClient {
  DioClient._();
  static final DioClient instance = DioClient._();

  late final Dio _dio = _buildDio();

  Dio get dio => _dio;

  Dio _buildDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.add(_AuthInterceptor(dio));
    dio.interceptors.add(_ErrorInterceptor());

    return dio;
  }
}

// ─── Interceptor de autenticação (injeta token + refresh automático) ──────────

class _AuthInterceptor extends Interceptor {
  _AuthInterceptor(this._dio);
  final Dio _dio;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await SecureStorage.instance.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final data = err.response?.data;
    final code = data is Map ? data['code'] : null;

    if (err.response?.statusCode == 401 && code == 'TOKEN_EXPIRED') {
      final newToken = await _refreshToken();
      if (newToken != null) {
        try {
          err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
          final retryResponse = await _dio.fetch(err.requestOptions);
          return handler.resolve(retryResponse);
        } catch (retryErr) {
          // Retry falhou — repassa o erro do retry, não o original
          if (retryErr is DioException) return handler.next(retryErr);
        }
      }
    }
    handler.next(err);
  }

  Future<String?> _refreshToken() async {
    final refreshToken = await SecureStorage.instance.getRefreshToken();
    if (refreshToken == null) return null;

    try {
      final res = await Dio().post(
        '${Env.apiBaseUrl}/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final token = res.data['token'] as String?;
      final newRefresh = res.data['refreshToken'] as String?;
      if (token != null && newRefresh != null) {
        await SecureStorage.instance.saveTokens(
          token: token,
          refreshToken: newRefresh,
        );
      }
      return token;
    } catch (_) {
      await SecureStorage.instance.clearAll();
      return null;
    }
  }
}

// ─── Interceptor de erros (converte DioException → ApiException) ──────────────

class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final response = err.response;
    final ApiException apiError;
    if (response != null) {
      final data = response.data;
      apiError = ApiException.fromJson(
        data is Map<String, dynamic> ? data : {'message': err.message ?? 'Erro'},
        response.statusCode ?? 500,
      );
    } else {
      apiError = ApiException(
        statusCode: 0,
        message: 'Sem conexão com o servidor',
      );
    }
    // Usar handler.reject em vez de throw — throw escapa do chain do Dio
    // e vira uma exceção não tratada que ignora try-catch dos chamadores.
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: DioExceptionType.unknown,
        error: apiError,
      ),
    );
  }
}
