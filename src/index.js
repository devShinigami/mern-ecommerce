import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import router from "../routes/productRoute.js";
import { dataConnection } from "../database/dataBase.js";
import userRouter from "../routes/userRoute.js";
import cookieParser from "cookie-parser";
import orderRouter from "../routes/orderRoute.js";
import { v2 as cloudinary } from "cloudinary";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";

const app = express();
let options = { credentials: true, origin: "http://localhost:3000" };

app.use(cors(options));
app.use(bodyParser.json({ limit: "10000kb", extended: true }));
app.use(
  bodyParser.urlencoded({
    limit: "10000kb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(express.json());
app.use(fileUpload());
// config
dotenv.config();

// databaseConnection
dataConnection();

//Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// routes

const productsRouter = router;
app.use("/api/v1", productsRouter);
app.use("/api/v1/", userRouter);
app.use("/api/v1/", orderRouter);

// server
app.listen("3001", () => {
  console.log("server listening on");
});
