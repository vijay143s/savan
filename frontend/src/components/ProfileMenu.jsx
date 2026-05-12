import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../context/User";
import { FaSignOutAlt } from "react-icons/fa";

const ProfileMenu = () => {
  const navigate = useNavigate();
  const { user, logoutUser } = UserData();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Community", path: "/community", icon: "🎵" },
    { label: "My Playlist", path: "/playlist", icon: "📑" },
    ...(user?.role === "admin" ? [{ label: "Admin Dashboard", path: "/admin", icon: "⚙️" }] : []),
  ];

  const handleLogout = () => {
    logoutUser(navigate);
    setIsOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-black font-bold hover:bg-green-400 transition-all duration-200 active:scale-95 text-lg shadow-lg"
      >
        {user?.name?.[0]?.toUpperCase() || "U"}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-56 bg-[#1b1b1b] text-white rounded-lg shadow-xl z-50 border border-slate-700">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="font-semibold truncate text-white">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role || "User"}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigate(item.path)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-[#2a2a2a] transition-colors flex items-center gap-3 text-white"
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <div className="border-t border-slate-700 p-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#2a1a1a] transition-colors flex items-center gap-3 rounded"
            >
              <FaSignOutAlt size={14} />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default ProfileMenu;
