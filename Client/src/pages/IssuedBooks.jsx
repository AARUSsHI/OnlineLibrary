import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function IssuedBook() {
  const { id } = useParams(); // bookId from URL
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [users, setUsers] = useState([]);
  const [issuedUsers, setIssuedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [returning, setReturning] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [returnSuccessMessage, setReturnSuccessMessage] = useState("");
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
  });

  const canUserIssue = (user) => {
    const total = user.issuedBooks?.length || 0;
    return total < 2;
  };

  // Fetch selected book
  const fetchBook = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/books/${id}`);
      if (!res.ok) throw new Error("Failed to fetch book");
      const data = await res.json();
      setBook(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Fetch users who issued this book
  const fetchIssuedBy = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/books/${id}/issuedBy`);
      if (!res.ok) throw new Error("Failed to fetch issued users");
      const data = await res.json();
      setIssuedUsers(data);
    } catch (err) {
      console.error("Error fetching issued users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
    fetchUsers();
    fetchIssuedBy();
  }, [id]);

  // Handle user form input change
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    setSuccessMessage("");
  };

  // Issue book handler - creates user and issues book
  const handleIssue = async (e) => {
  e.preventDefault();

  const name = userFormData.name.trim();
  const email = userFormData.email.trim().toLowerCase();

  if (!name || !email) {
    setError("Please enter user name and email.");
    setTimeout(() => setError(null), 3000);
    return;
  }

  if (!book) {
    setError("Book information not available.");
    return;
  }

  if (book.quantityAvailable <= 0) {
    setError("No copies available.");
    return;
  }

  setIssuing(true);
  setError("");
  setSuccessMessage("");

  try {
    // Check if user exists
    let user = users.find((u) => u.email.toLowerCase() === email);

    // If user exists → apply rules
    if (user) {
      // MAX 2 BOOKS limit
      if (!canUserIssue(user)) {
        setError("This user has already issued 2 books. Limit reached.");
        setIssuing(false);
        return;
      }

      // Cannot issue same book twice
      const alreadyIssued = user.issuedBooks.some(
        (b) => b.bookId.toString() === id
      );

      if (alreadyIssued) {
        setError("This user has already issued this book.");
        setIssuing(false);
        return;
      }
    }

    // If user does NOT exist → create new user
    if (!user) {
      const createUserRes = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const created = await createUserRes.json();

      if (!createUserRes.ok) {
        setError(created.message || "Failed to create user.");
        setIssuing(false);
        return;
      }

      user = created; // new user created
    }

    // Issue the book
    const issueRes = await fetch(
      `http://localhost:5000/api/books/issue/${id}/${user._id}`,
      { method: "PUT" }
    );

    const issueData = await issueRes.json();

    if (!issueRes.ok) {
      setError(issueData.message || "Failed to issue book.");
      setIssuing(false);
      return;
    }

    // Success
    setSuccessMessage(`Book issued successfully to ${user.name}!`);
    setUserFormData({ name: "", email: "" });

    // Refresh data
    await fetchBook();
    await fetchIssuedBy();
    await fetchUsers();

    setTimeout(() => setSuccessMessage(""), 3000);
  } catch (err) {
    setError("Network error: " + err.message);
  } finally {
    setIssuing(false);
  }
};


  // Return book handler
  const handleReturn = async (userId) => {
    if (!window.confirm("Are you sure you want to return this book?")) {
      return;
    }

    setReturning((prev) => ({ ...prev, [userId]: true }));
    setError(null);
    setReturnSuccessMessage("");

    try {
      const res = await fetch(
        `http://localhost:5000/api/books/return/${id}/${userId}`,
        { method: "PUT" }
      );

      const data = await res.json();

      if (res.ok) {
        // Success
        setReturnSuccessMessage("Book returned successfully!");

        // Refresh data
        await Promise.all([fetchBook(), fetchIssuedBy()]);

        // Clear success message after 3 seconds
        setTimeout(() => setReturnSuccessMessage(""), 3000);
      } else {
        // Handle API error
        setError(data.message || "Failed to return book");
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      // Handle network error
      setError("Network error: " + err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setReturning((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <p className="text-center text-lg font-semibold text-rose-600">
            {error || "Book not found"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 w-full rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Book Details
          </h1>
          <div className="w-20"></div>
        </div>

        {/* Book Information Card */}
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-900">
                {book.bookTitle}
              </h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="font-semibold">Edition:</span>{" "}
                  {book.edition || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold">Publisher:</span>{" "}
                  {book.publisher || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold">Year:</span>{" "}
                  {book.publicationYear || "—"}
                </span>
              </div>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                Number(book.quantityAvailable) > 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {book.quantityAvailable} / {book.totalQuantity} available
            </span>
          </div>
        </div>

        {/* Issue Book Section */}
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <h3 className="mb-6 text-xl font-semibold text-slate-900">
            Issue Book to New User
          </h3>
          <p className="mb-6 text-sm text-slate-500">
            Enter user details to create a new user and issue this book to them.
          </p>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm font-semibold text-emerald-700">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-rose-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <p className="text-sm font-semibold text-rose-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleIssue} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  User Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter user name"
                  value={userFormData.name}
                  onChange={handleUserInputChange}
                  disabled={issuing}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter user email"
                  value={userFormData.email}
                  onChange={handleUserInputChange}
                  disabled={issuing}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {book.quantityAvailable <= 0 && (
                <p className="text-sm text-rose-600">
                  No copies available for issue
                </p>
              )}
              {book.quantityAvailable > 0 && <div></div>}
              <button
                type="submit"
                disabled={
                  !userFormData.name.trim() ||
                  !userFormData.email.trim() ||
                  book.quantityAvailable <= 0 ||
                  issuing
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {issuing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Creating User & Issuing...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
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
                    <span>Create User & Issue Book</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Issued Users List */}
        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">
              Currently Issued To
            </h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {issuedUsers.length} user{issuedUsers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Return Success Message */}
          {returnSuccessMessage && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm font-semibold text-emerald-700">
                  {returnSuccessMessage}
                </p>
              </div>
            </div>
          )}

          {issuedUsers.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="mt-4 text-sm font-semibold text-slate-600">
                No users have issued this book yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Issue the book to a user to see them here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      User
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Issue Date
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issuedUsers.map((user) => {
                    const issuedBook = user.issuedBooks?.find(
                      (b) => b.bookId.toString() === id
                    );
                    return (
                      <tr key={user._id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-4">
                          <p className="font-semibold text-slate-900">
                            {user.name}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                          {user.email}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                          {formatDate(issuedBook?.issueDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <button
                            onClick={() => handleReturn(user._id)}
                            disabled={returning[user._id]}
                            className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                          >
                            {returning[user._id] ? (
                              <>
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-rose-600 border-t-transparent"></div>
                                <span>Returning...</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                <span>Return</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IssuedBook;
