import 'dart:async';
import 'package:flutter/material.dart';
import '../values/app_colors.dart';

/// Item data untuk Searchable Dropdown
class DropdownItem<T> {
  final T value;
  final String label;
  final String? subtitle;

  const DropdownItem({
    required this.value,
    required this.label,
    this.subtitle,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DropdownItem &&
          runtimeType == other.runtimeType &&
          value == other.value;

  @override
  int get hashCode => value.hashCode;
}

/// Searchable Dropdown Field dengan Debounce & BottomSheet picker (Material 3 style)
class SearchableDropdownField<T> extends StatefulWidget {
  final String labelText;
  final String hintText;
  final T? value;
  final List<DropdownItem<T>> items;
  final ValueChanged<T?>? onChanged;
  final String? Function(T?)? validator;
  final bool enabled;
  final IconData prefixIcon;
  final Duration debounceDuration;

  const SearchableDropdownField({
    super.key,
    required this.labelText,
    required this.hintText,
    required this.items,
    this.value,
    this.onChanged,
    this.validator,
    this.enabled = true,
    this.prefixIcon = Icons.map_outlined,
    this.debounceDuration = const Duration(milliseconds: 350),
  });

  @override
  State<SearchableDropdownField<T>> createState() =>
      _SearchableDropdownFieldState<T>();
}

class _SearchableDropdownFieldState<T>
    extends State<SearchableDropdownField<T>> {

  DropdownItem<T>? get _selectedItem {
    if (widget.value == null) return null;
    try {
      return widget.items.firstWhere((item) => item.value == widget.value);
    } catch (_) {
      return null;
    }
  }

  void _showPickerSheet(BuildContext context) {
    if (!widget.enabled) return;

    showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _SearchablePickerSheet<T>(
        title: widget.labelText,
        items: widget.items,
        selectedValue: widget.value,
        debounceDuration: widget.debounceDuration,
      ),
    ).then((selected) {
      if (selected != null && widget.onChanged != null) {
        widget.onChanged!(selected);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final selected = _selectedItem;

    return FormField<T>(
      initialValue: widget.value,
      validator: widget.validator,
      builder: (state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: widget.enabled ? () => _showPickerSheet(context) : null,
              borderRadius: BorderRadius.circular(12),
              child: InputDecorator(
                decoration: InputDecoration(
                  hintText: widget.hintText,
                  errorText: state.errorText,
                  enabled: widget.enabled,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  prefixIconConstraints:
                      const BoxConstraints(minWidth: 48, minHeight: 48),
                  suffixIconConstraints:
                      const BoxConstraints(minWidth: 40, minHeight: 40),
                  prefixIcon: Icon(
                    widget.prefixIcon,
                    color: widget.enabled
                        ? AppColors.textSecondary
                        : AppColors.textHint,
                    size: 22,
                  ),
                  suffixIcon: Icon(
                    Icons.arrow_drop_down_rounded,
                    color: widget.enabled
                        ? AppColors.textSecondary
                        : AppColors.textHint,
                    size: 26,
                  ),
                ),
                child: Text(
                  selected?.label ?? widget.hintText,
                  style: TextStyle(
                    fontSize: 14,
                    color: selected != null
                        ? AppColors.textPrimary
                        : AppColors.textHint,
                    fontWeight:
                        selected != null ? FontWeight.w500 : FontWeight.normal,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SearchablePickerSheet<T> extends StatefulWidget {
  final String title;
  final List<DropdownItem<T>> items;
  final T? selectedValue;
  final Duration debounceDuration;

  const _SearchablePickerSheet({
    required this.title,
    required this.items,
    this.selectedValue,
    required this.debounceDuration,
  });

  @override
  State<_SearchablePickerSheet<T>> createState() =>
      _SearchablePickerSheetState<T>();
}

class _SearchablePickerSheetState<T>
    extends State<_SearchablePickerSheet<T>> {
  final _searchController = TextEditingController();
  List<DropdownItem<T>> _filteredItems = [];
  Timer? _debounceTimer;
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _filteredItems = List.from(widget.items);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    setState(() => _isSearching = true);

    _debounceTimer = Timer(widget.debounceDuration, () {
      if (!mounted) return;
      final q = query.trim().toLowerCase();
      setState(() {
        if (q.isEmpty) {
          _filteredItems = List.from(widget.items);
        } else {
          _filteredItems = widget.items.where((item) {
            final matchLabel = item.label.toLowerCase().contains(q);
            final matchSub = item.subtitle?.toLowerCase().contains(q) ?? false;
            return matchLabel || matchSub;
          }).toList();
        }
        _isSearching = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle Bar
            const SizedBox(height: 12),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),

            // Header Title
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Pilih ${widget.title}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Search Bar Input
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                autofocus: widget.items.length > 5,
                decoration: InputDecoration(
                  hintText: 'Cari ${widget.title.toLowerCase()}...',
                  prefixIcon: const Icon(Icons.search_rounded, size: 20),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Options List
            Expanded(
              child: _isSearching
                  ? const Center(
                      child: CircularProgressIndicator(strokeWidth: 2.5),
                    )
                  : _filteredItems.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Text(
                              'Tidak ada data "${_searchController.text}"',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          itemCount: _filteredItems.length,
                          separatorBuilder: (_, __) =>
                              const Divider(height: 1, indent: 16, endIndent: 16),
                          itemBuilder: (ctx, idx) {
                            final item = _filteredItems[idx];
                            final isSelected = item.value == widget.selectedValue;

                            return ListTile(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              selected: isSelected,
                              selectedTileColor:
                                  AppColors.primaryGreen.withValues(alpha: 0.08),
                              title: Text(
                                item.label,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: isSelected
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                  color: isSelected
                                      ? AppColors.primaryGreen
                                      : AppColors.textPrimary,
                                ),
                              ),
                              subtitle: item.subtitle != null
                                  ? Text(
                                      item.subtitle!,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    )
                                  : null,
                              trailing: isSelected
                                  ? const Icon(
                                      Icons.check_circle_rounded,
                                      color: AppColors.primaryGreen,
                                      size: 20,
                                    )
                                  : null,
                              onTap: () => Navigator.of(context).pop(item.value),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
