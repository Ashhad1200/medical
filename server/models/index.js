const User = require("./User");
const Medicine = require("./Medicine");
const Order = require("./Order");
const Supplier = require("./Supplier");
const PurchaseOrder = require("./PurchaseOrder");

// Mongoose models with refs defined in schemas
// No need for explicit associations like Sequelize

module.exports = {
  User,
  Medicine,
  Order,
  Supplier,
  PurchaseOrder,
};
