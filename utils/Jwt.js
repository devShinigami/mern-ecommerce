import jwt from "jsonwebtoken";
import { asyncHandler } from "../middlewares/errorHandling.js";
import { UserModel } from "../models/userModel.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const token = req.headers.token;
  if (!token) {
    return res.status(403).send({
      message: "logged Out",
      success: false,
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    next();
  } catch (error) {
    console.log(error);
  }
});

export const authorizedRoles = (...roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.headers.role)) {
      res.status(401).json({
        message: `${req.headers.role} is not allowed to access this!!`,
      });
    } else {
      next();
    }
  };
};
