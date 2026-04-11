// lib/features/profile/screens/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/theme/brand_colors.dart';
import '../../../shared/providers/brand_provider.dart';
import '../../../shared/widgets/gradient_card.dart';
import '../../auth/providers/auth_provider.dart';
import '../../auth/domain/auth_user.dart';
import '../providers/profile_provider.dart';
import '../domain/profile_models.dart';
import '../../../shared/tutorial/tutorial_keys.dart';
import '../../../shared/tutorial/tutorial_phases.dart';
import '../../../shared/tutorial/tutorial_trigger.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../nutrition/providers/weight_provider.dart';
import '../../nutrition/domain/nutrition_models.dart';
import '../providers/body_measurements_provider.dart';
import '../domain/body_measurement.dart';
import '../providers/profile_photos_provider.dart';
import '../domain/profile_photo.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/config/env.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return DefaultTabController(
      length: 5,
      child: Scaffold(
        body: NestedScrollView(
          headerSliverBuilder: (context, _) => [
            SliverToBoxAdapter(
              child: TutorialTrigger(
                phase: TutorialPhases.profile,
                steps: TutorialPhases.profileSteps,
              ),
            ),
            _ProfileSliverAppBar(user: user, ref: ref),
          ],
          body: Column(
            children: [
              TabBar(
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                tabs: const [
                  Tab(text: '📊 Dashboard'),
                  Tab(text: '👤 Dados Pessoais'),
                  Tab(text: '📏 Medidas'),
                  Tab(text: '📈 Histórico'),
                  Tab(text: '🏆 Conquistas'),
                ],
              ),
              const Expanded(
                child: TabBarView(
                  children: [
                    _StatsTab(),
                    _PersonalDataTab(),
                    _MeasurementsTab(),
                    _HistoryTab(),
                    _BadgesTab(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── AppBar com perfil ────────────────────────────────────────────────────────

class _ProfileSliverAppBar extends StatefulWidget {
  const _ProfileSliverAppBar({required this.user, required this.ref});
  final AuthUser? user;
  final WidgetRef ref;

  @override
  State<_ProfileSliverAppBar> createState() => _ProfileSliverAppBarState();
}

class _ProfileSliverAppBarState extends State<_ProfileSliverAppBar> {
  bool _uploadingAvatar = false;

  Future<void> _pickAndUploadAvatar() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;
    setState(() => _uploadingAvatar = true);
    try {
      await widget.ref.read(authProvider.notifier).uploadAvatar(picked.path);
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  AuthUser? get user => widget.user;
  WidgetRef get ref => widget.ref;

  @override
  Widget build(BuildContext context) {
    final gradient = ref.watch(brandGradientProvider);
    final primary  = ref.watch(brandProvider)?.color ?? AppTheme.primary;

    return SliverAppBar(
      key: TutorialKeys.profileAppBar,
      expandedHeight: 240,
      pinned: true,
      backgroundColor: primary,
      actions: [
        IconButton(
          icon: const Icon(Icons.edit_outlined, color: Colors.white),
          onPressed: () => _showEditSheet(context, ref, user),
          tooltip: 'Editar perfil',
        ),
        IconButton(
          icon: const Icon(Icons.logout, color: Colors.white),
          onPressed: () => _confirmLogout(context, ref),
          tooltip: 'Sair',
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(gradient: gradient),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  // Avatar com anel de destaque + botão de troca
                  GestureDetector(
                    onTap: _uploadingAvatar ? null : _pickAndUploadAvatar,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Anel externo (glow)
                        Container(
                          width: 96,
                          height: 96,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.15),
                          ),
                        ),
                        // Anel branco
                        Container(
                          width: 90,
                          height: 90,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                          ),
                        ),
                        // Avatar
                        _uploadingAvatar
                            ? const SizedBox(
                                width: 84,
                                height: 84,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 3,
                                ),
                              )
                            : CircleAvatar(
                                radius: 42,
                                backgroundColor: Colors.white.withValues(alpha: 0.25),
                                backgroundImage: user?.photoURL != null
                                    ? (user!.photoURL!.startsWith('/')
                                        ? NetworkImage('${Env.serverBaseUrl}${user!.photoURL!}')
                                        : NetworkImage(user!.photoURL!)) as ImageProvider
                                    : null,
                                child: user?.photoURL == null
                                    ? Text(
                                        (user?.displayName ?? 'U')[0].toUpperCase(),
                                        style: const TextStyle(
                                          fontSize: 34,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                        ),
                                      )
                                    : null,
                              ),
                        // Ícone de câmera
                        if (!_uploadingAvatar)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 1.5),
                              ),
                              child: const Icon(
                                Icons.camera_alt,
                                color: Colors.white,
                                size: 14,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Nome com sombra leve para legibilidade
                  Text(
                    user?.displayName ?? 'Usuário',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      shadows: [
                        Shadow(
                          color: Colors.black26,
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Email com badge estilo pill
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      user?.email ?? '',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  // Bio
                  if (user?.bio?.isNotEmpty == true) ...[
                    const SizedBox(height: 8),
                    Text(
                      user!.bio!,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.85),
                        fontSize: 13,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sair?'),
        content: const Text('Deseja encerrar a sessão?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('Sair'),
          ),
        ],
      ),
    );
  }

  void _showEditSheet(BuildContext context, WidgetRef ref, AuthUser? user) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _EditProfileSheet(user: user),
    );
  }
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────────────

class _StatsTab extends ConsumerWidget {
  const _StatsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(userStatsProvider);

    return statsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) =>
          const Center(child: Text('Erro ao carregar estatísticas')),
      data: (stats) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _QuickStatsCard(stats: stats),
          const SizedBox(height: 16),
          _SectionTitle('🔥 Sequências'),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ProfileStatCard(
                  icon: Icons.local_fire_department,
                  iconColor: Colors.orange,
                  label: 'Sequência atual',
                  value: '${stats.currentStreak} dias',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ProfileStatCard(
                  icon: Icons.emoji_events,
                  iconColor: Colors.amber,
                  label: 'Maior sequência',
                  value: '${stats.longestStreak} dias',
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _SectionTitle('💪 Volume e Recordes'),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ProfileStatCard(
                  icon: Icons.fitness_center,
                  iconColor: context.brandPrimary,
                  label: 'Volume total',
                  value: stats.totalVolumeFormatted,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ProfileStatCard(
                  icon: Icons.star,
                  iconColor: Colors.amber,
                  label: 'Recordes pessoais',
                  value: '${stats.totalPersonalRecords}',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ProfileStatCard(
                  icon: Icons.timer_outlined,
                  iconColor: const Color(0xFF14B8A6),
                  label: 'Tempo total',
                  value: stats.totalTimeFormatted,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ProfileStatCard(
                  icon: Icons.repeat,
                  iconColor: context.brandPrimary,
                  label: 'Total de séries',
                  value: '${stats.totalSets}',
                ),
              ),
            ],
          ),
          if (stats.strongestLift != null) ...[
            const SizedBox(height: 16),
            _SectionTitle('🏋️ Melhor levantamento'),
            const SizedBox(height: 8),
            StrongestLiftCard(
              exerciseName: stats.strongestLift!.exerciseName,
              weight: stats.strongestLift!.weight,
            ),
          ],
          const SizedBox(height: 16),
          _SectionTitle('👥 Social'),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ProfileStatCard(
                  icon: Icons.group,
                  iconColor: Colors.green,
                  label: 'Grupos',
                  value: '${stats.totalGroups}',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ProfileStatCard(
                  icon: Icons.emoji_events_outlined,
                  iconColor: Colors.red,
                  label: 'Desafios',
                  value: '${stats.totalChallengesCompleted}',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ProfileStatCard(
                  icon: Icons.military_tech,
                  iconColor: Colors.amber,
                  label: 'Badges',
                  value: '${stats.totalBadges}',
                ),
              ),
            ],
          ),
          if (stats.memberSince != null) ...[
            const SizedBox(height: 20),
            Center(
              child: Text(
                'Membro desde ${_formatDate(stats.memberSince!)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ],
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      return DateFormat('MMM yyyy', 'pt_BR').format(DateTime.parse(iso));
    } catch (_) {
      return '';
    }
  }
}

// ─── Tab: Dados Pessoais ──────────────────────────────────────────────────────

class _PersonalDataTab extends ConsumerStatefulWidget {
  const _PersonalDataTab();

  @override
  ConsumerState<_PersonalDataTab> createState() => _PersonalDataTabState();
}

class _PersonalDataTabState extends ConsumerState<_PersonalDataTab> {
  late TextEditingController _nameCtrl;
  late TextEditingController _heightCtrl;
  late TextEditingController _bioCtrl;
  String? _sex;
  String? _objective;
  String? _activityLevel;
  DateTime? _birthDate;
  bool _saving = false;

  static const _objectives = [
    ('lose_weight',   'Perder peso',      '🔥'),
    ('gain_muscle',   'Ganhar músculo',   '💪'),
    ('maintain',      'Manter forma',     '⚖️'),
    ('performance',   'Performance',      '🏃'),
    ('health',        'Saúde geral',      '❤️'),
  ];

  static const _activityLevels = [
    ('sedentary',   'Sedentário',   'Quase sem exercício'),
    ('light',       'Leve',         '1-3x/semana'),
    ('moderate',    'Moderado',     '3-5x/semana'),
    ('active',      'Ativo',        '6-7x/semana'),
    ('very_active', 'Muito ativo',  'Atleta / trabalho físico'),
  ];

  static const _activityFactors = {
    'sedentary':   1.2,
    'light':       1.375,
    'moderate':    1.55,
    'active':      1.725,
    'very_active': 1.9,
  };

  @override
  void initState() {
    super.initState();
    final user = ref.read(currentUserProvider);
    _nameCtrl   = TextEditingController(text: user?.displayName ?? '');
    _heightCtrl = TextEditingController(
        text: user?.height != null ? user!.height!.toStringAsFixed(0) : '');
    _bioCtrl    = TextEditingController(text: user?.bio ?? '');
    _sex           = user?.sex;
    _objective     = user?.objective;
    _activityLevel = user?.activityLevel;
    if (user?.birthDate != null) {
      try { _birthDate = DateTime.parse(user!.birthDate!); } catch (_) {}
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _heightCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  int? get _age {
    if (_birthDate == null) return null;
    final now = DateTime.now();
    int a = now.year - _birthDate!.year;
    if (now.month < _birthDate!.month ||
        (now.month == _birthDate!.month && now.day < _birthDate!.day)) a--;
    return a;
  }

  /// Harris-Benedict revisado (Mifflin-St Jeor) × fator de atividade
  /// Requer sexo, idade, altura e peso (pega o mais recente)
  double? _tdee(double? currentWeight) {
    final a = _age;
    final h = double.tryParse(_heightCtrl.text.replaceAll(',', '.'));
    if (a == null || h == null || _sex == null || currentWeight == null) return null;
    final factor = _activityFactors[_activityLevel] ?? 1.2;

    double bmr;
    if (_sex == 'male') {
      bmr = 10 * currentWeight + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * currentWeight + 6.25 * h - 5 * a - 161;
    }
    return bmr * factor;
  }

  void _openPhotoSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _PhotoManagementSheet(),
    );
  }

  Future<void> _pickBirthDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(2000),
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
      helpText: 'Data de nascimento',
    );
    if (picked != null) setState(() => _birthDate = picked);
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      await ref.read(authProvider.notifier).updateProfile(
        displayName:   _nameCtrl.text.trim(),
        bio:           _bioCtrl.text.trim().isEmpty ? null : _bioCtrl.text.trim(),
        birthDate:     _birthDate != null
            ? '${_birthDate!.year.toString().padLeft(4,'0')}-'
              '${_birthDate!.month.toString().padLeft(2,'0')}-'
              '${_birthDate!.day.toString().padLeft(2,'0')}'
            : null,
        sex:           _sex,
        height:        double.tryParse(_heightCtrl.text.replaceAll(',', '.')),
        objective:     _objective,
        activityLevel: _activityLevel,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Perfil atualizado!')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Erro ao salvar')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user    = ref.watch(currentUserProvider);
    final theme   = Theme.of(context);
    final cs      = theme.colorScheme;

    // Latest weight from weight provider
    final weightAsync = ref.watch(weightEntriesProvider);
    final weightEntries = weightAsync.valueOrNull ?? [];
    final latestWeight = weightEntries.isNotEmpty
        ? (List<WeightEntry>.from(weightEntries)
              ..sort((a, b) => b.date.compareTo(a.date)))
            .first
            .weight
        : null;

    final tdee = _tdee(latestWeight);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        // ── Identificação ──────────────────────────────────────────
        GradientCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const GradientIconBadge(emoji: '👤', size: 40),
                const SizedBox(width: 12),
                Text('Identificação', style: theme.textTheme.titleLarge),
              ]),
              const SizedBox(height: 20),
              TextField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Nome de exibição',
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                readOnly: true,
                decoration: InputDecoration(
                  labelText: 'E-mail',
                  prefixIcon: const Icon(Icons.email_outlined),
                  hintText: user?.email ?? '',
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // ── Biometria ──────────────────────────────────────────────
        GradientCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const GradientIconBadge(emoji: '📏', size: 40),
                const SizedBox(width: 12),
                Text('Biometria', style: theme.textTheme.titleLarge),
              ]),
              const SizedBox(height: 20),

              // Data de nascimento
              InkWell(
                onTap: _pickBirthDate,
                borderRadius: BorderRadius.circular(12),
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Data de nascimento',
                    prefixIcon: Icon(Icons.cake_outlined),
                  ),
                  child: Text(
                    _birthDate != null
                        ? DateFormat('dd/MM/yyyy').format(_birthDate!)
                        : 'Selecionar',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: _birthDate != null
                          ? cs.onSurface
                          : cs.onSurface.withValues(alpha: 0.4),
                    ),
                  ),
                ),
              ),
              if (_age != null) ...[
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: Text('$_age anos',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: cs.onSurfaceVariant)),
                ),
              ],

              const SizedBox(height: 16),

              // Sexo
              Text('Sexo biológico', style: theme.textTheme.labelLarge
                  ?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Row(children: [
                _SelectChip(
                  label: '♂ Masculino',
                  selected: _sex == 'male',
                  onTap: () => setState(() => _sex = 'male'),
                ),
                const SizedBox(width: 8),
                _SelectChip(
                  label: '♀ Feminino',
                  selected: _sex == 'female',
                  onTap: () => setState(() => _sex = 'female'),
                ),
              ]),

              const SizedBox(height: 16),

              // Altura
              TextField(
                controller: _heightCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(
                  labelText: 'Altura',
                  prefixIcon: Icon(Icons.height),
                  suffixText: 'cm',
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // ── Objetivo ───────────────────────────────────────────────
        GradientCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const GradientIconBadge(emoji: '🎯', size: 40),
                const SizedBox(width: 12),
                Text('Objetivo', style: theme.textTheme.titleLarge),
              ]),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _objectives.map((o) => _SelectChip(
                  label: '${o.$3} ${o.$2}',
                  selected: _objective == o.$1,
                  onTap: () => setState(() => _objective = o.$1),
                )).toList(),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // ── Nível de atividade ────────────────────────────────────
        GradientCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const GradientIconBadge(emoji: '🏃', size: 40),
                const SizedBox(width: 12),
                Text('Nível de Atividade', style: theme.textTheme.titleLarge),
              ]),
              const SizedBox(height: 16),
              ...(_activityLevels.map((lvl) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  onTap: () => setState(() => _activityLevel = lvl.$1),
                  borderRadius: BorderRadius.circular(12),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: _activityLevel == lvl.$1
                          ? cs.primaryContainer
                          : cs.surfaceContainerHighest,
                      border: _activityLevel == lvl.$1
                          ? Border.all(color: cs.primary, width: 1.5)
                          : null,
                    ),
                    child: Row(children: [
                      Expanded(child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(lvl.$2,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: _activityLevel == lvl.$1
                                    ? cs.onPrimaryContainer
                                    : cs.onSurface,
                              )),
                          Text(lvl.$3,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: _activityLevel == lvl.$1
                                    ? cs.onPrimaryContainer.withValues(alpha: 0.7)
                                    : cs.onSurfaceVariant,
                              )),
                        ],
                      )),
                      if (_activityLevel == lvl.$1)
                        Icon(Icons.check_circle,
                            color: cs.primary, size: 20),
                    ]),
                  ),
                ),
              ))),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // ── Perfil Social ─────────────────────────────────────────
        GradientCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const GradientIconBadge(emoji: '🌐', size: 40),
                const SizedBox(width: 12),
                Text('Perfil Social', style: theme.textTheme.titleLarge),
              ]),
              const SizedBox(height: 20),

              // Bio
              TextField(
                controller: _bioCtrl,
                maxLines: 3,
                maxLength: 300,
                decoration: const InputDecoration(
                  labelText: 'Bio',
                  hintText: 'Conte um pouco sobre você...',
                  alignLabelWithHint: true,
                  prefixIcon: Padding(
                    padding: EdgeInsets.only(bottom: 40),
                    child: Icon(Icons.edit_note_outlined),
                  ),
                ),
              ),

              const SizedBox(height: 4),

              // Privacidade
              Row(children: [
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Perfil privado',
                        style: theme.textTheme.bodyMedium
                            ?.copyWith(fontWeight: FontWeight.w600)),
                    Text('Esconde suas estatísticas e atividade para não-seguidores',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: cs.onSurfaceVariant)),
                  ],
                )),
                Consumer(builder: (context, ref, _) {
                  final user = ref.watch(currentUserProvider);
                  return Switch(
                    value: user?.isPrivate ?? false,
                    onChanged: (v) => ref.read(authProvider.notifier)
                        .updateProfile(isPrivate: v),
                  );
                }),
              ]),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // ── Fotos do Perfil ───────────────────────────────────────
        Consumer(builder: (context, ref, _) {
          final photosAsync = ref.watch(profilePhotosProvider);
          final photos = photosAsync.valueOrNull ?? [];
          return GradientCard(
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => _openPhotoSheet(context),
              child: Row(children: [
                const GradientIconBadge(emoji: '📷', size: 40),
                const SizedBox(width: 12),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Fotos do Perfil',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700)),
                    Text(
                      photos.isEmpty
                          ? 'Nenhuma foto adicionada'
                          : '${photos.length} foto${photos.length > 1 ? 's' : ''}',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: cs.onSurfaceVariant),
                    ),
                  ],
                )),
                if (photos.isNotEmpty)
                  SizedBox(
                    height: 48,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: photos.take(3).map((p) => Padding(
                        padding: const EdgeInsets.only(left: 4),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: CachedNetworkImage(
                            imageUrl: '${Env.serverBaseUrl}${p.url}',
                            width: 44, height: 44,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => Container(
                              width: 44, height: 44,
                              color: cs.surfaceContainerHighest,
                            ),
                          ),
                        ),
                      )).toList(),
                    ),
                  ),
                const SizedBox(width: 8),
                Icon(Icons.chevron_right, color: cs.onSurfaceVariant),
              ]),
            ),
          );
        }),

        // ── TDEE estimado ─────────────────────────────────────────
        if (tdee != null) ...[
          const SizedBox(height: 12),
          GradientCard(
            child: Row(children: [
              const GradientIconBadge(emoji: '⚡', size: 40),
              const SizedBox(width: 12),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Gasto calórico estimado',
                      style: theme.textTheme.titleSmall),
                  Text(
                    '${tdee.round()} kcal/dia',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: cs.primary,
                    ),
                  ),
                  Text(
                    'Mifflin-St Jeor × fator de atividade',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: cs.onSurfaceVariant),
                  ),
                ],
              )),
            ]),
          ),
        ],

        const SizedBox(height: 20),

        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: 20, width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Salvar'),
          ),
        ),
      ],
    );
  }
}

