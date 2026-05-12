import React from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { UserData } from "../context/User";

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const { user } = UserData();

  const menuItems = [
    { icon: assets.home_icon, label: "Home", path: "/" },
    { icon: assets.search_icon, label: "Search", path: "/search" },
    { icon: assets.stack_icon, label: "Queue", path: "/queue" },
    { icon: assets.plays_icon, label: "Playlist", path: "/playlist" },
  ];

  return (
    <div className="w-full bg-[#121212] border-t border-white/10 z-30">
      <div className="grid grid-cols-4 gap-0">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center py-3 px-2 hover:bg-white/5 transition-colors active:bg-white/10"
          >
            <img src={item.icon} alt={item.label} className="w-6 h-6 mb-1" />
            <span className="text-xs text-gray-300">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;
