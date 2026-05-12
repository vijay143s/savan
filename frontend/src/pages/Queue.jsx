import React from "react";
import { SongData } from "../context/Song";
import { FaPlay, FaPause } from "react-icons/fa";

const Queue = () => {
  const { queue, queueIndex, queueLabel, selectedSong, isPlaying, playQueue } = SongData();

  const handlePlay = (index) => {
    if (queue[index]) {
      const songId = queue[index].id || queue[index]._id;
      playQueue(queue, songId, queueLabel);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-4 md:p-6 pb-32">
      <h1 className="text-2xl font-bold text-white mb-2">Queue</h1>
      <p className="text-gray-400 text-sm mb-6">{queueLabel} · {queue.length} songs</p>

      {queue.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Your queue is empty</p>
          <p className="text-gray-500 text-sm mt-2">Search for songs or browse albums to start playing</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Now Playing */}
          {queue[queueIndex] && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Now Playing</p>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10">
                <img
                  src={queue[queueIndex].image || ""}
                  alt=""
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-green-500 text-sm font-semibold truncate">{queue[queueIndex].title}</p>
                  <p className="text-gray-400 text-xs truncate">{queue[queueIndex].artist}</p>
                </div>
                {isPlaying ? <FaPause className="text-green-500" /> : <FaPlay className="text-green-500" />}
              </div>
            </div>
          )}

          {/* Up Next */}
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Up Next</p>
          {queue.map((song, index) => {
            if (index === queueIndex) return null;
            const isCurrent = song.id === selectedSong;
            return (
              <div
                key={`${song.id}-${index}`}
                className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/10 transition cursor-pointer group ${isCurrent ? "bg-white/10" : ""}`}
                onClick={() => handlePlay(index)}
              >
                <span className="w-6 text-center text-xs text-gray-500">{index + 1}</span>
                <img
                  src={song.image || ""}
                  alt=""
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{song.title}</p>
                  <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                </div>
                <span className="text-gray-500 text-xs">{formatDuration(song.duration)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Queue;
