const MedicalPosApp = require("./app");

// Create and start the application
const app = new MedicalPosApp();
app.start().catch((error) => {
  console.error("Failed to start Medical POS server:", error);
  process.exit(1);
});
