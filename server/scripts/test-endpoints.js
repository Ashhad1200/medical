const axios = require("axios");

const BASE_URL = "http://localhost:3001/api";
let adminToken;
let headers;

const login = async () => {
  console.log("\n--- AUTHENTICATION ---");
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: "admin",
      password: "admin123",
    });
    adminToken = loginResponse.data.data.token;
    headers = {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    };
    console.log("✅ Admin login successful");
  } catch (error) {
    console.error(
      "❌ Admin login failed:",
      error.response?.data || error.message
    );
    process.exit(1);
  }
};

const testMedicineEndpoints = async () => {
  console.log("\n--- MEDICINE ENDPOINTS ---");
  let newMedicineId;
  try {
    // 1. Get all medicines
    console.log("1. Testing GET /medicines (list all)...");
    const listResponse = await axios.get(`${BASE_URL}/medicines`, { headers });
    console.log(
      `✅ GET /medicines successful. Found ${listResponse.data.data.medicines.length} medicines.`
    );
    const initialMedicines = listResponse.data.data.medicines;
    if (initialMedicines.length === 0) {
      console.warn(
        "⚠️ No initial medicines found. Some order tests might be limited."
      );
    }

    // 2. Search medicines
    console.log("2. Testing GET /medicines?term=paracetamol (search)...");
    const searchResponse = await axios.get(
      `${BASE_URL}/medicines?term=paracetamol`,
      { headers }
    );
    console.log(
      `✅ GET /medicines?term=paracetamol successful. Found ${searchResponse.data.data.medicines.length} results.`
    );

    // 3. Create new medicine
    console.log("3. Testing POST /medicines (create)...");
    const medicinePayload = {
      name: "TestMedX 100mg",
      manufacturer: "Test Pharma",
      batchNumber: "TMX001",
      retailPrice: 20.0,
      tradePrice: 15.0,
      gstPerUnit: 1.5,
      quantity: 150,
      expiryDate: new Date("2027-12-31").toISOString(),
      category: "TestCategory",
      description: "A test medicine for API testing",
      reorderThreshold: 25,
    };
    const createResponse = await axios.post(
      `${BASE_URL}/medicines`,
      medicinePayload,
      { headers }
    );
    newMedicineId = createResponse.data.data.medicine.id;
    console.log(
      `✅ POST /medicines successful. Created medicine ID: ${newMedicineId}`
    );

    // 4. Get created medicine by ID
    console.log(`4. Testing GET /medicines/${newMedicineId} (get created)...`);
    const getByIdResponse = await axios.get(
      `${BASE_URL}/medicines/${newMedicineId}`,
      { headers }
    );
    console.log(
      "✅ GET /medicines/:id successful:",
      JSON.stringify(getByIdResponse.data.data.medicine, null, 2)
    );

    // 5. Update created medicine
    console.log(
      `5. Testing PUT /medicines/${newMedicineId} (update created)...`
    );
    const updatedPayload = {
      ...medicinePayload,
      quantity: 175,
      description: "Updated description",
    };
    const updateResponse = await axios.put(
      `${BASE_URL}/medicines/${newMedicineId}`,
      updatedPayload,
      { headers }
    );
    console.log(
      "✅ PUT /medicines/:id successful:",
      JSON.stringify(updateResponse.data.data.medicine, null, 2)
    );
  } catch (error) {
    console.error(
      "❌ Error in medicine endpoints:",
      error.response?.data || error.message,
      error.config?.url
    );
    process.exit(1);
  } finally {
    // 6. Delete created medicine (cleanup)
    if (newMedicineId) {
      console.log(
        `6. Testing DELETE /medicines/${newMedicineId} (delete created for cleanup)...`
      );
      try {
        await axios.delete(`${BASE_URL}/medicines/${newMedicineId}`, {
          headers,
        });
        console.log(
          `✅ DELETE /medicines/:id successful. Cleaned up medicine ID: ${newMedicineId}`
        );
      } catch (delError) {
        console.error(
          `❌ Error deleting medicine ${newMedicineId}:`,
          delError.response?.data || delError.message
        );
      }
    }
  }
};

