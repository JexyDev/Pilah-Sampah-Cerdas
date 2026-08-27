# Flutter core & plugins
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Flutter Deferred Components & Play Store Split Install (Fix R8 missing classes)
-dontwarn com.google.android.play.core.**
-dontwarn io.flutter.embedding.engine.deferredcomponents.**
-dontwarn io.flutter.embedding.android.FlutterPlayStoreSplitApplication

# ML Kit & Mobile Scanner
-keep class com.google.mlkit.** { *; }
-keep class dev.steenbakker.mobile_scanner.** { *; }
-keep class androidx.camera.** { *; }
-dontwarn com.google.mlkit.**
-dontwarn dev.steenbakker.mobile_scanner.**
-dontwarn androidx.camera.**

# Foreground Task & Notifications
-keep class com.pravera.flutter_foreground_task.** { *; }
-keep class com.dexterous.flutterlocalnotifications.** { *; }
-dontwarn com.pravera.flutter_foreground_task.**
-dontwarn com.dexterous.flutterlocalnotifications.**

# General Attributes
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable

