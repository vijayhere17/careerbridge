import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth";
import {
  Wallet,
  Landmark,
  IndianRupee,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface WithdrawHistory {
  id: number;
  amount: number;
  bank: string;
  account: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
}

interface WithdrawBank {
  account_holder?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  upi_id?: string | null;
}

interface WithdrawSummary {
  available_balance: number;
  pending_withdraw: number;
  total_withdrawn: number;
  minimum_withdraw?: number;
}

interface WithdrawResponse {
  summary: WithdrawSummary;
  history: WithdrawHistory[];
  bank?: WithdrawBank | null;
}

export function MentorWithdrawRequest() {

  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [bankDetails, setBankDetails] = useState<WithdrawBank | null>(null);

const [summary, setSummary] = useState<WithdrawSummary>({
  available_balance: 0,
  pending_withdraw: 0,
  total_withdrawn: 0,
});

const [history, setHistory] = useState<WithdrawHistory[]>([]);

const [loading, setLoading] = useState(true);

const [submitting, setSubmitting] = useState(false);
const [cancellingId, setCancellingId] = useState<number | null>(null);

const [successMessage, setSuccessMessage] = useState("");
const [errorMessage, setErrorMessage] = useState("");

const [selectedWithdraw, setSelectedWithdraw] =
  useState<WithdrawHistory | null>(null);

const [showDetails, setShowDetails] = useState(false);

const loadData = async () => {
  try {
    const response = await apiFetch<WithdrawResponse>("/api/mentor/withdraw");
    setSummary(response.summary);
    setHistory(response.history);
    setBankDetails(response.bank ?? null);
  } catch (error) {
    console.error("Load withdraw data failed:", error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  void loadData();
}, []);


if (loading) {

  return (
    <div className="py-20 text-center">
      Loading...
    </div>
  );

}

const handleSubmit = async () => {
  if (!amount) {
    setErrorMessage("Please enter withdrawal amount.");
    setSuccessMessage("");
    return;
  }

  if (Number(amount) < (summary.minimum_withdraw ?? 500)) {
    setErrorMessage(`Minimum withdrawal amount is ₹${summary.minimum_withdraw ?? 500}.`);
    setSuccessMessage("");
    return;
  }

  if (Number(amount) > summary.available_balance) {
    setErrorMessage("Withdrawal amount exceeds available balance.");
    setSuccessMessage("");
    return;
  }

  if (!bankDetails?.bank_name || !bankDetails?.account_number) {
    setErrorMessage("Please add bank details in Profile Settings before withdrawing.");
    setSuccessMessage("");
    return;
  }

  setErrorMessage("");

  try {
    setSubmitting(true);

    await apiFetch("/api/mentor/withdraw", {
      method: "POST",
      body: JSON.stringify({
        amount: Number(amount),
        bank_name: bankDetails.bank_name,
        account_number: bankDetails.account_number,
        account_holder: bankDetails.account_holder,
        ifsc: bankDetails.ifsc_code,
        upi: bankDetails.upi_id,
        remarks,
      }),
    });

    setSuccessMessage("Withdrawal request submitted successfully.");
    setErrorMessage("");
    setAmount("");
    setRemarks("");
    await loadData();
  } catch (error: any) {
    setSuccessMessage("");
    setErrorMessage(error?.message ?? "Something went wrong.");
  } finally {
    setSubmitting(false);
  }
};

const handleCancel = async (id: number) => {
  try {
    setCancellingId(id);
    await apiFetch(`/api/mentor/withdraw/${id}/cancel`, { method: "POST" });
    setSuccessMessage("Pending withdrawal cancelled.");
    await loadData();
  } catch (error: any) {
    setErrorMessage(error?.message ?? "Could not cancel withdrawal.");
  } finally {
    setCancellingId(null);
  }
};

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-2xl font-bold">
            Withdraw Request
          </h1>

          <p className="text-sm text-muted-foreground">
            Request payouts directly to your registered bank account.
          </p>

        </div>

      </div>

      {/* Summary Cards */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">

        {[
          {
  title: "Available Balance",
  value: `₹${summary.available_balance.toLocaleString("en-IN")}`,
  icon: Wallet,
  color: "bg-green-50 text-green-600",
},

          {
  title: "Pending Withdraw",
  value: `₹${summary.pending_withdraw.toLocaleString("en-IN")}`,
  icon: Clock3,
  color: "bg-orange-50 text-orange-600",
},

          {
  title: "Total Withdrawn",
  value: `₹${summary.total_withdrawn.toLocaleString("en-IN")}`,
  icon: IndianRupee,
  color: "bg-blue-50 text-blue-600",
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

      {successMessage && (
  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
    {successMessage}
  </div>
)}

{errorMessage && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {errorMessage}
  </div>
)}

            {/* Withdraw Form */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Form */}

        <div className="lg:col-span-2 rounded-2xl border border-border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold">
            New Withdrawal Request
          </h2>

          <p className="mb-6 text-sm text-muted-foreground">
            Funds will be transferred to your registered bank account within
            24–48 hours after approval.
          </p>

          <div className="grid gap-5 md:grid-cols-2">

            {/* Amount */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Withdrawal Amount
              </label>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-primary"
              />

            </div>

            {/* Bank */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Bank Account
              </label>

              <div className="rounded-xl border border-border px-4 py-3 text-sm">
                {bankDetails?.bank_name && bankDetails?.account_number ? (
                  <>
                    <p className="font-semibold">{bankDetails.bank_name}</p>
                    <p className="text-muted-foreground">
                      {bankDetails.account_holder ? `${bankDetails.account_holder} · ` : ""}
                      ****{String(bankDetails.account_number).slice(-4)}
                      {bankDetails.ifsc_code ? ` · ${bankDetails.ifsc_code}` : ""}
                    </p>
                    {bankDetails.upi_id && (
                      <p className="text-xs text-muted-foreground mt-1">UPI: {bankDetails.upi_id}</p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    No bank details found. Add them in Profile Settings.
                  </p>
                )}
              </div>

            </div>

          </div>

          {/* Remarks */}

          <div className="mt-5">

            <label className="mb-2 block text-sm font-medium">
              Remarks (Optional)
            </label>

            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Write a note..."
              className="w-full rounded-xl border border-border p-4 outline-none focus:border-primary"
            />

          </div>

          {/* Submit */}

          <button
  onClick={handleSubmit}
  disabled={submitting}
  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
>

            <Wallet className="h-5 w-5" />

           {submitting ? "Submitting..." : "Submit Withdraw Request"}

          </button>

        </div>

        {/* Rules */}

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold">
            Withdrawal Rules
          </h2>

          <div className="mt-5 space-y-4">

            <div className="flex gap-3">

              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />

              <div>

                <p className="font-medium">
                  Minimum Withdrawal
                </p>

                <p className="text-sm text-muted-foreground">
                  ₹500
                </p>

              </div>

            </div>

            <div className="flex gap-3">

              <Clock3 className="mt-0.5 h-5 w-5 text-blue-600" />

              <div>

                <p className="font-medium">
                  Processing Time
                </p>

                <p className="text-sm text-muted-foreground">
                  24–48 Hours
                </p>

              </div>

            </div>

            <div className="flex gap-3">

              <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600" />

              <div>

                <p className="font-medium">
                  Important
                </p>

                <p className="text-sm text-muted-foreground">
                  Requests cannot be cancelled once approved.
                </p>

              </div>

            </div>

            <div className="rounded-xl bg-muted p-4">

              <p className="text-sm text-muted-foreground">
                Your earnings will be transferred only to your verified bank
                account. Ensure your account details are correct before
                requesting a withdrawal.
              </p>

            </div>

          </div>

        </div>

      </div>

            {/* Withdrawal History */}

      <div className="rounded-2xl border border-border bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-border px-6 py-5">

          <div>

            <h2 className="text-lg font-bold">
              Withdrawal History
            </h2>

            <p className="text-sm text-muted-foreground">
              Track all your withdrawal requests
            </p>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="bg-muted/40">

              <tr>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Amount
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Bank
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Account
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Date
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold">
                  Action
                </th>

              </tr>

            </thead>

           <tbody>

  {history.length > 0 ? (

    history.map((item) => (

      <tr
        key={item.id}
        className="border-t border-border hover:bg-muted/30"
      >

        <td className="px-6 py-5 font-semibold">
          ₹{Number(item.amount).toLocaleString("en-IN")}
        </td>

        <td className="px-6 py-5">
          {item.bank}
        </td>

        <td className="px-6 py-5">
          {item.account}
        </td>

        <td className="px-6 py-5">
          {item.date}
        </td>

        <td className="px-6 py-5">

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              item.status === "Approved"
                ? "bg-green-50 text-green-700"
                : item.status === "Pending"
                ? "bg-orange-50 text-orange-700"
                : "bg-red-50 text-red-700"
            }`}
          >

            {item.status}

          </span>

        </td>

        <td className="px-6 py-5 text-right">
          <div className="inline-flex gap-2">
            <button
              onClick={() => {
                setSelectedWithdraw(item);
                setShowDetails(true);
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              View
            </button>
            {item.status === "Pending" && (
              <button
                onClick={() => void handleCancel(item.id)}
                disabled={cancellingId === item.id}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                {cancellingId === item.id ? "..." : "Cancel"}
              </button>
            )}
          </div>
        </td>

      </tr>

    ))

  ) : (

    <tr>

      <td
        colSpan={6}
        className="px-6 py-10 text-center text-sm text-muted-foreground"
      >
        No withdrawal requests found.
      </td>

    </tr>

  )}

</tbody>

          </table>

        </div>

      </div>

          </div>
  );
}