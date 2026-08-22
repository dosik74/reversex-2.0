import React from 'react';

export const WhiteWaveSvg = () => (
  <svg viewBox="0 0 1600 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
    <defs>
      <filter id="distortFilter" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise">
          <animate attributeName="baseFrequency" values="0.015; 0.02; 0.015" dur="15s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
    <rect width="1600" height="900" fill="#ffffff" />
    <g filter="url(#distortFilter)" opacity="0.6">
      <path d="M0,80 C100,70 300,90 500,80 C700,70 900,90 1100,80 C1300,70 1500,90 1600,80" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M0,160 C100,150 300,170 500,160 C700,150 900,170 1100,160 C1300,150 1500,170 1600,160" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M0,240 C100,230 300,250 500,240 C700,230 900,250 1100,240 C1300,230 1500,250 1600,240" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M0,320 C100,310 300,330 500,320 C700,310 900,330 1100,320 C1300,310 1500,330 1600,320" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M0,400 C100,390 300,410 500,400 C700,390 900,410 1100,400 C1300,390 1500,410 1600,400" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M0,480 C100,470 300,490 500,480 C700,470 900,490 1100,480 C1300,470 1500,490 1600,480" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M0,560 C100,550 300,570 500,560 C700,550 900,570 1100,560 C1300,550 1500,570 1600,560" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M0,640 C100,630 300,650 500,640 C700,630 900,650 1100,640 C1300,630 1500,650 1600,640" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M0,720 C100,710 300,730 500,720 C700,710 900,730 1100,720 C1300,710 1500,730 1600,720" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M0,800 C100,790 300,810 500,800 C700,790 900,810 1100,800 C1300,790 1500,810 1600,800" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M0,880 C100,870 300,890 500,880 C700,870 900,890 1100,880 C1300,870 1500,890 1600,880" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M80,0 C70,100 90,300 80,500 C70,700 90,900 80,1100 C70,1300 90,1500 80,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M160,0 C150,100 170,300 160,500 C150,700 170,900 160,1100 C150,1300 170,1500 160,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M240,0 C230,100 250,300 240,500 C230,700 250,900 240,1100 C230,1300 250,1500 240,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M320,0 C310,100 330,300 320,500 C310,700 330,900 320,1100 C310,1300 330,1500 320,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M400,0 C390,100 410,300 400,500 C390,700 410,900 400,1100 C390,1300 410,1500 400,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M480,0 C470,100 490,300 480,500 C470,700 490,900 480,1100 C470,1300 490,1500 480,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M560,0 C550,100 570,300 560,500 C550,700 570,900 560,1100 C550,1300 570,1500 560,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M640,0 C630,100 650,300 640,500 C630,700 650,900 640,1100 C630,1300 650,1500 640,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M720,0 C710,100 730,300 720,500 C710,700 730,900 720,1100 C710,1300 730,1500 720,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M800,0 C790,100 810,300 800,500 C790,700 810,900 800,1100 C790,1300 810,1500 800,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M880,0 C870,100 890,300 880,500 C870,700 890,900 880,1100 C870,1300 890,1500 880,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M960,0 C950,100 970,300 960,500 C950,700 970,900 960,1100 C950,1300 970,1500 960,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M1040,0 C1030,100 1050,300 1040,500 C1030,700 1050,900 1040,1100 C1030,1300 1050,1500 1040,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M1120,0 C1110,100 1130,300 1120,500 C1110,700 1130,900 1120,1100 C1110,1300 1130,1500 1120,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M1200,0 C1190,100 1210,300 1200,500 C1190,700 1210,900 1200,1100 C1190,1300 1210,1500 1200,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M1280,0 C1270,100 1290,300 1280,500 C1270,700 1290,900 1280,1100 C1270,1300 1290,1500 1280,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M1360,0 C1350,100 1370,300 1360,500 C1350,700 1370,900 1360,1100 C1350,1300 1370,1500 1360,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M1440,0 C1430,100 1450,300 1440,500 C1430,700 1450,900 1440,1100 C1430,1300 1450,1500 1440,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
      <path d="M1520,0 C1510,100 1530,300 1520,500 C1510,700 1530,900 1520,1100 C1510,1300 1530,1500 1520,1600" fill="none" stroke="#b0b0b0" strokeWidth="1.2"/>
    </g>
  </svg>
);

