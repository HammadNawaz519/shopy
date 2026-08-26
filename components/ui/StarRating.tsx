"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number; // e.g. 4.8 or 5
  maxStars?: number;
  size?: "xs" | "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showScore?: boolean;
  count?: number;
  className?: string;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = "sm",
  interactive = false,
  onChange,
  showScore = false,
  count,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    xs: "w-2.5 h-2.5",
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const textClasses = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const activeRating = interactive && hoverRating !== null ? hoverRating : rating;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : "img"} aria-label={`Rating: ${rating} out of ${maxStars} stars`}>
        {Array.from({ length: maxStars }).map((_, index) => {
          const starNumber = index + 1;
          const isFilled = activeRating >= starNumber;
          const isHalf = !isFilled && activeRating >= starNumber - 0.75 && activeRating < starNumber;
          const fillPercentage = Math.min(100, Math.max(0, (activeRating - index) * 100));

          if (interactive) {
            return (
              <button
                key={index}
                type="button"
                role="radio"
                aria-checked={rating === starNumber}
                aria-label={`${starNumber} star${starNumber > 1 ? "s" : ""}`}
                onClick={() => onChange && onChange(starNumber)}
                onMouseEnter={() => setHoverRating(starNumber)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 sm:p-1.5 rounded-sm hover:scale-110 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#495464] transition-all touch-manipulation cursor-pointer"
              >
                <Star
                  className={`${sizeClasses[size]} transition-colors ${
                    isFilled
                      ? "text-[#495464] fill-[#495464]"
                      : "text-[#BBBFCA] fill-transparent"
                  }`}
                />
              </button>
            );
          }

          // Static / Display Mode with Fractional SVG Clip or Half Star
          return (
            <div key={index} className="relative inline-block leading-none">
              {/* Background Empty Star */}
              <Star
                className={`${sizeClasses[size]} text-[#BBBFCA]/60 fill-[#E8E8E8]`}
              />

              {/* Foreground Filled Clip */}
              {fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden leading-none pointer-events-none"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star
                    className={`${sizeClasses[size]} text-[#495464] fill-[#495464]`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showScore && (
        <span className={`font-mono font-medium text-[#495464] tracking-tight ${textClasses[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className={`text-[#495464]/60 tracking-normal ${textClasses[size]}`}>
          ({count})
        </span>
      )}
    </div>
  );
}
