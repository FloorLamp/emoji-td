export type Speed = number; // px/tick
export type Point = [number, number];
export type Path = Point[];
export type PathLengths = { total: number; segments: number[] };

export const getPathLengths = (path: Path): PathLengths => {
  const ret: PathLengths = { total: 0, segments: [0] };
  let prev;
  for (const p of path) {
    if (prev) {
      ret.total += distance(p, prev);
      ret.segments.push(ret.total);
    }
    prev = p;
  }
  return ret;
};

export const distance = (a: Point, b: Point) =>
  Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));

export const interpolateDistance = (a: Point, b: Point, d: number): Point => {
  const v = getVelocityVector(a, b, d);
  return [a[0] + v[0], a[1] + v[1]];
};

export const getVelocityVector = (
  a: Point,
  b: Point,
  d: Speed
): [number, number] => {
  const theta = Math.atan((b[1] - a[1]) / (b[0] - a[0]));
  return [
    (b[0] < a[0] ? -1 : 1) * d * Math.cos(theta),
    (b[1] < a[1] ? -1 : 1) * d * Math.abs(Math.sin(theta)),
  ];
};
