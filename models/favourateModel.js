const mongoose = require("mongoose");

const favourateSchema = new mongoose.Schema({
  productId: {
    type: String,
  },
  userId: {
    type: String,
  },
});
module.exports = mongoose.model("favourates", favourateSchema);
