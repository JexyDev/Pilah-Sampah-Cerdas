async function run() {
  const baseURL = "http://localhost:3000/api/v1";
  const headers = {
    Authorization: "Bearer MOCK_TOKEN_ADMIN",
    "Content-Type": "application/json",
  };

  try {
    console.log("Checking Social Feed...");
    const feedRes = await fetch(`${baseURL}/system/social-feed`, { headers });
    const feedData = await feedRes.json();
    console.log("Recent Feed entries:", JSON.stringify(feedData.data?.slice(0, 3), null, 2));
  } catch (e: any) {
    console.error("Test failed:", e.message);
  }
}

run();
