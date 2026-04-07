import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/app_theme.dart';
import '../data/marketplace_service.dart';
import '../domain/professional_listing.dart';

class ProfessionalProfileScreen extends ConsumerStatefulWidget {
  const ProfessionalProfileScreen({super.key, required this.userId});
  final String userId;

  @override
  ConsumerState<ProfessionalProfileScreen> createState() =>
      _ProfessionalProfileScreenState();
}

class _ProfessionalProfileScreenState
    extends ConsumerState<ProfessionalProfileScreen> {
  ProfessionalListing? _profile;
  bool _loading = true;
  String? _error;
  bool _sending = false;
  bool _sent = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final p = await MarketplaceService.instance.getPublicProfile(widget.userId);
      setState(() { _profile = p; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _sendContactRequest() async {
    final p = _profile;
    if (p == null) return;

    final result = await showModalBottomSheet<({String message, List<String> requestedTypes})?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ContactSheet(professionalTypes: p.professionalTypes),
    );
    if (result == null) return; // cancelled

    setState(() => _sending = true);
    try {
      await MarketplaceService.instance.sendContactRequest(
        p.userId,
        message: result.message.isNotEmpty ? result.message : null,
        requestedTypes: result.requestedTypes,
      );
      setState(() { _sending = false; _sent = true; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Solicitação enviada! O profissional entrará em contato.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() => _sending = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : _ProfileView(
                  profile: _profile!,
                  sending: _sending,
                  sent: _sent,
                  onContact: _sendContactRequest,
                ),
    );
  }
}

// ─── Profile content ──────────────────────────────────────────────────────────

class _ProfileView extends StatelessWidget {
  const _ProfileView({
    required this.profile,
    required this.sending,
    required this.sent,
    required this.onContact,
  });

  final ProfessionalListing profile;
  final bool sending;
  final bool sent;
  final VoidCallback onContact;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        // ── App bar ──────────────────────────────────────────────────────────
        SliverAppBar(
          expandedHeight: profile.photoURL != null ? 220 : 0,
          pinned: true,
          backgroundColor: AppTheme.primary,
          flexibleSpace: profile.photoURL != null
              ? FlexibleSpaceBar(
                  background: Image.network(
                    profile.photoURL!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: AppTheme.primary.withValues(alpha: 0.2),
                    ),
                  ),
                )
              : null,
        ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header info ─────────────────────────────────────────────
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (profile.photoURL == null)
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            profile.displayName[0].toUpperCase(),
                            style: TextStyle(
                              fontSize: 30,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.primary,
                            ),
                          ),
                        ),
                      ),
                    if (profile.photoURL == null) const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            profile.displayName,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            profile.typeLabels.join(' · '),
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (profile.clinicName != null) ...[
                            const SizedBox(height: 2),
                            Text(profile.clinicName!,
                                style: TextStyle(
                                    fontSize: 13, color: Colors.grey[600])),
                          ],
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: profile.availableForHire
                            ? Colors.green[50]
                            : Colors.grey[100],
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        profile.availableForHire
                            ? 'Disponível'
                            : 'Indisponível',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: profile.availableForHire
                              ? Colors.green[700]
                              : Colors.grey[500],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // ── Quick facts ──────────────────────────────────────────────
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    if (profile.location.isNotEmpty)
                      _Chip(
                        icon: Icons.location_on_outlined,
                        label: profile.location,
                      ),
                    if (profile.yearsExperience != null)
                      _Chip(
                        icon: Icons.workspace_premium_outlined,
                        label:
                            '${profile.yearsExperience} anos de experiência',
                      ),
                    if (profile.priceRange != null)
                      _Chip(
                        icon: Icons.monetization_on_outlined,
                        label: profile.priceRange!,
                      ),
                    if (profile.credential.isNotEmpty)
                      _Chip(
                        icon: Icons.verified_outlined,
                        label: profile.credential,
                      ),
                  ],
                ),

                // ── Rating gauge ─────────────────────────────────────────────
                if (profile.ratingCount > 0) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _RatingGauge(
                        avgRating: profile.avgRating ?? 0,
                        ratingCount: profile.ratingCount,
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 20),

                // ── Bio ──────────────────────────────────────────────────────
                if (profile.bio != null && profile.bio!.isNotEmpty) ...[
                  _Section(title: 'Sobre'),
                  const SizedBox(height: 8),
                  Text(
                    profile.bio!,
                    style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[800],
                        height: 1.55),
                  ),
                  const SizedBox(height: 20),
                ],

                // ── Specialties ──────────────────────────────────────────────
                if (profile.specialties.isNotEmpty) ...[
                  _Section(title: 'Especialidades'),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: profile.specialties
                        .map(
                          (s) => Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              s,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 20),
                ],

                // ── Contact links ────────────────────────────────────────────
                if (profile.instagramHandle != null ||
                    profile.websiteUrl != null ||
                    profile.phone != null) ...[
                  _Section(title: 'Contato'),
                  const SizedBox(height: 10),
                  if (profile.phone != null)
                    _ContactRow(
                      icon: Icons.phone_outlined,
                      label: profile.phone!,
                      onTap: () => _copy(context, profile.phone!),
                    ),
                  if (profile.instagramHandle != null)
                    _ContactRow(
                      icon: Icons.camera_alt_outlined,
                      label: '@${profile.instagramHandle}',
                      onTap: () =>
                          _copy(context, '@${profile.instagramHandle}'),
                    ),
                  if (profile.websiteUrl != null)
                    _ContactRow(
                      icon: Icons.language_outlined,
                      label: profile.websiteUrl!,
                      onTap: () => _copy(context, profile.websiteUrl!),
                    ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _copy(BuildContext context, String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Copiado!'), duration: Duration(seconds: 1)),
    );
  }
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

// Wrapped in a separate widget that reads the Scaffold correctly
class ProfessionalProfileScaffold extends StatefulWidget {
  const ProfessionalProfileScaffold({super.key, required this.userId});
  final String userId;

  @override
  State<ProfessionalProfileScaffold> createState() =>
      _ProfessionalProfileScaffoldState();
}

class _ProfessionalProfileScaffoldState
    extends State<ProfessionalProfileScaffold> {
  List<String> _professionalTypes = [];

  @override
  void initState() {
    super.initState();
    _loadTypes();
  }

  Future<void> _loadTypes() async {
    try {
      final profile =
          await MarketplaceService.instance.getPublicProfile(widget.userId);
      if (mounted) setState(() => _professionalTypes = profile.professionalTypes);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        ProfessionalProfileScreen(userId: widget.userId),
        // Persistent bottom button
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: _BottomCTA(
            userId: widget.userId,
            professionalTypes: _professionalTypes,
          ),
        ),
      ],
    );
  }
}

