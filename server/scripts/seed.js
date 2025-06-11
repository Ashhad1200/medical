const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("../models/User");
const Medicine = require("../models/Medicine");
const Supplier = require("../models/Supplier");
const Order = require("../models/Order");
const PurchaseOrder = require("../models/PurchaseOrder");

// MongoDB connection
const connectDB = async () => {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb+srv://syedashhad17:BU0MDXOya910zMdR@medical.2fmd4gu.mongodb.net/?retryWrites=true&w=majority&appName=medical";

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    // Drop the entire database to remove old indexes
    await mongoose.connection.db.dropDatabase();
    console.log("🧹 Database dropped and cleared");
  } catch (error) {
    console.error("Error clearing database:", error);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const users = [
      {
        username: "admin",
        email: "admin@medicalstore.com",
        password: "admin123",
        fullName: "System Administrator",
        role: "admin",
        phone: "+1234567890",
        isActive: true,
      },
      {
        username: "counter",
        email: "counter@medicalstore.com",
        password: "counter123",
        fullName: "Counter Staff",
        role: "counter",
        phone: "+1234567891",
        isActive: true,
      },
      {
        username: "warehouse",
        email: "warehouse@medicalstore.com",
        password: "warehouse123",
        fullName: "Warehouse Manager",
        role: "warehouse",
        phone: "+1234567892",
        isActive: true,
      },
      {
        username: "counter2",
        email: "counter2@medicalstore.com",
        password: "counter123",
        fullName: "Counter Staff 2",
        role: "counter",
        phone: "+1234567893",
        isActive: true,
      },
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save(); // This triggers the pre-save middleware for password hashing
      createdUsers.push(user);
    }

    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
};

// Seed suppliers
const seedSuppliers = async (adminUser) => {
  try {
    const suppliers = [
      {
        name: "ABC Pharmaceuticals",
        contactPerson: "John Smith",
        email: "contact@abcpharma.com",
        phone: "+1-555-0101",
        address: {
          street: "123 Pharma Street",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
        },
        gstNumber: "GST123456789",
        panNumber: "ABCDE1234F",
        paymentTerms: "net_30",
        creditLimit: 500000,
        isActive: true,
        rating: 4.5,
        createdBy: adminUser._id,
      },
      {
        name: "XYZ Medical Supplies",
        contactPerson: "Jane Doe",
        email: "info@xyzmedical.com",
        phone: "+1-555-0102",
        address: {
          street: "456 Medical Ave",
          city: "Delhi",
          state: "Delhi",
          postalCode: "110001",
          country: "India",
        },
        gstNumber: "GST987654321",
        panNumber: "XYZAB9876C",
        paymentTerms: "net_60",
        creditLimit: 750000,
        isActive: true,
        rating: 4.8,
        createdBy: adminUser._id,
      },
    ];

    const createdSuppliers = await Supplier.insertMany(suppliers);
    console.log(`✅ Created ${createdSuppliers.length} suppliers`);
    return createdSuppliers;
  } catch (error) {
    console.error("Error seeding suppliers:", error);
    throw error;
  }
};

