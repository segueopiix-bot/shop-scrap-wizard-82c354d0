import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

const StarRating = ({ rating, size = 14, className = "" }: StarRatingProps) => {
  // Render 5 stars. Each star fills a fraction based on rating.
  return (
    <span className={`inline-flex items-center ${className}`} aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0 text-yellow-400"
              style={{ width: size, height: size }}
              strokeWidth={1.5}
            />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%`, height: size }}
              >
                <Star
                  className="text-yellow-400 fill-yellow-400"
                  style={{ width: size, height: size }}
                  strokeWidth={1.5}
                />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
};

export default StarRating;