import React from "react";

export default function Loader({ size = 48, color = "#C7B299", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <span
      className={`inline-block animate-spin ${className}`}
      style={{ width: size, height: size }}
      aria-label="Chargement"
      role="status"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke={color}
          strokeWidth="6"
          opacity="0.2"
        />
        <path
          d="M45 25c0-11.046-8.954-20-20-20"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
} 