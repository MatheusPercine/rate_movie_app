import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createRating, deleteRating, getRatedMovies, updateRating } from "@/services/movies";

interface SetRatingParams {
  movieId: number;
  rating: number;
  hasExistingRating?: boolean;
}

export function useRatings() {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["ratings"],
    queryFn: getRatedMovies,
  });

  const ratings = data?.results ?? [];

  const ratingsByMovieId = useMemo(
    () => new Map(ratings.map((rating) => [rating.id, rating.userRating])),
    [ratings]
  );

  const getRating = useCallback(
    (movieId: number) => ratingsByMovieId.get(movieId) ?? null,
    [ratingsByMovieId]
  );

  const setRatingMutation = useMutation({
    mutationFn: async ({ movieId, rating, hasExistingRating }: SetRatingParams) => {
      const shouldUpdate = hasExistingRating ?? ratingsByMovieId.has(movieId);
      return shouldUpdate ? updateRating(movieId, rating) : createRating(movieId, rating);
    },
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ratings"] }),
        queryClient.invalidateQueries({ queryKey: ["movie", variables.movieId] }),
      ]);
    },
  });

  const removeRatingMutation = useMutation({
    mutationFn: deleteRating,
    onSuccess: async (_result, movieId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ratings"] }),
        queryClient.invalidateQueries({ queryKey: ["movie", movieId] }),
      ]);
    },
  });

  const setRating = useCallback(
    async (movieId: number, rating: number, hasExistingRating?: boolean) =>
      setRatingMutation.mutateAsync({ movieId, rating, hasExistingRating }),
    [setRatingMutation]
  );

  const removeRating = useCallback(
    async (movieId: number) => removeRatingMutation.mutateAsync(movieId),
    [removeRatingMutation]
  );

  return {
    ratings,
    getRating,
    setRating,
    removeRating,
    isLoading: isLoading || isFetching,
    error,
    isSaving: setRatingMutation.isPending,
    isRemoving: removeRatingMutation.isPending,
  };
}
