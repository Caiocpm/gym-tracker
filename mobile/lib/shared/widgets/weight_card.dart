// lib/shared/widgets/weight_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/brand_provider.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/nutrition/providers/nutrition_provider.dart';
import '../../features/nutrition/providers/weight_provider.dart';
import '../../features/nutrition/domain/nutrition_models.dart';
import '../../features/nutrition/data/nutrition_service.dart';
import '../tutorial/tutorial_keys.dart';
import '../providers/settings_provider.dart';
import 'gradient_card.dart';
import 'gradient_progress_bar.dart';

class WeightCard extends ConsumerStatefulWidget {
  const WeightCard({super.key});

  @override
  ConsumerState<WeightCard> createState() => _WeightCardState();
}

class _WeightCardState extends ConsumerState<WeightCard> {
  bool _saving = false;

  /// Retorna a data do dia âncora da semana que contém [d].
  /// [checkInDay]: 1=Segunda … 7=Domingo (padrão DateTime.weekday)
  static String _weekDate(DateTime d, int checkInDay) {
    final diff = (d.weekday - checkInDay + 7) % 7;
    final anchor = d.subtract(Duration(days: diff));
    return '${anchor.year}-${anchor.month.toString().padLeft(2, '0')}-${anchor.day.toString().padLeft(2, '0')}';
  }

  List<WeightEntry> _sorted(List<WeightEntry> entries) {
    final list = [...entries];
    list.sort((a, b) => b.date.compareTo(a.date));
    return list;
  }

