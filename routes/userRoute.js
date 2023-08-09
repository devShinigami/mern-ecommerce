import express from "express";
import {
  addToWishList,
  createUser,
  deleteUser,
  forgotPassword,
  getAllUsers,
  getSingleUserDetails,
  logOut,
  loginUser,
  removefromWishList,
  resetPassword,
  updateUserDetails,
  updateUserPassword,
  updateUserRole,
  userDetails,
  wishList,
} from "../controllers/userController.js";
import { authorizedRoles, isAuthenticated } from "../utils/Jwt.js";

const userRouter = express.Router();

userRouter.post("/auth/registration", createUser);
userRouter.post("/auth/login", loginUser);
userRouter.get("/auth/logout", logOut);
userRouter.post("/auth/password/forgot", forgotPassword);
userRouter.put("/password/reset/:token", resetPassword);
userRouter.get("/userdetails/:id", isAuthenticated, userDetails);
userRouter.put("/changepassword", isAuthenticated, updateUserPassword);
userRouter.put("/user/updatedetails", isAuthenticated, updateUserDetails);
userRouter.get(
  "/admin/getallusers",
  isAuthenticated,
  authorizedRoles("admin"),
  getAllUsers
);
userRouter.get(
  "/admin/user/:id",
  isAuthenticated,
  authorizedRoles("admin"),
  getSingleUserDetails
);
userRouter.put(
  "/admin/updaterole/:id",
  isAuthenticated,
  authorizedRoles("admin"),
  updateUserRole
);
userRouter.delete(
  "/admin/delete/:id",
  isAuthenticated,
  authorizedRoles("admin"),
  deleteUser
);
userRouter.put("/addToWishList/:id", isAuthenticated, addToWishList);
userRouter.put("/removeFromWishList/:id", isAuthenticated, removefromWishList);
userRouter.get("/wishList/:id", isAuthenticated, wishList);
export default userRouter;
