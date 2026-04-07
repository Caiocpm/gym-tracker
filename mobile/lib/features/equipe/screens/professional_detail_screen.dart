// lib/features/equipe/screens/professional_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import '../../../shared/theme/app_theme.dart';
import '../domain/my_professional_link.dart';
import '../providers/equipe_provider.dart';

// ─── Providers ────────────────────────────────────────────────────────────────

final _goalsProvider =
    FutureProvider.family.autoDispose<List<Map<String, dynamic>>, String>(
  (ref, linkId) async {
    final res = await DioClient.instance.dio
        .get('/professional/student/links/$linkId/goals');
    final raw = res.data;
    final list = (raw is Map ? raw['data'] ?? [] : raw) as List<dynamic>;
    return list.map((e) => e as Map<String, dynamic>).toList();
  },
);

final _evaluationsProvider =
    FutureProvider.family.autoDispose<List<Map<String, dynamic>>, String>(
  (ref, linkId) async {
    final res = await DioClient.instance.dio
        .get('/professional/student/links/$linkId/evaluations');
    final raw = res.data;
    final list = (raw is Map ? raw['data'] ?? [] : raw) as List<dynamic>;
    return list.map((e) => e as Map<String, dynamic>).toList();
  },
);

final _conversationsProvider =
    FutureProvider.family.autoDispose<List<Map<String, dynamic>>, String>(
  (ref, linkId) async {
    final res = await DioClient.instance.dio
        .get('/professional/student/links/$linkId/conversations');
    final raw = res.data;
    final list = (raw is Map ? raw['data'] ?? [] : raw) as List<dynamic>;
    return list.map((e) => e as Map<String, dynamic>).toList();
  },
);

// ─── Tela principal ───────────────────────────────────────────────────────────

class ProfessionalDetailScreen extends ConsumerWidget {
  const ProfessionalDetailScreen({
    super.key,
    required this.linkId,
    this.initialTab = 0,
    this.initialConversationId,
  });
  final String linkId;
  final int initialTab;
  final String? initialConversationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final linksAsync = ref.watch(myLinksProvider);

    return linksAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Erro ao carregar dados')),
      ),
      data: (links) {
        final link = links.where((l) => l.id == linkId).firstOrNull;
        if (link == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: Text('Profissional não encontrado')),
          );
        }
        return _DetailView(
          link: link,
          initialTab: initialTab,
          initialConversationId: initialConversationId,
        );
      },
    );
  }
}

// ─── Corpo com abas ───────────────────────────────────────────────────────────

class _DetailView extends StatelessWidget {
  const _DetailView({
    required this.link,
    this.initialTab = 0,
    this.initialConversationId,
  });
  final MyProfessionalLink link;
  final int initialTab;
  final String? initialConversationId;

  static const _typeColors = {
    'personal_trainer': Color(0xFF3F5EFB),
    'nutritionist':     Color(0xFF1DD2AF),
    'physiotherapist':  Color(0xFFFF7043),
    'coach':            Color(0xFF8B5CF6),
    'other':            Color(0xFF6B7280),
  };

  static const _typeLabels = {
    'personal_trainer': 'Personal Trainer',
    'nutritionist':     'Nutricionista',
    'physiotherapist':  'Fisioterapeuta',
    'coach':            'Coach',
    'other':            'Outro',
  };

  static const _typeIcons = {
    'personal_trainer': Icons.fitness_center_outlined,
    'nutritionist':     Icons.restaurant_outlined,
    'physiotherapist':  Icons.healing_outlined,
    'coach':            Icons.psychology_outlined,
    'other':            Icons.person_outline,
  };

  Color get _color {
    final t = link.contractedTypes.isNotEmpty
        ? link.contractedTypes.first
        : 'other';
    return _typeColors[t] ?? AppTheme.primary;
  }

