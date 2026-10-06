sed -i '/Menu Pengajuan Pengosongan Tempat Sampah Warga/i \
                  // ── Menu Aktivasi Tong Komunal ────────────────────────\
                  GestureDetector(\
                    onTap: () => Navigator.of(context).push(\
                      MaterialPageRoute(builder: (_) => const AktivasiTongKomunalView()),\
                    ),\
                    child: Container(\
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),\
                      decoration: BoxDecoration(\
                        color: Colors.white,\
                        borderRadius: BorderRadius.circular(16),\
                        border: Border.all(color: AppColors.border, width: 1),\
                      ),\
                      child: Row(\
                        children: [\
                          Container(\
                            padding: const EdgeInsets.all(12),\
                            decoration: BoxDecoration(\
                              color: AppColors.primaryBlue.withOpacity(0.1),\
                              shape: BoxShape.circle,\
                            ),\
                            child: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primaryBlue, size: 24),\
                          ),\
                          const SizedBox(width: 16),\
                          Expanded(\
                            child: Column(\
                              crossAxisAlignment: CrossAxisAlignment.start,\
                              children: [\
                                const Text(\
                                  '"Aktivasi Tong Komunal (TPS)",\
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),\
                                ),\
                                const SizedBox(height: 4),\
                                const Text(\
                                  '"Daftarkan lokasi dan QR Code tong khusus organik di posko Anda",\
                                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),\
                                ),\
                              ],\
                            ),\
                          ),\
                          const Icon(Icons.chevron_right_rounded, color: AppColors.textHint, size: 20),\
                        ],\
                      ),\
                    ),\
                  ),\
                  const SizedBox(height: 12),\
' lib/app/modules/petugas_pemilahan/views/petugas_pemilahan_dashboard_view.dart
