import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/auth";
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Globe, Linkedin, Github, Camera, Save, Check,
  Lock, Eye, EyeOff, Bell, Shield, Trash2, ChevronRight,
  Plus, X,
} from "lucide-react";

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    currentRole: string;
    company: string;
    experience: string;
    education: string;
    skills: string[];
    linkedin: string;
    github: string;
    portfolio: string;
    lookingFor: string[];

    profilePhoto?: string | null;
}

const EXPERIENCE_OPTIONS = ["0–1 year", "1–3 years", "3–6 years", "6–10 years", "10+ years"];
const LOOKING_FOR_OPTIONS = ["Full-time Job", "Internship", "Freelance", "Mentorship", "Networking"];

type Tab = "profile" | "account" | "notifications" | "privacy";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "account",       label: "Account",       icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy",       label: "Privacy",       icon: Shield },
];

function SavedToast() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg">
      <Check className="h-4 w-4" /> Changes saved
    </div>
  );
}

function SkillsInput({
  skills = [],
  onChange,
}: {
  skills?: string[];
  onChange: (s: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim();
    const skillList = skills ?? [];

if (val && !skillList.includes(val) && skillList.length < 20) {
    onChange([...skillList, val]);
      onChange([...skills, val]);
      setInput("");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add a skill and press Enter"
          className="dash-input flex-1"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl bg-primary px-3 text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(skills ?? []).map((s) => (
          <span key={s} className="flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
            {s}
            <button type="button" onClick={() => onChange((skills ?? []).filter((x) => x !== s))} className="hover:text-red-500 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({
    data,
    onChange,
    onSave,
    onPhotoChange,
}: {
    data: ProfileData;
    onChange: (d: Partial<ProfileData>) => void;
    onSave: () => void;
    onPhotoChange: (file: File) => void;
}) {
  const avatarRef = useRef<HTMLInputElement>(null);
const [avatarUrl, setAvatarUrl] = useState<string | null>(
  data.profilePhoto || null
);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setAvatarUrl(URL.createObjectURL(file));

    onPhotoChange(file);
};

  const Field = ({ label, value, k, type = "text", placeholder = "" }: {
    label: string; value: string; k: keyof ProfileData; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange({ [k]: e.target.value })}
        placeholder={placeholder}
        className="dash-input w-full"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 overflow-hidden">
            {avatarUrl ? (
  <img
    src={avatarUrl}
    alt="avatar"
    className="h-full w-full object-cover"
  />
) : (
  <span className="text-2xl font-bold text-primary">
    {(data.firstName ?? "").charAt(0)}
    {(data.lastName ?? "").charAt(0)}
  </span>
)}
          </div>
          <button
            onClick={() => avatarRef.current?.click()}
            className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm">{data.firstName} {data.lastName}</p>
          <p className="text-xs text-muted-foreground">{data.currentRole} {data.company ? `at ${data.company}` : ""}</p>
        </div>
      </div>

      {/* <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Basic Info</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name"    value={data.firstName}   k="firstName"   placeholder="Vijay" />
          <Field label="Last Name"     value={data.lastName}    k="lastName"    placeholder="Kumar" />
          <Field label="Email"         value={data.email}       k="email"       type="email" placeholder="vijay@email.com" />
          <Field label="Phone"         value={data.phone}       k="phone"       placeholder="+91 98765 43210" />
          <div className="sm:col-span-2">
            <Field label="Location"    value={data.location}    k="location"    placeholder="Bengaluru, India" />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Bio</label>
          <textarea
            value={data.bio}
            onChange={(e) => onChange({ bio: e.target.value })}
            rows={3}
            placeholder="Tell mentors and recruiters about yourself…"
            className="dash-input w-full resize-none"
          />
          <p className="text-[11px] text-muted-foreground mt-1 text-right">{data.bio.length}/300</p>
        </div>
      </div> */}

      {/* <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Professional</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Current Role"  value={data.currentRole} k="currentRole" placeholder="Software Engineer" />
          <Field label="Company"       value={data.company}     k="company"     placeholder="Acme Corp" />
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Experience</label>
            <select
              value={data.experience}
              onChange={(e) => onChange({ experience: e.target.value })}
              className="dash-input w-full"
            >
              <option value="">Select experience</option>
              {EXPERIENCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <Field label="Education"     value={data.education}   k="education"   placeholder="B.Tech, IIT Delhi" />
        </div>
      </div> */}

      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Skills</p>
        <SkillsInput
    skills={data.skills ?? []}
    onChange={(s) => onChange({ skills: s })}
/>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Looking For</p>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR_OPTIONS.map((opt) => {
            const active = data.lookingFor.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange({ lookingFor: active ? data.lookingFor.filter((x) => x !== opt) : [...data.lookingFor, opt] })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Social Links</p>
        <div className="space-y-3">
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={data.linkedin} onChange={(e) => onChange({ linkedin: e.target.value })} placeholder="linkedin.com/in/vijay" className="dash-input w-full pl-9" />
          </div>
          <div className="relative">
            <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={data.github} onChange={(e) => onChange({ github: e.target.value })} placeholder="github.com/vijay" className="dash-input w-full pl-9" />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={data.portfolio} onChange={(e) => onChange({ portfolio: e.target.value })} placeholder="vijay.dev" className="dash-input w-full pl-9" />
          </div>
        </div>
      </div>

      <button
        onClick={onSave}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Save className="h-4 w-4" /> Save Profile
      </button>
    </div>
  );
}

function AccountTab({ onSave }: { onSave: () => void }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [current, setCurrent]   = useState("");
  const [newPass, setNewPass]   = useState("");
  const [confirm, setConfirm]   = useState("");
  const [newEmail, setNewEmail] = useState("");

  const strength = newPass.length === 0 ? 0 : newPass.length < 6 ? 1 : newPass.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-primary"];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Change Email</p>
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">New Email Address</label>
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" className="dash-input w-full" />
        </div>
        <button onClick={onSave} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          Update Email
        </button>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Change Password</p>
        {[
          { label: "Current Password", value: current, onChange: setCurrent, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
          { label: "New Password",     value: newPass, onChange: setNewPass, show: showNew,     toggle: () => setShowNew(!showNew) },
          { label: "Confirm Password", value: confirm, onChange: setConfirm, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
        ].map(({ label, value, onChange, show, toggle }) => (
          <div key={label}>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</label>
            <div className="relative">
              <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" className="dash-input w-full pr-10" />
              <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {label === "New Password" && newPass && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor[strength] : "bg-muted"}`} />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">{strengthLabel[strength]}</span>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={onSave}
          disabled={!current || !newPass || newPass !== confirm}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Update Password
        </button>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
        <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Danger Zone</p>
        <p className="text-xs text-muted-foreground">Once you delete your account, all your data will be permanently removed. This action cannot be undone.</p>
        <button className="flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
          <Trash2 className="h-4 w-4" /> Delete My Account
        </button>
      </div>
    </div>
  );
}

function NotificationsTab({ onSave }: { onSave: () => void }) {
  const [prefs, setPrefs] = useState({
    sessionReminders:  true,
    bookingUpdates:    true,
    newOpportunities:  true,
    jobAlerts:         true,
    mentorMessages:    true,
    weeklyDigest:      false,
    marketingEmails:   false,
    pushNotifications: true,
  });

  const toggle = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const Toggle = ({ k, label, desc }: { k: keyof typeof prefs; label: string; desc: string }) => (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={() => toggle(k)}
        className={`shrink-0 h-6 w-11 rounded-full transition-colors ${prefs[k] ? "bg-primary" : "bg-muted"}`}
      >
        <div className={`h-5 w-5 m-0.5 rounded-full bg-white shadow transition-transform ${prefs[k] ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Sessions & Bookings</p>
        <Toggle k="sessionReminders"  label="Session Reminders"  desc="Get reminded 1 hour before your session" />
        <Toggle k="bookingUpdates"    label="Booking Updates"    desc="When mentor accepts or declines your request" />
        <Toggle k="mentorMessages"    label="Mentor Messages"    desc="New messages from your mentors" />
      </div>
      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Opportunities</p>
        <Toggle k="newOpportunities"  label="New Opportunities"  desc="Jobs and internships matching your profile" />
        <Toggle k="jobAlerts"         label="Job Alerts"         desc="Alerts from your saved job searches" />
      </div>
      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">General</p>
        <Toggle k="weeklyDigest"      label="Weekly Digest"      desc="A summary of your activity each week" />
        <Toggle k="marketingEmails"   label="Marketing Emails"   desc="Tips, updates and offers from CareerBridge" />
        <Toggle k="pushNotifications" label="Push Notifications" desc="Browser and mobile push notifications" />
      </div>
      <button
        onClick={onSave}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Save className="h-4 w-4" /> Save Preferences
      </button>
    </div>
  );
}

function PrivacyTab({ onSave }: { onSave: () => void }) {
  const [settings, setSettings] = useState({
    profileVisible:   true,
    showEmail:        false,
    showPhone:        false,
    showLinkedin:     true,
    activityVisible:  true,
    searchable:       true,
  });

  const toggle = (k: keyof typeof settings) => setSettings((p) => ({ ...p, [k]: !p[k] }));

  const Toggle = ({ k, label, desc }: { k: keyof typeof settings; label: string; desc: string }) => (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={() => toggle(k)}
        className={`shrink-0 h-6 w-11 rounded-full transition-colors ${settings[k] ? "bg-primary" : "bg-muted"}`}
      >
        <div className={`h-5 w-5 m-0.5 rounded-full bg-white shadow transition-transform ${settings[k] ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Profile Visibility</p>
        {/* <Toggle k="profileVisible" label="Public Profile"       desc="Mentors and recruiters can view your profile" />
        <Toggle k="searchable"     label="Appear in Search"     desc="Show up in mentor and recruiter searches" />
        <Toggle k="activityVisible" label="Show Activity"       desc="Show your recent sessions and reviews" /> */}
      </div>
      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Contact Visibility</p>
        {/* <Toggle k="showEmail"    label="Show Email"    desc="Display email on your public profile" />
        <Toggle k="showPhone"    label="Show Phone"    desc="Display phone on your public profile" />
        <Toggle k="showLinkedin" label="Show LinkedIn" desc="Display LinkedIn link on your profile" /> */}
      </div>
      <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Data & Privacy</p>
        {[
          { label: "Download My Data",  desc: "Export all your CareerBridge data" },
          { label: "Privacy Policy",    desc: "Read how we handle your data" },
          { label: "Terms of Service",  desc: "Our terms and conditions" },
        ].map(({ label, desc }) => (
          <button key={label} className="w-full flex items-center justify-between rounded-xl border border-border bg-surface p-3 hover:border-primary/40 transition-colors">
            <div>
              <p className="text-sm font-medium text-left">{label}</p>
              <p className="text-[11px] text-muted-foreground text-left">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
      <button
        onClick={onSave}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Save className="h-4 w-4" /> Save Settings
      </button>
    </div>
  );
}

export function ProfileSettings() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  location: "",
  bio: "",
  currentRole: "",
  company: "",
  experience: "",
  education: "",
  skills: [],
  linkedin: "",
  github: "",
  portfolio: "",
  lookingFor: [],
});

const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadProfile = async () => {
    try {
      const data = await apiFetch<{ profile: ProfileData }>("/api/profile");

      setProfile(data.profile);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  loadProfile();
}, []);

const handleSave = async () => {
  try {
    const formData = new FormData();

formData.append("firstName", profile.firstName);
formData.append("lastName", profile.lastName);
formData.append("phone", profile.phone);
formData.append("location", profile.location);
formData.append("bio", profile.bio);
formData.append("currentRole", profile.currentRole);
formData.append("company", profile.company);
formData.append("experience", profile.experience);
formData.append("education", profile.education);
formData.append("linkedin", profile.linkedin);
formData.append("github", profile.github);
formData.append("portfolio", profile.portfolio);

formData.append("skills", JSON.stringify(profile.skills));
formData.append("lookingFor", JSON.stringify(profile.lookingFor));

if (profilePhoto) {
    formData.append("profilePhoto", profilePhoto);
}

await apiFetch("/api/profile/update", {
    method: "POST",
    body: formData,
});

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);

  } catch (error) {
    console.error(error);
    alert("Failed to update profile.");
  }
};

  if (loading) {
  return (
    <div className="flex justify-center py-20">
      Loading profile...
    </div>
  );
}

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${activeTab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === "profile"       && <ProfileTab
    data={profile}
    onChange={(d) => setProfile((p) => ({ ...p, ...d }))}
    onSave={handleSave}
    onPhotoChange={setProfilePhoto}
/>}
      {activeTab === "account"       && <AccountTab       onSave={handleSave} />}
      {activeTab === "notifications" && <NotificationsTab onSave={handleSave} />}
      {activeTab === "privacy"       && <PrivacyTab       onSave={handleSave} />}

      {saved && <SavedToast />}
    </div>
  );
}