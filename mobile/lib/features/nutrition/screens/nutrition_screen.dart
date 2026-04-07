// lib/features/nutrition/screens/nutrition_screen.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:shimmer/shimmer.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/theme/brand_colors.dart';
import '../../../shared/widgets/gradient_card.dart';
import '../providers/nutrition_provider.dart';
import '../domain/nutrition_models.dart';
import '../data/nutrition_service.dart';
import '../data/voice_parse_service.dart';
import '../data/photo_analyze_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/weight_provider.dart';
import '../../../shared/tutorial/tutorial_keys.dart';
import '../../../shared/tutorial/tutorial_phases.dart';
import '../../../shared/tutorial/tutorial_trigger.dart';

// ─── Emoji por categoria TACO ─────────────────────────────────────────────────

String _normalize(String s) =>
    s.toLowerCase().replaceAll(RegExp(r'[àáâãäå]'), 'a')
     .replaceAll(RegExp(r'[èéêë]'), 'e')
     .replaceAll(RegExp(r'[ìíîï]'), 'i')
     .replaceAll(RegExp(r'[òóôõö]'), 'o')
     .replaceAll(RegExp(r'[ùúûü]'), 'u')
     .replaceAll(RegExp(r'[ç]'), 'c')
     .replaceAll(RegExp(r'[ñ]'), 'n');

String _categoryEmoji(String? category) {
  if (category == null) return '🍽️';
  final c = _normalize(category);
  if (c.contains('cereal') || c.contains('farinha') || c.contains('amido') || c.contains('trigo') || c.contains('milho') || c.contains('aveia') || c.contains('tapioca')) return '🌾';
  if (c.contains('verdura') || c.contains('hortal') || c.contains('folha') || c.contains('brocolis') || c.contains('espinafre') || c.contains('couve')) return '🥦';
  if (c.contains('legume') && !c.contains('leguminosa')) return '🥕';
  if (c.contains('fruta') || c.contains('maca') || c.contains('banana') || c.contains('manga') || c.contains('abacate')) return '🍎';
  if (c.contains('gordura') || c.contains('oleo') || c.contains('manteiga') || c.contains('margarina')) return '🫒';
  if (c.contains('pescado') || c.contains('peixe') || c.contains('fruto do mar') || c.contains('atum') || c.contains('salmao') || c.contains('camarao') || c.contains('tilapia')) return '🐟';
  if (c.contains('frango') || c.contains('ave') || c.contains('peru') || c.contains('galinha')) return '🍗';
  if (c.contains('carne') || c.contains('bovina') || c.contains('suina') || c.contains('suino') || c.contains('boi') || c.contains('porco') || c.contains('linguica') || c.contains('embutido')) return '🥩';
  if (c.contains('leite') || c.contains('lacteo') || c.contains('queijo') || c.contains('iogurte') || c.contains('requeijao') || c.contains('whey')) return '🥛';
  if (c.contains('ovo')) return '🥚';
  if (c.contains('leguminosa') || c.contains('feijao') || c.contains('lentilha') || c.contains('grao') || c.contains('soja') || c.contains('grao-de-bico') || c.contains('ervilha')) return '🫘';
  if (c.contains('acucar') || c.contains('doce') || c.contains('mel') || c.contains('confeitaria') || c.contains('chocolate') || c.contains('bala') || c.contains('sorvete')) return '🍬';
  if (c.contains('alcool') || c.contains('cerveja') || c.contains('vinho') || c.contains('destilado') || c.contains('bebida alcoolica')) return '🍺';
  if (c.contains('suco') || c.contains('néctar') || c.contains('nectar') || c.contains('refresco') || c.contains('energetico')) return '🧃';
  if (c.contains('refrigerante') || c.contains('cha') || c.contains('cafe') || c.contains('bebida')) return '🥤';
  if (c.contains('agua')) return '💧';
  if (c.contains('noz') || c.contains('semente') || c.contains('castanha') || c.contains('amendoa') || c.contains('amendoim') || c.contains('pistache') || c.contains('nozes')) return '🌰';
  if (c.contains('pao') || c.contains('panificacao') || c.contains('bolo') || c.contains('biscoito') || c.contains('bolacha') || c.contains('torta')) return '🍞';
  if (c.contains('macarrao') || c.contains('massa') || c.contains('espaguete') || c.contains('nhoque')) return '🍝';
  if (c.contains('arroz')) return '🍚';
  if (c.contains('condimento') || c.contains('tempero') || c.contains('molho') || c.contains('vinagre') || c.contains('shoyu')) return '🧂';
  if (c.contains('preparo') || c.contains('preparado') || c.contains('mistura') || c.contains('industrializado') || c.contains('prato')) return '🍱';
  if (c.contains('sobremesa') || c.contains('pudim') || c.contains('mousse')) return '🍮';
  if (c.contains('suplemento') || c.contains('proteina') || c.contains('creatina')) return '💊';
  return '🍽️';
}

// Emoji baseado também no nome do alimento (fallback para sem categoria)
String _foodEmoji(String? category, String name) {
  // Se a categoria já deu um emoji específico, usa
  if (category != null) {
    final e = _categoryEmoji(category);
    if (e != '🍽️') return e;
  }
  // Fallback: tenta pelo nome
  final n = _normalize(name);
  if (n.contains('frango') || n.contains('galinha') || n.contains('peru') || n.contains('pato')) return '🍗';
  if (n.contains('boi') || n.contains('bovina') || n.contains('alcatra') || n.contains('picanha') || n.contains('patinho') || n.contains('carne mol') || n.contains('contrafile') || n.contains('file mignon') || n.contains('costela')) return '🥩';
  if (n.contains('porco') || n.contains('suino') || n.contains('linguica') || n.contains('presunto') || n.contains('bacon') || n.contains('salsicha') || n.contains('pernil')) return '🥩';
  if (n.contains('atum') || n.contains('salmao') || n.contains('tilapia') || n.contains('bacalhau') || n.contains('sardinha') || n.contains('pescada') || n.contains('merluza') || n.contains('camarao') || n.contains('peixe')) return '🐟';
  if (n.contains('ovo') || n.contains('ovo mexido') || n.contains('ovo cozido')) return '🥚';
  if (n.contains('leite') || n.contains('iogurte') || n.contains('queijo') || n.contains('requeijao') || n.contains('cream cheese') || n.contains('whey') || n.contains('caseina')) return '🥛';
  if (n.contains('feijao') || n.contains('lentilha') || n.contains('ervilha') || n.contains('soja') || n.contains('grao-de-bico') || n.contains('grao de bico') || n.contains('amendoim')) return '🫘';
  if (n.contains('arroz')) return '🍚';
  if (n.contains('macarrao') || n.contains('espaguete') || n.contains('massa') || n.contains('lasanha')) return '🍝';
  if (n.contains('pao') || n.contains('bolo') || n.contains('biscoito') || n.contains('bolacha') || n.contains('torta') || n.contains('wafer')) return '🍞';
  if (n.contains('aveia') || n.contains('granola') || n.contains('muesli') || n.contains('farinha') || n.contains('tapioca')) return '🌾';
  if (n.contains('batata') || n.contains('inhame') || n.contains('aipim') || n.contains('mandioca') || n.contains('cará') || n.contains('cara')) return '🥔';
  if (n.contains('banana') || n.contains('maca') || n.contains('laranja') || n.contains('manga') || n.contains('abacaxi') || n.contains('uva') || n.contains('morango') || n.contains('melao') || n.contains('melancia') || n.contains('abacate') || n.contains('mamao') || n.contains('pera') || n.contains('pessego') || n.contains('kiwi') || n.contains('limao')) return '🍎';
  if (n.contains('brocolis') || n.contains('espinafre') || n.contains('couve') || n.contains('alface') || n.contains('rucula') || n.contains('acelga') || n.contains('agriao')) return '🥦';
  if (n.contains('cenoura') || n.contains('beterraba') || n.contains('abobrinha') || n.contains('pepino') || n.contains('tomate') || n.contains('chuchu') || n.contains('brocolis') || n.contains('couve-flor')) return '🥕';
  if (n.contains('azeite') || n.contains('oleo') || n.contains('manteiga') || n.contains('margarina')) return '🫒';
  if (n.contains('chocolate') || n.contains('bombom') || n.contains('brigadeiro') || n.contains('doce') || n.contains('sorvete') || n.contains('mel')) return '🍬';
  if (n.contains('cafe') || n.contains('cha') || n.contains('suco') || n.contains('refrigerante') || n.contains('agua')) return '🥤';
  if (n.contains('castanha') || n.contains('amendoa') || n.contains('noz') || n.contains('pistache') || n.contains('macadamia')) return '🌰';
  return '🍽️';
}

