// lib/features/nutrition/data/voice_parse_service.dart
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/network/api_exception.dart';
import 'photo_analyze_service.dart';

class VoiceParseService {
  static final VoiceParseService instance = VoiceParseService._();
  VoiceParseService._();

  final _dio = DioClient.instance.dio;

  Future<PhotoAnalyzeResult> parse(String text) async {
    try {
      final res = await _dio.post(
        '/nutrition/voice-parse',
        data: {'text': text},
        options: Options(receiveTimeout: const Duration(seconds: 30)),
      );
      return PhotoAnalyzeResult.fromJson(res.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.error is ApiException) {
        throw Exception((e.error as ApiException).message);
      }
      if (e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Tempo limite excedido. Tente novamente.');
      }
      throw Exception('Erro ao processar o áudio. Tente novamente.');
    } on ApiException catch (e) {
      throw Exception(e.message);
    }
  }
}