// ─── Sheet: Gerenciar Fotos ───────────────────────────────────────────────────

class _PhotoManagementSheet extends ConsumerStatefulWidget {
  const _PhotoManagementSheet();
  @override
  ConsumerState<_PhotoManagementSheet> createState() =>
      _PhotoManagementSheetState();
}

class _PhotoManagementSheetState
    extends ConsumerState<_PhotoManagementSheet> {
  bool _uploading = false;

  Future<void> _addPhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
        source: ImageSource.gallery, imageQuality: 85, maxWidth: 1200);
    if (picked == null || !mounted) return;
    setState(() => _uploading = true);
    try {
      await ref.read(profilePhotosProvider.notifier).upload(picked.path);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao enviar: $e'),
              backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _deletePhoto(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remover foto'),
        content: const Text('Deseja remover esta foto do perfil?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancelar')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remover'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(profilePhotosProvider.notifier).remove(id);
  }

  void _viewPhoto(List<ProfilePhoto> photos, int index) {
    final cs = Theme.of(context).colorScheme;
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: EdgeInsets.zero,
        child: Stack(children: [
          PageView.builder(
            controller: PageController(initialPage: index),
            itemCount: photos.length,
            itemBuilder: (_, i) => InteractiveViewer(
              child: Center(
                child: CachedNetworkImage(
                  imageUrl: '${Env.serverBaseUrl}${photos[i].url}',
                  fit: BoxFit.contain,
                  placeholder: (_, __) =>
                      const CircularProgressIndicator(color: Colors.white),
                  errorWidget: (_, __, ___) => Icon(
                      Icons.broken_image_outlined, color: cs.onSurfaceVariant),
                ),
              ),
            ),
          ),
          Positioned(
            top: 12, right: 12,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20)),
                child: const Icon(Icons.close, color: Colors.white, size: 20),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final photosAsync = ref.watch(profilePhotosProvider);
    final photos = photosAsync.valueOrNull ?? [];

    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: cs.onSurface.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 8, 16),
            child: Row(children: [
              const Text('📷', style: TextStyle(fontSize: 22)),
              const SizedBox(width: 10),
              Expanded(child: Text('Fotos do Perfil',
                  style: theme.textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w700))),
              _uploading
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2)))
                  : IconButton(
                      icon: const Icon(Icons.add_photo_alternate_outlined),
                      tooltip: 'Adicionar foto',
                      onPressed: _addPhoto,
                    ),
            ]),
          ),
          // Grid ou empty state
          if (photos.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              child: Column(children: [
                Icon(Icons.photo_library_outlined,
                    size: 56, color: cs.onSurface.withValues(alpha: 0.2)),
                const SizedBox(height: 12),
                Text('Nenhuma foto adicionada',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(color: cs.onSurfaceVariant)),
                const SizedBox(height: 6),
                Text('Suas fotos aparecem no seu perfil social.',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: cs.onSurface.withValues(alpha: 0.4))),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: _addPhoto,
                  icon: const Icon(Icons.add_photo_alternate_outlined),
                  label: const Text('Adicionar primeira foto'),
                ),
              ]),
            )
          else
            Flexible(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: GridView.builder(
                  shrinkWrap: true,
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: photos.length,
                  itemBuilder: (_, i) {
                    final photo = photos[i];
                    return GestureDetector(
                      onTap: () => _viewPhoto(photos, i),
                      onLongPress: () => _deletePhoto(photo.id),
                      child: Stack(fit: StackFit.expand, children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: CachedNetworkImage(
                            imageUrl:
                                '${Env.serverBaseUrl}${photo.url}',
                            fit: BoxFit.cover,
                            placeholder: (_, __) =>
                                Container(color: cs.surfaceContainerHighest),
                            errorWidget: (_, __, ___) => Container(
                              color: cs.surfaceContainerHighest,
                              child: Icon(Icons.broken_image_outlined,
                                  color: cs.onSurfaceVariant),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 4, right: 4,
                          child: GestureDetector(
                            onTap: () => _deletePhoto(photo.id),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Icon(Icons.close,
                                  color: Colors.white, size: 14),
                            ),
                          ),
                        ),
                      ]),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ─── Chip de seleção reutilizável ─────────────────────────────────────────────

class _SelectChip extends StatelessWidget {
  const _SelectChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: selected ? cs.primaryContainer : cs.surfaceContainerHighest,
          border: selected
              ? Border.all(color: cs.primary, width: 1.5)
              : Border.all(color: cs.outlineVariant),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: selected ? cs.onPrimaryContainer : cs.onSurfaceVariant,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

// ─── Tab: Medidas ─────────────────────────────────────────────────────────────

class _MeasurementsTab extends ConsumerStatefulWidget {
  const _MeasurementsTab();
  @override
  ConsumerState<_MeasurementsTab> createState() => _MeasurementsTabState();
}

class _MeasurementsTabState extends ConsumerState<_MeasurementsTab> {
  // 0 = Circunferências, 1 = Pollock 7, 2 = Comparativo
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final measurementsAsync = ref.watch(bodyMeasurementsProvider);
    final measurements = measurementsAsync.valueOrNull ?? [];

    return Column(
      children: [
        // ── Sub-tabs ─────────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(
            children: [
              _SubTab(label: '📐 Medidas', active: _tab == 0,
                  onTap: () => setState(() => _tab = 0)),
              const SizedBox(width: 8),
              _SubTab(label: '📌 Pollock 7', active: _tab == 1,
                  onTap: () => setState(() => _tab = 1)),
              const SizedBox(width: 8),
              _SubTab(label: '📊 Comparativo', active: _tab == 2,
                  onTap: () => setState(() => _tab = 2)),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: IndexedStack(
            index: _tab,
            children: [
              _CircumferencesForm(measurements: measurements),
              _Pollock7Form(measurements: measurements),
              _ComparisonView(measurements: measurements),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Sub-tab pill ─────────────────────────────────────────────────────────────

class _SubTab extends StatelessWidget {
  const _SubTab({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? cs.primary : cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: active ? cs.onPrimary : cs.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

// ─── Circunferências ──────────────────────────────────────────────────────────

class _CircumferencesForm extends ConsumerStatefulWidget {
  const _CircumferencesForm({required this.measurements});
  final List<BodyMeasurement> measurements;
  @override
  ConsumerState<_CircumferencesForm> createState() => _CircumferencesFormState();
}

class _CircumferencesFormState extends ConsumerState<_CircumferencesForm> {
  final Map<String, TextEditingController> _ctrls = {};
  bool _saving = false;

  // All field keys used for init/dispose/save
  static const _allKeys = [
    'weight', 'height', 'waist', 'hip', 'chest', 'neck', 'shoulder',
    'armRelaxedRight', 'armRelaxedLeft',
    'armFlexRight', 'armFlexLeft',
    'forearmRight', 'forearmLeft',
    'thighRight', 'thighLeft',
    'calfRight', 'calfLeft',
  ];

  @override
  void initState() {
    super.initState();
    for (final key in _allKeys) {
      _ctrls[key] = TextEditingController();
    }
    // Auto-fill peso com o último registro semanal
    final entries = ref.read(weightEntriesProvider).valueOrNull ?? [];
    if (entries.isNotEmpty) {
      final latest = (List<WeightEntry>.from(entries)
            ..sort((a, b) => b.date.compareTo(a.date)))
          .first;
      _ctrls['weight']!.text = latest.weight.toStringAsFixed(1);
    }
    // Auto-fill altura do perfil do usuário
    final height = ref.read(currentUserProvider)?.height;
    if (height != null && height > 0) {
      _ctrls['height']!.text = height.toStringAsFixed(0);
    }
  }

  @override
  void dispose() {
    for (final c in _ctrls.values) c.dispose();
    super.dispose();
  }

  double? _parse(String key) {
    final ctrl = _ctrls[key];
    if (ctrl == null) return null;
    final v = double.tryParse(ctrl.text.replaceAll(',', '.'));
    return (v != null && v > 0) ? v : null;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final today = DateTime.now();
      final date = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
      final data = <String, dynamic>{'date': date};
      for (final key in _allKeys) {
        final v = _parse(key);
        if (v != null) data[key] = v;
      }
      if (data.length <= 1) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Preencha ao menos um campo')));
        return;
      }
      await ref.read(bodyMeasurementsProvider.notifier).add(data);
      final w = _parse('weight');
      if (w != null) {
        await ref.read(weightEntriesProvider.notifier).upsert(w, date);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Medidas salvas!')));
        for (final c in _ctrls.values) c.clear();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Erro: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _field(String key, String label, {IconData? icon}) => TextField(
        controller: _ctrls[key],
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: icon != null ? Icon(icon, size: 18) : null,
        ),
      );

  Widget _row(Widget a, Widget b) => Row(children: [
        Expanded(child: a),
        const SizedBox(width: 12),
        Expanded(child: b),
      ]);

  Widget _sectionLabel(BuildContext context, String label) => Padding(
        padding: const EdgeInsets.only(top: 20, bottom: 10),
        child: Text(label,
            style: Theme.of(context).textTheme.labelLarge
                ?.copyWith(fontWeight: FontWeight.w700,
                    color: Theme.of(context).colorScheme.primary)),
      );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final latest = widget.measurements.isNotEmpty ? widget.measurements.first : null;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (latest != null) ...[
          GradientCard(child: _PhotosSection(measurement: latest)),
          const SizedBox(height: 16),
          _LatestSummaryCard(m: latest),
        ],

        GradientCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const GradientIconBadge(emoji: '📏', size: 40),
                const SizedBox(width: 12),
                Text('Nova Medição', style: theme.textTheme.titleMedium),
              ]),

              // ── Gerais ─────────────────────────────────────────────────
              _sectionLabel(context, 'Gerais'),
              _row(
                _field('weight', 'Peso (kg)', icon: Icons.monitor_weight_outlined),
                _field('height', 'Altura (cm)', icon: Icons.height),
              ),
              const SizedBox(height: 12),
              _row(
                _field('waist', 'Cintura (cm)'),
                _field('hip', 'Quadril (cm)'),
              ),
              const SizedBox(height: 12),
              _row(
                _field('chest', 'Peito (cm)'),
                _field('neck', 'Pescoço (cm)'),
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: _field('shoulder', 'Ombro (cm)')),
                const Expanded(child: SizedBox()),
              ]),

              // ── Braço relaxado ─────────────────────────────────────────
              _sectionLabel(context, 'Braço relaxado'),
              _row(
                _field('armRelaxedRight', 'Direito (cm)'),
                _field('armRelaxedLeft',  'Esquerdo (cm)'),
              ),

              // ── Braço contraído ────────────────────────────────────────
              _sectionLabel(context, 'Braço contraído'),
              _row(
                _field('armFlexRight', 'Direito (cm)'),
                _field('armFlexLeft',  'Esquerdo (cm)'),
              ),

              // ── Antebraço ──────────────────────────────────────────────
              _sectionLabel(context, 'Antebraço'),
              _row(
                _field('forearmRight', 'Direito (cm)'),
                _field('forearmLeft',  'Esquerdo (cm)'),
              ),

              // ── Coxa ───────────────────────────────────────────────────
              _sectionLabel(context, 'Coxa'),
              _row(
                _field('thighRight', 'Direita (cm)'),
                _field('thighLeft',  'Esquerda (cm)'),
              ),

              // ── Panturrilha ────────────────────────────────────────────
              _sectionLabel(context, 'Panturrilha'),
              _row(
                _field('calfRight', 'Direita (cm)'),
                _field('calfLeft',  'Esquerda (cm)'),
              ),

              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Salvar medidas'),
                ),
              ),
            ],
          ),
        ),

      ],
    );
  }
}

// ─── Photos Section ───────────────────────────────────────────────────────────

class _PhotosSection extends ConsumerStatefulWidget {
  const _PhotosSection({required this.measurement});
  final BodyMeasurement measurement;

  @override
  ConsumerState<_PhotosSection> createState() => _PhotosSectionState();
}

class _PhotosSectionState extends ConsumerState<_PhotosSection> {
  bool _uploading = false;
  final _picker = ImagePicker();

  Future<void> _pickPhoto(ImageSource source) async {
    final file = await _picker.pickImage(source: source, imageQuality: 85);
    if (file == null || !mounted) return;
    setState(() => _uploading = true);
    try {
      await ref.read(bodyMeasurementsProvider.notifier)
          .uploadPhoto(widget.measurement.id, file.path);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Erro ao enviar foto: $e')));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _deletePhoto(String url) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Remover foto?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(context, true),  child: const Text('Remover', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    try {
      await ref.read(bodyMeasurementsProvider.notifier)
          .deletePhoto(widget.measurement.id, url);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Erro: $e')));
    }
  }

  void _showFullscreen(List<String> urls, int index) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => _FullscreenPhotos(urls: urls, initialIndex: index),
    ));
  }

  @override
  Widget build(BuildContext context) {
    // Lê medição atualizada do provider (para refletir uploads)
    final measurements = ref.watch(bodyMeasurementsProvider).valueOrNull ?? [];
    final m = measurements.firstWhere((e) => e.id == widget.measurement.id,
        orElse: () => widget.measurement);
    final photos = m.photos;
    final serverBase = Env.serverBaseUrl;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.camera_alt_outlined, size: 16),
            const SizedBox(width: 6),
            Text('Fotos de progresso',
                style: Theme.of(context).textTheme.labelLarge
                    ?.copyWith(fontWeight: FontWeight.w700)),
            const Spacer(),
            if (_uploading)
              const SizedBox(width: 20, height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2))
            else
              Row(children: [
                IconButton(
                  icon: const Icon(Icons.photo_library_outlined, size: 20),
                  tooltip: 'Galeria',
                  onPressed: () => _pickPhoto(ImageSource.gallery),
                ),
                IconButton(
                  icon: const Icon(Icons.camera_alt_outlined, size: 20),
                  tooltip: 'Câmera',
                  onPressed: () => _pickPhoto(ImageSource.camera),
                ),
              ]),
          ],
        ),
        if (photos.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text('Nenhuma foto adicionada',
                style: Theme.of(context).textTheme.bodySmall
                    ?.copyWith(color: Colors.white38)),
          )
        else
          SizedBox(
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: photos.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final url = photos[i].startsWith('/')
                    ? '$serverBase${photos[i]}'
                    : photos[i];
                return GestureDetector(
                  onTap: () => _showFullscreen(
                    photos.map((p) => p.startsWith('/') ? '$serverBase$p' : p).toList(),
                    i,
                  ),
                  onLongPress: () => _deletePhoto(photos[i]),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: CachedNetworkImage(
                      imageUrl: url,
                      width: 90,
                      height: 100,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        width: 90,
                        color: Colors.white10,
                        child: const Icon(Icons.image_outlined, color: Colors.white24),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        width: 90,
                        color: Colors.white10,
                        child: const Icon(Icons.broken_image_outlined, color: Colors.white24),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        Text('Pressione e segure para remover',
            style: Theme.of(context).textTheme.labelSmall
                ?.copyWith(color: Colors.white24)),
      ],
    );
  }
}