class NutritionScreen extends ConsumerStatefulWidget {
  const NutritionScreen({super.key});

  @override
  ConsumerState<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends ConsumerState<NutritionScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this);
    _tab.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final summary = ref.watch(dailySummaryProvider);
    final goalsAsync = ref.watch(nutritionGoalsProvider);
    final goals = goalsAsync.valueOrNull ?? const NutritionGoals();

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tutorial — dispara na primeira visita à aba Nutrição
            TutorialTrigger(
              phase: TutorialPhases.nutrition,
              steps: TutorialPhases.nutritionSteps,
            ),
            _NutritionHeader(tab: _tab),
            TabBar(
              controller: _tab,
              tabs: const [
                Tab(text: 'Visão Geral'),
                Tab(text: 'Refeições'),
                Tab(text: 'Metas'),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tab,
                children: [
                  _OverviewTab(summary: summary, goals: goals),
                  const _MealsTab(),
                  _GoalsTab(current: goals),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: null,
    );
  }

}

// ─── Header ───────────────────────────────────────────────────────────────────

class _NutritionHeader extends ConsumerWidget {
  const _NutritionHeader({required this.tab});
  final TabController tab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final date = ref.watch(selectedDateProvider);
    final now = DateTime.now();
    final isToday =
        date.year == now.year && date.month == now.month && date.day == now.day;
    final isYesterday = date.year == now.subtract(const Duration(days: 1)).year &&
        date.month == now.subtract(const Duration(days: 1)).month &&
        date.day == now.subtract(const Duration(days: 1)).day;

    String dayLabel = isToday
        ? 'Hoje'
        : isYesterday
            ? 'Ontem'
            : DateFormat('d MMM', 'pt_BR').format(date);

    return GradientCard(
      key: TutorialKeys.nutritionHeader,
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          const GradientIconBadge(emoji: '🍽️'),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Nutrição',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 2),
                Text('Acompanhe sua dieta diária',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          // Seletor de data
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left, size: 20),
                onPressed: () =>
                    ref.read(selectedDateProvider.notifier).state =
                        date.subtract(const Duration(days: 1)),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
              ),
              GestureDetector(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: date,
                    firstDate: DateTime(2020),
                    lastDate: now,
                  );
                  if (picked != null) {
                    ref.read(selectedDateProvider.notifier).state = picked;
                  }
                },
                child: Text(
                  dayLabel,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: context.brandPrimary,
                      ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right, size: 20),
                onPressed: isToday
                    ? null
                    : () => ref.read(selectedDateProvider.notifier).state =
                        date.add(const Duration(days: 1)),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Aba Visão Geral ──────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({required this.summary, required this.goals});
  final DailySummary summary;
  final NutritionGoals goals;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: [
        _CaloriesCard(summary: summary, goals: goals),
        const SizedBox(height: 12),
        _MacrosRow(summary: summary, goals: goals),
        const SizedBox(height: 12),
        _WaterCard(summary: summary, goals: goals),
        const SizedBox(height: 12),
        const _WeightCard(),
      ],
    );
  }
}

// ─── Aba Refeições ────────────────────────────────────────────────────────────

class _MealsTab extends ConsumerWidget {
  const _MealsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          ref.read(dietPlanProvider.notifier).load(),
          ref.read(foodEntriesProvider.notifier).load(),
        ]);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        children: MealType.values
            .map((meal) => _MealSection(mealType: meal))
            .toList(),
      ),
    );
  }
}

// ─── Aba Metas ────────────────────────────────────────────────────────────────

class _GoalsTab extends ConsumerStatefulWidget {
  const _GoalsTab({required this.current});
  final NutritionGoals current;

  @override
  ConsumerState<_GoalsTab> createState() => _GoalsTabState();
}

