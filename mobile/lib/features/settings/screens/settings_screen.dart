// lib/features/settings/screens/settings_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/providers/settings_provider.dart';
import '../../../shared/tutorial/tutorial_phases.dart';
import '../../../shared/tutorial/tutorial_provider.dart';
import '../../../shared/tutorial/tutorial_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../../nutrition/services/water_reminder_service.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(settingsProvider);
    final n = ref.read(settingsProvider.notifier);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surfaceContainerLowest,
      appBar: AppBar(
        title: const Text('Configurações'),
        centerTitle: false,
        backgroundColor: Theme.of(context).colorScheme.surfaceContainerLowest,
        elevation: 0,
        scrolledUnderElevation: 1,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 48),
        children: [

          // ── Modalidades ───────────────────────────────────────────────────
          _SectionCard(
            label: 'MODALIDADES',
            children: [
              _ModalityTile(
                emoji: '💪',
                title: 'Musculação',
                subtitle: 'Treinos de força, hipertrofia e powerlifting',
                active: s.musculacaoActive,
                onTap: () => n.toggleModality('musculacao'),
              ),
              _Divider(),
              _ModalityTile(
                emoji: '❤️',
                title: 'Cardio',
                subtitle: 'Corrida, ciclismo, natação e aeróbico',
                active: s.cardioActive,
                onTap: () => n.toggleModality('cardio'),
              ),
              _Divider(),
              _ModalityTile(
                emoji: '🏋️',
                title: 'CrossFit',
                subtitle: 'WODs, AMRAP, For Time e EMOM',
                active: s.crossfitActive,
                onTap: () => n.toggleModality('crossfit'),
              ),
              if (s.activeModalities.length < 3)
                _InfoBanner(
                  'Treinos das modalidades desativadas ficam ocultos no app.',
                ),
            ],
          ),

          // ── Timer de Descanso ─────────────────────────────────────────────
          _SectionCard(
            label: 'TIMER DE DESCANSO',
            children: [
              _SwitchTile(
                icon: Icons.vibration_rounded,
                title: 'Vibração',
                subtitle: 'Vibrar ao fim do descanso',
                value: s.restTimerVibrate,
                onChanged: n.setRestVibrate,
              ),
              _Divider(),
              _SwitchTile(
                icon: Icons.volume_up_rounded,
                title: 'Som',
                subtitle: 'Efeito sonoro ao fim do descanso',
                value: s.restTimerSound,
                onChanged: n.setRestSound,
              ),
              _Divider(),
              _SliderTile(
                icon: Icons.timer_rounded,
                title: 'Duração padrão',
                subtitle: 'Usado quando o exercício não tem descanso definido',
                value: s.defaultRestSeconds.toDouble(),
                min: 15,
                max: 300,
                divisions: 19,
                displayValue: _formatSeconds(s.defaultRestSeconds),
                labels: const ['15s', '1min', '2min', '3min', '5min'],
                onChanged: (v) => n.setDefaultRest(v.round()),
              ),
            ],
          ),

          // ── Unidade de Peso ───────────────────────────────────────────────
          _SectionCard(
            label: 'UNIDADE DE PESO',
            children: [
              _PickerTile<String>(
                icon: Icons.scale_rounded,
                title: 'Unidade de medida',
                options: const [
                  _Option('kg', 'Quilograma', 'kg'),
                  _Option('lb', 'Libra', 'lb'),
                ],
                selected: s.weightUnit,
                onSelected: n.setWeightUnit,
              ),
            ],
          ),

          // ── Progressão de Carga ───────────────────────────────────────────
          _SectionCard(
            label: 'PROGRESSÃO DE CARGA',
            children: [
              _PickerTile<double>(
                icon: Icons.trending_up_rounded,
                title: 'Incremento padrão de peso',
                options: [
                  _Option(1.25, '1.25', '1.25\n${s.weightUnit}'),
                  _Option(2.5, '2.5', '2.5\n${s.weightUnit}'),
                  _Option(5.0, '5', '5\n${s.weightUnit}'),
                  _Option(10.0, '10', '10\n${s.weightUnit}'),
                ],
                selected: s.weightIncrement,
                onSelected: n.setWeightIncrement,
              ),
            ],
          ),

          // ── Análises ──────────────────────────────────────────────────────
          _SectionCard(
            label: 'ANÁLISES',
            children: [
              _PickerTile<int>(
                icon: Icons.calendar_today_rounded,
                title: 'Primeiro dia da semana',
                options: const [
                  _Option(1, 'Segunda', 'Segunda\n-feira'),
                  _Option(7, 'Domingo', 'Domingo'),
                ],
                selected: s.firstDayOfWeek,
                onSelected: n.setFirstDayOfWeek,
              ),
              _Divider(),
              _PickerTile<int>(
                icon: Icons.flag_rounded,
                title: 'Meta semanal de treinos',
                options: const [
                  _Option(2, '2×', '2×'),
                  _Option(3, '3×', '3×'),
                  _Option(4, '4×', '4×'),
                  _Option(5, '5×', '5×'),
                  _Option(6, '6×', '6×'),
                  _Option(7, '7×', '7×'),
                ],
                selected: s.weeklyGoal,
                onSelected: n.setWeeklyGoal,
              ),
            ],
          ),

          // ── Notificações ──────────────────────────────────────────────────
          _SectionCard(
            label: 'NOTIFICAÇÕES',
            children: [
              _SwitchTile(
                icon: Icons.alarm_rounded,
                title: 'Lembrete de treino',
                subtitle: s.trainingReminder
                    ? 'Todo dia às ${_formatTime(s.reminderHour, s.reminderMinute)}'
                    : 'Receba um lembrete diário',
                value: s.trainingReminder,
                onChanged: n.setTrainingReminder,
                accessory: s.trainingReminder
                    ? _TimeButton(
                        hour: s.reminderHour,
                        minute: s.reminderMinute,
                        onPick: (t) => n.setReminderTime(t),
                      )
                    : null,
              ),
              _Divider(),
              _SwitchTile(
                icon: Icons.bar_chart_rounded,
                title: 'Resumo semanal',
                subtitle: 'Notificação toda segunda com o resumo da semana',
                value: s.weeklyReport,
                onChanged: n.setWeeklyReport,
              ),
            ],
          ),

          // ── Lembrete de Água ──────────────────────────────────────────────
          _WaterReminderCard(settings: s, notifier: n),

          // ── Privacidade ───────────────────────────────────────────────────
          _PrivacySectionCard(),

          // ── Tutorial ──────────────────────────────────────────────────────
          _TutorialSectionCard(ref: ref),

          // ── Aparência ─────────────────────────────────────────────────────
          _SectionCard(
            label: 'APARÊNCIA',
            children: [
              _PickerTile<String>(
                icon: Icons.palette_rounded,
                title: 'Tema',
                options: const [
                  _Option('light', 'Claro', 'Claro', icon: Icons.light_mode_rounded),
                  _Option('system', 'Sistema', 'Sistema', icon: Icons.brightness_auto_rounded),
                  _Option('dark', 'Escuro', 'Escuro', icon: Icons.dark_mode_rounded),
                ],
                selected: s.themeMode,
                onSelected: n.setThemeMode,
              ),
            ],
          ),

          const SizedBox(height: 8),
          Center(
            child: Text(
              'Kinify v1.0.0',
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.3),
              ),
            ),
          ),
        ],
      ),
    );
  }
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

