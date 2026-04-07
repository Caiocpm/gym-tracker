// lib/features/onboarding/domain/professional_update.dart
class ProfessionalUpdate {
  final String id;
  final String emoji;
  final String title;
  final List<String> items;
  final DateTime publishedAt;

  const ProfessionalUpdate({
    required this.id,
    required this.emoji,
    required this.title,
    required this.items,
    required this.publishedAt,
  });

  factory ProfessionalUpdate.fromJson(Map<String, dynamic> json) {
    return ProfessionalUpdate(
      id:          json['id'] as String,
      emoji:       json['emoji'] as String? ?? '📣',
      title:       json['title'] as String,
      items:       (json['items'] as List<dynamic>).map((e) => e as String).toList(),
      publishedAt: DateTime.tryParse(json['publishedAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}
