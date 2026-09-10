import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/providers/repository_providers.dart';
import '../models/admin_bin_model.dart';

// ─── State ────────────────────────────────────────────────────────────────────

class ManajemenBinState {
  const ManajemenBinState({
    this.isLoading = false,
    this.allBins = const [],
    this.filteredBins = const [],
    this.searchQuery = '',
    this.filterRw,
    this.filterKelurahan,
    this.filterStatus,
    this.sortField = 'verifiedAt',
    this.sortAsc = false,
    this.errorMessage,
  });

  final bool isLoading;

  /// Data mentah lengkap dari server (tidak terfilter).
  final List<AdminBinModel> allBins;

  /// Data setelah filter + sort diterapkan.
  final List<AdminBinModel> filteredBins;

  final String searchQuery;
  final String? filterRw;
  final String? filterKelurahan;

  /// Nilai: null = Semua, 'ACTIVE' = Tercetak & Aktif,
  ///        'PRINTED' = Belum Aktif, 'Rusak' = Rusak fisik,
  ///        'Penuh' = kapasitas > 80%
  final String? filterStatus;

  /// Nama field yang digunakan untuk sorting.
  final String sortField;
  final bool sortAsc;
  final String? errorMessage;

  /// Daftar RW unik dari allBins untuk dropdown filter.
  List<String> get rwOptions {
    final set = <String>{};
    for (final b in allBins) {
      if (b.rw != null && b.rw!.isNotEmpty) set.add(b.rw!);
    }
    return set.toList()..sort();
  }

  /// Daftar kelurahan unik dari allBins untuk dropdown filter.
  List<String> get kelurahanOptions {
    final set = <String>{};
    for (final b in allBins) {
      if (b.kelurahan != null && b.kelurahan!.isNotEmpty) {
        set.add(b.kelurahan!);
      }
    }
    return set.toList()..sort();
  }

