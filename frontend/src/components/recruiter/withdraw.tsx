import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { recruiterStats, withdrawHistory } from "@/data/recruiter";
import { Wallet, Clock, CheckCircle2, Send } from "lucide-react";

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
    label: "Withdrawn",
    value: `₹${recruiterStats.withdrawn.toLocaleString()}`,
    icon: CheckCircle2,
    tint: "bg-secondary-soft text-secondary",
  },
];

export function WithdrawPage() {
  return (
    <RecruiterLayout
      title="Withdraw Request"
      subtitle="Move your earnings to a linked bank account"
    >
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{c.label}</p>
              <p className="font-display text-2xl font-bold">{c.value}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-2">
          <h3 className="font-semibold">Request withdrawal</h3>
          <p className="text-sm text-muted-foreground">
            Withdrawals are processed within 24–48 hours.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" placeholder="e.g. 5000" />
              <p className="text-xs text-muted-foreground">
                Min ₹500 · Max ₹{recruiterStats.walletBalance.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Bank</Label>
              <Select defaultValue="hdfc">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hdfc">HDFC ••4321 (Primary)</SelectItem>
                  <SelectItem value="icici">ICICI ••8890</SelectItem>
                  <SelectItem value="add">+ Add new bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="remarks">Remarks (optional)</Label>
              <Textarea id="remarks" rows={3} placeholder="Any note for finance team..." />
            </div>
          </div>
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              By submitting, you accept the payout terms.
            </p>
            <Button variant="brand">
              <Send className="h-4 w-4" /> Submit request
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-primary-soft/40 p-6">
          <h4 className="font-semibold">Payout details</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Standard payout: 24–48 hrs</li>
            <li>• Instant payout: available above ₹2,000 (₹15 fee)</li>
            <li>• Weekend requests process on next business day</li>
            <li>• TDS applicable per Indian tax law</li>
          </ul>
        </div>
      </section>

      {/* History */}
      <section className="mt-6 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-semibold">Withdrawal history</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawHistory.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="text-right font-semibold">
                    ₹{w.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{w.method}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{w.date}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${w.status === "Completed" ? "bg-secondary-soft text-secondary" : "bg-accent-soft text-accent-foreground"}`}
                    >
                      {w.status}
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