  @override
  Widget build(BuildContext context) {
    final color = _color;

    return DefaultTabController(
      length: 3,
      initialIndex: initialTab,
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 18),
            onPressed: () => Navigator.pop(context),
          ),
          scrolledUnderElevation: 0,
        ),
        body: Column(
          children: [
            // ── Profile header ─────────────────────────────────────────────
            Container(
              color: Theme.of(context).colorScheme.surface,
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Column(
                children: [
                  // Avatar
                  Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: color, width: 2.5),
                    ),
                    child: _Avatar(
                      photoURL: link.professionalPhotoURL,
                      displayName: link.professionalDisplayName,
                      color: color,
                      size: 80,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    link.professionalDisplayName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textDark,
                      letterSpacing: -0.3,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  // Type pills
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    alignment: WrapAlignment.center,
                    children: link.contractedTypes.map((t) {
                      final icon  = _typeIcons[t] ?? Icons.person_outline;
                      final label = _typeLabels[t] ?? t;
                      return Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: color.withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(icon, size: 12, color: color),
                            const SizedBox(width: 5),
                            Text(
                              label,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: color,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  // Stats row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _StatChip(
                          value: link.pendingGoals,
                          label: 'Meta${link.pendingGoals == 1 ? '' : 's'}',
                          color: color),
                      if (link.pendingEvaluations > 0) ...[
                        const SizedBox(width: 8),
                        _StatChip(
                            value: link.pendingEvaluations,
                            label:
                                'Avaliação${link.pendingEvaluations == 1 ? '' : 'ões'}',
                            color: color),
                      ],
                      if (link.unreadMessages > 0) ...[
                        const SizedBox(width: 8),
                        _StatChip(
                            value: link.unreadMessages,
                            label: 'Nova${link.unreadMessages == 1 ? '' : 's'}',
                            color: color),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Avaliação de satisfação
                  _RatingWidget(professionalId: link.professionalId, color: color),
                  const SizedBox(height: 16),
                  // TabBar
                  TabBar(
                    labelColor: color,
                    unselectedLabelColor: AppTheme.textLight,
                    indicatorColor: color,
                    indicatorWeight: 2.5,
                    indicatorSize: TabBarIndicatorSize.label,
                    dividerColor: AppTheme.border,
                    labelStyle: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 13),
                    unselectedLabelStyle: const TextStyle(
                        fontWeight: FontWeight.w500, fontSize: 13),
                    tabs: [
                      _buildTab('Metas', link.pendingGoals, color),
                      _buildTab(
                          'Avaliações', link.pendingEvaluations, color),
                      _buildTab('Mensagens', link.unreadMessages, color),
                    ],
                  ),
                ],
              ),
            ),
            // ── Tab content ────────────────────────────────────────────────
            Expanded(
              child: TabBarView(
                children: [
                  _GoalsTab(linkId: link.id),
                  _EvaluationsTab(linkId: link.id),
                  _MessagesTab(
                      link: link,
                      autoOpenConversationId: initialConversationId),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Tab _buildTab(String label, int count, Color color) => Tab(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label),
            if (count > 0) ...[
              const SizedBox(width: 5),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: const TextStyle(
                      fontSize: 10,
                      color: Colors.white,
                      fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ],
        ),
      );
}

// ─── Rating Widget ────────────────────────────────────────────────────────────

class _RatingWidget extends StatefulWidget {
  const _RatingWidget({required this.professionalId, required this.color});
  final String professionalId;
  final Color color;

  @override
  State<_RatingWidget> createState() => _RatingWidgetState();
}

class _RatingWidgetState extends State<_RatingWidget> {
  int? _current;
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await DioClient.instance.dio
          .get('/marketplace/professionals/${widget.professionalId}/my-rating');
      final score = (res.data as Map<String, dynamic>?)?['score'] as int?;
      if (mounted) setState(() { _current = score; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _rate(int score) async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      await DioClient.instance.dio.post(
        '/marketplace/professionals/${widget.professionalId}/rating',
        data: {'score': score},
      );
      if (mounted) setState(() { _current = score; _saving = false; });
    } catch (_) {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 36,
        child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: widget.color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: widget.color.withValues(alpha: 0.15)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _current != null ? 'Avaliação registrada' : 'Avaliar profissional',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: widget.color,
                ),
              ),
              if (_current != null)
                Text(
                  'A avaliação não pode ser alterada',
                  style: TextStyle(
                    fontSize: 10,
                    color: AppTheme.textLight,
                  ),
                ),
            ],
          ),
          if (_saving)
            const SizedBox(
              width: 18, height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else
            Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(5, (i) {
                final star = i + 1;
                final filled = _current != null && star <= _current!;
                final rated = _current != null;
                return GestureDetector(
                  onTap: rated ? null : () => _rate(star),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Icon(
                      filled ? Icons.star_rounded : Icons.star_outline_rounded,
                      size: 26,
                      color: filled
                          ? widget.color
                          : rated
                              ? AppTheme.textLight.withValues(alpha: 0.35)
                              : AppTheme.textLight,
                    ),
                  ),
                );
              }),
            ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip(
      {required this.value, required this.label, required this.color});
  final int value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    if (value == 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            child: Center(
              child: Text(
                '$value',
                style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: Colors.white),
              ),
            ),
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.w600, color: color),
          ),
        ],
      ),
    );
  }
}