class _BottomCTA extends ConsumerStatefulWidget {
  const _BottomCTA({required this.userId, this.professionalTypes = const []});
  final String userId;
  final List<String> professionalTypes;

  @override
  ConsumerState<_BottomCTA> createState() => _BottomCTAState();
}

class _BottomCTAState extends ConsumerState<_BottomCTA> {
  bool _sending = false;
  bool _sent = false;

  Future<void> _sendRequest() async {
    final result = await showModalBottomSheet<({String message, List<String> requestedTypes})?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ContactSheet(professionalTypes: widget.professionalTypes),
    );
    if (result == null) return;

    setState(() => _sending = true);
    try {
      await MarketplaceService.instance.sendContactRequest(
        widget.userId,
        message: result.message.isNotEmpty ? result.message : null,
        requestedTypes: result.requestedTypes,
      );
      setState(() { _sending = false; _sent = true; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Solicitação enviada! Aguarde o retorno do profissional.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() => _sending = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception:', '').trim()),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(
          20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton(
          onPressed: (_sending || _sent) ? null : _sendRequest,
          style: ElevatedButton.styleFrom(
            backgroundColor: _sent ? Colors.green : AppTheme.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16)),
            elevation: 0,
          ),
          child: _sending
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : Text(
                  _sent
                      ? 'Solicitação enviada!'
                      : 'Solicitar acompanhamento',
                  style: const TextStyle(
                      fontWeight: FontWeight.w800, fontSize: 15),
                ),
        ),
      ),
    );
  }
}

// ─── Contact message sheet ────────────────────────────────────────────────────

const _sheetTypeLabels = {
  'personal_trainer': 'Personal Trainer',
  'nutritionist':     'Nutricionista',
  'physiotherapist':  'Fisioterapeuta',
  'coach':            'Coach',
  'other':            'Outro',
};

const _sheetTypeIcons = {
  'personal_trainer': Icons.fitness_center,
  'nutritionist':     Icons.restaurant,
  'physiotherapist':  Icons.healing_outlined,
  'coach':            Icons.emoji_events_outlined,
  'other':            Icons.person_outline,
};

