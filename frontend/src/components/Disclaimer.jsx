import React from "react";

const Disclaimer = () => {
  return (
    <div className="bg-gray-900 text-gray-300 text-xs py-4 px-6 border-t border-gray-700">
      <p className="text-center mb-2">
        <span className="font-semibold text-yellow-500">⚠️ Disclaimer:</span>
      </p>
      <p className="text-center max-w-4xl mx-auto leading-relaxed">
        All songs available on this platform are sourced from{" "}
        <span className="text-blue-400 font-semibold">sensongsmp3.live</span>. This platform is
        for educational and personal use only. We do not claim ownership of any music content. All
        musical works, including compositions, lyrics, and recordings, are the intellectual
        property of their respective authors, composers, and copyright holders. If you believe
        your copyright has been infringed, please contact us immediately. We are committed to
        respecting intellectual property rights and will promptly address any copyright concerns.
        Users are responsible for ensuring they have the right to use this content in their
        jurisdiction.
      </p>
    </div>
  );
};

export default Disclaimer;
