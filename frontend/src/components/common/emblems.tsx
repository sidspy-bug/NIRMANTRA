import React from "react";

export function FlagOfIndia({ className = "w-6 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 600"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Flag of India"
    >
      <rect width="900" height="200" fill="#FF9933" />
      <rect y="200" width="900" height="200" fill="#FFFFFF" />
      <rect y="400" width="900" height="200" fill="#138808" />
      <circle cx="450" cy="300" r="80" fill="none" stroke="#000088" strokeWidth="6.5" />
      <circle cx="450" cy="300" r="16" fill="#000088" />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 360) / 24;
        return (
          <line
            key={i}
            x1="450"
            y1="300"
            x2={450 + 80 * Math.cos((angle * Math.PI) / 180)}
            y2={300 + 80 * Math.sin((angle * Math.PI) / 180)}
            stroke="#000088"
            strokeWidth="3.2"
          />
        );
      })}
    </svg>
  );
}

/**
 * Authentic State Emblem of India (Lion Capital of Ashoka with Satyameva Jayate).
 * Uses the verified official vector asset stored at /images/india-state-emblem.svg.
 */
export function StateEmblemOfIndia({ className = "w-11 h-14" }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/india-state-emblem.svg"
        alt="State Emblem of India with Satyameva Jayate"
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
}

/**
 * Re-export alias for centralized emblem usage.
 */
export const StateEmblem = StateEmblemOfIndia;

/**
 * Official Delhi NCR Circular Identity Logo
 * Features Red Fort / India Gate heritage skyline in red/amber with navy border and "DELHI NCR" banner.
 */
export function DelhiNcrLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Delhi NCR Logo"
      >
        {/* Outer Circular Rings */}
        <circle cx="60" cy="60" r="58" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="3.5" />
        <circle cx="60" cy="60" r="53" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.5" />

        {/* Sky Background */}
        <path d="M12 60 A48 48 0 0 1 108 60 Z" fill="#F8FAFC" />

        {/* Architectural Heritage Silhouette (India Gate, Red Fort domes, Qutub Minar) */}
        <g fill="#DC2626">
          {/* Left Red Fort Ramparts & Turrets */}
          <rect x="22" y="44" width="8" height="24" rx="1" />
          <path d="M22 44 L26 38 L30 44 Z" />
          <rect x="30" y="48" width="14" height="20" />
          <path d="M37 40 C34 40 33 46 37 48 C41 46 40 40 37 40 Z" />

          {/* Central India Gate Arch */}
          <rect x="46" y="32" width="28" height="36" rx="1.5" />
          <rect x="44" y="30" width="32" height="4" rx="1" />
          <path d="M53 68 V48 C53 44 67 44 67 48 V68 Z" fill="#FFFFFF" />

          {/* Right Red Fort Dome & Minaret */}
          <rect x="76" y="48" width="14" height="20" />
          <path d="M83 40 C80 40 79 46 83 48 C87 46 86 40 83 40 Z" />
          <rect x="90" y="36" width="6" height="32" rx="1" />
          <path d="M90 36 L93 28 L96 36 Z" />
        </g>

        {/* Lower Banner Background */}
        <path d="M12 60 A48 48 0 0 0 108 60 Z" fill="#1E3A8A" />
        <path d="M16 68 H104 V96 H16 Z" fill="#1E3A8A" />

        {/* "DELHI NCR" Bold Text */}
        <text
          x="60"
          y="84"
          textAnchor="middle"
          fontSize="14"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#FFFFFF"
          letterSpacing="1.2"
        >
          DELHI NCR
        </text>
        <text
          x="60"
          y="97"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#FDE047"
          letterSpacing="0.8"
        >
          GOVERNMENT OF NCT
        </text>
      </svg>
    </div>
  );
}

/**
 * NIRMAANTRA Typography Logo with Golden Skyscraper forming the "I"
 */
export function NirmaantraLogo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <span className="font-black text-2xl tracking-tight text-slate-950 font-sans flex items-center">
        <span>N</span>
        {/* Golden Skyscraper forming the "I" */}
        <span className="relative inline-flex items-center justify-center mx-0.5 w-4 h-7">
          <svg viewBox="0 0 20 40" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Spire */}
            <line x1="10" y1="2" x2="10" y2="8" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            {/* Tier 1 Needle */}
            <path d="M8 8 L12 8 L11 16 L9 16 Z" fill="#F59E0B" />
            {/* Tier 2 Middle Tower */}
            <path d="M7 16 L13 16 L12 26 L8 26 Z" fill="#D97706" />
            {/* Tier 3 Base Tower */}
            <path d="M6 26 L14 26 L14 38 L6 38 Z" fill="#B45309" />
            {/* Vertical glass reflection highlights */}
            <line x1="10" y1="8" x2="10" y2="38" stroke="#FEF3C7" strokeWidth="1" opacity="0.8" />
          </svg>
        </span>
        <span>RMAANTRA</span>
      </span>
      {/* Yellow / Golden "DELHI NCR" Badge */}
      <span className="ml-2 bg-[#FDE047] text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-400 uppercase tracking-wider">
        DELHI NCR
      </span>
    </div>
  );
}

/**
 * Standard User Avatar Icon
 */
export function UserAvatarIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div
      className={`rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 ${className}`}
    >
      <svg viewBox="0 0 36 36" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="18" fill="#E2E8F0" />
        {/* Head */}
        <circle cx="18" cy="13" r="5.5" fill="#334155" />
        {/* Shoulders & Suit */}
        <path
          d="M7 32 C7 24 12 21 18 21 C24 21 29 24 29 32 Z"
          fill="#1E293B"
        />
        {/* Tie Accent */}
        <path d="M18 21 L16.5 27 L18 31 L19.5 27 Z" fill="#D97706" />
      </svg>
    </div>
  );
}

// Preserve existing seals for compatibility
export function DelhiGovEmblem({ className = "w-11 h-11" }: { className?: string }) {
  return <DelhiNcrLogo className={className} />;
}

export function NcrSafetySeal({ className = "w-11 h-11" }: { className?: string }) {
  return <DelhiNcrLogo className={className} />;
}
