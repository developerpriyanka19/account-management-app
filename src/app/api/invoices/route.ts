import { NextResponse } from "next/server";
import { getInvoiceList } from "@/app/invoice/actions";
import { requireApiSession } from "@/lib/api-auth";
import { parseInvoiceCategoryParam } from "@/lib/invoice-category";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = parseInvoiceCategoryParam(searchParams.get("category"));
  if (!category) {
    return NextResponse.json(
      { error: "Query parameter category is required (NA or SERVICE)." },
      { status: 400 },
    );
  }

  const query = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const pageSize = Math.max(1, Math.min(Number(searchParams.get("pageSize") || "10") || 10, 50));
  const sortParam = searchParams.get("sort");
  const sort = sortParam === "amount" ? "amount" : "date";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  const result = await getInvoiceList({
    category,
    query,
    page,
    pageSize,
    sort,
    sortDir,
  });

  return NextResponse.json(result);
}
