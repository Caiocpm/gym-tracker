// lib/features/equipe/screens/equipe_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/app_theme.dart';
import '../data/equipe_service.dart';
import '../domain/my_professional_link.dart';
import '../providers/equipe_provider.dart';

const _typeLabels = {
  'personal_trainer': 'Personal Trainer',
  'nutritionist':     'Nutricionista',
  'physiotherapist':  'Fisioterapeuta',
  'coach':            'Coach',
  'other':            'Outro',
};

const _typeIcons = {
  'personal_trainer': Icons.fitness_center,
  'nutritionist':     Icons.restaurant,
  'physiotherapist':  Icons.healing_outlined,
  'coach':            Icons.psychology_outlined,
  'other':            Icons.person_outline,
};

const _typeColors = {
  'personal_trainer': Color(0xFF3F5EFB),
  'nutritionist':     Color(0xFF1DD2AF),
  'physiotherapist':  Color(0xFFFF7043),
  'coach':            Color(0xFF8B5CF6),
  'other':            Color(0xFF6B7280),
};

class EquipeScreen extends ConsumerWidget {
  const EquipeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final linksState   = ref.watch(myLinksProvider);
    final missingTypes = ref.watch(missingTypesProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(myLinksProvider.notifier).refresh(),
          child: CustomScrollView(
            slivers: [
              // ── Header ────────────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Equipe',
                        style: TextStyle(
                            fontSize: 22, fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Seus profissionais de saúde e performance',
                        style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Profissionais vinculados ───────────────────────────────────────
              linksState.when(
                loading: () => SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: List.generate(
                        2,
                        (_) => const _ShimmerCard(),
                      ),
                    ),
                  ),
                ),
                error: (e, _) => SliverToBoxAdapter(
                  child: _ErrorState(
                    onRetry: () =>
                        ref.read(myLinksProvider.notifier).refresh(),
                  ),
                ),
                data: (links) {
                  final active = links.where((l) => l.isActive).toList();
                  if (active.isEmpty) {
                    return const SliverToBoxAdapter(child: SizedBox.shrink());
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    sliver: SliverList.separated(
                      itemCount: active.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: 12),
                      itemBuilder: (context, i) => _ProfessionalCard(
                        link: active[i],
                        onUnlink: () =>
                            _confirmUnlink(context, ref, active[i]),
                      ),
                    ),
                  );
                },
              ),

              // ── CTAs para tipos ausentes ───────────────────────────────────────
              if (missingTypes.isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                    child: Text(
                      'Completar equipe',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey[700],
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                  sliver: SliverList.separated(
                    itemCount: missingTypes.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) =>
                        _FindProfessionalCta(type: missingTypes[i]),
                  ),
                ),
              ],

              // ── Inserir código de convite ──────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
                  child: _InviteCodeButton(
                    onAccept: (code, contractedTypes) =>
                        ref.read(myLinksProvider.notifier).accept(code, contractedTypes),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmUnlink(
      BuildContext context, WidgetRef ref, MyProfessionalLink link) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Desvincular profissional?',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
        content: Text(
          'Ao desvincular ${link.professionalDisplayName}, você perderá '
          'acesso ao histórico compartilhado e poderá buscar outro '
          '${link.typeLabel} no marketplace.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Desvincular'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(myLinksProvider.notifier).unlink(link.id);
    }
  }
}

// ─── Card do profissional vinculado ──────────────────────────────────────────

class _ProfessionalCard extends StatelessWidget {
  const _ProfessionalCard({required this.link, required this.onUnlink});
  final MyProfessionalLink link;
  final VoidCallback onUnlink;

