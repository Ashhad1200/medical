const { sequelize } = require("../config/database");
const User = require("../models/User");
const Medicine = require("../models/Medicine");
const Order = require("../models/Order");
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");

const seedAll = async () => {
  try {
    console.log("🌱 Starting full data seeding...");

    // Connect to database (without sync)
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Clear existing data (but not users)
    console.log(
      "🗑️  Clearing existing medicines, orders, suppliers, and purchase orders..."
    );
    await PurchaseOrder.destroy({ where: {}, truncate: true, cascade: false });
    await Order.destroy({ where: {}, truncate: true, cascade: false });
    await Medicine.destroy({ where: {}, truncate: true, cascade: false });
    await Supplier.destroy({ where: {}, truncate: true, cascade: false });

    // Get admin user for creating data
    const adminUser = await User.findOne({ where: { username: "admin" } });
    if (!adminUser) {
      console.error("❌ Admin user not found. Please run seed-users.js first.");
      process.exit(1);
    }

    // Create suppliers
    console.log("🏢 Creating suppliers...");
    const suppliersData = [
      {
        name: "MediCorp Pharmaceuticals",
        contactName: "John Smith",
        phone: "+1-555-0101",
        email: "orders@medicorp.com",
        address: "123 Pharma Street, Medical City, MC 12345",
        notes: "Primary pharmaceutical supplier",
        createdBy: adminUser.id,
      },
      {
        name: "HealthSupply Inc",
        contactName: "Sarah Johnson",
        phone: "+1-555-0102",
        email: "supply@healthsupply.com",
        address: "456 Health Ave, Wellness Town, WT 67890",
        notes: "Secondary supplier for generic medicines",
        createdBy: adminUser.id,
      },
    ];

    const createdSuppliers = await Supplier.bulkCreate(suppliersData);
    console.log(`✅ Created ${createdSuppliers.length} suppliers`);

    // Create medicines
    console.log("💊 Creating medicines...");
    const medicinesData = [
      {
        name: "Paracetamol 500mg",
        manufacturer: "Pharma Corp",
        batchNumber: "PC001",
        retailPrice: 12.5,
        tradePrice: 8.0,
        gstPerUnit: 1.5,
        quantity: 100,
        expiryDate: new Date("2026-12-31"),
        category: "Analgesic",
        description: "Pain relief and fever reducer",
        reorderThreshold: 20,
      },
      {
        name: "Amoxicillin 250mg",
        manufacturer: "Bio Labs",
        batchNumber: "BL002",
        retailPrice: 25.0,
        tradePrice: 18.0,
        gstPerUnit: 2.25,
        quantity: 50,
        expiryDate: new Date("2025-08-15"),
        category: "Antibiotic",
        description: "Antibiotic for bacterial infections",
        reorderThreshold: 15,
      },
      {
        name: "Vitamin C 1000mg",
        manufacturer: "Health Plus",
        batchNumber: "HP003",
        retailPrice: 8.75,
        tradePrice: 5.5,
        gstPerUnit: 0.75,
        quantity: 200,
        expiryDate: new Date("2027-03-20"),
        category: "Vitamin",
        description: "Immune system support",
        reorderThreshold: 50,
      },
      {
        name: "Ibuprofen 400mg",
        manufacturer: "Med Solutions",
        batchNumber: "MS004",
        retailPrice: 15.0,
        tradePrice: 10.0,
        gstPerUnit: 1.8,
        quantity: 75,
        expiryDate: new Date("2026-06-30"),
        category: "Analgesic",
        description: "Anti-inflammatory pain reliever",
        reorderThreshold: 25,
      },
      {
        name: "Cough Syrup",
        manufacturer: "Remedy Inc",
        batchNumber: "RI005",
        retailPrice: 22.0,
        tradePrice: 15.0,
        gstPerUnit: 2.0,
        quantity: 30,
        expiryDate: new Date("2025-12-31"),
        category: "Cough & Cold",
        description: "Relief from cough and cold symptoms",
        reorderThreshold: 10,
      },
    ];

    const createdMedicines = await Medicine.bulkCreate(medicinesData);
    console.log(`✅ Created ${createdMedicines.length} medicines`);

    // Create purchase orders
    console.log("📦 Creating purchase orders...");
    const purchaseOrdersData = [
      {
        supplierId: createdSuppliers[0].id,
        items: [
          {
            medicineId: createdMedicines[0].id,
            name: createdMedicines[0].name,
            manufacturer: createdMedicines[0].manufacturer,
            quantity: 100,
            tradePrice: 8.0,
            notes: "Regular stock replenishment",
          },
          {
            medicineId: createdMedicines[1].id,
            name: createdMedicines[1].name,
            manufacturer: createdMedicines[1].manufacturer,
            quantity: 50,
            tradePrice: 18.0,
            notes: "Antibiotic stock",
          },
        ],
        expectedDate: new Date("2025-06-15"),
        total: 1700.0, // (100 * 8.00) + (50 * 18.00)
        status: "pending",
        notes: "Monthly stock replenishment order",
        createdBy: adminUser.id,
      },
    ];

    const createdPurchaseOrders = await PurchaseOrder.bulkCreate(
      purchaseOrdersData
    );
    console.log(`✅ Created ${createdPurchaseOrders.length} purchase orders`);

    // Create sample orders (same as before)
    console.log("📋 Creating sample orders...");
    const ordersData = [
      {
        customerName: "John Doe",
        items: [
          { medicineId: createdMedicines[0].id, qty: 2, discountPct: 0 },
          { medicineId: createdMedicines[2].id, qty: 1, discountPct: 10 },
        ],
        taxPercent: 5,
        createdBy: adminUser.id,
      },
      {
        customerName: "Jane Smith",
        items: [{ medicineId: createdMedicines[1].id, qty: 1, discountPct: 5 }],
        taxPercent: 0,
        createdBy: adminUser.id,
      },
      {
        customerName: "Walk-in Customer Seeded",
        items: [
          { medicineId: createdMedicines[2].id, qty: 3, discountPct: 0 },
          { medicineId: createdMedicines[0].id, qty: 1, discountPct: 0 },
        ],
        taxPercent: 12,
        createdBy: adminUser.id,
      },
    ];

    // Manually calculate and create orders for direct DB seeding
    const finalOrdersToCreate = [];
    for (const orderInput of ordersData) {
      let calculatedSubtotal = 0;
      let calculatedTotalProfit = 0;
      const orderItemsDetails = [];

      for (const item of orderInput.items) {
        const medicine = createdMedicines.find((m) => m.id === item.medicineId);
        const unitPrice = parseFloat(medicine.retailPrice);
        const tradePrice = parseFloat(medicine.tradePrice);
        const discountPercentage = parseFloat(item.discountPct || 0);
        const quantity = parseInt(item.qty, 10);

        const itemSubtotalBeforeDiscount = unitPrice * quantity;
        const itemDiscountAmount =
          (itemSubtotalBeforeDiscount * discountPercentage) / 100;
        const itemSubtotalAfterDiscount =
          itemSubtotalBeforeDiscount - itemDiscountAmount;
        const itemGstAmount = parseFloat(medicine.gstPerUnit || 0) * quantity;
        const itemTotal = itemSubtotalAfterDiscount + itemGstAmount;

        calculatedSubtotal += itemTotal;
        const itemProfit =
          (unitPrice - itemDiscountAmount / quantity - tradePrice) * quantity;
        calculatedTotalProfit += itemProfit;

        orderItemsDetails.push({
          medicineId: medicine.id,
          name: medicine.name,
          qty: quantity,
          unitPrice: unitPrice,
          discountPct: discountPercentage,
          discountAmount: itemDiscountAmount,
          gstAmount: itemGstAmount,
          itemTotal: itemTotal,
          tradePrice: tradePrice,
        });
      }

      const calculatedTaxAmount =
        (calculatedSubtotal * parseFloat(orderInput.taxPercent)) / 100;
      const calculatedTotal = calculatedSubtotal + calculatedTaxAmount;

      finalOrdersToCreate.push({
        ...orderInput,
        items: orderItemsDetails,
        subtotal: calculatedSubtotal,
        taxAmount: calculatedTaxAmount,
        total: calculatedTotal,
        profit: calculatedTotalProfit,
        status: "completed",
      });
    }

    const createdOrders = await Order.bulkCreate(finalOrdersToCreate);
    console.log(`✅ Created ${createdOrders.length} orders`);

    console.log("\n🎉 Full data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Users: ${await User.count()}`);
    console.log(`   Suppliers: ${await Supplier.count()}`);
    console.log(`   Medicines: ${await Medicine.count()}`);
    console.log(`   Purchase Orders: ${await PurchaseOrder.count()}`);
    console.log(`   Orders: ${await Order.count()}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    console.error(error);
    process.exit(1);
  }
};

seedAll();
