import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { HrLayout } from "@/components/hr/HrLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hrService } from "@/services/hrService";
import { cn } from "@/lib/utils";

export function HrNotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await hrService.notifications();
      setItems(res.data.notifications);
      setUnread(res.data.unread_count);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <HrLayout
      title="Notifications"
      subtitle={`${unread} unread`}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await hrService.markAllNotificationsRead();
            load();
          }}
        >
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={async () => {
                if (!n.is_read) {
                  await hrService.markNotificationRead(n.id);
                  load();
                }
              }}
              className={cn(
                "w-full text-left rounded-2xl border border-border p-4 transition-colors",
                n.is_read ? "bg-card" : "bg-primary-soft/40",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </HrLayout>
  );
}

export function HrSettingsPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    interview_reminders: true,
    application_alerts: true,
    weekly_digest: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrService
      .getSettings()
      .then((res) => {
        setName(res.data.profile?.name ?? "");
        setMobile(res.data.profile?.mobile ?? "");
        setEmail(res.data.profile?.email ?? "");
        if (res.data.preferences) setPrefs((p) => ({ ...p, ...res.data.preferences }));
      })
      .catch((err) => setError(err?.message ?? "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <HrLayout title="Settings" subtitle="Profile, password and notification preferences">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {message && (
            <div className="mb-4 rounded-xl border border-secondary/30 bg-secondary-soft p-3 text-sm text-secondary">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <div className="max-w-xl rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </div>
                <Button
                  variant="brand"
                  onClick={async () => {
                    setMessage("");
                    setError("");
                    try {
                      await hrService.updateSettingsProfile({ name, mobile });
                      setMessage("Profile updated.");
                    } catch (err: any) {
                      setError(err?.message ?? "Update failed");
                    }
                  }}
                >
                  Save profile
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="password" className="mt-4">
              <div className="max-w-xl rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
                <div className="space-y-2">
                  <Label>Current password</Label>
                  <Input
                    type="password"
                    value={passwords.current_password}
                    onChange={(e) => setPasswords((p) => ({ ...p, current_password: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>New password</Label>
                  <Input
                    type="password"
                    value={passwords.password}
                    onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm password</Label>
                  <Input
                    type="password"
                    value={passwords.password_confirmation}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, password_confirmation: e.target.value }))
                    }
                  />
                </div>
                <Button
                  variant="brand"
                  onClick={async () => {
                    setMessage("");
                    setError("");
                    try {
                      await hrService.changePassword(passwords);
                      setPasswords({ current_password: "", password: "", password_confirmation: "" });
                      setMessage("Password changed.");
                    } catch (err: any) {
                      setError(err?.message ?? "Password change failed");
                    }
                  }}
                >
                  Change password
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-4">
              <div className="max-w-xl rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
                {(
                  [
                    ["email_notifications", "Email notifications"],
                    ["interview_reminders", "Interview reminders"],
                    ["application_alerts", "Application alerts"],
                    ["weekly_digest", "Weekly digest"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <Label>{label}</Label>
                    <Switch
                      checked={prefs[key]}
                      onCheckedChange={(checked) => setPrefs((p) => ({ ...p, [key]: checked }))}
                    />
                  </div>
                ))}
                <Button
                  variant="brand"
                  onClick={async () => {
                    setMessage("");
                    setError("");
                    try {
                      await hrService.updatePreferences(prefs);
                      setMessage("Preferences saved.");
                    } catch (err: any) {
                      setError(err?.message ?? "Could not save preferences");
                    }
                  }}
                >
                  Save preferences
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </HrLayout>
  );
}
