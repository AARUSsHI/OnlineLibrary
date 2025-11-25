import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import User from "./models/User.js";
import Books from "./models/Books.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("**DB CONNECTED**");
  })
  .catch((error) => {
    console.log("DB is not connected");
  });

// **BOOKS**
// create
app.post("/api/books", async (req, res) => {
  try {
    const {
      bookTitle,
      edition,
      publisher,
      publicationYear,
      totalQuantity,
      quantityAvailable,
    } = req.body;
    const books = new Books({
      bookTitle: bookTitle,
      edition: edition,
      publisher: publisher,
      publicationYear: publicationYear,
      totalQuantity: totalQuantity,
      quantityAvailable: quantityAvailable,
    });
    await books.save();
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// read all
app.get("/api/books", async (req, res) => {
  try {
    const books = await Books.find({});
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// read book
app.get("/api/books/:id", async (req, res) => {
  try {
    const books = await Books.findById(req.params.id);
    if (!books) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// issue a book
app.put("/api/books/issue/:bookId/:userId", async (req, res) => {
  try {
    const { bookId, userId } = req.params;

    const book = await Books.findById(bookId);
    const user = await User.findById(userId);

    if (!book || !user) {
      return res.status(404).json({ message: "Book or User not found" });
    }

    if (book.quantityAvailable <= 0) {
      return res.status(400).json({ message: "No copies available" });
    }

    // Check if user already has this book issued
    const alreadyIssued = user.issuedBooks.some(
      (b) => b.bookId.toString() === bookId
    );
    
    if (alreadyIssued) {
      return res.status(400).json({ message: "User has already issued this book" });
    }

    book.quantityAvailable -= 1;
    await book.save();

    user.issuedBooks.push({
      bookId: bookId,
      issueDate: new Date(),
    });
    await user.save();

    res.status(200).json({
      message: "Book issued successfully",
      book,
      user,
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// return book
app.put("/api/books/return/:bookId/:userId", async (req, res) => {
  try {
    const { bookId, userId } = req.params;

    const book = await Books.findById(bookId);
    const user = await User.findById(userId);

    if (!book || !user) {
      return res.status(404).json({ message: "Book or User not found" });
    }

    // Check if user has this book issued
    const bookIndex = user.issuedBooks.findIndex(
      (b) => b.bookId.toString() === bookId
    );
    
    if (bookIndex === -1) {
      return res.status(400).json({ message: "User has not issued this book" });
    }

    // Increase quantity (but don't exceed totalQuantity)
    if (book.quantityAvailable < book.totalQuantity) {
      book.quantityAvailable += 1;
      await book.save();
    }

    // Remove from user
    user.issuedBooks = user.issuedBooks.filter(
      (b) => b.bookId.toString() !== bookId
    );
    await user.save();

    res.status(200).json({
      message: "Book returned successfully",
      book,
      user,
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// who issued book
app.get("/api/books/:id/issuedBy", async (req, res) => {
  try {
    const users = await User.find({
      "issuedBooks.bookId": req.params.id
    }).select("name email issuedBooks");

    res.status(200).json(users);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//update book
app.put("/api/books/:id", async (req, res) => {
  try {
    const updatedData = req.body;
    const books = await Books.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData },
      { new: true }
    );
    if (!books) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// delete
app.delete("/api/books/:id", async (req, res) => {
  try {
    const books = await Books.findByIdAndDelete(req.params.id);
    if (!books) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// **USER**
//create
app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = new User({
      name: name,
      email: email,
    });
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// read all
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// read
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// delete
app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is connected at port ${PORT}`);
});