class _FullscreenPhotos extends StatelessWidget {
  const _FullscreenPhotos({required this.urls, required this.initialIndex});
  final List<String> urls;
  final int initialIndex;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.transparent, foregroundColor: Colors.white),
      body: PageView.builder(
        controller: PageController(initialPage: initialIndex),
        itemCount: urls.length,
        itemBuilder: (_, i) => InteractiveViewer(
          child: Center(
            child: CachedNetworkImage(
              imageUrl: urls[i],
              fit: BoxFit.contain,
              placeholder: (_, __) => const CircularProgressIndicator(),
              errorWidget: (_, __, ___) => const Icon(Icons.broken_image, color: Colors.white54, size: 64),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Pollock 7 ────────────────────────────────────────────────────────────────

class _Pollock7Form extends ConsumerStatefulWidget {
  const _Pollock7Form({required this.measurements});
  final List<BodyMeasurement> measurements;
  @override
  ConsumerState<_Pollock7Form> createState() => _Pollock7FormState();
}

class _Pollock7FormState extends ConsumerState<_Pollock7Form> {
  String _sex = 'male';
  final _ageCtrl     = TextEditingController();
  final _weightCtrl  = TextEditingController();
  final _chestCtrl   = TextEditingController();
  final _axilCtrl    = TextEditingController();
  final _tricepCtrl  = TextEditingController();
  final _subscCtrl   = TextEditingController();
  final _abdomCtrl   = TextEditingController();
  final _supraCtrl   = TextEditingController();
  final _thighCtrl   = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    // Auto-fill sex and age from personal data
    final user = ref.read(currentUserProvider);
    if (user != null) {
      if (user.sex != null) _sex = user.sex!;
      final age = user.age;
      if (age != null) _ageCtrl.text = age.toString();
    }
    // Auto-fill weight from latest weight entry
    final entries = ref.read(weightEntriesProvider).valueOrNull ?? [];
    if (entries.isNotEmpty) {
      final latest = (List<WeightEntry>.from(entries)
            ..sort((a, b) => b.date.compareTo(a.date)))
          .first;
      _weightCtrl.text = latest.weight.toStringAsFixed(1);
    }
  }

  // Live preview
  double? get _previewFat {
    final skinfolds = [_chestCtrl, _axilCtrl, _tricepCtrl,
                       _subscCtrl, _abdomCtrl, _supraCtrl, _thighCtrl]
        .map((c) => double.tryParse(c.text.replaceAll(',', '.')))
        .toList();
    final age = int.tryParse(_ageCtrl.text);
    if (skinfolds.any((s) => s == null || s <= 0) || age == null || age <= 0) return null;
    final sum7 = skinfolds.fold(0.0, (s, v) => s + v!);
    double bd;
    if (_sex == 'male') {
      bd = 1.112 - 0.00043499 * sum7 + 0.00000055 * sum7 * sum7 - 0.00028826 * age;
    } else {
      bd = 1.097 - 0.00046971 * sum7 + 0.00000056 * sum7 * sum7 - 0.00012828 * age;
    }
    return ((4.95 / bd) - 4.5) * 100;
  }

  @override
  void dispose() {
    for (final c in [_ageCtrl, _weightCtrl, _chestCtrl, _axilCtrl,
                     _tricepCtrl, _subscCtrl, _abdomCtrl, _supraCtrl, _thighCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final fat = _previewFat;
    if (fat == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Preencha todas as 7 dobras, idade e sexo')));
      return;
    }
    setState(() => _saving = true);
    try {
      final today = DateTime.now();
      final date = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
      final w = double.tryParse(_weightCtrl.text.replaceAll(',', '.'));
      final data = <String, dynamic>{
        'date': date,
        'sex': _sex,
        'age': int.tryParse(_ageCtrl.text),
        if (w != null && w > 0) 'weight': w,
        'skinfoldChest':       double.parse(_chestCtrl.text.replaceAll(',', '.')),
        'skinfoldAxillary':    double.parse(_axilCtrl.text.replaceAll(',', '.')),
        'skinfoldTricep':      double.parse(_tricepCtrl.text.replaceAll(',', '.')),
        'skinfoldSubscapular': double.parse(_subscCtrl.text.replaceAll(',', '.')),
        'skinfoldAbdominal':   double.parse(_abdomCtrl.text.replaceAll(',', '.')),
        'skinfoldSuprailiac':  double.parse(_supraCtrl.text.replaceAll(',', '.')),
        'skinfoldThigh':       double.parse(_thighCtrl.text.replaceAll(',', '.')),
      };
      await ref.read(bodyMeasurementsProvider.notifier).add(data);

      // Sincroniza peso com o registro semanal
      if (w != null && w > 0) {
        final sunday = DateTime.now().subtract(
            Duration(days: DateTime.now().weekday % 7));
        final weekDate =
            '${sunday.year}-${sunday.month.toString().padLeft(2, '0')}-${sunday.day.toString().padLeft(2, '0')}';
        await ref.read(weightEntriesProvider.notifier).upsert(w, weekDate);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Avaliação salva!')));
        for (final c in [_chestCtrl, _axilCtrl, _tricepCtrl,
                         _subscCtrl, _abdomCtrl, _supraCtrl, _thighCtrl]) {
          c.clear();
        }
        setState(() {});
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Erro: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  static const _skinfoldFields = [
    ('_chestCtrl',  'Tórax (mm)'),
    ('_axilCtrl',   'Axilar média (mm)'),
    ('_tricepCtrl', 'Tríceps (mm)'),
    ('_subscCtrl',  'Subescapular (mm)'),
    ('_abdomCtrl',  'Abdominal (mm)'),
    ('_supraCtrl',  'Supra-ilíaca (mm)'),
    ('_thighCtrl',  'Coxa (mm)'),
  ];

  TextEditingController _ctrlFor(String key) => switch (key) {
    '_chestCtrl'  => _chestCtrl,
    '_axilCtrl'   => _axilCtrl,
    '_tricepCtrl' => _tricepCtrl,
    '_subscCtrl'  => _subscCtrl,
    '_abdomCtrl'  => _abdomCtrl,
    '_supraCtrl'  => _supraCtrl,
    _             => _thighCtrl,
  };

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final cs     = theme.colorScheme;
    final fat    = _previewFat;
    final weight = double.tryParse(_weightCtrl.text.replaceAll(',', '.'));
    final leanKg = (fat != null && weight != null && weight > 0)
        ? weight * (1 - fat / 100) : null;
    final fatKg  = (fat != null && weight != null && weight > 0)
        ? weight * (fat / 100) : null;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // ── Live preview ──────────────────────────────────────────────────
        if (fat != null)
          ElevatedGradientCard(
            margin: const EdgeInsets.only(bottom: 16),
            child: Column(
              children: [
                Text('Composição Corporal Estimada',
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                  _CompStat(label: '% Gordura',
                      value: '${fat.toStringAsFixed(1)}%',
                      color: _fatColor(fat, cs)),
                  if (leanKg != null)
                    _CompStat(label: 'Massa Magra',
                        value: '${leanKg.toStringAsFixed(1)} kg',
                        color: Colors.green),
                  if (fatKg != null)
                    _CompStat(label: 'Massa Gorda',
                        value: '${fatKg.toStringAsFixed(1)} kg',
                        color: Colors.orange),
                ]),
                const SizedBox(height: 12),
                _FatBar(percent: fat),
                const SizedBox(height: 4),
                Text(_fatCategory(fat, _sex),
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: _fatColor(fat, cs),
                            fontWeight: FontWeight.w600)),
              ],
            ),
          ),

        GradientCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const GradientIconBadge(emoji: '📌', size: 40),
                const SizedBox(width: 12),
                Expanded(child: Text('Pollock 7 Dobras',
                    style: theme.textTheme.titleMedium)),
              ]),
              const SizedBox(height: 4),
              Text('Jackson & Pollock (1978) — insira os valores em mm',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: cs.onSurfaceVariant)),
              const SizedBox(height: 16),

              // Sex selector
              Row(children: [
                Text('Sexo:', style: theme.textTheme.bodyMedium
                    ?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(width: 12),
                _SexChip(label: 'Masculino', selected: _sex == 'male',
                    onTap: () => setState(() => _sex = 'male')),
                const SizedBox(width: 8),
                _SexChip(label: 'Feminino', selected: _sex == 'female',
                    onTap: () => setState(() => _sex = 'female')),
              ]),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(child: TextField(
                  controller: _ageCtrl,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(labelText: 'Idade'),
                )),
                const SizedBox(width: 12),
                Expanded(child: TextField(
                  controller: _weightCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(labelText: 'Peso (kg)'),
                )),
              ]),
              const SizedBox(height: 12),

              // 7 skinfold fields
              ...List.generate((_skinfoldFields.length / 2).ceil(), (i) {
                final a = _skinfoldFields[i * 2];
                final b = (i * 2 + 1) < _skinfoldFields.length
                    ? _skinfoldFields[i * 2 + 1] : null;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(children: [
                    Expanded(child: TextField(
                      controller: _ctrlFor(a.$1),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(labelText: a.$2),
                    )),
                    if (b != null) ...[
                      const SizedBox(width: 12),
                      Expanded(child: TextField(
                        controller: _ctrlFor(b.$1),
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        onChanged: (_) => setState(() {}),
                        decoration: InputDecoration(labelText: b.$2),
                      )),
                    ] else
                      const Expanded(child: SizedBox()),
                  ]),
                );
              }),

              const SizedBox(height: 4),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: (fat == null || _saving) ? null : _save,
                  child: _saving
                      ? const SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Salvar avaliação'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  static Color _fatColor(double fat, ColorScheme cs) {
    if (fat < 10) return Colors.blue;
    if (fat < 18) return Colors.green;
    if (fat < 25) return Colors.orange;
    return Colors.red;
  }

  static String _fatCategory(double fat, String sex) {
    if (sex == 'male') {
      if (fat < 6)  return 'Gordura essencial';
      if (fat < 14) return 'Atlético';
      if (fat < 18) return 'Boa forma';
      if (fat < 25) return 'Aceitável';
      return 'Acima do recomendado';
    } else {
      if (fat < 14) return 'Gordura essencial';
      if (fat < 21) return 'Atlético';
      if (fat < 25) return 'Boa forma';
      if (fat < 32) return 'Aceitável';
      return 'Acima do recomendado';
    }
  }
}

