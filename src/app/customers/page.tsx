import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/customer-display";
import { CustomerTableRow } from "./customer-table-row";

const PAGE_SIZE = 10;

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function customersListHref(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q.length > 0) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/customers?${s}` : "/customers";
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-900/[0.03] dark:border-zinc-800 dark:bg-zinc-900/50 dark:ring-white/[0.04] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  const hasQuery = query.length > 0;
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30 sm:px-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
        <svg
          className="h-7 w-7 text-zinc-400 dark:text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      </div>
      <h2 className="mt-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {hasQuery ? "No matches found" : "No customers yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {hasQuery
          ? "Try a different search term, or clear the filter to see every customer."
          : "Create your first customer to start tracking farmer details, leases, and payments."}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/customers/new"
          className="inline-flex h-10 w-full max-w-xs items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
        >
          Add customer
        </Link>
        {hasQuery ? (
          <Link
            href="/customers"
            className="inline-flex h-10 w-full max-w-xs items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto"
          >
            Clear search
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const { q, page: pageRaw } = await searchParams;
  const query = (q ?? "").trim();

  const where =
    query.length > 0
      ? {
          OR: [
            { farmerName: { contains: query } },
            { changedFarmerName: { contains: query } },
            { vendorCode: { contains: query } },
            { surveyNo: { contains: query } },
            { newSurveyNo: { contains: query } },
            { debitNoteNo: { contains: query } },
          ],
        }
      : undefined;

  const [countAll, sumAgg, totalFiltered] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.aggregate({
      _sum: { leaseAmount: true, balanceReceivable: true },
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const rawPage = Number(pageRaw);
  const pageNum =
    Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const page = Math.min(pageNum, totalPages);

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { id: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      farmerName: true,
      changedFarmerName: true,
      vendorCode: true,
      surveyNo: true,
      newSurveyNo: true,
      totalGunta: true,
      leaseAmount: true,
      rentAmount: true,
      balanceReceivable: true,
      loanAmount: true,
    },
  });

  const leaseSum = sumAgg._sum.leaseAmount ?? 0;
  const balanceSum = sumAgg._sum.balanceReceivable ?? 0;

  const start = totalFiltered === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalFiltered);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Customers
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Search and manage farmer records. Click a row to open the profile, or use the quick
            actions.
          </p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:self-end"
        >
          Add customer
        </Link>
      </header>

      <section aria-label="Summary statistics" className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total customers"
          value={countAll.toLocaleString("en-IN")}
          description="All records in the database."
        />
        <SummaryCard
          title="Total lease amount"
          value={formatAmount(leaseSum)}
          description="Sum of lease amounts (₹)."
        />
        <SummaryCard
          title="Total balance amount"
          value={formatAmount(balanceSum)}
          description="Sum of balance receivable (₹)."
        />
      </section>

      <section className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Search</h2>
        <form
          action="/customers"
          method="get"
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor="customer-search"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Filter
            </label>
            <input
              id="customer-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Farmer name, vendor, survey, debit note…"
              className="mt-1.5 block w-full rounded-xl border border-zinc-300 bg-zinc-50/50 px-4 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:bg-white focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:bg-zinc-900 dark:focus:ring-zinc-400/20"
            />
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Search
            </button>
            {query ? (
              <Link
                href="/customers"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      {totalFiltered === 0 ? (
        <EmptyState query={query} />
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {totalFiltered}
              </span>{" "}
              {totalFiltered === 1 ? "customer" : "customers"}
              {query ? (
                <span className="text-zinc-500 dark:text-zinc-500"> matching your search</span>
              ) : null}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Showing{" "}
              <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                {start}–{end}
              </span>{" "}
              of{" "}
              <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                {totalFiltered}
              </span>
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-900/[0.03] dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="min-w-[52rem] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/95 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                    <th className="sticky left-0 z-20 whitespace-nowrap border-r border-zinc-200/80 bg-zinc-50/95 px-3 py-3.5 pl-4 dark:border-zinc-800 dark:bg-zinc-900/60 sm:pl-5">
                      Farmer
                    </th>
                    <th className="hidden whitespace-nowrap px-3 py-3.5 md:table-cell">Changed</th>
                    <th className="whitespace-nowrap px-3 py-3.5 sm:px-4">Vendor</th>
                    <th className="whitespace-nowrap px-3 py-3.5 sm:px-4">Survey</th>
                    <th className="hidden whitespace-nowrap px-3 py-3.5 lg:table-cell">New survey</th>
                    <th className="hidden whitespace-nowrap px-3 py-3.5 text-right xl:table-cell">
                      Total gunta
                    </th>
                    <th className="whitespace-nowrap px-3 py-3.5 text-right sm:px-4">Lease</th>
                    <th className="hidden whitespace-nowrap px-3 py-3.5 text-right md:table-cell">
                      Rent
                    </th>
                    <th className="whitespace-nowrap px-3 py-3.5 text-right sm:px-4">
                      Balance recv.
                    </th>
                    <th className="hidden whitespace-nowrap px-3 py-3.5 text-right xl:table-cell">
                      Loan
                    </th>
                    <th className="sticky right-0 z-20 w-[1%] border-l border-zinc-200/80 bg-zinc-50/95 px-2 py-3.5 text-right shadow-[-8px_0_16px_-8px_rgba(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-[-8px_0_16px_-8px_rgba(0,0,0,0.35)] sm:px-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((row) => (
                    <CustomerTableRow key={row.id} customer={row} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <nav
                className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50/50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/30 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                aria-label="Pagination"
              >
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Page{" "}
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {totalPages}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {page > 1 ? (
                    <Link
                      href={customersListHref(query, page - 1)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
                      Previous
                    </span>
                  )}
                  {page < totalPages ? (
                    <Link
                      href={customersListHref(query, page + 1)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
                      Next
                    </span>
                  )}
                </div>
              </nav>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
