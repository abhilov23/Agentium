"use client";

interface LogoProps {
  size?: number;
  className?: string;
}

// Minimalist, modern geometric "A" logo for Agentium
export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dark container */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="7"
          fill="#0c0f14"
          stroke="#202630"
          strokeWidth="0.75"
        />

        {/* Clean geometric 'A' body */}
        <path
          d="M16 6.7L24.4 24.4H20.8L18.6 19.5H13.4L11.2 24.4H7.6L16 6.7ZM16 11.7L14.3 16.5H17.7L16 11.7Z"
          fill="#F3F4F6"
        />

        {/* Signature teal crossbar */}
        <polygon
          points="14.3,16.5 17.7,16.5 18.6,19.5 13.4,19.5"
          fill="#14B8A6"
        />
      </svg>
    </div>
  );
}

// Wordmark: Logo icon + "Agentium" title text
export function LogoWordmark({ size = 32, className = "" }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 flex-shrink-0 whitespace-nowrap select-none ${className}`}>
      <Logo size={size} />
      <span
        style={{
          fontSize: size * 0.58,
          fontWeight: 700,
          letterSpacing: "-0.035em",
          color: "#EDEDED",
          fontFamily: "var(--font-geist-sans), -apple-system, sans-serif",
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        Agentium
      </span>
    </div>
  );
}
