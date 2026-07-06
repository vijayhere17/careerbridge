import { useState } from "react";
import {
  Wallet, Plus, ArrowDownLeft, ArrowUpRight,
  Clock, CheckCircle2, XCircle, X, CreditCard,
  Smartphone, Building2, ChevronRight, Copy, Shield,
  RefreshCw, AlertCircle,
} from "lucide-react";

type TxType = "credit" | "debit";
type TxStatus = "success" | "pending" | "failed";
type TxCategory = "deposit" | "session" | "unlock" | "refund";

interface Transaction {
  id: string;
  type: TxType;
  category: TxCategory;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  status: TxStatus;
  ref: string;
}

const MOCK_TXS: Transaction[] = [
  { id: "t1", type: "debit",  category: "session", title: "Session with Priya Sharma",      subtitle: "PM Mock Interview · 60 min",           amount: 1499, date: "2025-07-15", status: "success", ref: "CB2507150001" },
  { id: "t2", type: "credit", category: "refund",  title: "Refund – Anjali Menon",           subtitle: "Session cancelled by mentor",           amount: 1199, date: "2025-07-12", status: "success", ref: "CB2507120004" },
  { id: "t3", type: "credit", category: "deposit", title: "Wallet Top-up",                   subtitle: "UPI · vijay@okaxis",                    amount: 2000, date: "2025-07-10", status: "success", ref: "CB2507100003" },
  { id: "t4", type: "debit",  category: "unlock",  title: "Contact Unlock – Razorpay",       subtitle: "Senior Full-Stack Engineer",            amount: 49,   date: "2025-07-08", status: "success", ref: "CB2507080002" },
  { id: "t5", type: "debit",  category: "session", title: "Session with Rahul Verma",        subtitle: "System Design Deep Dive · 90 min",     amount: 1999, date: "2025-07-05", status: "success", ref: "CB2507050001" },
  { id: "t6", type: "credit", category: "deposit", title: "Wallet Top-up",                   subtitle: "Credit Card · HDFC ****4321",           amount: 5000, date: "2025-07-01", status: "success", ref: "CB2507010002" },
  { id: "t7", type: "debit",  category: "unlock",  title: "Contact Unlock – TalentBridge",   subtitle: "Hiring for 12 Senior Engineers",        amount: 19,   date: "2025-06-28", status: "success", ref: "CB2506280003" },
  { id: "t8", type: "credit", category: "deposit", title: "Wallet Top-up",                   subtitle: "UPI · vijay@okaxis",                    amount: 1000, date: "2025-06-25", status: "pending", ref: "CB2506250001" },
  { id: "t9", type: "debit",  category: "session", title: "Session with Karan Mehta",        subtitle: "Portfolio Review · 60 min",             amount: 999,  date: "2025-06-20", status: "failed",  ref: "CB2506200001" },
];

const CATEGORY_CONFIG: Record<TxCategory, { label: string; icon: React.ElementType }> = {
  deposit: { label: "Top-up",  icon: Plus },
  session: { label: "Session", icon: Wallet },
  unlock:  { label: "Unlock",  icon: Shield },
  refund:  { label: "Refund",  icon: RefreshCw },
};

const STATUS_CONFIG: Record<TxStatus, { label: string; color: string; icon: React.ElementType }> = {
  success: { label: "Success", color: "text-primary",          icon: CheckCircle2 },
  pending: { label: "Pending", color: "text-amber-600",        icon: Clock },
  failed:  { label: "Failed",  color: "text-red-500",          icon: XCircle },
};

const AMOUNT_PRESETS = [500, 1000, 2000, 5000];

const PAYMENT_METHODS = [
  { id: "upi",    label: "UPI",          subtitle: "Google Pay, PhonePe, Paytm", icon: Smartphone },
  { id: "card",   label: "Credit / Debit Card", subtitle: "Visa, Mastercard, RuPay",  icon: CreditCard },
  { id: "netbanking", label: "Net Banking", subtitle: "All major banks",          icon: Building2 },
];

type View = "home" | "topup" | "history";
type FilterType = "all" | TxCategory;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function TxIcon({ type, category }: { type: TxType; category: TxCategory }) {
  const CatIcon = CATEGORY_CONFIG[category].icon;
  return (
    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${type === "credit" ? "bg-primary/10" : "bg-muted"}`}>
      <CatIcon className={`h-4 w-4 ${type === "credit" ? "text-primary" : "text-muted-foreground"}`} />
    </div>
  );
}

function TransactionCard({ tx }: { tx: Transaction }) {
  const [copied, setCopied] = useState(false);
  const statusCfg = STATUS_CONFIG[tx.status];
  const StatusIcon = statusCfg.icon;

  const copy = () => {
    navigator.clipboard.writeText(tx.ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5">
      <TxIcon type={tx.type} category={tx.category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{tx.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{tx.subtitle}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-bold ${tx.type === "credit" ? "text-primary" : "text-foreground"}`}>
              {tx.type === "credit" ? "+" : "−"}₹{tx.amount.toLocaleString()}
            </p>
            <div className={`flex items-center justify-end gap-0.5 text-[11px] font-medium ${statusCfg.color}`}>
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </div>
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">{formatDate(tx.date)}</span>
          <button onClick={copy} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
            <Copy className="h-3 w-3" />
            {copied ? "Copied!" : tx.ref}
          </button>
        </div>
      </div>
    </div>
  );
}

function TopUpModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (amount: number) => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("upi");
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [error, setError] = useState("");

  const numAmount = parseInt(amount) || 0;

  const handlePay = () => {
    if (numAmount < 100) { setError("Minimum top-up amount is ₹100."); return; }
    if (numAmount > 50000) { setError("Maximum top-up amount is ₹50,000."); return; }
    setError("");
    setStep("processing");
    setTimeout(() => { setStep("success"); }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 lg:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-surface shadow-xl">
        {step === "form" && (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm">Add Money to Wallet</h3>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Enter Amount</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(""); }}
                    placeholder="0"
                    className="dash-input w-full pl-7 text-lg font-bold"
                  />
                </div>
                {error && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-500">
                    <AlertCircle className="h-3 w-3" /> {error}
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  {AMOUNT_PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(p.toString())}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${amount === p.toString() ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
                    >
                      ₹{p.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment Method</p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${method === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                      >
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{m.label}</p>
                          <p className="text-[11px] text-muted-foreground">{m.subtitle}</p>
                        </div>
                        <div className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${method === m.id ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                          {method === m.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-muted p-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <p className="text-[11px] text-muted-foreground">Secured by 256-bit encryption. CareerBridge never stores card details.</p>
              </div>

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handlePay}
                  disabled={!numAmount}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Pay ₹{numAmount > 0 ? numAmount.toLocaleString() : "—"}
                </button>
              </div>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-14 px-6">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="font-semibold text-sm">Processing payment…</p>
            <p className="text-xs text-muted-foreground mt-1">Please do not close this window</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center text-center py-10 px-6">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-base">Money Added!</h3>
            <p className="text-3xl font-bold text-primary mt-2">₹{numAmount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">has been added to your wallet.</p>
            <button
              onClick={() => onSuccess(numAmount)}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function WalletPage() {
  const [balance, setBalance] = useState(2235);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TXS);
  const [view, setView] = useState<View>("home");
  const [showTopUp, setShowTopUp] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const handleTopUpSuccess = (amount: number) => {
    setBalance((b) => b + amount);
    setTransactions((prev) => [{
      id: `t${Date.now()}`,
      type: "credit",
      category: "deposit",
      title: "Wallet Top-up",
      subtitle: PAYMENT_METHODS.find(() => true)?.label ?? "UPI",
      amount,
      date: new Date().toISOString().split("T")[0],
      status: "success",
      ref: `CB${Date.now()}`,
    }, ...prev]);
    setShowTopUp(false);
  };

  const FILTER_TABS: { id: FilterType; label: string }[] = [
    { id: "all",     label: "All" },
    { id: "deposit", label: "Top-ups" },
    { id: "session", label: "Sessions" },
    { id: "unlock",  label: "Unlocks" },
    { id: "refund",  label: "Refunds" },
  ];

  const filtered = transactions.filter((t) => {
    const matchFilter = filter === "all" || t.category === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalSpent   = transactions.filter((t) => t.type === "debit"  && t.status === "success").reduce((s, t) => s + t.amount, 0);
  const totalDeposit = transactions.filter((t) => t.type === "credit" && t.status === "success" && t.category === "deposit").reduce((s, t) => s + t.amount, 0);
  const totalRefund  = transactions.filter((t) => t.category === "refund" && t.status === "success").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Available Balance</p>
        <p className="mt-1 text-4xl font-bold">₹{balance.toLocaleString()}</p>
        <p className="mt-0.5 text-xs opacity-70">CareerBridge Wallet</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowTopUp(true)}
            className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Money
          </button>
          <button
            onClick={() => setView("history")}
            className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Added",  value: `₹${totalDeposit.toLocaleString()}`,  icon: ArrowDownLeft },
          { label: "Total Spent",  value: `₹${totalSpent.toLocaleString()}`,    icon: ArrowUpRight },
          { label: "Refunds",      value: `₹${totalRefund.toLocaleString()}`,   icon: RefreshCw },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-3 text-center">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 mx-auto mb-2">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Transactions</p>
          <button onClick={() => setView("history")} className="text-xs text-primary font-medium hover:underline">
            View all
          </button>
        </div>

        {transactions.slice(0, 4).length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted mb-3">
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add money to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 4).map((tx) => (
              <TransactionCard key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>

      {view === "history" && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 lg:items-stretch" onClick={() => setView("home")}>
          <div
            className="relative flex h-[92vh] w-full flex-col rounded-t-2xl bg-surface lg:h-full lg:w-[460px] lg:rounded-none lg:rounded-l-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
              <span className="font-semibold text-sm">Transaction History</span>
              <button onClick={() => setView("home")} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 border-b border-border">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions…"
                  className="dash-input w-full pl-3"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`shrink-0 rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${filter === tab.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted mb-3">
                    <Wallet className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No transactions found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different filter.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((tx) => <TransactionCard key={tx.id} tx={tx} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTopUp && (
        <TopUpModal
          onClose={() => setShowTopUp(false)}
          onSuccess={handleTopUpSuccess}
        />
      )}
    </div>
  );
}