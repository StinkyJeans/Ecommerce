"use client";

const SIZE_CLASSES = {
  sm: "h-5 w-5 border-2",
  md: "h-12 w-12 border-4",
  lg: "h-16 w-16 border-4",
};

const COLOR_CLASSES = {
  orange: "border-t-transparent border-orange-500 dark:border-orange-400",
  red: "border-t-transparent border-red-600 dark:border-red-400",
  blue: "border-t-transparent border-blue-500 dark:border-blue-400",
  accent: "border-t-transparent border-[#FFBF00]",
  white: "border-2 border-white border-t-transparent",
};

export default function LoadingSpinner({ size = "md", color = "orange", className = "" }) {
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const colorClass = COLOR_CLASSES[color] ?? COLOR_CLASSES.orange;
  return (
    <div
      className={`rounded-full loading-spinner-animated ${sizeClass} ${colorClass} ${className}`.trim()}
      aria-hidden
    />
  );
}