class _ContactSheet extends StatefulWidget {
  const _ContactSheet({required this.professionalTypes});
  final List<String> professionalTypes;

  @override
  State<_ContactSheet> createState() => _ContactSheetState();
}

class _ContactSheetState extends State<_ContactSheet> {
  final _ctrl = TextEditingController();
  late final Set<String> _selected;

  @override
  void initState() {
    super.initState();
    // Pre-select all types — user deselects what they don't want
    _selected = Set.from(widget.professionalTypes);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  bool get _canSend => _selected.isNotEmpty;

  void _submit() {
    Navigator.pop(
      context,
      (message: _ctrl.text, requestedTypes: _selected.toList()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final multiType = widget.professionalTypes.length > 1;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Handle ──────────────────────────────────────────────────────
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // ── Specialty selection (only for dual-type pros) ────────────────
            if (multiType) ...[
              const Text(
                'Qual serviço você quer contratar?',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
              ),
              const SizedBox(height: 4),
              Text(
                'Selecione um ou mais serviços',
                style: TextStyle(fontSize: 13, color: Colors.grey[500]),
              ),
              const SizedBox(height: 12),
              ...widget.professionalTypes.map((type) {
                final isOn  = _selected.contains(type);
                final label = _sheetTypeLabels[type] ?? type;
                final icon  = _sheetTypeIcons[type] ?? Icons.person_outline;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () {
                      setState(() {
                        if (isOn) {
                          _selected.remove(type);
                        } else {
                          _selected.add(type);
                        }
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 160),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isOn
                            ? AppTheme.primary.withValues(alpha: 0.08)
                            : Colors.grey[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isOn ? AppTheme.primary : Colors.grey[200]!,
                          width: isOn ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(icon,
                              size: 20,
                              color: isOn ? AppTheme.primary : Colors.grey[500]),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              label,
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: isOn ? AppTheme.primary : Colors.grey[700],
                              ),
                            ),
                          ),
                          Icon(
                            isOn ? Icons.check_circle : Icons.circle_outlined,
                            size: 20,
                            color: isOn ? AppTheme.primary : Colors.grey[400],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 8),
            ],

            // ── Message ─────────────────────────────────────────────────────
            const Text(
              'Mensagem (opcional)',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              'Apresente-se e conte o que está buscando',
              style: TextStyle(fontSize: 13, color: Colors.grey[500]),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _ctrl,
              maxLines: 4,
              maxLength: 500,
              autofocus: !multiType,
              decoration: InputDecoration(
                hintText:
                    'Ex: Olá! Estou buscando acompanhamento para emagrecimento...',
                filled: true,
                fillColor: Colors.grey[50],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: Colors.grey[200]!),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: Colors.grey[200]!),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _canSend ? _submit : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey[300],
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text(
                  'Enviar solicitação',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Helper widgets ───────────────────────────────────────────────────────────

class _Section extends StatelessWidget {
  const _Section({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.grey[600]),
          const SizedBox(width: 5),
          Text(label,
              style: TextStyle(fontSize: 12, color: Colors.grey[700])),
        ],
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  const _ContactRow({
    required this.icon,
    required this.label,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppTheme.primary),
            const SizedBox(width: 10),
            Expanded(
              child: Text(label,
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w500)),
            ),
            Icon(Icons.copy_outlined, size: 16, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            const Text('Não foi possível carregar o perfil',
                style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextButton(onPressed: onRetry, child: const Text('Tentar novamente')),
          ],
        ),
      ),
    );
  }
}

// ─── Discrete rating gauge ────────────────────────────────────────────────────

class _RatingGauge extends StatelessWidget {
  const _RatingGauge({required this.avgRating, required this.ratingCount});
  final double avgRating;
  final int ratingCount;

  @override
  Widget build(BuildContext context) {
    final rounded = avgRating.round().clamp(0, 5);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ...List.generate(5, (i) {
          final filled = i < rounded;
          return Padding(
            padding: const EdgeInsets.only(right: 3),
            child: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: filled
                    ? _gaugeColor(rounded)
                    : _gaugeColor(rounded).withValues(alpha: 0.18),
              ),
            ),
          );
        }),
        const SizedBox(width: 6),
        Text(
          '${avgRating.toStringAsFixed(1)} · $ratingCount ${ratingCount == 1 ? "avaliação" : "avaliações"}',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Color _gaugeColor(int score) {
    if (score <= 2) return Colors.red[400]!;
    if (score == 3) return Colors.orange[400]!;
    return Colors.green[500]!;
  }
}
