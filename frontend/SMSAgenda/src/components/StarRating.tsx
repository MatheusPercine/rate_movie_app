import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number) => void;
  onRemove?: () => void;
  size?: number;
  disabled?: boolean;
}

const StarRating = ({ value, onChange, onRemove, size = 32, disabled = false }: StarRatingProps) => {
  const [hover, setHover] = useState<number | null>(null);

  const display = hover ?? value ?? 0;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(star)}
            disabled={disabled}
            className="transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Star
              size={size}
              className={`transition-colors ${
                star <= display
                  ? "fill-star-filled text-star-filled"
                  : "fill-transparent text-star-empty"
              }`}
            />
          </button>
        ))}
      </div>
      {value != null && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Sua nota: {value}/5</span>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="text-xs text-destructive hover:underline"
            >
              Remover avaliação
            </button>
          )}
        </div>
      )}
      {value == null && (
        <span className="text-sm text-muted-foreground">Clique para avaliar</span>
      )}
    </div>
  );
};

export default StarRating;
