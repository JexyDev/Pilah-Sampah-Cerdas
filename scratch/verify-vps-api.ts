async function run() {
  const baseURL = "http://157.10.252.252:3000/api/v1";
  
  try {
    console.log("Testing VPS Login for Super Admin...");
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+628111111111",
        password: "password123"
      })
    });
    
    console.log("Login HTTP Status:", loginRes.status);
    const loginData = await loginRes.json();
    if (loginData.success) {
      console.log("LOGIN SUCCESS! Token received:", loginData.data?.token ? "YES" : "NO");
      
      const token = loginData.data.token;
      console.log("Testing VPS /categories fetching...");
      const catRes = await fetch(`${baseURL}/categories`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const catData = await catRes.json();
      console.log("Categories Status:", catRes.status, "Count:", catData.data?.length);
      
      console.log("Testing VPS /super-admin/bins/qr-master fetching...");
      const qrRes = await fetch(`${baseURL}/super-admin/bins/qr-master`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const qrData = await qrRes.json();
      console.log("QR Master Status:", qrRes.status, "Count:", qrData.data?.length);
    } else {
      console.error("LOGIN FAILED:", loginData.message);
    }
  } catch (e: any) {
    console.error("API request failed:", e.message);
  }
}

run();