const testOrderEndpoints = async () => {
  console.log("\n--- ORDER ENDPOINTS ---");
  let firstMedicineIdForOrder;
  let newOrderId;

  try {
    // Get a medicine ID to use in the order
    const medResponse = await axios.get(`${BASE_URL}/medicines`, { headers });
    if (medResponse.data.data.medicines.length > 0) {
      firstMedicineIdForOrder = medResponse.data.data.medicines[0].id;
      console.log(
        `ℹ️ Using medicine ID ${firstMedicineIdForOrder} for creating order.`
      );
    } else {
      console.error(
        "❌ Cannot run order tests: No medicines available to add to order."
      );
      return; // Skip order tests if no medicines
    }

    // 1. Create new order
    console.log("1. Testing POST /orders (create)...");
    const orderPayload = {
      customerName: "Test Customer API",
      items: [
        { medicineId: firstMedicineIdForOrder, qty: 2, discountPct: 5 },
        // Add another item if more medicines are guaranteed to exist or handle dynamically
      ],
      taxPercent: 10,
    };
    const createOrderResponse = await axios.post(
      `${BASE_URL}/orders`,
      orderPayload,
      { headers }
    );
    newOrderId = createOrderResponse.data.data.order.id;
    console.log(
      `✅ POST /orders successful. Created order ID: ${newOrderId}. Details:`,
      JSON.stringify(createOrderResponse.data.data.order, null, 2)
    );

    // 2. Get all orders
    console.log("2. Testing GET /orders (list all)...");
    const listOrdersResponse = await axios.get(`${BASE_URL}/orders`, {
      headers,
    });
    console.log(
      `✅ GET /orders successful. Found ${listOrdersResponse.data.data.orders.length} orders.`
    );

    // 3. Get orders with date filter (10 AM - 2 AM next day)
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    console.log(
      `3. Testing GET /orders?date=${today} (date filter 10AM-2AM)...`
    );
    const dateFilterResponse = await axios.get(
      `${BASE_URL}/orders?date=${today}`,
      { headers }
    );
    console.log(
      `✅ GET /orders?date=${today} successful. Found ${dateFilterResponse.data.data.orders.length} orders. (Note: Verify time range manually if needed)`
    );

    // 4. Get created order by ID
    console.log(`4. Testing GET /orders/${newOrderId} (get created)...`);
    const getOrderByIdResponse = await axios.get(
      `${BASE_URL}/orders/${newOrderId}`,
      { headers }
    );
    console.log(
      "✅ GET /orders/:id successful:",
      JSON.stringify(getOrderByIdResponse.data.data, null, 2)
    );

    // 5. Get order PDF (placeholder)
    console.log(`5. Testing GET /orders/${newOrderId}/pdf (get PDF)...`);
    const pdfResponse = await axios.get(
      `${BASE_URL}/orders/${newOrderId}/pdf`,
      { headers, responseType: "arraybuffer" }
    );
    if (
      pdfResponse.status === 200 &&
      pdfResponse.headers["content-type"] === "application/pdf"
    ) {
      console.log(
        "✅ GET /orders/:id/pdf successful (received PDF content type)."
      );
    } else {
      console.warn(
        "⚠️ GET /orders/:id/pdf did not return PDF content type or status 200.",
        pdfResponse.status,
        pdfResponse.headers["content-type"]
      );
    }
  } catch (error) {
    console.error(
      "❌ Error in order endpoints:",
      error.response?.data || error.message,
      error.config?.url
    );
    if (error.response?.data?.error)
      console.error("Server error details:", error.response.data.error);
    process.exit(1);
  }
};

const testDashboardEndpoints = async () => {
  console.log("\n--- DASHBOARD ENDPOINTS ---");
  try {
    // 1. Test /dashboard/stats (from dashboard.js)
    console.log("1. Testing GET /dashboard/stats (placeholder)...");
    const statsResponse = await axios.get(`${BASE_URL}/dashboard/stats`, {
      headers,
    });
    console.log(
      "✅ GET /dashboard/stats successful:",
      JSON.stringify(statsResponse.data.data, null, 2)
    );

    // 2. Test /dashboard/activities (from dashboard.js)
    console.log("2. Testing GET /dashboard/activities (placeholder)...");
    const activitiesResponse = await axios.get(
      `${BASE_URL}/dashboard/activities`,
      { headers }
    );
    console.log(
      "✅ GET /dashboard/activities successful:",
      JSON.stringify(activitiesResponse.data.data, null, 2)
    );

    // 3. Test /orders/dashboard (main dashboard data from orderController)
    console.log("3. Testing GET /orders/dashboard (main dashboard data)...");
    const mainDashboardResponse = await axios.get(
      `${BASE_URL}/orders/dashboard`,
      { headers }
    );
    console.log(
      "✅ GET /orders/dashboard successful:",
      JSON.stringify(mainDashboardResponse.data.data, null, 2)
    );
  } catch (error) {
    console.error(
      "❌ Error in dashboard endpoints:",
      error.response?.data || error.message,
      error.config?.url
    );
    process.exit(1);
  }
};

const runAllTests = async () => {
  await login();
  await testMedicineEndpoints();
  await testOrderEndpoints();
  await testDashboardEndpoints();
  console.log(
    "\n🎉 All API endpoint tests completed successfully! (Inspect results above)"
  );
};

runAllTests();