class _GoalsTabState extends ConsumerState<_GoalsTab> {
  late final TextEditingController _calCtrl;
  late final TextEditingController _protCtrl;
  late final TextEditingController _carbCtrl;
  late final TextEditingController _fatCtrl;
  late final TextEditingController _waterCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _calCtrl = TextEditingController(
        text: widget.current.calories.toInt().toString());
    _protCtrl = TextEditingController(
        text: widget.current.protein.toInt().toString());
    _carbCtrl =
        TextEditingController(text: widget.current.carbs.toInt().toString());
    _fatCtrl =
        TextEditingController(text: widget.current.fat.toInt().toString());
    _waterCtrl =
        TextEditingController(text: widget.current.water.toString());
  }

  @override
  void dispose() {
    for (final c in [_calCtrl, _protCtrl, _carbCtrl, _fatCtrl, _waterCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final userId = ref.read(currentUserProvider)?.uid ?? '';
    setState(() => _saving = true);
    try {
      final goals = NutritionGoals(
        calories: double.tryParse(_calCtrl.text) ?? 2000,
        protein: double.tryParse(_protCtrl.text) ?? 150,
        carbs: double.tryParse(_carbCtrl.text) ?? 250,
        fat: double.tryParse(_fatCtrl.text) ?? 65,
        water: int.tryParse(_waterCtrl.text) ?? 2500,
      );
      await NutritionService.instance.updateGoals(userId, goals);
      ref.invalidate(nutritionGoalsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Metas atualizadas!')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erro ao salvar metas')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          GradientCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const GradientIconBadge(emoji: '🎯', size: 40),
                    const SizedBox(width: 12),
                    Text('Metas diárias',
                        style: Theme.of(context).textTheme.titleLarge),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _calCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                            labelText: 'Calorias (kcal)'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _waterCtrl,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: 'Água (ml)'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _protCtrl,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: 'Proteína (g)'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _carbCtrl,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: 'Carbs (g)'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _fatCtrl,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: 'Gordura (g)'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Salvar metas'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Card de Calorias ─────────────────────────────────────────────────────────

class _CaloriesCard extends StatelessWidget {
  const _CaloriesCard({required this.summary, required this.goals});
  final DailySummary summary;
  final NutritionGoals goals;

  @override
  Widget build(BuildContext context) {
    final progress =
        (summary.calories / goals.calories).clamp(0.0, 1.0);
    final remaining =
        (goals.calories - summary.calories).clamp(0, double.infinity);

    return GradientCard(
      key: TutorialKeys.caloriesCard,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const GradientIconBadge(emoji: '🔥', size: 40),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Calorias',
                        style: Theme.of(context).textTheme.titleMedium),
                    Text(
                      '${summary.calories.toInt()} / ${goals.calories.toInt()} kcal',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Text(
                '${(progress * 100).toInt()}%',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: context.brandPrimary,
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 12,
              backgroundColor:
                  context.brandPrimary.withValues(alpha: 0.12),
              valueColor: AlwaysStoppedAnimation(
                progress >= 1.0 ? Colors.orange : context.brandPrimary,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            remaining > 0
                ? '${remaining.toInt()} kcal restantes'
                : '🎉 Meta atingida!',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

// ─── Macros ───────────────────────────────────────────────────────────────────

class _MacrosRow extends StatelessWidget {
  const _MacrosRow({required this.summary, required this.goals});
  final DailySummary summary;
  final NutritionGoals goals;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
            child: _MacroCard(
                label: 'Proteína',
                current: summary.protein,
                goal: goals.protein,
                color: const Color(0xFF3B82F6),
                emoji: '🥩')),
        const SizedBox(width: 8),
        Expanded(
            child: _MacroCard(
                label: 'Carbs',
                current: summary.carbs,
                goal: goals.carbs,
                color: const Color(0xFFF97316),
                emoji: '🍞')),
        const SizedBox(width: 8),
        Expanded(
            child: _MacroCard(
                label: 'Gordura',
                current: summary.fat,
                goal: goals.fat,
                color: const Color(0xFFEAB308),
                emoji: '🥑')),
      ],
    );
  }
}

class _MacroCard extends StatelessWidget {
  const _MacroCard({
    required this.label,
    required this.current,
    required this.goal,
    required this.color,
    required this.emoji,
  });

  final String label;
  final double current;
  final double goal;
  final Color color;
  final String emoji;

  @override
  Widget build(BuildContext context) {
    final progress = (current / goal).clamp(0.0, 1.0);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color ?? Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.cs.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
          ),
        ],
      ),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 20)),
          const SizedBox(height: 4),
          Text(label,
              style: Theme.of(context).textTheme.labelSmall,
              textAlign: TextAlign.center),
          const SizedBox(height: 6),
          Text(
            '${current.toInt()}g',
            style: Theme.of(context)
                .textTheme
                .titleMedium!
                .copyWith(color: color, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 2),
          Text('/ ${goal.toInt()}g',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 4,
              backgroundColor: color.withValues(alpha: 0.15),
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Água ─────────────────────────────────────────────────────────────────────

class _WaterCard extends ConsumerWidget {
  const _WaterCard({required this.summary, required this.goals});
  final DailySummary summary;
  final NutritionGoals goals;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progress =
        (summary.water / goals.water).clamp(0.0, 1.0);
    const waterColor = Color(0xFF3B82F6);

    return GradientCard(
      key: TutorialKeys.waterCard,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const GradientIconBadge(emoji: '💧', size: 40),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Água',
                        style: Theme.of(context).textTheme.titleMedium),
                    Text(
                      '${summary.water} / ${goals.water} ml',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Text(
                '${(progress * 100).toInt()}%',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: waterColor,
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
              backgroundColor:
                  waterColor.withValues(alpha: 0.12),
              valueColor:
                  const AlwaysStoppedAnimation(waterColor),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [150, 200, 250, 350, 500].map((ml) {
              return OutlinedButton(
                onPressed: () =>
                    ref.read(waterEntriesProvider.notifier).add(ml),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 6),
                  minimumSize: Size.zero,
                  side: const BorderSide(color: waterColor),
                  foregroundColor: waterColor,
                ),
                child: Text(
                  ml >= 1000 ? '${ml ~/ 1000}L' : '${ml}ml',
                  style: const TextStyle(fontSize: 12),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

// ─── Seção de Refeição ────────────────────────────────────────────────────────

class _MealSection extends ConsumerWidget {
  const _MealSection({required this.mealType});
  final MealType mealType;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allEntries = ref.watch(foodEntriesProvider).valueOrNull ?? [];
    final consumedDietIds = ref.watch(consumedDietItemIdsProvider);
    final dietItems = (ref.watch(dietPlanProvider).valueOrNull ?? [])
        .where((i) => i.mealType == mealType)
        .toList();
    final manualEntries = allEntries
        .where((e) => e.mealType == mealType && e.dietPlanItemId == null)
        .toList();

    final totalCal = allEntries
        .where((e) => e.mealType == mealType)
        .fold<double>(0, (s, e) => s + e.calories);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              Text(mealType.emoji, style: const TextStyle(fontSize: 18)),
              const SizedBox(width: 8),
              Text(mealType.label,
                  style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              if (totalCal > 0)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: context.brandPrimary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${totalCal.toInt()} kcal',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: context.brandPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              const SizedBox(width: 4),
              // Botão adicionar à dieta base
              IconButton(
                icon: const Icon(Icons.bookmark_add_outlined, size: 18),
                tooltip: 'Adicionar à dieta base',
                padding: EdgeInsets.zero,
                constraints:
                    const BoxConstraints(minWidth: 28, minHeight: 28),
                onPressed: () => showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  useSafeArea: true,
                  builder: (_) =>
                      _AddDietPlanItemSheet(mealType: mealType),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_rounded, size: 20),
                tooltip: 'Adicionar alimento',
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                onPressed: () => showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  useSafeArea: true,
                  builder: (_) => _AddFoodSheet(preselectedMeal: mealType),
                ),
              ),
            ],
          ),
        ),
        // Itens da dieta base
        if (dietItems.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: 4, left: 2),
            child: Text(
              'Dieta base',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withValues(alpha: 0.5),
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          ...dietItems.map((item) => _DietPlanItemTile(
                item: item,
                isConsumed: consumedDietIds.contains(item.id),
                mealType: mealType,
              )),
          if (manualEntries.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 4, left: 2),
              child: Text(
                'Adicionados hoje',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.5),
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
        ],
        if (manualEntries.isEmpty && dietItems.isEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 4),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: context.cs.outlineVariant),
            ),
            child: ListTile(
              leading: Icon(Icons.add_circle_outline,
                  color: context.brandPrimary),
              title: Text(
                  'Adicionar em ${mealType.label.toLowerCase()}',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: context.brandPrimary)),
              onTap: () => showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                useSafeArea: true,
                builder: (_) => _AddFoodSheet(preselectedMeal: mealType),
              ),
            ),
          )
        else
          ...manualEntries.map((e) => _FoodEntryTile(entry: e)),
        const SizedBox(height: 4),
      ],
    );
  }
}

// ─── Tile da dieta base ───────────────────────────────────────────────────────

class _DietPlanItemTile extends ConsumerWidget {
  const _DietPlanItemTile({
    required this.item,
    required this.isConsumed,
    required this.mealType,
  });

  final DietPlanItem item;
  final bool isConsumed;
  final MealType mealType;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId = ref.read(currentUserProvider)?.uid ?? '';
    final date = ref.read(selectedDateProvider);

    return Dismissible(
      key: ValueKey('diet_${item.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        decoration: BoxDecoration(
          color: Colors.red.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.delete_outline, color: Colors.red),
      ),
      confirmDismiss: (_) async {
        return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Remover da dieta base?'),
            content: Text(
                'Remover "${item.name}" da sua dieta base permanentemente?'),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('Cancelar')),
              FilledButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Remover')),
            ],
          ),
        );
      },
      onDismissed: (_) =>
          ref.read(dietPlanProvider.notifier).remove(item.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        decoration: BoxDecoration(
          color: isConsumed
              ? context.brandPrimary.withValues(alpha: 0.05)
              : Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isConsumed
                ? context.brandPrimary.withValues(alpha: 0.3)
                : context.cs.outlineVariant,
          ),
        ),
        child: ListTile(
          dense: true,
          leading: GestureDetector(
            onTap: () => _toggle(context, ref, userId, date),
            child: Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isConsumed ? context.brandPrimary : Colors.transparent,
                border: Border.all(
                  color: isConsumed
                      ? context.brandPrimary
                      : Theme.of(context).colorScheme.outline,
                  width: 2,
                ),
              ),
              child: isConsumed
                  ? const Icon(Icons.check_rounded,
                      size: 16, color: Colors.white)
                  : null,
            ),
          ),
          title: Text(item.name,
              style: Theme.of(context).textTheme.bodyLarge),
          subtitle: Text(
            '${item.quantity.toInt()}${item.unit} · P: ${item.protein.toInt()}g  C: ${item.carbs.toInt()}g  G: ${item.fat.toInt()}g',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          trailing: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: context.brandPrimary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '${item.calories.toInt()} kcal',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: context.brandPrimary,
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
          onTap: () => _toggle(context, ref, userId, date),
        ),
      ),
    );
  }

  Future<void> _toggle(
      BuildContext context, WidgetRef ref, String userId, DateTime date) async {
    final ns = NutritionService.instance;
    final messenger = ScaffoldMessenger.of(context);
    if (isConsumed) {
      await ns.unconsumeDietPlanItem(userId, item.id, date);
    } else {
      await ns.consumeDietPlanItem(userId, item.id, date);
      messenger.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded,
                  size: 18, color: Colors.white),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${item.name} consumido!',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
          backgroundColor: context.brandPrimary,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10)),
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        ),
      );
    }
    ref.read(foodEntriesProvider.notifier).load();
  }
}

