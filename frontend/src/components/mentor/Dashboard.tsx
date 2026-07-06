import {
  CalendarDays, Wallet, Bell, BriefcaseBusiness,
  Clock3, HandCoins, Star, UserCircle2, ArrowRight,
  Video, Phone, MessageCircle, CheckCircle2,
  TrendingUp, Users, BadgeCheck, ChevronRight,
} from "lucide-react";

type SessionType = "Video Call" | "Audio Call" | "Chat";

const SESSION_ICONS: Record<SessionType, React.ElementType> = {
  "Video Call": Video,
  "Audio Call": Phone,
  "Chat":       MessageCircle,
};

const UPCOMING = [
  { id: 1, name: "Rahul Patel",  initials: "RP", service: "Resume Review",    type: "Video Call" as SessionType, time: "07:00 PM", date: "Today",    amount: 149 },
  { id: 2, name: "Sneha Kapoor", initials: "SK", service: "Career Guidance",   type: "Audio Call" as SessionType, time: "04:00 PM", date: "Tomorrow", amount: 699 },
];

const PENDING = [
  { id: 1, name: "Arjun Patel",  initials: "AP", service: "PM Mock Interview",   date: "24 Jul", amount: 1499 },
  { id: 2, name: "Prachi Shah",  initials: "PS", service: "Portfolio Review",     date: "26 Jul", amount: 999 },
  { id: 3, name: "Karan Singh",  initials: "KS", service: "Quick Chat",           date: "28 Jul", amount: 299 },
];

const REVIEWS = [
  { id: 1, name: "Rohan M.",  rating: 5, text: "Excellent session! Very structured and helpful.",  date: "2 days ago" },
  { id: 2, name: "Divya T.",  rating: 5, text: "Priya's mock interview was super realistic.",       date: "5 days ago" },
];

export function MentorDashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const nav = (page: string) => onNavigate?.(page);

  const stats = [
    { title: "Today's Sessions",  value: "3",       icon: CalendarDays, nav: "Upcoming Sessions" },
    { title: "Pending Requests",  value: "5",       icon: Bell,         nav: "Incoming Requests" },
    { title: "Wallet Balance",    value: "₹7,300",  icon: Wallet,       nav: "Wallet" },
    { title: "Monthly Earnings",  value: "₹24,500", icon: HandCoins,    nav: "Earnings" },
  ];

  const quickActions = [
    { title: "Services",     icon: BriefcaseBusiness, nav: "Services" },
    { title: "Availability", icon: CalendarDays,       nav: "Availability" },
    { title: "Sessions",     icon: Clock3,             nav: "Upcoming Sessions" },
    { title: "Wallet",       icon: Wallet,             nav: "Wallet" },
    { title: "Withdraw",     icon: HandCoins,          nav: "Withdraw Request" },
    { title: "Profile",      icon: UserCircle2,        nav: "Profile" },
  ];

  return (
    <div className="space-y-5">

      {/* Hero card */}
      <div className="rounded-2xl gradient-primary p-5 text-primary-foreground">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Mentor Dashboard</p>
            <h1 className="mt-1 text-xl font-bold">Good Morning, Vijay 👋</h1>
            <p className="mt-0.5 text-sm text-white/80">Senior Product Manager · Google</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <Star className="h-3 w-3 fill-white" /> 4.9 Rating
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <BadgeCheck className="h-3 w-3" /> Verified Mentor
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <Users className="h-3 w-3" /> 340 sessions
              </span>
            </div>
          </div>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-xl font-bold text-white">
            VP
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ title, value, icon: Icon, nav: navTo }) => (
          <button
            key={title}
            onClick={() => nav(navTo)}
            className="rounded-2xl border border-border bg-surface p-4 text-left hover:border-primary/40 hover:shadow-sm transition-all group"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 mb-3">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map(({ title, icon: Icon, nav: navTo }) => (
            <button
              key={title}
              onClick={() => nav(navTo)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-4 hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-semibold group-hover:text-primary transition-colors">{title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Upcoming Sessions</p>
          <button onClick={() => nav("Upcoming Sessions")} className="text-xs text-primary font-medium hover:underline">
            View all
          </button>
        </div>
        {UPCOMING.length === 0 ? (
          <div className="py-8 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming sessions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {UPCOMING.map((s) => {
              const Icon = SESSION_ICONS[s.type];
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                    {s.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.service}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-primary">{s.date} · {s.time}</p>
                    <span className="flex items-center justify-end gap-0.5 text-[11px] text-muted-foreground mt-0.5">
                      <Icon className="h-3 w-3" /> {s.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending requests */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending Requests</p>
          <button onClick={() => nav("Incoming Requests")} className="text-xs text-primary font-medium hover:underline">
            View all
          </button>
        </div>
        <div className="space-y-2">
          {PENDING.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-xs font-bold text-amber-700">
                {r.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{r.name}</p>
                <p className="text-[11px] text-muted-foreground">{r.service} · {r.date}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs font-bold text-primary">₹{r.amount.toLocaleString()}</span>
                <button
                  onClick={() => nav("Incoming Requests")}
                  className="rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings summary */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Earnings Overview</p>
          <button onClick={() => nav("Earnings")} className="text-xs text-primary font-medium hover:underline">Details</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total Earned",  value: "₹2.4L" },
            { label: "This Month",    value: "₹24,500" },
            { label: "Pending",       value: "₹3,200" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-muted p-3 text-center">
              <p className="text-base font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => nav("Withdraw Request")}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <HandCoins className="h-4 w-4" /> Request Withdrawal
        </button>
      </div>

      {/* Recent reviews */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Reviews</p>
          <button onClick={() => nav("Reviews")} className="text-xs text-primary font-medium hover:underline">View all</button>
        </div>
        <div className="space-y-3">
          {REVIEWS.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold">{r.name}</p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">"{r.text}"</p>
              <p className="text-[10px] text-muted-foreground mt-1">{r.date}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
