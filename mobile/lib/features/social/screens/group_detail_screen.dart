// lib/features/social/screens/group_detail_screen.dart
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../domain/social_models.dart';
import '../providers/social_provider.dart';
import '../data/social_service.dart';
import '../widgets/social_post_item.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/config/env.dart';
import '../../../shared/theme/app_theme.dart';
import '../../../shared/widgets/gradient_progress_bar.dart';
import '../../workouts/data/wods_service.dart';
import '../../workouts/domain/workout_models.dart';
import '../../workouts/providers/workouts_provider.dart';

class GroupDetailScreen extends ConsumerStatefulWidget {
  const GroupDetailScreen({super.key, required this.groupId});
  final String groupId;

  @override
  ConsumerState<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends ConsumerState<GroupDetailScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Grupo'),
        bottom: TabBar(
          controller: _tab,
          tabs: const [
            Tab(text: 'Feed'),
            Tab(text: 'WODs'),
            Tab(text: 'Desafios'),
            Tab(text: 'Membros'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: [
          _FeedTab(groupId: widget.groupId),
          _WodsTab(groupId: widget.groupId),
          _ChallengesTab(groupId: widget.groupId),
          _MembersTab(groupId: widget.groupId),
        ],
      ),
    );
  }
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

class _FeedTab extends ConsumerWidget {
  const _FeedTab({required this.groupId});
  final String groupId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(postsProvider(groupId));
    final me = ref.watch(currentUserProvider);

    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Erro ao carregar posts'),
            TextButton(
              onPressed: () => ref.read(postsProvider(groupId).notifier).load(),
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
      data: (posts) => Stack(
        children: [
          if (posts.isEmpty)
            Center(
              child: Text(
                'Nenhum post ainda.\nSeja o primeiro!',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.5),
                    ),
              ),
            )
          else
            RefreshIndicator(
              onRefresh: () => ref.read(postsProvider(groupId).notifier).load(),
              child: ListView.separated(
                padding: EdgeInsets.zero,
                itemCount: posts.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, i) => SocialPostItem(
                  post: posts[i],
                  currentUserId: me?.uid ?? '',
                  onLike: () => ref
                      .read(postsProvider(groupId).notifier)
                      .toggleLike(posts[i].id, me?.uid ?? ''),
                  onDelete: posts[i].userId == (me?.uid ?? '')
                      ? () => ref
                          .read(postsProvider(groupId).notifier)
                          .deletePost(posts[i].id)
                      : null,
                ),
              ),
            ),
          Positioned(
            right: 16,
            bottom: 16,
            child: FloatingActionButton(
              heroTag: 'new_post',
              onPressed: () => _showNewPostSheet(context, ref, groupId),
              child: const Icon(Icons.edit),
            ),
          ),
        ],
      ),
    );
  }

  void _showNewPostSheet(BuildContext context, WidgetRef ref, String groupId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _NewPostSheet(
        onPost: (content, imageBase64) =>
            ref.read(postsProvider(groupId).notifier).addPost(content, imageBase64: imageBase64),
      ),
    );
  }
}

class _NewPostSheet extends StatefulWidget {
  const _NewPostSheet({required this.onPost});
  final Future<void> Function(String content, String? imageBase64) onPost;

  @override
  State<_NewPostSheet> createState() => _NewPostSheetState();
}

