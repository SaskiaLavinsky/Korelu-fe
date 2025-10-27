import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar />
      <Outlet />
      <footer className="text-center text-xs text-gray-500 py-6">
        © {new Date().getFullYear()} — Program Skripsi Saskia Lavinsky • Universitas Tarumanagara
      </footer>
    </div>
  );
}
