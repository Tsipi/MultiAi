export function TeamStoaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden
    >
      <g
        stroke="#fff"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.5}
        fill="none"
      >
        <path d="M84 50 Q69 39 50 50" />
        <path d="M67 20.6 Q50 28 50 50" />
        <path d="M33 20.6 Q31 39 50 50" />
        <path d="M16 50 Q31 61 50 50" />
        <path d="M33 79.4 Q50 72 50 50" />
        <path d="M67 79.4 Q69 61 50 50" />
      </g>
      <circle cx={84} cy={50} r={4.5} fill="#fff" opacity={0.85} />
      <circle cx={67} cy={20.6} r={4.5} fill="#fff" opacity={0.85} />
      <circle cx={33} cy={20.6} r={4.5} fill="#fff" opacity={0.85} />
      <circle cx={16} cy={50} r={4.5} fill="#fff" opacity={0.85} />
      <circle cx={33} cy={79.4} r={4.5} fill="#fff" opacity={0.85} />
      <circle cx={67} cy={79.4} r={4.5} fill="#fff" opacity={0.85} />
      <circle cx={50} cy={50} r={10} fill="#fff" />
    </svg>
  );
}
