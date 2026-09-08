// High-fidelity SVG Data URLs simulating real capture photos for offline demo and fallback
export const DEMO_METER_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#051b14"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Dispenser Chassis -->
  <rect width="600" height="450" fill="url(#bodyGrad)"/>
  <rect x="25" y="25" width="550" height="400" rx="16" fill="#1e293b" stroke="#334155" stroke-width="3"/>
  
  <!-- Header Branding -->
  <rect x="25" y="25" width="550" height="60" rx="16" fill="#0f172a"/>
  <circle cx="65" cy="55" r="16" fill="#f97316"/>
  <text x="95" y="60" fill="#f8fafc" font-family="system-ui, sans-serif" font-weight="800" font-size="20" letter-spacing="1">INDIAN OIL - DISPENSER #04</text>
  <rect x="470" y="42" width="85" height="26" rx="6" fill="#15803d"/>
  <text x="512" y="59" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="12" text-anchor="middle">PETROL</text>

  <!-- Digital Meter Display Bezel -->
  <rect x="50" y="105" width="500" height="295" rx="12" fill="#090d16" stroke="#059669" stroke-width="2"/>
  <rect x="65" y="120" width="470" height="265" rx="8" fill="url(#screenGrad)"/>

  <!-- Display Lines -->
  <!-- Amount -->
  <g transform="translate(85, 140)">
    <text x="0" y="25" fill="#34d399" font-family="system-ui, sans-serif" font-size="14" font-weight="700" letter-spacing="2">SALE AMOUNT (₹)</text>
    <rect x="0" y="35" width="430" height="58" rx="6" fill="#022c22" stroke="#065f46" stroke-width="1.5"/>
    <text x="415" y="80" fill="#10b981" font-family="'JetBrains Mono', monospace, monospace" font-size="44" font-weight="700" text-anchor="end" filter="url(#glow)">3245.00</text>
  </g>

  <!-- Volume -->
  <g transform="translate(85, 245)">
    <text x="0" y="20" fill="#34d399" font-family="system-ui, sans-serif" font-size="14" font-weight="700" letter-spacing="2">VOLUME / LITRES (L)</text>
    <rect x="0" y="28" width="430" height="52" rx="6" fill="#022c22" stroke="#065f46" stroke-width="1.5"/>
    <text x="415" y="69" fill="#10b981" font-family="'JetBrains Mono', monospace, monospace" font-size="40" font-weight="700" text-anchor="end" filter="url(#glow)">32.45</text>
  </g>

  <!-- Rate per litre -->
  <g transform="translate(85, 335)">
    <text x="0" y="24" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="13" font-weight="600">UNIT RATE (₹/L):</text>
    <text x="140" y="24" fill="#10b981" font-family="'JetBrains Mono', monospace, monospace" font-size="20" font-weight="700" filter="url(#glow)">100.00</text>
    <text x="310" y="24" fill="#6ee7b7" font-family="system-ui, sans-serif" font-size="12">PUMP VERIFIED ✓</text>
  </g>

  <!-- Camera Guidance Reticle Lines -->
  <path d="M 55 110 L 75 110 M 55 110 L 55 130" stroke="#10b981" stroke-width="3" fill="none"/>
  <path d="M 545 110 L 525 110 M 545 110 L 545 130" stroke="#10b981" stroke-width="3" fill="none"/>
  <path d="M 55 395 L 75 395 M 55 395 L 55 375" stroke="#10b981" stroke-width="3" fill="none"/>
  <path d="M 545 395 L 525 395 M 545 395 L 545 375" stroke="#10b981" stroke-width="3" fill="none"/>
</svg>
`)}`