  ManajemenBinState copyWith({
    bool? isLoading,
    List<AdminBinModel>? allBins,
    List<AdminBinModel>? filteredBins,
    String? searchQuery,
    String? filterRw,
    bool clearFilterRw = false,
    String? filterKelurahan,
    bool clearFilterKelurahan = false,
    String? filterStatus,
    bool clearFilterStatus = false,
    String? sortField,
    bool? sortAsc,
    String? errorMessage,
    bool clearError = false,
  }) {
    return ManajemenBinState(
      isLoading: isLoading ?? this.isLoading,
      allBins: allBins ?? this.allBins,
      filteredBins: filteredBins ?? this.filteredBins,
      searchQuery: searchQuery ?? this.searchQuery,
      filterRw: clearFilterRw ? null : (filterRw ?? this.filterRw),
      filterKelurahan: clearFilterKelurahan
          ? null
          : (filterKelurahan ?? this.filterKelurahan),
      filterStatus:
          clearFilterStatus ? null : (filterStatus ?? this.filterStatus),
      sortField: sortField ?? this.sortField,
      sortAsc: sortAsc ?? this.sortAsc,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

class ManajemenBinNotifier extends StateNotifier<ManajemenBinState> {
  ManajemenBinNotifier(this._ref) : super(const ManajemenBinState()) {
    fetchAll();
  }

  final Ref _ref;

  /// Ambil semua tempat sampah dari server.
  Future<void> fetchAll() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = _ref.read(binRepositoryProvider);
      final raw = await repo.getAdminBins();
      final bins = raw.map(AdminBinModel.fromJson).toList();
      final filtered = _applyFiltersAndSort(bins, state);
      state = state.copyWith(
        isLoading: false,
        allBins: bins,
        filteredBins: filtered,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  /// Set teks pencarian dan re-filter.
  void setSearch(String query) {
    final newState = state.copyWith(searchQuery: query);
    state = newState.copyWith(
      filteredBins: _applyFiltersAndSort(state.allBins, newState),
    );
  }

  /// Set filter RW. Kirim null untuk hapus filter.
  void setFilterRw(String? rw) {
    final newState = rw == null
        ? state.copyWith(clearFilterRw: true)
        : state.copyWith(filterRw: rw);
    state = newState.copyWith(
      filteredBins: _applyFiltersAndSort(state.allBins, newState),
    );
  }

  /// Set filter kelurahan. Kirim null untuk hapus filter.
  void setFilterKelurahan(String? kelurahan) {
    final newState = kelurahan == null
        ? state.copyWith(clearFilterKelurahan: true)
        : state.copyWith(filterKelurahan: kelurahan);
    state = newState.copyWith(
      filteredBins: _applyFiltersAndSort(state.allBins, newState),
    );
  }

  /// Set filter status. Kirim null untuk hapus filter.
  void setFilterStatus(String? status) {
    final newState = status == null
        ? state.copyWith(clearFilterStatus: true)
        : state.copyWith(filterStatus: status);
    state = newState.copyWith(
      filteredBins: _applyFiltersAndSort(state.allBins, newState),
    );
  }

  /// Toggle sort: same field → balik asc/desc; field baru → asc.
  void setSort(String field) {
    final newAsc = state.sortField == field ? !state.sortAsc : true;
    final newState = state.copyWith(sortField: field, sortAsc: newAsc);
    state = newState.copyWith(
      filteredBins: _applyFiltersAndSort(state.allBins, newState),
    );
  }

  /// Reset semua filter.
  void resetFilters() {
    final newState = ManajemenBinState(
      allBins: state.allBins,
      sortField: state.sortField,
      sortAsc: state.sortAsc,
      filteredBins: _applyFiltersAndSort(
        state.allBins,
        const ManajemenBinState(),
      ),
    );
    state = newState;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  List<AdminBinModel> _applyFiltersAndSort(
    List<AdminBinModel> source,
    ManajemenBinState s,
  ) {
    var result = source.where((bin) {
      // 1. Search
      if (s.searchQuery.isNotEmpty) {
        final q = s.searchQuery.toLowerCase();
        final matchName = bin.wargaName?.toLowerCase().contains(q) ?? false;
        final matchPhone = bin.wargaPhone?.toLowerCase().contains(q) ?? false;
        final matchKode = bin.kode.toLowerCase().contains(q);
        final matchQr = bin.qrCode.toLowerCase().contains(q);
        final matchRw = bin.rw?.toLowerCase().contains(q) ?? false;
        final matchKel = bin.kelurahan?.toLowerCase().contains(q) ?? false;
        final matchLokasi = bin.lokasi?.toLowerCase().contains(q) ?? false;
        if (!matchName &&
            !matchPhone &&
            !matchKode &&
            !matchQr &&
            !matchRw &&
            !matchKel &&
            !matchLokasi) {
          return false;
        }
      }

      // 2. Filter RW
      if (s.filterRw != null && s.filterRw!.isNotEmpty) {
        if (bin.rw != s.filterRw) return false;
      }

      // 3. Filter kelurahan
      if (s.filterKelurahan != null && s.filterKelurahan!.isNotEmpty) {
        if (bin.kelurahan != s.filterKelurahan) return false;
      }

      // 4. Filter status
      if (s.filterStatus != null && s.filterStatus!.isNotEmpty) {
        final fs = s.filterStatus!.toLowerCase();
        final rs = bin.realStatus.toLowerCase();
        final st = bin.status.toLowerCase();

        if (fs == 'active' || fs == 'tercetak & aktif') {
          if (!bin.isActiveAndBound) return false;
        } else if (fs == 'printed' || fs == 'belum aktif') {
          if (rs != 'printed') return false;
        } else if (fs == 'rusak' || fs == 'broken') {
          if (rs != 'broken' && st != 'rusak') return false;
        } else if (fs == 'penuh') {
          if (!bin.isCritical) return false;
        } else if (fs == 'sedang') {
          if (!bin.isWarning) return false;
        } else if (fs == 'aman' || fs == 'normal') {
          if (bin.isCritical || bin.isWarning) return false;
        }
      }

      return true;
    }).toList();

    // Sort
    result.sort((a, b) {
      int cmp;
      switch (s.sortField) {
        case 'wargaName':
          cmp = (a.wargaName ?? '').compareTo(b.wargaName ?? '');
        case 'kapasitas':
          cmp = a.kapasitas.compareTo(b.kapasitas);
        case 'maxCapacity':
          cmp = a.maxCapacityLiter.compareTo(b.maxCapacityLiter);
        case 'rw':
          cmp = (a.rw ?? '').compareTo(b.rw ?? '');
        case 'kelurahan':
          cmp = (a.kelurahan ?? '').compareTo(b.kelurahan ?? '');
        case 'status':
          cmp = a.status.compareTo(b.status);
        case 'verifiedAt':
        default:
          cmp = (a.verifiedAt ?? '').compareTo(b.verifiedAt ?? '');
      }
      return s.sortAsc ? cmp : -cmp;
    });

    return result;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

final manajemenBinProvider =
    StateNotifierProvider<ManajemenBinNotifier, ManajemenBinState>(
      (ref) => ManajemenBinNotifier(ref),
    );
