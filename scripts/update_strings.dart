// ignore_for_file: avoid_print
import 'dart:io';

void main() {
  final dir = Directory('d:/TrashCare/mobile/lib');
  final files = dir.listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));
  
  for (final file in files) {
    String content = file.readAsStringSync();
    
    bool changed = false;
    
    if (content.contains('Tong Sampah')) {
      content = content.replaceAll('Tong Sampah', 'Tempat Sampah');
      changed = true;
    }
    if (content.contains('tong sampah')) {
      content = content.replaceAll('tong sampah', 'tempat sampah');
      changed = true;
    }
    
    // Replace "Tong" directly if it's standalone, but carefully. 
    // E.g. "Tong" or "tong"
    if (content.contains('Tong ')) {
      content = content.replaceAll('Tong ', 'Tempat Sampah ');
      changed = true;
    }
    if (content.contains('tong ')) {
      content = content.replaceAll('tong ', 'tempat sampah ');
      changed = true;
    }

    if (content.contains('Tong.')) {
      content = content.replaceAll('Tong.', 'Tempat Sampah.');
      changed = true;
    }
    if (content.contains('tong.')) {
      content = content.replaceAll('tong.', 'tempat sampah.');
      changed = true;
    }

    if (content.contains('Tong,')) {
      content = content.replaceAll('Tong,', 'Tempat Sampah,');
      changed = true;
    }
    if (content.contains('tong,')) {
      content = content.replaceAll('tong,', 'tempat sampah,');
      changed = true;
    }

    if (changed) {
      file.writeAsStringSync(content);
      print('Updated ${file.path}');
    }
  }
}
