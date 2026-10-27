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
 * Nirmaantra Building Safety & Compliance Emblem
 * Features an architectural safety shield with modern high-rise blueprint structures,
 * precision drafting apex, and a golden/emerald municipal compliance verification seal.
 */
export function BuildingSafetyEmblem({ className = "w-11 h-14" }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 100 125"
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Nirmaantra Building Safety Emblem"
      >
        <defs>
          <linearGradient id="nbShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A1B4E" />
            <stop offset="50%" stopColor="#1E1438" />
            <stop offset="100%" stopColor="#130C26" />
          </linearGradient>
          <linearGradient id="nbGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="nbTowerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4338CA" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>
        </defs>

        {/* Outer Shield Geometry */}
        <path
          d="M50 4 C72 4 90 14 90 28 C90 68 72 102 50 120 C28 102 10 68 10 28 C10 14 28 4 50 4 Z"
          fill="url(#nbShieldGrad)"
          stroke="url(#nbGoldGrad)"
          strokeWidth="2.8"
        />

        {/* Inner Dashed Precision Regulatory Border */}
        <path
          d="M50 10 C68 10 84 18 84 30 C84 65 68 95 50 112 C32 95 16 65 16 30 C16 18 32 10 50 10 Z"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="1"
          strokeDasharray="2.5 2"
          opacity="0.55"
        />

        {/* Subtle Architectural Blueprint Grid Lines */}
        <g opacity="0.18" stroke="#FFFFFF" strokeWidth="0.75">
          <line x1="22" y1="42" x2="78" y2="42" />
          <line x1="20" y1="56" x2="80" y2="56" />
          <line x1="22" y1="70" x2="78" y2="70" />
          <line x1="36" y1="32" x2="36" y2="86" />
          <line x1="50" y1="22" x2="50" y2="92" />
          <line x1="64" y1="32" x2="64" y2="86" />
        </g>

        {/* Left Building Tower */}
        <rect x="25" y="46" width="14" height="38" rx="1.5" fill="url(#nbTowerGrad)" stroke="#6366F1" strokeWidth="1" />
        {/* Left Windows */}
        <rect x="28" y="51" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />
        <rect x="33.5" y="51" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />
        <rect x="28" y="59" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />
        <rect x="33.5" y="59" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />
        <rect x="28" y="67" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />
        <rect x="33.5" y="67" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />

        {/* Right Building Tower */}
        <rect x="61" y="46" width="14" height="38" rx="1.5" fill="url(#nbTowerGrad)" stroke="#6366F1" strokeWidth="1" />
        {/* Right Windows */}
        <rect x="64" y="51" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />
        <rect x="69.5" y="51" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />
        <rect x="64" y="59" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />
        <rect x="69.5" y="59" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />
        <rect x="64" y="67" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />
        <rect x="69.5" y="67" width="3.5" height="4.5" rx="0.5" fill="#FEF08A" opacity="0.85" />

        {/* Center Landmark Skyscraper */}
        {/* Spire & Apex Pyramid */}
        <line x1="50" y1="13" x2="50" y2="21" stroke="#FDE047" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="50" cy="12" r="1.5" fill="#FDE047" />
        <path d="M41 33 L50 21 L59 33 Z" fill="url(#nbGoldGrad)" />
        {/* Center Tower Body */}
        <rect x="40" y="33" width="20" height="52" rx="1.5" fill="#231745" stroke="#A5B4FC" strokeWidth="1.2" />
        {/* Center Windows Grid */}
        <rect x="43.5" y="37" width="4.5" height="5" rx="0.5" fill="#FFFFFF" opacity="0.9" />
        <rect x="52" y="37" width="4.5" height="5" rx="0.5" fill="#FFFFFF" opacity="0.9" />
        <rect x="43.5" y="45" width="4.5" height="5" rx="0.5" fill="#FFFFFF" opacity="0.9" />
        <rect x="52" y="45" width="4.5" height="5" rx="0.5" fill="#FFFFFF" opacity="0.9" />
        <rect x="43.5" y="53" width="4.5" height="5" rx="0.5" fill="#FFFFFF" opacity="0.9" />
        <rect x="52" y="53" width="4.5" height="5" rx="0.5" fill="#FFFFFF" opacity="0.9" />

        {/* Architectural Compass Arc */}
        <path d="M33 28 C43 22 57 22 67 28" fill="none" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />

        {/* Prominent Verification & Safety Clearance Seal */}
        <g transform="translate(50, 78)">
          {/* Gold Outer Ring */}
          <circle cx="0" cy="0" r="16.5" fill="url(#nbGoldGrad)" stroke="#FFFFFF" strokeWidth="1.8" />
          {/* Emerald Green Safety Shield */}
          <circle cx="0" cy="0" r="12.5" fill="#059669" />
          {/* Verified Checkmark */}
          <path
            d="M-5.5 -0.5 L-2 3.5 L6 -4.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Bottom Statutory Status Banner */}
        <g transform="translate(50, 103)">
          <rect x="-26" y="-5.5" width="52" height="11" rx="3.5" fill="url(#nbGoldGrad)" stroke="#FEF08A" strokeWidth="0.8" />
          <text
            x="0"
            y="2.6"
            textAnchor="middle"
            fontSize="5.8"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            fill="#1E1438"
            letterSpacing="0.9"
          >
            SAFETY AUDIT
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * Backward-compatible aliases for the project emblem.
 * Replaces the previous Satyameva Jayate / Ashoka Lion emblem with the project-specific building safety logo.
 */
export const StateEmblemOfIndia = BuildingSafetyEmblem;
export const StateEmblem = BuildingSafetyEmblem;

/**
 * Official Delhi Circular Identity Logo
 * Features Red Fort / India Gate heritage skyline in red/amber with navy border and "DELHI" banner.
 */
export function DelhiNcrLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Delhi Logo"
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

        {/* "DELHI" Bold Text */}
        <text
          x="60"
          y="84"
          textAnchor="middle"
          fontSize="15"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#FFFFFF"
          letterSpacing="1.8"
        >
          DELHI
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

export const DelhiLogo = DelhiNcrLogo;

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
      {/* Yellow / Golden "DELHI" Badge */}
      <span className="ml-2 bg-[#FDE047] text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-400 uppercase tracking-wider">
        DELHI
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
