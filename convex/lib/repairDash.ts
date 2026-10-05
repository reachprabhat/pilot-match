export function repairDash(text: string): string {
  return text.replace(/\uFFFD/g, "-");
}
