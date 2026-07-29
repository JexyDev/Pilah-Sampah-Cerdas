# Graph Report - .  (2026-07-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2760 nodes · 3950 edges · 200 communities (145 shown, 55 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b182088e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app_strings.dart
- poin_screen.dart
- beranda_screen.dart
- dependencies
- useAuthStore
- dependencies
- react
- profil_screen.dart
- GeneratedPluginRegistrant.swift
- scan_flow_screen.dart
- app_colors.dart
- api
- forgot_password_screen.dart
- BinController
- BinRepository
- app_router.dart
- AuthController
- reset_bin_screen.dart
- inline_camera_widget.dart
- main_shell.dart
- app_dimensions.dart
- BinService
- my_application.cc
- index.ts
- aktivasi_bin_screen.dart
- bin_provider.dart
- qr_scanner_widget.dart
- login_screen.dart
- register_screen.dart
- waste_log_provider.dart
- auth_provider.dart
- AuthService
- kkn_location_provider.dart
- compilerOptions
- trello-sync.js
- otp_input_widget.dart
- scripts
- UserRepository
- app_config.dart
- devDependencies
- binService.ts
- authMiddleware.ts
- AuthRepository
- bin_entity.dart
- main.dart
- devDependencies
- HouseholdRepository
- api_client.dart
- bin_repository.dart
- compilerOptions
- DesignSystemGenerator
- IdeDaurUlangController
- PointController
- api_auth_repository.dart
- api_bin_repository.dart
- ukur_kapasitas_screen.dart
- monitoring_warga_screen.dart
- services/api.ts
- app_assets.dart
- auth_repository.dart
- splash_screen.dart
- Leaderboard.tsx
- design_system.py
- repository_providers.dart
- timbangan_residu_screen.dart
- win32_window.cpp
- batch3.test.ts
- authRoutes.ts
- compilerOptions
- user_entity.dart
- State
- FlutterWindow
- gamificationController.ts
- SuperAdminService
- notification_engine.dart
- kkn_attendance_screen.dart
- _sync_all.py
- search
- skeleton_loading.dart
- app_text_styles.dart
- SuperAdminController
- local_notification_service.dart
- notification_provider.dart
- Win32Window
- KknAttendanceService
- KknService
- SystemController
- responsive_utils.dart
- api_notification_repository.dart
- api_waste_log_repository.dart
- ai_detection_entity.dart
- bin_reset_entity.dart
- Monitoring.tsx
- qc-test.ts
- transactionRoutes.ts
- jwtUtils.ts
- waste_log_entity.dart
- wWinMain
- plugins
- categoryRoutes.ts
- RedisService
- platform_utils.dart
- notification_entity.dart
- manifest.json
- configService.ts
- AiController
- notificationIntegrationService.ts
- batch2.test.ts
- CronService
- point_history_entity.dart
- MessageHandler
- BM25
- seed-demo-100.ts
- KknController
- safe_storage.dart
- waste_log_repository.dart
- notification_repository.dart
- ManajemenLokasi.tsx
- MonitoringAbsen.tsx
- ConfigService
- residuService.ts
- api/src/services/authService.ts
- AiService
- Equatable
- apiClientProvider
- CustomIcons.tsx
- useMasterDataStore.ts
- adminMahasiswaRoutes.ts
- FacilityController
- ResiduController
- scheduleRoutes.ts
- StateNotifier
- _generate_intelligent_overrides
- package:flutter/services.dart
- NotifikasiScreen
- dashboardService.ts
- NotificationIntegrationController
- kknAttendanceRoutes.ts
- package:dio/dio.dart
- Exception
- widget_test.dart
- fix-schema.js
- filter_migration.cjs
- run_rename.cjs
- seed-demo.js
- update-schema.js
- update-schema-2.js
- update-schema-3.js
- RegisterPlugins
- get-dashboard-component.ts
- remove-unused.ts
- fix_checksum.cjs
- rename_name.cjs
- seed-phones-and-data.ts
- @types/node
- seed.ts
- seed-demo-real.ts
- seed-rt.ts
- statusLogger.ts
- MainActivity
- auto-fix-all.ts
- get-dashboard-entry.ts
- get-dashboard-index.ts
- tsc-auto-fix.ts
- web/tsconfig.json
- rename_columns.js
- seed-anorganik.ts
- seed-anorganik2.ts
- seed-anorganik3.ts
- seed-anorganik-final.ts
- seed-audit.ts
- seed-demo2.ts
- seed-demo.ts
- seed_dummy.ts
- seed-pending.ts
- seed_users.ts
- add-copyright.js
- consolidate-tasks.js
- _firebaseMessagingBackgroundHandler
- eslint-plugin-prettier
- ssh2
- @types/bcryptjs
- @types/cookie-parser
- @types/multer
- @types/swagger-jsdoc
- @types/uuid
- @types/ws
- @typescript-eslint/parser
- vitest
- append_migration.cjs
- String?

