// lib/features/professional/domain/professional_profile.dart

class ProfessionalProfile {
  final String id;
  final String userId;
  final String email;
  final String displayName;
  final List<String> professionalTypes;
  final List<String> specialties;
  final String? bio;
  final String? phone;
  final String? cref;
  final String? crn;
  final String? crefito;
  final String? clinicName;
  final bool isActive;
  final DateTime createdAt;

  const ProfessionalProfile({
    required this.id,
    required this.userId,
    required this.email,
    required this.displayName,
    required this.professionalTypes,
    required this.specialties,
    this.bio,
    this.phone,
    this.cref,
    this.crn,
    this.crefito,
    this.clinicName,
    required this.isActive,
    required this.createdAt,
  });

  factory ProfessionalProfile.fromJson(Map<String, dynamic> json) {
    return ProfessionalProfile(
      id: json['id'] as String,
      userId: json['userId'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      professionalTypes: (json['professionalTypes'] as List<dynamic>?)
              ?.map((e) => e as String).toList() ??
          (json['professionalType'] != null ? [json['professionalType'] as String] : ['other']),
      specialties: (json['specialties'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      bio: json['bio'] as String?,
      phone: json['phone'] as String?,
      cref: json['cref'] as String?,
      crn: json['crn'] as String?,
      crefito: json['crefito'] as String?,
      clinicName: json['clinicName'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  static const _labels = {
    'personal_trainer': 'Personal Trainer',
    'nutritionist':     'Nutricionista',
    'physiotherapist':  'Fisioterapeuta',
    'coach':            'Coach',
    'other':            'Outro',
  };

  String get typeLabel => professionalTypes
      .map((t) => _labels[t] ?? t)
      .join(' · ');
}
