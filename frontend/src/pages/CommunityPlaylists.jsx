import React, { useEffect, useState } from "react";
import axios from "axios";
import { SongData } from "../context/Song";
import { UserData } from "../context/User";
import { RiPulseLine } from "react-icons/ri";

const CommunityPlaylists = () => {
  const [communityPlaylists, setCommunityPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPlaylists, setExpandedPlaylists] = useState(() => new Set());

  const { playQueue, selectedSong, isPlaying } = SongData();
  const { addToPlaylist, user } = UserData();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const { data } = await axios.get("/api/user/playlists/all");
        setCommunityPlaylists(data.playlists || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load community playlists"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const isSongSaved = (songId) => {
    if (!user || !Array.isArray(user.playlist)) return false;
    return user.playlist.includes(String(songId));
  };

  const handlePlayAll = (songs, ownerName) => {
    if (!songs.length) return;
    const label = ownerName ? `${ownerName}'s Playlist` : "Community Playlist";
    playQueue(songs, songs[0]._id, label);
  };

  const handlePlaySong = (songs, songId, ownerName) => {
    if (!songs.length) return;
    const label = ownerName ? `${ownerName}'s Playlist` : "Community Playlist";
    playQueue(songs, songId, label);
  };

  const togglePlaylist = (playlistId) => {
    setExpandedPlaylists((prev) => {
      const next = new Set(prev);
      if (next.has(playlistId)) {
        next.delete(playlistId);
      } else {
        next.add(playlistId);
      }
      return next;
    });
  };

  const renderSongRow = (song, index, songs, ownerName) => {
    const active = selectedSong === song._id;
    const saved = isSongSaved(song._id);

    return (
      <div
        key={song._id}
        className={`flex items-center justify-between px-2 md:px-4 py-2 md:py-3 rounded transition cursor-pointer active:scale-95 ${
          active ? "bg-[#1db9541a] border border-green-500" : "bg-[#1b1b1b] hover:bg-[#232323]"
        }`}
        onClick={() => handlePlaySong(songs, song._id, ownerName)}
      >
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <div className="w-6 text-center text-xs md:text-sm text-slate-400 flex-shrink-0">{index + 1}</div>
          <img
            src={song.thumbnail?.url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23333'/%3E%3C/svg%3E"}
            alt={song.title}
            className="w-10 h-10 md:w-12 md:h-12 rounded object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold flex items-center gap-2 text-sm md:text-base truncate">
              {active && (
                <RiPulseLine
                  className={`text-green-400 text-lg md:text-xl flex-shrink-0 ${
                    isPlaying ? "animate-pulse" : "opacity-60"
                  }`}
                />
              )}
              <span className="truncate">{song.title}</span>
            </p>
            <p className="text-xs md:text-sm text-slate-400 truncate">
              {song.singer || "Unknown artist"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button
            className={`p-2 rounded-full transition-all duration-200 ${
              saved ? "bg-green-500 shadow-lg" : ""
            }`}
            title={saved ? "Remove from playlist" : "Save to playlist"}
            onClick={async (event) => {
              event.stopPropagation();
              await addToPlaylist(song._id);
            }}
          >
            <img 
              src="/src/assets/like.png" 
              alt="like" 
              className="w-4 h-4 md:w-5 md:h-5"
            />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <p className="text-center text-slate-300 py-8">Loading community playlists...</p>;
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="py-4 md:py-8 space-y-6 md:space-y-10 px-2 md:px-0">
      {/* Header */}
      <header className="space-y-2">
        <p className="uppercase text-xs tracking-[0.2em] text-slate-400">Discover</p>
        <h1 className="text-2xl md:text-3xl font-bold">Community Playlists</h1>
        <p className="text-xs md:text-sm text-slate-400">
          Explore what others in the community are listening to and add them to your own queue.
        </p>
      </header>

      {communityPlaylists.length === 0 ? (
        <div className="bg-[#161616] border border-dashed border-slate-700 rounded-xl p-6 md:p-10 text-center">
          <p className="text-lg md:text-xl font-semibold mb-2">No playlists found</p>
          <p className="text-sm md:text-base text-slate-400">
            Encourage others to add songs to their playlists to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-10">
          {communityPlaylists.map((playlist) => {
            const playlistKey = String(playlist.user.id);
            const isExpanded = expandedPlaylists.has(playlistKey);

            return (
              <section
                key={playlist.user.id}
                className="bg-[#101010] rounded-xl md:rounded-2xl p-4 md:p-6 space-y-4 md:space-y-5 border border-[#1f1f1f]"
              >
                {/* Playlist Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm text-slate-400">Curated by</p>
                    <h2 className="text-xl md:text-2xl font-semibold">{playlist.user.name}</h2>
                    <p className="text-xs md:text-sm text-slate-400">
                      {playlist.totalSongs} track{playlist.totalSongs === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex gap-2 md:gap-3 flex-wrap">
                    <button
                      className="border border-slate-600 text-slate-100 px-3 md:px-5 py-2 rounded-full text-xs md:text-sm hover:border-white transition"
                      onClick={() => togglePlaylist(playlistKey)}
                    >
                      {isExpanded ? "Collapse" : "Expand"}
                    </button>
                    <button
                      className="bg-green-500 text-black font-semibold px-3 md:px-5 py-2 rounded-full text-xs md:text-sm"
                      disabled={playlist.totalSongs === 0}
                      onClick={() => handlePlayAll(playlist.songs, playlist.user.name)}
                    >
                      Play All
                    </button>
                  </div>
                </div>

                {/* Playlist Preview/Content */}
                {!isExpanded && (
                  <p className="text-xs md:text-sm text-slate-500">
                    {playlist.totalSongs === 0
                      ? "No songs saved yet."
                      : "Expand to peek at their full tracklist."}
                  </p>
                )}

                {isExpanded && (
                  <>
                    {playlist.totalSongs === 0 ? (
                      <p className="text-xs md:text-sm text-slate-400">No songs saved yet.</p>
                    ) : (
                      <div className="space-y-2 md:space-y-3">
                        {playlist.songs.map((song, index) =>
                          renderSongRow(song, index, playlist.songs, playlist.user.name)
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommunityPlaylists;
