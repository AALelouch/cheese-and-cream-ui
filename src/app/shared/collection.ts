export interface Identifiable {
  id: number;
}

export function replaceById<T extends Identifiable>(items: T[], item: T): T[] {
  return items.map(current => current.id === item.id ? item : current);
}

export function removeById<T extends Identifiable>(items: T[], id: number): T[] {
  return items.filter(item => item.id !== id);
}
