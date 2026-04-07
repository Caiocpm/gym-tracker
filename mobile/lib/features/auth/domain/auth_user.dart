// lib/features/auth/domain/auth_user.dart

class AuthUser {
  final String uid;
  final String email;
  final String? displayName;
  final String? photoURL;
  final String? createdAt;
  final bool isPrivate;

  const AuthUser({
    required this.uid,
    required this.email,
    this.displayName,
    this.photoURL,
    this.createdAt,
    this.isPrivate = false,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      uid: json['uid'] as String? ?? json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String?,
      photoURL: json['photoURL'] as String?,
      createdAt: json['createdAt'] as String?,
      isPrivate: json['isPrivate'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'uid': uid,
        'email': email,
        'displayName': displayName,
        'photoURL': photoURL,
        'createdAt': createdAt,
        'isPrivate': isPrivate,
      };

  AuthUser copyWith({
    String? displayName,
    String? photoURL,
    bool? isPrivate,
  }) {
    return AuthUser(
      uid: uid,
      email: email,
      displayName: displayName ?? this.displayName,
      photoURL: photoURL ?? this.photoURL,
      createdAt: createdAt,
      isPrivate: isPrivate ?? this.isPrivate,
    );
  }
}
