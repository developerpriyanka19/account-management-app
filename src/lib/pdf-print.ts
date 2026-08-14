/** Download a PDF blob with a filename. */
export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Open a generated PDF in a new browser tab.
 * Does not call window.print() — user prints from the PDF viewer for correct scaling.
 * Falls back to download when popups are blocked.
 */
export function openPdfBlobInNewTab(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(url);
    downloadPdfBlob(blob, filename);
    return false;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
