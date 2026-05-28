import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ download?: string; print?: string }>;
};

export default async function NaInvoiceViewAliasPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { download, print } = await searchParams;
  const next = new URLSearchParams();
  if (download) next.set("download", download);
  if (print) next.set("print", print);
  const query = next.toString();
  redirect(`/invoice/na/${id}${query ? `?${query}` : ""}`);
}
