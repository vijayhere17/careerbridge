import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { OpportunitiesHub } from "@/components/users/OpportunitiesHub";
import { FindMentors } from "@/components/users/FindMentors";
import { MyBookings } from "@/components/users/MyBookings";
import { AppliedJobs } from "@/components/users/AppliedJobs";
import { AppliedInternships } from "@/components/users/AppliedInternships";
import { WalletPage } from "@/components/users/Wallet";
import { ReviewsPage } from "@/components/users/Reviews";
import { ProfileSettings } from "@/components/users/ProfileSettings";
import { SavedMentors } from "@/components/users/SavedMentors";
import { MentorDashboard } from "@/components/mentor/Dashboard";
import { MentorProfile } from "@/components/mentor/Profile";
import { MentorServices } from "@/components/mentor/Services";
import { MentorAvailability } from "@/components/mentor/Availability";
import { MentorIncomingRequests } from "@/components/mentor/IncomingRequests";
import { MentorUpcomingSessions } from "@/components/mentor/UpcomingSessions";
import { MentorSessionHistory } from "@/components/mentor/SessionHistory";
import { MentorEarnings } from "@/components/mentor/Earnings";
import { MentorWithdrawRequest } from "@/components/mentor/WithdrawRequest";
import { MentorWallet } from "@/components/mentor/Wallet";
import { MentorReviews } from "@/components/mentor/Reviews";
import { MentorNotifications } from "@/components/mentor/Notifications";
import { MentorProfileSettings } from "@/components/mentor/ProfileSettings";
import { MentorSetupPage } from "@/components/mentor/MentorSetup";
import { MentorReviewPage } from "@/components/mentor/MentorReview";
import { useEffect, useMemo, useState } from "react";
import {
  Bell, BriefcaseBusiness, CalendarDays, Compass, FileText,
  GraduationCap, HandCoins, Home, LayoutDashboard, LogOut,
  Settings, Star, UserRound, UsersRound, Wallet,
  CheckCircle, ArrowRight, Award, X, Menu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiFetch, clearAuth, getAuthToken, setAuth, type AuthUser } from "@/lib/auth";

type MentorSession = {
  id: number;
  mentor_name: string;
  topic: string;
  scheduled_at: string;
  status: string;
};
type MenuItem = { label: string; description: string; icon: LucideIcon };
type Role = AuthUser["role"];

const menu: Record<Role, MenuItem[]> = {
  seeker: [
    { label: "Dashboard Home",      description: "Overview, stats and quick actions",       icon: Home },
    { label: "Find Mentors",        description: "Search, filter and connect with mentors", icon: UsersRound },
    { label: "My Bookings",         description: "View all booked sessions",                icon: CalendarDays },
    { label: "Saved Mentors",       description: "Mentors saved for later",                 icon: UserRound },
    { label: "Opportunities Hub",   description: "Jobs, internships and freelance work",    icon: BriefcaseBusiness },
    { label: "Applied Jobs",        description: "Jobs you have applied for",               icon: FileText },
    { label: "Applied Internships", description: "Internships you have applied for",        icon: GraduationCap },
    { label: "Wallet",              description: "Balance, transactions and history",       icon: Wallet },
    { label: "Notifications",       description: "All alerts and updates",                  icon: Bell },
    { label: "Reviews",             description: "Ratings and feedback you've given",       icon: Star },
    { label: "Profile Settings",    description: "Manage your account and preferences",    icon: Settings },
  ],
mentor: [
  { label: "Dashboard", description: "Overview, bookings and earnings", icon: LayoutDashboard },
  { label: "Profile", description: "Manage your mentor profile", icon: UserRound },
  { label: "Services", description: "Manage mentoring services", icon: BriefcaseBusiness },
  { label: "Availability", description: "Manage your available slots", icon: CalendarDays },
  { label: "Incoming Requests", description: "Candidate booking requests", icon: Bell },
  { label: "Upcoming Sessions", description: "Scheduled mentoring sessions", icon: CalendarDays },
  { label: "Session History", description: "Completed mentoring sessions", icon: FileText },
  { label: "Earnings", description: "Income overview", icon: HandCoins },
  { label: "Withdraw Request", description: "Withdraw your earnings", icon: Wallet },
  { label: "Wallet", description: "Wallet & transactions", icon: Wallet },
  { label: "Reviews", description: "Candidate reviews", icon: Star },
  { label: "Notifications", description: "Alerts and reminders", icon: Bell },
  { label: "Profile Settings", description: "Account preferences", icon: Settings },
],
  opportunity_provider: [
    { label: "Dashboard",               description: "Overview, posts and earnings",      icon: LayoutDashboard },
    { label: "Profile",                 description: "Company, HR or recruiter profile",  icon: UserRound },
    { label: "Post Opportunity",        description: "Post a job, internship or project", icon: BriefcaseBusiness },
    { label: "Manage Posts",            description: "Edit, pause or close posts",        icon: FileText },
    { label: "Applications Received",   description: "View candidate applications",       icon: UsersRound },
    { label: "Contact Unlock Earnings", description: "Earnings from contact unlocks",     icon: HandCoins },
    { label: "Wallet",                  description: "Balance and transaction history",   icon: Wallet },
    { label: "Notifications",           description: "All alerts and updates",            icon: Bell },
  ],
  admin: [
    { label: "Dashboard",             description: "Platform overview and analytics",   icon: LayoutDashboard },
    { label: "Users",                 description: "Manage all platform users",         icon: UsersRound },
    { label: "Mentors",               description: "Verify and manage mentors",         icon: UserRound },
    { label: "Opportunity Providers", description: "Verify and manage providers",       icon: BriefcaseBusiness },
    { label: "Transactions",          description: "All payments and transactions",     icon: Wallet },
    { label: "Bookings",              description: "All bookings on the platform",      icon: CalendarDays },
    { label: "Reports",               description: "Sales, users and earnings reports", icon: FileText },
    { label: "Notifications",         description: "System notifications",              icon: Bell },
  ],
};

