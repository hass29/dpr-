import mongoose from "mongoose";

const productRowSchema = new mongoose.Schema({
  product: { type: String, required: true },
  opening: { type: Number, default: 0, min: 0 },
  production: { type: Number, default: 0, min: 0 },
  return: { type: Number, default: 0, min: 0 },
  dispatch: { type: Number, default: 0, min: 0 }
}, { _id: false });

const reportSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, index: true },
  rows: { type: [productRowSchema], default: [] }
}, { timestamps: true });

export default mongoose.model("Report", reportSchema);
