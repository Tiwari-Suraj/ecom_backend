const productRoute = require("express").Router();

const {
  getCategories,
  getAllProducts,
  getSingleProduct,
  getAllReviewsOfSingleProduct,
  addToCart,
  getCartItems,
  addFavourate,
  getFavourateItems
} = require("../controller/productController");

productRoute.route("/api/v1/product/products").get(getAllProducts);
productRoute.route("/api/v1/product/all-categories").get(getCategories);
productRoute.route("/api/v1/product/:id").get(getSingleProduct);
productRoute.route("/api/v1/product").get(getAllReviewsOfSingleProduct);
productRoute.route("/api/v1/product/add-to-cart").post(addToCart);
productRoute.route("/api/v1/product/cart-items").get(getCartItems);
productRoute.route("/api/v1/product/add-to-favourate").post(addFavourate);
productRoute.route("/api/v1/product/favourate-items").get(getFavourateItems);

module.exports = productRoute;


