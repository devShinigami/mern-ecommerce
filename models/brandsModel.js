import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: true,
  },
  products: [],
});

export const BrandsModel = new mongoose.model("brands", brandSchema);
