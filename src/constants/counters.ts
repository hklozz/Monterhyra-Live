export const DESK_SIZES = [
  { label: '1m', width: 1 },
  { label: '2m', width: 2 },
  { label: '3m', width: 3 }
];

export const COUNTER_TYPES = [
  { label: 'Ingen disk', width: 0, depth: 0, image: '/Models/counters/none.svg' },
  { label: '1m disk', width: 1, depth: 0.5, image: '/Models/counters/1m.svg' },
  { label: '1,5m disk', width: 1.5, depth: 0.5, image: '/Models/counters/1-5m.svg' },
  { label: '2m disk', width: 2, depth: 0.5, image: '/Models/counters/2m.svg' },
  { label: '2,5m disk', width: 2.5, depth: 0.5, image: '/Models/counters/2-5m.svg' },
  { label: '3m disk', width: 3, depth: 0.5, image: '/Models/counters/3m.svg' },
  { label: '3,5m disk', width: 3.5, depth: 0.5, image: '/Models/counters/3m.svg' },
  { label: '4m disk', width: 4, depth: 0.5, image: '/Models/counters/3m.svg' },
  { label: 'L-disk (1,5m + 1m)', width: 0, depth: 0, type: 'L', image: '/Models/walls/l-shape.svg' },
  { label: 'L-disk spegelvänd (1,5m + 1m)', width: 0, depth: 0, type: 'L-mirrored', image: '/Models/walls/l-shape.svg' }
];
