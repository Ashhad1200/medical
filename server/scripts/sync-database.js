const { initializeDatabase } = require("../config/database");

// Import all models
const User = require("../models/User");
const Medicine = require("../models/Medicine");
const Order = require("../models/Order");

// Set up associations
require("../models/index");

const syncDatabase = async () => {
  try {
    console.log("🔄 Initializing database...");
    await initializeDatabase();
    console.log("✅ Database initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    console.error(error);
    process.exit(1);
  }
};

syncDatabase();
