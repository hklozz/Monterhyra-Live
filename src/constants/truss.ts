export const TRUSS_TYPES = [
  { label: 'Ingen truss', type: 'none', image: null },
  { label: 'Framkant truss (rak)', type: 'front-straight', width: 0.3, height: 0.3, image: '/Models/truss/front-straight.svg' },
  { label: 'Rund hängande truss', type: 'hanging-round', diameter: 2.0, height: 0.25, image: '/Models/truss/hanging-round.svg' },
  { label: 'Fyrkantig hängande truss', type: 'hanging-square', width: 2.0, depth: 2.0, height: 0.3, image: '/Models/truss/hanging-square.svg' }
] as const;
