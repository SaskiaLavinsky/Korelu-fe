import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => setActive(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkClass = ({ isActive }) =>
    `sm:text-lg text-base font-medium transition ${
      isActive ? "text-cyan-700 font-semibold" : "hover:text-cyan-700"
    }`;

  return (
    <div className="navbar sticky top-0 z-50 bg-white/70 backdrop-blur-md py-5 flex items-center justify-between shadow-sm">
      <div className="logo">
        <h1 className="pl-6 text-2xl md:text-3xl font-bold text-cyan-700">KORELU</h1>
      </div>

      <ul
        className={`menu w-max pr-6 pl-6 flex items-center gap-6 md:static fixed left-1/2 -translate-x-1/2 
        md:-translate-x-0 md:opacity-100 bg-white/70 backdrop-blur-md p-3 rounded-br-2xl
        rounded-bl-2xl md:bg-transparent transition-all md:transition-none
        ${active ? "top-0 opacity-100" : "-top-10 opacity-0"}`}
      >
        <li><NavLink to="/" className={linkClass}>About</NavLink></li>
        <li><NavLink to="/koreksi-teks" className={linkClass}>Koreksi Kalimat</NavLink></li>
        <li><NavLink to="/koreksi-dok" className={linkClass}>Koreksi Dokumen</NavLink></li>
      </ul>
    </div>
  );
};

export default Navbar;
