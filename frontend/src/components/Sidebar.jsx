import React from "react";
import { NavLink } from "react-router-dom";
import { GoHome } from "react-icons/go";
import { IoSearch } from "react-icons/io5";
import { FaMusic, FaHeart, FaIndianRupeeSign } from "react-icons/fa6";
import { MdQueueMusic } from "react-icons/md";

const Sidebar = () => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${
      isActive
        ? "bg-white/10 text-white"
        : "text-gray-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-black border-r border-white/10 p-4 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-3 mb-4">
        <FaMusic className="text-green-500" size={24} />
        <span className="text-white text-xl font-bold">Savana Music</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        <NavLink to="/" className={linkClass}>
          <GoHome size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/search" className={linkClass}>
          <IoSearch size={22} />
          <span>Search</span>
        </NavLink>
        <NavLink to="/queue" className={linkClass}>
          <MdQueueMusic size={22} />
          <span>Queue</span>
        </NavLink>
        <NavLink to="/liked" className={linkClass}>
          <FaHeart size={18} className="ml-0.5 mr-0.5" />
          <span>Liked Songs</span>
        </NavLink>
        <NavLink to="/hindi" className={linkClass}>
          <FaIndianRupeeSign size={18} className="ml-0.5 mr-0.5" />
          <span>Hindi Music</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-gray-500 text-xs px-4">
          Powered by JioSaavn
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
