import React from "react";
import Link from "next/link";

interface CircularLogoProps {
  type?: "monogram" | "wordmark";
  size?: number;
  className?: string;
  withLink?: boolean;
}

export default function CircularLogo({
  type = "monogram",
  size = 48,
  className = "",
  withLink = false,
}: CircularLogoProps) {
  const content = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-[#495464] select-none ${className}`}
      aria-label="SHOPY Emblem"
    >
      {/* Outer Fine Hairline Circle Frame */}
      <circle
        cx="100"
        cy="100"
        r="94"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-90"
      />

      {type === "monogram" ? (
        /* Interlocking Haute Couture S + H Monogram */
        <g id="monogram" stroke="currentColor" fill="none">
          {/* S Graceful Curve */}
          <path
            d="M136 68C128 54 112 46 94 46C70 46 54 60 54 80C54 100 72 108 94 114C118 120 138 128 138 150C138 172 118 186 94 186C72 186 56 172 46 156"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* H Architectural Pillar & Crossbar */}
          <line x1="100" y1="36" x2="100" y2="196" strokeWidth="7" strokeLinecap="round" />
          <line x1="146" y1="64" x2="146" y2="164" strokeWidth="7" strokeLinecap="round" />
          <line x1="100" y1="114" x2="146" y2="114" strokeWidth="7" strokeLinecap="round" />
        </g>
      ) : (
        /* Refined Editorial Wordmark Centered */
        <text
          x="100"
          y="114"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="var(--font-cormorant), 'Cormorant Garamond', serif"
          fontSize="46"
          fontWeight="300"
          letterSpacing="8"
        >
          SHOPY
        </text>
      )}
    </svg>
  );

  if (withLink) {
    return (
      <Link href="/" className="inline-flex items-center hover:opacity-85 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
