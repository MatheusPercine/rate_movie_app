export interface Movie {
  id: number;
  title: string;
  poster: string;
  synopsis: string;
  releaseDate: string;
  year: number;
  genre: string[];
  cast: string[];
}

export interface MovieRating {
  movieId: number;
  rating: number;
}