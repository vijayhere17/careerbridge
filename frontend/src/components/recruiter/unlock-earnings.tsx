import { Link } from "@tanstack/react-router";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { recruiterStats, unlockTx, earningsChart } from "@/data/recruiter";
import { Coins, TrendingUp, Wallet, Users2, ArrowDownToLine } from "lucide-react";

const cards = [
  {
    label: "Today's Earnings",
    value: `₹${recruiterStats.todayUnlockEarnings.toLocaleString()}`,
    sub: "+18% vs yesterday",
    icon: Coins,
    tint: "bg-accent-soft text-accent-foreground",
  },
  {
    label: "This Month",
    value: `₹${recruiterStats.monthEarnings.toLocaleString()}`,
    sub: "Jul 2026",
    icon: TrendingUp,
    tint: "bg-primary-soft text-primary",
  },
  {
    label: "Lifetime Earnings",
    value: `₹${recruiterStats.lifetimeEarnings.toLocaleString()}`,
    sub: "All time",
    icon: Wallet,
    tint: "bg-secondary-soft text-secondary",
  },
  {
    label: "Total Contact Unlocks",
    value: recruiterStats.totalUnlocks.toLocaleString(),
    sub: "Candidates",
    icon: Users2,
    tint: "bg-primary-soft text-primary",
  },
];

export function UnlockEarnings() {
  const max = Math.max(...earningsChart.map((d) => d.amount));
  return (
    <RecruiterLayout
      title="Contact Unlock Earnings"
      subtitle="Track earnings from paid contact unlocks"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/recruiter/withdraw">
            <ArrowDownToLine className="h-4 w-4" /> Withdraw
          </Link>
        </Button>
      }
    >
      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{c.label}</p>
              <p className="font-display text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-secondary">{c.sub}</p>
            </div>
          );
        })}
      </section>

      {/* Chart */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Weekly earnings</h3>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
          <span className="text-xs text-muted-foreground">₹ Amount</span>
        </div>
        <div className="mt-6 flex items-end justify-between gap-2 sm:gap-4 h-48">
          {earningsChart.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-lg gradient-primary"
                  style={{ height: `${(d.amount / max) * 100}%` }}
                  title={`₹${d.amount}`}
                />
              </div>
              <div className="text-xs text-muted-foreground">{d.day}</div>
              <div className="text-xs font-medium">₹{d.amount}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Transactions */}
      <section className="mt-6 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-semibold">Recent Transactions</h3>
          <Button variant="outline" size="sm">
            Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Opportunity</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unlockTx.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.candidate}</TableCell>
                  <TableCell className="text-muted-foreground">{t.opportunity}</TableCell>
                  <TableCell className="text-right font-semibold">₹{t.amount}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.date}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.status === "Success" ? "bg-secondary-soft text-secondary" : "bg-destructive/10 text-destructive"}`}
                    >
                      {t.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </RecruiterLayout>
  );
}