class _NewPostSheetState extends State<_NewPostSheet> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  Uint8List? _imageBytes;
  final _picker = ImagePicker();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(
      source: source,
      maxWidth: 1080,
      imageQuality: 80,
    );
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    if (mounted) setState(() => _imageBytes = bytes);
  }

  void _showImageSource() {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Galeria'),
              onTap: () { Navigator.pop(context); _pickImage(ImageSource.gallery); },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Câmera'),
              onTap: () { Navigator.pop(context); _pickImage(ImageSource.camera); },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    final hasImage = _imageBytes != null;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Text('Nova Publicação', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),

          // Image preview
          if (hasImage) ...[
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AspectRatio(
                    aspectRatio: 4 / 5,
                    child: Image.memory(
                      _imageBytes!,
                      fit: BoxFit.cover,
                      gaplessPlayback: true,
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: () => setState(() => _imageBytes = null),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close, color: Colors.white, size: 18),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],

          // Text field
          TextField(
            controller: _ctrl,
            autofocus: !hasImage,
            maxLines: hasImage ? 2 : 4,
            decoration: InputDecoration(
              hintText: hasImage ? 'Adicione uma legenda...' : 'O que você está pensando?',
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),

          // Toolbar
          Row(
            children: [
              IconButton.outlined(
                onPressed: _showImageSource,
                icon: const Icon(Icons.photo_camera_outlined),
                tooltip: 'Adicionar foto',
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: _loading ? null : _submit,
                icon: _loading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send, size: 18),
                label: const Text('Publicar'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty && _imageBytes == null) return;
    setState(() => _loading = true);
    try {
      final imageBase64 = _imageBytes != null ? base64Encode(_imageBytes!) : null;
      await widget.onPost(text, imageBase64);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

// ─── WODs ─────────────────────────────────────────────────────────────────────

class _WodsTab extends StatefulWidget {
  const _WodsTab({required this.groupId});
  final String groupId;

  @override
  State<_WodsTab> createState() => _WodsTabState();
}

class _WodsTabState extends State<_WodsTab> {
  List<SharedWod> _wods = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final wods = await WodsService.instance.listByGroup(widget.groupId);
      if (mounted) setState(() => _wods = wods);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Erro ao carregar WODs'),
            TextButton(onPressed: _load, child: const Text('Tentar novamente')),
          ],
        ),
      );
    }
    if (_wods.isEmpty) {
      return Center(
        child: Text(
          'Nenhum WOD publicado ainda.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
              ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: _wods.length,
        itemBuilder: (_, i) => _WodCard(wod: _wods[i]),
      ),
    );
  }
}

class _WodCard extends ConsumerWidget {
  const _WodCard({required this.wod});
  final SharedWod wod;

  static const _formatLabels = {
    'amrap': 'AMRAP',
    'forTime': 'For Time',
    'emom': 'EMOM',
    'tabata': 'Tabata',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final label = _formatLabels[wod.format] ?? wod.format.toUpperCase();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: format badge + creator + date
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: cs.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    label,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: cs.onPrimaryContainer,
                    ),
                  ),
                ),
                if (wod.timeCap != null) ...[
                  const SizedBox(width: 8),
                  _Chip(Icons.timer_outlined, '${wod.timeCap} min'),
                ],
                if (wod.rounds != null) ...[
                  const SizedBox(width: 8),
                  _Chip(Icons.loop, '${wod.rounds} rounds'),
                ],
                const Spacer(),
                Text(
                  _timeAgo(wod.createdAt),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: cs.onSurface.withValues(alpha: 0.5),
                      ),
                ),
              ],
            ),
            if (wod.creatorName != null) ...[
              const SizedBox(height: 6),
              Text(
                'por ${wod.creatorName}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: cs.onSurface.withValues(alpha: 0.6),
                    ),
              ),
            ],
            // Description
            if (wod.description != null && wod.description!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(wod.description!),
            ],
            // Movements
            if (wod.movements.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                'Movimentos',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: cs.onSurface.withValues(alpha: 0.6),
                    ),
              ),
              const SizedBox(height: 4),
              ...wod.movements.map((m) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(
                      children: [
                        const Text('• ', style: TextStyle(fontSize: 13)),
                        Expanded(
                          child: Text(
                            [
                              m.name,
                              if (m.targetReps != null) '${m.targetReps} reps',
                              if (m.targetWeight != null && m.targetWeight! > 0)
                                '${m.targetWeight!.toStringAsFixed(m.targetWeight! % 1 == 0 ? 0 : 1)} kg',
                            ].join(' — '),
                            style: const TextStyle(fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  )),
            ],
            const SizedBox(height: 12),
            // Action row: code + copy button
            Row(
              children: [
                Icon(Icons.tag, size: 14, color: cs.onSurface.withValues(alpha: 0.5)),
                const SizedBox(width: 4),
                Text(
                  wod.code,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: cs.primary,
                  ),
                ),
                const SizedBox(width: 4),
                InkWell(
                  borderRadius: BorderRadius.circular(4),
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: wod.code));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Código copiado! Cole no campo de importação do treino.'),
                        duration: Duration(seconds: 3),
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Icon(Icons.copy, size: 14, color: cs.primary),
                  ),
                ),
                const Spacer(),
                FilledButton.tonal(
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  onPressed: () => _showAddToTraining(context, ref),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.fitness_center, size: 14),
                      SizedBox(width: 4),
                      Text('Adicionar ao treino', style: TextStyle(fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showAddToTraining(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => ProviderScope(
        parent: ProviderScope.containerOf(context),
        child: _AddWodToTrainingSheet(wod: wod),
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'agora';
    if (diff.inHours < 1) return '${diff.inMinutes}min atrás';
    if (diff.inDays < 1) return '${diff.inHours}h atrás';
    if (diff.inDays < 7) return '${diff.inDays}d atrás';
    return DateFormat('dd/MM/yyyy').format(dt);
  }
}

// ─── Adicionar WOD ao Treino ───────────────────────────────────────────────────

class _AddWodToTrainingSheet extends ConsumerStatefulWidget {
  const _AddWodToTrainingSheet({required this.wod});
  final SharedWod wod;

  @override
  ConsumerState<_AddWodToTrainingSheet> createState() => _AddWodToTrainingSheetState();
}

class _AddWodToTrainingSheetState extends ConsumerState<_AddWodToTrainingSheet> {
  String? _selectedDayId;
  bool _adding = false;
  bool _done = false;

  Future<void> _add() async {
    if (_selectedDayId == null) return;
    setState(() => _adding = true);

    try {
      // Encontrar a definição de exercício CrossFit
      final defs = await ref.read(exerciseDefinitionsProvider.future);
      final crossfitDef = defs.firstWhere(
        (d) => d.isCrossFit,
        orElse: () => defs.firstWhere(
          (d) => d.isCardio,
          orElse: () => defs.first,
        ),
      );

      final wodFormat = WodFormat.values.firstWhere(
        (f) => f.name == widget.wod.format,
        orElse: () => WodFormat.amrap,
      );

      await ref.read(workoutDaysProvider.notifier).addExercise(
        _selectedDayId!,
        PlannedExercise(
          id: '',
          exerciseDefinitionId: crossfitDef.id,
          exerciseName: crossfitDef.name,
          muscleGroup: crossfitDef.muscleGroup,
          exerciseType: ExerciseType.cardio,
          cardioSubtype: 'crossfit',
          sets: 1,
          reps: 0,
          weight: 0,
          restTime: 60,
          plannedDurationMinutes: widget.wod.timeCap,
          wodFormat: wodFormat,
          wodDescription: widget.wod.description,
          plannedRounds: widget.wod.rounds,
          wodMovements: widget.wod.movements,
        ),
      );

      if (mounted) setState(() { _adding = false; _done = true; });
    } catch (e) {
      if (mounted) {
        setState(() => _adding = false);
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final daysAsync = ref.watch(workoutDaysProvider);
    final formatLabel = const {
      'amrap': 'AMRAP',
      'forTime': 'For Time',
      'emom': 'EMOM',
      'tabata': 'Tabata',
    }[widget.wod.format] ?? widget.wod.format.toUpperCase();

    return Padding(
      padding: EdgeInsets.fromLTRB(
          16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40, height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: cs.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            if (_done) ...[
              // ── Sucesso ────────────────────────────────────────────────────
              Center(
                child: Column(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green.shade500, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      'WOD adicionado ao treino!',
                      style: Theme.of(context).textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Os ${widget.wod.movements.length} movimentos do coach já estão no seu plano.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: cs.onSurface.withValues(alpha: 0.6)),
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Fechar'),
                    ),
                  ],
                ),
              ),
            ] else ...[
              // ── Seleção do dia ─────────────────────────────────────────────
              Text('Adicionar ao treino',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(
                '$formatLabel${widget.wod.timeCap != null ? ' · ${widget.wod.timeCap}min' : ''}'
                '${widget.wod.movements.isNotEmpty ? ' · ${widget.wod.movements.length} movimentos' : ''}',
                style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.6)),
              ),
              const SizedBox(height: 16),
              Text('Selecione o dia de treino:',
                  style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 8),

              daysAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Text('Erro ao carregar dias: $e'),
                data: (days) {
                  if (days.isEmpty) {
                    return Text(
                      'Nenhum dia de treino cadastrado.',
                      style: TextStyle(color: cs.onSurface.withValues(alpha: 0.5)),
                    );
                  }
                  return Column(
                    children: days.map((day) {
                      final selected = _selectedDayId == day.id;
                      return RadioListTile<String>(
                        contentPadding: EdgeInsets.zero,
                        value: day.id,
                        groupValue: _selectedDayId,
                        title: Text(day.name),
                        selected: selected,
                        onChanged: (v) => setState(() => _selectedDayId = v),
                      );
                    }).toList(),
                  );
                },
              ),

              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: (_selectedDayId == null || _adding) ? null : _add,
                  child: _adding
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Adicionar'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Desafios ─────────────────────────────────────────────────────────────────

class _ChallengesTab extends ConsumerWidget {
  const _ChallengesTab({required this.groupId});
  final String groupId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(challengesProvider(groupId));
    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Erro: $e')),
      data: (challenges) => Stack(
        children: [
          if (challenges.isEmpty)
            Center(
              child: Text(
                'Nenhum desafio ativo',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.5),
                    ),
              ),
            )
          else
            RefreshIndicator(
              onRefresh: () async =>
                  ref.invalidate(challengesProvider(groupId)),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: challenges.length,
                itemBuilder: (_, i) =>
                    _ChallengeCard(challenge: challenges[i], groupId: groupId),
              ),
            ),
          Positioned(
            right: 16,
            bottom: 16,
            child: FloatingActionButton(
              heroTag: 'new_challenge',
              onPressed: () =>
                  _showCreateChallengeSheet(context, ref),
              child: const Icon(Icons.add),
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateChallengeSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _CreateChallengeSheet(
        groupId: groupId,
        onCreated: () => ref.invalidate(challengesProvider(groupId)),
      ),
    );
  }
}

class _ChallengeCard extends ConsumerStatefulWidget {
  const _ChallengeCard({required this.challenge, required this.groupId});
  final GroupChallenge challenge;
  final String groupId;

  @override
  ConsumerState<_ChallengeCard> createState() => _ChallengeCardState();
}

class _ChallengeCardState extends ConsumerState<_ChallengeCard> {
  bool _joining = false;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final c = widget.challenge;
    final daysLeft = c.endDate.difference(DateTime.now()).inDays;
    final me = ref.watch(currentUserProvider);
    final myParticipant = c.participants
        .where((p) => p.userId == (me?.uid ?? ''))
        .firstOrNull;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    c.title,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${c.difficultyIcon} ${c.difficultyLabel}',
                      style: TextStyle(
                          fontSize: 11,
                          color: cs.onSurface.withValues(alpha: 0.7)),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: c.isActive
                          ? cs.primaryContainer
                          : cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      c.isActive ? 'Ativo' : 'Encerrado',
                      style: TextStyle(
                        fontSize: 11,
                        color: c.isActive
                            ? cs.onPrimaryContainer
                            : cs.onSurface.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ]),
              ],
            ),
            if (c.description != null) ...[
              const SizedBox(height: 6),
              Text(c.description!,
                  style: Theme.of(context).textTheme.bodySmall),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                _Chip(Icons.flag_outlined,
                    '${c.targetValue.toInt()} ${c.unit}'),
                const SizedBox(width: 8),
                _Chip(Icons.people_outline,
                    '${c.participants.length} participantes'),
                const SizedBox(width: 8),
                if (c.isActive)
                  _Chip(Icons.timer_outlined,
                      daysLeft >= 0 ? '$daysLeft dias' : 'Encerrado'),
              ],
            ),
            if (c.reward != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.emoji_events_outlined,
                      size: 14, color: Color(0xFFFFD700)),
                  const SizedBox(width: 4),
                  Text(c.reward!,
                      style: const TextStyle(
                          fontSize: 12, color: Color(0xFFFFD700))),
                ],
              ),
            ],
            // ── Aviso de participantes mínimos ────────────────────────────────
            if (c.participants.length < 3) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: cs.errorContainer.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(children: [
                  Icon(Icons.group_outlined, size: 13,
                      color: cs.onErrorContainer),
                  const SizedBox(width: 6),
                  Text(
                    'Mínimo 3 participantes para validar badges '
                    '(${c.participants.length}/3)',
                    style: TextStyle(
                        fontSize: 11, color: cs.onErrorContainer),
                  ),
                ]),
              ),
            ],
            if (c.isAutoProgress) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.auto_awesome, size: 12,
                      color: cs.primary.withValues(alpha: 0.7)),
                  const SizedBox(width: 4),
                  Text(
                    switch (c.type) {
                      'muscle_group_volume' =>
                        'Auto · ${c.exerciseName ?? 'grupo muscular'}',
                      'cardio_distance' =>
                        'Auto · ${_cardioLabel(c.exerciseName)}',
                      _ => 'Auto · requer postagem de treino',
                    },
                    style: TextStyle(
                        fontSize: 11,
                        color: cs.primary.withValues(alpha: 0.7)),
                  ),
                ],
              ),
            ],
            // ── Meu progresso (quando participando) ──────────────────────────
            if (c.isJoined && myParticipant != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Meu progresso',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelMedium
                                    ?.copyWith(
                                        color: cs.onSurface
                                            .withValues(alpha: 0.6))),
                            Text(
                              myParticipant.isCompleted
                                  ? '✅ Concluído!'
                                  : '${myParticipant.currentValue.toInt()} / ${c.targetValue.toInt()} ${c.unit}',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: myParticipant.isCompleted
                                    ? Colors.green
                                    : cs.onSurface,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        GradientProgressBar(
                          value: c.targetValue > 0
                              ? (myParticipant.currentValue / c.targetValue)
                                  .clamp(0.0, 1.0)
                              : 0,
                          height: 8,
                          gradient: myParticipant.isCompleted
                              ? const LinearGradient(
                                  colors: [Color(0xFF43E97B), Color(0xFF38F9D7)],
                                )
                              : null,
                        ),
                      ],
                    ),
                  ),
                  if (c.isActive && !myParticipant.isCompleted && !c.isAutoProgress) ...[
                    const SizedBox(width: 12),
                    IconButton.filledTonal(
                      onPressed: () => _showUpdateProgressSheet(context),
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      tooltip: 'Atualizar progresso',
                    ),
                  ],
                ],
              ),
            ],
            if (c.isActive && !c.isJoined) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.tonal(
                  onPressed: _joining ? null : _join,
                  child: _joining
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Participar'),
                ),
              ),
            ],
            if (c.isCompetitive && c.participants.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Ranking',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: cs.onSurface.withValues(alpha: 0.6),
                      )),
              const SizedBox(height: 4),
              ...c.participants
                  .asMap()
                  .entries
                  .take(3)
                  .map((e) => _RankRow(
                      rank: e.key + 1, participant: e.value, unit: c.unit)),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _join() async {
    setState(() => _joining = true);
    try {
      await SocialService.instance.joinChallenge(widget.challenge.id);
      ref.invalidate(challengesProvider(widget.groupId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro: $e')));
      }
    } finally {
      if (mounted) setState(() => _joining = false);
    }
  }

  String _cardioLabel(String? subtype) => switch (subtype) {
    'corrida' => 'corrida',
    'caminhada' => 'caminhada',
    'ciclismo' => 'ciclismo',
    'natacao' => 'natação',
    'bicicleta_ergometrica' => 'bike ergométrica',
    'remo' => 'remo',
    'escada' => 'escada',
    'funcional' => 'funcional',
    _ => 'qualquer cardio',
  };

  void _showUpdateProgressSheet(BuildContext context) {
    final c = widget.challenge;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _UpdateProgressSheet(
        challenge: c,
        onUpdated: () => ref.invalidate(challengesProvider(widget.groupId)),
      ),
    );
  }
}

