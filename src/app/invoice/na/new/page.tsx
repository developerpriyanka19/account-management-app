import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function NaInvoiceNewRedirect({ searchParams }: Props) {
  const { edit } = await searchParams;
  const dest = edit ? `/invoice/na/create?edit=${edit}` : "/invoice/na/create";
  redirect(dest);
}
