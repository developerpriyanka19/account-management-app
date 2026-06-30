import type { CSSProperties, ReactNode } from "react";
import { CompanyDocumentFooter } from "@/components/company-document-footer";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  isLastPage?: boolean;
  landscape?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Fixed-height A4 page shell for invoice and debit note preview/print. */
export function PdfPage({
  children,
  header,
  footer,
  isLastPage = false,
  landscape = false,
  className,
  style,
}: Props) {
  return (
    <div
      className={cn(
        "pdf-page relative box-border flex flex-col overflow-hidden bg-white",
        landscape ? "pdf-page-landscape" : "pdf-page-portrait",
        className,
      )}
      style={style}
    >
      {header ? <div className="pdf-header shrink-0">{header}</div> : null}
      <div className={cn("pdf-content relative min-h-0 flex-1", isLastPage && "last-page")}>
        {children}
      </div>
      <div className="pdf-footer">
        {footer ?? <CompanyDocumentFooter compact />}
      </div>
    </div>
  );
}
