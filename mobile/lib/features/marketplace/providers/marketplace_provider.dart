import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../data/marketplace_service.dart';
import '../domain/professional_listing.dart';

// ─── Search state ─────────────────────────────────────────────────────────────

class MarketplaceState {
  final List<ProfessionalListing> items;
  final bool loading;
  final bool loadingMore;
  final String? error;
  final int currentPage;
  final int totalPages;
  final String query;
  final String? filterType;
  final bool nearMe;
  final double? userLat;
  final double? userLng;
  final double radiusKm;

  const MarketplaceState({
    this.items = const [],
    this.loading = false,
    this.loadingMore = false,
    this.error,
    this.currentPage = 1,
    this.totalPages = 1,
    this.query = '',
    this.filterType,
    this.nearMe = false,
    this.userLat,
    this.userLng,
    this.radiusKm = 25,
  });

  bool get hasMore => currentPage < totalPages;

  MarketplaceState copyWith({
    List<ProfessionalListing>? items,
    bool? loading,
    bool? loadingMore,
    String? error,
    int? currentPage,
    int? totalPages,
    String? query,
    String? filterType,
    bool? nearMe,
    double? userLat,
    double? userLng,
    double? radiusKm,
    bool clearError = false,
    bool clearFilter = false,
    bool clearNearMe = false,
  }) {
    return MarketplaceState(
      items:       items       ?? this.items,
      loading:     loading     ?? this.loading,
      loadingMore: loadingMore ?? this.loadingMore,
      error:       clearError  ? null : (error ?? this.error),
      currentPage: currentPage ?? this.currentPage,
      totalPages:  totalPages  ?? this.totalPages,
      query:       query       ?? this.query,
      filterType:  clearFilter ? null : (filterType ?? this.filterType),
      nearMe:      clearNearMe ? false : (nearMe ?? this.nearMe),
      userLat:     clearNearMe ? null  : (userLat ?? this.userLat),
      userLng:     clearNearMe ? null  : (userLng ?? this.userLng),
      radiusKm:    radiusKm    ?? this.radiusKm,
    );
  }
}

class MarketplaceNotifier extends StateNotifier<MarketplaceState> {
  MarketplaceNotifier() : super(const MarketplaceState());

  final _service = MarketplaceService.instance;

  Future<void> toggleNearMe() async {
    if (state.nearMe) {
      // Turn off
      state = state.copyWith(clearNearMe: true);
      search();
      return;
    }

    // Request permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      state = state.copyWith(
        error: 'Permissão de localização negada.',
        clearError: false,
      );
      return;
    }

    state = state.copyWith(loading: true, clearError: true);
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
        ),
      );
      state = state.copyWith(
        nearMe:  true,
        userLat: pos.latitude,
        userLng: pos.longitude,
        loading: false,
      );
      search();
    } catch (e) {
      state = state.copyWith(loading: false, error: 'Não foi possível obter sua localização.');
    }
  }

  Future<void> search({String? q, String? type, bool reset = true}) async {
    final query      = q      ?? state.query;
    final filterType = type   ?? state.filterType;

    state = state.copyWith(
      loading:    true,
      clearError: true,
      query:      query,
      filterType: (filterType?.isEmpty == true) ? null : filterType,
    );
    try {
      final result = await _service.searchProfessionals(
        q:        query.isNotEmpty ? query : null,
        type:     filterType,
        page:     1,
        lat:      state.nearMe ? state.userLat : null,
        lng:      state.nearMe ? state.userLng : null,
        radiusKm: state.radiusKm,
      );
      state = state.copyWith(
        items:       result.items,
        currentPage: result.page,
        totalPages:  result.pages,
        loading:     false,
      );
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  Future<void> loadMore() async {
    if (!state.hasMore || state.loadingMore) return;
    state = state.copyWith(loadingMore: true);
    try {
      final result = await _service.searchProfessionals(
        q:        state.query.isNotEmpty ? state.query : null,
        type:     state.filterType,
        page:     state.currentPage + 1,
        lat:      state.nearMe ? state.userLat : null,
        lng:      state.nearMe ? state.userLng : null,
        radiusKm: state.radiusKm,
      );
      state = state.copyWith(
        items:       [...state.items, ...result.items],
        currentPage: result.page,
        totalPages:  result.pages,
        loadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(loadingMore: false, error: e.toString());
    }
  }

  void clearFilter() {
    state = state.copyWith(clearFilter: true);
    search(q: state.query);
  }
}

final marketplaceProvider =
    StateNotifierProvider.autoDispose<MarketplaceNotifier, MarketplaceState>(
  (_) => MarketplaceNotifier(),
);
