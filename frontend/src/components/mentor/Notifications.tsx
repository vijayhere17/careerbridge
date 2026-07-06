import { useState } from "react";
import {
  Bell,
  CalendarDays,
  Wallet,
  Star,
  BriefcaseBusiness,
  CheckCircle2,
  Filter,
  CheckCheck,
} from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "booking" | "payment" | "review" | "system";
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  {
    id: 1,
    title: "New Session Booked",
    message: "Rahul Sharma booked a Mock Interview for tomorrow at 7:00 PM.",
    type: "booking",
    time: "5 min ago",
    read: false,
  },
  {
    id: 2,
    title: "Payment Received",
    message: "₹999 has been credited to your wallet.",
    type: "payment",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    title: "New Review",
    message: "Priya Shah rated you 5★ after Resume Review.",
    type: "review",
    time: "Yesterday",
    read: true,
  },
  {
    id: 4,
    title: "Platform Update",
    message: "CareerBridge introduced Referral Mentorship services.",
    type: "system",
    time: "2 days ago",
    read: true,
  },
];

export function MentorNotifications() {

  const [items, setItems] = useState(notifications);

  const unread = items.filter((item) => !item.read).length;

  const markAllRead = () => {
    setItems(items.map((item) => ({ ...item, read: true })));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "booking":
        return <CalendarDays className="h-5 w-5 text-blue-600" />;

      case "payment":
        return <Wallet className="h-5 w-5 text-green-600" />;

      case "review":
        return <Star className="h-5 w-5 text-yellow-500" />;

      default:
        return <Bell className="h-5 w-5 text-violet-600" />;
    }
  };

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-2xl font-bold">
            Notifications
          </h1>

          <p className="text-sm text-muted-foreground">
            Stay updated with bookings, payments, reviews and platform updates.
          </p>

        </div>

        <div className="flex gap-3">

          <button
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 hover:bg-muted"
          >

            <Filter className="h-4 w-4" />

            Filter

          </button>

          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
          >

            <CheckCheck className="h-4 w-4" />

            Mark All Read

          </button>

        </div>

      </div>

      {/* Summary */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">

          <Bell className="mb-4 h-10 w-10 rounded-xl bg-primary/10 p-2 text-primary" />

          <h2 className="text-2xl font-bold">
            {items.length}
          </h2>

          <p className="text-sm text-muted-foreground">
            Total Notifications
          </p>

        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">

          <CalendarDays className="mb-4 h-10 w-10 rounded-xl bg-blue-50 p-2 text-blue-600" />

          <h2 className="text-2xl font-bold">
            {items.filter(i => i.type === "booking").length}
          </h2>

          <p className="text-sm text-muted-foreground">
            Bookings
          </p>

        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">

          <Wallet className="mb-4 h-10 w-10 rounded-xl bg-green-50 p-2 text-green-600" />

          <h2 className="text-2xl font-bold">
            {items.filter(i => i.type === "payment").length}
          </h2>

          <p className="text-sm text-muted-foreground">
            Payments
          </p>

        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">

          <CheckCircle2 className="mb-4 h-10 w-10 rounded-xl bg-orange-50 p-2 text-orange-600" />

          <h2 className="text-2xl font-bold">
            {unread}
          </h2>

          <p className="text-sm text-muted-foreground">
            Unread
          </p>

        </div>

      </div>

      {/* Notification List */}

      <div className="rounded-2xl border border-border bg-white shadow-sm">

        {items.map((item) => (

          <div
            key={item.id}
            className={`flex items-start gap-4 border-b border-border p-5 transition hover:bg-muted/40 ${
              !item.read ? "bg-primary/5" : ""
            }`}
          >

            <div className="mt-1">

              {getIcon(item.type)}

            </div>

            <div className="flex-1">

              <div className="flex items-center justify-between">

                <h3 className="font-semibold">

                  {item.title}

                </h3>

                <span className="text-xs text-muted-foreground">

                  {item.time}

                </span>

              </div>

              <p className="mt-2 text-sm text-muted-foreground">

                {item.message}

              </p>

            </div>

            {!item.read && (

              <div className="mt-2 h-3 w-3 rounded-full bg-primary" />

            )}

          </div>

        ))}

      </div>

            {/* Notification Preferences */}

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold">
            Notification Preferences
          </h2>

          <p className="mb-6 text-sm text-muted-foreground">
            Choose how you would like to receive notifications.
          </p>

          <div className="space-y-5">

            {[
              "Email Notifications",
              "SMS Notifications",
              "Push Notifications",
              "Session Reminders",
              "Payment Updates",
              "New Reviews",
            ].map((item) => (

              <label
                key={item}
                className="flex items-center justify-between rounded-xl border border-border p-4"
              >

                <span className="font-medium">
                  {item}
                </span>

                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 accent-primary"
                />

              </label>

            ))}

          </div>

        </div>

        {/* Quick Actions */}

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold">
            Quick Actions
          </h2>

          <p className="mb-6 text-sm text-muted-foreground">
            Frequently used notification actions.
          </p>

          <div className="space-y-4">

            <button className="w-full rounded-xl border border-border p-4 text-left transition hover:bg-muted">

              <h3 className="font-semibold">
                View Upcoming Sessions
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Check today's scheduled mentoring sessions.
              </p>

            </button>

            <button className="w-full rounded-xl border border-border p-4 text-left transition hover:bg-muted">

              <h3 className="font-semibold">
                View Payment History
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Review all recent payment transactions.
              </p>

            </button>

            <button className="w-full rounded-xl border border-border p-4 text-left transition hover:bg-muted">

              <h3 className="font-semibold">
                Open Reviews
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Reply to the latest candidate reviews.
              </p>

            </button>

          </div>

        </div>

      </div>

      {/* Empty State */}

      {items.length === 0 && (

        <div className="rounded-2xl border border-dashed border-border bg-white py-16 text-center">

          <Bell className="mx-auto h-12 w-12 text-muted-foreground" />

          <h2 className="mt-4 text-xl font-semibold">
            You're all caught up!
          </h2>

          <p className="mt-2 text-muted-foreground">
            No new notifications available.
          </p>

        </div>

      )}

    </div>

  );

}