## God Nodes (most connected - your core abstractions)
1. `react` - 57 edges
2. `api` - 44 edges
3. `useAuthStore` - 37 edges
4. `BinController` - 35 edges
5. `BinRepository` - 35 edges
6. `BinService` - 34 edges
7. `authProvider` - 28 edges
8. `authMiddleware()` - 27 edges
9. `roleMiddleware()` - 23 edges
10. `AuthService` - 23 edges

## Surprising Connections (you probably didn't know these)
- `OnCreate` --calls--> `RegisterPlugins()`  [INFERRED]
  apps/mobile/windows/runner/flutter_window.h → apps/mobile/windows/flutter/generated_plugin_registrant.cc
- `wWinMain()` --calls--> `CreateAndAttachConsole()`  [INFERRED]
  apps/mobile/windows/runner/main.cpp → apps/mobile/windows/runner/utils.cpp
- `Win32Window::Win32Window()` --calls--> `Destroy`  [INFERRED]
  apps/mobile/windows/runner/win32_window.cpp → apps/mobile/windows/runner/win32_window.h
- `_generate_intelligent_overrides()` --calls--> `search()`  [EXTRACTED]
  .agents/skills/ui-ux-pro-max/scripts/design_system.py → .agents/skills/ui-ux-pro-max/scripts/core.py
- `authMiddleware()` --calls--> `verifyAccessToken()`  [EXTRACTED]
  apps/api/src/middlewares/authMiddleware.ts → apps/api/src/utils/jwtUtils.ts

## Import Cycles
- None detected.

## Communities (200 total, 55 thin omitted)

### Community 0 - "app_strings.dart"
Cohesion: 0.03
Nodes (69): aiDailyLimitExceeded, aiDetecting, aiImageUnreadable, aiSuccess, aiTimeout, aktivasiSubtitle, aktivasiSuccess, aktivasiTitle (+61 more)

### Community 1 - "poin_screen.dart"
Cohesion: 0.04
Nodes (53): _NotFoundScreen, _SuccessScreen, _RiwayatCard, _VerticalDivider, _buildHeaderSkeleton, _buildScheduleBadge, _buildScheduleStatusCard, _buildStatsRow (+45 more)

