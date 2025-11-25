import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    issuedBooks: [
      {
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Books" },
        issueDate: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
