import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: 48,
  md: 64,
  lg: 80,
};

export default function Logo({ size = "md" }: LogoProps) {
  const iconSize = sizes[size];
  const iconUrl = process.env.NEXT_PUBLIC_ICON_URL;

  return (
    <Link href="/" className="inline-flex items-center group">
      {iconUrl ? (
        <img
          src={iconUrl}
          alt="MAC Solar"
          width={iconSize}
          height={iconSize}
          className="object-contain transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="font-bold text-xl">MAC Solar</span>
      )}
    </Link>
  );
}