String _formatSeconds(int s) {
  if (s < 60) return '${s}s';
  final m = s ~/ 60;
  final r = s % 60;
  return r == 0 ? '${m}min' : '${m}m${r}s';
}

String _formatTime(int h, int m) =>
    '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';

// ─── Option model ─────────────────────────────────────────────────────────────

class _Option<T> {
  const _Option(this.value, this.label, this.shortLabel, {this.icon});
  final T value;
  final String label;
  final String shortLabel;
  final IconData? icon;
}

// ─── Section card ─────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.label, required this.children});
  final String label;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: cs.onSurface.withValues(alpha: 0.45),
              ),
            ),
          ),
          Material(
            color: cs.surface,
            borderRadius: BorderRadius.circular(16),
            clipBehavior: Clip.antiAlias,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: children,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Thin divider ─────────────────────────────────────────────────────────────

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Divider(
      height: 1,
      thickness: 1,
      indent: 56,
      color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.5),
    );
  }
}

// ─── Info banner ──────────────────────────────────────────────────────────────

class _InfoBanner extends StatelessWidget {
  const _InfoBanner(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.primaryContainer.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded, size: 14, color: cs.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Modality tile ────────────────────────────────────────────────────────────

class _ModalityTile extends StatelessWidget {
  const _ModalityTile({
    required this.emoji,
    required this.title,
    required this.subtitle,
    required this.active,
    required this.onTap,
  });

  final String emoji;
  final String title;
  final String subtitle;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            // Emoji badge
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: active
                    ? cs.primaryContainer
                    : cs.onSurface.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(emoji, style: const TextStyle(fontSize: 20)),
              ),
            ),
            const SizedBox(width: 14),
            // Text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: active
                          ? cs.onSurface
                          : cs.onSurface.withValues(alpha: 0.45),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: cs.onSurface.withValues(alpha: 0.45),
                    ),
                  ),
                ],
              ),
            ),
            // State indicator
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: active ? cs.primary : Colors.transparent,
                border: Border.all(
                  color: active ? cs.primary : cs.outline.withValues(alpha: 0.4),
                  width: 2,
                ),
              ),
              child: active
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Switch tile ──────────────────────────────────────────────────────────────

