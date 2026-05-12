import axios from "axios";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const SongContext = createContext();

export const SongProvider = ({ children }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [songLoading, setSongLoading] = useState(false);

  const [selectedSong, setSelectedSong] = useState(null);
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [queueLabel, setQueueLabel] = useState("Search Results");

  const [albums, setAlbums] = useState([]);
  const [albumSong, setAlbumSong] = useState([]);
  const [albumData, setAlbumData] = useState(null);

  // Homepage data
  const [homeData, setHomeData] = useState(null);

  const getSongId = (item) => {
    if (!item) return null;
    if (typeof item === "string") return item;
    return item.id || item._id || null;
  };

  // ─── Fetch Homepage Data ─────────────────────────────────────────────
  async function fetchHome() {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/home");
      setHomeData(data);
      // Use new_albums as albums list
      setAlbums(data.new_albums || []);
    } catch (error) {
      console.error("Error fetching home:", error);
    } finally {
      setLoading(false);
    }
  }

  // ─── Search Songs ────────────────────────────────────────────────────
  async function searchSongs(query, page = 1, limit = 30) {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/search", {
        params: { q: query, page, limit },
      });
      const results = data.results || [];
      setSongs(results);
      return results;
    } catch (error) {
      console.error("Search error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  // ─── Fetch Single Song ───────────────────────────────────────────────
  async function fetchSingleSong() {
    if (!selectedSong) return;
    try {
      setSongLoading(true);
      const { data } = await axios.get(`/api/song/${selectedSong}`);
      setSong(data);
    } catch (error) {
      console.error("Error fetching song:", error);
    } finally {
      setSongLoading(false);
    }
  }

  useEffect(() => {
    fetchSingleSong();
  }, [selectedSong]);

  // ─── Fetch Album/Playlist ────────────────────────────────────────────
  async function fetchAlbumSong(id) {
    try {
      setLoading(true);
      setAlbumSong([]);
      setAlbumData(null);

      // Try as album first
      const { data } = await axios.get(`/api/album/${id}`);

      // If album returned songs, use it
      if (data.songs && data.songs.length > 0) {
        setAlbumSong(data.songs);
        setAlbumData(data);
        return;
      }

      // Otherwise try as playlist (charts, featured playlists, etc.)
      const { data: plData } = await axios.get(`/api/playlist/${id}`);
      if (plData.songs && plData.songs.length > 0) {
        setAlbumSong(plData.songs);
        setAlbumData(plData);
        return;
      }

      // If album had a title but no songs, still show it
      if (data.title) {
        setAlbumData(data);
      }
    } catch (error) {
      console.error("Error fetching album/playlist:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAlbums() {
    // Albums come from homepage data
    if (!homeData) {
      await fetchHome();
    }
  }

  // ─── Queue / Playback ────────────────────────────────────────────────
  const playQueue = (collection = [], startSongId, label = "Queue") => {
    if (!collection.length) return;

    const targetId = startSongId ? String(startSongId) : null;
    const startIndex = targetId
      ? collection.findIndex((item) => getSongId(item) === targetId)
      : 0;
    const safeIndex = startIndex === -1 ? 0 : startIndex;

    setQueue(collection);
    setQueueLabel(label);
    setQueueIndex(safeIndex);

    const nextSongId = getSongId(collection[safeIndex]);
    if (nextSongId) {
      setSelectedSong(nextSongId);
      setIsPlaying(true);
    }
  };

  const playFromSongs = (songId) => playQueue(songs, songId, "Search Results");

  const jumpToIndex = (index) => {
    if (!queue.length) return;
    if (index < 0 || index >= queue.length) return;
    const songId = getSongId(queue[index]);
    if (!songId) return;
    setQueueIndex(index);
    setSelectedSong(songId);
    setIsPlaying(true);
  };

  const nextMusic = (mode = "manual") => {
    if (!queue.length) return;
    if (queueIndex >= queue.length - 1) {
      if (mode === "manual") {
        jumpToIndex(0); // Loop
      } else {
        setIsPlaying(false); // Stop at end
      }
      return;
    }
    jumpToIndex(queueIndex + 1);
  };

  const prevMusic = () => {
    if (!queue.length) return;
    const nextIndex = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    jumpToIndex(nextIndex);
  };

  // ─── Suggestions ─────────────────────────────────────────────────────
  async function fetchSuggestions(songId) {
    try {
      const { data } = await axios.get(`/api/suggestions/${songId}`);
      return data || [];
    } catch {
      return [];
    }
  }

  // Load homepage on mount
  useEffect(() => {
    fetchHome();
  }, []);

  // ─── Fetch Multiple Songs (Liked) ───────────────────────────────────
  async function fetchSongsByIds(ids) {
    if (!ids || ids.length === 0) return [];
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/songs?ids=${ids.join(",")}`);
      return data || [];
    } catch (error) {
      console.error("Error fetching songs by ids:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return (
    <SongContext.Provider
      value={{
        songs,
        setSongs,
        loading,
        songLoading,
        albums,
        song,
        selectedSong,
        setSelectedSong,
        isPlaying,
        setIsPlaying,
        queue,
        queueLabel,
        queueIndex,
        playQueue,
        playFromSongs,
        nextMusic,
        prevMusic,
        fetchSingleSong,
        fetchAlbumSong,
        fetchSongsByIds,
        albumSong,
        albumData,
        fetchSongs: searchSongs,
        fetchAlbums,
        searchSongs,
        homeData,
        fetchHome,
        fetchSuggestions,
        // Keep these for compatibility
        addAlbum: () => {},
        addSong: () => {},
        addThumbnail: () => {},
        deleteSong: () => {},
      }}
    >
      {children}
    </SongContext.Provider>
  );
};

export const SongData = () => useContext(SongContext);
