import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AlbumItem from "../components/AlbumItem";
import Loading from "../components/Loading";
import { SongData } from "../context/Song";
import { UserData } from "../context/User";
import { RiPulseLine } from "react-icons/ri";
import { assets } from "../assets/assets";

const SearchResults = () => {
  const { type, id, name } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [albumData, setAlbumData] = useState(null);
  const [artistData, setArtistData] = useState(null);
  
  const { playQueue, selectedSong, isPlaying } = SongData();
  const { addToPlaylist, user } = UserData();
  const playlistIds = Array.isArray(user?.playlist) ? user.playlist : [];

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        let response;
        let finalName = name;

        if (type === "album" && id) {
          response = await axios.get(`/api/home/albums/${id}/songs`);
          if (response?.data?.data && response.data.data.length > 0) {
            // Get album info from first song
            const firstSong = response.data.data[0];
            const albumInfo = {
              title: "Album", // Default fallback
              thumbnail: firstSong.thumbnail
            };
            // Try to get album title from song data or make another API call
            try {
              const albumResponse = await axios.get(`/api/song/album/${id}`);
              if (albumResponse.data.album) {
                albumInfo.title = albumResponse.data.album.title;
                albumInfo.thumbnail = albumResponse.data.album.thumbnail;
              }
            } catch (err) {
              console.log("Could not fetch album details");
            }
            setAlbumData(albumInfo);
            setTitle(`Songs from ${albumInfo.title}`);
          } else {
            setTitle(`Songs from Album`);
          }
        } else if (type === "artist" && id) {
          response = await axios.get(`/api/home/artists/${id}/albums`);
          let artistName = "Artist"; // Default fallback
          
          // Try to get artist name from optimized search endpoint first (covers all artists)
          try {
            const artistsResponse = await axios.get(`/api/home/search/artists`);
            const artist = artistsResponse.data.find(a => 
              a.artistId === parseInt(id) || a.artistId.toString() === id
            );
            if (artist) {
              artistName = artist.artistName;
            }
          } catch (err) {
            // Search endpoint failed - will try other methods below
          }
          
          // If still not found, try paginated artists endpoint
          if (artistName === "Artist") {
            try {
              const paginatedResponse = await axios.get(`/api/home/artists?page=1&limit=100`);
              const artist = paginatedResponse.data.data.find(a => 
                a.artistId === parseInt(id) || a.artistId.toString() === id
              );
              if (artist) {
                artistName = artist.artistName;
              }
            } catch (err) {
              // Still not found
            }
          }
          
          // If still not found, try top artists list
          if (artistName === "Artist") {
            try {
              const topArtistsResponse = await axios.get('/api/home/artists/top?limit=100');
              const artist = topArtistsResponse.data.data.find(a => 
                a.artistId === parseInt(id) || a.artistId.toString() === id
              );
              if (artist) {
                artistName = artist.artistName;
              }
            } catch (err) {
              // Still not found
            }
          }
          
          // Final fallback: if we have album data and still no artist name, 
          // extract from star cast (this handles cases where artist is in cast but not main artist)
          if (artistName === "Artist" && response?.data?.length > 0) {
            const albumsData = response.data;
            // Look through albums to find a consistent artist name in starCast
            const artistNames = new Set();
            albumsData.forEach(album => {
              if (album.starCast) {
                const castList = album.starCast.split(',').map(name => name.trim());
                castList.forEach(name => artistNames.add(name));
              }
            });
            // If we only have one unique name appearing in all albums, use it
            if (artistNames.size === 1) {
              artistName = Array.from(artistNames)[0];
            } else if (artistNames.size > 1) {
              // Try to find the most common name
              const nameCount = {};
              albumsData.forEach(album => {
                if (album.starCast) {
                  const castList = album.starCast.split(',').map(name => name.trim());
                  castList.forEach(name => {
                    nameCount[name] = (nameCount[name] || 0) + 1;
                  });
                }
              });
              const mostCommon = Object.entries(nameCount).sort((a, b) => b[1] - a[1])[0];
              if (mostCommon && mostCommon[1] === albumsData.length) {
                artistName = mostCommon[0];
              }
            }
          }
          
          const artistInfo = {
            name: artistName,
            thumbnail: null
          };
          setArtistData(artistInfo);
          setTitle(`Albums by ${artistName}`);
        } else if (type === "singer") {
          finalName = decodeURIComponent(id);
          response = await axios.get(
            `/api/home/singers/${encodeURIComponent(finalName)}/songs`
          );
          setTitle(`Songs by ${finalName}`);
        } else if (type === "director") {
          finalName = decodeURIComponent(id);
          response = await axios.get(
            `/api/home/music-directors/${encodeURIComponent(finalName)}/albums`
          );
          
          // Try to get actual director name
          let directorName = finalName;
          try {
            const directorsResponse = await axios.get('/api/home/music-directors/top?limit=100');
            const director = directorsResponse.data.data.find(d => 
              d.directorName.toLowerCase() === finalName.toLowerCase()
            );
            if (director) {
              directorName = director.directorName;
            }
          } catch (err) {
            console.log("Could not fetch director details");
          }
          
          const directorInfo = {
            name: directorName,
            thumbnail: null
          };
          setArtistData(directorInfo); // Reuse artistData state for director header
          setTitle(`Albums by Music Director ${directorName}`);
        }

        setResults(response?.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch results:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [type, id, name]);

  const startSongQueue = (songId) => {
    if (!results || results.length === 0) return;
    const label = type === "album" ? `Album Queue` : `${title} Queue`;
    playQueue(results, songId, label);
  };

  const savePlayListHandler = (id) => {
    addToPlaylist(id);
  };

  if (loading) return <Loading />;

  return (
    <div className="w-full px-4 md:px-6 py-4">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors mb-6"
        >
          <img src={assets.arrow_left} alt="Back" className="w-4 h-4" />
        </button>
        
        {type === "album" && albumData ? (
          <div className="flex items-center gap-6">
            {albumData.thumbnail && (
              <img
                src={albumData.thumbnail.url}
                className="w-20 h-20 md:w-24 md:h-24 rounded-lg shadow-lg"
                alt={albumData.title}
              />
            )}
            <div>
              <p className="text-sm text-gray-400 mb-2">ALBUM</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">{albumData.title}</h1>
            </div>
          </div>
        ) : (type === "artist" || type === "director") && artistData ? (
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 md:w-24 md:h-24 ${
              type === "director" 
                ? "bg-gradient-to-br from-purple-400 to-purple-600" 
                : "bg-gradient-to-br from-green-400 to-green-600"
            } rounded-full flex items-center justify-center shadow-lg`}>
              <span className="text-2xl md:text-3xl font-bold text-black">
                {artistData.name?.[0]?.toUpperCase() || (type === "director" ? "M" : "A")}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">{type === "director" ? "MUSIC DIRECTOR" : "ARTIST"}</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">{artistData.name}</h1>
            </div>
          </div>
        ) : (
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">{title}</h1>
        )}
      </div>

      {results.length > 0 ? (
        <div>
          {type === "artist" || type === "director" ? (
            <div className={`grid gap-4 ${
              type === "artist" 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}>
              {results.map((album) => {
                const albumId = String(album._id || album.id);
                return (
                  <AlbumItem
                    key={albumId}
                    image={album.thumbnail?.url}
                    name={album.title}
                    desc={album.description}
                    id={albumId}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((song, index) => {
                const isActive = selectedSong === song._id;
                return (
                  <div
                    key={song._id}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#ffffff1a] active:scale-[0.99] ${
                      isActive ? "bg-[#1db9541a] border border-green-500" : "bg-[#0a0a0a]/50"
                    }`}
                    onClick={() => startSongQueue(song._id)}
                  >
                    {/* Track number */}
                    <div className="w-8 text-center text-gray-400">
                      {isActive && isPlaying ? (
                        <RiPulseLine className="text-green-400 text-lg animate-pulse" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    
                    {/* Song thumbnail */}
                    <img
                      src={song.thumbnail?.url}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                      alt={song.title}
                    />
                    
                    {/* Song info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold truncate ${
                          isActive ? "text-green-400" : "text-white"
                        }`}>
                          {song.title}
                        </p>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{song.singer || "Unknown Artist"}</p>
                    </div>
                    
                    {/* Like button */}
                    <button
                      className={`p-2 rounded-full transition-all duration-300 flex-shrink-0 ${
                        playlistIds.includes(song._id)
                          ? "bg-green-500 shadow-lg"
                          : "hover:bg-gray-700"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        savePlayListHandler(song._id);
                      }}
                    >
                      <img 
                        src="/src/assets/like.png" 
                        alt="like" 
                        className="w-4 h-4"
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-400 text-center py-12">
          No {type === "artist" || type === "director" ? "albums" : "songs"} found
        </div>
      )}
    </div>
  );
};

export default SearchResults;