  @override
  Widget build(BuildContext context) {
    final primaryType = link.contractedTypes.isNotEmpty
        ? link.contractedTypes.first
        : 'other';
    final color = _typeColors[primaryType] ?? AppTheme.primary;
    final icon  = _typeIcons[primaryType]  ?? Icons.person_outline;

    return GestureDetector(
      onTap: () => context.push('/equipe/${link.id}'),
      child: Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color ?? Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: color.withValues(alpha: 0.12)),
      ),
      child: Column(
        children: [
          // ── Top row ────────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Avatar
                _Avatar(
                  photoURL:    link.professionalPhotoURL,
                  displayName: link.professionalDisplayName,
                  color:       color,
                  size:        52,
                ),
                const SizedBox(width: 12),

                // Name + contracted types
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        link.professionalDisplayName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 2),
                      // Contracted types chips
                      Wrap(
                        spacing: 6,
                        children: link.contractedTypes.map((t) {
                          final c   = _typeColors[t] ?? AppTheme.primary;
                          final ic  = _typeIcons[t]  ?? Icons.person_outline;
                          final lbl = _typeLabels[t] ?? t;
                          return Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(ic, size: 12, color: c),
                              const SizedBox(width: 3),
                              Text(lbl,
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: c,
                                      fontWeight: FontWeight.w600)),
                            ],
                          );
                        }).toList(),
                      ),
                      // If pro offers more types than contracted, show them dimmed
                      if (_hasExtraTypes) ...[
                        const SizedBox(height: 3),
                        Text(
                          'Também: ${_extraTypeLabels}',
                          style: TextStyle(
                              fontSize: 10, color: Colors.grey[400]),
                        ),
                      ],
                    ],
                  ),
                ),

                // Overflow menu
                PopupMenuButton<String>(
                  icon: Icon(Icons.more_vert, color: Colors.grey[400], size: 20),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  itemBuilder: (_) => [
                    const PopupMenuItem(
                      value: 'unlink',
                      child: Row(
                        children: [
                          Icon(Icons.link_off, size: 18, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Desvincular',
                              style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                  onSelected: (v) {
                    if (v == 'unlink') onUnlink();
                  },
                ),
              ],
            ),
          ),

          // ── Badge counters ─────────────────────────────────────────────────
          if (link.totalPending > 0)
            Container(
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.06),
                borderRadius: const BorderRadius.vertical(
                    bottom: Radius.circular(20)),
              ),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                children: [
                  if (link.unreadMessages > 0)
                    _CounterChip(
                      icon:  Icons.chat_bubble_outline,
                      count: link.unreadMessages,
                      label: 'mensagem${link.unreadMessages > 1 ? 's' : ''}',
                      color: color,
                    ),
                  if (link.unreadMessages > 0 && link.pendingGoals > 0)
                    const SizedBox(width: 8),
                  if (link.pendingGoals > 0)
                    _CounterChip(
                      icon:  Icons.flag_outlined,
                      count: link.pendingGoals,
                      label: 'meta${link.pendingGoals > 1 ? 's' : ''}',
                      color: color,
                    ),
                  if ((link.unreadMessages > 0 || link.pendingGoals > 0) &&
                      link.pendingEvaluations > 0)
                    const SizedBox(width: 8),
                  if (link.pendingEvaluations > 0)
                    _CounterChip(
                      icon:  Icons.assignment_outlined,
                      count: link.pendingEvaluations,
                      label:
                          'avaliação${link.pendingEvaluations > 1 ? 'ões' : ''}',
                      color: color,
                    ),
                ],
              ),
            ),
        ],
      ),
    ),
    );
  }

  bool get _hasExtraTypes {
    final extra = link.professionalTypes
        .where((t) => !link.contractedTypes.contains(t))
        .toList();
    return extra.isNotEmpty;
  }

  String get _extraTypeLabels {
    return link.professionalTypes
        .where((t) => !link.contractedTypes.contains(t))
        .map((t) => _typeLabels[t] ?? t)
        .join(', ');
  }
}

// ─── CTA: buscar tipo de profissional ausente ─────────────────────────────────

class _FindProfessionalCta extends StatelessWidget {
  const _FindProfessionalCta({required this.type});
  final String type;

