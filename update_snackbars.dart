// ignore_for_file: avoid_print
import 'dart:io';

void main() {
  final dir = Directory('d:/TrashCare/mobile/lib');
  final files = dir.listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));
  
  for (final file in files) {
    String content = file.readAsStringSync();
    
    bool changed = false;
    
    // 1. Remove any previously added inline hideCurrentSnackBar to prevent duplicates
    if (content.contains('ScaffoldMessenger.of(context).hideCurrentSnackBar(); ScaffoldMessenger.of(context).showSnackBar(')) {
        content = content.replaceAll('ScaffoldMessenger.of(context).hideCurrentSnackBar(); ScaffoldMessenger.of(context).showSnackBar(', 'ScaffoldMessenger.of(context).showSnackBar(');
    }
    // Also handle newline ones that might have been added
    if (content.contains('ScaffoldMessenger.of(context).hideCurrentSnackBar();\n    ScaffoldMessenger.of(context).showSnackBar(')) {
        content = content.replaceAll('ScaffoldMessenger.of(context).hideCurrentSnackBar();\n    ScaffoldMessenger.of(context).showSnackBar(', 'ScaffoldMessenger.of(context).showSnackBar(');
    }
    
    // 2. Add it uniformly
    if (content.contains('ScaffoldMessenger.of(context).showSnackBar(')) {
        content = content.replaceAll('ScaffoldMessenger.of(context).showSnackBar(', 'ScaffoldMessenger.of(context).hideCurrentSnackBar(); ScaffoldMessenger.of(context).showSnackBar(');
        changed = true;
    }
    
    // Check for context! variant just in case
    if (content.contains('ScaffoldMessenger.of(context!).hideCurrentSnackBar(); ScaffoldMessenger.of(context!).showSnackBar(')) {
        content = content.replaceAll('ScaffoldMessenger.of(context!).hideCurrentSnackBar(); ScaffoldMessenger.of(context!).showSnackBar(', 'ScaffoldMessenger.of(context!).showSnackBar(');
    }
    
    if (content.contains('ScaffoldMessenger.of(context!).showSnackBar(')) {
        content = content.replaceAll('ScaffoldMessenger.of(context!).showSnackBar(', 'ScaffoldMessenger.of(context!).hideCurrentSnackBar(); ScaffoldMessenger.of(context!).showSnackBar(');
        changed = true;
    }

    if (changed) {
      file.writeAsStringSync(content);
      print('Updated snackbar spam protection in ${file.path}');
    }
  }
}