class _UpdateProgressSheet extends ConsumerStatefulWidget {
  const _UpdateProgressSheet(
      {required this.challenge, required this.onUpdated});
  final GroupChallenge challenge;
  final VoidCallback onUpdated;

  @override
  ConsumerState<_UpdateProgressSheet> createState() =>
      _UpdateProgressSheetState();
}

class _UpdateProgressSheetState extends ConsumerState<_UpdateProgressSheet> {
  late final TextEditingController _ctrl;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final me = ref.read(currentUserProvider);
    final myParticipant = widget.challenge.participants
        .where((p) => p.userId == (me?.uid ?? ''))
        .firstOrNull;
    _ctrl = TextEditingController(
        text: myParticipant?.currentValue.toInt().toString() ?? '0');
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.challenge;
    return Padding(
      padding: EdgeInsets.fromLTRB(
          16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Atualizar Progresso',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text('${c.title} · meta: ${c.targetValue.toInt()} ${c.unit}',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          TextField(
            controller: _ctrl,
            keyboardType: TextInputType.number,
            autofocus: true,
            decoration: InputDecoration(
              labelText: 'Progresso atual (${c.unit})',
              suffixText: c.unit,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _loading ? null : _save,
              child: _loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Salvar'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _save() async {
    final value = double.tryParse(_ctrl.text);
    if (value == null) return;
    setState(() => _loading = true);
    try {
      await SocialService.instance
          .updateChallengeProgress(widget.challenge.id, value);
      widget.onUpdated();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.icon, this.label);
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: cs.onSurface.withValues(alpha: 0.6)),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  fontSize: 11, color: cs.onSurface.withValues(alpha: 0.7))),
        ],
      ),
    );
  }
}