const roleTheme: Record<Role, { name: string; gradient: string; accent: string }> = {
  seeker:               { name: "Candidate",            gradient: "from-emerald-500 to-teal-600",   accent: "text-emerald-600" },
  mentor:               { name: "Mentor",               gradient: "from-violet-500 to-purple-600",  accent: "text-violet-600" },
  opportunity_provider: { name: "Opportunity Provider", gradient: "from-orange-500 to-amber-600",  accent: "text-orange-600" },
  admin:                { name: "Admin",                gradient: "from-red-500 to-rose-600",       accent: "text-red-600" },
};

const FULL_PAGE_VIEWS = [
  "Opportunities Hub", "Find Mentors", "My Bookings", "Applied Jobs",
  "Applied Internships", "Wallet", "Notifications", "Reviews",
  "Profile Settings", "Saved Mentors",
];

const BOTTOM_NAV_ITEMS: { label: string; icon: LucideIcon }[] = [
  { label: "Dashboard Home",    icon: Home },
  { label: "Find Mentors",      icon: UsersRound },
  { label: "Opportunities Hub", icon: BriefcaseBusiness },
  { label: "My Bookings",       icon: CalendarDays },
  { label: "Profile Settings",  icon: Settings },
];

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const router = useRouter();
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [active, setActive]     = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [mentorOnboardingStatus, setMentorOnboardingStatus] = useState<string | null>(null);

  const [dashboardStats, setDashboardStats] = useState({
    bookings: 0,
    appliedJobs: 0,
    savedMentors: 0,
    walletBalance: 0,
});
const [upcomingSessions, setUpcomingSessions] = useState<MentorSession[]>([]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    async function load() {
      const token = getAuthToken();
      if (!token) { router.navigate({ to: "/login" }); return; }
      try {
        const a = await apiFetch<{
  user: AuthUser;
  mentor_onboarding?: {
    has_profile: boolean;
    status: string;
    verified: boolean;
  } | null;
}>("/api/auth/user");

setAuth(a.user, token);
setUser(a.user);

if (a.user.role === "mentor") {
  setMentorOnboardingStatus(
    a.mentor_onboarding?.status ?? "profile_setup"
  );

  if (
    !a.mentor_onboarding ||
    a.mentor_onboarding.status !== "approved"
  ) {
    return;
  }
}

const [s, d] = await Promise.all([
  apiFetch<{ sessions: MentorSession[] }>("/api/sessions"),
  apiFetch<{
    stats: {
      bookings: number;
      appliedJobs: number;
      savedMentors: number;
      walletBalance: number;
    };
    upcomingSessions: MentorSession[];
  }>("/api/dashboard"),
]);

setSessions(s.sessions);
setDashboardStats(d.stats);
setUpcomingSessions(d.upcomingSessions);
setActive(menu[a.user.role][0].label);
      } catch {
        clearAuth();
        router.navigate({ to: "/login" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const items = useMemo(() => (user ? menu[user.role] : []), [user]);

  const logout = async () => {
    try { await apiFetch("/api/auth/logout", { method: "POST" }); } finally {
      clearAuth();
      router.navigate({ to: "/login" });
    }
  };

  if (loading || !user) return <div className="min-h-screen bg-background" />;

if (user.role === "mentor") {
  if (mentorOnboardingStatus === "profile_setup") {
    return <MentorSetupPage />;
  }

  if (
    mentorOnboardingStatus === "under_review" ||
    mentorOnboardingStatus === "rejected"
  ) {
    return <MentorReviewPage />;
  }
}

  const theme      = roleTheme[user.role];
  const activeItem = items.find((i) => i.label === active) ?? items[0];
  const firstName  = user.name.split(" ")[0];
  const initials   = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();


  const navigate = (label: string) => {
    setActive(label);
    setSidebarOpen(false);
  };

const renderContent = () => {

    // Candidate
    if (user.role === "seeker") {
        if (active === "Dashboard Home") return (
    <CandidateDashboard
    sessions={sessions}
    upcomingSessions={upcomingSessions}
    dashboardStats={dashboardStats}
    onNavigate={navigate}
/>
);
        if (active === "Find Mentors") return <FindMentors />;
        if (active === "My Bookings") return <MyBookings />;
        if (active === "Saved Mentors") return <SavedMentors onFindMentors={() => navigate("Find Mentors")} />;
        if (active === "Opportunities Hub") return <OpportunitiesHub />;
        if (active === "Applied Jobs") return <AppliedJobs />;
        if (active === "Applied Internships") return <AppliedInternships />;
        if (active === "Wallet") return <WalletPage />;
        if (active === "Reviews") return <ReviewsPage />;
        if (active === "Profile Settings") return <ProfileSettings />;
    }

    // Mentor
    if (user.role === "mentor") {
        if (active === "Dashboard") return <MentorDashboard onNavigate={navigate} />;
        if (active === "Profile") return <MentorProfile />;
        if (active === "Services") return <MentorServices />;
        if (active === "Availability") return <MentorAvailability />;
        if (active === "Incoming Requests") return <MentorIncomingRequests />;
        if (active === "Upcoming Sessions") return <MentorUpcomingSessions />;
        if (active === "Session History") return <MentorSessionHistory />;
        if (active === "Earnings") return <MentorEarnings />;
        if (active === "Withdraw Request") return <MentorWithdrawRequest />;
        if (active === "Wallet") return <MentorWallet />;
        if (active === "Reviews") return <MentorReviews />;
        if (active === "Notifications") return <MentorNotifications />;
        if (active === "Profile Settings") return <MentorProfileSettings />;
    }

    return <FeaturePanel item={activeItem} role={theme.name} />;
};

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top header ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-muted transition-colors lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-base">
              <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
                <Compass className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline font-display">Career <span className="text-primary">Bridge</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:block text-xs text-muted-foreground">{theme.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">

        {/* ── Sidebar overlay (mobile) ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside className={`
          fixed top-0 left-0 z-50 h-screen w-72 flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:h-auto lg:w-64 lg:translate-x-0 lg:flex lg:shrink-0
        `}>

          {/* Sidebar inner — scrollable */}
          <div className="flex flex-col h-full lg:h-auto lg:sticky lg:top-14 overflow-y-auto">

            {/* Profile card */}
            <div className="gradient-primary p-5 lg:rounded-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 text-white font-bold text-base backdrop-blur-sm">
                    {initials}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{firstName}</p>
                    <p className="text-white/70 text-[11px]">{theme.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Quick stats for seeker */}
              {user.role === "seeker" && (
                <div className="grid grid-cols-3 gap-2">
                 {[
    { label: "Sessions", value: dashboardStats.bookings },
    { label: "Applied", value: dashboardStats.appliedJobs },
    { label: "Saved", value: dashboardStats.savedMentors },
].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-white/10 p-2 text-center backdrop-blur-sm">
                      <p className="text-white font-bold text-base">{value}</p>
                      <p className="text-white/70 text-[10px]">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {user.role === "mentor" && (
  <div className="grid grid-cols-3 gap-2">
    {[
      { label: "Sessions", value: "48" },
      { label: "Rating", value: "4.9" },
      { label: "Wallet", value: "₹8K" },
    ].map(({ label, value }) => (
      <div
        key={label}
        className="rounded-lg bg-white/10 p-2 text-center backdrop-blur-sm"
      >
        <p className="text-white font-bold text-base">{value}</p>
        <p className="text-white/70 text-[10px]">{label}</p>
      </div>
    ))}
  </div>
)}
            </div>

            {/* Nav items */}
            <nav className="flex-1 bg-surface border-r border-border p-3 space-y-0.5 lg:min-h-[calc(100vh-14rem)]">
              {items.map((item) => {
                const Icon     = item.icon;
                const isActive = active === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.label)}
                    className={`
                      flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all
                      ${isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                    `}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-[13px] font-medium">{item.label}</span>
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar footer */}
            <div className="border-r border-t border-border bg-surface p-3">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 px-4 py-5 pb-24 lg:pb-6">
          {renderContent()}
        </main>
      </div>

      {/* ── Bottom nav (mobile only, seeker) ── */}
      {user.role === "seeker" && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-border bg-surface/95 backdrop-blur-sm">
          <div className="flex items-center justify-around px-2 py-2">
            {BOTTOM_NAV_ITEMS.map(({ label, icon: Icon }) => {
              const isActive = active === label;
              return (
                <button
                  key={label}
                  onClick={() => navigate(label)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
                >
                  <div className={`grid h-8 w-8 place-items-center rounded-xl transition-all ${isActive ? "bg-primary" : "bg-transparent"}`}>
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-[10px] font-medium leading-none ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {label === "Dashboard Home" ? "Home"
                      : label === "Find Mentors" ? "Mentors"
                      : label === "Opportunities Hub" ? "Jobs"
                      : label === "My Bookings" ? "Bookings"
                      : "Profile"}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function CandidateDashboard({
  sessions,
  upcomingSessions,
  dashboardStats,
  onNavigate,
}: {
  sessions: MentorSession[];
  upcomingSessions: MentorSession[];
  dashboardStats: {
    bookings: number;
    appliedJobs: number;
    savedMentors: number;
    walletBalance: number;
  };
  onNavigate: (label: string) => void;
}) {
  const upcoming = upcomingSessions.slice(0, 3);

  const stats = [
  {
    label: "Sessions",
    value: dashboardStats.bookings.toString(),
    icon: CalendarDays,
  },
  {
    label: "Applied",
    value: dashboardStats.appliedJobs.toString(),
    icon: BriefcaseBusiness,
  },
  {
    label: "Saved",
    value: dashboardStats.savedMentors.toString(),
    icon: UserRound,
  },
  {
    label: "Balance",
    value: `₹${dashboardStats.walletBalance}`,
    icon: Wallet,
  },
];

  const quickActions = [
    { label: "Find a Mentor",  desc: "Connect with experts",     icon: UsersRound,      nav: "Find Mentors" },
    { label: "Browse Jobs",    desc: "Explore opportunities",    icon: BriefcaseBusiness, nav: "Opportunities Hub" },
    { label: "My Bookings",    desc: "View upcoming sessions",   icon: CalendarDays,    nav: "My Bookings" },
    { label: "My Wallet",      desc: "Balance & transactions",   icon: Wallet,          nav: "Wallet" },
  ];

  const checklist = [
    { step: "1", title: "Complete your profile",   desc: "Add skills and goals",          done: false, nav: "Profile Settings" },
    { step: "2", title: "Find a mentor",           desc: "Connect with industry experts", done: false, nav: "Find Mentors" },
    { step: "3", title: "Browse opportunities",    desc: "Explore jobs & internships",    done: false, nav: "Opportunities Hub" },
    { step: "4", title: "Book your first session", desc: "Start your mentorship journey", done: sessions.length > 0, nav: "My Bookings" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 mb-3">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ label, desc, icon: Icon, nav }) => (
            <button
              key={label}
              onClick={() => onNavigate(nav)}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold group-hover:text-primary transition-colors leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Upcoming Sessions</p>
            <button onClick={() => onNavigate("My Bookings")} className="text-xs text-primary font-medium hover:underline">View all</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted mb-3">
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No sessions booked</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Book a session with a mentor</p>
              <button onClick={() => onNavigate("Find Mentors")} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Find a Mentor
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((s) => (
                <div key={s.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{s.topic}</p>
                    <p className="text-xs text-muted-foreground">with {s.mentor_name}</p>
                    <p className="text-[11px] text-primary mt-0.5">
                      {new Date(s.scheduled_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Getting Started</p>
          <div className="space-y-2">
            {checklist.map(({ step, title, desc, done, nav }) => (
              <button
                key={step}
                onClick={() => onNavigate(nav)}
                className="w-full flex items-center gap-3 rounded-xl border border-border p-3 text-left hover:border-primary/40 transition-all group"
              >
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${done ? "line-through text-muted-foreground" : "group-hover:text-primary transition-colors"}`}>{title}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Explore</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Top Mentors",       icon: Award,           nav: "Find Mentors" },
            { label: "Latest Jobs",       icon: BriefcaseBusiness, nav: "Opportunities Hub" },
            { label: "Notifications",     icon: Bell,            nav: "Notifications" },
            { label: "Saved Mentors",     icon: UserRound,       nav: "Saved Mentors" },
            { label: "My Reviews",        icon: Star,            nav: "Reviews" },
            { label: "Profile",           icon: Settings,        nav: "Profile Settings" },
          ].map(({ label, icon: Icon, nav }) => (
            <button
              key={label}
              onClick={() => onNavigate(nav)}
              className="flex items-center gap-2 rounded-xl border border-border p-3 hover:border-primary/40 hover:bg-muted/30 transition-all"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-medium truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturePanel({ item, role }: { item: MenuItem; role: string }) {
  const Icon = item.icon;
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 mx-auto mb-4">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h2 className="font-display text-xl font-bold">{item.label}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{item.description}</p>
      <p className="mt-3 text-xs text-muted-foreground">Coming soon</p>
    </div>
  );
}
