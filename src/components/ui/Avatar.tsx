interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
  avatarUrl?: string | null;
}

const AVATAR_COLORS = [
  { from: 'var(--accent-grad-from)', to: 'var(--accent-hover)' },
  { from: '#10B981', to: '#047857' },
  { from: '#EC4899', to: '#9D174D' },
  { from: '#F59E0B', to: '#B45309' },
  { from: '#8B5CF6', to: '#6D28D9' },
  { from: '#DC2626', to: '#991B1B' },
];

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return hash % AVATAR_COLORS.length;
}

export function Avatar({ name, size = 40, className = '', avatarUrl }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const color = AVATAR_COLORS[getColorIndex(name)];
  const fontSize = Math.round(size * 0.35);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize,
        background: `linear-gradient(135deg, ${color.from} 0%, ${color.to} 100%)`,
        letterSpacing: '-0.01em',
      }}
    >
      {initials}
    </span>
  );
}
