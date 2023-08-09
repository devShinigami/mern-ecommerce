import express from "express";
import {
  createProducts,
  createReview,
  deleteProduct,
  deleteReview,
  getAllProducts,
  getAllReviews,
  getBrandsAllProducts,
  getBrandsDisplay,
  getBrandsName,
  getOneProduct,
  updateProduct,
} from "../controllers/productControllers.js";
import { isAuthenticated, authorizedRoles } from "../utils/Jwt.js";

const router = express.Router();

router.get(
  "/products",

  getAllProducts
);
router.post(
  "/product/new",
  isAuthenticated,
  authorizedRoles("admin"),
  createProducts
);
router.put(
  "/updateProduct/:id",
  isAuthenticated,
  authorizedRoles("admin"),
  updateProduct
);
router.delete(
  "/deleteProduct/:id",
  isAuthenticated,
  authorizedRoles("admin"),
  deleteProduct
);
router.get("/oneProduct/:id", getOneProduct);

router.put("/createReview", isAuthenticated, createReview);
router.delete("/deleteReview", isAuthenticated, deleteReview);
router.get("/allReviews", getAllReviews);
router.get("/getBrandsDisplay", getBrandsDisplay);
router.get("/getBrandsDetails/:id", getBrandsAllProducts);
router.get(
  "/getBrandsName",
  isAuthenticated,
  authorizedRoles("admin"),
  getBrandsName
);
export default router;
