import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/app_theme.dart';
import '../../equipe/providers/equipe_provider.dart';
import '../domain/professional_listing.dart';
import '../providers/marketplace_provider.dart';

const _typeOptions = [
  (value: 'personal_trainer', label: 'Personal Trainer'),
  (value: 'nutritionist',     label: 'Nutricionista'),
  (value: 'physiotherapist',  label: 'Fisioterapeuta'),
  (value: 'coach',            label: 'Coach'),
  (value: 'other',            label: 'Outro'),
];

class MarketplaceScreen extends ConsumerStatefulWidget {
  const MarketplaceScreen({super.key, this.initialType});
  final String? initialType;

  @override
  ConsumerState<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends ConsumerState<MarketplaceScreen> {
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(marketplaceProvider.notifier).search(type: widget.initialType);
    });
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 200) {
      ref.read(marketplaceProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(marketplaceProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ────────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Profissionais',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Encontre um personal trainer, nutricionista ou coach',
                    style: TextStyle(fontSize: 13, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),

                  // Search bar
                  TextField(
                    controller: _searchCtrl,
                    onSubmitted: (v) =>
                        ref.read(marketplaceProvider.notifier).search(q: v),
                    decoration: InputDecoration(
                      hintText: 'Nome, cidade, especialidade...',
                      prefixIcon: const Icon(Icons.search, size: 20),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                _searchCtrl.clear();
                                ref
                                    .read(marketplaceProvider.notifier)
                                    .search(q: '');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: Colors.grey[100],
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),

                  // Filter chips row: "Perto de mim" + type filters
                  Builder(builder: (context) {
                    final covered = ref.watch(coveredTypesProvider);
                    final visibleOptions = _typeOptions
                        .where((o) => !covered.contains(o.value))
                        .toList();

                    final nearMe = state.nearMe;

                    return SizedBox(
                      height: 34,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          // "Perto de mim" chip
                          FilterChip(
                            avatar: Icon(
                              Icons.my_location,
                              size: 14,
                              color: nearMe ? AppTheme.primary : Colors.grey[600],
                            ),
                            label: Text(
                              'Perto de mim',
                              style: TextStyle(
                                fontSize: 12,
                                color: nearMe ? AppTheme.primary : Colors.grey[700],
                              ),
                            ),
                            selected: nearMe,
                            onSelected: (_) =>
                                ref.read(marketplaceProvider.notifier).toggleNearMe(),
                            selectedColor: AppTheme.primary.withValues(alpha: 0.12),
                            checkmarkColor: AppTheme.primary,
                            backgroundColor: Colors.grey[100],
                            side: BorderSide.none,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            visualDensity: VisualDensity.compact,
                          ),
                          if (visibleOptions.isNotEmpty) const SizedBox(width: 8),
                          ...visibleOptions.asMap().entries.map((entry) {
                            final i   = entry.key;
                            final opt = entry.value;
                            final selected = state.filterType == opt.value;
                            return Padding(
                              padding: EdgeInsets.only(left: i == 0 ? 0 : 8),
                              child: FilterChip(
                                label: Text(opt.label,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: selected
                                          ? AppTheme.primary
                                          : Colors.grey[700],
                                    )),
                                selected: selected,
                                onSelected: (_) {
                                  if (selected) {
                                    ref
                                        .read(marketplaceProvider.notifier)
                                        .clearFilter();
                                  } else {
                                    ref
                                        .read(marketplaceProvider.notifier)
                                        .search(type: opt.value);
                                  }
                                },
                                selectedColor: AppTheme.primary.withValues(alpha: 0.12),
                                checkmarkColor: AppTheme.primary,
                                backgroundColor: Colors.grey[100],
                                side: BorderSide.none,
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                visualDensity: VisualDensity.compact,
                              ),
                            );
                          }),
                        ],
                      ),
                    );
                  }),
                  const SizedBox(height: 4),
                ],
              ),
            ),

            // ── Results ───────────────────────────────────────────────────────
            Expanded(
              child: Builder(builder: (context) {
                final covered = ref.watch(coveredTypesProvider);

                // Exclude professionals whose ALL types are already covered.
                // A dual-type pro (PT + Nutritionist) stays visible when only
                // nutritionist is covered, because PT is still missing.
                final visibleItems = state.items.where((item) {
                  return item.professionalTypes.any((t) => !covered.contains(t));
                }).toList();

                if (state.loading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (visibleItems.isEmpty) {
                  return _EmptyState(
                    hasFilter: state.query.isNotEmpty ||
                        state.filterType != null ||
                        state.nearMe,
                    nearMe: state.nearMe,
                  );
                }
                return RefreshIndicator(
                  onRefresh: () => ref
                      .read(marketplaceProvider.notifier)
                      .search(q: state.query),
                  child: ListView.separated(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                    itemCount: visibleItems.length + (state.loadingMore ? 1 : 0),
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      if (i == visibleItems.length) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }
                      return _ProfessionalCard(
                        listing: visibleItems[i],
                        onTap: () => context.push(
                            '/marketplace/${visibleItems[i].userId}'),
                      );
                    },
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Professional card ────────────────────────────────────────────────────────

class _ProfessionalCard extends StatelessWidget {
  const _ProfessionalCard({required this.listing, required this.onTap});

  final ProfessionalListing listing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            _Avatar(
              photoURL:    listing.photoURL,
              displayName: listing.displayName,
              size:        52,
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name + availability
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          listing.displayName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                      ),
                      if (!listing.availableForHire)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Indisponível',
                            style: TextStyle(
                                fontSize: 11, color: Colors.grey[500]),
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.green[50],
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Disponível',
                            style: TextStyle(
                                fontSize: 11, color: Colors.green[700]),
                          ),
                        ),
                    ],
                  ),

                  const SizedBox(height: 2),
                  Text(
                    listing.typeLabels.join(' · '),
                    style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w600),
                  ),

                  if (listing.location.isNotEmpty || listing.distanceKm != null) ...[
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined,
                            size: 13, color: Colors.grey[400]),
                        const SizedBox(width: 3),
                        if (listing.location.isNotEmpty)
                          Text(listing.location,
                              style: TextStyle(
                                  fontSize: 12, color: Colors.grey[500])),
                        if (listing.distanceKm != null) ...[
                          if (listing.location.isNotEmpty)
                            Text(' · ',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[400])),
                          Text(
                            listing.distanceKm! < 1
                                ? '${(listing.distanceKm! * 1000).round()} m'
                                : '${listing.distanceKm!.toStringAsFixed(1)} km',
                            style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.primary,
                                fontWeight: FontWeight.w600),
                          ),
                        ],
                      ],
                    ),
                  ],

                  if (listing.bio != null && listing.bio!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      listing.bio!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                    ),
                  ],

                  if (listing.specialties.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: listing.specialties
                          .take(3)
                          .map(
                            (s) => Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color:
                                    AppTheme.primary.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                s,
                                style: TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.primary,
                                    fontWeight: FontWeight.w600),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ],

                  if (listing.priceRange != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      listing.priceRange!,
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                  ],

                  if (listing.ratingCount > 0) ...[
                    const SizedBox(height: 6),
                    _RatingGauge(
                      avgRating: listing.avgRating ?? 0,
                      ratingCount: listing.ratingCount,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.hasFilter, this.nearMe = false});
  final bool hasFilter;
  final bool nearMe;

  @override
  Widget build(BuildContext context) {
    final title = nearMe
        ? 'Nenhum profissional próximo'
        : hasFilter
            ? 'Nenhum profissional encontrado'
            : 'Nenhum profissional disponível';
    final subtitle = nearMe
        ? 'Tente aumentar o raio ou desativar "Perto de mim"'
        : hasFilter
            ? 'Tente outros termos ou remova os filtros'
            : 'Em breve profissionais aparecerão aqui';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(nearMe ? '📍' : '🔍',
                style: const TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey[500]),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Shared avatar widget ─────────────────────────────────────────────────────

class _Avatar extends StatelessWidget {
  const _Avatar({
    required this.photoURL,
    required this.displayName,
    required this.size,
  });

  final String? photoURL;
  final String displayName;
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
          color: AppTheme.primary.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            displayName.isNotEmpty
                ? displayName[0].toUpperCase()
                : '?',
            style: TextStyle(
              fontSize: size * 0.4,
              fontWeight: FontWeight.w800,
              color: AppTheme.primary,
            ),
          ),
        ),
      );
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
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: filled
                    ? _gaugeColor(rounded)
                    : _gaugeColor(rounded).withValues(alpha: 0.18),
              ),
            ),
          );
        }),
        const SizedBox(width: 4),
        Text(
          '${avgRating.toStringAsFixed(1)} ($ratingCount)',
          style: TextStyle(
            fontSize: 11,
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