class _RankRow extends StatelessWidget {
  const _RankRow(
      {required this.rank,
      required this.participant,
      required this.unit});
  final int rank;
  final ChallengeParticipant participant;
  final String unit;

  @override
  Widget build(BuildContext context) {
    final medals = ['🥇', '🥈', '🥉'];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Text(rank <= 3 ? medals[rank - 1] : '$rank.',
              style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(participant.displayName ?? 'Usuário',
                style: const TextStyle(fontSize: 13)),
          ),
          Text(
            '${participant.currentValue.toInt()} $unit',
            style: const TextStyle(
                fontSize: 13, fontWeight: FontWeight.bold),
          ),
          if (participant.isCompleted) ...[
            const SizedBox(width: 4),
            const Icon(Icons.check_circle, size: 14, color: Colors.green),
          ],
        ],
      ),
    );
  }
}

class _CreateChallengeSheet extends ConsumerStatefulWidget {
  const _CreateChallengeSheet(
      {required this.groupId, required this.onCreated});
  final String groupId;
  final VoidCallback onCreated;

  @override
  ConsumerState<_CreateChallengeSheet> createState() =>
      _CreateChallengeSheetState();
}

class _CreateChallengeSheetState
    extends ConsumerState<_CreateChallengeSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _rewardCtrl = TextEditingController();

  String _type = 'volume';
  String _unit = 'kg';
  String? _exerciseName;
  String _difficulty = 'iniciante';
  bool _isCompetitive = false;
  bool _loading = false;
  bool _loadingPresets = false;
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 30));
  Map<String, double> _presets = {};

  static const _muscleGroups = [
    ('peito', 'Peito'), ('costas', 'Costas'), ('pernas', 'Pernas'),
    ('ombros', 'Ombros'), ('biceps', 'Bíceps'), ('triceps', 'Tríceps'),
    ('abdomen', 'Abdômen'), ('gluteos', 'Glúteos'),
  ];

  static const _cardioSubtypes = [
    ('', 'Qualquer cardio'), ('corrida', 'Corrida'), ('caminhada', 'Caminhada'),
    ('ciclismo', 'Ciclismo'), ('natacao', 'Natação'),
    ('bicicleta_ergometrica', 'Bike Ergométrica'), ('remo', 'Remo'),
    ('escada', 'Escada'), ('funcional', 'Funcional'),
  ];

  static const _difficulties = [
    ('iniciante',    '🥉', 'Iniciante',    'Para quem está começando'),
    ('intermediario','🥈', 'Intermediário', 'Para treinos regulares'),
    ('avancado',     '🥇', 'Avançado',      'Para atletas dedicados'),
    ('elite',        '💎', 'Elite',         'Desafio extremo'),
  ];

  @override
  void initState() {
    super.initState();
    _fetchPresets();
  }

  Future<void> _fetchPresets() async {
    setState(() => _loadingPresets = true);
    try {
      final p = await SocialService.instance
          .getChallengePresets(_type, _startDate, _endDate);
      if (mounted) setState(() => _presets = p);
    } catch (_) {}
    if (mounted) setState(() => _loadingPresets = false);
  }

  void _onTypeChanged(String v) {
    setState(() {
      _type = v;
      _exerciseName = null;
      _unit = switch (v) {
        'cardio_distance'     => 'km',
        'workouts'            => 'treinos',
        'streak'              => 'dias',
        'workout_proof'       => 'treinos',
        _                     => 'kg',
      };
    });
    _fetchPresets();
  }

  bool get _isAutoType =>
      _type == 'muscle_group_volume' ||
      _type == 'cardio_distance' ||
      _type == 'workout_proof';

  String _formatPreview(double? value) {
    if (value == null || value <= 0) return '—';
    if (_unit == 'kg') {
      final t = value / 1000;
      return t >= 1 ? '${t.toStringAsFixed(0)} t' : '${value.toInt()} kg';
    }
    if (_unit == 'km') return '${value.toStringAsFixed(0)} km';
    return value.toInt().toString();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _rewardCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: EdgeInsets.fromLTRB(
          16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 16),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Criar Desafio',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),

              // ── Título e descrição ─────────────────────────────────────────
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(labelText: 'Título'),
                validator: (v) =>
                    (v?.trim().isEmpty ?? true) ? 'Informe o título' : null,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _descCtrl,
                decoration: const InputDecoration(
                    labelText: 'Descrição (opcional)'),
                maxLines: 2,
              ),
              const SizedBox(height: 10),

              // ── Tipo ───────────────────────────────────────────────────────
              DropdownButtonFormField<String>(
                value: _type,
                decoration: const InputDecoration(labelText: 'Tipo'),
                items: const [
                  DropdownMenuItem(value: 'volume',             child: Text('Volume total')),
                  DropdownMenuItem(value: 'workouts',           child: Text('Número de treinos')),
                  DropdownMenuItem(value: 'streak',             child: Text('Sequência de dias')),
                  DropdownMenuItem(value: 'muscle_group_volume',child: Text('Volume por grupo muscular')),
                  DropdownMenuItem(value: 'cardio_distance',    child: Text('Distância de cardio')),
                  DropdownMenuItem(value: 'workout_proof',      child: Text('Treinos com postagem')),
                ],
                onChanged: (v) => _onTypeChanged(v!),
              ),

              if (_isAutoType) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: cs.primaryContainer.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(children: [
                    Icon(Icons.auto_awesome, size: 13, color: cs.primary),
                    const SizedBox(width: 6),
                    Expanded(child: Text(
                      'Progresso atualizado automaticamente ao postar treinos no grupo',
                      style: TextStyle(fontSize: 11, color: cs.primary),
                    )),
                  ]),
                ),
              ],

              // ── Filtros ────────────────────────────────────────────────────
              if (_type == 'muscle_group_volume') ...[
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: _exerciseName,
                  decoration: const InputDecoration(labelText: 'Grupo muscular'),
                  items: _muscleGroups
                      .map((g) => DropdownMenuItem(value: g.$1, child: Text(g.$2)))
                      .toList(),
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Selecione um grupo muscular' : null,
                  onChanged: (v) => setState(() => _exerciseName = v),
                ),
              ],
              if (_type == 'cardio_distance') ...[
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: _exerciseName ?? '',
                  decoration: const InputDecoration(labelText: 'Modalidade'),
                  items: _cardioSubtypes
                      .map((t) => DropdownMenuItem(value: t.$1, child: Text(t.$2)))
                      .toList(),
                  onChanged: (v) => setState(() => _exerciseName = v),
                ),
              ],

              // ── Datas ──────────────────────────────────────────────────────
              const SizedBox(height: 10),
              Row(children: [
                Expanded(child: _DateField(
                  label: 'Início', date: _startDate,
                  onPicked: (d) { setState(() => _startDate = d); _fetchPresets(); },
                )),
                const SizedBox(width: 10),
                Expanded(child: _DateField(
                  label: 'Fim', date: _endDate,
                  onPicked: (d) { setState(() => _endDate = d); _fetchPresets(); },
                )),
              ]),

              // ── Dificuldade ────────────────────────────────────────────────
              const SizedBox(height: 16),
              Text('Dificuldade',
                  style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 4),
              Text(
                'A badge é entregue proporcionalmente ao esforço de cada participante',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: cs.onSurface.withValues(alpha: 0.5)),
              ),
              const SizedBox(height: 10),
              if (_loadingPresets)
                const Center(child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: CircularProgressIndicator(strokeWidth: 2),
                ))
              else
                ...(_difficulties.map((d) {
                  final isSelected = _difficulty == d.$1;
                  final preview = _formatPreview(_presets[d.$1]);
                  return GestureDetector(
                    onTap: () => setState(() => _difficulty = d.$1),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? cs.primary : cs.outlineVariant,
                          width: isSelected ? 2 : 1,
                        ),
                        color: isSelected
                            ? cs.primaryContainer.withValues(alpha: 0.3)
                            : cs.surface,
                      ),
                      child: Row(children: [
                        Text(d.$2, style: const TextStyle(fontSize: 22)),
                        const SizedBox(width: 12),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(d.$3,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleSmall
                                    ?.copyWith(
                                      fontWeight: isSelected
                                          ? FontWeight.bold
                                          : null,
                                    )),
                            Text(d.$4,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                        color: cs.onSurface
                                            .withValues(alpha: 0.5))),
                          ],
                        )),
                        Text(
                          'Meta: $preview',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? cs.primary : cs.onSurface.withValues(alpha: 0.6),
                          ),
                        ),
                      ]),
                    ),
                  );
                })),

              // ── Extras ─────────────────────────────────────────────────────
              TextFormField(
                controller: _rewardCtrl,
                decoration: const InputDecoration(
                    labelText: 'Recompensa adicional (opcional)'),
              ),
              const SizedBox(height: 6),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Ranking competitivo'),
                value: _isCompetitive,
                onChanged: (v) => setState(() => _isCompetitive = v),
              ),

              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _loading ? null : _create,
                  child: _loading
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Criar Desafio'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _create() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final me = ref.read(currentUserProvider);
      await SocialService.instance.createChallenge(
        widget.groupId,
        title: _titleCtrl.text.trim(),
        description:
            _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
        type: _type,
        difficulty: _difficulty,
        unit: _unit,
        isCompetitive: _isCompetitive,
        reward: _rewardCtrl.text.trim().isEmpty ? null : _rewardCtrl.text.trim(),
        startDate: _startDate,
        endDate: _endDate,
        exerciseName: _exerciseName,
        createdByName: me?.displayName ?? '',
      );
      widget.onCreated();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