class _FoodEntryTile extends ConsumerWidget {
  const _FoodEntryTile({required this.entry});
  final FoodEntry entry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.cs.outlineVariant),
      ),
      child: ListTile(
        dense: true,
        title: Text(entry.foodName,
            style: Theme.of(context).textTheme.bodyLarge),
        subtitle: Text(
          '${entry.quantity.toInt()}${entry.unit} · P: ${entry.protein.toInt()}g  C: ${entry.carbs.toInt()}g  G: ${entry.fat.toInt()}g',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: context.brandPrimary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '${entry.calories.toInt()} kcal',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: context.brandPrimary,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, size: 18),
              color: Colors.red,
              onPressed: () =>
                  ref.read(foodEntriesProvider.notifier).remove(entry.id),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Sheet Adicionar à Dieta Base ─────────────────────────────────────────────

class _AddDietPlanItemSheet extends ConsumerStatefulWidget {
  const _AddDietPlanItemSheet({required this.mealType});
  final MealType mealType;

  @override
  ConsumerState<_AddDietPlanItemSheet> createState() =>
      _AddDietPlanItemSheetState();
}

class _AddDietPlanItemSheetState
    extends ConsumerState<_AddDietPlanItemSheet> {
  final _searchCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _calCtrl = TextEditingController();
  final _protCtrl = TextEditingController();
  final _carbCtrl = TextEditingController();
  final _fatCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController(text: '100');

  List<TacoFood> _results = [];
  bool _searching = false;
  TacoFood? _selected;
  bool _saving = false;

  @override
  void dispose() {
    for (final c in [
      _searchCtrl, _nameCtrl, _calCtrl, _protCtrl,
      _carbCtrl, _fatCtrl, _qtyCtrl
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _search(String q) async {
    if (q.trim().length < 2) {
      setState(() => _results = []);
      return;
    }
    setState(() => _searching = true);
    _results = await NutritionService.instance.searchFoods(q.trim());
    if (mounted) setState(() => _searching = false);
  }

  void _selectTaco(TacoFood food) {
    setState(() {
      _selected = food;
      _qtyCtrl.text = '100';
      _nameCtrl.text = food.name;
      _calCtrl.text = food.calories.toStringAsFixed(1);
      _protCtrl.text = food.protein.toStringAsFixed(1);
      _carbCtrl.text = food.carbs.toStringAsFixed(1);
      _fatCtrl.text = food.fat.toStringAsFixed(1);
    });
  }

  void _onQtyChanged(String val) {
    if (_selected == null) return;
    final qty = double.tryParse(val) ?? 100;
    final factor = qty / _selected!.servingSize;
    setState(() {
      _calCtrl.text = (_selected!.calories * factor).toStringAsFixed(1);
      _protCtrl.text = (_selected!.protein * factor).toStringAsFixed(1);
      _carbCtrl.text = (_selected!.carbs * factor).toStringAsFixed(1);
      _fatCtrl.text = (_selected!.fat * factor).toStringAsFixed(1);
    });
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      final item = DietPlanItem(
        id: '',
        userId: '',
        name: _nameCtrl.text.trim(),
        calories: double.tryParse(_calCtrl.text) ?? 0,
        protein: double.tryParse(_protCtrl.text) ?? 0,
        carbs: double.tryParse(_carbCtrl.text) ?? 0,
        fat: double.tryParse(_fatCtrl.text) ?? 0,
        quantity: double.tryParse(_qtyCtrl.text) ?? 100,
        unit: 'g',
        mealType: widget.mealType,
      );
      await ref.read(dietPlanProvider.notifier).add(item);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.85,
      child: Padding(
        padding: EdgeInsets.only(bottom: bottom),
        child: Column(
          children: [
            Center(
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 10),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: context.cs.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Row(
                children: [
                  Text(
                    '${widget.mealType.emoji} Dieta base — ${widget.mealType.label}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            ),
            // Campo de busca
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: TextField(
                controller: _searchCtrl,
                autofocus: true,
                keyboardType: TextInputType.text,
                textCapitalization: TextCapitalization.none,
                autocorrect: false,
                decoration: InputDecoration(
                  hintText: 'Buscar alimento...',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searching
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                _searchCtrl.clear();
                                setState(() {
                                  _results = [];
                                  _selected = null;
                                });
                              },
                            )
                          : null,
                ),
                onChanged: _search,
              ),
            ),
            Expanded(
              child: _selected != null
                  ? _SelectedFoodCard(
                      food: _selected!,
                      isFavorite: false,
                      onBack: () => setState(() => _selected = null),
                      onToggleFavorite: () {},
                      qtyCtrl: _qtyCtrl,
                      calCtrl: _calCtrl,
                      protCtrl: _protCtrl,
                      carbCtrl: _carbCtrl,
                      fatCtrl: _fatCtrl,
                      onQtyChanged: _onQtyChanged,
                      onSave: _saving ? null : _save,
                      saving: _saving,
                      saveLabel: 'Salvar na dieta base',
                    )
                  : _searchCtrl.text.trim().length >= 2
                      ? _searching
                          ? const Center(
                              child: CircularProgressIndicator())
                          : _results.isEmpty
                              ? Center(
                                  child: Text(
                                    'Nenhum resultado',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium,
                                  ),
                                )
                              : ListView.builder(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12),
                                  itemCount: _results.length,
                                  itemBuilder: (_, i) => _FoodTile(
                                    food: _results[i],
                                    isFav: false,
                                    onSelect: _selectTaco,
                                    onToggleFavorite: (_) {},
                                  ),
                                )
                      : Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text('📌',
                                  style: TextStyle(fontSize: 40)),
                              const SizedBox(height: 12),
                              Text('Busque um alimento para adicionar',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium),
                              const SizedBox(height: 4),
                              Text(
                                  'Ele aparecerá todos os dias nesta refeição',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall,
                                  textAlign: TextAlign.center),
                            ],
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Sheet Adicionar Alimento ─────────────────────────────────────────────────

class _AddFoodSheet extends ConsumerStatefulWidget {
  const _AddFoodSheet({this.preselectedMeal});
  final MealType? preselectedMeal;

  @override
  ConsumerState<_AddFoodSheet> createState() => _AddFoodSheetState();
}

class _AddFoodSheetState extends ConsumerState<_AddFoodSheet>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;

  // Busca TACO
  final _searchCtrl = TextEditingController();
  List<TacoFood> _results = [];
  bool _searching = false;
  TacoFood? _selected;

  // Formulário manual / ajuste de quantidade
  final _nameCtrl = TextEditingController();
  final _calCtrl = TextEditingController();
  final _protCtrl = TextEditingController();
  final _carbCtrl = TextEditingController();
  final _fatCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController(text: '100');
  late MealType _meal;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 4, vsync: this);
    _meal = widget.preselectedMeal ?? MealType.lunch;
  }

  @override
  void dispose() {
    _tab.dispose();
    _searchCtrl.dispose();
    for (final c in [_nameCtrl, _calCtrl, _protCtrl, _carbCtrl, _fatCtrl, _qtyCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _search(String q) async {
    if (q.trim().length < 2) {
      setState(() => _results = []);
      return;
    }
    setState(() => _searching = true);
    _results = await NutritionService.instance.searchFoods(q.trim());
    if (mounted) setState(() => _searching = false);
  }

  void _selectTaco(TacoFood food) {
    setState(() {
      _selected = food;
      _qtyCtrl.text = '100';
      _nameCtrl.text = food.name;
      _calCtrl.text = food.calories.toStringAsFixed(1);
      _protCtrl.text = food.protein.toStringAsFixed(1);
      _carbCtrl.text = food.carbs.toStringAsFixed(1);
      _fatCtrl.text = food.fat.toStringAsFixed(1);
    });
  }

  void _onQtyChanged(String val) {
    if (_selected == null) return;
    final qty = double.tryParse(val) ?? 100;
    final factor = qty / _selected!.servingSize;
    setState(() {
      _calCtrl.text = (_selected!.calories * factor).toStringAsFixed(1);
      _protCtrl.text = (_selected!.protein * factor).toStringAsFixed(1);
      _carbCtrl.text = (_selected!.carbs * factor).toStringAsFixed(1);
      _fatCtrl.text = (_selected!.fat * factor).toStringAsFixed(1);
    });
  }

  void _deselect() => setState(() => _selected = null);

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    final userId = ref.read(currentUserProvider)?.uid ?? '';
    final date = ref.read(selectedDateProvider);

    final entry = FoodEntry(
      id: '',
      userId: userId,
      foodName: _nameCtrl.text.trim(),
      calories: double.tryParse(_calCtrl.text) ?? 0,
      protein: double.tryParse(_protCtrl.text) ?? 0,
      carbs: double.tryParse(_carbCtrl.text) ?? 0,
      fat: double.tryParse(_fatCtrl.text) ?? 0,
      quantity: double.tryParse(_qtyCtrl.text) ?? 100,
      unit: 'g',
      mealType: _meal,
      date: date,
    );

    setState(() => _saving = true);
    try {
      await ref.read(foodEntriesProvider.notifier).add(entry);
      // Salva nos recentes se vier da base TACO
      if (_selected != null) {
        ref.read(recentFoodsProvider.notifier).add(_selected!);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro ao salvar: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    final recents = ref.watch(recentFoodsProvider);
    final favorites = ref.watch(favoriteFoodsProvider);
    final favIds = favorites.map((f) => f.id).toSet();

    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.85,
      child: Padding(
        padding: EdgeInsets.only(bottom: bottom),
        child: Column(
          children: [
            // Handle
            Center(
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 10),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: context.cs.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text('Adicionar alimento',
                      style: Theme.of(context).textTheme.titleLarge),
                  const Spacer(),
                  DropdownButton<MealType>(
                    value: _meal,
                    underline: const SizedBox(),
                    items: MealType.values
                        .map((m) => DropdownMenuItem(
                            value: m,
                            child: Text('${m.emoji} ${m.label}',
                                style: const TextStyle(fontSize: 13))))
                        .toList(),
                    onChanged: (v) => setState(() => _meal = v ?? _meal),
                  ),
                ],
              ),
            ),
            TabBar(
              controller: _tab,
              tabs: const [
                Tab(text: '🇧🇷 Base TACO'),
                Tab(text: '✏️ Manual'),
                Tab(text: '📷 Foto'),
                Tab(text: '🎤 Voz'),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tab,
                children: [
                  _TacoSearchTab(
                    searchCtrl: _searchCtrl,
                    results: _results,
                    searching: _searching,
                    selected: _selected,
                    recents: recents,
                    favorites: favorites,
                    favIds: favIds,
                    qtyCtrl: _qtyCtrl,
                    calCtrl: _calCtrl,
                    protCtrl: _protCtrl,
                    carbCtrl: _carbCtrl,
                    fatCtrl: _fatCtrl,
                    onSearch: _search,
                    onSelect: _selectTaco,
                    onDeselect: _deselect,
                    onToggleFavorite: (food) =>
                        ref.read(favoriteFoodsProvider.notifier).toggle(food),
                    onQtyChanged: _onQtyChanged,
                    onSave: _saving ? null : _save,
                    saving: _saving,
                  ),
                  _ManualFoodTab(
                    nameCtrl: _nameCtrl,
                    calCtrl: _calCtrl,
                    protCtrl: _protCtrl,
                    carbCtrl: _carbCtrl,
                    fatCtrl: _fatCtrl,
                    qtyCtrl: _qtyCtrl,
                    onSave: _saving ? null : _save,
                    saving: _saving,
                  ),
                  _PhotoFoodTab(meal: _meal, onSaved: () => Navigator.pop(context)),
                  _VoiceFoodTab(preselectedMeal: _meal, onSaved: () => Navigator.pop(context)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Aba TACO ─────────────────────────────────────────────────────────────────

class _TacoSearchTab extends StatelessWidget {
  const _TacoSearchTab({
    required this.searchCtrl,
    required this.results,
    required this.searching,
    required this.selected,
    required this.recents,
    required this.favorites,
    required this.favIds,
    required this.qtyCtrl,
    required this.calCtrl,
    required this.protCtrl,
    required this.carbCtrl,
    required this.fatCtrl,
    required this.onSearch,
    required this.onSelect,
    required this.onDeselect,
    required this.onToggleFavorite,
    required this.onQtyChanged,
    required this.onSave,
    required this.saving,
  });

  final TextEditingController searchCtrl;
  final List<TacoFood> results;
  final bool searching;
  final TacoFood? selected;
  final List<TacoFood> recents;
  final List<TacoFood> favorites;
  final Set<String> favIds;
  final TextEditingController qtyCtrl;
  final TextEditingController calCtrl;
  final TextEditingController protCtrl;
  final TextEditingController carbCtrl;
  final TextEditingController fatCtrl;
  final void Function(String) onSearch;
  final void Function(TacoFood) onSelect;
  final VoidCallback onDeselect;
  final void Function(TacoFood) onToggleFavorite;
  final void Function(String) onQtyChanged;
  final VoidCallback? onSave;
  final bool saving;

  @override
  Widget build(BuildContext context) {
    // Alimento selecionado — mostra tela de detalhe (sem campo de busca)
    if (selected != null) {
      return _SelectedFoodCard(
        food: selected!,
        isFavorite: favIds.contains(selected!.id),
        onBack: onDeselect,
        onToggleFavorite: () => onToggleFavorite(selected!),
        qtyCtrl: qtyCtrl,
        calCtrl: calCtrl,
        protCtrl: protCtrl,
        carbCtrl: carbCtrl,
        fatCtrl: fatCtrl,
        onQtyChanged: onQtyChanged,
        onSave: onSave,
        saving: saving,
      );
    }

    final query = searchCtrl.text.trim();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: searchCtrl,
            autofocus: true,
            keyboardType: TextInputType.text,
            textCapitalization: TextCapitalization.none,
            autocorrect: false,
            decoration: InputDecoration(
              hintText: 'Buscar alimento (ex: arroz, frango...)',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: searching
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2)),
                    )
                  : query.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            searchCtrl.clear();
                            onSearch('');
                          },
                        )
                      : null,
            ),
            onChanged: onSearch,
          ),
        ),
        Expanded(
          child: query.length >= 2
              ? searching
                  ? const Center(child: CircularProgressIndicator())
                  : results.isNotEmpty
                      ? _SearchResultsList(
                          results: results,
                          favIds: favIds,
                          onSelect: onSelect,
                          onToggleFavorite: onToggleFavorite,
                        )
                      : Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Text(
                              'Nenhum resultado para "$query"',
                              style: Theme.of(context).textTheme.bodyMedium,
                              textAlign: TextAlign.center,
                            ),
                          ),
                        )
              : _HistorySection(
                  recents: recents,
                  favorites: favorites,
                  favIds: favIds,
                  onSelect: onSelect,
                  onToggleFavorite: onToggleFavorite,
                ),
        ),
      ],
    );
  }
}

// ─── Lista de resultados de busca ─────────────────────────────────────────────

class _SearchResultsList extends StatelessWidget {
  const _SearchResultsList({
    required this.results,
    required this.favIds,
    required this.onSelect,
    required this.onToggleFavorite,
  });

  final List<TacoFood> results;
  final Set<String> favIds;
  final void Function(TacoFood) onSelect;
  final void Function(TacoFood) onToggleFavorite;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      itemCount: results.length,
      itemBuilder: (_, i) {
        final food = results[i];
        final isFav = favIds.contains(food.id);
        return _FoodTile(
          food: food,
          isFav: isFav,
          onSelect: onSelect,
          onToggleFavorite: onToggleFavorite,
        );
      },
    );
  }
}

// ─── Seção de histórico (recentes + favoritos) ────────────────────────────────

class _HistorySection extends StatelessWidget {
  const _HistorySection({
    required this.recents,
    required this.favorites,
    required this.favIds,
    required this.onSelect,
    required this.onToggleFavorite,
  });

  final List<TacoFood> recents;
  final List<TacoFood> favorites;
  final Set<String> favIds;
  final void Function(TacoFood) onSelect;
  final void Function(TacoFood) onToggleFavorite;

  @override
  Widget build(BuildContext context) {
    if (recents.isEmpty && favorites.isEmpty) {
      final cs = Theme.of(context).colorScheme;
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Center(
                    child: Text('🔍', style: TextStyle(fontSize: 36))),
              ),
              const SizedBox(height: 16),
              Text(
                'Pesquise um alimento',
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Base TACO com 597 alimentos brasileiros.\nDigite pelo menos 2 letras para buscar.',
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      children: [
        if (recents.isNotEmpty) ...[
          const _HistorySectionHeader('⏱ Recentes'),
          ...recents.map((f) => _FoodTile(
                food: f,
                isFav: favIds.contains(f.id),
                onSelect: onSelect,
                onToggleFavorite: onToggleFavorite,
              )),
        ],
        if (favorites.isNotEmpty) ...[
          const _HistorySectionHeader('❤️ Favoritos'),
          ...favorites.map((f) => _FoodTile(
                food: f,
                isFav: true,
                onSelect: onSelect,
                onToggleFavorite: onToggleFavorite,
              )),
        ],
      ],
    );
  }
}

class _HistorySectionHeader extends StatelessWidget {
  const _HistorySectionHeader(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 14, bottom: 4, left: 4),
      child: Text(
        title,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
            ),
      ),
    );
  }
}