class _SwitchTile extends StatelessWidget {
  const _SwitchTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    this.accessory,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  final Widget? accessory;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: () => onChanged(!value),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: cs.onSurface.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 20, color: cs.onSurface.withValues(alpha: 0.6)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: cs.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ),
            if (accessory != null) ...[accessory!, const SizedBox(width: 4)],
            Switch(value: value, onChanged: onChanged),
          ],
        ),
      ),
    );
  }
}

// ─── Slider tile ──────────────────────────────────────────────────────────────

class _SliderTile extends StatelessWidget {
  const _SliderTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.min,
    required this.max,
    required this.divisions,
    required this.displayValue,
    required this.labels,
    required this.onChanged,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final double value;
  final double min;
  final double max;
  final int divisions;
  final String displayValue;
  final List<String> labels;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: cs.onSurface.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 20, color: cs.onSurface.withValues(alpha: 0.6)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: cs.onSurface.withValues(alpha: 0.5),
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                displayValue,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: cs.primary,
                ),
              ),
            ],
          ),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 3,
              overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
            ),
            child: Slider(
              value: value,
              min: min,
              max: max,
              divisions: divisions,
              onChanged: onChanged,
            ),
          ),
          // Apenas extremos — alinhados exatamente com início e fim da track
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  labels.first,
                  style: TextStyle(
                    fontSize: 11,
                    color: cs.onSurface.withValues(alpha: 0.4),
                  ),
                ),
                Text(
                  labels.last,
                  style: TextStyle(
                    fontSize: 11,
                    color: cs.onSurface.withValues(alpha: 0.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

// ─── Picker tile ──────────────────────────────────────────────────────────────

class _PickerTile<T> extends StatelessWidget {
  const _PickerTile({
    required this.icon,
    required this.title,
    required this.options,
    required this.selected,
    required this.onSelected,
  });

  final IconData icon;
  final String title;
  final List<_Option<T>> options;
  final T selected;
  final ValueChanged<T> onSelected;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: cs.onSurface.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 20, color: cs.onSurface.withValues(alpha: 0.6)),
              ),
              const SizedBox(width: 14),
              Text(
                title,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: options.map((opt) {
              final isSelected = opt.value == selected;
              final isLast = opt == options.last;
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: isLast ? 0 : 8),
                  child: _OptionButton(
                    label: opt.shortLabel,
                    icon: opt.icon,
                    selected: isSelected,
                    onTap: () => onSelected(opt.value),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

// ─── Option button ────────────────────────────────────────────────────────────

class _OptionButton extends StatelessWidget {
  const _OptionButton({
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final lines = label.split('\n');

    // Cores semânticas M3: onPrimaryContainer é legível sobre primaryContainer
    final bgColor = selected ? cs.primaryContainer : Colors.transparent;
    final fgColor = selected ? cs.onPrimaryContainer : cs.onSurface.withValues(alpha: 0.55);
    final borderColor = selected ? cs.primary : cs.outlineVariant;

    return Material(
      color: bgColor,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        splashColor: cs.primary.withValues(alpha: 0.12),
        highlightColor: cs.primary.withValues(alpha: 0.06),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: borderColor, width: selected ? 1.5 : 1),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18, color: fgColor),
                const SizedBox(height: 4),
              ],
              ...lines.map(
                (line) => Text(
                  line,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
                    color: fgColor,
                    height: 1.3,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Tutorial section card ────────────────────────────────────────────────────

class _TutorialSectionCard extends StatelessWidget {
  const _TutorialSectionCard({required this.ref});
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return _SectionCard(
      label: 'TUTORIAL',
      children: [
        ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: cs.primaryContainer,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.explore_outlined, color: cs.primary, size: 22),
          ),
          title: const Text(
            'Refazer Tour do App',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          subtitle: Text(
            'Reinicia o tour guiado pelo app',
            style: TextStyle(
              fontSize: 12,
              color: cs.onSurface.withValues(alpha: 0.55),
            ),
          ),
          trailing: Icon(
            Icons.chevron_right_rounded,
            color: cs.onSurface.withValues(alpha: 0.35),
          ),
          onTap: () async {
            await TutorialService.resetAll();
            ref.read(tutorialProvider.notifier).start(
                  TutorialPhases.mainApp,
                  TutorialPhases.mainAppSteps,
                );
            if (context.mounted) Navigator.of(context).pop();
          },
        ),
      ],
    );
  }
}

// ─── Privacy section card ─────────────────────────────────────────────────────

class _PrivacySectionCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user    = ref.watch(currentUserProvider);
    final notifier = ref.read(authProvider.notifier);
    final isPrivate = user?.isPrivate ?? false;

    return _SectionCard(
      label: 'PRIVACIDADE',
      children: [
        _SwitchTile(
          icon: Icons.lock_person_rounded,
          title: 'Perfil privado nos grupos',
          subtitle: isPrivate
              ? 'Suas estatísticas ficam ocultas para outros membros'
              : 'Outros membros podem ver suas estatísticas nos grupos',
          value: isPrivate,
          onChanged: (v) => notifier.updatePrivacy(v),
        ),
      ],
    );
  }
}

// ─── Time button ──────────────────────────────────────────────────────────────

class _TimeButton extends StatelessWidget {
  const _TimeButton({
    required this.hour,
    required this.minute,
    required this.onPick,
  });

  final int hour;
  final int minute;
  final ValueChanged<TimeOfDay> onPick;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: () async {
        final t = await showTimePicker(
          context: context,
          initialTime: TimeOfDay(hour: hour, minute: minute),
        );
        if (t != null) onPick(t);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: cs.primaryContainer,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          _formatTime(hour, minute),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: cs.onPrimaryContainer,
          ),
        ),
      ),
    );
  }
}

