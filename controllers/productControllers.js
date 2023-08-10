import { asyncHandler } from "../middlewares/errorHandling.js";
import { BrandsModel } from "../models/brandsModel.js";
import { ProductModel } from "../models/productModel.js";
import { UserModel } from "../models/userModel.js";
import { ApiFeatures } from "../utils/apiFeatures.js";
import { v2 as cloudinary } from "cloudinary";
// !!  adminRoute
// ?? createProduct
export const createProducts = asyncHandler(async (req, res, next) => {
  let imgs = [];
  if (typeof req.body.images === "string") {
    imgs.push(req.body.images);
  } else {
    imgs = req.body.images;
  }
  const imagesLinks = [];
  for (let i = 0; i < imgs.length; i++) {
    const result = await cloudinary.uploader.upload(imgs[i], {
      folder: "productImages",
    });
    imagesLinks.push({
      public_id: result.public_id,
      image_url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;
  const product = await new ProductModel(req.body);
  // console.log(req.body);
  const user = await UserModel.findById(req.query.id);
  product.user = user;
  const { brandName } = req.body;
  const brand = await BrandsModel.findOne({ brandName });
  if (!brand) {
    const newBrand = await new BrandsModel({ brandName });
    newBrand.products.push(product);
    product.brand = newBrand._id;
    await product.save();
    await newBrand.save();

    return res.json({
      success: true,
      message: "We detected a New brand!, Product was crated successfully",
      newBrand: newBrand.brandName,
      _id: newBrand._id,
      product,
    });
  } else {
    product.brand = brand._id;
    brand.products.push(product);
    await product.save();
    await brand.save();
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// ?? getAllProduct

// export const getAllProducts = async (req, res, next) => {
//   try {
//     const { search, category, sortBy, page, limit } = req.query;
//     let searchQuery = [];
//     if (search) {
//       searchQuery.push({
//         $or: [
//           {
//             name: { $regex: search, $options: "i" },
//           },
//           {
//             category: { $regex: search, $options: "i" },
//           },
//         ],
//       });
//     }
//     const pageNumber = parseInt(page || 1);
//     const resultPerPage = parseInt(limit || 10);
//     const skip = (pageNumber - 1) * resultPerPage;
//     const productCount = await ProductModel.countDocuments();
//     const products = await ProductModel.find({
//       $and: searchQuery,
//     })
//       .sort(sortBy || "-createdAt")
//       .skip(skip)
//       .limit(resultPerPage);
//     const totalPages = Math.ceil(productCount / resultPerPage);
//     res.status(200).json({
//       products,
//       productCount,
//       totalPages,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getAllProducts = async (req, res, next) => {
//   try {
//     const resultPerPage = 8;
//     const productCount = await ProductModel.countDocuments();
//     const apiFeature = new ApiFeatures(ProductModel.find(), req.query)
//       .search()
//       .filter();

//     let products = await apiFeature.query;
//     let filteredProductsCount = products.length;
//     apiFeature.pagination(resultPerPage);
//     products = await apiFeature.query.clone();
//     res.status(200).json({
//       success: true,
//       products,
//       resultPerPage,
//       filteredProductsCount,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    let sort = req.query.rating || "rating";
    let filteredCategory = req.query.category || "All";
    const categories = await ProductModel.distinct("category");
    console.log(categories);
    filteredCategory === "All"
      ? (filteredCategory = [...categories])
      : (filteredCategory = req.query.category.split(","));
    req.query.sort ? (sort = req.query.sort.split(",")) : (sort = [sort]);

    let sortBy = {};
    if (sort[1]) {
      sortBy[sort[0]] = sort[1];
    } else {
      sortBy[sort[0]] = "asc";
    }

    const products = await ProductModel.find({
      name: { $regex: search, $options: "i" },
    })
      .where("category")
      .in([...filteredCategory])
      .sort(sortBy)
      .skip(page * limit)
      .limit(limit);

    const productCount = await ProductModel.countDocuments({
      category: { $in: [...filteredCategory] },
      name: { $regex: search, $options: "i" },
    });
    return res.status(200).json({
      success: true,
      limit,
      page: page + 1,
      categories,
      products,
      productCount,
    });
  } catch (error) {
    next(error);
  }
};

// !!  adminRoute

// ?? updateProduct

export const updateProduct = async (req, res, next) => {
  try {
    if (req.body.deletedImageId) {
      req.body.deletedImageId.forEach(
        async (id) => await cloudinary.uploader.destroy(id)
      );
    }
    let updateProduct = await ProductModel.findById(req.params.id);
    if (!updateProduct) {
      return res.status(500).json({
        success: false,
        message: "Product not found",
      });
    }
    let imgs = [];
    if (typeof req.body.images === "string") {
      imgs.push(req.body.images);
    } else {
      imgs = req.body.images;
    }
    if (imgs) {
      const imagesLinks = [];
      for (let i = 0; i < imgs.length; i++) {
        const result = await cloudinary.uploader.upload(imgs[i], {
          folder: "productImages",
        });
        imagesLinks.push({
          public_id: result.public_id,
          image_url: result.secure_url,
        });
      }
      let filteredImages = [];
      req.body.deletedImageId.forEach((id) => {
        let newImg = updateProduct.images.filter(
          (image) => image.public_id !== id
        );
        filteredImages = newImg;
      });
      let newImages = [...filteredImages, ...imagesLinks];
      req.body.images = newImages;
    }
    updateProduct = await ProductModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    const brandId = updateProduct.brand;
    let brand = await BrandsModel.findById(brandId);
    console.log(brand);

    const isExisted = brand.products.find(
      (item) => item._id.toString() === updateProduct._id.toString()
    );
    if (isExisted) {
      brand.products.forEach((product) => {
        if (product._id.toString() === updateProduct._id.toString()) {
          (product.name = updateProduct.name),
            (product.description = updateProduct.description),
            (product.price = updateProduct.price),
            (product.images = updateProduct.images),
            (product.stock = updateProduct.stock),
            (product.reviews = updateProduct.reviews),
            (product.numberOfReviews = updateProduct.numberOfReviews),
            (product.category = updateProduct.category),
            (product.createdAt = updateProduct.createdAt),
            (product.ratings = updateProduct.ratings);
        }
      });
      await brand.markModified("products");
      await brand.save();
      await updateProduct.save();
    }
    res.status(200).json({
      status: "success",
      brand,
      updateProduct,
    });
  } catch (error) {
    next(error);
  }
};

// ?? delete product

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await ProductModel.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    const brandId = product.brand.toString();
    let brand = await BrandsModel.findById(brandId);
    if (!brand) {
      return res.status(404).json({
        message: "brand not found",
        success: false,
      });
    }
    let filterBrandProducts = brand.products.filter(
      (prduct) => prduct._id.toString() !== product._id.toString()
    );
    brand.products = filterBrandProducts;
    if (brand.products?.length === 0) {
      await brand.deleteOne();
    } else {
      await brand.save();
    }
    await product.deleteOne();
    res.status(200).json({
      status: "success",
      message: "Product deleted",
    });
  } catch (error) {
    next(error);
  }
};

// ?? One product

export const getOneProduct = async (req, res, next) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).json({
      status: "success",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ?? create / update reviews

export const createReview = asyncHandler(async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    profilePic: req.user.profilePic,
    comment,
  };
  const product = await ProductModel.findById(productId);
  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );
  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }
  let avg = 0;
  product.ratings = product.reviews.forEach((rev) => (avg += rev.rating));

  product.ratings = avg / product.reviews.length;

  await product.save({
    validateBeforeSave: false,
  });
  res.status(200).json({
    success: true,
    message: "Thanks for the review!!",
  });
});

