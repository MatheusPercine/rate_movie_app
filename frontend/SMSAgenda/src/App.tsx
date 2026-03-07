import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { CompleteLayout } from "./components/layout.tsx";
import PrivateRoute from "./routes/PrivateRoute";

import SearchPage from "./pages/SearchPage.tsx";
import { useState } from "react";
import MovieDetailPage from "./pages/MovieDetailPage.tsx";
import RatedMoviesPage from "./pages/RatedMoviesPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "@/components/Header";

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
      <Route path="/" element={<Navigate to="/agenda" replace />} />
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
          path="/resultados"
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
        <Route path="/not_found" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
