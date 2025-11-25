import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    bookTitle: { type: String, required: true },
    edition: { type: String, required: true },
    publisher: { type: String, required: true },
    publicationYear: { type: Number, required: true },
    totalQuantity: { type: Number, required: true },
    quantityAvailable: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Books", bookSchema);
