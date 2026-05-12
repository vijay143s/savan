import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SongData } from "../context/Song";

const Home = () => {
  const { homeData, fetchHome, loading } = SongData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!homeData) fetchHome();
  }, []);

  const handleCardClick = (item) => {
    navigate(`/album/${item.id}`);
  };

  if (loading && !homeData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-32">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
        Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"} 🎵
      </h1>

      {/* New Albums */}
      {homeData?.new_albums?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">New Releases</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {homeData.new_albums.map((album) => (
              <div
                key={album.id}
                className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition cursor-pointer group"
                onClick={() => handleCardClick(album)}
              >
                <div className="relative mb-3">
                  <img src={album.image} alt={album.title} className="w-full aspect-square object-cover rounded-md" loading="lazy" />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-green-500 text-black rounded-full p-3 shadow-lg hover:scale-105 transition">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
                <p className="text-white text-sm font-semibold truncate">{album.title}</p>
                <p className="text-gray-400 text-xs truncate mt-1">{album.subtitle || album.language}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Charts */}
      {homeData?.charts?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Top Charts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {homeData.charts.map((chart) => (
              <div
                key={chart.id}
                className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition cursor-pointer group"
                onClick={() => handleCardClick(chart)}
              >
                <div className="relative mb-3">
                  <img src={chart.image} alt={chart.title} className="w-full aspect-square object-cover rounded-md" loading="lazy" />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-green-500 text-black rounded-full p-3 shadow-lg hover:scale-105 transition">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
                <p className="text-white text-sm font-semibold truncate">{chart.title}</p>
                <p className="text-gray-400 text-xs truncate mt-1">{chart.subtitle}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Playlists */}
      {homeData?.playlists?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Featured Playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {homeData.playlists.slice(0, 12).map((pl) => (
              <div
                key={pl.id}
                className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition cursor-pointer group"
                onClick={() => handleCardClick(pl)}
              >
                <div className="relative mb-3">
                  <img src={pl.image} alt={pl.title} className="w-full aspect-square object-cover rounded-md" loading="lazy" />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-green-500 text-black rounded-full p-3 shadow-lg hover:scale-105 transition">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
                <p className="text-white text-sm font-semibold truncate">{pl.title}</p>
                <p className="text-gray-400 text-xs truncate mt-1">{pl.subtitle}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
