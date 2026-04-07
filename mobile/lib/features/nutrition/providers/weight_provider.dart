// lib/features/nutrition/providers/weight_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/weight_service.dart';
import '../domain/nutrition_models.dart';
import '../../auth/providers/auth_provider.dart';

final weightEntriesProvider = AsyncNotifierProvider<WeightEntriesNotifier, List<WeightEntry>>(
  WeightEntriesNotifier.new,
);

class WeightEntriesNotifier extends AsyncNotifier<List<WeightEntry>> {
  @override
  Future<List<WeightEntry>> build() async {
    final user = ref.watch(currentUserProvider);
    if (user == null) return [];
    return WeightService.instance.listEntries(user.uid);
  }

  Future<void> upsert(double weight, String date, {String? note}) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    final entry = await WeightService.instance.upsert(user.uid, weight, date, note: note);
    final current = state.valueOrNull ?? [];
    final idx = current.indexWhere((e) => e.date == date);
    state = AsyncData(
      idx >= 0
          ? [...current.sublist(0, idx), entry, ...current.sublist(idx + 1)]
          : [entry, ...current],
    );
  }

  Future<void> remove(String entryId) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    await WeightService.instance.delete(user.uid, entryId);
    state = AsyncData((state.valueOrNull ?? []).where((e) => e.id != entryId).toList());
  }
}

final nutritionStatsProvider = FutureProvider.autoDispose<NutritionStats>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) throw Exception('Não autenticado');
  return WeightService.instance.getNutritionStats(user.uid);
});
