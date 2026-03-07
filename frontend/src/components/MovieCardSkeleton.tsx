const MovieCardSkeleton = () => (
  <div className="rounded-lg overflow-hidden animate-pulse-soft">
    <div className="aspect-[2/3] bg-secondary" />
    <div className="p-2 bg-card space-y-1.5">
      <div className="h-4 bg-secondary rounded w-3/4" />
      <div className="h-3 bg-secondary rounded w-1/3" />
    </div>
  </div>
);

export default MovieCardSkeleton;