class _FoodTile extends StatelessWidget {
  const _FoodTile({
    required this.food,
    required this.isFav,
    required this.onSelect,
    required this.onToggleFavorite,
  });

  final TacoFood food;
  final bool isFav;
  final void Function(TacoFood) onSelect;
  final void Function(TacoFood) onToggleFavorite;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
      leading: Text(_foodEmoji(food.category, food.name),
          style: const TextStyle(fontSize: 22)),
      title: Text(food.name, style: Theme.of(context).textTheme.bodyLarge),
      subtitle: Text(
        '${food.calories.toInt()} kcal · P: ${food.protein.toInt()}g · C: ${food.carbs.toInt()}g · G: ${food.fat.toInt()}g',
        style: Theme.of(context).textTheme.bodySmall,
      ),
      trailing: IconButton(
        icon: Icon(
          isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          size: 20,
        ),
        color: isFav ? Colors.red : null,
        onPressed: () => onToggleFavorite(food),
      ),
      onTap: () => onSelect(food),
    );
  }
}

// ─── Card de alimento selecionado ─────────────────────────────────────────────

class _SelectedFoodCard extends StatelessWidget {
  const _SelectedFoodCard({
    required this.food,
    required this.isFavorite,
    required this.onBack,
    required this.onToggleFavorite,
    required this.qtyCtrl,
    required this.calCtrl,
    required this.protCtrl,
    required this.carbCtrl,
    required this.fatCtrl,
    required this.onQtyChanged,
    required this.onSave,
    required this.saving,
    this.saveLabel = 'Adicionar',
  });

