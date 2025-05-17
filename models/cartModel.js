const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  productId: {
    type: String,
  },
  userId: {
    type: String,
  },
});
module.exports = mongoose.model("carts", cartSchema);
