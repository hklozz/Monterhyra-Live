export const EXHIBITION_BOOTH_TEMPLATES = [
  {
    id: 'empty',
    name: 'Tom montör',
    emoji: '⬜',
    floorSize: { width: 3, depth: 3 },
    floor: '3x3',
    wallShape: '',
    wallHeight: 2.4,
    carpet: 0,
    counters: [],
    furniture: [],
    plants: [],
    storages: [],
    wallShelves: []
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    emoji: '💻',
    floorSize: { width: 3, depth: 3 },
    floor: '3x3',
    wallShape: 'l',
    wallHeight: 2.4,
    carpet: 1,
    counters: [
      { id: 1, type: '2m disk', position: { x: 0.8, z: -0.8 }, rotation: 0 }
    ],
    furniture: [
      { id: 1, type: 'barbord', position: { x: -0.5, z: 0.5 }, rotation: 0 }
    ],
    plants: [
      { id: 1, type: 'Monstera', position: { x: 1.0, z: 1.0 } }
    ],
    storages: [],
    wallShelves: []
  },
  {
    id: 'fashion-brand',
    name: 'Fashion Brand',
    emoji: '👗',
    floorSize: { width: 4, depth: 4 },
    floor: '4x4',
    wallShape: 'u',
    wallHeight: 2.4,
    carpet: 3,
    counters: [
      { id: 1, type: '1,5m disk', position: { x: 1.2, z: -1.2 }, rotation: 45 }
    ],
    furniture: [
      { id: 1, type: 'soffa', position: { x: -1.0, z: 0 }, rotation: 90 },
      { id: 2, type: 'fatolj', position: { x: 0, z: 1.0 }, rotation: 180 }
    ],
    plants: [
      { id: 1, type: 'Ficus', position: { x: 1.5, z: 1.5 } }
    ],
    storages: [],
    wallShelves: []
  },
  {
    id: 'food-company',
    name: 'Food Company',
    emoji: '🍕',
    floorSize: { width: 6, depth: 3 },
    floor: '3x1-5',
    wallShape: 'straight',
    wallHeight: 2.4,
    carpet: 2,
    counters: [
      { id: 1, type: '3m disk', position: { x: 0, z: -1.0 }, rotation: 0 },
      { id: 2, type: '2m disk', position: { x: 2.0, z: 0 }, rotation: 90 }
    ],
    furniture: [
      { id: 1, type: 'barbord', position: { x: -1.5, z: 0 }, rotation: 0 },
      { id: 2, type: 'barstol', position: { x: -1.2, z: 0.3 }, rotation: 0 },
      { id: 3, type: 'barstol', position: { x: -1.2, z: -0.3 }, rotation: 0 }
    ],
    plants: [],
    storages: [],
    wallShelves: []
  },
  {
    id: 'wellness-spa',
    name: 'Wellness & Spa',
    emoji: '🧘',
    floorSize: { width: 4, depth: 4 },
    floor: '4x4',
    wallShape: 'l',
    wallHeight: 2.4,
    carpet: 4,
    counters: [
      { id: 1, type: '1m disk', position: { x: 1.0, z: -1.0 }, rotation: 0 }
    ],
    furniture: [
      { id: 1, type: 'soffa', position: { x: 0, z: 0.5 }, rotation: 0 },
      { id: 2, type: 'sidobord', position: { x: -0.8, z: 0.8 }, rotation: 0 }
    ],
    plants: [
      { id: 1, type: 'Palmlilja', position: { x: 1.5, z: 1.5 } },
      { id: 2, type: 'Bambu', position: { x: -1.2, z: 1.2 } }
    ],
    storages: [],
    wallShelves: []
  },
  {
    id: 'minimal-design',
    name: 'Minimal Design',
    emoji: '⚪',
    floorSize: { width: 3, depth: 3 },
    floor: '3x3',
    wallShape: 'straight',
    wallHeight: 2.4,
    carpet: 0,
    counters: [
      { id: 1, type: 'L-disk (1,5m + 1m)', position: { x: 0.5, z: -0.5 }, rotation: 0 }
    ],
    furniture: [
      { id: 1, type: 'fatolj', position: { x: -0.8, z: 0.8 }, rotation: 135 }
    ],
    plants: [
      { id: 1, type: 'Monstera', position: { x: 1.2, z: 1.2 } }
    ],
    storages: [],
    wallShelves: []
  }
];
