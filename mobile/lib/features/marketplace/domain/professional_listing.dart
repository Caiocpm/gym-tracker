class ProfessionalListing {
  final String userId;
  final String displayName;
  final List<String> professionalTypes;
  final List<String> typeLabels;
  final List<String> specialties;
  final String? bio;
  final String? photoURL;
  final String? city;
  final String? state;
  final String? priceRange;
  final int? yearsExperience;
  final bool availableForHire;
  final String? clinicName;

  // Rating
  final double? avgRating;
  final int ratingCount;
  final int? myRating;  // só preenchido na tela de perfil completo

  // Geolocation
  final double? distanceKm;

  // Full profile only
  final String? phone;
  final String? cref;
  final String? crn;
  final String? crefito;
  final String? instagramHandle;
  final String? websiteUrl;

  const ProfessionalListing({
    required this.userId,
    required this.displayName,
    required this.professionalTypes,
    required this.typeLabels,
    required this.specialties,
    this.bio,
    this.photoURL,
    this.city,
    this.state,
    this.priceRange,
    this.yearsExperience,
    this.availableForHire = true,
    this.clinicName,
    this.avgRating,
    this.ratingCount = 0,
    this.myRating,
    this.distanceKm,
    this.phone,
    this.cref,
    this.crn,
    this.crefito,
    this.instagramHandle,
    this.websiteUrl,
  });

  factory ProfessionalListing.fromJson(Map<String, dynamic> json) {
    return ProfessionalListing(
      userId:           json['userId'] as String,
      displayName:      json['displayName'] as String,
      professionalTypes: (json['professionalTypes'] as List<dynamic>?)
              ?.map((e) => e as String).toList() ??
          (json['professionalType'] != null ? [json['professionalType'] as String] : ['other']),
      typeLabels: (json['typeLabels'] as List<dynamic>?)
              ?.map((e) => e as String).toList() ??
          (json['typeLabel'] != null ? [json['typeLabel'] as String] : ['Outro']),
      specialties:      (json['specialties'] as List<dynamic>? ?? [])
                            .map((e) => e as String)
                            .toList(),
      bio:              json['bio'] as String?,
      photoURL:         json['photoURL'] as String?,
      city:             json['city'] as String?,
      state:            json['state'] as String?,
      priceRange:       json['priceRange'] as String?,
      yearsExperience:  json['yearsExperience'] as int?,
      availableForHire: json['availableForHire'] as bool? ?? true,
      clinicName:       json['clinicName'] as String?,
      avgRating:        (json['avgRating'] as num?)?.toDouble(),
      ratingCount:      (json['ratingCount'] as int?) ?? 0,
      myRating:         json['myRating'] as int?,
      distanceKm:       (json['distanceKm'] as num?)?.toDouble(),
      phone:            json['phone'] as String?,
      cref:             json['cref'] as String?,
      crn:              json['crn'] as String?,
      crefito:          json['crefito'] as String?,
      instagramHandle:  json['instagramHandle'] as String?,
      websiteUrl:       json['websiteUrl'] as String?,
    );
  }

  String get location {
    if (city != null && state != null) return '$city, $state';
    if (city != null) return city!;
    if (state != null) return state!;
    return '';
  }

  String get credential {
    if (cref != null && cref!.isNotEmpty) return 'CREF $cref';
    if (crn != null && crn!.isNotEmpty) return 'CRN $crn';
    if (crefito != null && crefito!.isNotEmpty) return 'CREFITO $crefito';
    return '';
  }
}

class MarketplaceSearchResult {
  final List<ProfessionalListing> items;
  final int total;
  final int page;
  final int pages;

  const MarketplaceSearchResult({
    required this.items,
    required this.total,
    required this.page,
    required this.pages,
  });

  factory MarketplaceSearchResult.fromJson(Map<String, dynamic> json) {
    return MarketplaceSearchResult(
      items: (json['items'] as List<dynamic>)
          .map((e) => ProfessionalListing.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int,
      page:  json['page']  as int,
      pages: json['pages'] as int,
    );
  }
}
