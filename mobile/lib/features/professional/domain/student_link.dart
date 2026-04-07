// lib/features/professional/domain/student_link.dart

class StudentLink {
  final String id;
  final String professionalId;
  final String studentUserId;
  final String studentEmail;
  final String? studentDisplayName;
  final String? studentPhotoURL;
  final String accessLevel;
  final String status;
  final List<String> tags;
  final DateTime linkedAt;

  const StudentLink({
    required this.id,
    required this.professionalId,
    required this.studentUserId,
    required this.studentEmail,
    this.studentDisplayName,
    this.studentPhotoURL,
    required this.accessLevel,
    required this.status,
    required this.tags,
    required this.linkedAt,
  });

  factory StudentLink.fromJson(Map<String, dynamic> json) {
    return StudentLink(
      id: json['id'] as String,
      professionalId: json['professionalId'] as String,
      studentUserId: json['studentUserId'] as String,
      studentEmail: json['studentEmail'] as String,
      studentDisplayName: json['studentDisplayName'] as String?,
      studentPhotoURL: json['studentPhotoURL'] as String?,
      accessLevel: json['accessLevel'] as String? ?? 'read',
      status: json['status'] as String? ?? 'active',
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      linkedAt: DateTime.tryParse(json['linkedAt'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  String get displayName => studentDisplayName ?? studentEmail.split('@').first;

  bool get isActive => status == 'active';
}
