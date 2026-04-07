// lib/features/equipe/providers/equipe_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../professional/providers/professional_provider.dart';
import '../data/equipe_service.dart';
import '../domain/my_professional_link.dart';

// Tipos primários que exibem CTA de "Encontrar" quando ausentes
const primaryProfessionalTypes = ['personal_trainer', 'nutritionist'];

// ─── Lista de vínculos do aluno com profissionais ─────────────────────────────

class MyLinksNotifier extends AsyncNotifier<List<MyProfessionalLink>> {
  @override
  Future<List<MyProfessionalLink>> build() async {
    final user = ref.watch(currentUserProvider);
    if (user == null) return [];
    // Profissionais não precisam desta lista (eles têm a visão de alunos)
    final isPro = ref.watch(isProfessionalProvider);
    if (isPro) return [];
    return EquipeService.instance.listMyProfessionals();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => EquipeService.instance.listMyProfessionals(),
    );
  }

  Future<void> accept(String code, List<String> contractedTypes) async {
    final link = await EquipeService.instance.acceptInvitation(code, contractedTypes);
    state.whenData((list) {
      state = AsyncData([...list, link]);
    });
  }

  Future<void> unlink(String linkId) async {
    await EquipeService.instance.unlinkProfessional(linkId);
    state.whenData((list) {
      state = AsyncData(list.where((l) => l.id != linkId).toList());
    });
  }
}

final myLinksProvider =
    AsyncNotifierProvider<MyLinksNotifier, List<MyProfessionalLink>>(
  MyLinksNotifier.new,
);

// ─── Flag: aluno tem pelo menos um vínculo ativo? ─────────────────────────────

final hasActiveLinkProvider = Provider<bool>((ref) {
  final isPro = ref.watch(isProfessionalProvider);
  if (isPro) return false;
  return ref.watch(myLinksProvider).maybeWhen(
    data: (links) => links.any((l) => l.isActive),
    orElse: () => false,
  );
});

// ─── Tipos já cobertos (baseado nas especialidades CONTRATADAS) ───────────────

final coveredTypesProvider = Provider<Set<String>>((ref) {
  return ref.watch(myLinksProvider).maybeWhen(
    data: (links) => links
        .where((l) => l.isActive)
        .expand((l) => l.contractedTypes)   // usa contractedTypes, não professionalTypes
        .toSet(),
    orElse: () => {},
  );
});

// ─── Tipos primários ainda sem cobertura ─────────────────────────────────────

final missingTypesProvider = Provider<List<String>>((ref) {
  final covered = ref.watch(coveredTypesProvider);
  return primaryProfessionalTypes
      .where((t) => !covered.contains(t))
      .toList();
});

// ─── Sinal: profissional aceitou solicitação ─────────────────────────────────
// Incrementado quando o SSE recebe um evento link_accepted.
// O main_scaffold escuta este sinal e navega para /equipe.

final linkAcceptedSignalProvider = StateProvider<int>((ref) => 0);
