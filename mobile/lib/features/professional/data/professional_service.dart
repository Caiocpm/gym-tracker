// lib/features/professional/data/professional_service.dart
import '../../../core/network/dio_client.dart';
import '../domain/professional_profile.dart';
import '../domain/student_link.dart';
import '../domain/professional_invitation.dart';

class ProfessionalService {
  ProfessionalService._();
  static final ProfessionalService instance = ProfessionalService._();

  final _dio = DioClient.instance.dio;

  // ─── Profile ────────────────────────────────────────────────────────────────

  Future<ProfessionalProfile?> getProfile(String userId) async {
    try {
      final res = await _dio.get('/professional/profile/$userId');
      return ProfessionalProfile.fromJson(res.data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<ProfessionalProfile> createProfile(
      Map<String, dynamic> data) async {
    final res = await _dio.post('/professional/profile', data: data);
    return ProfessionalProfile.fromJson(res.data as Map<String, dynamic>);
  }

  Future<ProfessionalProfile> updateProfile(
      String userId, Map<String, dynamic> data) async {
    final res =
        await _dio.patch('/professional/profile/$userId', data: data);
    return ProfessionalProfile.fromJson(res.data as Map<String, dynamic>);
  }

  // ─── Students ────────────────────────────────────────────────────────────────

  Future<List<StudentLink>> listStudents() async {
    final res = await _dio.get('/professional/students');
    final list = res.data as List<dynamic>;
    return list
        .map((e) => StudentLink.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> unlinkStudent(String linkId) async {
    await _dio.delete('/professional/students/$linkId');
  }

  // ─── Invitations ─────────────────────────────────────────────────────────────

  Future<List<ProfessionalInvitation>> listInvitations() async {
    final res = await _dio.get('/professional/invitations');
    final list = res.data as List<dynamic>;
    return list
        .map((e) =>
            ProfessionalInvitation.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ProfessionalInvitation> createInvitation({
    required String studentEmail,
    String accessLevel = 'read',
    String? message,
  }) async {
    final res = await _dio.post('/professional/invitations', data: {
      'studentEmail': studentEmail,
      'accessLevel': accessLevel,
      if (message != null) 'message': message,
    });
    return ProfessionalInvitation.fromJson(
        res.data as Map<String, dynamic>);
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getStats() async {
    final res = await _dio.get('/professional/stats');
    return res.data as Map<String, dynamic>;
  }
}
