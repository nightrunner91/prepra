/**
 * Русская форма числительного: 1 задача, 2 задачи, 5 задач.
 */
export function plural(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
