export function without<T>(arr: T[], idx: number) {
  return arr.slice(0, idx).concat(arr.slice(idx + 1));
}

export function reject<T>(arr: T[], pred: (e: T) => boolean) {
  return arr.filter((e) => !pred(e));
}

export function replaceBy<T>(arr: T[], idx: number, props: object) {
  arr[idx] = { ...arr[idx], ...props };
  return arr;
}
