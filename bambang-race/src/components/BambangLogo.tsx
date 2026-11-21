import React from 'react';

interface BambangLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const BambangLogo: React.FC<BambangLogoProps> = ({ size = 'md' }) => {
  const iconSize = size === 'lg' ? 54 : size === 'sm' ? 32 : 42;
  const titleClass =
    size === 'lg'
      ? 'text-4xl sm:text-5xl md:text-6xl'
      : size === 'sm'
        ? 'text-xl'
        : 'text-2xl sm:text-3xl';

  return (
    <div className="inline-flex items-center gap-3 select-none">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Racing Shield & Philippine Sun Rays Motif */}
        <path
          d="M12 8H54L48 52L30 60L12 52L12 8Z"
          fill="#0F172A"
          stroke="#F59E0B"
          strokeWidth="3.5"
        />
        <path d="M16 14H49L47 26H16V14Z" fill="#DC2626" />
        <path d="M16 28H46.5L44.5 40H16V28Z" fill="#2563EB" />
        {/* Golden Sunburst Apex */}
        <circle cx="32" cy="27" r="7.5" fill="#FBBF24" />
        <path
          d="M32 15L34 20H30L32 15ZM32 39L34 34H30L32 39ZM20 27L25 25V29L20 27ZM44 27L39 25V29L44 27Z"
          fill="#FBBF24"
        />
        {/* Checkered Speed Strip */}
        <rect x="19" y="44" width="6" height="5" fill="#F8FAFC" />
        <rect x="25" y="44" width="6" height="5" fill="#1E293B" />
        <rect x="31" y="44" width="6" height="5" fill="#F8FAFC" />
        <rect x="37" y="44" width="6" height="5" fill="#1E293B" />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className={`font-display font-bold italic tracking-tight text-white uppercase ${titleClass}`}
        >
          BAMBANG <span className="text-amber-400">RACE</span>
        </span>
        {size !== 'sm' && (
          <span className="text-xs font-medium tracking-wider text-slate-300 uppercase mt-1">
            Tondo &amp; Philippine Street Circuit
          </span>
        )}
      </div>
    </div>
  );
};
