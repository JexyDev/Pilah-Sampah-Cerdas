async function testLogin() {
  try {
    console.log("Sending POST to http://localhost:3000/api/v1/auth/login with credentials...");
    const response = await fetch("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "warga@psc.id",
        password: "password123"
      })
    });
    console.log("Response Status:", response.status);
    const data = await response.json();
    console.log("Response Data:", JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error("Network / Other Error:", error.message);
  }
}

testLogin();
