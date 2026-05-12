import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Player from "./Player";
import MobileBottomNav from "./MobileBottomNav";
import Disclaimer from "./Disclaimer";

const Layout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-80 xl:w-60 flex-shrink-0">
          <Sidebar />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* pb-40 on mobile: reserves space for player (~100px) + bottom nav (~64px) */}
          <div className="flex-1 overflow-y-auto bg-[#121212] text-white pb-40 lg:pb-0">
            <div className="w-full lg:px-6 pt-2 md:pt-4 pb-2">
              <Navbar />
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom stack on mobile: Player on top, BottomNav beneath */}
      <div className="flex-shrink-0">
        <Player />
        <div className="lg:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
};

export default Layout;
