interface VendingMachineLogoProps {
  height?: number;
  width?: number;
}

export function VendingMachineLogo({ height = 120, width = 100 }: VendingMachineLogoProps) {
  return (
    <svg height={height} viewBox="0 0 100 120" width={width} xmlns="http://www.w3.org/2000/svg">
      {/* Machine outer frame */}
      <rect x="8" y="5" width="84" height="105" rx="8" fill="#2d2d2d" stroke="#000" strokeWidth="2"/>
      
      {/* Top screen/display bar */}
      <rect x="15" y="12" width="70" height="8" rx="2" fill="#4a4a4a"/>
      <rect x="77" y="12" width="6" height="8" rx="1" fill="#6a6a6a"/>
      
      {/* Yellow interior background */}
      <rect x="12" y="22" width="76" height="80" rx="4" fill="#ffd93d" stroke="#000" strokeWidth="2"/>
      
      {/* Products display section (left side) */}
      <rect x="18" y="28" width="48" height="68" rx="3" fill="#fff" stroke="#000" strokeWidth="2.5"/>
      
      {/* Shelves */}
      <line x1="20" y1="48" x2="64" y2="48" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="68" x2="64" y2="68" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="88" x2="64" y2="88" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
      
      {/* Products - Top shelf */}
      <rect x="24" y="34" width="8" height="12" rx="1" fill="#4caf50" stroke="#000" strokeWidth="1.5"/>
      <rect x="36" y="34" width="8" height="12" rx="1" fill="#f44336" stroke="#000" strokeWidth="1.5"/>
      
      {/* Products - Middle shelf */}
      <rect x="24" y="54" width="8" height="12" rx="1" fill="#f44336" stroke="#000" strokeWidth="1.5"/>
      <rect x="36" y="54" width="8" height="12" rx="1" fill="#2196f3" stroke="#000" strokeWidth="1.5"/>
      
      {/* Products - Bottom shelf */}
      <rect x="24" y="74" width="8" height="12" rx="1" fill="#2196f3" stroke="#000" strokeWidth="1.5"/>
      <rect x="36" y="74" width="8" height="12" rx="1" fill="#f44336" stroke="#000" strokeWidth="1.5"/>
      
      {/* Keypad/buttons panel (right side) */}
      <rect x="70" y="28" width="14" height="36" rx="3" fill="#000" stroke="#000" strokeWidth="2"/>
      <rect x="71" y="29" width="12" height="34" rx="2" fill="#e8e8e8"/>
      
      {/* Keypad dots/buttons */}
      <circle cx="75" cy="36" r="1.5" fill="#000"/>
      <circle cx="81" cy="36" r="1.5" fill="#000"/>
      <circle cx="75" cy="42" r="1.5" fill="#000"/>
      <circle cx="81" cy="42" r="1.5" fill="#000"/>
      <circle cx="75" cy="48" r="1.5" fill="#000"/>
      <circle cx="81" cy="48" r="1.5" fill="#000"/>
      <circle cx="75" cy="54" r="1.5" fill="#000"/>
      <circle cx="81" cy="54" r="1.5" fill="#000"/>
      
      {/* Coin/card slot */}
      <rect x="70" y="68" width="14" height="12" rx="3" fill="#000" stroke="#000" strokeWidth="2"/>
      <rect x="71" y="69" width="12" height="10" rx="2" fill="#4a4a4a"/>
      
      {/* Dispenser tray at bottom */}
      <rect x="18" y="96" width="48" height="16" rx="4" fill="#000" stroke="#000" strokeWidth="2"/>
      <rect x="20" y="98" width="44" height="12" rx="3" fill="#4a4a4a"/>
      
      {/* Machine feet */}
      <rect x="24" y="108" width="10" height="8" rx="2" fill="#2d2d2d" stroke="#000" strokeWidth="1.5"/>
      <rect x="66" y="108" width="10" height="8" rx="2" fill="#2d2d2d" stroke="#000" strokeWidth="1.5"/>
    </svg>
  );
}
