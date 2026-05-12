import React from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const AlbumItem = ({ image, name, desc, id, showBackButton = false }) => {
  const navigate = useNavigate();
  
  const handleAlbumClick = (e) => {
    e.stopPropagation();
    navigate("/album/" + id);
  };

  const handleBackClick = (e) => {
    e.stopPropagation();
    navigate(-1);
  };

  return (
    <div className="bg-[#1c1c1c] rounded-lg p-2 md:p-4 cursor-pointer hover:bg-[#2a2a2a] transition flex flex-col active:scale-95 relative">
      {showBackButton && (
        <button
          onClick={handleBackClick}
          className="absolute top-2 left-2 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
        >
          <img src={assets.arrow_left} alt="Back" className="w-4 h-4" />
        </button>
      )}
      
      <div onClick={handleAlbumClick} className="w-full">
        <div className="aspect-square w-full overflow-hidden rounded">
          <img src={image} className="w-full h-full object-cover hover:scale-105 transition" alt="" />
        </div>
        <p className="font-bold mt-2 md:mt-4 mb-1 truncate text-sm md:text-base">{name}</p>
      </div>
    </div>
  );
};

export default AlbumItem;
