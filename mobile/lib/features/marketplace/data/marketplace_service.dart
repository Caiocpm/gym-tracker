import '../../../core/network/dio_client.dart';
import '../domain/professional_listing.dart';

class MarketplaceService {
  MarketplaceService._();
  static final MarketplaceService instance = MarketplaceService._();

  final _dio = DioClient.instance.dio;

  Future<MarketplaceSearchResult> searchProfessionals({
    String? q,
    String? type,
    String? city,
    double? lat,
    double? lng,
    double radiusKm = 25,
    int page = 1,
    int limit = 20,
  }) async {
    final res = await _dio.get(
      '/marketplace/professionals',
      queryParameters: {
        if (q != null && q.isNotEmpty) 'q': q,
        if (type != null) 'type': type,
        if (city != null && city.isNotEmpty) 'city': city,
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        if (lat != null) 'radiusKm': radiusKm,
        'page': page,
        'limit': limit,
      },
    );
    return MarketplaceSearchResult.fromJson(res.data as Map<String, dynamic>);
  }

  Future<ProfessionalListing> getPublicProfile(String userId) async {
    final res = await _dio.get('/marketplace/professionals/$userId');
    return ProfessionalListing.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> sendContactRequest(
    String professionalUserId, {
    String? message,
    List<String> requestedTypes = const [],
  }) async {
    await _dio.post(
      '/marketplace/professionals/$professionalUserId/contact',
      data: {
        if (message != null && message.isNotEmpty) 'message': message,
        if (requestedTypes.isNotEmpty) 'requestedTypes': requestedTypes,
      },
    );
  }
}
