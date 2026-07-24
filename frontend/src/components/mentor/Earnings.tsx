import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth";

import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  HandCoins,
  IndianRupee,
  Wallet,
} from "lucide-react";

type TransactionType =
  | "Session"
  | "Resume Review"
  | "Career Guidance"
  | "Referral";

interface Transaction {
  id: number;
  candidate: string;
  service: string;
  amount: number;
  date: string;
  status: string;
  reference: string;
}

interface Summary {
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  this_month: number;
}

interface Monthly {
  month: string;
  amount: number;
}

interface Breakdown {
  service: string;
  amount: number;
  percentage: number;
}

interface EarningsResponse {
  summary: Summary;
  monthly: Monthly[];
  breakdown: Breakdown[];
  transactions: Transaction[];
}

export function MentorEarnings() {

  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<Summary>({
    total_earnings: 0,
    available_balance: 0,
    pending_balance: 0,
    this_month: 0,
  });

  const [monthly, setMonthly] = useState<Monthly[]>([]);

  const [breakdown, setBreakdown] = useState<Breakdown[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);


  useEffect(() => {

  async function loadData() {

    try {

      const response = await apiFetch<EarningsResponse>(
        "/api/mentor/earnings"
      );

      setSummary(response.summary);

      setMonthly(response.monthly);

      setBreakdown(response.breakdown);

      setTransactions(response.transactions);

    } catch (e) {

      console.error(e);

    } finally {

      setLoading(false);

    }

  }

  loadData();

}, []);

if (loading) {

  return (
    <div className="py-20 text-center">
      Loading...
    </div>
  );

}

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-2xl font-bold">
            Earnings
          </h1>

          <p className="text-sm text-muted-foreground">
            Track your income, withdrawals and payment history.
          </p>

        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <Wallet className="h-4 w-4" />
          Withdraw Money
        </button>

      </div>

      {/* Summary */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

        {[
  {
    title: "Total Earnings",
    value: `₹${summary.total_earnings.toLocaleString("en-IN")}`,
    icon: IndianRupee,
    color: "bg-green-50 text-green-600",
  },

  {
    title: "Available",
    value: `₹${summary.available_balance.toLocaleString("en-IN")}`,
    icon: Wallet,
    color: "bg-blue-50 text-blue-600",
  },

  {
    title: "Pending",
    value: `₹${summary.pending_balance.toLocaleString("en-IN")}`,
    icon: CreditCard,
    color: "bg-orange-50 text-orange-600",
  },

  {
    title: "This Month",
    value: `₹${summary.this_month.toLocaleString("en-IN")}`,
    icon: Calendar,
    color: "bg-violet-50 text-violet-600",
  },

].map((card) => {

          const Icon = card.icon;

          return (

            <div
              key={card.title}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <h2 className="text-2xl font-bold">
                {card.value}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {card.title}
              </p>

            </div>

          );

        })}

      </div>

            {/* Performance */}

      <div className="grid gap-6 xl:grid-cols-3">

        {/* Monthly Earnings */}

        <div className="xl:col-span-2 rounded-2xl border border-border bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h2 className="text-lg font-bold">
                Monthly Earnings
              </h2>

              <p className="text-sm text-muted-foreground">
                Income generated over the last 6 months
              </p>

            </div>

          </div>

       <div className="space-y-5">

  {monthly.map((item) => {

    const percentage =
      summary.total_earnings > 0
        ? (item.amount / summary.total_earnings) * 100
        : 0;

    return (

      <div key={item.month}>

        <div className="mb-2 flex items-center justify-between">

          <span className="text-sm font-medium">
            {item.month}
          </span>

          <span className="text-sm font-semibold">
            ₹{item.amount.toLocaleString("en-IN")}
          </span>

        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">

          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${Math.min(percentage, 100)}%`,
            }}
          />

        </div>

      </div>

    );

  })}

</div>

        </div>


       {/* Earnings Breakdown */}

<div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

  <h2 className="text-lg font-bold">
    Earnings Breakdown
  </h2>

  <p className="mb-5 text-sm text-muted-foreground">
    Revenue by service
  </p>

  <div className="space-y-4">

    {breakdown.length > 0 ? (

      breakdown.map((item) => (

        <div
          key={item.service}
          className="flex items-center justify-between rounded-xl border border-border p-3"
        >

          <div>

            <p className="font-medium">
              {item.service}
            </p>

            <p className="text-xs text-muted-foreground">
              {item.percentage}% of total income
            </p>

          </div>

          <span className="font-bold">
            ₹{Number(item.amount).toLocaleString("en-IN")}
          </span>

        </div>

      ))

    ) : (

      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No earnings available.
      </div>

    )}

  </div>

</div>

</div>

{/* Recent Transactions */}

<div className="rounded-2xl border border-border bg-white shadow-sm">

  <div className="flex items-center justify-between border-b border-border px-6 py-5">

    <div>

      <h2 className="text-lg font-bold">
        Recent Transactions
      </h2>

      <p className="text-sm text-muted-foreground">
        Latest payments received from candidates
      </p>

    </div>

    <button className="text-sm font-semibold text-primary hover:underline">
      View All
    </button>

  </div>

  <div className="divide-y divide-border">

    {transactions.length > 0 ? (

      transactions.map((item) => (

        <div
          key={item.id}
          className="flex flex-col gap-4 px-6 py-5 transition hover:bg-muted/40 lg:flex-row lg:items-center lg:justify-between"
        >

          {/* Left */}

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">

              {item.candidate
                .split(" ")
                .map((word) => word[0])
                .join("")}

            </div>

            <div>

              <h3 className="font-semibold">
                {item.candidate}
              </h3>

              <p className="text-sm text-muted-foreground">
                {item.service}
              </p>

              <p className="text-xs text-primary">
                {item.reference}
              </p>

            </div>

          </div>

          {/* Right */}

          <div className="flex flex-wrap items-center gap-5">

            <div className="text-right">

              <p className="font-bold">
                ₹{Number(item.amount).toLocaleString("en-IN")}
              </p>

              <p className="text-xs text-muted-foreground">
                {item.date}
              </p>

            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                item.status.toLowerCase() === "success"
                  ? "bg-green-50 text-green-700"
                  : item.status.toLowerCase() === "pending"
                  ? "bg-orange-50 text-orange-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {item.status}
            </span>

            <button className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
              Receipt
            </button>

          </div>

        </div>

      ))

    ) : (

      <div className="p-10 text-center text-sm text-muted-foreground">
        No transactions found.
      </div>

    )}

 </div>

      </div>

          </div>
  );
}