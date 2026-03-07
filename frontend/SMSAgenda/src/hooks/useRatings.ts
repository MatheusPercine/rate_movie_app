import { useState, useCallback } from "react";
import { MovieRating } from "@/types/movie";

const STORAGE_KEY = "movie-ratings";

function loadRatings(): MovieRating[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRatings(ratings: MovieRating[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
}

export function useRatings() {
  const [ratings, setRatings] = useState<MovieRating[]>(loadRatings);

  const getRating = useCallback(
    (movieId: number) => ratings.find((r) => r.movieId === movieId)?.rating ?? null,
    [ratings]
  );

  const setRating = useCallback(
    (movieId: number, rating: number) => {
      setRatings((prev) => {
        const existing = prev.findIndex((r) => r.movieId === movieId);
        const next =
          existing >= 0
            ? prev.map((r, i) => (i === existing ? { ...r, rating } : r))
            : [...prev, { movieId, rating }];
        saveRatings(next);
        return next;
      });
    },
    []
  );

  const removeRating = useCallback((movieId: number) => {
    setRatings((prev) => {
      const next = prev.filter((r) => r.movieId !== movieId);
      saveRatings(next);
      return next;
    });
  }, []);

  return { ratings, getRating, setRating, removeRating };
}
