import { useState } from "react";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { notifications } from "@/data/recruiter";
import { Bell, CalendarClock, Users, CreditCard, Settings2, CheckCheck } from "lucide-react";

const filters = [
  { id: "All", icon: Bell },
  { id: "Booking", icon: CalendarClock },
  { id: "Application", icon: Users },
  { id: "Payment", icon: CreditCard },
  { id: "System", icon: Settings2 },
] as const;

export function NotificationsPage() {
  const [active, setActive] = useState<string>("All");
  const list = active === "All" ? notifications : notifications.filter((n) => n.type === active);

  return (
    <RecruiterLayout
      title="Notifications"
      subtitle="Stay updated with applications, payments and system alerts"
      actions={
        <Button variant="outline" size="sm">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      }
    >
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active === f.id
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {f.id}
            </button>
          );
        })}
      </div>

      <section className="mt-6 space-y-3">
        {list.map((n) => {
          const Icon = filters.find((f) => f.id === n.type)?.icon ?? Bell;
          const tint =
            n.type === "Payment"
              ? "bg-secondary-soft text-secondary"
              : n.type === "Application"
                ? "bg-primary-soft text-primary"
                : n.type === "Booking"
                  ? "bg-accent-soft text-accent-foreground"
                  : "bg-muted text-muted-foreground";
          return (
            <article
              key={n.id}
              className={`flex items-start gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card ${!n.read ? "ring-1 ring-primary/15" : ""}`}
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{n.title}</p>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </RecruiterLayout>
  );
}
