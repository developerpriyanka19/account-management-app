export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="print-document-root m-0 min-h-screen bg-white p-0">{children}</div>;
}
