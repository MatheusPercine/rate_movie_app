import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import MovieCard from "@/components/MovieCard";
import MovieCardSkeleton from "@/components/MovieCardSkeleton";
import Pagination from "@/components/Pagination";
import { getGenreIdByName } from "@/constants/movie-filters";
import { useDebounce } from "@/hooks/useDebounce";
import { useRatings } from "@/hooks/useRatings";
import { searchMovies } from "@/services/movies";

interface SearchPageProps {
  searchQuery: string;
  selectedGenre: string;
  selectedYear: string;
}

const SearchPage = ({ searchQuery, selectedGenre, selectedYear }: SearchPageProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedQuery = useDebounce(searchQuery.trim(), 400);
  const { getRating } = useRatings();
  const selectedGenreId = useMemo(() => getGenreIdByName(selectedGenre), [selectedGenre]);
  const hasSearchQuery = debouncedQuery.length > 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedGenre, selectedYear]);

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["movie-search", debouncedQuery, currentPage],
    queryFn: () => searchMovies({ query: debouncedQuery, page: currentPage }),
    enabled: hasSearchQuery,
    placeholderData: keepPreviousData,
  });

  const filteredMovies = useMemo(() => {
    let result = [...(data?.results ?? [])];

    if (selectedGenreId !== null) {
      result = result.filter((movie) => movie.genreIds.includes(selectedGenreId));
    }

    if (selectedYear) {
      result = result.filter((movie) => movie.year === Number(selectedYear));
    }

    return result;
  }, [data?.results, selectedGenreId, selectedYear]);

  const loading = hasSearchQuery && (isLoading || isFetching);
  const totalPages = data?.totalPages ?? 0;
  const errorMessage = error instanceof Error ? error.message : "Não foi possível buscar filmes.";

  return (
    <div className="pt-20 pb-12 px-4 container mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        {hasSearchQuery ? `Resultados para "${debouncedQuery}":` : "Pesquisar filmes"}
      </h1>

      {!hasSearchQuery ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <p className="text-lg">Digite o nome de um filme para pesquisar no TMDB.</p>
          <p className="text-sm mt-1">Os resultados serão carregados diretamente do backend.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-destructive">
          <p className="text-lg">Erro ao carregar filmes.</p>
          <p className="text-sm mt-1 text-muted-foreground">{errorMessage}</p>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <p className="text-lg">Nenhum filme encontrado.</p>
          <p className="text-sm mt-1">Tente outro termo de busca ou ajuste os filtros.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredMovies.map((movie) => (
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