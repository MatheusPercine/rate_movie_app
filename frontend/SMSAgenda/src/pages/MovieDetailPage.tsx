import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { movies } from "@/data/movies";
import { useRatings } from "@/hooks/useRatings";
import StarRating from "@/components/StarRating";

const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRating, setRating, removeRating } = useRatings();

  const movie = movies.find((m) => m.id === Number(id));

  if (!movie) {
    return (
      <div className="pt-20 pb-12 px-4 container mx-auto min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-muted-foreground">Filme não encontrado.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-primary hover:underline"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const currentRating = getRating(movie.id);

  return (
    <div className="pt-20 pb-12 px-4 container mx-auto min-h-screen">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Voltar</span>
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="shrink-0 w-full md:w-72">
          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{movie.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genre.map((g) => (
                <span
                  key={g}
                  className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Release date */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              Lançamento: {new Date(movie.releaseDate).toLocaleDateString("pt-BR")}
            </span>
          </div>

          {/* Synopsis */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Sinopse</h2>
            <p className="text-muted-foreground leading-relaxed">{movie.synopsis}</p>
          </div>

          {/* Cast */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Elenco
            </h2>
            <div className="flex flex-wrap gap-2">
              {movie.cast.map((actor) => (
                <span
                  key={actor}
                  className="text-sm bg-muted text-muted-foreground px-3 py-1.5 rounded-md"
                >
                  {actor}
                </span>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="border-t border-border pt-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Sua Avaliação</h2>
            <StarRating
              value={currentRating}
              onChange={(rating) => setRating(movie.id, rating)}
              onRemove={() => removeRating(movie.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
