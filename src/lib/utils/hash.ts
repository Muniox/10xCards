/**
 * Hash source text using SHA-256
 * @param text - Source text to hash
 * @returns Hex string hash
 */
export async function hashSourceText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Calculate pagination metadata
 * @param total - Total number of items
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @returns Pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  offset: number;
} {
  const offset = (page - 1) * limit;
  const total_pages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    total_pages,
    offset,
  };
}
