import mongoose from "mongoose";

export const dataConnection = () => {
  mongoose.connect(process.env.DB_URI).then(() => {
    console.log("Connected database");
  });
};
