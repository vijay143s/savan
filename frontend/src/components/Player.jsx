import React, { useEffect, useMemo, useRef, useState } from "react";
import { SongData } from "../context/Song";
import { UserData } from "../context/User";
import { GrChapterNext, GrChapterPrevious } from "react-icons/gr";
import { FaPause, FaPlay } from "react-icons/fa";
import { FaShuffle } from "react-icons/fa6";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

const Player = () => {
  const {
    song,
    fetchSingleSong,
    selectedSong,
    isPlaying,
    setIsPlaying,
    nextMusic,
    prevMusic,
    queue,
  } = SongData();

  const { addToPlaylist, isLiked } = UserData();

  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);

  const songIsLiked = useMemo(() => {
    return song?.id ? isLiked(song.id) : false;
  }, [song, isLiked]);

  const handleAddToPlaylist = (e) => {
    if (e) e.stopPropagation();
    if (song?.id) addToPlaylist(song.id);
  };

  useEffect(() => {
    fetchSingleSong();
  }, [selectedSong]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleShuffle = () => {
    if (queue.length > 0) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      const randomSong = queue[randomIndex];
      const songId = randomSong.id || randomSong._id;
      if (songId) {
        nextMusic("manual");
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetaData = () => setDuration(audio.duration || 0);
    const handleTimeUpdate = () => setProgress(audio.currentTime || 0);
    const handleEnded = () => nextMusic("auto");

    audio.addEventListener("loadedmetadata", handleLoadedMetaData);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetaData);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [song, nextMusic]);

  const handleProgressChange = (e) => {
    if (!audioRef.current) return;
    const newTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  const formatTime = (time) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // JioSaavn data shape: song.url, song.image, song.artist
  const audioUrl = song?.url || "";
  const artwork = song?.image || "";
  const title = song?.title || "Select a song";
  const artist = song?.artist || "";

  return (
    <div>
      {song && (
        <div className="bg-black border-t border-white/10 text-white px-3 md:px-4 py-2 md:py-3 lg:pb-4 z-20 relative">
          {/* Audio Element */}
          {audioUrl && (
            <>
              {isPlaying ? (
                <audio ref={audioRef} src={audioUrl} autoPlay />
              ) : (
                <audio ref={audioRef} src={audioUrl} />
              )}
            </>
          )}

          {/* Mobile Player (Compact) */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={artwork || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23333'/%3E%3C/svg%3E"}
                className="w-10 h-10 rounded"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{title}</p>
                <p className="text-xs text-gray-400 truncate">{artist}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs text-gray-400">{formatTime(progress)}</span>
              <input type="range" min="0" max="100" className="progress-bar flex-1" value={progressPercent} onChange={handleProgressChange} />
              <span className="text-xs text-gray-400">{formatTime(duration)}</span>
            </div>

            {/* Mobile Controls */}
            <div className="flex justify-center items-center gap-6">
              <span className="cursor-pointer text-lg hover:text-green-400 transition" onClick={prevMusic}><GrChapterPrevious /></span>
              <button className="bg-green-500 text-black rounded-full p-3 hover:bg-green-400 transition active:scale-95" onClick={handlePlayPause}>
                {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
              </button>
              <span className="cursor-pointer text-lg hover:text-green-400 transition" onClick={() => nextMusic("manual")}><GrChapterNext /></span>
              <span className="cursor-pointer text-lg hover:text-green-400 transition" onClick={handleShuffle} title="Shuffle"><FaShuffle /></span>
              <button className="cursor-pointer text-lg hover:scale-110 transition active:scale-95" onClick={handleAddToPlaylist} title={songIsLiked ? "Liked" : "Like"}>
                {songIsLiked ? <AiFillHeart className="text-red-500" size={22} /> : <AiOutlineHeart className="text-white hover:text-red-500" size={22} />}
              </button>
            </div>
          </div>

          {/* Desktop Player (Full) */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-1/4">
              <img
                src={artwork || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%23333'/%3E%3C/svg%3E"}
                className="w-12 h-12 rounded"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{title}</p>
                <p className="text-xs text-gray-400 truncate">{artist}</p>
              </div>
              <button className="cursor-pointer hover:scale-110 transition active:scale-95" onClick={handleAddToPlaylist} title={songIsLiked ? "Liked" : "Like"}>
                {songIsLiked ? <AiFillHeart className="text-red-500" size={24} /> : <AiOutlineHeart className="text-white hover:text-red-500" size={24} />}
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full flex items-center justify-center gap-4">
                <span className="cursor-pointer hover:text-green-400 transition" onClick={prevMusic}><GrChapterPrevious size={20} /></span>
                <button className="bg-white text-black rounded-full p-2 hover:scale-105 transition active:scale-95" onClick={handlePlayPause}>
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <span className="cursor-pointer hover:text-green-400 transition" onClick={() => nextMusic("manual")}><GrChapterNext size={20} /></span>
                <span className="cursor-pointer hover:text-green-400 transition" onClick={handleShuffle} title="Shuffle"><FaShuffle size={20} /></span>
              </div>
              <div className="w-full flex items-center gap-2 text-xs text-gray-400">
                <span>{formatTime(progress)}</span>
                <input type="range" min="0" max="100" className="progress-bar flex-1" value={progressPercent} onChange={handleProgressChange} />
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="w-1/4 flex justify-end items-center">
              <input type="range" className="w-24" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