// ─── Aba: Metas ───────────────────────────────────────────────────────────────

class _GoalsTab extends ConsumerWidget {
  const _GoalsTab({required this.linkId});
  final String linkId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_goalsProvider(linkId));

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const _EmptyTab(
          icon: Icons.flag_outlined, message: 'Sem metas ainda'),
      data: (goals) {
        if (goals.isEmpty) {
          return const _EmptyTab(
            icon: Icons.flag_outlined,
            message: 'Nenhuma meta definida\npelo profissional',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
          itemCount: goals.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (_, i) => _GoalCard(goal: goals[i]),
        );
      },
    );
  }
}

class _GoalCard extends StatelessWidget {
  const _GoalCard({required this.goal});
  final Map<String, dynamic> goal;

  static const _statusColors = {
    'active':    Color(0xFF3F5EFB),
    'completed': Color(0xFF1DD2AF),
    'cancelled': Color(0xFF9CA3AF),
  };
  static const _statusLabels = {
    'active':    'Ativa',
    'completed': 'Concluída',
    'cancelled': 'Cancelada',
  };
  static const _categoryIcons = {
    'weight':           Icons.monitor_weight_outlined,
    'strength':         Icons.fitness_center_outlined,
    'endurance':        Icons.directions_run_outlined,
    'nutrition':        Icons.restaurant_outlined,
    'body_composition': Icons.straighten_outlined,
    'other':            Icons.flag_outlined,
  };
  static const _categoryLabels = {
    'weight':           'Peso',
    'strength':         'Força',
    'endurance':        'Resistência',
    'nutrition':        'Nutrição',
    'body_composition': 'Composição',
    'other':            'Outro',
  };

  @override
  Widget build(BuildContext context) {
    final status   = goal['status'] as String? ?? 'active';
    final progress = (goal['progress'] as num?)?.toDouble() ?? 0;
    final color    = _statusColors[status] ?? AppTheme.primary;
    final current  = (goal['currentValue'] as num?)?.toDouble() ?? 0;
    final target   = (goal['targetValue'] as num?)?.toDouble() ?? 0;
    final unit     = goal['unit'] as String? ?? '';
    final category = goal['category'] as String? ?? 'other';
    final catIcon  = _categoryIcons[category] ?? Icons.flag_outlined;
    final catLabel = _categoryLabels[category] ?? 'Outro';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category icon
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(catIcon, size: 22, color: color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              goal['title'] as String? ?? '',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                                height: 1.2,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _statusLabels[status] ?? status,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: color,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        catLabel,
                        style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                            fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Progress section
          Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: (progress / 100).clamp(0.0, 1.0),
                          backgroundColor: color.withValues(alpha: 0.12),
                          valueColor: AlwaysStoppedAnimation<Color>(color),
                          minHeight: 7,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '$current → $target $unit',
                        style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                Text(
                  '${progress.toStringAsFixed(0)}%',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: color,
                  ),
                ),
              ],
            ),
          ),

          if (goal['targetDate'] != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
              child: Row(
                children: [
                  Icon(Icons.calendar_today_outlined,
                      size: 13, color: Colors.grey[400]),
                  const SizedBox(width: 5),
                  Text(
                    'Prazo: ${_formatDate(goal['targetDate'] as String)}',
                    style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            )
          else
            const SizedBox(height: 14),
        ],
      ),
    );
  }

  String _formatDate(String raw) {
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }
}