export const DarkWaveSvg = () => (
  <svg viewBox="0 0 1600 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
    <defs>
      <filter id="distortFilterDark" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" seed="5">
          <animate attributeName="baseFrequency" values="0.015; 0.02; 0.015" dur="18s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
    <rect width="1600" height="900" fill="#000000" />
    <g filter="url(#distortFilterDark)" opacity="0.5">
      <path d="M0,80 C100,70 300,90 500,80 C700,70 900,90 1100,80 C1300,70 1500,90 1600,80" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M0,160 C100,150 300,170 500,160 C700,150 900,170 1100,160 C1300,150 1500,170 1600,160" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M0,240 C100,230 300,250 500,240 C700,230 900,250 1100,240 C1300,230 1500,250 1600,240" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M0,320 C100,310 300,330 500,320 C700,310 900,330 1100,320 C1300,310 1500,330 1600,320" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M0,400 C100,390 300,410 500,400 C700,390 900,410 1100,400 C1300,390 1500,410 1600,400" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M0,480 C100,470 300,490 500,480 C700,470 900,490 1100,480 C1300,470 1500,490 1600,480" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M0,560 C100,550 300,570 500,560 C700,550 900,570 1100,560 C1300,550 1500,570 1600,560" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M0,640 C100,630 300,650 500,640 C700,630 900,650 1100,640 C1300,630 1500,650 1600,640" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M0,720 C100,710 300,730 500,720 C700,710 900,730 1100,720 C1300,710 1500,730 1600,720" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M0,800 C100,790 300,810 500,800 C700,790 900,810 1100,800 C1300,790 1500,810 1600,800" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M0,880 C100,870 300,890 500,880 C700,870 900,890 1100,880 C1300,870 1500,890 1600,880" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M80,0 C70,100 90,300 80,500 C70,700 90,900 80,1100 C70,1300 90,1500 80,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M160,0 C150,100 170,300 160,500 C150,700 170,900 160,1100 C150,1300 170,1500 160,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M240,0 C230,100 250,300 240,500 C230,700 250,900 240,1100 C230,1300 250,1500 240,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M320,0 C310,100 330,300 320,500 C310,700 330,900 320,1100 C310,1300 330,1500 320,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M400,0 C390,100 410,300 400,500 C390,700 410,900 400,1100 C390,1300 410,1500 400,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M480,0 C470,100 490,300 480,500 C470,700 490,900 480,1100 C470,1300 490,1500 480,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M560,0 C550,100 570,300 560,500 C550,700 570,900 560,1100 C550,1300 570,1500 560,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M640,0 C630,100 650,300 640,500 C630,700 650,900 640,1100 C630,1300 650,1500 640,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M720,0 C710,100 730,300 720,500 C710,700 730,900 720,1100 C710,1300 730,1500 720,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M800,0 C790,100 810,300 800,500 C790,700 810,900 800,1100 C790,1300 810,1500 800,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M880,0 C870,100 890,300 880,500 C870,700 890,900 880,1100 C870,1300 890,1500 880,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M960,0 C950,100 970,300 960,500 C950,700 970,900 960,1100 C950,1300 970,1500 960,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M1040,0 C1030,100 1050,300 1040,500 C1030,700 1050,900 1040,1100 C1030,1300 1050,1500 1040,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M1120,0 C1110,100 1130,300 1120,500 C1110,700 1130,900 1120,1100 C1110,1300 1130,1500 1120,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M1200,0 C1190,100 1210,300 1200,500 C1190,700 1210,900 1200,1100 C1190,1300 1210,1500 1200,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M1280,0 C1270,100 1290,300 1280,500 C1270,700 1290,900 1280,1100 C1270,1300 1290,1500 1280,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M1360,0 C1350,100 1370,300 1360,500 C1350,700 1370,900 1360,1100 C1350,1300 1370,1500 1360,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M1440,0 C1430,100 1450,300 1440,500 C1430,700 1450,900 1440,1100 C1430,1300 1450,1500 1440,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
      <path d="M1520,0 C1510,100 1530,300 1520,500 C1510,700 1530,900 1520,1100 C1510,1300 1530,1500 1520,1600" fill="none" stroke="#ffffff" strokeWidth="1.2"/>
    </g>
  </svg>
);

