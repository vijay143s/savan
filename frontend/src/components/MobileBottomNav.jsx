import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import { UserData } from "../context/User";

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = UserData();

  const menuItems = [
    { icon: assets.home_icon, label: "Home", path: "/" },
    { icon: assets.search_icon, label: "Search", path: "/search" },
    { icon: assets.like_icon, label: "Liked", path: "/liked" },
    { icon: null, label: "Hindi", path: "/hindi", emoji: "🇮🇳" },
  ];

  return (
    <div className="w-full bg-[#121212] border-t border-white/10 z-30">
      <div className="grid grid-cols-4 gap-0">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-3 px-1 transition-colors active:bg-white/10 ${
                isActive ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              {item.emoji ? (
                <span className="text-xl mb-1 leading-none">{item.emoji}</span>
              ) : (
                <img src={item.icon} alt={item.label} className="w-5 h-5 mb-1" />
              )}
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-green-400" : "text-gray-300"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
