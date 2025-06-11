const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("../models/User");
const Medicine = require("../models/Medicine");

const seedUsers = async () => {
  // Check if users already exist
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    console.log("Users already exist, skipping user seeding");
    return;
  }

  const users = [
    {
      username: "admin",
      email: "admin@medicalstore.com",
      password: "admin123",
      role: "admin",
      fullName: "System Administrator",
      phone: "+1234567890",
      isActive: true,
    },
    {
      username: "counter",
      email: "counter@medicalstore.com",
      password: "counter123",
      role: "counter",
      fullName: "Counter Staff",
      phone: "+1234567891",
      isActive: true,
    },
    {
      username: "warehouse",
      email: "warehouse@medicalstore.com",
      password: "warehouse123",
      role: "warehouse",
      fullName: "Warehouse Manager",
      phone: "+1234567892",
      isActive: true,
    },
  ];

  for (const userData of users) {
    const user = new User(userData);
    await user.save();
    console.log(`Created user: ${userData.username}`);
  }
};

const seedMedicines = async () => {
  // Check if medicines already exist
  const existingMedicines = await Medicine.countDocuments();
  if (existingMedicines > 0) {
    console.log("Medicines already exist, skipping medicine seeding");
    return;
  }

  const medicines = [
    {
      name: "Paracetamol 500mg",
      retailPrice: 15.5,
      tradePrice: 12.0,
      gstPerUnit: 2.33,
      quantity: 500,
      expiryDate: new Date("2025-12-31"),
      batchNumber: "PARA001",
      manufacturer: "ABC Pharmaceuticals",
      description: "Pain reliever and fever reducer",
      isActive: true,
    },
    {
      name: "Amoxicillin 250mg",
      retailPrice: 45.0,
      tradePrice: 35.0,
      gstPerUnit: 6.75,
      quantity: 200,
      expiryDate: new Date("2025-08-15"),
      batchNumber: "AMOX001",
      manufacturer: "XYZ Pharma",
      description: "Antibiotic for bacterial infections",
      isActive: true,
    },
    {
      name: "Cetirizine 10mg",
      retailPrice: 8.75,
      tradePrice: 6.5,
      gstPerUnit: 1.31,
      quantity: 350,
      expiryDate: new Date("2026-03-20"),
      batchNumber: "CETI001",
      manufacturer: "DEF Medical",
      description: "Antihistamine for allergies",
      isActive: true,
    },
    {
      name: "Omeprazole 20mg",
      retailPrice: 22.0,
      tradePrice: 18.0,
      gstPerUnit: 3.3,
      quantity: 150,
      expiryDate: new Date("2025-11-30"),
      batchNumber: "OMEP001",
      manufacturer: "GHI Healthcare",
      description: "Proton pump inhibitor for acid reflux",
      isActive: true,
    },
    {
      name: "Metformin 500mg",
      retailPrice: 12.25,
      tradePrice: 9.5,
      gstPerUnit: 1.84,
      quantity: 400,
      expiryDate: new Date("2025-10-15"),
      batchNumber: "METF001",
      manufacturer: "JKL Pharmaceuticals",
      description: "Diabetes medication",
      isActive: true,
    },
    {
      name: "Aspirin 75mg",
      retailPrice: 6.5,
      tradePrice: 4.75,
      gstPerUnit: 0.98,
      quantity: 600,
      expiryDate: new Date("2026-01-25"),
      batchNumber: "ASPR001",
      manufacturer: "MNO Medical",
      description: "Blood thinner and pain reliever",
      isActive: true,
    },
    {
      name: "Vitamin D3 1000 IU",
      retailPrice: 18.0,
      tradePrice: 14.0,
      gstPerUnit: 2.7,
      quantity: 250,
      expiryDate: new Date("2026-06-30"),
      batchNumber: "VITD001",
      manufacturer: "PQR Nutrition",
      description: "Vitamin D supplement",
      isActive: true,
    },
    {
      name: "Ibuprofen 400mg",
      retailPrice: 11.75,
      tradePrice: 8.5,
      gstPerUnit: 1.76,
      quantity: 300,
      expiryDate: new Date("2025-09-10"),
      batchNumber: "IBUP001",
      manufacturer: "STU Pharma",
      description: "Anti-inflammatory pain reliever",
      isActive: true,
    },
    {
      name: "Cough Syrup 100ml",
      retailPrice: 35.0,
      tradePrice: 28.0,
      gstPerUnit: 5.25,
      quantity: 80,
      expiryDate: new Date("2025-07-20"),
      batchNumber: "COSY001",
      manufacturer: "VWX Healthcare",
      description: "Cough suppressant syrup",
      isActive: true,
    },
    {
      name: "Calcium Carbonate 500mg",
      retailPrice: 14.5,
      tradePrice: 11.0,
      gstPerUnit: 2.18,
      quantity: 180,
      expiryDate: new Date("2026-04-15"),
      batchNumber: "CALC001",
      manufacturer: "YZ Nutrition",
      description: "Calcium supplement",
      isActive: true,
    },
    {
      name: "Multivitamin Tablets",
      retailPrice: 25.0,
      tradePrice: 20.0,
      gstPerUnit: 3.75,
      quantity: 120,
      expiryDate: new Date("2026-02-28"),
      batchNumber: "MULT001",
      manufacturer: "ABC Nutrition",
      description: "Daily multivitamin supplement",
      isActive: true,
    },
    {
      name: "Antacid Tablets",
      retailPrice: 9.25,
      tradePrice: 7.0,
      gstPerUnit: 1.39,
      quantity: 220,
      expiryDate: new Date("2025-12-15"),
      batchNumber: "ANTA001",
      manufacturer: "DEF Medical",
      description: "Stomach acid neutralizer",
      isActive: true,
    },
    {
      name: "Antiseptic Cream 30g",
      retailPrice: 28.0,
      tradePrice: 22.0,
      gstPerUnit: 4.2,
      quantity: 90,
      expiryDate: new Date("2025-08-30"),
      batchNumber: "ANTI001",
      manufacturer: "GHI Healthcare",
      description: "Topical antiseptic for wounds",
      isActive: true,
    },
    {
      name: "Eye Drops 10ml",
      retailPrice: 42.5,
      tradePrice: 35.0,
      gstPerUnit: 6.38,
      quantity: 60,
      expiryDate: new Date("2025-06-10"),
      batchNumber: "EYED001",
      manufacturer: "JKL Ophthalmics",
      description: "Lubricating eye drops",
      isActive: true,
    },
    {
      name: "Throat Lozenges",
      retailPrice: 16.75,
      tradePrice: 13.0,
      gstPerUnit: 2.51,
      quantity: 140,
      expiryDate: new Date("2025-11-05"),
      batchNumber: "THRO001",
      manufacturer: "MNO Pharma",
      description: "Soothing throat lozenges",
      isActive: true,
    },
  ];

  for (const medicineData of medicines) {
    const medicine = new Medicine(medicineData);
    await medicine.save();
    console.log(`Created medicine: ${medicineData.name}`);
  }
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/medical-pos",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to MongoDB");

    console.log("Starting database seeding...");

    // Seed users
    await seedUsers();

    // Seed medicines
    await seedMedicines();

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedUsers, seedMedicines };