  Future<void> _showLogDialog(
      BuildContext context, WeightEntry? existing, String weekDate, List<WeightEntry> allEntries) async {
    final ctrl = TextEditingController(
        text: existing != null ? existing.weight.toStringAsFixed(1) : '');
    final isFirst = existing == null && allEntries.isEmpty;
    final currentCheckInDay = ref.read(settingsProvider).weightCheckInDay;

    // resultado: [confirmed (bool), chosenDay (int)]
    final result = await showDialog<(bool, int)>(
      context: context,
      builder: (dialogContext) {
        int pickedDay = currentCheckInDay;
        const dayNames = {1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom'};
        return StatefulBuilder(
          builder: (ctx, setLocal) => AlertDialog(
            title: Text(existing != null ? 'Editar peso' : 'Registrar peso'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                Text(
                  'Registre seu peso em jejum (pela manhã).\n\n'
                  '📅 Um registro por semana — qualquer atualização na mesma semana substitui o anterior.',
                  style: Theme.of(ctx).textTheme.bodySmall
                      ?.copyWith(color: Theme.of(ctx).colorScheme.onSurfaceVariant),
                ),
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
                // Picker de dia — apenas na primeira pesagem
                if (isFirst) ...[
                  const SizedBox(height: 16),
                  Text(
                    'Qual dia você costuma se pesar?',
                    style: Theme.of(ctx).textTheme.labelMedium,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: dayNames.entries.map((e) {
                      final selected = pickedDay == e.key;
                      return ChoiceChip(
                        label: Text(e.value),
                        selected: selected,
                        onSelected: (_) => setLocal(() => pickedDay = e.key),
                      );
                    }).toList(),
                  ),
                ],
              ],
              ),
            ),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(ctx, (false, pickedDay)),
                  child: const Text('Cancelar')),
              FilledButton(
                  onPressed: () => Navigator.pop(ctx, (true, pickedDay)),
                  child: const Text('Salvar')),
            ],
          ),
        );
      },
    );
    if (result == null || !result.$1 || !mounted) return;
    final weight = double.tryParse(ctrl.text.replaceAll(',', '.'));
    if (weight == null || weight <= 0) return;

    // Salva o dia escolhido se for a primeira pesagem e mudou
    if (isFirst && result.$2 != currentCheckInDay) {
      ref.read(settingsProvider.notifier).setWeightCheckInDay(result.$2);
    }

    // Recalcula weekDate com o novo dia (caso tenha mudado)
    final effectiveDay = isFirst ? result.$2 : currentCheckInDay;
    final effectiveWeekDate = _weekDate(DateTime.now(), effectiveDay);

    setState(() => _saving = true);
    try {
      await ref.read(weightEntriesProvider.notifier).upsert(weight, effectiveWeekDate);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Erro ao salvar: $e'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _showGoalDialog(
      BuildContext context, double? current, double? currentWeight) async {
    final ctrl = TextEditingController(
        text: current != null ? current.toStringAsFixed(1) : '');
    final result = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Meta de peso'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Defina seu peso alvo. A barra de progresso mostrará a evolução a partir do seu peso atual.',
              style: Theme.of(dialogContext).textTheme.bodySmall?.copyWith(
                  color: Theme.of(dialogContext).colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Meta (kg)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          if (current != null)
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, 'clear'),
              child: const Text('Remover meta',
                  style: TextStyle(color: Colors.red)),
            ),
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, null),
              child: const Text('Cancelar')),
          FilledButton(
              onPressed: () => Navigator.pop(dialogContext, ctrl.text),
              child: const Text('Salvar')),
        ],
      ),
    );
    if (result == null || !mounted) return;
    final userId = ref.read(currentUserProvider)?.uid;
    if (userId == null) return;
    setState(() => _saving = true);
    try {
      final goal =
          result == 'clear' ? null : double.tryParse(result.replaceAll(',', '.'));
      if (result != 'clear' && (goal == null || goal <= 0)) return;
      await NutritionService.instance.updateWeightGoal(
        userId,
        goal,
        currentWeight: goal != null ? currentWeight : null,
      );
      ref.invalidate(nutritionGoalsProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Erro ao salvar meta: $e'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme   = Theme.of(context);
    final cs      = theme.colorScheme;
    final primary        = ref.watch(brandProvider)?.color ?? cs.primary;
    final entries        = ref.watch(weightEntriesProvider).valueOrNull ?? [];
    final goals          = ref.watch(nutritionGoalsProvider).valueOrNull;
    final checkInDay     = ref.watch(settingsProvider).weightCheckInDay;
    final weekDate       = _weekDate(DateTime.now(), checkInDay);

    final sorted   = _sorted(entries);
    final thisWeek = sorted.where((e) => e.date == weekDate).firstOrNull;
    final lastWeek = sorted.where((e) => e.date.compareTo(weekDate) < 0).firstOrNull;

    final double? diff = (thisWeek != null && lastWeek != null)
        ? thisWeek.weight - lastWeek.weight
        : null;

    final weightGoal      = goals?.weightGoal;
    final weightGoalStart = goals?.weightGoalStart;
    double? goalProgress;
    if (thisWeek != null && weightGoal != null && weightGoalStart != null) {
      final totalDelta = weightGoalStart - weightGoal;
      final doneDelta  = weightGoalStart - thisWeek.weight;
      goalProgress = totalDelta.abs() < 0.01
          ? 1.0
          : (doneDelta / totalDelta).clamp(0.0, 1.0);
    }

    final chartData = sorted.reversed.toList();

    return GradientCard(
      key: TutorialKeys.weightCard,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ────────────────────────────────────────────────────────────
          Row(
            children: [
              const Text('⚖️', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Text('Peso corporal', style: theme.textTheme.titleMedium),
              const Spacer(),
              if (_saving)
                const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2))
              else ...[
                IconButton(
                  icon: Icon(
                    weightGoal != null ? Icons.flag_rounded : Icons.flag_outlined,
                    size: 20,
                    color: weightGoal != null ? Colors.amber : cs.onSurfaceVariant,
                  ),
                  tooltip: 'Meta de peso',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  onPressed: () =>
                      _showGoalDialog(context, weightGoal, thisWeek?.weight),
                ),
                IconButton(
                  icon: Icon(
                    thisWeek != null ? Icons.edit_rounded : Icons.add_rounded,
                    size: 20,
                  ),
                  tooltip: thisWeek != null
                      ? 'Editar peso da semana'
                      : 'Registrar peso',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  onPressed: () => _showLogDialog(context, thisWeek, weekDate, entries),
                ),
              ],
            ],
          ),

          const SizedBox(height: 12),

          // ── Peso atual + diff ─────────────────────────────────────────────────
          if (thisWeek != null) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${thisWeek.weight.toStringAsFixed(1)} kg',
                  style: theme.textTheme.headlineMedium
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(width: 10),
                if (diff != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: (diff <= 0 ? Colors.green : Colors.red)
                          .withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${diff > 0 ? '+' : ''}${diff.toStringAsFixed(1)} kg',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: diff <= 0
                            ? Colors.green.shade700
                            : Colors.red.shade700,
                      ),
                    ),
                  ),
                const Spacer(),
                if (weightGoal != null)
                  Text(
                    'Meta: ${weightGoal.toStringAsFixed(1)} kg',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.amber.shade700,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
            if (lastWeek != null)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  'Semana anterior: ${lastWeek.weight.toStringAsFixed(1)} kg',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: cs.onSurfaceVariant),
                ),
              ),
          ] else
            Text(
              'Nenhum peso registrado esta semana.\nRegistre em jejum para comparar com a semana anterior.',
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: cs.onSurfaceVariant),
            ),

          // ── Barra de progresso ────────────────────────────────────────────────
          if (goalProgress != null) ...[
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Progresso para a meta',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: cs.onSurfaceVariant)),
                Text(
                  '${(goalProgress * 100).toStringAsFixed(0)}%',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            GradientProgressBar(value: goalProgress, height: 8),
          ],

          // ── Sparkline ─────────────────────────────────────────────────────────
          if (chartData.length >= 2) ...[
            const SizedBox(height: 16),
            SizedBox(
              height: 72,
              child: _WeightSparkline(entries: chartData, primary: primary),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

class _WeightSparkline extends StatelessWidget {
  const _WeightSparkline({required this.entries, required this.primary});
  final List<WeightEntry> entries;
  final Color primary;

  @override
  Widget build(BuildContext context) {
    final cs     = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final data    = entries.length > 8 ? entries.sublist(entries.length - 8) : entries;
    final weights = data.map((e) => e.weight).toList();
    final minW    = weights.reduce((a, b) => a < b ? a : b);
    final maxW    = weights.reduce((a, b) => a > b ? a : b);
    final padding = (maxW - minW) < 1.0 ? 1.0 : (maxW - minW) * 0.2;

    final spots = List.generate(data.length, (i) => FlSpot(i.toDouble(), data[i].weight));

    return LineChart(
      LineChartData(
        minY: minW - padding,
        maxY: maxW + padding,
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          leftTitles:   const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles:  const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles:    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 20,
              getTitlesWidget: (value, _) {
                if (value != value.roundToDouble()) return const SizedBox.shrink();
                final idx = value.toInt();
                if (idx < 0 || idx >= data.length) return const SizedBox.shrink();
                if (idx != 0 && idx != data.length - 1) return const SizedBox.shrink();
                final parts = data[idx].date.split('-');
                if (parts.length < 3) return const SizedBox.shrink();
                return Text('${parts[2]}/${parts[1]}',
                    style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant));
              },
            ),
          ),
        ),
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (spots) => spots
                .map((s) => LineTooltipItem(
                      '${s.y.toStringAsFixed(1)} kg',
                      TextStyle(
                        color: isDark ? Colors.black : Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ))
                .toList(),
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            curveSmoothness: 0.35,
            color: primary,
            barWidth: 2.5,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, _, __, idx) {
                final isLast = idx == spots.length - 1;
                return FlDotCirclePainter(
                  radius: isLast ? 4.5 : 2.5,
                  color: isLast ? primary : primary.withValues(alpha: 0.5),
                  strokeWidth: isLast ? 2 : 0,
                  strokeColor: Colors.white,
                );
              },
            ),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  primary.withValues(alpha: isDark ? 0.25 : 0.15),
                  primary.withValues(alpha: 0.0),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
