// lib/features/profile/data/profile_photos_service.dart
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../domain/profile_photo.dart';

class ProfilePhotosService {
  static final ProfilePhotosService instance = ProfilePhotosService._();
  ProfilePhotosService._();

  final _dio = DioClient.instance.dio;

  Future<List<ProfilePhoto>> list() async {
    final res = await _dio.get('/auth/photos');
    return (res.data as List)
        .whereType<Map<String, dynamic>>()
        .map(ProfilePhoto.fromJson)
        .toList();
  }

  Future<ProfilePhoto> upload(String filePath, {String? caption}) async {
    final formData = FormData.fromMap({
      'photo': await MultipartFile.fromFile(filePath),
      if (caption != null && caption.isNotEmpty) 'caption': caption,
    });
    final res = await _dio.post('/auth/photos', data: formData);
    return ProfilePhoto.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> delete(String id) async {
    await _dio.delete('/auth/photos/$id');
  }
}
