import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { useRatings } from "@/hooks/useRatings";
import StarRating from "@/components/StarRating";
import { getMovieDetails } from "@/services/movies";

const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);
  const movieId = Number(id);
  const { getRating, setRating, removeRating, isSaving, isRemoving } = useRatings();

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => getMovieDetails(movieId),
    enabled: Number.isInteger(movieId) && movieId > 0,
  });

  const currentRating = movie?.userRating ?? getRating(movieId);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return (
      <div className="pt-20 pb-12 px-4 container mx-auto min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-muted-foreground">Filme não encontrado.</p>
        <button
          onClick={() => navigate("/resultados")}
          className="mt-4 text-primary hover:underline"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pt-20 pb-12 px-4 container mx-auto min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-muted-foreground">Carregando detalhes do filme...</p>
      </div>
    );
  }

  if (error || !movie) {
    const errorMessage = error instanceof Error ? error.message : "Não foi possível carregar o filme.";
    return (
      <div className="pt-20 pb-12 px-4 container mx-auto min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-destructive">Erro ao carregar detalhes.</p>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <button
          onClick={() => navigate("/resultados")}
          className="text-primary hover:underline"
        >
          Voltar para a busca
        </button>
      </div>
    );
  }

  const handleRatingChange = async (rating: number) => {
    setActionError(null);

    try {
      await setRating(movie.id, rating, currentRating != null);
    } catch (mutationError) {
      const errorMessage = mutationError instanceof Error ? mutationError.message : "Não foi possível salvar sua avaliação.";
      setActionError(errorMessage);
    }
  };

  const handleRatingRemove = async () => {
    setActionError(null);

    try {
      await removeRating(movie.id);
    } catch (mutationError) {
      const errorMessage = mutationError instanceof Error ? mutationError.message : "Não foi possível remover sua avaliação.";
      setActionError(errorMessage);
    }
  };

  return (
    <div className="pt-20 pb-12 px-4 container mx-auto min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Voltar</span>
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="shrink-0 w-full md:w-72">
          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Pôster indisponível
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{movie.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              Lançamento: {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("pt-BR") : "Não informado"}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Sinopse</h2>
            <p className="text-muted-foreground leading-relaxed">
              {movie.synopsis || "Sinopse não disponível."}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Elenco
            </h2>
            <div className="flex flex-wrap gap-2">
              {movie.cast.length > 0 ? (
                movie.cast.map((actor) => (
                  <span
                    key={actor.id}
                    className="text-sm bg-muted text-muted-foreground px-3 py-1.5 rounded-md"
                  >
                    {actor.name}{actor.character ? ` • ${actor.character}` : ""}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Elenco não disponível.</span>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Sua Avaliação</h2>
            <StarRating
              value={currentRating}
              onChange={handleRatingChange}
              onRemove={currentRating != null ? handleRatingRemove : undefined}
              disabled={isSaving || isRemoving}
            />
            {actionError ? (
              <p className="mt-3 text-sm text-destructive">{actionError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
