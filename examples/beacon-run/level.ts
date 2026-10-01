export interface BeaconPoint {
  readonly x: number;
  readonly z: number;
  readonly name: string;
}
export const beacons: readonly BeaconPoint[] = Object.freeze([
  { x: -5, z: 5, name: 'WEST' },
  { x: -5, z: -5, name: 'NORTH' },
  { x: 5, z: -5, name: 'EAST' },
  { x: 5, z: 5, name: 'SOUTH' },
]);
export const patrol: readonly BeaconPoint[] = Object.freeze([
  { x: -5, z: -5, name: 'nw' },
  { x: 0, z: -5, name: 'n' },
  { x: 5, z: -5, name: 'ne' },
  { x: 5, z: 0, name: 'e' },
  { x: 5, z: 5, name: 'se' },
  { x: 0, z: 5, name: 's' },
  { x: -5, z: 5, name: 'sw' },
  { x: -5, z: 0, name: 'w' },
]);
export const spawn = Object.freeze({ x: 0, y: 0.93, z: 6.5 });
export const crateSpawns = Object.freeze([
  { x: -2, y: 0.5, z: 4 },
  { x: 2, y: 0.5, z: -4 },
  { x: 3, y: 0.5, z: 2 },
]);
