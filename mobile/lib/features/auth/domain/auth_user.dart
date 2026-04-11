// lib/features/auth/domain/auth_user.dart

class AuthUser {
  final String uid;
  final String email;
  final String? displayName;
  final String? photoURL;
  final String? createdAt;
  final bool isPrivate;

  // Dados pessoais
  final String? birthDate;     // YYYY-MM-DD
  final String? sex;           // male | female
  final double? height;        // cm
  final String? objective;     // lose_weight | gain_muscle | maintain | performance | health
  final String? activityLevel; // sedentary | light | moderate | active | very_active

  // Perfil social
  final String? bio;

  const AuthUser({
    required this.uid,
    required this.email,
    this.displayName,
    this.photoURL,
    this.createdAt,
    this.isPrivate = false,
    this.birthDate,
    this.sex,
    this.height,
    this.objective,
    this.activityLevel,
    this.bio,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      uid: json['uid'] as String? ?? json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String?,
      photoURL: json['photoURL'] as String?,
      createdAt: json['createdAt'] as String?,
      isPrivate: json['isPrivate'] as bool? ?? false,
      birthDate: json['birthDate'] as String?,
      sex: json['sex'] as String?,
      height: (json['height'] as num?)?.toDouble(),
      objective: json['objective'] as String?,
      activityLevel: json['activityLevel'] as String?,
      bio: json['bio'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'uid': uid,
        'email': email,
        'displayName': displayName,
        'photoURL': photoURL,
        'createdAt': createdAt,
        'isPrivate': isPrivate,
        'birthDate': birthDate,
        'sex': sex,
        'height': height,
        'objective': objective,
        'activityLevel': activityLevel,
        'bio': bio,
      };

  AuthUser copyWith({
    String? displayName,
    String? photoURL,
    bool? isPrivate,
    String? birthDate,
    String? sex,
    double? height,
    String? objective,
    String? activityLevel,
    String? bio,
  }) {
    return AuthUser(
      uid: uid,
      email: email,
      displayName: displayName ?? this.displayName,
      photoURL: photoURL ?? this.photoURL,
      createdAt: createdAt,
      isPrivate: isPrivate ?? this.isPrivate,
      birthDate: birthDate ?? this.birthDate,
      sex: sex ?? this.sex,
      height: height ?? this.height,
      objective: objective ?? this.objective,
      activityLevel: activityLevel ?? this.activityLevel,
      bio: bio ?? this.bio,
    );
  }

  /// Idade calculada a partir da data de nascimento
  int? get age {
    if (birthDate == null) return null;
    try {
      final dob = DateTime.parse(birthDate!);
      final now = DateTime.now();
      int age = now.year - dob.year;
      if (now.month < dob.month ||
          (now.month == dob.month && now.day < dob.day)) {
        age--;
      }
      return age;
    } catch (_) {
      return null;
    }
  }

  /// TDEE estimado (kcal/dia) usando Harris-Benedict revisado + fator de atividade
  double? get tdee {
    final a = age;
    final h = height;
    if (a == null || h == null || sex == null) return null;

    // BMR base — requer peso; sem peso retornamos null
    return null;
  }
}
