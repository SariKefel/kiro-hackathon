export function IncidentMap({ large = false }: { large?: boolean }) {
  return (
    <figure
      className="relative h-full min-h-56 overflow-hidden rounded-lg border border-[#d7e4e5] bg-[#edf3f0] text-[#425b61] dark:brightness-90"
      aria-label="Illustrative flood response area around Seksyen 7, Shah Alam. Not a navigation or flood forecast map."
    >
      <svg
        viewBox="0 0 620 350"
        className={`h-full w-full ${large ? "min-h-72" : "min-h-56"}`}
        role="img"
        aria-label="Demo response area schematic"
      >
        <defs>
          <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" fill="none" stroke="#dfe8df" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="620" height="350" fill="url(#map-grid)" />
        <g fill="none" stroke="#d8e3d5" strokeWidth="1.4">
          <path d="M-20 40Q120 100 230 35T650 40M-30 65Q120 125 230 60T650 65M-30 90Q120 150 230 85T650 90M-30 280Q100 190 210 240T650 230M-30 305Q100 215 210 265T650 255M-30 330Q100 240 210 290T650 280" />
        </g>
        <path
          d="M-30 170C80 240 150 115 235 175S340 285 430 200 555 170 650 235"
          fill="none"
          stroke="#c5e2e7"
          strokeWidth="75"
          opacity=".55"
        />
        <path
          d="M-30 170C80 240 150 115 235 175S340 285 430 200 555 170 650 235"
          fill="none"
          stroke="#b0d5df"
          strokeWidth="20"
        />
        <g fill="none" stroke="#fff" strokeWidth="7">
          <path d="M-20 100 205 130 360 70 650 105M90-20 160 160 100 370M350-20 310 165 410 370M-20 285 210 210 390 275 650 300" />
        </g>
        <g fill="none" stroke="#d1d9cf" strokeWidth="1.2">
          <path d="M-20 100 205 130 360 70 650 105M90-20 160 160 100 370M350-20 310 165 410 370M-20 285 210 210 390 275 650 300" />
        </g>
        <path
          d="m210 88 170 37 90 114-130 63-158-95Z"
          fill="#89c9ba"
          fillOpacity=".13"
          stroke="#438c7c"
          strokeDasharray="5 5"
          strokeWidth="1.5"
        />
        <g fontFamily="Arial, sans-serif" fontSize="11" fill="#5c716b">
          <text x="59" y="61">
            Seksyen 8
          </text>
          <text x="221" y="67">
            Seksyen 7
          </text>
          <text x="442" y="93">
            Shah Alam
          </text>
          <text x="460" y="269">
            Seksyen 2
          </text>
          <text x="56" y="303">
            i-City
          </text>
          <text x="286" y="247" fill="#365b65" transform="rotate(22 286 247)">
            Klang River
          </text>
        </g>
        <g transform="translate(240 140)">
          <circle r="21" fill="#087f72" fillOpacity=".12" />
          <circle r="8" fill="#087f72" stroke="white" strokeWidth="3" />
          <rect x="-41" y="-38" width="82" height="23" rx="5" fill="white" />
          <text y="-23" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#1c4a40">
            Alpha team
          </text>
        </g>
        <g transform="translate(391 181)">
          <circle r="21" fill="#cb4b4b" fillOpacity=".12" />
          <circle r="8" fill="#cb4b4b" stroke="white" strokeWidth="3" />
          <rect x="-42" y="-38" width="84" height="23" rx="5" fill="white" />
          <text y="-23" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#913232">
            Boat support
          </text>
        </g>
        <g transform="translate(176 251)">
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill="#f7fbfa" stroke="#087f72" />
          <path d="M-4 0H4M0-4V4" stroke="#087f72" strokeWidth="2" />
          <text x="15" y="4" fontFamily="Arial" fontSize="10" fill="#3c6458">
            Relief centre
          </text>
        </g>
        <g transform="translate(585 35)" fontFamily="Arial" fontSize="9" textAnchor="middle">
          <text y="-8">N</text>
          <path d="M0 0-4 12 0 9 4 12Z" fill="#5c716b" />
        </g>
      </svg>
      <figcaption className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[9px] text-[#425b61]">
        Demo schematic · Not for navigation
      </figcaption>
    </figure>
  );
}
