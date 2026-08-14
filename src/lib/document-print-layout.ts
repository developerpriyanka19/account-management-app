/**
 * Shared HTML print/preview layout — mirrors PDF_CONTENT_HORIZONTAL_MM (10mm).
 * Use on a single wrapper that contains header, body, table, closing, and footer.
 */
export const DOCUMENT_PRINT_PAGE_CLASS = "document-print-page";

/** Horizontal padding for HTML — keep in sync with PDF_CONTENT_HORIZONTAL_MM. */
export const DOCUMENT_PRINT_HORIZONTAL_PADDING = "10mm";

/** Alias kept for existing invoice templates. */
export const INVOICE_PRINT_PAGE_CLASS = DOCUMENT_PRINT_PAGE_CLASS;
