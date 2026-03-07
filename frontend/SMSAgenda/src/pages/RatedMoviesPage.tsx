import { useState, useMemo } from "react";
import { movies } from "@/data/movies";
import MovieCard from "@/components/MovieCard";
import Pagination from "@/components/Pagination";
import { useRatings } from "@/hooks/useRatings";

const MOVIES_PER_PAGE = 12;

const RatedMoviesPage = () => {
  const { ratings, getRating } = useRatings();
  const [currentPage, setCurrentPage] = useState(1);

  const ratedMovies = useMemo(() => {
    return movies
      .filter((m) => ratings.some((r) => r.movieId === m.id))
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  }, [ratings]);

  const totalPages = Math.ceil(ratedMovies.length / MOVIES_PER_PAGE);
  const paginatedMovies = ratedMovies.slice(
    (currentPage - 1) * MOVIES_PER_PAGE,
    currentPage * MOVIES_PER_PAGE
  );

  return (
    <div className="pt-20 pb-12 px-4 container mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Filmes Avaliados</h1>

      {ratedMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <p className="text-lg">Você ainda não avaliou nenhum filme.</p>
          <p className="text-sm mt-1">Pesquise filmes e dê sua nota!</p>
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

export default RatedMoviesPage;