export const DotWavesSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
    <defs>
      <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
        <stop offset="20%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="70%" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <mask id="fadeEdges">
        <rect x="0" y="0" width="1600" height="900" fill="url(#vignette)" />
      </mask>
      <filter id="liquidTerrain" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.003 0.007" numOctaves="3" result="noise">
          <animate attributeName="baseFrequency" values="0.003 0.007; 0.004 0.009; 0.003 0.007" dur="25s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="200" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
    <rect width="1600" height="900" fill="#050505" />
    <g filter="url(#liquidTerrain)" mask="url(#fadeEdges)">
      <g stroke="#ffffff" strokeWidth="2.5" strokeDasharray="0 10" strokeLinecap="round" fill="none" opacity="0.85">
        <animateTransform attributeName="transform" type="translate" from="0,0" to="0,30" dur="1.5s" repeatCount="indefinite" />
        <path d="M -200 -300 H 1800 M -200 -270 H 1800 M -200 -240 H 1800 M -200 -210 H 1800 M -200 -180 H 1800 M -200 -150 H 1800 M -200 -120 H 1800 M -200 -90 H 1800 M -200 -60 H 1800 M -200 -30 H 1800 M -200 0 H 1800 M -200 30 H 1800 M -200 60 H 1800 M -200 90 H 1800 M -200 120 H 1800 M -200 150 H 1800 M -200 180 H 1800 M -200 210 H 1800 M -200 240 H 1800 M -200 270 H 1800 M -200 300 H 1800 M -200 330 H 1800 M -200 360 H 1800 M -200 390 H 1800 M -200 420 H 1800 M -200 450 H 1800 M -200 480 H 1800 M -200 510 H 1800 M -200 540 H 1800 M -200 570 H 1800 M -200 600 H 1800 M -200 630 H 1800 M -200 660 H 1800 M -200 690 H 1800 M -200 720 H 1800 M -200 750 H 1800 M -200 780 H 1800 M -200 810 H 1800 M -200 840 H 1800 M -200 870 H 1800 M -200 900 H 1800 M -200 930 H 1800 M -200 960 H 1800 M -200 990 H 1800 M -200 1020 H 1800 M -200 1050 H 1800 M -200 1080 H 1800 M -200 1110 H 1800 M -200 1140 H 1800 M -200 1170 H 1800 M -200 1200 H 1800" />
      </g>
    </g>
  </svg>
);

export const CarbonSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
    <defs>
      <pattern id="carbon" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect x="0" y="0" width="12" height="12" fill="#262626"/>
        <rect x="12" y="12" width="12" height="12" fill="#262626"/>
        <rect x="12" y="0" width="12" height="12" fill="#121212"/>
        <rect x="0" y="12" width="12" height="12" fill="#121212"/>
        <path d="M 0 3 H 12 M 0 6 H 12 M 0 9 H 12 M 12 15 H 24 M 12 18 H 24 M 12 21 H 24" stroke="#363636" strokeWidth="1.2"/>
        <path d="M 15 0 V 12 M 18 0 V 12 M 21 0 V 12 M 3 12 V 24 M 6 12 V 24 M 9 12 V 24" stroke="#050505" strokeWidth="1.2"/>
      </pattern>
      <linearGradient id="lightSweep" x1="-50%" y1="-50%" x2="50%" y2="50%">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="40%" stopColor="rgba(255,255,255,0)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="60%" stopColor="rgba(255,255,255,0)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        <animate attributeName="x1" values="-100%; 200%; -100%" dur="8s" repeatCount="indefinite" />
        <animate attributeName="x2" values="0%; 300%; 0%" dur="8s" repeatCount="indefinite" />
        <animate attributeName="y1" values="-100%; 200%; -100%" dur="8s" repeatCount="indefinite" />
        <animate attributeName="y2" values="0%; 300%; 0%" dur="8s" repeatCount="indefinite" />
      </linearGradient>
      <linearGradient id="shadowSweep" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
        <stop offset="50%" stopColor="rgba(0,0,0,0.6)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        <animate attributeName="x1" values="200%; -100%; 200%" dur="12s" repeatCount="indefinite" />
        <animate attributeName="x2" values="100%; -200%; 100%" dur="12s" repeatCount="indefinite" />
      </linearGradient>
      <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
        <stop offset="40%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.9)" />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#carbon)" />
    <rect width="100%" height="100%" fill="url(#lightSweep)" style={{ mixBlendMode: 'color-dodge' }} />
    <rect width="100%" height="100%" fill="url(#shadowSweep)" style={{ mixBlendMode: 'multiply' }} />
    <rect width="100%" height="100%" fill="url(#vignette)" pointerEvents="none" />
  </svg>
);