// Seed medicines
const seedMedicines = async () => {
  try {
    const medicines = [
      {
        name: "Paracetamol 500mg",
        manufacturer: "ABC Pharmaceuticals",
        batchNumber: "PARA2024001",
        retailPrice: 5.5,
        tradePrice: 4.0,
        gstPerUnit: 0.5,
        quantity: 500,
        expiryDate: new Date("2025-12-31"),
        category: "Pain Relief",
        description: "Pain and fever relief medication",
        reorderThreshold: 50,
      },
      {
        name: "Amoxicillin 250mg",
        manufacturer: "XYZ Medical",
        batchNumber: "AMOX2024001",
        retailPrice: 12.75,
        tradePrice: 9.5,
        gstPerUnit: 1.25,
        quantity: 300,
        expiryDate: new Date("2025-11-30"),
        category: "Antibiotic",
        description: "Broad-spectrum antibiotic",
        reorderThreshold: 30,
      },
      {
        name: "Cetirizine 10mg",
        manufacturer: "ABC Pharmaceuticals",
        batchNumber: "CETI2024001",
        retailPrice: 8.25,
        tradePrice: 6.0,
        gstPerUnit: 0.75,
        quantity: 200,
        expiryDate: new Date("2025-10-31"),
        category: "Antihistamine",
        description: "Allergy relief medication",
        reorderThreshold: 25,
      },
      {
        name: "Omeprazole 20mg",
        manufacturer: "XYZ Medical",
        batchNumber: "OMEP2024001",
        retailPrice: 15.0,
        tradePrice: 11.5,
        gstPerUnit: 1.5,
        quantity: 150,
        expiryDate: new Date("2025-09-30"),
        category: "Gastric",
        description: "Proton pump inhibitor for acid reflux",
        reorderThreshold: 20,
      },
      {
        name: "Aspirin 75mg",
        manufacturer: "ABC Pharmaceuticals",
        batchNumber: "ASPI2024001",
        retailPrice: 3.75,
        tradePrice: 2.5,
        gstPerUnit: 0.25,
        quantity: 800,
        expiryDate: new Date("2026-01-31"),
        category: "Cardiovascular",
        description: "Low-dose aspirin for heart health",
        reorderThreshold: 100,
      },
      {
        name: "Metformin 500mg",
        manufacturer: "XYZ Medical",
        batchNumber: "METF2024001",
        retailPrice: 6.5,
        tradePrice: 4.75,
        gstPerUnit: 0.5,
        quantity: 400,
        expiryDate: new Date("2025-08-31"),
        category: "Diabetes",
        description: "Type 2 diabetes medication",
        reorderThreshold: 40,
      },
    ];

    const createdMedicines = await Medicine.insertMany(medicines);
    console.log(`✅ Created ${createdMedicines.length} medicines`);
    return createdMedicines;
  } catch (error) {
    console.error("Error seeding medicines:", error);
    throw error;
  }
};

// Seed sample orders
const seedOrders = async (counterUser, medicines) => {
  try {
    const orderData = [
      {
        customerName: "John Customer",
        customerPhone: "+1-555-1001",
        items: [
          {
            medicineId: medicines[0]._id,
            name: medicines[0].name,
            manufacturer: medicines[0].manufacturer,
            quantity: 2,
            retailPrice: medicines[0].retailPrice,
            tradePrice: medicines[0].tradePrice,
            discount: 5,
            discountAmount: 0.55,
            totalPrice: 10.45,
            profit: 2.45,
          },
          {
            medicineId: medicines[1]._id,
            name: medicines[1].name,
            manufacturer: medicines[1].manufacturer,
            quantity: 1,
            retailPrice: medicines[1].retailPrice,
            tradePrice: medicines[1].tradePrice,
            discount: 0,
            discountAmount: 0,
            totalPrice: 12.75,
            profit: 3.25,
          },
        ],
        subtotal: 23.2,
        taxPercent: 5,
        taxAmount: 1.16,
        total: 24.36,
        profit: 5.7,
        status: "completed",
        paymentMethod: "cash",
        createdBy: counterUser._id,
      },
      {
        customerName: "Jane Customer",
        customerPhone: "+1-555-1002",
        items: [
          {
            medicineId: medicines[2]._id,
            name: medicines[2].name,
            manufacturer: medicines[2].manufacturer,
            quantity: 3,
            retailPrice: medicines[2].retailPrice,
            tradePrice: medicines[2].tradePrice,
            discount: 0,
            discountAmount: 0,
            totalPrice: 24.75,
            profit: 6.75,
          },
        ],
        subtotal: 24.75,
        taxPercent: 5,
        taxAmount: 1.24,
        total: 25.99,
        profit: 6.75,
        status: "completed",
        paymentMethod: "card",
        createdBy: counterUser._id,
      },
    ];

    const createdOrders = [];
    for (const data of orderData) {
      const order = new Order(data);
      await order.save();
      createdOrders.push(order);
    }

    console.log(`✅ Created ${createdOrders.length} orders`);
    return createdOrders;
  } catch (error) {
    console.error("Error seeding orders:", error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    await connectDB();
    await clearDatabase();

    const users = await seedUsers();
    const adminUser = users.find((u) => u.role === "admin");
    const counterUser = users.find((u) => u.role === "counter");

    const suppliers = await seedSuppliers(adminUser);
    const medicines = await seedMedicines();
    const orders = await seedOrders(counterUser, medicines);

    console.log("🎉 Database seeding completed successfully!");
    console.log(`
📊 Summary:
- Users: ${users.length}
- Suppliers: ${suppliers.length}  
- Medicines: ${medicines.length}
- Orders: ${orders.length}

🔑 Login Credentials:
- Admin: admin / admin123
- Counter: counter / counter123  
- Warehouse: warehouse / warehouse123
    `);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
    process.exit(0);
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