### Community 2 - "beranda_screen.dart"
Cohesion: 0.05
Nodes (47): BinStatus, _buildEmptyLogs, _buildHeader, _buildScheduleBadge, _getGreeting, icon, iconColor, label (+39 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (46): author, dependencies, bcryptjs, cookie-parser, dotenv, express, jsonwebtoken, multer (+38 more)

### Community 4 - "useAuthStore"
Cohesion: 0.07
Nodes (25): IconRenderer(), IconRendererProps, Header(), HeaderProps, NavItemProps, Sidebar(), SidebarProps, Dashboard() (+17 more)

### Community 5 - "dependencies"
Cohesion: 0.04
Nodes (44): author, dependencies, axios, browser-image-compression, leaflet, lucide-react, react, react-dom (+36 more)

### Community 6 - "react"
Cohesion: 0.08
Nodes (20): App(), ErrorBoundaryFallback(), APP_CONFIG, ManajemenPengangkutan(), NotFound(), PemanfaatanSampah(), RwFacilityInput(), AktivitasMonitoring() (+12 more)

### Community 7 - "profil_screen.dart"
Cohesion: 0.06
Nodes (40): UkurKapasitasScreen, _UkurKapasitasScreenState, build, ForgotPasswordScreen, _ForgotPasswordScreenState, _onRequestOtp, _onResetPassword, LoginScreen (+32 more)

### Community 8 - "GeneratedPluginRegistrant.swift"
Cohesion: 0.06
Nodes (28): RunnerTests, RegisterGeneratedPlugins(), AppDelegate, MainFlutterWindow, RunnerTests, Bool, Cocoa, connectivity_plus (+20 more)

### Community 9 - "scan_flow_screen.dart"
Cohesion: 0.06
Nodes (37): scanFlowProvider, build, _buildCameraBackground, _buildDetailItem, _buildProgressBar, _buildStep0, _buildStep1Loading, _buildStep2QrScan (+29 more)

### Community 10 - "app_colors.dart"
Cohesion: 0.06
Nodes (35): AppColors, backgroundCanvas, binCritical, binSafe, binWarning, border, cardBackground, dangerRed (+27 more)

### Community 11 - "api"
Cohesion: 0.10
Nodes (14): APP_CONFIG, BantuFasilitasForm(), BantuPetugasForm(), BantuPetugasFormProps, HandoverForm(), KknQrClaim(), Props, WargaRegistrationWizard() (+6 more)

### Community 12 - "forgot_password_screen.dart"
Cohesion: 0.06
Nodes (32): _buildStep1, _buildStep2, _buildStep3, _buildStepIndicator, _canResend, _confirmPasswordController, createState, _currentStep (+24 more)

### Community 15 - "app_router.dart"
Cohesion: 0.06
Nodes (31): aktivasiBin, AppRouter, AppRoutes, build, _buildRoute, forgotPassword, kknAttendance, login (+23 more)

### Community 16 - "AuthController"
Cohesion: 0.08
Nodes (10): AuthController, loginSchema, normalizePhone(), refreshSchema, registerKknSchema, registerPetugasSchema, registerStaffSchema, registerWargaSchema (+2 more)

### Community 17 - "reset_bin_screen.dart"
Cohesion: 0.08
Nodes (29): handleScanNavigation, ScanGuard, build, _buildAksiCepat, build, binsProvider, resetBinProvider, build (+21 more)

### Community 18 - "inline_camera_widget.dart"
Cohesion: 0.06
Nodes (30): build, _buildError, _buildLiveCamera, _buildLoading, _buildPermDenied, _buildPreview, _buildWebFallback, _cameras (+22 more)

### Community 19 - "main_shell.dart"
Cohesion: 0.07
Nodes (28): build, _buildBottomBar, _buildFab, _buildMobileShell, _buildNavigationRail, _buildTabletShell, createState, _getScreens (+20 more)

### Community 20 - "app_dimensions.dart"
Cohesion: 0.07
Nodes (27): appBarHeight, AppDimensions, bottomNavHeight, buttonHeight, buttonHeightSm, cardElevation, cardPadding, compactWidth (+19 more)

### Community 22 - "my_application.cc"
Cohesion: 0.09
Nodes (22): fl_register_plugins(), main(), first_frame_cb(), my_application_activate(), my_application_class_init(), my_application_dispose(), my_application_init(), my_application_local_command_line() (+14 more)

### Community 23 - "index.ts"
Cohesion: 0.09
Nodes (20): app, server, router, router, router, router, router, router (+12 more)

### Community 24 - "aktivasi_bin_screen.dart"
Cohesion: 0.09
Nodes (25): AktivasiBinScreen, _AktivasiBinScreenState, _argsLoaded, _bothBinsDetected, build, _buildDetectedContent, _buildInfoCard, _buildScanPrompt (+17 more)

### Community 25 - "bin_provider.dart"
Cohesion: 0.08
Nodes (25): aiResult, aktivasi, aktivasiBatch, AktivasiBinNotifier, AktivasiBinState, _binRepository, clearError, copyWith (+17 more)

### Community 26 - "qr_scanner_widget.dart"
Cohesion: 0.08
Nodes (25): build, _buildDenied, _buildLoading, _buildManualInput, _buildScanner, color, _controller, createState (+17 more)

### Community 27 - "login_screen.dart"
Cohesion: 0.08
Nodes (23): checkAndRequestPermission, getCurrentLocation, instance, LocationService, build, createState, dispose, _formKey (+15 more)

### Community 28 - "register_screen.dart"
Cohesion: 0.08
Nodes (24): _alamatController, _buildLabel, _confirmPasswordController, createState, dispose, _fakultasController, _formKey, _isToastVisible (+16 more)

### Community 29 - "waste_log_provider.dart"
Cohesion: 0.11
Nodes (24): BerandaScreen, build, _buildStatsCard, build, _buildHeader, PoinScreen, unreadNotificationCountProvider, dailyPointsProvider (+16 more)

### Community 30 - "auth_provider.dart"
Cohesion: 0.08
Nodes (24): _authRepository, AuthState, clearError, copyWith, errorCode, fetchProfile, forgotPassword, _init (+16 more)

### Community 31 - "AuthService"
Cohesion: 0.15
Nodes (5): AuthService, comparePassword(), hashPassword(), generateAccessToken(), generateRefreshToken()

### Community 32 - "kkn_location_provider.dart"
Cohesion: 0.09
Nodes (23): activeActivity, attendanceTime, clearActiveSchedule, copyWith, currentPosition, _currentTargetScheduleId, dispose, distanceToTarget (+15 more)

### Community 33 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 34 - "trello-sync.js"
Cohesion: 0.19
Nodes (23): addComment(), buildCardDescription(), callTrello(), checkAllChecklists(), createCard(), DEFAULT_MODULE_LABELS, detectLabelsFromFiles(), extractTaskIds() (+15 more)

### Community 35 - "otp_input_widget.dart"
Cohesion: 0.09
Nodes (22): _animController, autoFocus, build, clear, controller, _controllers, createState, currentValue (+14 more)

### Community 36 - "scripts"
Cohesion: 0.09
Nodes (22): concurrently, author, description, devDependencies, concurrently, license, name, private (+14 more)

### Community 37 - "UserRepository"
Cohesion: 0.11
Nodes (6): userController, prisma, UserRepository, prisma, {
  mockPrismaUserCreate,
  mockPrismaStudentKknCreate,
  mockPrismaUserFindUnique,
  mockPrismaTransaction,
}, UserService

### Community 38 - "app_config.dart"
Cohesion: 0.09
Nodes (21): accessTokenKey, aiDailyLimit, aiTimeoutMs, apiBaseUrl, AppConfig, appName, binCriticalThresholdPercent, binMaxCapacityLiters (+13 more)

### Community 39 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, eslint, eslint-config-prettier, prettier, prisma, tsx, @types/express, @types/jsonwebtoken (+13 more)

### Community 40 - "binService.ts"
Cohesion: 0.13
Nodes (10): scanSchema, prisma, DENSITY, prisma, clients, prisma, websocketService, getDistanceMeters() (+2 more)

### Community 41 - "authMiddleware.ts"
Cohesion: 0.26
Nodes (6): authMiddleware(), Express, prisma, roleMiddleware(), prisma, router

### Community 43 - "bin_entity.dart"
Cohesion: 0.10
Nodes (20): apiValue, binType, capacityPercent, currentVolumeL, displayName, householdName, id, isActive (+12 more)

### Community 44 - "main.dart"
Cohesion: 0.10
Nodes (20): build, createState, initializeDateFormatting, initState, main, navigatorKey, null, PilahSampahApp (+12 more)

### Community 45 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, oxlint, postcss, tailwindcss, @tailwindcss/vite, @types/leaflet, @types/react (+13 more)

### Community 46 - "HouseholdRepository"
Cohesion: 0.11
Nodes (5): HouseholdController, registerSchema, HouseholdRepository, prisma, HouseholdService

### Community 47 - "api_client.dart"
Cohesion: 0.10
Nodes (19): _cachedToken, clearTokenCache, completer, dio, _forceLogout, handler, _isRefreshing, _PendingRequest (+11 more)

### Community 48 - "bin_repository.dart"
Cohesion: 0.10
Nodes (19): activateBin, activateBinsBatch, BinRepository, code, detectWaste, getBinByQrSerial, getBinsByHousehold, measureBin (+11 more)

### Community 49 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 50 - "DesignSystemGenerator"
Cohesion: 0.14
Nodes (11): DesignSystemGenerator, Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Bucket a 1-10 dial value into its tier config. Returns None if value is None., Generates design system recommendations from aggregated searches. (+3 more)

### Community 51 - "IdeDaurUlangController"
Cohesion: 0.11
Nodes (3): IdeDaurUlangController, IdeDaurUlangService, prisma

### Community 52 - "PointController"
Cohesion: 0.12
Nodes (5): PointController, PointRepository, prisma, PointService, prisma

### Community 53 - "api_auth_repository.dart"
Cohesion: 0.11
Nodes (18): apiClient, _fetchAndAttachHousehold, fetchProfile, forgotPassword, getCurrentUser, isLoggedIn, login, logout (+10 more)

### Community 54 - "api_bin_repository.dart"
Cohesion: 0.11
Nodes (18): activateBin, activateBinsBatch, ApiBinRepository, apiClient, detectWaste, getBinByQrSerial, getBinsByHousehold, _mapMyBin (+10 more)

### Community 55 - "ukur_kapasitas_screen.dart"
Cohesion: 0.11
Nodes (18): _buildBinCard, createState, dispose, _isLoading, _nonOrganicMode, _nonOrganicStandardSize, _nonOrgLebarCtrl, _nonOrgPanjangCtrl (+10 more)

### Community 56 - "monitoring_warga_screen.dart"
Cohesion: 0.11
Nodes (18): build, _buildChartCard, _ChartDataPoint, createState, _CustomXYChartPainter, data, _errorMessage, initState (+10 more)

### Community 57 - "services/api.ts"
Cohesion: 0.12
Nodes (5): PermissionState, SetorSampah(), Step, predictWaste(), SetorPayload

### Community 58 - "app_assets.dart"
Cohesion: 0.11
Nodes (17): aktivasiBin, AppAssets, beranda, binMismatch, failedScan, login1, login2, logo (+9 more)

### Community 59 - "auth_repository.dart"
Cohesion: 0.11
Nodes (17): AuthRepository, code, fetchProfile, forgotPassword, getCurrentUser, isLoggedIn, login, logout (+9 more)

### Community 60 - "splash_screen.dart"
Cohesion: 0.12
Nodes (17): build, createState, dispose, _dotsController, _dotsFade, initState, SplashScreen, _SplashScreenState (+9 more)

### Community 61 - "Leaderboard.tsx"
Cohesion: 0.14
Nodes (13): BarChartRace(), KELURAHAN_SEEDS, KelurahanData, Badge(), BadgeProps, BadgeStatus, GenericItem, Leaderboard() (+5 more)

### Community 62 - "design_system.py"
Cohesion: 0.17
Nodes (16): ansi_ljust(), format_ascii_box(), format_markdown(), format_master_md(), generate_design_system(), hex_to_ansi(), persist_design_system(), Convert hex color to ANSI True Color swatch (██) with fallback. (+8 more)

### Community 63 - "repository_providers.dart"
Cohesion: 0.12
Nodes (16): ApiAuthRepository, authRepositoryProvider, binRepositoryProvider, dioProvider, notificationRepositoryProvider, secureStorageProvider, wasteLogRepositoryProvider, AuthRepository (+8 more)

### Community 64 - "timbangan_residu_screen.dart"
Cohesion: 0.12
Nodes (16): _areas, build, createState, dispose, _errorMessage, _formKey, initState, _isLoadingAreas (+8 more)

### Community 65 - "win32_window.cpp"
Cohesion: 0.19
Nodes (13): wchar_t, Scale(), Create, Destroy, UpdateTheme, Win32Window::Win32Window(), WindowClassRegistrar, class_registered_ (+5 more)

### Community 66 - "batch3.test.ts"
Cohesion: 0.16
Nodes (9): BankSampahController, bankSampahService, prisma, mockCreate, mockFindMany, mockFindUnique, mockUpdate, facilityService (+1 more)

### Community 67 - "authRoutes.ts"
Cohesion: 0.17
Nodes (9): AttemptRecord, attempts, loginRateLimiter(), storage, uploadAvatarMiddleware, router, router, router (+1 more)

### Community 68 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, resolveJsonModule (+7 more)

### Community 69 - "user_entity.dart"
Cohesion: 0.13
Nodes (15): copyWith, fcmToken, fotoProfil, fromApi, householdId, id, kelurahan, name (+7 more)

### Community 70 - "State"
Cohesion: 0.18
Nodes (16): InlineCameraWidget, _InlineCameraWidgetState, _OtpBox, _OtpBoxState, OtpInputWidget, OtpInputWidgetState, _FlashButton, _FlashButtonState (+8 more)

### Community 71 - "FlutterWindow"
Cohesion: 0.13
Nodes (13): DartProject, HWND, LPARAM, LRESULT, UINT, WPARAM, FlutterWindow, flutter_controller_ (+5 more)

### Community 72 - "gamificationController.ts"
Cohesion: 0.16
Nodes (6): GamificationController, gamificationService, prisma, getScopingFilters(), prisma, ScopingFilters

### Community 74 - "notification_engine.dart"
Cohesion: 0.13
Nodes (14): _flutterLocalNotificationsPlugin, init, _instance, _isInitialized, _nextInstanceOfTime, NotificationEngine, _requestPermissions, _scheduleFixedNotifications (+6 more)

### Community 75 - "kkn_attendance_screen.dart"
Cohesion: 0.16
Nodes (14): build, _buildAttendanceDetail, _buildScheduleList, createState, initState, _isLoadingSchedules, KknAttendanceScreen, _KknAttendanceScreenState (+6 more)

### Community 76 - "_sync_all.py"
Cohesion: 0.29
Nodes (13): blend(), derive_row(), derive_ui_reasoning(), h2r(), is_dark(), lum(), on_color(), r2h() (+5 more)

### Community 77 - "search"
Cohesion: 0.21
Nodes (12): detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search stack-specific guidelines, search() (+4 more)

### Community 78 - "skeleton_loading.dart"
Cohesion: 0.14
Nodes (13): Animation, AnimationController, borderRadius, build, _colorAnimation, _controller, createState, dispose (+5 more)

### Community 79 - "app_text_styles.dart"
Cohesion: 0.14
Nodes (13): app_colors.dart, AppTextStyles, bodyLarge, bodyMedium, bodySmall, caption, h1, h2 (+5 more)

### Community 81 - "local_notification_service.dart"
Cohesion: 0.14
Nodes (13): init, instance, _isInitialized, LocalNotificationService, _notificationsPlugin, _scheduleDailyAtTime, scheduleDailyReminders, FlutterLocalNotificationsPlugin (+5 more)

### Community 82 - "notification_provider.dart"
Cohesion: 0.15
Nodes (13): errorCode, errorMessage, getNotifications, isLoading, markAllRead, markRead, MarkReadNotifier, MarkReadState (+5 more)

### Community 83 - "Win32Window"
Cohesion: 0.20
Nodes (14): OnCreate, OnDestroy, HWND, Win32Window, child_content_, GetClientArea, OnCreate, OnDestroy (+6 more)

### Community 84 - "KknAttendanceService"
Cohesion: 0.26
Nodes (4): kknAttendanceController, calculateDistance(), KknAttendanceService, prisma

### Community 85 - "KknService"
Cohesion: 0.18
Nodes (3): KknService, prisma, prisma

### Community 86 - "SystemController"
Cohesion: 0.19
Nodes (6): SystemController, mockCreate, mockFindMany, prisma, prisma, systemService

### Community 87 - "responsive_utils.dart"
Cohesion: 0.15
Nodes (12): build, fontScale, horizontalPadding, isCompact, isTablet, mobile, ResponsiveLayout, ResponsiveUtils (+4 more)

### Community 88 - "api_notification_repository.dart"
Cohesion: 0.15
Nodes (12): ApiClient, apiClient, ApiNotificationRepository, getNotifications, _mapNotification, markAllAsRead, markAsRead, registerDeviceToken (+4 more)

### Community 89 - "api_waste_log_repository.dart"
Cohesion: 0.15
Nodes (12): apiClient, getPointHistoryByUser, getTotalPointsByUser, getUserLeaderboardRank, getWasteLogsByUser, _mapPointHistory, _mapWasteLog, _parseIdDate (+4 more)

### Community 90 - "ai_detection_entity.dart"
Cohesion: 0.15
Nodes (12): AiDetectionStatus, confidence, detectedType, estimatedPoints, isBlurry, organicPercentage, props, requestId (+4 more)

### Community 91 - "bin_reset_entity.dart"
Cohesion: 0.17
Nodes (12): binId, BinResetStatus, BinResetStatusExtension, createdAt, evidencePhotoUrl, id, props, rejectReason (+4 more)

### Community 92 - "Monitoring.tsx"
Cohesion: 0.23
Nodes (10): createBinIcon(), createFacilityIcon(), createRwIcon(), FacilityItem, KPIStats, Monitoring(), TrendWeek, Bin (+2 more)

### Community 93 - "qc-test.ts"
Cohesion: 0.26
Nodes (7): prisma, runQC(), PolygonService, prisma, convexHull(), isPointInPolygon(), Point

### Community 94 - "transactionRoutes.ts"
Cohesion: 0.20
Nodes (4): transactionController, router, prisma, TransactionService

### Community 95 - "jwtUtils.ts"
Cohesion: 0.26
Nodes (7): Request, mockFindUnique, mockUserFindUnique, readOnlyGuard(), router, TokenPayload, verifyAccessToken()

### Community 96 - "waste_log_entity.dart"
Cohesion: 0.17
Nodes (11): binId, binQrSerial, createdAt, id, kelurahan, pointsAwarded, props, userId (+3 more)

### Community 97 - "wWinMain"
Cohesion: 0.24
Nodes (9): wWinMain(), string, wchar_t, CreateAndAttachConsole(), GetCommandLineArguments(), Utf8FromUtf16(), _In_, _In_opt_ (+1 more)

### Community 98 - "plugins"
Cohesion: 0.18
Nodes (10): typescript, plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, typescript, oxc (+2 more)

### Community 99 - "categoryRoutes.ts"
Cohesion: 0.22
Nodes (4): categoryController, router, CategoryService, prisma

### Community 101 - "platform_utils.dart"
Cohesion: 0.18
Nodes (10): isDesktop, isMobile, isWeb, PlatformUtils, supportsCamera, supportsFcm, supportsGps, supportsNativeQrScanner (+2 more)

### Community 102 - "notification_entity.dart"
Cohesion: 0.18
Nodes (10): copyWith, desc, icon, id, isRead, props, time, title (+2 more)

### Community 103 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, prefer_related_applications, short_name (+2 more)

### Community 104 - "configService.ts"
Cohesion: 0.27
Nodes (4): AiRepository, prisma, prisma, prisma

### Community 106 - "notificationIntegrationService.ts"
Cohesion: 0.24
Nodes (4): notificationIntegrationService, prisma, prisma, rwService

### Community 107 - "batch2.test.ts"
Cohesion: 0.20
Nodes (8): mockCount, mockCreate, mockFindFirst, mockFindMany, mockFindUnique, mockQueryRaw, mockUpdate, prisma

### Community 109 - "point_history_entity.dart"
Cohesion: 0.20
Nodes (9): WasteType, createdAt, description, id, points, props, userId, wasteType (+1 more)

### Community 110 - "MessageHandler"
Cohesion: 0.36
Nodes (10): HWND, LPARAM, LRESULT, UINT, WPARAM, EnableFullDpiSupportIfAvailable(), GetHandle, GetThisFromHandle (+2 more)

### Community 111 - "BM25"
Cohesion: 0.28
Nodes (5): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query

### Community 112 - "seed-demo-100.ts"
Cohesion: 0.31
Nodes (8): FIRST_NAMES, getRandomElement(), getRandomVolume(), getRandomWeight(), LAST_NAMES, main(), prisma, STREET_NAMES

### Community 114 - "safe_storage.dart"
Cohesion: 0.22
Nodes (8): delete, read, SafeStorage, _secureStorage, write, package:flutter_secure_storage/flutter_secure_storage.dart, package:shared_preferences/shared_preferences.dart, static const

### Community 115 - "waste_log_repository.dart"
Cohesion: 0.22
Nodes (8): ApiWasteLogRepository, getPointHistoryByUser, getTotalPointsByUser, getUserLeaderboardRank, getWasteLogsByUser, WasteLogRepository, ../entities/point_history_entity.dart, ../entities/waste_log_entity.dart

### Community 116 - "notification_repository.dart"
Cohesion: 0.22
Nodes (8): code, getNotifications, markAllAsRead, markAsRead, message, registerDeviceToken, toString, ../entities/notification_entity.dart

### Community 117 - "ManajemenLokasi.tsx"
Cohesion: 0.33
Nodes (5): createHouseIcon(), createMapBinIcon(), createRwZonaIcon(), generateHexagon(), ManajemenLokasi()

### Community 118 - "MonitoringAbsen.tsx"
Cohesion: 0.31
Nodes (7): AttendanceRecord, createActivityMarkerIcon(), createStudentIcon(), LocationPickerMap(), MonitoringAbsen(), ScheduleActivity, StudentLoc

### Community 121 - "api/src/services/authService.ts"
Cohesion: 0.32
Nodes (3): prisma, prisma, DatabaseUnavailableError

### Community 123 - "Equatable"
Cohesion: 0.25
Nodes (8): AiDetectionEntity, BinEntity, BinResetEntity, NotificationEntity, PointHistoryEntity, UserEntity, WasteLogEntity, Equatable

### Community 124 - "apiClientProvider"
Cohesion: 0.25
Nodes (8): _fetchSchedules, _fetchMonitoringData, _loadAreas, _submitLog, _fetchTargetLocation, _performLocationUpdate, recordAttendance, apiClientProvider

### Community 125 - "CustomIcons.tsx"
Cohesion: 0.46
Nodes (6): BankSampahIcon(), BataTerawangIcon(), LosedaIcon(), RumahMaggotIcon(), TongNonOrganikIcon(), TongOrganikIcon()

### Community 126 - "useMasterDataStore.ts"
Cohesion: 0.32
Nodes (5): MasterData(), BinItem, MasterDataState, useMasterDataStore, UserItem

### Community 127 - "adminMahasiswaRoutes.ts"
Cohesion: 0.38
Nodes (4): adminMahasiswaController, router, adminMahasiswaService, prisma

### Community 130 - "scheduleRoutes.ts"
Cohesion: 0.38
Nodes (4): scheduleController, router, prisma, scheduleService

### Community 131 - "StateNotifier"
Cohesion: 0.29
Nodes (7): AuthNotifier, ResetBinNotifier, ResetBinState, ScanFlowNotifier, ScanFlowState, AuthState, StateNotifier

### Community 132 - "_generate_intelligent_overrides"
Cohesion: 0.33
Nodes (6): _detect_page_type(), format_page_override_md(), _generate_intelligent_overrides(), Format a page-specific override file with intelligent AI-generated content., Generate intelligent overrides based on page type using layered search. Uses…, Detect page type from context and search results.

### Community 133 - "package:flutter/services.dart"
Cohesion: 0.33
Nodes (5): AppTheme, ../constants/app_colors.dart, ../constants/app_dimensions.dart, package:flutter/services.dart, package:google_fonts/google_fonts.dart

### Community 134 - "NotifikasiScreen"
Cohesion: 0.40
Nodes (6): build, NotifikasiScreen, markReadProvider, notificationsProvider, OfflineBanner, ConsumerWidget

### Community 135 - "dashboardService.ts"
Cohesion: 0.50
Nodes (3): dashboardController, dashboardService, prisma

### Community 137 - "kknAttendanceRoutes.ts"
Cohesion: 0.40
Nodes (3): kknAttendanceServiceInstance, lastRequestMap, router

### Community 138 - "package:dio/dio.dart"
Cohesion: 0.40
Nodes (4): mapDioExceptionToMessage, message, toString, package:dio/dio.dart

### Community 139 - "Exception"
Cohesion: 0.40
Nodes (5): AppNetworkException, AuthException, BinException, NotificationException, Exception

### Community 140 - "widget_test.dart"
Cohesion: 0.40
Nodes (4): main, package:flutter_test/flutter_test.dart, package:mobile_app_sampah/config/app_config.dart, package:mobile_app_sampah/core/utils/platform_utils.dart

### Community 141 - "fix-schema.js"
Cohesion: 0.40
Nodes (4): content, fs, path, schemaPath

### Community 142 - "filter_migration.cjs"
Cohesion: 0.40
Nodes (4): filtered, fs, lines, sql

### Community 143 - "run_rename.cjs"
Cohesion: 0.40
Nodes (3): fs, prisma, { PrismaClient }

### Community 144 - "seed-demo.js"
Cohesion: 0.40
Nodes (3): bcrypt, prisma, { PrismaClient }

### Community 145 - "update-schema.js"
Cohesion: 0.40
Nodes (4): content, fs, path, schemaPath

### Community 146 - "update-schema-2.js"
Cohesion: 0.40
Nodes (4): content, fs, path, schemaPath

### Community 147 - "update-schema-3.js"
Cohesion: 0.40
Nodes (4): content, fs, path, schemaPath

### Community 149 - "get-dashboard-component.ts"
Cohesion: 0.50
Nodes (3): content, dashboardLines, lines

### Community 150 - "remove-unused.ts"
Cohesion: 0.50
Nodes (3): monContent, monFile, toRemove

### Community 153 - "seed-phones-and-data.ts"
Cohesion: 0.67
Nodes (3): generateRandomPhone(), prisma, seed()

### Community 154 - "@types/node"
Cohesion: 0.67
Nodes (3): @types/node, @types/node, @types/node

## Knowledge Gaps
- **1221 isolated node(s):** `name`, `version`, `description`, `author`, `license` (+1216 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ScanResult` connect `bin_repository.dart` to `bin_provider.dart`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `plugins`, `useAuthStore`, `api`, `ManajemenLokasi.tsx`, `MonitoringAbsen.tsx`, `services/api.ts`, `Monitoring.tsx`, `Leaderboard.tsx`, `useMasterDataStore.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `plugins`, `dependencies`, `@types/ws`, `eslint-plugin-prettier`, `ssh2`, `@types/bcryptjs`, `@types/cookie-parser`, `@types/multer`, `@types/swagger-jsdoc`, `@types/uuid`, `@types/node`, `@typescript-eslint/parser`, `vitest`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _1221 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app_strings.dart` be split into smaller, more focused modules?**
  _Cohesion score 0.02857142857142857 - nodes in this community are weakly interconnected._
- **Should `poin_screen.dart` be split into smaller, more focused modules?**
  _Cohesion score 0.04090909090909091 - nodes in this community are weakly interconnected._
- **Should `beranda_screen.dart` be split into smaller, more focused modules?**
  _Cohesion score 0.0496156533892383 - nodes in this community are weakly interconnected._