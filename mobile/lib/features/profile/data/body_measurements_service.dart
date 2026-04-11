// lib/features/profile/data/body_measurements_service.dart
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../domain/body_measurement.dart';

class BodyMeasurementsService {
  static final BodyMeasurementsService instance = BodyMeasurementsService._();
  BodyMeasurementsService._();

  final _dio = DioClient.instance.dio;

  Future<List<BodyMeasurement>> list(String userId) async {
    final res = await _dio.get('/body/$userId/measurements');
    return (res.data['data'] as List)
        .whereType<Map<String, dynamic>>()
        .map(BodyMeasurement.fromJson)
        .toList();
  }

  Future<BodyMeasurement> create(String userId, Map<String, dynamic> data) async {
    final res = await _dio.post('/body/$userId/measurements', data: data);
    return BodyMeasurement.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> delete(String userId, String id) async {
    await _dio.delete('/body/$userId/measurements/$id');
  }

  Future<BodyMeasurement> uploadPhoto(String userId, String measurementId, String filePath) async {
    final formData = FormData.fromMap({
      'photo': await MultipartFile.fromFile(filePath),
    });
    final res = await _dio.post(
      '/body/$userId/measurements/$measurementId/photos',
      data: formData,
    );
    return BodyMeasurement.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<BodyMeasurement> deletePhoto(String userId, String measurementId, String url) async {
    final res = await _dio.delete(
      '/body/$userId/measurements/$measurementId/photos',
      data: {'url': url},
    );
    return BodyMeasurement.fromJson(res.data['data'] as Map<String, dynamic>);
  }
}
