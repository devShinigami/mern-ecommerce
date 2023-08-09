import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Enter Product Name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Enter Product description"],
  },
  price: {
    type: Number,
    required: [true, "Enter Product price"],
    length: [8, "price cannot exceed"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      image_url: {
        type: String,
        required: true,
      },
    },
  ],

  category: {
    type: String,
    required: [true, "Enter Product category"],
  },
  stock: {
    type: Number,
    required: true,
    length: [4, "stock cannot be exceeded"],
    default: 1,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "users",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      profilePic: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "users",
    required: true,
  },
  colors: [
    {
      name: {
        type: String,
        required: true,
      },
    },
  ],
  brand: {
    type: mongoose.Schema.ObjectId,
    ref: "brands",
    // required: true,
  },
});

export const ProductModel = mongoose.model("Products", productSchema);