  final TacoFood food;
  final bool isFavorite;
  final VoidCallback onBack;
  final VoidCallback onToggleFavorite;
  final TextEditingController qtyCtrl;
  final TextEditingController calCtrl;
  final TextEditingController protCtrl;
  final TextEditingController carbCtrl;
  final TextEditingController fatCtrl;
  final void Function(String) onQtyChanged;
  final VoidCallback? onSave;
  final bool saving;
  final String saveLabel;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header: voltar + nome + favorito
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                onPressed: onBack,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                tooltip: 'Voltar',
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(food.name,
                        style: Theme.of(context).textTheme.titleMedium,
                        overflow: TextOverflow.ellipsis),
                    if (food.category != null)
                      Text(
                        '${_categoryEmoji(food.category)} ${food.category!}',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: context.brandPrimary),
                      ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(
                  isFavorite
                      ? Icons.favorite_rounded
                      : Icons.favorite_border_rounded,
                  size: 22,
                ),
                color: isFavorite ? Colors.red : null,
                onPressed: onToggleFavorite,
                tooltip: isFavorite ? 'Remover favorito' : 'Adicionar favorito',
              ),
            ],
          ),
          const Divider(height: 16),
          // Quantidade + calorias
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  controller: qtyCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Quantidade (g)'),
                  onChanged: onQtyChanged,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: calCtrl,
                  readOnly: true,
                  decoration: const InputDecoration(labelText: 'Kcal'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Macros
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: protCtrl,
                  readOnly: true,
                  decoration: const InputDecoration(labelText: 'Prot (g)'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: carbCtrl,
                  readOnly: true,
                  decoration: const InputDecoration(labelText: 'Carbs (g)'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: fatCtrl,
                  readOnly: true,
                  decoration: const InputDecoration(labelText: 'Gord (g)'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: onSave,
            child: saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : Text(saveLabel),
          ),
        ],
      ),
    );
  }
}

// ─── Aba Manual ───────────────────────────────────────────────────────────────

class _ManualFoodTab extends StatelessWidget {
  const _ManualFoodTab({
    required this.nameCtrl,
    required this.calCtrl,
    required this.protCtrl,
    required this.carbCtrl,
    required this.fatCtrl,
    required this.qtyCtrl,
    required this.onSave,
    required this.saving,
  });

  final TextEditingController nameCtrl;
  final TextEditingController calCtrl;
  final TextEditingController protCtrl;
  final TextEditingController carbCtrl;
  final TextEditingController fatCtrl;
  final TextEditingController qtyCtrl;
  final VoidCallback? onSave;
  final bool saving;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: nameCtrl,
            decoration: const InputDecoration(labelText: 'Nome do alimento'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: qtyCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Quantidade (g/ml)'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: calCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Calorias'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: protCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Proteína (g)'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: carbCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Carbs (g)'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: fatCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Gordura (g)'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: onSave,
            child: saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Salvar'),
          ),
        ],
      ),
    );
  }
}

// ─── Voice Food Tab ───────────────────────────────────────────────────────────

class _VoiceFoodTab extends ConsumerStatefulWidget {
  const _VoiceFoodTab({required this.preselectedMeal, required this.onSaved});
  final MealType preselectedMeal;
  final VoidCallback onSaved;

