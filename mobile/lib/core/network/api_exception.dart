// lib/core/network/api_exception.dart
class ApiException implements Exception {
  final int statusCode;
  final String message;
  final String? code;

  const ApiException({
    required this.statusCode,
    required this.message,
    this.code,
  });

  factory ApiException.fromJson(Map<String, dynamic> json, int statusCode) {
    return ApiException(
      statusCode: statusCode,
      message: json['message'] as String? ?? 'Erro desconhecido',
      code: json['code'] as String?,
    );
  }

  bool get isUnauthorized => statusCode == 401;
  bool get isNotFound => statusCode == 404;
  bool get isConflict => statusCode == 409;
  bool get isTokenExpired => code == 'TOKEN_EXPIRED';

  @override
  String toString() => 'ApiException($statusCode): $message';
}
