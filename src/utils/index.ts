export function parseTags(json: string): string[] {
  try { return JSON.parse(json) as string[]; } catch { return []; }
}
export function parseOptions(json: string): string[] {
  try { return JSON.parse(json) as string[]; } catch { return []; }
}
export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
export function pluralize(n: number, word: string): string {
  return `${n} ${word}${n !== 1 ? 's' : ''}`;
}
export function formatRelativeDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function cn(...cls: (string | false | null | undefined)[]): string {
  return cls.filter(Boolean).join(' ');
}
