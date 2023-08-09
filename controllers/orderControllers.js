import { asyncHandler } from "../middlewares/errorHandling.js";
import { ProductModel } from "../models/productModel.js";
import { OrderModel } from "../models/orderModel.js";
import { updateStock } from "../utils/updateStock.js";

// ?? create newOrder

export const newOrder = asyncHandler(async (req, res, next) => {
  const order = await OrderModel.create({ ...req.body, user: req.user._id });
  res.status(201).json({
    success: true,
    message: "Order created successfully",
    order,
  });
});

export const getSingleOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const order = await OrderModel.findById(id).populate("user", "name email");
  if (!order) {
    return res.status(400).json({
      success: false,
      message: "Order not found!!",
    });
  }

  res.status(201).json({
    success: true,
    order,
  });
});

export const myOrders = asyncHandler(async (req, res, next) => {
  const orders = await OrderModel.find({ user: req.params.id });

  res.status(201).json({
    success: true,
    orders,
  });
});

export const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await OrderModel.find();

  let totalAmount = 0;
  orders.forEach((order) => (totalAmount += order.totalPrice));

  res.status(201).json({
    success: true,
    orders,
    totalAmount,
  });
});

export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderStatus } = req.body;
  const { id } = req.params;
  const order = await OrderModel.findById(id).populate("user", "name");
  if (!order) {
    res.status(400).json({
      success: false,
      message: "Order not found",
    });
  }
  console.log(order);
  if (order.orderStatus === "delievered") {
    return res
      .json({ message: "Order already delivered to" + order.user.name })
      .status(400);
  }
  order.orderItems.forEach(
    async (item) => await updateStock(item.product, item.quantity)
  );

  order.orderStatus = orderStatus;
  if (orderStatus === "delievered") {
    order.delieveredAt = Date.now();
  }
  await order.save({ validateBeforeSave: false });
  res.status(201).json({
    success: true,
    message: "Status updated successfully",
  });
});

export const deleteOrders = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const order = await OrderModel.findById(id).populate("user", "name");
  if (!order) {
    res.status(400).json({
      success: false,
      message: "Order not found",
    });
  }
  const { name } = order.user;

  await order.deleteOne();

  res.status(200).json({
    success: true,
    messsage: "Order deleted successfully of " + name,
  });
});
