// lib/features/professional/domain/professional_invitation.dart

class ProfessionalInvitation {
  final String id;
  final String studentEmail;
  final String invitationCode;
  final String accessLevel;
  final String? message;
  final String status;
  final DateTime expiresAt;
  final DateTime sentAt;

  const ProfessionalInvitation({
    required this.id,
    required this.studentEmail,
    required this.invitationCode,
    required this.accessLevel,
    this.message,
    required this.status,
    required this.expiresAt,
    required this.sentAt,
  });

  factory ProfessionalInvitation.fromJson(Map<String, dynamic> json) {
    return ProfessionalInvitation(
      id: json['id'] as String,
      studentEmail: json['studentEmail'] as String,
      invitationCode: json['invitationCode'] as String,
      accessLevel: json['accessLevel'] as String? ?? 'read',
      message: json['message'] as String?,
      status: json['status'] as String? ?? 'pending',
      expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? '') ??
          DateTime.now(),
      sentAt: DateTime.tryParse(json['sentAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}
