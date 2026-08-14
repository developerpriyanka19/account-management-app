/** Max farmer records per PDF page for NA Invoice and Debit Note. */
export const PDF_FARMER_ROWS_PER_PAGE = 10;

/**
 * Split rows into pages of at most `pageSize`.
 * Does not pad with blank rows — the last page may have fewer records.
 */
export function chunkPdfRows<T>(rows: T[], pageSize: number): T[][] {
  if (rows.length === 0) return [[]];
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += pageSize) {
    chunks.push(rows.slice(i, i + pageSize));
  }
  return chunks;
}
