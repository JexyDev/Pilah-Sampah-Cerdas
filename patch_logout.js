const fs = require('fs');
let code = fs.readFileSync('lib/app/data/repositories/api_auth_repository.dart', 'utf8');

if (!code.includes('import \'package:shared_preferences/shared_preferences.dart\';')) {
  code = "import 'package:shared_preferences/shared_preferences.dart';\n" + code;
}

code = code.replace(
  /secureStorage\.delete\(key: AppConfig\.householdIdKey\),\n\s*\]\);\n\s*\}\n\s*\}/g,
  `secureStorage.delete(key: AppConfig.householdIdKey),\n      ]);\n      final prefs = await SharedPreferences.getInstance();\n      await prefs.clear();\n    }\n  }`
);

fs.writeFileSync('lib/app/data/repositories/api_auth_repository.dart', code);
