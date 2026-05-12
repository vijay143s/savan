import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Reusable card component
const MediaCard = ({ item, onClick }) => (
  <div
    className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
    onClick={() => onClick(item)}
  >
    <div className="relative mb-3">
      <img
        src={item.image}
        alt={item.title}
        className="w-full aspect-square object-cover rounded-lg shadow-md"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
        <button className="bg-green-500 text-black rounded-full p-2.5 shadow-xl hover:scale-105 hover:bg-green-400 transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
    <p className="text-white text-sm font-semibold truncate leading-tight">{item.title}</p>
    <p className="text-gray-400 text-xs truncate mt-0.5">{item.subtitle || item.artist || item.language}</p>
  </div>
);

// Horizontal scroll section
const Section = ({ title, emoji, items, onCardClick }) => {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
        {emoji && <span>{emoji}</span>}
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} onClick={onCardClick} />
        ))}
      </div>
    </section>
  );
};

// Skeleton loader
const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mb-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white/5 rounded-xl p-3 animate-pulse">
        <div className="w-full aspect-square bg-white/10 rounded-lg mb-3" />
        <div className="h-3 bg-white/10 rounded mb-2" />
        <div className="h-2 bg-white/5 rounded w-2/3" />
      </div>
    ))}
  </div>
);

const Home = () => {
  const [teluguData, setTeluguData] = useState(null);
  const [loading, setLoading]       = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/telugu/home");
        setTeluguData(data);
      } catch (err) {
        console.error("Failed to load Telugu home:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCardClick = (item) => navigate(`/album/${item.id}`);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="px-4 md:px-6 py-4 pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {greeting} 🎶
        </h1>
        <p className="text-gray-400 text-sm mt-1">Your Telugu music — charts, playlists & albums</p>
      </div>

      {loading ? (
        <>
          <div className="h-5 bg-white/10 rounded w-40 mb-4 animate-pulse" />
          <SkeletonGrid count={6} />
          <div className="h-5 bg-white/10 rounded w-40 mb-4 animate-pulse" />
          <SkeletonGrid count={6} />
          <div className="h-5 bg-white/10 rounded w-40 mb-4 animate-pulse" />
          <SkeletonGrid count={6} />
        </>
      ) : (
        <>
          <Section
            title="Trending Charts"
            emoji="🔥"
            items={teluguData?.charts}
            onCardClick={handleCardClick}
          />
          <Section
            title="Featured Playlists"
            emoji="🎵"
            items={teluguData?.featured_playlists}
            onCardClick={handleCardClick}
          />
          <Section
            title="Top Playlists"
            emoji="⭐"
            items={teluguData?.top_playlists}
            onCardClick={handleCardClick}
          />
          <Section
            title="New Releases"
            emoji="💿"
            items={teluguData?.new_albums}
            onCardClick={handleCardClick}
          />
          <Section
            title="Trending Albums"
            emoji="📈"
            items={teluguData?.trending}
            onCardClick={handleCardClick}
          />
        </>
      )}
    </div>
  );
};

export default Home;
