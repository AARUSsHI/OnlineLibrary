/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [formData, setFormData] = useState({
    bookTitle: "",
    edition: "", 
    publisher: "",
    publicationYear: "",
    totalQuantity: "",
    quantityAvailable: "",
  });

  const fetchBooks = async () => {
    try {
      const response = await fetch("https://onlinelibrary-production-4d24.up.railway.app/api/books");
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [navigate]);

  useEffect(() => {
    const handleFocus = () => fetchBooks();

    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("https://onlinelibrary-production-4d24.up.railway.app/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          bookTitle: "",
          edition: "",
          publisher: "",
          publicationYear: "",
          totalQuantity: "",
          quantityAvailable: "",
        });
        fetchBooks();
      }
    } catch (error) {
      console.error("Error creating book:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`https://onlinelibrary-production-4d24.up.railway.app/api/books/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBooks();
      }
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">
            Online Library
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Manage your Catalogue
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Add new titles, monitor real-time availability, and issue or return
            books without leaving this screen.
          </p>
        </header>

        <section className="rounded-3xl bg-white px-6 py-8 shadow-xl ring-1 ring-black/5 md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Add a new book
              </h2>
              <p className="text-sm text-slate-500">
                Capture core inventory details to keep the shelves updated.
              </p>
            </div>
            <div className="hidden text-5xl font-black text-slate-100 md:block">
              01
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 grid gap-4 md:grid-cols-2"
          >
            <input
              type="text"
              name="bookTitle"
              placeholder="Book title"
              value={formData.bookTitle}
              onChange={handleInputChange}
              required
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <input
              type="text"
              name="edition"
              placeholder="Edition"
              value={formData.edition}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <input
              type="text"
              name="publisher"
              placeholder="Publisher"
              value={formData.publisher}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <input
              type="number"
              name="publicationYear"
              placeholder="Publication year"
              value={formData.publicationYear}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <input
              type="number"
              name="totalQuantity"
              placeholder="Total quantity"
              value={formData.totalQuantity}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <input
              type="number"
              name="quantityAvailable"
              placeholder="Quantity available"
              value={formData.quantityAvailable}
              onChange={handleInputChange}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save book
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-white px-4 py-8 shadow-xl ring-1 ring-black/5 md:px-8">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Catalogue overview
              </h2>
              <p className="text-sm text-slate-500">
                Issue, return, or remove books from the system.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {books.length} titles
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Book
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                    Publisher
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                    Availability
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No books yet. Add a title to get started.
                    </td>
                  </tr>
                ) : (
                  books.map((book) => (
                    <tr
                      key={book._id}
                      className="hover:bg-slate-50"
                    >
                      <td className="w-full max-w-xs px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {book.bookTitle}
                        </p>
                        <p className="text-sm text-slate-500">
                          Edition {book.edition || "—"} •{" "}
                          {book.publicationYear || "Year N/A"}
                        </p>
                      </td>
                      <td className="hidden px-4 py-4 text-sm text-slate-600 md:table-cell">
                        {book.publisher || "—"}
                      </td>
                      <td className="hidden px-4 py-4 md:table-cell">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            Number(book.quantityAvailable) > 0
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {book.quantityAvailable} / {book.totalQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/book/${book._id}`);
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-500"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Manage
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(book._id);
                            }}
                            className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
