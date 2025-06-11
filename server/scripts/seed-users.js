const { sequelize } = require("../config/database");
const User = require("../models/User");

const seedUsers = async () => {
  try {
    console.log("🌱 Starting user seeding...");

    // Connect to database (without sync)
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    console.log("👥 Creating users...");
    const users = [
      {
        username: "admin",
        email: "admin@medical-pos.com",
        password: "admin123",
        role: "admin",
        fullName: "System Administrator",
        phone: "+1234567890",
      },
      {
        username: "counter1",
        email: "counter1@medical-pos.com",
        password: "counter123",
        role: "counter",
        fullName: "Counter Person 1",
        phone: "+1234567891",
      },
      {
        username: "warehouse1",
        email: "warehouse1@medical-pos.com",
        password: "warehouse123",
        role: "warehouse",
        fullName: "Warehouse Manager 1",
        phone: "+1234567892",
      },
    ];

    // Clear existing users first
    await User.destroy({ where: {}, truncate: true });

    const createdUsers = await User.bulkCreate(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    console.log("\n🎉 User seeding completed successfully!");
    console.log("\n📋 Demo Credentials:");
    console.log("   Admin: admin / admin123");
    console.log("   Counter: counter1 / counter123");
    console.log("   Warehouse: warehouse1 / warehouse123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error.message);
    console.error(error);
    process.exit(1);
  }
};

seedUsers();
