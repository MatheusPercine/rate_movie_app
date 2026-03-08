import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";

import SearchPage from "./pages/SearchPage.tsx";
import { useState } from "react";
import MovieDetailPage from "./pages/MovieDetailPage.tsx";
import RatedMoviesPage from "./pages/RatedMoviesPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import Header from "@/components/Header";
import LoginPage from "./pages/LoginPage.tsx";
import SignupPage from "./pages/SignupPage.tsx";

interface MoviesHeaderLayoutProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

function MoviesHeaderLayout({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedYear,
  onYearChange,
}: MoviesHeaderLayoutProps) {
  return (
    <>
      <Header
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedGenre={selectedGenre}
        onGenreChange={onGenreChange}
        selectedYear={selectedYear}
        onYearChange={onYearChange}
      />
      <Outlet />
    </>
  );
}


function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/results" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        element={
          <MoviesHeaderLayout
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        }
      >
        <Route
          path="/results"
          element={
            <PrivateRoute>
              <SearchPage
                searchQuery={searchQuery}
                selectedGenre={selectedGenre}
                selectedYear={selectedYear}
              />
            </PrivateRoute>
          }
        />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/rated" element={<RatedMoviesPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