// ─── Comparativo ─────────────────────────────────────────────────────────────

class _ComparisonView extends ConsumerWidget {
  const _ComparisonView({required this.measurements});
  final List<BodyMeasurement> measurements;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs    = theme.colorScheme;
    final primary = cs.primary;

    if (measurements.length < 2) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            GradientIconBadge(emoji: '📊', size: 72),
            const SizedBox(height: 20),
            Text('Comparativo', style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text('Salve pelo menos 2 medições para ver o comparativo.',
                style: theme.textTheme.bodyMedium, textAlign: TextAlign.center),
          ]),
        ),
      );
    }

    // Sort asc for charts
    final sorted = [...measurements]..sort((a, b) => a.date.compareTo(b.date));
    final first  = sorted.first;
    final last   = sorted.last;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // ── % Gordura ao longo do tempo ───────────────────────────────────
        if (sorted.any((m) => m.bodyFatPercent != null)) ...[
          _ChartCard(
            title: '% Gordura Corporal',
            emoji: '🔥',
            entries: sorted
                .where((m) => m.bodyFatPercent != null)
                .map((m) => _ChartPoint(m.date, m.bodyFatPercent!))
                .toList(),
            color: Colors.orange,
            unit: '%',
          ),
          const SizedBox(height: 16),
        ],

        // ── Peso ao longo do tempo ────────────────────────────────────────
        if (sorted.any((m) => m.weight != null)) ...[
          _ChartCard(
            title: 'Peso Corporal',
            emoji: '⚖️',
            entries: sorted
                .where((m) => m.weight != null)
                .map((m) => _ChartPoint(m.date, m.weight!))
                .toList(),
            color: primary,
            unit: 'kg',
          ),
          const SizedBox(height: 16),
        ],

        // ── Comparativo de fotos: primeira vs última ──────────────────────
        if (first.photos.isNotEmpty || last.photos.isNotEmpty) ...[
          GradientCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const GradientIconBadge(emoji: '📸', size: 36),
                  const SizedBox(width: 10),
                  Text('Comparativo de Fotos',
                      style: Theme.of(context).textTheme.titleSmall
                          ?.copyWith(fontWeight: FontWeight.w700)),
                ]),
                const SizedBox(height: 4),
                Text(
                  '${_fmt(first.date)}  →  ${_fmt(last.date)}',
                  style: Theme.of(context).textTheme.bodySmall
                      ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _PhotoComparePanel(m: first, label: '1ª medição')),
                    const SizedBox(width: 8),
                    Expanded(child: _PhotoComparePanel(m: last, label: 'Última')),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // ── Deltas: primeira vs última medição ────────────────────────────
        GradientCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                const GradientIconBadge(emoji: '📈', size: 36),
                const SizedBox(width: 10),
                Text('Evolução (1ª → última)',
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w700)),
              ]),
              const SizedBox(height: 12),
              Text(
                '${_fmt(first.date)}  →  ${_fmt(last.date)}',
                style: theme.textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              Wrap(spacing: 10, runSpacing: 10, children: [
                if (first.weight != null && last.weight != null)
                  _DeltaChip(label: 'Peso', from: first.weight!, to: last.weight!, unit: 'kg', lowerIsBetter: true),
                if (first.bodyFatPercent != null && last.bodyFatPercent != null)
                  _DeltaChip(label: '% Gordura', from: first.bodyFatPercent!, to: last.bodyFatPercent!, unit: '%', lowerIsBetter: true),
                if (first.leanMassKg != null && last.leanMassKg != null)
                  _DeltaChip(label: 'Massa magra', from: first.leanMassKg!, to: last.leanMassKg!, unit: 'kg', lowerIsBetter: false),
                if (first.waist != null && last.waist != null)
                  _DeltaChip(label: 'Cintura', from: first.waist!, to: last.waist!, unit: 'cm', lowerIsBetter: true),
                if (first.hip != null && last.hip != null)
                  _DeltaChip(label: 'Quadril', from: first.hip!, to: last.hip!, unit: 'cm', lowerIsBetter: true),
                if (first.chest != null && last.chest != null)
                  _DeltaChip(label: 'Peito', from: first.chest!, to: last.chest!, unit: 'cm', lowerIsBetter: false),
                if (first.armRelaxedRight != null && last.armRelaxedRight != null)
                  _DeltaChip(label: 'Braço D', from: first.armRelaxedRight!, to: last.armRelaxedRight!, unit: 'cm', lowerIsBetter: false),
                if (first.armRelaxedLeft != null && last.armRelaxedLeft != null)
                  _DeltaChip(label: 'Braço E', from: first.armRelaxedLeft!, to: last.armRelaxedLeft!, unit: 'cm', lowerIsBetter: false),
                if (first.thighRight != null && last.thighRight != null)
                  _DeltaChip(label: 'Coxa D', from: first.thighRight!, to: last.thighRight!, unit: 'cm', lowerIsBetter: false),
                if (first.thighLeft != null && last.thighLeft != null)
                  _DeltaChip(label: 'Coxa E', from: first.thighLeft!, to: last.thighLeft!, unit: 'cm', lowerIsBetter: false),
              ]),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // ── Histórico de medições ─────────────────────────────────────────
        GradientCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                child: Row(children: [
                  const GradientIconBadge(emoji: '📋', size: 32),
                  const SizedBox(width: 10),
                  Text('Histórico', style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
                  const Spacer(),
                  Text('${measurements.length} medições',
                      style: theme.textTheme.bodySmall),
                ]),
              ),
              const Divider(height: 1),
              ...measurements.map((m) => _MeasurementHistoryRow(
                measurement: m,
                onDelete: () => ref.read(bodyMeasurementsProvider.notifier).remove(m.id),
              )),
            ],
          ),
        ),
      ],
    );
  }

  static String _fmt(String date) {
    try {
      final d = DateTime.parse(date);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) { return date; }
  }
}

