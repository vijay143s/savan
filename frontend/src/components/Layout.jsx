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
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-80 xl:w-60 flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* Content Area - with bottom padding on mobile to account for nav + player */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto bg-[#121212] text-white pb-28 lg:pb-0">
            <div className="w-full lg:px-6 pt-2 md:pt-4 pb-2">
              <Navbar />
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Player - always visible, above bottom nav on mobile */}
      <div className="order-2 lg:order-1">
        <Player />
      </div>

      {/* Mobile Bottom Navigation (visible on mobile only) - positioned above player on mobile */}
      <div className="lg:hidden order-3">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default Layout;
