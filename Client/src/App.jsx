import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import IssuedBooks from "./pages/IssuedBooks";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:id" element={<IssuedBooks />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
