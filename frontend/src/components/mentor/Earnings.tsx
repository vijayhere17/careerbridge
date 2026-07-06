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
  service: TransactionType;
  company: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending";
}

const transactions: Transaction[] = [
  {
    id: 1,
    candidate: "Rahul Sharma",
    service: "Session",
    company: "Google",
    amount: 1499,
    date: "21 Jun 2026",
    status: "Paid",
  },
  {
    id: 2,
    candidate: "Priya Shah",
    service: "Resume Review",
    company: "Adobe",
    amount: 999,
    date: "22 Jun 2026",
    status: "Paid",
  },
  {
    id: 3,
    candidate: "Amit Patel",
    service: "Career Guidance",
    company: "Infosys",
    amount: 699,
    date: "24 Jun 2026",
    status: "Pending",
  },
];

const monthly = [
  { month: "Jan", value: 12000 },
  { month: "Feb", value: 15000 },
  { month: "Mar", value: 19000 },
  { month: "Apr", value: 21000 },
  { month: "May", value: 24500 },
  { month: "Jun", value: 28900 },
];

export function MentorEarnings() {

  const totalEarnings = transactions.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const availableBalance = 18400;

  const pendingBalance = transactions
    .filter((item) => item.status === "Pending")
    .reduce((sum, item) => sum + item.amount, 0);

  const thisMonth = 24500;

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
            value: `₹${totalEarnings.toLocaleString()}`,
            icon: IndianRupee,
            color: "bg-green-50 text-green-600",
          },

          {
            title: "Available",
            value: `₹${availableBalance.toLocaleString()}`,
            icon: Wallet,
            color: "bg-blue-50 text-blue-600",
          },

          {
            title: "Pending",
            value: `₹${pendingBalance.toLocaleString()}`,
            icon: CreditCard,
            color: "bg-orange-50 text-orange-600",
          },

          {
            title: "This Month",
            value: `₹${thisMonth.toLocaleString()}`,
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

              const percentage = (item.value / 30000) * 100;

              return (

                <div key={item.month}>

                  <div className="mb-2 flex items-center justify-between">

                    <span className="text-sm font-medium">
                      {item.month}
                    </span>

                    <span className="text-sm font-semibold">
                      ₹{item.value.toLocaleString()}
                    </span>

                  </div>

                  <div className="h-2 rounded-full bg-muted overflow-hidden">

                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${percentage}%`,
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

            {[
              {
                service: "Mock Interview",
                amount: "₹12,400",
                percent: "48%",
              },
              {
                service: "Resume Review",
                amount: "₹5,600",
                percent: "22%",
              },
              {
                service: "Career Guidance",
                amount: "₹3,900",
                percent: "15%",
              },
              {
                service: "Referral Bonus",
                amount: "₹2,600",
                percent: "10%",
              },
              {
                service: "Other",
                amount: "₹1,000",
                percent: "5%",
              },

            ].map((item) => (

              <div
                key={item.service}
                className="flex items-center justify-between rounded-xl border border-border p-3"
              >

                <div>

                  <p className="font-medium">
                    {item.service}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {item.percent} of total income
                  </p>

                </div>

                <span className="font-bold">
                  {item.amount}
                </span>

              </div>

            ))}

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

          {transactions.map((item) => (

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
                    {item.company}
                  </p>

                </div>

              </div>

              {/* Right */}

              <div className="flex flex-wrap items-center gap-5">

                <div className="text-right">

                  <p className="font-bold">
                    ₹{item.amount}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {item.date}
                  </p>

                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === "Paid"
                      ? "bg-green-50 text-green-700"
                      : "bg-orange-50 text-orange-700"
                  }`}
                >
                  {item.status}
                </span>

                <button className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">

                  Receipt

                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

          </div>
  );
}