class _DateField extends StatelessWidget {
  const _DateField(
      {required this.label,
      required this.date,
      required this.onPicked});
  final String label;
  final DateTime date;
  final void Function(DateTime) onPicked;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: date,
          firstDate: DateTime.now().subtract(const Duration(days: 1)),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        if (picked != null) onPicked(picked);
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.calendar_today, size: 16),
        ),
        child: Text(DateFormat('dd/MM/yyyy').format(date),
            style: const TextStyle(fontSize: 14)),
      ),
    );
  }
}

// ─── Membros ──────────────────────────────────────────────────────────────────

class _MembersTab extends ConsumerWidget {
  const _MembersTab({required this.groupId});
  final String groupId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(membersProvider(groupId));
    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Erro: $e')),
      data: (members) => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: members.length,
        itemBuilder: (_, i) => _MemberTile(members[i]),
      ),
    );
  }
}

class _MemberTile extends StatelessWidget {
  const _MemberTile(this.member);
  final GroupMember member;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: cs.primaryContainer,
        child: member.photoURL != null
            ? ClipOval(
                child: Image.network(
                    member.photoURL!.startsWith('/')
                        ? '${Env.serverBaseUrl}${member.photoURL!}'
                        : member.photoURL!,
                    width: 40,
                    height: 40,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _initial(context)))
            : _initial(context),
      ),
      title: Text(member.displayName ?? 'Usuário'),
      trailing: member.role == 'admin'
          ? Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: cs.primaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Admin',
                style: TextStyle(
                    fontSize: 11, color: cs.onPrimaryContainer),
              ),
            )
          : null,
    );
  }

  Widget _initial(BuildContext context) {
    final name = member.displayName ?? '?';
    return Text(
      name[0].toUpperCase(),
      style: TextStyle(
        color: Theme.of(context).colorScheme.onPrimaryContainer,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}
