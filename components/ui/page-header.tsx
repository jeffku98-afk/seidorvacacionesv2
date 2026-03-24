// ============================================
// Encabezado de Página
// ============================================

interface PageHeaderProps {
  icon: string;
  iconGradient: string;     // Tailwind gradient classes
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // Actions on the right
}

export function PageHeader({
  icon,
  iconGradient,
  title,
  subtitle,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-7 flex items-center justify-between">
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-[22px] shadow-md ${iconGradient}`}
        >
          {icon}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-seidor-800">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
