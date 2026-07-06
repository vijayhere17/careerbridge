import { useState } from "react";
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
  status: "Pending" | "Approved" | "Rejected";
}

const history: WithdrawHistory[] = [
  {
    id: 1,
    amount: 5000,
    bank: "HDFC Bank",
    account: "XXXX4321",
    date: "20 Jun 2026",
    status: "Approved",
  },
  {
    id: 2,
    amount: 3000,
    bank: "ICICI Bank",
    account: "XXXX1245",
    date: "24 Jun 2026",
    status: "Pending",
  },
  {
    id: 3,
    amount: 2500,
    bank: "SBI",
    account: "XXXX8765",
    date: "27 Jun 2026",
    status: "Rejected",
  },
];

export function MentorWithdrawRequest() {

  const [amount, setAmount] = useState("");

  const [bank, setBank] = useState("HDFC Bank");

  const [remarks, setRemarks] = useState("");

  const availableBalance = 18400;

  const pendingWithdraw = 3000;

  const totalWithdrawn = 86500;

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
            value: `₹${availableBalance.toLocaleString()}`,
            icon: Wallet,
            color: "bg-green-50 text-green-600",
          },

          {
            title: "Pending Withdraw",
            value: `₹${pendingWithdraw.toLocaleString()}`,
            icon: Clock3,
            color: "bg-orange-50 text-orange-600",
          },

          {
            title: "Total Withdrawn",
            value: `₹${totalWithdrawn.toLocaleString()}`,
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

              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="h-11 w-full rounded-xl border border-border px-4 outline-none focus:border-primary"
              >

                <option>HDFC Bank • XXXX4321</option>

                <option>ICICI Bank • XXXX1245</option>

                <option>SBI • XXXX8765</option>

              </select>

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
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
          >

            <Wallet className="h-5 w-5" />

            Submit Withdraw Request

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

              {history.map((item) => (

                <tr
                  key={item.id}
                  className="border-t border-border hover:bg-muted/30"
                >

                  <td className="px-6 py-5 font-semibold">
                    ₹{item.amount.toLocaleString()}
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

                    <button
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                    >

                      View

                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

          </div>
  );
}