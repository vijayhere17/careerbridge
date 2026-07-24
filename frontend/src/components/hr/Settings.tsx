import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Bell, CheckCheck, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { HrLayout } from "@/components/hr/HrLayout";
import {
  HrConfirmDialog,
  HrEmptyState,
  HrErrorState,
  HrLoadingSkeleton,
  apiErrorMessage,
} from "@/components/hr/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { hrService } from "@/services/hrService";

type NotificationItem = {
  id: number;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  is_read?: boolean;
  created_at?: string | null;
};

type PaginatedNotifications = {
  data?: NotificationItem[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

type UnreadFilter = "all" | "unread" | "read";

type SettingsProfile = {
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
};

type SettingsData = {
  profile?: SettingsProfile | null;
  preferences?: PreferencesInput;
};

type Preferences = {
  email_notifications: boolean;
  interview_reminders: boolean;
  application_alerts: boolean;
  weekly_digest: boolean;
  candidate_updates: boolean;
  job_expiry_alerts: boolean;
};

type PreferencesInput = Partial<Record<keyof Preferences, unknown>>;

const defaultPreferences: Preferences = {
  email_notifications: true,
  interview_reminders: true,
  application_alerts: true,
  weekly_digest: false,
  candidate_updates: true,
  job_expiry_alerts: true,
};

const preferenceLabels: [keyof Preferences, string, string][] = [
  ["email_notifications", "Email notifications", "Receive important hiring updates by email."],
  ["interview_reminders", "Interview reminders", "Get reminders before upcoming interviews."],
  ["application_alerts", "Application alerts", "Notify me when new applications arrive."],
  ["weekly_digest", "Weekly digest", "Send a weekly recruiting performance summary."],
  ["candidate_updates", "Candidate updates", "Alert me when candidate records change."],
  ["job_expiry_alerts", "Job expiry alerts", "Notify me before job posts expire or close."],
];

export function HrNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadFilter, setUnreadFilter] = useState<UnreadFilter>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.notifications({
        page,
        per_page: 12,
        unread: unreadFilter === "all" ? undefined : unreadFilter === "unread",
        type: typeFilter === "all" ? undefined : typeFilter,
        search: appliedSearch || undefined,
      });
      const normalized = normalizeNotifications(res.data.notifications);
      setItems(normalized.items);
      setPage(normalized.currentPage);
      setLastPage(normalized.lastPage);
      setTotal(normalized.total);
      setUnreadCount(res.data.unread_count ?? 0);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load notifications");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page, typeFilter, unreadFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (notification: NotificationItem) => {
    if (notification.is_read) return;
    setSaving(true);
    try {
      await hrService.markNotificationRead(notification.id);
      toast.success("Notification marked as read");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not mark notification as read"));
    } finally {
      setSaving(false);
    }
  };

  const markAllRead = async () => {
    setSaving(true);
    try {
      await hrService.markAllNotificationsRead();
      toast.success("All notifications marked as read");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not mark all notifications as read"));
    } finally {
      setSaving(false);
    }
  };

  const deleteNotification = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await hrService.deleteNotification(deleteTarget.id);
      toast.success("Notification deleted");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete notification"));
    } finally {
      setSaving(false);
    }
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  return (
    <HrLayout
      title="Notifications"
      subtitle={`${unreadCount} unread${total ? ` - ${total} total` : ""}`}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={markAllRead}
          disabled={saving || unreadCount === 0}
        >
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      }
    >
      <form onSubmit={onSearch} className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={unreadFilter}
          onValueChange={(value) => {
            setUnreadFilter(value as UnreadFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All read states</SelectItem>
            <SelectItem value="unread">Unread only</SelectItem>
            <SelectItem value="read">Read only</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="application">Application</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="offer">Offer</SelectItem>
            <SelectItem value="job">Job</SelectItem>
            <SelectItem value="candidate">Candidate</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="mt-6">
        {loading ? (
          <HrLoadingSkeleton rows={5} />
        ) : error ? (
          <HrErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <HrEmptyState
            title="No notifications found"
            description="Try clearing filters or check back later for new updates."
            action={<Bell className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <div className="space-y-3">
            {items.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "rounded-2xl border border-border p-4 transition-colors",
                  notification.is_read ? "bg-card" : "bg-primary-soft/40",
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => markRead(notification)}
                    disabled={saving}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{notification.title ?? "Notification"}</p>
                      {!notification.is_read && <Badge>Unread</Badge>}
                      {notification.type && <Badge variant="outline">{notification.type}</Badge>}
                    </div>
                    {notification.message && (
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(notification.created_at)}
                    </p>
                  </button>
                  <div className="flex gap-2">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markRead(notification)}
                        disabled={saving}
                      >
                        Mark read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(notification)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {lastPage}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage || loading}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <HrConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete notification?"
        description="This notification will be permanently removed."
        confirmLabel={saving ? "Deleting..." : "Delete"}
        destructive
        onConfirm={deleteNotification}
      />
    </HrLayout>
  );
}

export function HrSettingsPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const initials = useMemo(() => {
    const source = name || email || "HR";
    return source
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [name, email]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.getSettings();
      const settings = res.data as SettingsData;
      setName(settings.profile?.name ?? "");
      setMobile(settings.profile?.mobile ?? "");
      setEmail(settings.profile?.email ?? "");
      setAvatarUrl(settings.profile?.profile_photo_url ?? settings.profile?.profile_photo ?? null);
      if (settings.preferences) {
        setPrefs((current) => ({ ...current, ...booleanPreferences(settings.preferences) }));
      }
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load settings");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving("profile");
    setError("");
    try {
      await hrService.updateSettingsProfile({ name: name.trim(), mobile: mobile.trim() });
      toast.success("Profile updated");
    } catch (err) {
      const message = apiErrorMessage(err, "Update failed");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwords.password.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwords.password !== passwords.password_confirmation) {
      toast.error("Password confirmation does not match");
      return;
    }

    setSaving("password");
    setError("");
    try {
      await hrService.changePassword(passwords);
      setPasswords({ current_password: "", password: "", password_confirmation: "" });
      toast.success("Password changed");
    } catch (err) {
      const message = apiErrorMessage(err, "Password change failed");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  const savePreferences = async (e: FormEvent) => {
    e.preventDefault();
    setSaving("preferences");
    setError("");
    try {
      const res = await hrService.updatePreferences(prefs);
      setPrefs((current) => ({ ...current, ...booleanPreferences(res.data ?? {}) }));
      toast.success("Preferences saved");
    } catch (err) {
      const message = apiErrorMessage(err, "Could not save preferences");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  const uploadAvatar = async (e: FormEvent) => {
    e.preventDefault();
    if (!avatarFile) {
      toast.error("Choose an avatar image first");
      return;
    }

    setSaving("avatar");
    setError("");
    try {
      const res = await hrService.uploadAvatar(avatarFile);
      const profile = res.data as SettingsProfile;
      setAvatarUrl(profile.profile_photo_url ?? profile.profile_photo ?? avatarPreview);
      setAvatarFile(null);
      toast.success("Avatar updated");
    } catch (err) {
      const message = apiErrorMessage(err, "Could not upload avatar");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <HrLayout title="Settings" subtitle="Profile, password and notification preferences">
      {loading ? (
        <HrLoadingSkeleton rows={5} />
      ) : (
        <>
          {error && <HrErrorState message={error} onRetry={load} />}

          <Tabs defaultValue="profile" className="mt-4">
            <TabsList className="flex h-auto w-full flex-wrap justify-start sm:w-auto">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="preferences">Notifications/Preferences</TabsTrigger>
              <TabsTrigger value="avatar">Avatar</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <form
                onSubmit={saveProfile}
                className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </div>
                <Button variant="brand" type="submit" disabled={saving === "profile"}>
                  {saving === "profile" ? "Saving..." : "Save profile"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="password" className="mt-4">
              <form
                onSubmit={changePassword}
                className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="space-y-2">
                  <Label>Current password</Label>
                  <Input
                    type="password"
                    value={passwords.current_password}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, current_password: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>New password</Label>
                  <Input
                    type="password"
                    value={passwords.password}
                    onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
                    required
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
                    required
                  />
                </div>
                <Button variant="brand" type="submit" disabled={saving === "password"}>
                  {saving === "password" ? "Changing..." : "Change password"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="preferences" className="mt-4">
              <form
                onSubmit={savePreferences}
                className="max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                {preferenceLabels.map(([key, label, description]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                  >
                    <div>
                      <Label>{label}</Label>
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      checked={prefs[key]}
                      onCheckedChange={(checked) => setPrefs((p) => ({ ...p, [key]: checked }))}
                    />
                  </div>
                ))}
                <Button variant="brand" type="submit" disabled={saving === "preferences"}>
                  {saving === "preferences" ? "Saving..." : "Save preferences"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="avatar" className="mt-4">
              <form
                onSubmit={uploadAvatar}
                className="max-w-xl space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={avatarPreview ?? avatarUrl ?? undefined}
                      alt={name || "Avatar"}
                    />
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{name || "HR profile"}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Avatar image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setAvatarFile(file);
                      if (file) setAvatarPreview(URL.createObjectURL(file));
                    }}
                  />
                </div>
                <Button variant="brand" type="submit" disabled={saving === "avatar" || !avatarFile}>
                  <Upload className="h-4 w-4" />{" "}
                  {saving === "avatar" ? "Uploading..." : "Upload avatar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </>
      )}
    </HrLayout>
  );
}

function normalizeNotifications(input: PaginatedNotifications | NotificationItem[]) {
  if (Array.isArray(input)) {
    return {
      items: input,
      currentPage: 1,
      lastPage: 1,
      total: input.length,
    };
  }

  return {
    items: input?.data ?? [],
    currentPage: input?.current_page ?? 1,
    lastPage: input?.last_page ?? 1,
    total: input?.total ?? input?.data?.length ?? 0,
  };
}

function booleanPreferences(input: PreferencesInput = {}) {
  return Object.fromEntries(
    (Object.keys(defaultPreferences) as (keyof Preferences)[]).map((key) => [
      key,
      typeof input[key] === "boolean" ? input[key] : defaultPreferences[key],
    ]),
  ) as Preferences;
}

function formatDate(value?: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString();
}