// ?? get all reviews of a product

export const getAllReviews = asyncHandler(async (req, res, next) => {
  const { id } = req.query;
  const product = await ProductModel.findById(id);
  if (!product)
    return res.status(404).json({
      message: "Product not found",
      success: false,
    });
  res.status(200).json({
    reviews: product.reviews,
    success: true,
  });
});

export const deleteReview = asyncHandler(async (req, res, next) => {
  const { productId, reviewId } = req.query;
  const product = await ProductModel.findById(productId);
  if (!product)
    return res.status(404).json({
      message: "Product not found",
      success: false,
    });

  const reviews = product.reviews.filter(
    (review) => review._id.toString() !== reviewId.toString()
  );

  let avg = 0;
  reviews.forEach((rev) => (avg += rev.rating));

  const ratings = avg / product.reviews.length;
  const numberOfReviews = reviews.length;
  await ProductModel.findByIdAndUpdate(
    productId,
    {
      reviews,
      ratings,
      numberOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  await product.save();
  res.status(200).json({
    success: true,
    message: "Review Deleted Successfuly",
  });
});

export const getBrandsDisplay = asyncHandler(async (req, res, next) => {
  const currentPage = Number(req.query.page) || 1;
  let resultPerPage = 8;
  const brands = await BrandsModel.find()
    .limit(resultPerPage)
    .skip(resultPerPage * (currentPage - 1));

  const limitedBrands = brands.filter((br) =>
    br.products.length > 15 ? (br.products.length = 15) : br.products.length
  );
  return res.json({ success: true, limitedBrands });
});

export const getBrandsAllProducts = asyncHandler(async (req, res, next) => {
  console.log(req.params.id);
  let resultPerPage = 20;
  const currentPage = Number(req.query.page) || 1;
  if (req.params.id) {
    const products = await ProductModel.find({ brand: req.params.id })
      .limit(resultPerPage)
      .skip(resultPerPage * (currentPage - 1));
    if (req.query.category) {
      const filters = products.filter(
        (product) => product.category === req.query.category
      );
      return res.status(200).json({ filteredProducts: filters, success: true });
    }
    return res.json({ success: true, products });
  } else {
    res.json({ success: false, message: "Brand not found" });
  }
});

export const getBrandsName = asyncHandler(async (req, res, next) => {
  const brands = await BrandsModel.find();
  let brandsName = [];
  brands.forEach((brand) => brandsName.push(brand.brandName));

  return res.json({ success: true, brandsName });
});

export const deleteImages = asyncHandler(async (req, res, next) => {
  const { imageId } = req.body;
  if (!imageId) {
    res.status(404).json({ success: false, message: "Image not found" });
  }
  await cloudinary.uploader.destroy(imageId);
  res
    .status(200)
    .json({ success: true, message: "Image deleted successfully!" });
});
