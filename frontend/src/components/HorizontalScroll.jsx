import React from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

const HorizontalScroll = ({ title, items, renderItem, onMoreClick, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-40 h-48 bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {onMoreClick && (
          <button
            onClick={onMoreClick}
            className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors font-semibold text-sm"
          >
            More <FaChevronRight size={14} />
          </button>
        )}
      </div>

      {items && items.length > 0 ? (
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-4 w-max">
            {items.map((item, index) => (
              <div key={index} className="flex-shrink-0">
                {renderItem(item)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-center py-8">
          No {title.toLowerCase()} available
        </div>
      )}
    </div>
  );
};

export default HorizontalScroll;
