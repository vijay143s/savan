import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Loading from "../components/Loading";
import { FaArrowLeft } from "react-icons/fa";

const MusicDirectorCard = ({ director, onClick }) => {
  return (
    <div 
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 text-center hover:from-gray-700 hover:to-gray-800 transition-all cursor-pointer"
      onClick={() => onClick(director.directorName)}
    >
      <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-3">
        <span className="text-3xl font-bold text-black">
          {director.directorName?.[0]?.toUpperCase() || "M"}
        </span>
      </div>
      <h3 className="text-white font-semibold text-sm truncate">
        {director.directorName}
      </h3>
      <p className="text-gray-400 text-xs mt-1">
        {director.albumCount} album{director.albumCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

const MusicDirectors = () => {
  const [directors, setDirectors] = useState([]);
  const [allDirectors, setAllDirectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDirectors, setFilteredDirectors] = useState([]);
  const navigate = useNavigate();

  const handleDirectorClick = (directorName) => {
    navigate(`/results/director/${encodeURIComponent(directorName)}`);
  };

  const page = Number(searchParams.get("page")) || 1;
  const limit = 12;

  useEffect(() => {
    const fetchDirectors = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/home/music-directors?page=${page}&limit=${limit}`
        );
        setDirectors(response.data.data);
        setPagination(response.data.pagination);
        
        // If it's the first page and no search, fetch minimal data for searching
        if (page === 1 && !searchQuery) {
          const searchResponse = await axios.get(`/api/home/search/music-directors`);
          setAllDirectors(searchResponse.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch music directors:", error);
        setDirectors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectors();
  }, [page]);

  // Filter directors based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredDirectors([]);
      return;
    }
    
    const filtered = allDirectors.filter(director => 
      director.directorName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDirectors(filtered);
  }, [searchQuery, allDirectors]);

  const displayDirectors = searchQuery ? filteredDirectors : directors;

  const handlePrevPage = () => {
    if (page > 1) {
      setSearchParams({ page: page - 1 });
    }
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.pages) {
      setSearchParams({ page: page + 1 });
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="w-full px-4 md:px-6 py-4">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <FaArrowLeft />
        <span>Back to Home</span>
      </button>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          All Music Directors
        </h1>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search music directors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none w-full sm:w-64"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {displayDirectors.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {displayDirectors.map((director) => (
              <MusicDirectorCard key={director.directorId} director={director} onClick={handleDirectorClick} />
            ))}
          </div>
          
          {searchQuery && (
            <div className="text-center text-gray-400 mb-4">
              Found {filteredDirectors.length} music director{filteredDirectors.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}

          {!searchQuery && pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
              >
                Previous
              </button>

              <span className="text-white font-semibold">
                Page {pagination.page} of {pagination.pages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={page >= pagination.pages}
                className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-400 text-center py-12">
          No music directors available
        </div>
      )}
    </div>
  );
};

export default MusicDirectors;
