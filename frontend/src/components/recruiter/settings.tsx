import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Bell, Building2, Mail, Phone, Shield, User } from "lucide-react";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import {
  RecruiterErrorState,
  RecruiterLoadingSkeleton,
  apiErrorMessage,
} from "@/components/recruiter/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recruiterService } from "@/services/recruiterOpportunityService";

type SettingsProfile = {
  id?: number;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  company?: string | null;
  current_role?: string | null;
};

type Preferences = {
  email_notifications: boolean;
  push_notifications: boolean;
  application_alerts: boolean;
  unlock_alerts: boolean;
  withdraw_alerts: boolean;
  message_alerts: boolean;
  weekly_digest: boolean;
  profile_visibility: boolean;
  show_contact_publicly: boolean;
};

type PayoutSettings = {
  bank_name: string;
  account_holder: string;
  account_number: string;
  ifsc: string;
  upi: string;
};

const defaultPreferences: Preferences = {
  email_notifications: true,
  push_notifications: true,
  application_alerts: true,
  unlock_alerts: true,
  withdraw_alerts: true,
  message_alerts: true,
  weekly_digest: false,
  profile_visibility: true,
  show_contact_publicly: false,
};

const emptyPayout: PayoutSettings = {
  bank_name: "",
  account_holder: "",
  account_number: "",
  ifsc: "",
  upi: "",
};

const preferenceRows: Array<[keyof Preferences, string, string]> = [
  ["email_notifications", "Email notifications", "Receive important account and activity emails."],
  ["push_notifications", "Push notifications", "Show in-app alerts for recruiter activity."],
  ["application_alerts", "Application alerts", "Notify me when candidates apply to my posts."],
  ["unlock_alerts", "Unlock alerts", "Notify me when a candidate contact is unlocked."],
  ["withdraw_alerts", "Withdrawal alerts", "Notify me about withdrawal request status changes."],
  ["message_alerts", "Message alerts", "Notify me when candidates send messages."],
  ["weekly_digest", "Weekly digest", "Send a weekly summary of recruiter activity."],
  ["profile_visibility", "Public company profile", "Allow your company profile to appear publicly."],
  ["show_contact_publicly", "Show contact publicly", "Display email/phone on public opportunity pages."],
];

function booleanPreferences(input: Record<string, unknown> | null | undefined): Preferences {
  return {
    email_notifications: Boolean(
      input?.email_notifications ?? defaultPreferences.email_notifications,
    ),
    push_notifications: Boolean(input?.push_notifications ?? defaultPreferences.push_notifications),
    application_alerts: Boolean(input?.application_alerts ?? defaultPreferences.application_alerts),
    unlock_alerts: Boolean(input?.unlock_alerts ?? defaultPreferences.unlock_alerts),
    withdraw_alerts: Boolean(input?.withdraw_alerts ?? defaultPreferences.withdraw_alerts),
    message_alerts: Boolean(input?.message_alerts ?? defaultPreferences.message_alerts),
    weekly_digest: Boolean(input?.weekly_digest ?? defaultPreferences.weekly_digest),
    profile_visibility: Boolean(input?.profile_visibility ?? defaultPreferences.profile_visibility),
    show_contact_publicly: Boolean(
      input?.show_contact_publicly ?? defaultPreferences.show_contact_publicly,
    ),
  };
}

function fieldValue(value: string | null | undefined) {
  return value ?? "";
}

