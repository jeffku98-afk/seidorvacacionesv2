// ============================================
// Loading Spinner - Componente Custom
// ============================================

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-seidor-200 border-t-seidor-500 ${sizes[size]} ${className}`}
      role="status"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
