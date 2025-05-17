const ProductModel = require("../models/productModel");
const CartModel = require("../models/cartModel");
const FavourateModel = require("../models/favourateModel");
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const ApiFeature = require("../utils/apiFeature");

//  //! Create a new Product...
exports.createProduct = catchAsyncError(async (req, res, next) => {
  const {
    name,
    short_description,
    long_description,
    unit,
    price,
    discountedPrice,
    category,
    stock,
  } = req.body;

  const getImages = await req.files;
  if (getImages.length < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Product Image is required." });
  }

  const storeImages = [];
  await getImages.forEach((e) => {
    let localData = {
      originalname: e.originalname,
      mimetype: e.mimetype,
      size: e.size,
      buffer: e.buffer,
    };
    storeImages.push(localData);
  });

  const newProduct = await ProductModel.create({
    name,
    short_description,
    long_description,
    unit,
    price,
    discountedPrice,
    category,
    stock,
    images: storeImages,
  });
  await newProduct.save({ validateModifiedOnly: true });
  return res
    .status(200)
    .json({ success: true, message: "Product Added Successfully" });
});

//  //! Get All Categories....
exports.getCategories = catchAsyncError(async (req, res, next) => {
  const products = await ProductModel.find({}).select("category -_id");
  const productCategory = [];
  for (let i in products) {
    if (productCategory.includes(products[i].category)) {
      continue;
    } else {
      productCategory.push(products[i].category);
    }
  }
  return res.status(200).json({
    success: true,
    totalProductCategory: productCategory.length,
    productCategory,
  });
});

//  //! Get All Product [Admin]...
exports.getAllProductsAdmin = catchAsyncError(async (req, res, next) => {
  const totalProducts = await ProductModel.countDocuments();
  let resultPerPage = 20;
  //  Use Search feature to search the products by [DESCRIPTION keyword]...
  // console.log(req.query);
  const searchFeature = new ApiFeature(ProductModel.find(), req.query)
    .searchFeature()
    .filterCategory()
    .pagination(resultPerPage);
  const products = await searchFeature.query.sort({ _id: -1 }); //.select("-images");
  //  Count total products...
  let totalProductView = 0;
  for (count in products) totalProductView++;
  return res
    .status(200)
    .json({ success: true, totalProducts, totalProductView, products });
});

//  //! Get All Product [User]...
exports.getAllProducts = catchAsyncError(async (req, res, next) => {
  const totalProducts = await ProductModel.countDocuments();
  let resultPerPage = totalProducts;
  //  Use Search feature to search the products by [DESCRIPTION keyword]...
  // console.log(req.query);
  const searchFeature = new ApiFeature(ProductModel.find(), req.query)
    .searchFeature()
    .filterCategory()
    .pagination(resultPerPage);
  const products = await searchFeature.query.sort({ ranking: -1 }); //.select("-images");
  //  Count total products...
  let totalProductView = 0;
  for (count in products) totalProductView++;
  return res
    .status(200)
    .json({ success: true, totalProducts, totalProductView, products });
});

//  //! Get Single Product...
exports.getSingleProduct = catchAsyncError(async (req, res, next) => {
  const singleProduct = await ProductModel.findById({ _id: req.params.id });
  if (!singleProduct) {
    return next(
      new ErrorHandler(`Product not found. Invalid ${req.params.id}`, 400)
    );
  }
  return res.status(200).json({ success: true, singleProduct });
});

//  //! Delete a product...
exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const deleteProduct = await ProductModel.findByIdAndDelete({
    _id: req.params.id,
  });
  if (!deleteProduct) {
    return next(
      new ErrorHandler(`Product not found. Invalid ${req.params.id}`, 400)
    );
  }
  const totalProducts = await ProductModel.countDocuments();
  let resultPerPage = 20;
  //  Use Search feature to search the products by [DESCRIPTION keyword]...
  const searchFeature = new ApiFeature(ProductModel.find(), req.query)
    .searchFeature()
    .filterCategory()
    .pagination(resultPerPage);
  const products = await searchFeature.query.sort({ ranking: -1 });
  //  Count total products...
  let totalProductView = 0;
  for (count in products) totalProductView++;
  return res.status(200).json({
    success: true,
    message: "Product removed successfully",
    totalProducts,
    totalProductView,
    products,
  });
});

//  //! Get all reviews of a single product...
exports.getAllReviewsOfSingleProduct = catchAsyncError(
  async (req, res, next) => {
    const { productId } = req.query;
    const product = await ProductModel.findById(productId);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    return res.status(200).json({ success: true, reviews: product.reviews });
  }
);

exports.addToCart = catchAsyncError(async (req, res, next) => {
  const { productId, userId } = req.body;
  const cartAdded = await CartModel.create({
    productId,
    userId,
  });
  cartAdded.save({ validateModifiedOnly: true });
  if (!cartAdded) {
    return next(new ErrorHandler("Product not found", 404));
  }
  return res
    .status(200)
    .json({ success: true, message: "Product added to cart" });
});
exports.getCartItems = catchAsyncError(async (req, res, next) => {
  const { userId } = req.body;
  const cartItems = await CartModel.find({ userId });
  return res.status(200).json({ success: true, cartItems: cartItems });
});

exports.addFavourate = catchAsyncError(async (req, res, next) => {
   const { productId, userId } = req.body;
  const favourateAdded = await FavourateModel.create({
    productId,
    userId,
  });
  favourateAdded.save({ validateModifiedOnly: true });
  return res
    .status(200)
    .json({ success: true, message: "Added to favourate" });
});
exports.getFavourateItems = catchAsyncError(async (req, res, next) => {
  const { userId } = req.body;
  const product = await FavourateModel.find({ userId });
  return res.status(200).json({ success: true, favourate: product });
});
