// lib/features/profile/domain/profile_photo.dart

class ProfilePhoto {
  final String id;
  final String url;
  final String? caption;
  final int sortOrder;
  final String createdAt;

  const ProfilePhoto({
    required this.id,
    required this.url,
    this.caption,
    required this.sortOrder,
    required this.createdAt,
  });

  factory ProfilePhoto.fromJson(Map<String, dynamic> j) => ProfilePhoto(
        id:        j['id'] as String,
        url:       j['url'] as String,
        caption:   j['caption'] as String?,
        sortOrder: (j['sortOrder'] as num?)?.toInt() ?? 0,
        createdAt: j['createdAt'] as String? ?? '',
      );
}
