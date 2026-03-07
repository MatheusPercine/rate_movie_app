import { useState, useEffect, useMemo } from "react";
import { movies } from "@/data/movies";
import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import Pagination from "@/components/Pagination";
import { useRatings } from "@/hooks/useRatings";

const MOVIES_PER_PAGE = 12;

interface SearchPageProps {
  searchQuery: string;
  selectedGenre: string;
  selectedYear: string;
}

const SearchPage = ({ searchQuery, selectedGenre, selectedYear }: SearchPageProps) => {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { getRating } = useRatings();

  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre, selectedYear]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre, selectedYear]);

  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.title.toLowerCase().includes(q));
    }

    if (selectedGenre) {
      result = result.filter((m) => m.genre.includes(selectedGenre));
    }

    if (selectedYear) {
      result = result.filter((m) => m.year === Number(selectedYear));
    }

    result.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    return result;
  }, [searchQuery, selectedGenre, selectedYear]);

  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
  const paginatedMovies = filteredMovies.slice(
    (currentPage - 1) * MOVIES_PER_PAGE,
    currentPage * MOVIES_PER_PAGE
  );

  return (
    <div className="pt-20 pb-12 px-4 container mx-auto min-h-screen">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        {searchQuery.trim()
          ? `Resultados para "${searchQuery}":`
          : "Todos os filmes"}
      </h1>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: MOVIES_PER_PAGE }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : paginatedMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <p className="text-lg">Nenhum filme encontrado.</p>
          <p className="text-sm mt-1">Tente ajustar seus filtros ou pesquisa.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {paginatedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} rating={getRating(movie.id)} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default SearchPage;