import express from "express";
import {
  deleteOrders,
  getAllOrders,
  getSingleOrder,
  myOrders,
  newOrder,
  updateOrderStatus,
} from "../controllers/orderControllers.js";
import { authorizedRoles, isAuthenticated } from "../utils/Jwt.js";

const orderRouter = express.Router();

orderRouter.post("/createOrder", isAuthenticated, newOrder);
orderRouter.get("/getSingleOrder/:id", isAuthenticated, getSingleOrder);
orderRouter.get("/myOrders/:id", isAuthenticated, myOrders);
orderRouter.get(
  "/admin/allOrders",
  isAuthenticated,
  authorizedRoles("admin"),
  getAllOrders
);
orderRouter.delete(
  "admin/deleteOrder/:id",
  isAuthenticated,
  authorizedRoles("admin"),
  deleteOrders
);
orderRouter.put(
  "/admin/updateOrder/:id",
  isAuthenticated,
  authorizedRoles("admin"),
  updateOrderStatus
);

export default orderRouter;