  @override
  Widget build(BuildContext context) {
    final label = _typeLabels[type] ?? 'Profissional';
    final icon  = _typeIcons[type]  ?? Icons.person_add_outlined;
    final color = _typeColors[type] ?? AppTheme.primary;

    return GestureDetector(
      onTap: () => context.push('/marketplace?type=$type'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withValues(alpha: 0.2),
            style: BorderStyle.solid,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Encontrar $label',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: color,
                    ),
                  ),
                  Text(
                    'Ver profissionais disponíveis',
                    style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 14, color: color),
          ],
        ),
      ),
    );
  }
}

// ─── Botão de código de convite (dois passos) ─────────────────────────────────

class _InviteCodeButton extends StatelessWidget {
  const _InviteCodeButton({required this.onAccept});
  final Future<void> Function(String code, List<String> contractedTypes) onAccept;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: () => _showDialog(context),
      icon: const Icon(Icons.qr_code_scanner_outlined, size: 18),
      label: const Text('Tenho um código de convite'),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        side: BorderSide(color: Colors.grey[300]!),
        foregroundColor: Colors.grey[700],
        minimumSize: const Size(double.infinity, 0),
      ),
    );
  }

  void _showDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) => _InviteCodeDialog(onAccept: onAccept),
    );
  }
}

// ─── Dialog de convite (dois passos) ─────────────────────────────────────────

class _InviteCodeDialog extends StatefulWidget {
  const _InviteCodeDialog({required this.onAccept});
  final Future<void> Function(String code, List<String> contractedTypes) onAccept;

  @override
  State<_InviteCodeDialog> createState() => _InviteCodeDialogState();
}

class _InviteCodeDialogState extends State<_InviteCodeDialog> {
  final _ctrl = TextEditingController();

  // Step: 'input' → 'preview'
  String _step = 'input';
  bool _loading = false;
  String? _error;

  InvitationPreview? _preview;
  late List<String> _selected;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _fetchPreview() async {
    final code = _ctrl.text.trim();
    if (code.isEmpty) return;
    setState(() { _loading = true; _error = null; });
    try {
      final preview = await EquipeService.instance.getInvitationPreview(code);
      setState(() {
        _preview  = preview;
        _selected = List.of(preview.professionalTypes); // default: all
        _step     = 'preview';
        _loading  = false;
      });
    } catch (e) {
      setState(() {
        _error   = 'Convite não encontrado ou expirado';
        _loading = false;
      });
    }
  }

  Future<void> _confirm() async {
    setState(() { _loading = true; _error = null; });
    try {
      await widget.onAccept(_ctrl.text.trim(), _selected);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() {
        _error   = 'Não foi possível aceitar o convite';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        _step == 'input' ? 'Código de convite' : 'Confirmar vínculo',
        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
      ),
      content: _step == 'input' ? _buildInputStep() : _buildPreviewStep(),
      actions: _step == 'input' ? _inputActions() : _previewActions(),
    );
  }

  // ── Step 1: enter code ──────────────────────────────────────────────────────

