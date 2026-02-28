/**
 * Format an ISO date string (YYYY-MM-DD or ISO 8601) to a locale-friendly date.
 * Example: "2024-06-15" → "Jun 15, 2024"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a number as USD currency.
 * Example: 149.5 → "$149.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format raw metres to kilometres with one decimal.
 * Example: 3500 → "3.5 km"   |   800 → "0.8 km"
 */
export function formatDistance(metres: number): string {
  return `${(metres / 1000).toFixed(1)} km`;
}
