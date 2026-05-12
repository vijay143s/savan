import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  // Always authenticated — no login needed for JioSaavn streaming
  const isAuth = true;

  // Liked songs stored in localStorage
  const [likedSongs, setLikedSongs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("likedSongs") || "[]");
    } catch {
      return [];
    }
  });

  // Persist liked songs to localStorage
  useEffect(() => {
    localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
  }, [likedSongs]);

  const addToPlaylist = (songId) => {
    setLikedSongs((prev) => {
      const id = String(songId);
      if (prev.includes(id)) {
        // Unlike — remove from list
        return prev.filter((s) => s !== id);
      }
      // Like — add to list
      return [id, ...prev];
    });
  };

  const isLiked = (songId) => {
    return likedSongs.includes(String(songId));
  };

  // Fake user object for compatibility with existing components
  const user = {
    _id: "local-user",
    name: "Music Lover",
    playlist: likedSongs,
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        isAuth,
        likedSongs,
        addToPlaylist,
        isLiked,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const UserData = () => useContext(UserContext);
