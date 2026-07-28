import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Wallet,
  Star,
  CheckCircle2,
  CheckCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  time: string;
  read: boolean;
}

interface Summary {
  total: number;
  bookings: number;
  payments: number;
  unread: number;
}

export function SeekerNotifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    bookings: 0,
    payments: 0,
    unread: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<{
        notifications: Notification[];
        summary: Summary;
      }>("/api/seeker/notifications");
      setItems(response.notifications ?? []);
      setSummary(response.summary ?? { total: 0, bookings: 0, payments: 0, unread: 0 });
    } catch (err) {
      console.error(err);
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch("/api/seeker/notifications/read-all", { method: "POST" });
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setSummary((prev) => ({ ...prev, unread: 0 }));
    } catch (err) {
      console.error(err);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await apiFetch(`/api/seeker/notifications/${id}/read`, { method: "POST" });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      setSummary((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <CalendarDays className="h-5 w-5 text-blue-600" />;
      case "payment":
        return <Wallet className="h-5 w-5 text-green-600" />;
      case "review":
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading notifications…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Bookings, payments, reminders, and system updates.
          </p>
        </div>
        <button
          onClick={() => void markAllRead()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <CheckCheck className="h-4 w-4" />
          Mark All Read
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total", value: summary.total, icon: Bell },
          { label: "Bookings", value: summary.bookings, icon: CalendarDays },
          { label: "Payments", value: summary.payments, icon: Wallet },
          { label: "Unread", value: summary.unread, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Icon className="mb-4 h-10 w-10 rounded-xl bg-primary/10 p-2 text-primary" />
            <h2 className="text-2xl font-bold">{value}</h2>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button className="ml-3 underline" onClick={() => void load()}>Retry</button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.read) void markOneRead(item.id);
              }}
              className={`flex cursor-pointer items-start gap-4 border-b border-border p-5 transition hover:bg-muted/40 ${
                !item.read ? "bg-primary/5" : ""
              }`}
            >
              <div className="mt-1">{getIcon(item.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{item.title}</h3>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
              </div>
              {!item.read && <div className="mt-2 h-3 w-3 rounded-full bg-primary" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