  @override
  ConsumerState<_VoiceFoodTab> createState() => _VoiceFoodTabState();
}

class _VoiceFoodTabState extends ConsumerState<_VoiceFoodTab> {
  String _phase = 'idle'; // idle | listening | parsing | review | error
  String _transcript = '';
  String _errorMsg = '';
  PhotoAnalyzeResult? _result;
  final SpeechToText _stt = SpeechToText();
  bool _sttAvailable = false;

  @override
  void initState() {
    super.initState();
    _initStt();
  }

  Future<void> _initStt() async {
    _sttAvailable = await _stt.initialize(
      onError: (e) {
        if (mounted) setState(() { _phase = 'error'; _errorMsg = e.errorMsg; });
      },
      onStatus: (status) {
        // O STT do Windows encerra sozinho — reinicia automaticamente enquanto
        // o usuário não tocar "Pronto"
        if (status == 'notListening' && _phase == 'listening' && mounted) {
          _restartListening();
        }
      },
    );
    if (mounted) setState(() {});
  }

  Future<void> _restartListening() async {
    if (!_sttAvailable || _phase != 'listening') return;
    await Future.delayed(const Duration(milliseconds: 200));
    if (!mounted || _phase != 'listening') return;
    await _stt.listen(
      localeId: 'pt_BR',
      onResult: (SpeechRecognitionResult r) {
        if (r.recognizedWords.isNotEmpty) {
          setState(() => _transcript = r.recognizedWords);
        }
      },
      listenFor: const Duration(seconds: 60),
      pauseFor: const Duration(seconds: 30),
    );
  }

  Future<void> _startListening() async {
    if (!_sttAvailable) return;
    setState(() { _phase = 'listening'; _transcript = ''; });
    await _stt.listen(
      localeId: 'pt_BR',
      onResult: (SpeechRecognitionResult r) {
        if (r.recognizedWords.isNotEmpty) {
          setState(() => _transcript = r.recognizedWords);
        }
      },
      listenFor: const Duration(seconds: 60),
      pauseFor: const Duration(seconds: 30),
    );
  }

  Future<void> _stopAndParse() async {
    await _stt.stop();
    if (_transcript.trim().isEmpty) {
      setState(() => _phase = 'idle');
      return;
    }
    setState(() => _phase = 'parsing');
    try {
      final result = await VoiceParseService.instance.parse(_transcript);
      if (mounted) setState(() { _result = result; _phase = 'review'; });
    } catch (e) {
      if (mounted) setState(() { _phase = 'error'; _errorMsg = e.toString(); });
    }
  }

  @override
  void dispose() {
    _stt.stop();
    super.dispose();
  }

  Future<void> _save() async {
    if (_result == null) return;
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    setState(() => _saving = true);
    try {
      final date = ref.read(selectedDateProvider);
      final meal = widget.preselectedMeal;
      final selected = _result!.items.where((i) => i.selected).toList();
      for (final item in selected) {
        final entry = FoodEntry(
          id: '',
          userId: user.uid,
          foodName: item.name,
          calories: item.scaledCalories,
          protein: item.scaledProtein,
          carbs: item.scaledCarbs,
          fat: item.scaledFat,
          quantity: item.editedQuantity,
          unit: item.unit,
          mealType: meal,
          date: date,
        );
        await ref.read(foodEntriesProvider.notifier).add(entry);
      }
      widget.onSaved();
    } catch (e) {
      setState(() => _saving = false);
    }
  }

  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    if (_phase == 'review' && _result != null) {
      return _buildReview();
    }
    return switch (_phase) {
      'parsing' => _buildParsing(),
      'error' => _buildError(),
      _ => _buildIdle(),
    };
  }

  Widget _buildReview() {
    final result = _result!;
    final totalCal = result.items
        .where((i) => i.selected)
        .fold(0.0, (s, i) => s + i.scaledCalories);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${result.items.length} itens identificados',
                  style: Theme.of(context).textTheme.labelMedium),
              Text('${totalCal.round()} kcal selecionados',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        if (result.notes != null && result.notes!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(result.notes!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                textAlign: TextAlign.center),
          ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Text('"$_transcript"',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
              textAlign: TextAlign.center),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            itemCount: result.items.length,
            itemBuilder: (_, i) => _PhotoItemCard(item: result.items[i]),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() {
                    _phase = 'idle';
                    _result = null;
                    _transcript = '';
                  }),
                  child: const Text('Refazer'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          height: 20, width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Adicionar selecionados'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildIdle() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 16),
          GestureDetector(
            onTap: _phase == 'listening' ? _stopAndParse : _startListening,
            child: Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _phase == 'listening' ? context.brandPrimary : Colors.grey.shade200,
              ),
              child: Icon(
                Icons.mic_rounded,
                size: 44,
                color: _phase == 'listening' ? Colors.white : Colors.grey,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            _phase == 'listening' ? 'Ouvindo...' : 'Toque para falar',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          if (_transcript.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(_transcript,
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center),
            ),
          const SizedBox(height: 12),
          if (_phase == 'listening')
            FilledButton.icon(
              onPressed: _stopAndParse,
              icon: const Icon(Icons.check_rounded),
              label: const Text('Pronto'),
            )
          else
            Text(
              'Ex: "100g de pão francês e 250ml de leite"',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4)),
              textAlign: TextAlign.center,
            ),
        ],
      ),
    );
  }

  Widget _buildParsing() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CircularProgressIndicator(),
        const SizedBox(height: 20),
        Text('Identificando alimentos...', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Text('"$_transcript"',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center),
      ],
    );
  }

  Widget _buildError() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.mic_off_rounded, size: 48, color: Colors.red),
        const SizedBox(height: 16),
        Text('Não foi possível reconhecer o áudio',
            style: Theme.of(context).textTheme.titleMedium),
        if (_errorMsg.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(_errorMsg, style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
        ],
        const SizedBox(height: 20),
        FilledButton.icon(
          onPressed: _startListening,
          icon: const Icon(Icons.refresh),
          label: const Text('Tentar novamente'),
        ),
      ],
    );
  }
}


// ─── Photo Food Tab ───────────────────────────────────────────────────────────

class _PhotoFoodTab extends ConsumerStatefulWidget {
  const _PhotoFoodTab({required this.meal, required this.onSaved});
  final MealType meal;
  final VoidCallback onSaved;

  @override
  ConsumerState<_PhotoFoodTab> createState() => _PhotoFoodTabState();
}