// ─── Lembrete de Água ─────────────────────────────────────────────────────────

class _WaterReminderCard extends StatelessWidget {
  const _WaterReminderCard({
    required this.settings,
    required this.notifier,
  });
  final AppSettings settings;
  final SettingsNotifier notifier;

  Future<void> _pickHour(
    BuildContext context, {
    required String title,
    required int current,
    required ValueChanged<int> onPick,
  }) async {
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: current, minute: 0),
      helpText: title,
      builder: (ctx, child) => MediaQuery(
        data: MediaQuery.of(ctx).copyWith(alwaysUse24HourFormat: true),
        child: child!,
      ),
    );
    if (t != null) onPick(t.hour);
  }

  void _toggle(bool enabled, AppSettings s, SettingsNotifier n) {
    n.setWaterReminder(enabled: enabled);
    if (enabled) {
      WaterReminderService.instance.schedule(
        enabled: true,
        startHour: s.waterReminderStartHour,
        endHour: s.waterReminderEndHour,
        dailyGoalMl: 2500,
      );
    } else {
      WaterReminderService.instance.cancel();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final theme = Theme.of(context);
    final enabled = settings.waterReminderEnabled;
    final startH = settings.waterReminderStartHour;
    final endH = settings.waterReminderEndHour;
    final hours = (endH - startH).clamp(1, 23);
    final mlPerHour = (2500 / hours).round();

    return _SectionCard(
      label: 'LEMBRETE DE ÁGUA 💧',
      children: [
        _SwitchTile(
          icon: Icons.water_drop_outlined,
          title: 'Lembrete de hidratação',
          subtitle: enabled
              ? 'A cada hora: ${mlPerHour}ml — das ${startH}h às ${endH}h'
              : 'Vibração a cada hora para se hidratar',
          value: enabled,
          onChanged: (v) => _toggle(v, settings, notifier),
        ),
        if (enabled) ...[
          _Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(Icons.schedule_rounded, size: 20,
                    color: cs.onSurface.withValues(alpha: 0.6)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Horário ativo',
                          style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 2),
                      Text(
                        'Das ${startH}h às ${endH}h · $hours intervalos de $mlPerHour ml',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: cs.onSurface.withValues(alpha: 0.55),
                        ),
                      ),
                    ],
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _HourButton(
                      label: '${startH}h',
                      onTap: () => _pickHour(
                        context,
                        title: 'Início dos lembretes',
                        current: startH,
                        onPick: (h) {
                          notifier.setWaterReminder(
                            enabled: true,
                            startHour: h,
                            endHour: endH,
                          );
                          WaterReminderService.instance.schedule(
                            enabled: true,
                            startHour: h,
                            endHour: endH,
                            dailyGoalMl: 2500,
                          );
                        },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Text('→',
                          style: TextStyle(
                              color: cs.onSurface.withValues(alpha: 0.4))),
                    ),
                    _HourButton(
                      label: '${endH}h',
                      onTap: () => _pickHour(
                        context,
                        title: 'Fim dos lembretes',
                        current: endH,
                        onPick: (h) {
                          notifier.setWaterReminder(
                            enabled: true,
                            startHour: startH,
                            endHour: h,
                          );
                          WaterReminderService.instance.schedule(
                            enabled: true,
                            startHour: startH,
                            endHour: h,
                            dailyGoalMl: 2500,
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _HourButton extends StatelessWidget {
  const _HourButton({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: cs.primaryContainer,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: cs.onPrimaryContainer,
          ),
        ),
      ),
    );
  }
}
