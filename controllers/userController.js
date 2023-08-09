import { asyncHandler } from "../middlewares/errorHandling.js";
import { UserModel } from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { ProductModel } from "../models/productModel.js";
import { v2 as cloudinary } from "cloudinary";
import { sendToken } from "../utils/Token.js";

// ?? Register user

export const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, dp } = req.body;
  const myCloud = dp
    ? await cloudinary.uploader.upload(dp, {
        folder: "userDps",
        width: 150,
        crop: "scale",
      })
    : "no Dp available";
  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ status: false, message: "email and password are required" });
  }

  const checkUser = await UserModel.findOne({ email });
  if (checkUser) {
    return res.json({ message: "User already exists" }).status(400);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new UserModel({
    name,
    email,
    password: hashedPassword,
    profilePic: {
      public_id: dp ? myCloud.public_id : "no profilePic",
      url: dp ? myCloud.secure_url : "no profilePic",
    },
  });
  await newUser.save();
  const token = jwt.sign({ id: newUser._id }, process.env.TOKEN_SECRET, {
    expiresIn: 5 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({
    token,
    newUser,
    message: "Sign in successfully",
  });
});

// ?? Login User

export const loginUser = asyncHandler(async (req, res, next) => {
  const { password, email } = req.body;
  if (!email || !password) {
    return res.json({ status: 401, message: "email or password is required" });
  }
  const user = await UserModel.findOne({ email }).select("+password");
  if (!user) {
    return res
      .json({
        status: false,
        message: "invalid email or password",
      })
      .status(400);
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.json({
      status: false,
      message: "invalid email or password",
    });
  }
  const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET, {
    expiresIn: 5 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({
    token,
    user,
    message: "Log in successfully",
  });
});

// ?? logout User

export const logOut = asyncHandler(async (req, res, next) => {
  res.cookie("token", "", {
    expiresIn: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
});

// !! forgot password

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) {
    res.status(404).json({
      message: "User not found",
    });
  } else {
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    const resetPasswordUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/password/reset/${resetToken}`;
    const message = `Your Password Reset Token is :- ${resetPasswordUrl} `;
    try {
      await sendEmail({
        email: user.email,
        subject: `ecommerce Password Recovery `,
        message,
      });
      res.status(200).json({
        success: true,
        message: `Email sent successfully to ${user?.email}`,
      });
    } catch (e) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json(e.message);
    }
  }
});

// !! resetPassword

export const resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await UserModel.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });
  if (!user) {
    res.status(400).json({
      message: "Reset Password token is expired!! ",
    });
  }
  if (req.body.password !== req.body.confirmPassword) {
    res.status(400).json({
      message: "password does not match!",
    });
  } else {
    user.password = req.body.password;
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendToken(user, 200, res);
  }
});

// ?? userDetails

export const userDetails = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await UserModel.findById(id);
  res.status(200).json({
    success: true,
    user,
  });
});

// ?? updatePassword

export const updateUserPassword = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const user = await UserModel.findById(_id).select("+password");
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    return res
      .json({
        status: false,
        message: "invalid password",
      })
      .status(400);
  }
  if (newPassword !== confirmPassword) {
    return res
      .json({
        status: false,
        message: "password Does not match",
      })
      .status(400);
  }
  const hashedPassword = await bcrypt.hash(confirmPassword, 10);
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

// ?? update User Details

export const updateUserDetails = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { name, email } = req.body;
  const newUserData = {
    name,
    email,
  };
  const user = await UserModel.findByIdAndUpdate(
    { _id, newUserData },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  await user.save();
  res.status(200).json({
    success: true,
    message: "updated successfully",
  });
});

// !! admin Route getAllUsers

export const getAllUsers = asyncHandler(async (req, res, next) => {
  const { id } = req.query;
  const { page } = req.query;
  const userPerPage = 10;
  const skip = (page - 1) * userPerPage;
  const users = await UserModel.find().limit(userPerPage).skip(skip);
  const filteredUsers = users.filter(
    (user) => user._id.toString() !== id.toString()
  );
  res.status(200).json({
    success: true,
    filteredUsers,
  });
});

// !! admin Route getSingleUserDetails

export const getSingleUserDetails = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await UserModel.findById(id);
  if (!user) {
    return res.status(404).json({
      message: "User does not exist",
    });
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// !! admin Route update User Role

export const updateUserRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  const newUserData = { name, email, role };

  const user = await UserModel.findByIdAndUpdate(
    { id, newUserData },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  await user.save();
  res.status(200).json({
    success: true,
    message: "updated successfully",
  });
});

// !! admin Route delete User

export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await UserModel.findById(id);
  if (!user) {
    return res.status(404).json({
      message: "User not found with id of " + id,
    });
  }
  const name = user.name;
  await user.deleteOne();
  res.status(200).json({
    success: true,
    message: "you deleted " + name,
  });
});

export const addToWishList = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { id } = req.params;
  const product = await ProductModel.findById(id);
  if (!product) {
    return res
      .json({
        message: "Product not found",
      })
      .status(400);
  }
  const user = await UserModel.findById(_id);
  const alreadyAdded = user.wishlist.find(
    (item) => item._id.toString() === product._id.toString()
  );
  if (alreadyAdded) {
    return res
      .json({
        message: "Already added",
      })
      .status(400);
  } else {
    user.wishlist.push(product);
  }

  await user.save();
  res
    .json({
      success: true,
      message: "Product added successfully",
    })
    .status(200);
});

export const removefromWishList = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { id } = req.params;
  const product = await ProductModel.findById(id);
  if (!product) {
    return res
      .json({
        message: "Product not found",
      })
      .status(400);
  }
  const user = await UserModel.findById(_id);
  const products = user.wishlist.filter(
    (item) => item._id.toString() !== product._id.toString()
  );
  user.wishlist = products;
  await user.save();
  res
    .json({
      products,
      success: true,
      message: "Product removed successfully",
    })
    .status(200);
});

export const wishList = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await UserModel.findById(id);
  const wishListProducts = user.wishlist;

  res
    .json({
      success: true,
      wishListProducts,
    })
    .status(200);
});
