import axios from "axios";

async function testLogin() {
  try {
    console.log("Sending POST to http://localhost:3000/api/v1/auth/login with credentials...");
    const response = await axios.post("http://localhost:3000/api/v1/auth/login", {
      email: "warga@psc.id",
      password: "password123"
    });
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    if (error.response) {
      console.log("Error Status:", error.response.status);
      console.log("Error Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Network / Other Error:", error.message);
    }
  }
}

testLogin();
