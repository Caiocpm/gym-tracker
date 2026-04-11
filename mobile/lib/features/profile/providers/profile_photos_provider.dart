// lib/features/profile/providers/profile_photos_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/profile_photos_service.dart';
import '../domain/profile_photo.dart';

final profilePhotosProvider =
    AsyncNotifierProvider<ProfilePhotosNotifier, List<ProfilePhoto>>(
  ProfilePhotosNotifier.new,
);

class ProfilePhotosNotifier extends AsyncNotifier<List<ProfilePhoto>> {
  @override
  Future<List<ProfilePhoto>> build() => ProfilePhotosService.instance.list();

  Future<void> upload(String filePath, {String? caption}) async {
    final photo = await ProfilePhotosService.instance.upload(filePath, caption: caption);
    state = AsyncData([...state.valueOrNull ?? [], photo]);
  }

  Future<void> remove(String id) async {
    await ProfilePhotosService.instance.delete(id);
    state = AsyncData((state.valueOrNull ?? []).where((p) => p.id != id).toList());
  }
}