// ─── Photo Compare Panel ──────────────────────────────────────────────────────

class _PhotoComparePanel extends StatefulWidget {
  const _PhotoComparePanel({required this.m, required this.label});
  final BodyMeasurement m;
  final String label;

  @override
  State<_PhotoComparePanel> createState() => _PhotoComparePanelState();
}

class _PhotoComparePanelState extends State<_PhotoComparePanel> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final photos = widget.m.photos;
    final serverBase = Env.serverBaseUrl;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label,
            style: Theme.of(context).textTheme.labelSmall
                ?.copyWith(color: Colors.white60)),
        const SizedBox(height: 6),
        if (photos.isEmpty)
          Container(
            height: 160,
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: Icon(Icons.camera_alt_outlined, color: Colors.white24, size: 36),
            ),
          )
        else
          GestureDetector(
            onTap: () {
              Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => _FullscreenPhotos(
                  urls: photos.map((p) => p.startsWith('/') ? '$serverBase$p' : p).toList(),
                  initialIndex: _index,
                ),
              ));
            },
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: photos[_index].startsWith('/')
                        ? '$serverBase${photos[_index]}'
                        : photos[_index],
                    height: 160,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(
                      height: 160,
                      color: Colors.white10,
                      child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                    ),
                    errorWidget: (_, __, ___) => Container(
                      height: 160,
                      color: Colors.white10,
                      child: const Icon(Icons.broken_image_outlined, color: Colors.white24),
                    ),
                  ),
                ),
                if (photos.length > 1)
                  Positioned(
                    bottom: 6,
                    right: 6,
                    child: Row(
                      children: [
                        _CompareNavBtn(
                          icon: Icons.chevron_left,
                          onTap: () => setState(() => _index = (_index - 1 + photos.length) % photos.length),
                        ),
                        const SizedBox(width: 4),
                        _CompareNavBtn(
                          icon: Icons.chevron_right,
                          onTap: () => setState(() => _index = (_index + 1) % photos.length),
                        ),
                      ],
                    ),
                  ),
                Positioned(
                  bottom: 6, left: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text('${_index + 1}/${photos.length}',
                        style: const TextStyle(color: Colors.white, fontSize: 11)),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _CompareNavBtn extends StatelessWidget {
  const _CompareNavBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black54,
            borderRadius: BorderRadius.circular(6),
          ),
          padding: const EdgeInsets.all(2),
          child: Icon(icon, color: Colors.white, size: 18),
        ),
      );
}