export const CircuitSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
    <defs>
      <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
        <stop offset="40%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.9)" />
      </radialGradient>
      <linearGradient id="lightSweep" x1="-50%" y1="-50%" x2="50%" y2="50%">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="40%" stopColor="rgba(255,255,255,0)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="60%" stopColor="rgba(255,255,255,0)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        <animate attributeName="x1" values="-100%; 200%; -100%" dur="8s" repeatCount="indefinite" />
        <animate attributeName="x2" values="0%; 300%; 0%" dur="8s" repeatCount="indefinite" />
        <animate attributeName="y1" values="-100%; 200%; -100%" dur="8s" repeatCount="indefinite" />
        <animate attributeName="y2" values="0%; 300%; 0%" dur="8s" repeatCount="indefinite" />
      </linearGradient>
      <linearGradient id="shadowSweep" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
        <stop offset="50%" stopColor="rgba(0,0,0,0.6)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        <animate attributeName="x1" values="200%; -100%; 200%" dur="12s" repeatCount="indefinite" />
        <animate attributeName="x2" values="100%; -200%; 100%" dur="12s" repeatCount="indefinite" />
      </linearGradient>
      <mask id="dataMask">
        <rect x="0%" y="0%" width="100%" height="100%" fill="black" />
        <rect id="maskGradient" x="-20%" y="0%" width="20%" height="100%" fill="white">
          <animate attributeName="x" values="-20%; 110%" dur="3s" repeatCount="indefinite" begin="1s"/>
        </rect>
      </mask>
      <filter id="pcbNoise" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.1 0 0 0 0 0.1 0 0 0 0 0.1 0 0 0 0 1" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.05" />
        </feComponentTransfer>
      </filter>
    </defs>

    <rect width="100%" height="100%" fill="#121212" />
    <rect width="100%" height="100%" filter="url(#pcbNoise)" />

    <path d="M 200 100 V 800 M 400 100 V 800 M 600 100 V 800 M 800 100 V 800 M 1000 100 V 800 M 1200 100 V 800 M 1400 100 V 800 M 100 200 H 1500 M 100 400 H 1500 M 100 600 H 1500 M 100 800 H 1500" stroke="#ffffff" strokeWidth="1" opacity="0.3" />

    <g mask="url(#dataMask)">
      <path d="M 100 200 H 1500 M 100 400 H 1500 M 100 600 H 1500 M 100 800 H 1500" stroke="#ffffff" strokeWidth="2" />
    </g>
    <g mask="url(#dataMask)">
      <path d="M 200 100 V 800 M 400 100 V 800 M 600 100 V 800" stroke="#ffffff" strokeWidth="2">
        <animate attributeName="opacity" values="0; 1; 0" dur="4s" repeatCount="indefinite" begin="0.5s"/>
      </path>
    </g>

    <rect x="250" y="250" width="300" height="300" fill="#262626" stroke="#4a4a4a" strokeWidth="2" rx="10" ry="10" />
    <rect x="850" y="250" width="300" height="300" fill="#262626" stroke="#4a4a4a" strokeWidth="2" rx="10" ry="10" />
    <rect x="250" y="650" width="300" height="300" fill="#262626" stroke="#4a4a4a" strokeWidth="2" rx="10" ry="10" />
    <rect x="850" y="650" width="300" height="300" fill="#262626" stroke="#4a4a4a" strokeWidth="2" rx="10" ry="10" />

    <rect x="250" y="250" width="300" height="300" fill="#ffffff" fillOpacity="0" rx="10" ry="10">
      <animate attributeName="fill-opacity" values="0; 0.05; 0" dur="15s" repeatCount="indefinite" begin="1s"/>
    </rect>
    <rect x="850" y="650" width="300" height="300" fill="#ffffff" fillOpacity="0" rx="10" ry="10">
      <animate attributeName="fill-opacity" values="0; 0.05; 0" dur="15s" repeatCount="indefinite" begin="3s"/>
    </rect>

    <rect x="600" y="200" width="20" height="40" fill="#8a8a8a" />
    <rect x="630" y="200" width="20" height="40" fill="#8a8a8a" />
    <rect x="660" y="200" width="20" height="40" fill="#8a8a8a" />
    
    <rect x="600" y="700" width="40" height="20" fill="#8a8a8a" rx="2" />
    <rect x="650" y="700" width="40" height="20" fill="#8a8a8a" rx="2" />
    <rect x="700" y="700" width="40" height="20" fill="#8a8a8a" rx="2" />

    <rect x="600" y="700" width="40" height="20" fill="#8a8a8a" rx="2">
      <animateTransform attributeName="transform" type="scale" values="1; 1.05; 1" dur="20s" repeatCount="indefinite" transformOrigin="center" begin="2s"/>
    </rect>

    <circle cx="200" cy="150" r="10" fill="none" stroke="#ffffff" strokeWidth="2" />
    <circle cx="400" cy="150" r="10" fill="none" stroke="#ffffff" strokeWidth="2" />
    <circle cx="600" cy="150" r="10" fill="none" stroke="#ffffff" strokeWidth="2" />
    <circle cx="200" cy="850" r="10" fill="none" stroke="#ffffff" strokeWidth="2" />
    <circle cx="400" cy="850" r="10" fill="none" stroke="#ffffff" strokeWidth="2" />
    <circle cx="600" cy="850" r="10" fill="none" stroke="#ffffff" strokeWidth="2" />

    <circle cx="200" cy="150" r="10" fill="#ffffff" fillOpacity="0">
      <animate attributeName="fill-opacity" values="0; 1; 0" dur="5s" repeatCount="indefinite" begin="1s"/>
    </circle>
    <circle cx="400" cy="850" r="10" fill="#ffffff" fillOpacity="0">
      <animate attributeName="fill-opacity" values="0; 1; 0" dur="5s" repeatCount="indefinite" begin="3s"/>
    </circle>
    <circle cx="600" cy="150" r="10" fill="#ffffff" fillOpacity="0">
      <animate attributeName="fill-opacity" values="0; 1; 0" dur="5s" repeatCount="indefinite" begin="2s"/>
    </circle>

    <rect x="50" y="300" width="40" height="150" fill="#4a4a4a" rx="5" />
    <rect x="50" y="500" width="40" height="150" fill="#4a4a4a" rx="5" />
    <rect x="1510" y="300" width="40" height="150" fill="#4a4a4a" rx="5" />
    <rect x="1510" y="500" width="40" height="150" fill="#4a4a4a" rx="5" />

    <rect x="50" y="300" width="40" height="150" fill="#ffffff" fillOpacity="0" rx="5">
      <animate attributeName="fill-opacity" values="0; 0.1; 0" dur="10s" repeatCount="indefinite" begin="4s"/>
    </rect>

    <rect width="100%" height="100%" fill="url(#lightSweep)" style={{ mixBlendMode: 'color-dodge' }} />
    <rect width="100%" height="100%" fill="url(#shadowSweep)" style={{ mixBlendMode: 'multiply' }} />
    <rect width="100%" height="100%" fill="url(#vignette)" pointerEvents="none" />
  </svg>
);
