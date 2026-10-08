// Display labels only. Keep the original values for validation and storage.
export const revenueRanges = ["Below ₹1 crore", "₹1–less than ₹10 crore", "₹10–less than ₹50 crore", "₹50–less than ₹100 crore", "₹100–less than ₹500 crore", "₹500–less than ₹1,000 crore", "₹1,000 crore or more", "Prefer not to disclose"];
const labels = ["Below ₹1 Cr", "₹1-10 Cr", "₹10-50 Cr", "₹50-100 Cr", "₹100-500 Cr", "₹500-1,000 Cr", "₹1,000 Cr+", "Prefer not to disclose"];
export const revenueLabels: Record<string, string> = Object.fromEntries(revenueRanges.map((value, index) => [value, labels[index]]));
export function revenueLabel(value: string) { return revenueLabels[value] ?? value; }
export function revenueText(value: string) {
  for (const range of revenueRanges) value = value.split(range).join(revenueLabel(range));
  return value;
}