class _PhotoFoodTabState extends ConsumerState<_PhotoFoodTab> {
  String _phase = 'pick'; // pick | loading | review | error
  File? _imageFile;
  PhotoAnalyzeResult? _result;
  String _error = '';
  bool _saving = false;

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
        source: source, imageQuality: 60, maxWidth: 768, maxHeight: 768);
    if (picked == null) return;
    setState(() {
      _imageFile = File(picked.path);
      _phase = 'loading';
    });
    try {
      final result = await PhotoAnalyzeService.instance.analyzePhoto(_imageFile!);
      setState(() {
        _result = result;
        _phase = 'review';
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _phase = 'error';
      });
    }
  }

  Future<void> _save() async {
    if (_result == null) return;
    final userId = ref.read(currentUserProvider)?.uid ?? '';
    if (userId.isEmpty) return;

    setState(() => _saving = true);
    try {
      final date = ref.read(selectedDateProvider);
      final meal = widget.meal;
      final selected = _result!.items.where((i) => i.selected).toList();

      for (final item in selected) {
        final entry = FoodEntry(
          id: '',
          userId: userId,
          foodName: item.name,
          calories: item.scaledCalories,
          protein: item.scaledProtein,
          carbs: item.scaledCarbs,
          fat: item.scaledFat,
          quantity: item.editedQuantity,
          unit: item.unit,
          mealType: meal,
          date: date,
        );
        await ref.read(foodEntriesProvider.notifier).add(entry);
      }

      widget.onSaved();
    } catch (e) {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return switch (_phase) {
      'pick' => _buildPick(),
      'loading' => _buildLoading(),
      'review' => _buildReview(),
      'error' => _buildError(),
      _ => const SizedBox(),
    };
  }

  Widget _buildPick() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 16),
          const Icon(Icons.restaurant_rounded, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            'Tire uma foto do prato ou escolha da galeria.\nO Kinify identifica os alimentos e calcula os valores nutricionais.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey),
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library_rounded),
                  label: const Text('Galeria'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt_rounded),
                  label: const Text('Câmera'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLoading() {
    final cs = Theme.of(context).colorScheme;
    final baseColor = cs.surfaceContainerHighest;
    final highlightColor = cs.surfaceContainerLow;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Imagem (se houver) com overlay de shimmer
          if (_imageFile != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                children: [
                  Image.file(_imageFile!, height: 180, width: double.infinity, fit: BoxFit.cover),
                  Positioned.fill(
                    child: Shimmer.fromColors(
                      baseColor: Colors.black.withValues(alpha: 0.18),
                      highlightColor: Colors.white.withValues(alpha: 0.12),
                      child: Container(color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // Label de status
          Row(
            children: [
              SizedBox(
                width: 16, height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: cs.primary),
              ),
              const SizedBox(width: 10),
              Text(
                'Kinify está analisando o prato...',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: cs.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Skeleton das linhas de resultado
          Shimmer.fromColors(
            baseColor: baseColor,
            highlightColor: highlightColor,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Nome do alimento (linha larga)
                Container(height: 20, width: double.infinity, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6))),
                const SizedBox(height: 12),
                // Linha média
                Container(height: 14, width: 200, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6))),
                const SizedBox(height: 20),
                // Macros — 4 blocos lado a lado
                Row(
                  children: List.generate(4, (i) => Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(right: i < 3 ? 8 : 0),
                      child: Column(
                        children: [
                          Container(height: 28, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
                          const SizedBox(height: 6),
                          Container(height: 10, width: 36, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4))),
                        ],
                      ),
                    ),
                  )),
                ),
                const SizedBox(height: 20),
                // Linha de detalhe 1
                Container(height: 12, width: 240, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6))),
                const SizedBox(height: 8),
                // Linha de detalhe 2
                Container(height: 12, width: 180, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 56, color: Colors.red),
          const SizedBox(height: 16),
          Text('Não foi possível analisar a foto',
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(_error,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey)),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => setState(() => _phase = 'pick'),
            icon: const Icon(Icons.refresh),
            label: const Text('Tentar novamente'),
          ),
        ],
      ),
    );
  }

  Widget _buildReview() {
    final result = _result!;
    final totalCal =
        result.items.where((i) => i.selected).fold(0.0, (s, i) => s + i.scaledCalories);

    return Column(
      children: [
        if (_imageFile != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.file(_imageFile!, height: 100, width: double.infinity,
                  fit: BoxFit.cover),
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${result.items.length} itens identificados',
                  style: Theme.of(context).textTheme.labelMedium),
              Text('${totalCal.round()} kcal selecionados',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        if (result.notes != null && result.notes!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(result.notes!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                textAlign: TextAlign.center),
          ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            itemCount: result.items.length,
            itemBuilder: (_, i) => _PhotoItemCard(item: result.items[i]),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _phase = 'pick'),
                  child: const Text('Nova foto'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          height: 20, width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Adicionar selecionados'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PhotoItemCard extends StatefulWidget {
  const _PhotoItemCard({required this.item});
  final PhotoFoodItem item;

  @override
  State<_PhotoItemCard> createState() => _PhotoItemCardState();
}

class _PhotoItemCardState extends State<_PhotoItemCard> {
  late final TextEditingController _qtyCtrl;

  @override
  void initState() {
    super.initState();
    _qtyCtrl = TextEditingController(text: widget.item.quantity.round().toString());
  }

  @override
  void dispose() {
    _qtyCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: item.selected,
              onChanged: (v) => setState(() => item.selected = v ?? true),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      SizedBox(
                        width: 70,
                        child: TextField(
                          controller: _qtyCtrl,
                          keyboardType: TextInputType.number,
                          style: Theme.of(context).textTheme.bodySmall,
                          decoration: InputDecoration(
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 6),
                            suffix: Text(item.unit,
                                style: Theme.of(context).textTheme.bodySmall),
                            border: const OutlineInputBorder(),
                          ),
                          onChanged: (v) {
                            final qty = double.tryParse(v);
                            if (qty != null && qty > 0) {
                              setState(() => item.editedQuantity = qty);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${item.scaledCalories.round()} kcal · P:${item.scaledProtein.toStringAsFixed(1)}g · C:${item.scaledCarbs.toStringAsFixed(1)}g · G:${item.scaledFat.toStringAsFixed(1)}g',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.outline),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Weight Card ──────────────────────────────────────────────────────────────

class _WeightCard extends ConsumerStatefulWidget {
  const _WeightCard();
  @override
  ConsumerState<_WeightCard> createState() => _WeightCardState();
}

class _WeightCardState extends ConsumerState<_WeightCard> {
  bool _saving = false;

  // Retorna a data do domingo da semana atual (YYYY-MM-DD)
  String _currentWeekDate() {
    final now = DateTime.now();
    final sunday = now.subtract(Duration(days: now.weekday % 7));
    return '${sunday.year}-${sunday.month.toString().padLeft(2, '0')}-${sunday.day.toString().padLeft(2, '0')}';
  }

  Future<void> _showLogDialog(BuildContext context, WeightEntry? existing) async {
    final ctrl = TextEditingController(
        text: existing != null ? existing.weight.toString() : '');
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Registrar peso'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Registre seu peso em jejum (pela manhã).',
                style: TextStyle(fontSize: 13, color: Colors.grey)),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Peso (kg)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Salvar')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    final weight = double.tryParse(ctrl.text.replaceAll(',', '.'));
    if (weight == null || weight <= 0) return;
    setState(() => _saving = true);
    await ref.read(weightEntriesProvider.notifier).upsert(weight, _currentWeekDate());
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    final entries = ref.watch(weightEntriesProvider).valueOrNull ?? [];
    final weekDate = _currentWeekDate();
    final thisWeek = entries.where((e) => e.date == weekDate).firstOrNull;
    final lastWeek = entries.where((e) => e.date != weekDate).firstOrNull;

    double? diff;
    if (thisWeek != null && lastWeek != null) {
      diff = thisWeek.weight - lastWeek.weight;
    }

    return GradientCard(
      key: TutorialKeys.weightCard,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('⚖️', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Text('Peso corporal', style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              if (_saving)
                const SizedBox(width: 20, height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2))
              else
                IconButton(
                  icon: Icon(
                    thisWeek != null ? Icons.edit_rounded : Icons.add_rounded,
                    size: 20,
                  ),
                  tooltip: thisWeek != null ? 'Editar peso da semana' : 'Registrar peso',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  onPressed: () => _showLogDialog(context, thisWeek),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (thisWeek != null) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${thisWeek.weight.toStringAsFixed(1)} kg',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 12),
                if (diff != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: (diff <= 0 ? Colors.green : Colors.red).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${diff > 0 ? '+' : ''}${diff.toStringAsFixed(1)} kg',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: diff <= 0 ? Colors.green.shade700 : Colors.red.shade700,
                      ),
                    ),
                  ),
              ],
            ),
            if (lastWeek != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Semana anterior: ${lastWeek.weight.toStringAsFixed(1)} kg',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                ),
              ),
          ] else
            Text(
              'Nenhum peso registrado esta semana.\nRegistre em jejum para comparar com a semana anterior.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
            ),
        ],
      ),
    );
  }
}
