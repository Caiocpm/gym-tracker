// lib/features/profile/providers/body_measurements_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/body_measurements_service.dart';
import '../domain/body_measurement.dart';

final bodyMeasurementsProvider =
    AsyncNotifierProvider<BodyMeasurementsNotifier, List<BodyMeasurement>>(
  BodyMeasurementsNotifier.new,
);

class BodyMeasurementsNotifier extends AsyncNotifier<List<BodyMeasurement>> {
  @override
  Future<List<BodyMeasurement>> build() async {
    final user = ref.watch(currentUserProvider);
    if (user == null) return [];
    return BodyMeasurementsService.instance.list(user.uid);
  }

  Future<void> add(Map<String, dynamic> data) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    final entry = await BodyMeasurementsService.instance.create(user.uid, data);
    state = AsyncData([entry, ...?state.valueOrNull]);
  }

  Future<void> remove(String id) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    await BodyMeasurementsService.instance.delete(user.uid, id);
    state = AsyncData((state.valueOrNull ?? []).where((e) => e.id != id).toList());
  }

  Future<void> uploadPhoto(String measurementId, String filePath) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    final updated = await BodyMeasurementsService.instance.uploadPhoto(user.uid, measurementId, filePath);
    _replaceOne(updated);
  }

  Future<void> deletePhoto(String measurementId, String url) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    final updated = await BodyMeasurementsService.instance.deletePhoto(user.uid, measurementId, url);
    _replaceOne(updated);
  }

  void _replaceOne(BodyMeasurement updated) {
    final list = (state.valueOrNull ?? []).map((e) => e.id == updated.id ? updated : e).toList();
    state = AsyncData(list);
  }
}