// ─── Aba: Avaliações ──────────────────────────────────────────────────────────

class _EvaluationsTab extends ConsumerWidget {
  const _EvaluationsTab({required this.linkId});
  final String linkId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_evaluationsProvider(linkId));

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const _EmptyTab(
          icon: Icons.assignment_outlined, message: 'Sem avaliações ainda'),
      data: (evals) {
        if (evals.isEmpty) {
          return const _EmptyTab(
            icon: Icons.assignment_outlined,
            message: 'Nenhuma avaliação\nagendada ainda',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
          itemCount: evals.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (_, i) => _EvalCard(eval: evals[i]),
        );
      },
    );
  }
}

class _EvalCard extends StatelessWidget {
  const _EvalCard({required this.eval});
  final Map<String, dynamic> eval;

  static const _statusColors = {
    'scheduled':   Color(0xFF3F5EFB),
    'completed':   Color(0xFF1DD2AF),
    'cancelled':   Color(0xFF9CA3AF),
    'rescheduled': Color(0xFFFF9800),
  };
  static const _statusLabels = {
    'scheduled':   'Agendada',
    'completed':   'Concluída',
    'cancelled':   'Cancelada',
    'rescheduled': 'Reagendada',
  };
  static const _typeLabels = {
    'physical':    'Avaliação Física',
    'nutritional': 'Avaliação Nutricional',
    'performance': 'Avaliação de Performance',
    'general':     'Avaliação Geral',
  };
  static const _typeIcons = {
    'physical':    Icons.fitness_center_outlined,
    'nutritional': Icons.restaurant_outlined,
    'performance': Icons.speed_outlined,
    'general':     Icons.assignment_outlined,
  };

  @override
  Widget build(BuildContext context) {
    final status = eval['status'] as String? ?? 'scheduled';
    final type   = eval['type']   as String? ?? 'general';
    final color  = _statusColors[status] ?? AppTheme.primary;
    final icon   = _typeIcons[type]  ?? Icons.assignment_outlined;
    final date   = eval['scheduledDate'] as String? ?? '';
    final time   = eval['scheduledTime'] as String?;
    final loc    = eval['location'] as String?;
    final notes  = eval['notes'] as String?;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, size: 22, color: color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              eval['title'] as String? ?? '',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                                height: 1.2,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _statusLabels[status] ?? status,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: color,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _typeLabels[type] ?? type,
                        style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                            fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Date / time / location strip
          Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.calendar_today_outlined,
                    size: 14, color: color.withValues(alpha: 0.7)),
                const SizedBox(width: 6),
                Text(
                  _formatDate(date),
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Colors.grey[700]),
                ),
                if (time != null) ...[
                  const SizedBox(width: 12),
                  Icon(Icons.access_time_outlined,
                      size: 14, color: color.withValues(alpha: 0.7)),
                  const SizedBox(width: 4),
                  Text(
                    time,
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[600]),
                  ),
                ],
              ],
            ),
          ),

          if (loc != null && loc.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Row(
                children: [
                  Icon(Icons.location_on_outlined,
                      size: 14, color: Colors.grey[400]),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      loc,
                      style: TextStyle(
                          fontSize: 12, color: Colors.grey[600]),
                    ),
                  ),
                ],
              ),
            ),

          if (notes != null && notes.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  notes,
                  style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[500],
                      fontStyle: FontStyle.italic),
                ),
              ),
            ),

          const SizedBox(height: 14),
        ],
      ),
    );
  }

  String _formatDate(String raw) {
    if (raw.isEmpty) return '';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }
}

// ─── Aba: Mensagens ───────────────────────────────────────────────────────────

class _MessagesTab extends ConsumerStatefulWidget {
  const _MessagesTab({required this.link, this.autoOpenConversationId});
  final MyProfessionalLink link;
  final String? autoOpenConversationId;

  @override
  ConsumerState<_MessagesTab> createState() => _MessagesTabState();
}