// ─── Chart card ───────────────────────────────────────────────────────────────

class _ChartPoint {
  const _ChartPoint(this.date, this.value);
  final String date;
  final double value;
}

class _ChartCard extends StatelessWidget {
  const _ChartCard({
    required this.title, required this.emoji,
    required this.entries, required this.color, required this.unit,
  });
  final String title;
  final String emoji;
  final List<_ChartPoint> entries;
  final Color color;
  final String unit;

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final cs     = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    final values = entries.map((e) => e.value).toList();
    final minV   = values.reduce((a, b) => a < b ? a : b);
    final maxV   = values.reduce((a, b) => a > b ? a : b);
    final pad    = (maxV - minV) < 1.0 ? 1.0 : (maxV - minV) * 0.2;

    final spots = List.generate(entries.length,
        (i) => FlSpot(i.toDouble(), entries[i].value));

    return GradientCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$emoji  $title',
              style: theme.textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          SizedBox(
            height: 120,
            child: LineChart(LineChartData(
              minY: minV - pad,
              maxY: maxV + pad,
              gridData: FlGridData(
                drawHorizontalLine: true,
                drawVerticalLine: false,
                horizontalInterval: (maxV - minV + pad * 2) / 4,
                getDrawingHorizontalLine: (_) => FlLine(
                  color: cs.outlineVariant.withValues(alpha: 0.5),
                  strokeWidth: 1,
                ),
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 40,
                  getTitlesWidget: (v, _) => Text(
                    v.toStringAsFixed(1),
                    style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant),
                  ),
                )),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 22,
                  getTitlesWidget: (v, _) {
                    final idx = v.toInt();
                    if (idx < 0 || idx >= entries.length) return const SizedBox.shrink();
                    if (idx != 0 && idx != entries.length - 1) return const SizedBox.shrink();
                    final d = entries[idx].date.split('-');
                    if (d.length < 3) return const SizedBox.shrink();
                    return Text('${d[2]}/${d[1]}',
                        style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant));
                  },
                )),
              ),
              lineTouchData: LineTouchData(
                touchTooltipData: LineTouchTooltipData(
                  getTooltipItems: (s) => s.map((sp) => LineTooltipItem(
                    '${sp.y.toStringAsFixed(1)} $unit',
                    TextStyle(
                      color: isDark ? Colors.black : Colors.white,
                      fontSize: 12, fontWeight: FontWeight.w700,
                    ),
                  )).toList(),
                ),
              ),
              lineBarsData: [LineChartBarData(
                spots: spots,
                isCurved: true,
                curveSmoothness: 0.3,
                color: color,
                barWidth: 2.5,
                dotData: FlDotData(show: true, getDotPainter: (spot, _, __, idx) {
                  final isLast = idx == spots.length - 1;
                  return FlDotCirclePainter(
                    radius: isLast ? 5 : 3,
                    color: isLast ? color : color.withValues(alpha: 0.5),
                    strokeWidth: isLast ? 2 : 0,
                    strokeColor: cs.surface,
                  );
                }),
                belowBarData: BarAreaData(show: true, gradient: LinearGradient(
                  begin: Alignment.topCenter, end: Alignment.bottomCenter,
                  colors: [color.withValues(alpha: isDark ? 0.2 : 0.12), color.withValues(alpha: 0)],
                )),
              )],
            )),
          ),
        ],
      ),
    );
  }
}

