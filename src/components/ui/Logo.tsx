import Link from "next/link";

interface LogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { text: "text-lg", icon: 20 },
  md: { text: "text-xl", icon: 24 },
  lg: { text: "text-2xl", icon: 28 },
};

export default function Logo({ variant = "dark", size = "md" }: LogoProps) {
  const s = sizes[size];
  const textColor = variant === "dark" ? "text-navy-800" : "text-white";
  const accentColor = variant === "dark" ? "#F59E0B" : "#FCD34D";

  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group">
      {/* Sun icon */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        className="flex-shrink-0 transition-transform duration-300 group-hover:rotate-45"
      >
        <circle cx="12" cy="12" r="5" fill={accentColor} />
        <g stroke={accentColor} strokeWidth="1.5" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="4.5" />
          <line x1="12" y1="19.5" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4.5" y2="12" />
          <line x1="19.5" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="6.7" y2="6.7" />
          <line x1="17.3" y1="17.3" x2="19.07" y2="19.07" />
          <line x1="19.07" y1="4.93" x2="17.3" y2="6.7" />
          <line x1="6.7" y1="17.3" x2="4.93" y2="19.07" />
        </g>
      </svg>
      <span className={`font-display font-bold tracking-tight ${s.text} ${textColor}`}>
        MAC<span style={{ color: accentColor }}>Solar</span>
      </span>
    </Link>
  );
}
