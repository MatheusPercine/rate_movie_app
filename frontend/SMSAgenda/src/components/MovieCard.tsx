import { Link } from "react-router-dom";
import { Movie } from "@/types/movie";

interface MovieCardProps {
  movie: Movie;
  rating?: number | null;
}

const MovieCard = ({ movie, rating }: MovieCardProps) => {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group block rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-xl"
    >
      <div className="relative aspect-[2/3] bg-secondary overflow-hidden">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"
          loading="lazy"
        />
        {rating != null && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">
            ★ {rating}
          </div>
        )}
      </div>
      <div className="p-2 bg-card">
        <h3 className="text-sm font-medium text-card-foreground truncate">{movie.title}</h3>
        <p className="text-xs text-muted-foreground">{movie.year}</p>
      </div>
    </Link>
  );
};

export default MovieCard;
