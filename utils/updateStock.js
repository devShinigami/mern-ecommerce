import { ProductModel } from "../models/productModel.js";

export const updateStock = async (id, quantity) => {
  const product = await ProductModel.findById(id);
  product.stock -= quantity;
  await product.save();
};