class _MessagesTabState extends ConsumerState<_MessagesTab> {
  bool _autoOpened = false;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(_conversationsProvider(widget.link.id));

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const _EmptyTab(
          icon: Icons.chat_bubble_outline, message: 'Sem conversas ainda'),
      data: (convs) {
        if (!_autoOpened && widget.autoOpenConversationId != null) {
          _autoOpened = true;
          final conv = convs
              .where((c) => c['id'] == widget.autoOpenConversationId)
              .firstOrNull;
          if (conv != null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted) return;
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => _ConversationScreen(
                    conversationId: conv['id'] as String,
                    title: conv['title'] as String? ?? 'Conversa',
                    link: widget.link,
                  ),
                ),
              );
            });
          }
        }

        if (convs.isEmpty) {
          return const _EmptyTab(
            icon: Icons.chat_bubble_outline,
            message: 'Nenhuma conversa com\neste profissional',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
          itemCount: convs.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (_, i) => _ConversationCard(
            conv: convs[i],
            link: widget.link,
          ),
        );
      },
    );
  }
}

class _ConversationCard extends StatelessWidget {
  const _ConversationCard({required this.conv, required this.link});
  final Map<String, dynamic> conv;
  final MyProfessionalLink link;

  @override
  Widget build(BuildContext context) {
    final unread    = (conv['unreadStudent'] as num?)?.toInt() ?? 0;
    final messages  = conv['messages'] as List<dynamic>? ?? [];
    final lastMsg   = messages.isNotEmpty
        ? messages.first as Map<String, dynamic>
        : null;
    final rawDate   = lastMsg?['createdAt'] as String?;
    final timeLabel = rawDate != null ? _formatTime(rawDate) : '';

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => _ConversationScreen(
            conversationId: conv['id'] as String,
            title: conv['title'] as String? ?? 'Conversa',
            link: link,
          ),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: unread > 0
                    ? AppTheme.primary.withValues(alpha: 0.12)
                    : Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.chat_bubble_rounded,
                color: unread > 0 ? AppTheme.primary : Colors.grey[400],
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    conv['title'] as String? ?? '',
                    style: TextStyle(
                      fontWeight:
                          unread > 0 ? FontWeight.w800 : FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  if (lastMsg != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      lastMsg['content'] as String? ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        color: unread > 0
                            ? Colors.grey[700]
                            : Colors.grey[400],
                        fontWeight: unread > 0
                            ? FontWeight.w500
                            : FontWeight.normal,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (unread > 0)
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '$unread',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                if (timeLabel.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    timeLabel,
                    style: TextStyle(fontSize: 10, color: Colors.grey[400]),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(String raw) {
    final dt = DateTime.tryParse(raw)?.toLocal();
    if (dt == null) return '';
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}min';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}';
  }
}

// ─── Tela de conversa ─────────────────────────────────────────────────────────

class _ConversationScreen extends ConsumerStatefulWidget {
  const _ConversationScreen({
    required this.conversationId,
    required this.title,
    required this.link,
  });
  final String conversationId;
  final String title;
  final MyProfessionalLink link;

  @override
  ConsumerState<_ConversationScreen> createState() =>
      _ConversationScreenState();
}

class _ConversationScreenState extends ConsumerState<_ConversationScreen> {
  final _ctrl       = TextEditingController();
  final _scrollCtrl = ScrollController();

  List<Map<String, dynamic>> _messages = [];
  bool _loading = true;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await DioClient.instance.dio.get(
          '/professional/student/conversations/${widget.conversationId}');
      final raw  = res.data;
      final data = (raw is Map ? raw['data'] ?? raw : raw) as Map<String, dynamic>;
      final msgs = (data['messages'] as List<dynamic>? ?? [])
          .map((e) => e as Map<String, dynamic>)
          .toList();
      await DioClient.instance.dio.post(
          '/professional/student/conversations/${widget.conversationId}/read');
      ref.invalidate(_conversationsProvider(widget.link.id));
      if (mounted) {
        setState(() { _messages = msgs; _loading = false; });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _sending) return;
    _ctrl.clear();
    setState(() => _sending = true);
    try {
      final res = await DioClient.instance.dio.post(
        '/professional/student/conversations/${widget.conversationId}/messages',
        data: {'content': text},
      );
      final raw = res.data;
      final msg = (raw is Map ? raw['data'] ?? raw : raw) as Map<String, dynamic>;
      setState(() { _messages.add(msg); _sending = false; });
      _scrollToBottom();
    } catch (_) {
      setState(() => _sending = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        surfaceTintColor: Colors.white,
        titleSpacing: 0,
        title: Row(
          children: [
            _Avatar(
              photoURL: widget.link.professionalPhotoURL,
              displayName: widget.link.professionalDisplayName,
              color: AppTheme.primary,
              size: 34,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w800),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    widget.link.professionalDisplayName,
                    style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                  ),
                ],
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Divider(height: 1, color: Colors.grey[100]),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: _messages.isEmpty
                      ? const _EmptyTab(
                          icon: Icons.chat_bubble_outline,
                          message: 'Nenhuma mensagem ainda',
                        )
                      : ListView.builder(
                          controller: _scrollCtrl,
                          padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                          itemCount: _messages.length,
                          itemBuilder: (_, i) =>
                              _MessageBubble(message: _messages[i]),
                        ),
                ),
                _MessageInput(
                  ctrl: _ctrl,
                  sending: _sending,
                  onSend: _send,
                ),
              ],
            ),
    );
  }
}