// ─── Delta chip ───────────────────────────────────────────────────────────────

class _DeltaChip extends StatelessWidget {
  const _DeltaChip({
    required this.label, required this.from, required this.to,
    required this.unit, required this.lowerIsBetter,
  });
  final String label;
  final double from;
  final double to;
  final String unit;
  final bool lowerIsBetter;

  @override
  Widget build(BuildContext context) {
    final delta = to - from;
    final isGood = lowerIsBetter ? delta <= 0 : delta >= 0;
    final color = delta == 0
        ? Theme.of(context).colorScheme.onSurfaceVariant
        : isGood ? Colors.green : Colors.orange;
    final sign = delta > 0 ? '+' : '';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label,
              style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          const SizedBox(height: 2),
          Text(
            '$sign${delta.toStringAsFixed(1)} $unit',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color),
          ),
          Text(
            '${from.toStringAsFixed(1)} → ${to.toStringAsFixed(1)}',
            style: TextStyle(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

// ─── Latest summary card ─────────────────────────────────────────────────────

class _LatestSummaryCard extends StatelessWidget {
  const _LatestSummaryCard({required this.m});
  final BodyMeasurement m;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs    = theme.colorScheme;
    final items = <(String, String)>[
      if (m.weight != null)       ('Peso', '${m.weight!.toStringAsFixed(1)} kg'),
      if (m.height != null)       ('Altura', '${m.height!.toStringAsFixed(0)} cm'),
      if (m.bmi != null)          ('IMC', m.bmi!.toStringAsFixed(1)),
      if (m.waist != null)        ('Cintura', '${m.waist!.toStringAsFixed(1)} cm'),
      if (m.hip != null)          ('Quadril', '${m.hip!.toStringAsFixed(1)} cm'),
      if (m.chest != null)             ('Peito', '${m.chest!.toStringAsFixed(1)} cm'),
      if (m.armRelaxedRight != null)   ('Braço D', '${m.armRelaxedRight!.toStringAsFixed(1)} cm'),
      if (m.armRelaxedLeft != null)    ('Braço E', '${m.armRelaxedLeft!.toStringAsFixed(1)} cm'),
      if (m.thighRight != null)        ('Coxa D', '${m.thighRight!.toStringAsFixed(1)} cm'),
      if (m.thighLeft != null)         ('Coxa E', '${m.thighLeft!.toStringAsFixed(1)} cm'),
      if (m.bodyFatPercent != null)    ('% Gord.', '${m.bodyFatPercent!.toStringAsFixed(1)}%'),
    ];
    if (items.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GradientCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const GradientIconBadge(emoji: '📋', size: 32),
              const SizedBox(width: 8),
              Text('Última medição',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const Spacer(),
              Text(_fmtDate(m.date),
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: cs.onSurfaceVariant)),
            ]),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: items.map((item) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Text(item.$1,
                      style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant)),
                  Text(item.$2,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                ]),
              )).toList(),
            ),
          ],
        ),
      ),
    );
  }

  static String _fmtDate(String date) {
    try {
      final d = DateTime.parse(date);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) { return date; }
  }
}

// ─── Measurement history row ──────────────────────────────────────────────────

class _MeasurementHistoryRow extends StatelessWidget {
  const _MeasurementHistoryRow({required this.measurement, required this.onDelete});
  final BodyMeasurement measurement;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final m     = measurement;
    final theme = Theme.of(context);
    final cs    = theme.colorScheme;

    final parts = <String>[
      if (m.weight != null)        '${m.weight!.toStringAsFixed(1)} kg',
      if (m.bodyFatPercent != null)'${m.bodyFatPercent!.toStringAsFixed(1)}% gord.',
      if (m.waist != null)         'cin. ${m.waist!.toStringAsFixed(0)} cm',
    ];

    return Column(children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(_fmtDate(m.date),
                style: theme.textTheme.bodyMedium
                    ?.copyWith(fontWeight: FontWeight.w600)),
            if (parts.isNotEmpty)
              Text(parts.join('  ·  '),
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: cs.onSurfaceVariant)),
          ]),
          const Spacer(),
          IconButton(
            icon: Icon(Icons.delete_outline, size: 18, color: cs.error),
            onPressed: onDelete,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        ]),
      ),
      const Divider(height: 1),
    ]);
  }

  static String _fmtDate(String date) {
    try {
      final d = DateTime.parse(date);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) { return date; }
  }
}

// ─── Helper: fat bar ──────────────────────────────────────────────────────────

class _FatBar extends StatelessWidget {
  const _FatBar({required this.percent});
  final double percent;

  @override
  Widget build(BuildContext context) {
    final zones = [
      (6.0,  Colors.blue,   'Essencial'),
      (14.0, Colors.green,  'Atlético'),
      (18.0, Colors.teal,   'Boa forma'),
      (25.0, Colors.orange, 'Aceitável'),
      (40.0, Colors.red,    'Alto'),
    ];
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: SizedBox(
        height: 12,
        child: LayoutBuilder(builder: (_, constraints) {
          double pos = (percent / 40).clamp(0.0, 1.0) * constraints.maxWidth;
          return Stack(children: [
            Row(children: zones.map((z) {
              final w = (z.$1 / 40) * constraints.maxWidth;
              return Container(width: w, color: z.$2.withValues(alpha: 0.3));
            }).toList()),
            Positioned(
              left: pos - 2,
              top: 0, bottom: 0,
              child: Container(width: 3, color: Colors.white),
            ),
          ]);
        }),
      ),
    );
  }
}

// ─── Helper: composition stat ─────────────────────────────────────────────────

class _CompStat extends StatelessWidget {
  const _CompStat({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) => Column(mainAxisSize: MainAxisSize.min, children: [
    Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
    Text(label, style: Theme.of(context).textTheme.bodySmall),
  ]);
}

// ─── Helper: sex chip ─────────────────────────────────────────────────────────

class _SexChip extends StatelessWidget {
  const _SexChip({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? cs.primary.withValues(alpha: 0.12) : cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? cs.primary : cs.outlineVariant,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(label, style: TextStyle(
          fontSize: 13, fontWeight: FontWeight.w600,
          color: selected ? cs.primary : cs.onSurfaceVariant,
        )),
      ),
    );
  }
}

// ─── Tab: Histórico ───────────────────────────────────────────────────────────

class _HistoryTab extends ConsumerWidget {
  const _HistoryTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entriesAsync = ref.watch(weightEntriesProvider);
    final theme = Theme.of(context);
    final cs    = theme.colorScheme;

