import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AlbumItem from "../components/AlbumItem";
import Loading from "../components/Loading";
import { FaArrowLeft } from "react-icons/fa";

const Albums = () => {
  const [albums, setAlbums] = useState([]);
  const [allAlbums, setAllAlbums] = useState([]);
  const [yearFilteredAlbums, setYearFilteredAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const navigate = useNavigate();

  const page = Number(searchParams.get("page")) || 1;
  const yearsParam = searchParams.get("years");
  const yearFilter = yearsParam ? yearsParam.split(",").map(y => parseInt(y.trim())) : null;
  const limit = 12;

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        
        // If year filter is provided, fetch all albums and filter by year
        if (yearFilter && yearFilter.length > 0) {
          const searchResponse = await axios.get(`/api/home/search/albums`);
          const allAlbumsData = searchResponse.data.data;
          setAllAlbums(allAlbumsData);
          
          // Filter by years
          const yearFiltered = allAlbumsData.filter(album => 
            yearFilter.includes(album.year)
          );
          
          // Store year-filtered albums for search
          setYearFilteredAlbums(yearFiltered);
          
          // Apply pagination manually
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedAlbums = yearFiltered.slice(startIndex, endIndex);
          
          setAlbums(paginatedAlbums);
          setPagination({
            page,
            limit,
            total: yearFiltered.length,
            pages: Math.ceil(yearFiltered.length / limit)
          });
        } else {
          // Normal pagination without year filter
          const response = await axios.get(
            `/api/home/albums?page=${page}&limit=${limit}`
          );
          setAlbums(response.data.data);
          setPagination(response.data.pagination);
          
          // If it's the first page and no search, fetch minimal data for searching
          if (page === 1 && !searchQuery) {
            const searchResponse = await axios.get(`/api/home/search/albums`);
            setAllAlbums(searchResponse.data.data);
          }
          
          // Clear year filtered albums when no year filter
          setYearFilteredAlbums([]);
        }
      } catch (error) {
        console.error("Failed to fetch albums:", error);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [page, yearsParam]);

  // Filter albums based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredAlbums([]);
      return;
    }
    
    // Search in year-filtered albums if year filter exists, otherwise search in all albums
    const searchSource = yearFilteredAlbums.length > 0 ? yearFilteredAlbums : allAlbums;
    
    const filtered = searchSource.filter(album => 
      album.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAlbums(filtered);
  }, [searchQuery, allAlbums, yearFilteredAlbums]);

  const displayAlbums = searchQuery ? filteredAlbums : albums;

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
      {yearFilter && yearFilter.length > 0 && (
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <FaArrowLeft />
          <span>Back to Home</span>
        </button>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {yearFilter && yearFilter.length > 0 
            ? `Albums (${yearFilter.join(", ")})` 
            : "All Albums"}
        </h1>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search albums..."
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

      {displayAlbums.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {displayAlbums.map((album) => (
              <AlbumItem
                key={album._id}
                image={album.thumbnail?.url}
                name={album.title}
                desc={album.description}
                id={album._id}
              />
            ))}
          </div>
          
          {searchQuery && (
            <div className="text-center text-gray-400 mb-4">
              Found {filteredAlbums.length} album{filteredAlbums.length !== 1 ? 's' : ''} matching "{searchQuery}"
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
          No albums available
        </div>
      )}
    </div>
  );
};

export default Albums;
