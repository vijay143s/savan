import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Album from "./pages/Album";
import Layout from "./components/Layout";
import Search from "./pages/Search";
import Queue from "./pages/Queue";
import LikedSongs from "./pages/LikedSongs";
import HindiMusic from "./pages/HindiMusic";

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/album/:id" element={<Album />} />
          <Route path="/search" element={<Search />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/liked" element={<LikedSongs />} />
          <Route path="/hindi" element={<HindiMusic />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
