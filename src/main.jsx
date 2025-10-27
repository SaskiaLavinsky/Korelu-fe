import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import KoreksiKalimat from "./pages/KoreksiKalimat.jsx";
import KoreksiDokumen from "./pages/KoreksiDokumen.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* App.jsx menjadi layout utama (Navbar + Footer) */}
        <Route element={<App />}>
          <Route path="/" element={<AboutPage />} />
          <Route path="/koreksi-teks" element={<KoreksiKalimat />} />
          <Route path="/koreksi-dok" element={<KoreksiDokumen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
