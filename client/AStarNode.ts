export type aStarNode = {
  x: number;
  z: number;
  price: number;
  est: number;
  prev?: aStarNode;
};
function reversePath_Helper(
  path: aStarNode | undefined,
  rest: aStarNode | undefined
): aStarNode | undefined {
  if (path === undefined) return rest;
  let next = path.prev;
  path.prev = rest;
  return reversePath_Helper(next, path);
}
export function reversePath(path: aStarNode | undefined) {
  return reversePath_Helper(path, undefined);
}
export function lengthPath(path: aStarNode | undefined): number {
  if (path === undefined) return 0;
  return 1 + lengthPath(path.prev);
}