  Widget _buildInputStep() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        TextField(
          controller: _ctrl,
          autofocus: true,
          textCapitalization: TextCapitalization.characters,
          decoration: InputDecoration(
            hintText: 'Ex: ABC-12345',
            filled: true,
            fillColor: Colors.grey[100],
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(_error!,
              style: const TextStyle(color: Colors.red, fontSize: 13)),
        ],
      ],
    );
  }

  List<Widget> _inputActions() => [
    TextButton(
      onPressed: () => Navigator.pop(context),
      child: const Text('Cancelar'),
    ),
    FilledButton(
      onPressed: _loading ? null : _fetchPreview,
      child: _loading
          ? const SizedBox(
              width: 18, height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('Buscar'),
    ),
  ];

  // ── Step 2: preview + type selection ───────────────────────────────────────

  Widget _buildPreviewStep() {
    final p = _preview!;
    final hasMultiple = p.professionalTypes.length > 1;

    return SizedBox(
      width: double.maxFinite,
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Professional info
            Row(
              children: [
                _MiniAvatar(
                  photoURL:    p.professionalPhotoURL,
                  displayName: p.professionalDisplayName,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.professionalDisplayName,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 15)),
                      Text(
                        p.professionalTypes
                            .map((t) => _typeLabels[t] ?? t)
                            .join(' · '),
                        style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.primary,
                            fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // Type selection (only shown for multi-type professionals)
            if (hasMultiple) ...[
              const SizedBox(height: 16),
              const Text(
                'Selecione as especialidades que está contratando:',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),
              ...p.professionalTypes.map((t) {
                final lbl   = _typeLabels[t] ?? t;
                final color = _typeColors[t] ?? AppTheme.primary;
                final ic    = _typeIcons[t]  ?? Icons.person_outline;
                final isOn  = _selected.contains(t);
                final canDeselect = _selected.length > 1;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    onTap: () {
                      if (!isOn || canDeselect) {
                        setState(() {
                          if (isOn) {
                            _selected = _selected.where((x) => x != t).toList();
                          } else {
                            _selected = [..._selected, t];
                          }
                        });
                      }
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isOn
                            ? color.withValues(alpha: 0.1)
                            : Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isOn ? color : Colors.grey[300]!,
                          width: isOn ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(ic, size: 18,
                              color: isOn ? color : Colors.grey[500]),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              lbl,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isOn ? color : Colors.grey[700],
                              ),
                            ),
                          ),
                          Icon(
                            isOn
                                ? Icons.check_circle
                                : Icons.radio_button_unchecked,
                            size: 20,
                            color: isOn ? color : Colors.grey[400],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],

            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!,
                  style: const TextStyle(color: Colors.red, fontSize: 13)),
            ],
          ],
        ),
      ),
    );
  }

  List<Widget> _previewActions() => [
    TextButton(
      onPressed: () => setState(() { _step = 'input'; _error = null; }),
      child: const Text('Voltar'),
    ),
    FilledButton(
      onPressed: _loading || _selected.isEmpty ? null : _confirm,
      child: _loading
          ? const SizedBox(
              width: 18, height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Text('Aceitar convite'),
    ),
  ];
}

// ─── Mini avatar para o preview ───────────────────────────────────────────────

class _MiniAvatar extends StatelessWidget {
  const _MiniAvatar({required this.photoURL, required this.displayName});
  final String? photoURL;
  final String displayName;

  @override
  Widget build(BuildContext context) {
    const size = 44.0;
    if (photoURL != null && photoURL!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(size / 2),
        child: Image.network(
          photoURL!,
          width: size, height: size, fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _fallback,
        ),
      );
    }
    return _fallback;
  }

  Widget get _fallback => Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          color: AppTheme.primary.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            displayName.isNotEmpty ? displayName[0].toUpperCase() : '?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.primary,
            ),
          ),
        ),
      );
}

// ─── Chips de contadores ──────────────────────────────────────────────────────

class _CounterChip extends StatelessWidget {
  const _CounterChip({
    required this.icon,
    required this.count,
    required this.label,
    required this.color,
  });
  final IconData icon;
  final int count;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Text(
            '$count $label',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
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
        child: Image.network(
          photoURL!,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _fallback,
        ),
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

// ─── Shimmer placeholder ──────────────────────────────────────────────────────

class _ShimmerCard extends StatelessWidget {
  const _ShimmerCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      height: 84,
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(20),
      ),
    );
  }
}

// ─── Error state ──────────────────────────────────────────────────────────────

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('😕', style: TextStyle(fontSize: 40)),
            const SizedBox(height: 12),
            const Text('Não foi possível carregar sua equipe',
                style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            TextButton(onPressed: onRetry, child: const Text('Tentar novamente')),
          ],
        ),
      ),
    );
  }
}