export const DEMO_VEHICLE_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <radialGradient id="clusterGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Instrument Cluster Dashboard Panel -->
  <rect width="600" height="450" fill="url(#clusterGlow)"/>
  <path d="M 40 50 Q 300 20 560 50 L 580 400 Q 300 420 20 400 Z" fill="#090d16" stroke="#1e293b" stroke-width="2"/>

  <!-- Steering Wheel Arch Silhouette -->
  <path d="M 80 430 Q 300 280 520 430" stroke="#334155" stroke-width="12" fill="none" opacity="0.3"/>

  <!-- Speedometer Arc (Left) -->
  <circle cx="160" cy="220" r="95" stroke="#1e293b" stroke-width="14" fill="none"/>
  <circle cx="160" cy="220" r="95" stroke="#0ea5e9" stroke-width="14" stroke-dasharray="280" stroke-dashoffset="190" stroke-linecap="round" fill="none"/>
  <text x="160" y="215" fill="#f8fafc" font-family="system-ui, sans-serif" font-weight="800" font-size="46" text-anchor="middle">0</text>
  <text x="160" y="245" fill="#94a3b8" font-family="system-ui, sans-serif" font-weight="600" font-size="14" text-anchor="middle">KM/H</text>

  <!-- Tachometer Arc (Right) -->
  <circle cx="440" cy="220" r="95" stroke="#1e293b" stroke-width="14" fill="none"/>
  <circle cx="440" cy="220" r="95" stroke="#6366f1" stroke-width="14" stroke-dasharray="280" stroke-dashoffset="210" stroke-linecap="round" fill="none"/>
  <text x="440" y="215" fill="#f8fafc" font-family="system-ui, sans-serif" font-weight="800" font-size="40" text-anchor="middle">0.8</text>
  <text x="440" y="245" fill="#94a3b8" font-family="system-ui, sans-serif" font-weight="600" font-size="13" text-anchor="middle">x1000 RPM</text>

  <!-- Central Digital Information Display Screen -->
  <rect x="210" y="125" width="180" height="200" rx="10" fill="#030712" stroke="#38bdf8" stroke-width="1.5"/>

  <!-- Fuel Gauge Level -->
  <text x="230" y="152" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" font-weight="600">FUEL</text>
  <rect x="230" y="160" width="140" height="8" rx="4" fill="#1e293b"/>
  <rect x="230" y="160" width="135" height="8" rx="4" fill="#22c55e"/>
  <text x="365" y="152" fill="#22c55e" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="end">F</text>

  <!-- Trip Distance -->
  <text x="230" y="195" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" font-weight="600">TRIP A</text>
  <text x="370" y="195" fill="#f1f5f9" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" text-anchor="end">505.0 km</text>

  <!-- Active Gear Indicator -->
  <rect x="282" y="212" width="36" height="30" rx="6" fill="#1e293b"/>
  <text x="300" y="233" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="18" font-weight="800" text-anchor="middle">P</text>

  <!-- ODOMETER DISPLAY (Target of OCR) -->
  <rect x="225" y="255" width="150" height="50" rx="8" fill="#082f49" stroke="#0284c7" stroke-width="1.5"/>
  <text x="235" y="272" fill="#7dd3fc" font-family="system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="1">ODOMETER</text>
  <text x="365" y="296" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="22" font-weight="800" text-anchor="end" filter="url(#cyanGlow)">48,625 km</text>

  <!-- Vehicle Identification Silhouette / Brand -->
  <text x="300" y="80" fill="#94a3b8" font-family="system-ui, sans-serif" font-weight="700" font-size="14" text-anchor="middle" letter-spacing="2">TN 09 BX 4821</text>
  <text x="300" y="100" fill="#64748b" font-family="system-ui, sans-serif" font-weight="500" font-size="12" text-anchor="middle">Hyundai Creta 1.5 SX</text>

  <!-- Camera Guidance Reticle -->
  <path d="M 215 245 L 230 245 M 215 245 L 215 260" stroke="#38bdf8" stroke-width="2.5" fill="none"/>
  <path d="M 385 245 L 370 245 M 385 245 L 385 260" stroke="#38bdf8" stroke-width="2.5" fill="none"/>
  <path d="M 215 315 L 230 315 M 215 315 L 215 300" stroke="#38bdf8" stroke-width="2.5" fill="none"/>
  <path d="M 385 315 L 370 315 M 385 315 L 385 300" stroke="#38bdf8" stroke-width="2.5" fill="none"/>
</svg>
`)}`
