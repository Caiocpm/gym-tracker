// lib/features/equipe/data/equipe_service.dart
import '../../../core/network/dio_client.dart';
import '../domain/my_professional_link.dart';

class EquipeService {
  EquipeService._();
  static final EquipeService instance = EquipeService._();

  final _dio = DioClient.instance.dio;

  /// Lista os profissionais vinculados ao aluno autenticado.
  /// Endpoint: GET /professional/student/links
  Future<List<MyProfessionalLink>> listMyProfessionals() async {
    final res = await _dio.get('/professional/student/links');
    final raw = res.data;
    final list = (raw is Map ? raw['data'] ?? raw['links'] ?? [] : raw) as List<dynamic>;
    return list
        .map((e) => MyProfessionalLink.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Busca informações do profissional antes de aceitar o convite.
  /// Endpoint: GET /professional/invitations/:code/preview
  Future<InvitationPreview> getInvitationPreview(String code) async {
    final res = await _dio.get('/professional/invitations/$code/preview');
    final data = res.data is Map && res.data['data'] != null
        ? res.data['data'] as Map<String, dynamic>
        : res.data as Map<String, dynamic>;
    return InvitationPreview.fromJson(data);
  }

  /// Aceita um convite via código, registrando as especialidades contratadas.
  /// Endpoint: POST /professional/invitations/:code/accept
  Future<MyProfessionalLink> acceptInvitation(
      String code, List<String> contractedTypes) async {
    final res = await _dio.post(
      '/professional/invitations/$code/accept',
      data: {'contractedTypes': contractedTypes},
    );
    final data = res.data is Map && res.data['data'] != null
        ? res.data['data'] as Map<String, dynamic>
        : res.data as Map<String, dynamic>;
    return MyProfessionalLink.fromJson(data);
  }

  /// Desvincula um profissional (ação intencional do aluno).
  /// Endpoint: DELETE /professional/student/links/:linkId
  Future<void> unlinkProfessional(String linkId) async {
    await _dio.delete('/professional/student/links/$linkId');
  }

  /// Cria ou atualiza avaliação (1-5) do profissional.
  /// Endpoint: POST /marketplace/professionals/:professionalId/rating
  Future<void> rateProfessional(String professionalId, int score) async {
    await _dio.post(
      '/marketplace/professionals/$professionalId/rating',
      data: {'score': score},
    );
  }

  /// Retorna a avaliação atual do aluno para este profissional, ou null.
  /// Endpoint: GET /marketplace/professionals/:professionalId/my-rating
  Future<int?> getMyRating(String professionalId) async {
    final res = await _dio.get('/marketplace/professionals/$professionalId/my-rating');
    return (res.data as Map<String, dynamic>?)?['score'] as int?;
  }
}
