'use client';

import { Box } from '@chakra-ui/react';

interface VendingMachineBackdropProps {
  opacity?: number;
}

export function VendingMachineBackdrop({ opacity = 0.12 }: VendingMachineBackdropProps) {
  return (
    <Box
      aria-hidden
      pointerEvents="none"
      position="absolute"
      inset={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="fg.muted"
      opacity={opacity}
      zIndex={0}
      overflow="hidden"
    >
      <svg
        viewBox="0 0 1400 900"
        width="92%"
        height="92%"
        role="presentation"
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: '1600px', maxHeight: '100%' }}
      >
        <g fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
          <rect x="220" y="70" width="960" height="760" rx="36" />
          <rect x="280" y="130" width="520" height="640" rx="18" />
          <rect x="860" y="130" width="260" height="300" rx="16" />
          <rect x="860" y="470" width="260" height="120" rx="12" />
          <rect x="860" y="630" width="260" height="140" rx="12" />

          <line x1="453" y1="130" x2="453" y2="770" />
          <line x1="626" y1="130" x2="626" y2="770" />

          <line x1="280" y1="250" x2="800" y2="250" />
          <line x1="280" y1="370" x2="800" y2="370" />
          <line x1="280" y1="490" x2="800" y2="490" />
          <line x1="280" y1="610" x2="800" y2="610" />

          <circle cx="990" cy="250" r="52" />
          <line x1="940" y1="250" x2="1040" y2="250" />
          <line x1="990" y1="200" x2="990" y2="300" />

          <rect x="900" y="510" width="180" height="40" rx="8" />

          <path d="M860 700 H1120" />
          <path d="M250 840 H1150" />
        </g>
      </svg>
    </Box>
  );
}