// ─── Bolha de mensagem ────────────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});
  final Map<String, dynamic> message;

  @override
  Widget build(BuildContext context) {
    final isStudent = message['senderType'] == 'student';
    final content   = message['content'] as String? ?? '';
    final name      = message['senderName'] as String? ?? '';
    final rawDate   = message['createdAt'] as String?;
    final time      = rawDate != null
        ? _formatTime(DateTime.tryParse(rawDate)?.toLocal())
        : '';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment:
            isStudent ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          if (!isStudent)
            Padding(
              padding: const EdgeInsets.only(left: 6, bottom: 4),
              child: Text(
                name,
                style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w600),
              ),
            ),
          Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.72,
            ),
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isStudent ? AppTheme.primary : Colors.white,
              borderRadius: BorderRadius.only(
                topLeft:     const Radius.circular(20),
                topRight:    const Radius.circular(20),
                bottomLeft:  Radius.circular(isStudent ? 20 : 4),
                bottomRight: Radius.circular(isStudent ? 4 : 20),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              content,
              style: TextStyle(
                fontSize: 14,
                height: 1.4,
                color: isStudent ? Colors.white : Colors.grey[800],
              ),
            ),
          ),
          if (time.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 3, left: 6, right: 6),
              child: Text(
                time,
                style: TextStyle(fontSize: 10, color: Colors.grey[400]),
              ),
            ),
        ],
      ),
    );
  }

  String _formatTime(DateTime? dt) {
    if (dt == null) return '';
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

// ─── Input de mensagem ────────────────────────────────────────────────────────

class _MessageInput extends StatelessWidget {
  const _MessageInput({
    required this.ctrl,
    required this.sending,
    required this.onSend,
  });
  final TextEditingController ctrl;
  final bool sending;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          12, 10, 12, 10 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: ctrl,
              maxLines: 4,
              minLines: 1,
              textInputAction: TextInputAction.newline,
              style: const TextStyle(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Escreva uma mensagem...',
                hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
                filled: true,
                fillColor: Colors.grey[100],
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: sending ? null : onSend,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: sending
                    ? AppTheme.primary.withValues(alpha: 0.5)
                    : AppTheme.primary,
                shape: BoxShape.circle,
              ),
              child: sending
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send_rounded,
                      color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

class _EmptyTab extends StatelessWidget {
  const _EmptyTab({required this.icon, required this.message});
  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 32, color: Colors.grey[350]),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[400],
              fontWeight: FontWeight.w500,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

class _Avatar extends StatelessWidget {
  const _Avatar({
    required this.photoURL,
    required this.displayName,
    required this.color,
    required this.size,
  });
  final String? photoURL;
  final String displayName;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    if (photoURL != null && photoURL!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(size / 2),
        child: Image.network(photoURL!,
            width: size, height: size, fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _fallback),
      );
    }
    return _fallback;
  }

  Widget get _fallback => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            displayName.isNotEmpty ? displayName[0].toUpperCase() : '?',
            style: TextStyle(
              fontSize: size * 0.4,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ),
      );
}
