interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 24, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="currentColor"
    >
      <rect x="14" y="30" width="8" height="40" rx="2" />
      <rect x="26" y="24" width="12" height="52" rx="3" />
      <rect x="98" y="30" width="8" height="40" rx="2" />
      <rect x="82" y="24" width="12" height="52" rx="3" />
      <rect x="38" y="46" width="44" height="8" rx="2" />
      <rect x="14" y="92" width="92" height="6" rx="3" opacity="0.5" />
      <rect x="36" y="92" width="48" height="6" rx="3" />
    </svg>
  );
}

export function BrandIcon({ size = 28 }: { size?: number }) {
  const borderRadius = Math.round(size * 0.27);
  return (
    <span
      className="inline-flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius,
        background: 'var(--accent)',
      }}
    >
      <BrandMark size={size * 0.65} className="text-white" />
    </span>
  );
}
