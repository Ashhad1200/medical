const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");

(async () => {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/medical-pos";

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    const username = "admin";
    const email = "admin@medicalstore.com";
    const password = "admin123";
    const fullName = "System Administrator";

    const existing = await User.findOne({ username });
    if (existing) {
      console.log(
        "ℹ️  Admin user already exists - updating password & activating"
      );
      existing.password = password; // will hash via pre-save
      existing.isActive = true;
      await existing.save();
    } else {
      const admin = new User({
        username,
        email,
        password,
        role: "admin",
        fullName,
        isActive: true,
      });
      await admin.save();
      console.log("🎉 Admin user created successfully");
    }

    console.log("👤 Credentials -> username: admin | password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    process.exit(1);
  }
})();
