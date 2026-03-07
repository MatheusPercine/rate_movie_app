import api from "@/services/api";
import type {
  MovieDetail,
  MovieRatingRecord,
  MovieSearchResponse,
  MovieSummary,
  RatedMoviesResponse,
} from "@/types/movie";

interface SearchMoviesParams {
  query: string;
  page?: number;
}

interface ApiMovieSummary {
  id: number;
  title: string;
  poster_url: string | null;
  release_date: string | null;
  overview: string | null;
  genre_ids?: number[];
}

interface ApiMovieDetail extends ApiMovieSummary {
  genres?: string[];
  cast?: Array<{
    id: number;
    name: string;
    character: string | null;
    profile_path: string | null;
  }>;
  user_rating?: number | null;
}

interface ApiRatingRecord {
  id: number;
  movie_id: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface ApiRatedMovie extends ApiMovieSummary {
  user_rating: number;
  rating_id: number;
  created_at: string;
  updated_at: string;
}

interface ApiSearchMoviesResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: ApiMovieSummary[];
}

interface ApiRatedMoviesResponse {
  total: number;
  results: ApiRatedMovie[];
}

function getMovieYear(releaseDate: string | null): number | null {
  if (!releaseDate) {
    return null;
  }

  const [year] = releaseDate.split("-");
  const parsedYear = Number(year);
  return Number.isFinite(parsedYear) ? parsedYear : null;
}

function mapMovieSummary(movie: ApiMovieSummary): MovieSummary {
  return {
    id: movie.id,
    title: movie.title,
    posterUrl: movie.poster_url,
    synopsis: movie.overview ?? "",
    releaseDate: movie.release_date,
    year: getMovieYear(movie.release_date),
    genreIds: movie.genre_ids ?? [],
  };
}

function mapMovieDetail(movie: ApiMovieDetail): MovieDetail {
  return {
    ...mapMovieSummary(movie),
    genres: movie.genres ?? [],
    cast: (movie.cast ?? []).map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profilePath: person.profile_path,
    })),
    userRating: movie.user_rating ?? null,
  };
}

function mapMovieRatingRecord(record: ApiRatingRecord): MovieRatingRecord {
  return {
    id: record.id,
    movieId: record.movie_id,
    rating: record.rating,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapRatedMovie(movie: ApiRatedMovie) {
  return {
    ...mapMovieSummary(movie),
    userRating: movie.user_rating,
    ratingId: movie.rating_id,
    createdAt: movie.created_at,
    updatedAt: movie.updated_at,
  };
}

export async function searchMovies({ query, page = 1 }: SearchMoviesParams): Promise<MovieSearchResponse> {
  const response = await api.get<ApiSearchMoviesResponse>("/movies/search", {
    params: {
      query,
      page,
    },
  });

  return {
    page: response.data.page,
    totalPages: response.data.total_pages,
    totalResults: response.data.total_results,
    results: response.data.results.map(mapMovieSummary),
  };
}

export async function getMovieDetails(movieId: number): Promise<MovieDetail> {
  const response = await api.get<ApiMovieDetail>(`/movies/${movieId}`);
  return mapMovieDetail(response.data);
}

export async function getRatedMovies(): Promise<RatedMoviesResponse> {
  const response = await api.get<ApiRatedMoviesResponse>("/ratings");
  return {
    total: response.data.total,
    results: response.data.results.map(mapRatedMovie),
  };
}

export async function createRating(movieId: number, rating: number): Promise<MovieRatingRecord> {
  const response = await api.post<ApiRatingRecord>("/ratings", {
    movie_id: movieId,
    rating,
  });

  return mapMovieRatingRecord(response.data);
}

export async function updateRating(movieId: number, rating: number): Promise<MovieRatingRecord> {
  const response = await api.put<ApiRatingRecord>(`/ratings/${movieId}`, {
    rating,
  });

  return mapMovieRatingRecord(response.data);
}

export async function deleteRating(movieId: number): Promise<void> {
  await api.delete(`/ratings/${movieId}`);
}
