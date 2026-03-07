export interface MovieSummary {
  id: number;
  title: string;
  posterUrl: string | null;
  synopsis: string;
  releaseDate: string | null;
  year: number | null;
  genreIds: number[];
}

export interface MovieCastMember {
  id: number;
  name: string;
  character: string | null;
  profilePath: string | null;
}

export interface MovieDetail extends MovieSummary {
  genres: string[];
  cast: MovieCastMember[];
  userRating: number | null;
}

export interface RatedMovie extends MovieSummary {
  userRating: number;
  ratingId: number;
  createdAt: string;
  updatedAt: string;
}

export interface MovieRatingRecord {
  id: number;
  movieId: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface MovieSearchResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: MovieSummary[];
}

export interface RatedMoviesResponse {
  total: number;
  results: RatedMovie[];
}