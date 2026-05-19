import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { gstCustomerDb } from "@/lib/prisma-gst-customer";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idRaw } = await context.params;
  const id = Number(idRaw);

  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customer = await gstCustomerDb().findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: customer.id,
    gstNumber: customer.gstNumber,
    companyName: customer.companyName,
    companyAddress: customer.companyAddress,
    state: customer.state,
    gstStatus: customer.gstStatus,
    panNumber: customer.panNumber,
    firstName: customer.firstName,
    lastName: customer.lastName,
    mobile: customer.mobile,
    email: customer.email,
    notes: customer.notes,
  });
}