    return entriesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const Center(child: Text('Erro ao carregar histórico')),
      data: (entries) {
        if (entries.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  GradientIconBadge(emoji: '📈', size: 72),
                  const SizedBox(height: 20),
                  Text('Histórico de Peso',
                      style: theme.textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(
                    'Salve suas medidas na aba Medidas para acompanhar sua evolução aqui.',
                    style: theme.textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }

        // Sort descending by date
        final sorted = [...entries]
          ..sort((a, b) => b.date.compareTo(a.date));

        // Compute progress indicators (vs first entry)
        final oldest  = entries.reduce((a, b) => a.date.compareTo(b.date) < 0 ? a : b);
        final newest  = sorted.first;
        final delta   = newest.weight - oldest.weight;
        final hasMulti = entries.length > 1;

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ── Summary card ─────────────────────────────────────────────────
            if (hasMulti)
              ElevatedGradientCard(
                margin: const EdgeInsets.only(bottom: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _WeightStat(
                      label: 'Peso inicial',
                      value: '${oldest.weight.toStringAsFixed(1)} kg',
                    ),
                    Container(
                      width: 1, height: 36,
                      color: cs.onSurface.withValues(alpha: 0.12),
                    ),
                    _WeightStat(
                      label: 'Peso atual',
                      value: '${newest.weight.toStringAsFixed(1)} kg',
                      highlight: true,
                    ),
                    Container(
                      width: 1, height: 36,
                      color: cs.onSurface.withValues(alpha: 0.12),
                    ),
                    _WeightStat(
                      label: 'Variação',
                      value: '${delta >= 0 ? '+' : ''}${delta.toStringAsFixed(1)} kg',
                      color: delta < 0 ? Colors.green : delta > 0 ? Colors.orange : null,
                    ),
                  ],
                ),
              ),

            // ── Entry list ───────────────────────────────────────────────────
            GradientCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                    child: Row(
                      children: [
                        const GradientIconBadge(emoji: '📊', size: 32),
                        const SizedBox(width: 10),
                        Text('Registros',
                            style: theme.textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700)),
                        const Spacer(),
                        Text('${sorted.length} entradas',
                            style: theme.textTheme.bodySmall),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  ...sorted.asMap().entries.map((e) {
                    final entry = e.value;
                    final isLast = e.key == sorted.length - 1;
                    double? change;
                    if (e.key < sorted.length - 1) {
                      change = entry.weight - sorted[e.key + 1].weight;
                    }
                    return _WeightEntryRow(
                      entry: entry,
                      change: change,
                      isLast: isLast,
                      onDelete: () => ref.read(weightEntriesProvider.notifier).remove(entry.id),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }
}

class _WeightStat extends StatelessWidget {
  const _WeightStat({
    required this.label,
    required this.value,
    this.highlight = false,
    this.color,
  });
  final String label;
  final String value;
  final bool highlight;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final effectiveColor = color ?? (highlight ? cs.primary : cs.onSurface);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: effectiveColor,
          ),
        ),
        const SizedBox(height: 2),
        Text(label,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: cs.onSurfaceVariant)),
      ],
    );
  }
}

class _WeightEntryRow extends StatelessWidget {
  const _WeightEntryRow({
    required this.entry,
    required this.isLast,
    this.change,
    this.onDelete,
  });
  final WeightEntry entry;
  final double? change;
  final bool isLast;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs    = theme.colorScheme;

    Color? changeColor;
    String changeLabel = '';
    if (change != null) {
      changeColor = change! < 0 ? Colors.green : change! > 0 ? Colors.orange : cs.onSurfaceVariant;
      changeLabel = '${change! >= 0 ? '+' : ''}${change!.toStringAsFixed(1)} kg';
    }

    final date = DateTime.tryParse(entry.date);
    final dateStr = date != null
        ? DateFormat('d MMM yyyy', 'pt_BR').format(date)
        : entry.date;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Text(
                dateStr,
                style: theme.textTheme.bodyMedium,
              ),
              const Spacer(),
              if (change != null)
                Container(
                  margin: const EdgeInsets.only(right: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: changeColor!.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    changeLabel,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: changeColor,
                    ),
                  ),
                ),
              Text(
                '${entry.weight.toStringAsFixed(1)} kg',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: cs.primary,
                ),
              ),
              if (onDelete != null)
                IconButton(
                  icon: Icon(Icons.delete_outline,
                      size: 18, color: cs.onSurface.withValues(alpha: 0.35)),
                  onPressed: onDelete,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
            ],
          ),
        ),
        if (!isLast)
          Divider(height: 1, indent: 16, endIndent: 16, color: cs.outlineVariant),
      ],
    );
  }
}

// ─── Tab: Conquistas (Badges) ─────────────────────────────────────────────────

class _BadgesTab extends ConsumerWidget {
  const _BadgesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badgesAsync = ref.watch(userBadgesProvider);

    return badgesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) =>
          const Center(child: Text('Erro ao carregar conquistas')),
      data: (badges) => badges.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    GradientIconBadge(
                      icon: Icons.military_tech,
                      iconColor: AppTheme.primary.withValues(alpha: 0.4),
                      size: 72,
                    ),
                    const SizedBox(height: 20),
                    Text('Nenhuma conquista ainda',
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    Text('Participe de desafios para ganhar badges',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center),
                  ],
                ),
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate:
                  const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.82,
              ),
              itemCount: badges.length,
              itemBuilder: (_, i) => ProfileBadgeTile(badge: badges[i]),
            ),
    );
  }
}

// ─── Widgets públicos reutilizáveis ───────────────────────────────────────────

/// Card de estatística usado tanto no perfil próprio quanto no público.
class ProfileStatCard extends StatelessWidget {
  const ProfileStatCard({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final cs     = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.cardTheme.color ?? cs.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : cs.outlineVariant,
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(height: 10),
          Text(value,
              style: theme.textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(label, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}

/// Card "Melhor Levantamento" — reutilizado no perfil próprio e no perfil público.
class StrongestLiftCard extends ConsumerWidget {
  const StrongestLiftCard({
    super.key,
    required this.exerciseName,
    required this.weight,
  });
  final String exerciseName;
  final double weight;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GradientCard(
      child: Row(
        children: [
          const GradientIconBadge(
            icon: Icons.fitness_center,
            iconColor: Colors.orange,
            size: 44,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              exerciseName,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          Text(
            '${weight.toInt()} kg',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.orange,
                  fontWeight: FontWeight.w800,
                ),
          ),
        ],
      ),
    );
  }
}

/// Badge tile com sombra colorida pela raridade — perfil próprio.
class ProfileBadgeTile extends StatelessWidget {
  const ProfileBadgeTile({super.key, required this.badge});
  final UserBadge badge;

  @override
  Widget build(BuildContext context) {
    final theme    = Theme.of(context);
    final cs       = theme.colorScheme;
    final isDark   = theme.brightness == Brightness.dark;
    final rarityC  = badge.rarityColor;

    return GestureDetector(
      onTap: () => _showDetail(context),
      child: Container(
        decoration: BoxDecoration(
          color: theme.cardTheme.color ?? cs.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: rarityC.withValues(alpha: 0.35),
          ),
          boxShadow: [
            BoxShadow(
              color: rarityC.withValues(alpha: isDark ? 0.20 : 0.14),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Badge icon com círculo colorido
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: rarityC.withValues(alpha: 0.12),
                border: Border.all(color: rarityC, width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: rarityC.withValues(alpha: 0.25),
                    blurRadius: 8,
                    spreadRadius: 0,
                  ),
                ],
              ),
              child: Center(
                child: Text(badge.badgeIcon,
                    style: const TextStyle(fontSize: 26)),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              badge.badgeName,
              style: theme.textTheme.bodySmall,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: rarityC.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: rarityC.withValues(alpha: 0.35)),
              ),
              child: Text(
                badge.rarityLabel,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: rarityC,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDetail(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Text(badge.badgeIcon, style: const TextStyle(fontSize: 28)),
            const SizedBox(width: 8),
            Expanded(child: Text(badge.badgeName)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: badge.rarityColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                    color: badge.rarityColor.withValues(alpha: 0.35)),
              ),
              child: Text(badge.rarityLabel,
                  style: TextStyle(
                    color: badge.rarityColor,
                    fontWeight: FontWeight.w600,
                  )),
            ),
            if (badge.challengeTitle != null) ...[
              const SizedBox(height: 8),
              Text('Desafio: ${badge.challengeTitle}'),
            ],
            const SizedBox(height: 8),
            Text(
              'Conquistado em ${DateFormat('d MMM yyyy', 'pt_BR').format(badge.earnedAt)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }
}

// ─── Widgets internos ────────────────────────────────────────────────────────

class _QuickStatsCard extends StatelessWidget {
  const _QuickStatsCard({required this.stats});
  final UserStats stats;

  @override
  Widget build(BuildContext context) {
    return GradientCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _QuickStat(value: '${stats.totalWorkouts}', label: 'Treinos'),
          Container(height: 36, width: 1,
              color: Theme.of(context).colorScheme.outlineVariant),
          _QuickStat(value: '${stats.totalExercises}', label: 'Exercícios'),
          Container(height: 36, width: 1,
              color: Theme.of(context).colorScheme.outlineVariant),
          _QuickStat(value: '${stats.totalReps}', label: 'Reps'),
        ],
      ),
    );
  }
}

class _QuickStat extends StatelessWidget {
  const _QuickStat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: context.brandPrimary,
                  fontWeight: FontWeight.w800,
                )),
        const SizedBox(height: 4),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ));
  }
}

// ─── Sheet Editar Perfil ──────────────────────────────────────────────────────

class _EditProfileSheet extends ConsumerStatefulWidget {
  const _EditProfileSheet({this.user});
  final AuthUser? user;

  @override
  ConsumerState<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends ConsumerState<_EditProfileSheet> {
  late final TextEditingController _nameCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.user?.displayName ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      await ref
          .read(authProvider.notifier)
          .updateDisplayName(_nameCtrl.text.trim());
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
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Text('Editar perfil',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          TextField(
            controller: _nameCtrl,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Nome de exibição',
              prefixIcon: Icon(Icons.person_outline),
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Salvar'),
          ),
        ],
      ),
    );
  }
}
