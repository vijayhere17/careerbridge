import { Link } from "@tanstack/react-router";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { recruiterStats, unlockTx } from "@/data/recruiter";
import { Wallet, Clock, TrendingUp, ArrowDownToLine, Search, Download } from "lucide-react";

const cards = [
  {
    label: "Available Balance",
    value: `₹${recruiterStats.walletBalance.toLocaleString()}`,
    icon: Wallet,
    tint: "bg-primary-soft text-primary",
  },
  {
    label: "Pending",
    value: `₹${recruiterStats.pending.toLocaleString()}`,
    icon: Clock,
    tint: "bg-accent-soft text-accent-foreground",
  },
  {
    label: "Lifetime Earnings",
    value: `₹${recruiterStats.lifetimeEarnings.toLocaleString()}`,
    icon: TrendingUp,
    tint: "bg-secondary-soft text-secondary",
  },
];

export function WalletPage() {
  return (
    <RecruiterLayout
      title="Wallet"
      subtitle="Your earnings summary and transaction history"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/recruiter/withdraw">
            <ArrowDownToLine className="h-4 w-4" /> Withdraw
          </Link>
        </Button>
      }
    >
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${c.tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{c.label}</p>
              <p className="font-display text-3xl font-bold">{c.value}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h3 className="font-semibold">Transaction History</h3>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 w-full sm:w-56" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="unlock">Unlock</SelectItem>
                  <SelectItem value="withdraw">Withdraw</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unlockTx.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">Contact unlock — {t.candidate}</TableCell>
                  <TableCell className="text-muted-foreground">{t.opportunity}</TableCell>
                  <TableCell className="text-right font-semibold text-secondary">
                    + ₹{t.amount}
                  </TableCell>
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