export function SettingsPage() {
  const [profile, setProfile] = useState<SettingsProfile>({
    name: "",
    email: "",
    mobile: "",
    company: "",
    current_role: "",
  });
  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [emailForm, setEmailForm] = useState({ email: "", current_password: "" });
  const [payout, setPayout] = useState<PayoutSettings>(emptyPayout);
  const [deleteForm, setDeleteForm] = useState({ current_password: "", confirmation: "" });
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<
    "profile" | "password" | "preferences" | "email" | "payout" | "delete" | null
  >(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await recruiterService.getSettings();
      const data = (res.data ?? {}) as Record<string, any>;
      setProfile({
        id: data.profile?.id,
        name: fieldValue(data.profile?.name),
        email: fieldValue(data.profile?.email),
        mobile: fieldValue(data.profile?.mobile),
        company: fieldValue(data.profile?.company),
        current_role: fieldValue(data.profile?.current_role),
      });
      setEmailForm((current) => ({ ...current, email: fieldValue(data.profile?.email) }));
      setPreferences(booleanPreferences(data.preferences));
      setPayout({
        bank_name: fieldValue(data.payout?.bank_name),
        account_holder: fieldValue(data.payout?.account_holder),
        account_number: fieldValue(data.payout?.account_number),
        ifsc: fieldValue(data.payout?.ifsc),
        upi: fieldValue(data.payout?.upi),
      });
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

  const updateProfileField = (field: keyof SettingsProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile.name?.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving("profile");
    setError("");
    try {
      const res = await recruiterService.updateSettingsProfile({
        name: profile.name.trim(),
        mobile: fieldValue(profile.mobile).trim(),
        company: fieldValue(profile.company).trim(),
        current_role: fieldValue(profile.current_role).trim(),
      });
      const updated = res.data ?? {};
      setProfile((current) => ({
        ...current,
        name: fieldValue(updated.name ?? profile.name),
        mobile: fieldValue(updated.mobile ?? profile.mobile),
        company: fieldValue(updated.company ?? profile.company),
        current_role: fieldValue(updated.current_role ?? profile.current_role),
      }));
      toast.success("Profile settings saved");
    } catch (err) {
      const message = apiErrorMessage(err, "Could not save profile settings");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwords.current_password) {
      toast.error("Current password is required");
      return;
    }
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
      await recruiterService.changePassword(passwords);
      setPasswords({ current_password: "", password: "", password_confirmation: "" });
      toast.success("Password changed successfully");
    } catch (err) {
      const message = apiErrorMessage(err, "Could not change password");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  const savePreferences = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("preferences");
    setError("");
    try {
      const res = await recruiterService.updatePreferences(preferences);
      setPreferences(booleanPreferences(res.data));
      toast.success("Notification preferences saved");
    } catch (err) {
      const message = apiErrorMessage(err, "Could not save preferences");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  const changeEmail = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("email");
    try {
      const res = await recruiterService.changeEmail({
        email: emailForm.email.trim(),
        current_password: emailForm.current_password,
      });
      setProfile((current) => ({ ...current, email: fieldValue(res.data?.email) }));
      setEmailForm({ email: fieldValue(res.data?.email), current_password: "" });
      toast.success("Email updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not change email"));
    } finally {
      setSaving(null);
    }
  };

  const savePayout = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("payout");
    try {
      const res = await recruiterService.updatePayout(payout);
      const data = (res.data ?? {}) as PayoutSettings;
      setPayout({
        bank_name: fieldValue(data.bank_name),
        account_holder: fieldValue(data.account_holder),
        account_number: fieldValue(data.account_number),
        ifsc: fieldValue(data.ifsc),
        upi: fieldValue(data.upi),
      });
      toast.success("Payout settings saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save payout settings"));
    } finally {
      setSaving(null);
    }
  };

  const deleteAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (deleteForm.confirmation !== "DELETE") {
      toast.error('Type DELETE to confirm account deletion');
      return;
    }
    setSaving("delete");
    try {
      await recruiterService.deleteAccount({
        current_password: deleteForm.current_password,
        confirmation: "DELETE",
      });
      toast.success("Account deleted");
      window.location.href = "/login";
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete account"));
    } finally {
      setSaving(null);
    }
  };

  return (
    <RecruiterLayout
      title="Account Settings"
      subtitle="Update account, security, payout and notification preferences"
    >
      {loading ? (
        <RecruiterLoadingSkeleton rows={5} />
      ) : (
        <>
          {error && <RecruiterErrorState message={error} onRetry={load} />}

          <Tabs defaultValue="profile" className="mt-4 w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start sm:w-auto">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="email">Change Email</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="payout">Payout</TabsTrigger>
              <TabsTrigger value="preferences">Notifications</TabsTrigger>
              <TabsTrigger value="danger">Delete Account</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <Card title="Profile" icon={<User className="h-4 w-4 text-primary" />}>
                <form onSubmit={saveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={fieldValue(profile.name)}
                      onChange={(event) => updateProfileField("name", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        value={fieldValue(profile.email)}
                        disabled
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="mobile"
                        value={fieldValue(profile.mobile)}
                        onChange={(event) => updateProfileField("mobile", event.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="company"
                        value={fieldValue(profile.company)}
                        onChange={(event) => updateProfileField("company", event.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="current_role">Current role</Label>
                    <Input
                      id="current_role"
                      value={fieldValue(profile.current_role)}
                      onChange={(event) => updateProfileField("current_role", event.target.value)}
                      placeholder="Recruiter, Talent Partner, Founder"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button variant="brand" type="submit" disabled={saving === "profile"}>
                      {saving === "profile" ? "Saving..." : "Save profile"}
                    </Button>
                  </div>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="mt-6">
              <Card title="Change Email" icon={<Mail className="h-4 w-4 text-primary" />}>
                <form onSubmit={changeEmail} className="max-w-xl space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_email">New email</Label>
                    <Input
                      id="new_email"
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm((c) => ({ ...c, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_password">Current password</Label>
                    <Input
                      id="email_password"
                      type="password"
                      value={emailForm.current_password}
                      onChange={(e) =>
                        setEmailForm((c) => ({ ...c, current_password: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <Button variant="brand" type="submit" disabled={saving === "email"}>
                    {saving === "email" ? "Updating..." : "Update email"}
                  </Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="password" className="mt-6">
              <Card title="Password" icon={<Shield className="h-4 w-4 text-primary" />}>
                <form onSubmit={changePassword} className="max-w-xl space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwords.current_password}
                      onChange={(event) =>
                        setPasswords((current) => ({
                          ...current,
                          current_password: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={passwords.password}
                      onChange={(event) =>
                        setPasswords((current) => ({ ...current, password: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirm new password</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={passwords.password_confirmation}
                      onChange={(event) =>
                        setPasswords((current) => ({
                          ...current,
                          password_confirmation: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <Button variant="brand" type="submit" disabled={saving === "password"}>
                    {saving === "password" ? "Changing..." : "Change password"}
                  </Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="payout" className="mt-6">
              <Card title="Payout Settings" icon={<Building2 className="h-4 w-4 text-primary" />}>
                <form onSubmit={savePayout} className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank name</Label>
                    <Input
                      id="bank_name"
                      value={payout.bank_name}
                      onChange={(e) => setPayout((c) => ({ ...c, bank_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_holder">Account holder</Label>
                    <Input
                      id="account_holder"
                      value={payout.account_holder}
                      onChange={(e) => setPayout((c) => ({ ...c, account_holder: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account number</Label>
                    <Input
                      id="account_number"
                      value={payout.account_number}
                      onChange={(e) => setPayout((c) => ({ ...c, account_number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifsc">IFSC</Label>
                    <Input
                      id="ifsc"
                      value={payout.ifsc}
                      onChange={(e) => setPayout((c) => ({ ...c, ifsc: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="upi">UPI</Label>
                    <Input
                      id="upi"
                      value={payout.upi}
                      onChange={(e) => setPayout((c) => ({ ...c, upi: e.target.value }))}
                      placeholder="name@upi"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button variant="brand" type="submit" disabled={saving === "payout"}>
                      {saving === "payout" ? "Saving..." : "Save payout settings"}
                    </Button>
                  </div>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="mt-6">
              <Card
                title="Notifications/Preferences"
                icon={<Bell className="h-4 w-4 text-primary" />}
              >
                <form onSubmit={savePreferences} className="max-w-2xl space-y-4">
                  {preferenceRows.map(([key, label, description]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                    >
                      <div>
                        <Label htmlFor={key}>{label}</Label>
                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={preferences[key]}
                        onCheckedChange={(checked) =>
                          setPreferences((current) => ({ ...current, [key]: checked }))
                        }
                      />
                    </div>
                  ))}
                  <Button variant="brand" type="submit" disabled={saving === "preferences"}>
                    {saving === "preferences" ? "Saving..." : "Save preferences"}
                  </Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="danger" className="mt-6">
              <Card title="Delete Account" icon={<Shield className="h-4 w-4 text-destructive" />}>
                <form onSubmit={deleteAccount} className="max-w-xl space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This permanently disables your recruiter account. Type DELETE to confirm.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="delete_password">Current password</Label>
                    <Input
                      id="delete_password"
                      type="password"
                      value={deleteForm.current_password}
                      onChange={(e) =>
                        setDeleteForm((c) => ({ ...c, current_password: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delete_confirm">Confirmation</Label>
                    <Input
                      id="delete_confirm"
                      value={deleteForm.confirmation}
                      onChange={(e) =>
                        setDeleteForm((c) => ({ ...c, confirmation: e.target.value }))
                      }
                      placeholder="DELETE"
                      required
                    />
                  </div>
                  <Button variant="destructive" type="submit" disabled={saving === "delete"}>
                    {saving === "delete" ? "Deleting..." : "Delete account"}
                  </Button>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </RecruiterLayout>
  );
}

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
