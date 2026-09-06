import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> main() async {
  final baseUrl = 'http://157.10.252.252:3000/api/v1';
  final Map<String, String> headers = {'Content-Type': 'application/json'};

  Future<void> checkEndpoint(String method, String url, {Map<String, dynamic>? body}) async {
    print('Testing $method $url');
    try {
      http.Response response;
      if (method == 'GET') {
        response = await http.get(Uri.parse(url), headers: headers);
      } else {
        response = await http.post(Uri.parse(url), headers: headers, body: jsonEncode(body ?? {}));
      }
  ￼
All accounts
￼
hourglass_top
Expiring first
￼
block
Turn off Empty
￼
check_circle
Turn on Available
￼
toggle_on
Auto-refresh
(34s)
￼
refresh
    
      print('Status: ${response.statusCode}');
      String bodyString = response.body;
      if (bodyString.length > 500) {
        print('Response Body: ${bodyString.substring(0, 500)}... [TRUNCATED]');
      } else {
        print('Response Body: $bodyString');
      }
    } catch (e) {
      print('Error: $e');
    }
    print('-' * 40);
  }

  // 1. Dashboard
  await checkEndpoint('GET', '$baseUrl/kkn/dashboard');

  // 2. Warga Dampingan
  await checkEndpoint('GET', '$baseUrl/kkn/warga-dampingan');

  // 3. Warga (Unactivated)
  await checkEndpoint('GET', '$baseUrl/kkn/warga?status=UNACTIVATED');

  // 4. Activate Bin
  await checkEndpoint('POST', '$baseUrl/kkn/warga/activate-bin', body: {
    "wargaId": "dummy_id",
    "binOrganikId": "dummy_organik",
    "binAnorganikId": "dummy_anorganik"
  });

  // 5. Location Ping
  await checkEndpoint('POST', '$baseUrl/kkn/location-ping', body: {
    "latitude": -6.123456,
    "longitude": 106.123456
  });
}
