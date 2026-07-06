import { useState } from "react";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { recruiterProfile } from "@/data/recruiter";
import { Save, Mail, Phone, Globe, Linkedin, Building2, Shield, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  return (
    <RecruiterLayout
      title="Profile Settings"
      subtitle="Update account, company, security and notification preferences"
      actions={
        <Button variant="brand" size="sm">
          <Save className="h-4 w-4" /> Save
        </Button>
      }
    >
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card title="General">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="name" label="Name" defaultValue={recruiterProfile.name} />
              <Field id="email" label="Email" defaultValue={recruiterProfile.email} icon={Mail} />
              <Field id="phone" label="Phone" defaultValue={recruiterProfile.phone} icon={Phone} />
              <Field
                id="designation"
                label="Designation"
                defaultValue={recruiterProfile.designation}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          <Card title="Company">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                id="company"
                label="Company Name"
                defaultValue={recruiterProfile.company}
                icon={Building2}
              />
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary text-xl font-bold">
                    {recruiterProfile.logo}
                  </div>
                  <Button variant="outline">Upload logo</Button>
                </div>
              </div>
              <Field
                id="website"
                label="Website"
                defaultValue={recruiterProfile.website}
                icon={Globe}
              />
              <Field
                id="linkedin"
                label="LinkedIn"
                defaultValue={recruiterProfile.linkedin}
                icon={Linkedin}
              />
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} defaultValue={recruiterProfile.description} />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card title="Security" icon={Shield}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cur">Current Password</Label>
                <Input id="cur" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input id="new" type="password" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="conf">Confirm New Password</Label>
                <Input id="conf" type="password" />
              </div>
              <div className="sm:col-span-2 rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Two-factor authentication</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add an extra layer of security to your account.
                </p>
                <Button variant="outline" className="mt-3">
                  Enable 2FA
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card title="Notifications" icon={Bell}>
            <ToggleRow
              label="Email notifications"
              desc="Applications, payments, weekly digest"
              defaultOn
            />
            <ToggleRow label="SMS notifications" desc="Critical alerts only" />
            <ToggleRow
              label="Push notifications"
              desc="Real-time in-app + browser push"
              defaultOn
            />
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button variant="brand">
          <Save className="h-4 w-4" /> Save changes
        </Button>
      </div>
    </RecruiterLayout>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({
  id,
  label,
  defaultValue,
  icon: Icon,
}: {
  id: string;
  label: string;
  defaultValue?: string;
  icon?: any;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input id={id} defaultValue={defaultValue} className={Icon ? "pl-9" : ""} />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  defaultOn,
}: {
  label: string;
  desc: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-center justify-between border-b border-border py-4 last:border-b-0">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          on ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-card transition-transform",
            on ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
