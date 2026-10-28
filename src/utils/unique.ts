// Shared list hygiene: repeated sign-ins, codemods and merges must never
// leave twin rows with the same id (React duplicate-key crash). Keeps first.
export function uniqueById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
