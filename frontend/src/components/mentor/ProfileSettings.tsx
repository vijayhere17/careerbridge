import { useState } from "react";
import {
  User,
  BriefcaseBusiness,
  Landmark,
  Shield,
  Bell,
  Camera,
  Save,
} from "lucide-react";

export function MentorProfileSettings() {

  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: User,
    },
    {
      id: "professional",
      label: "Professional",
      icon: BriefcaseBusiness,
    },
    {
      id: "bank",
      label: "Bank Details",
      icon: Landmark,
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
  ];

    return (

    <div className="space-y-6">

      {/* Header */}

      <div>

        <h1 className="text-2xl font-bold">
          Profile Settings
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your mentor profile, professional information, security and notification preferences.
        </p>

      </div>

      <div className="grid gap-6 lg:grid-cols-12">

        {/* Sidebar */}

        <div className="lg:col-span-3">

          <div className="rounded-2xl border border-border bg-white p-3 shadow-sm">

            {tabs.map((tab) => {

              const Icon = tab.icon;

              return (

                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition

                  ${
                    activeTab === tab.id

                      ? "bg-primary text-primary-foreground"

                      : "hover:bg-muted"

                  }`}
                >

                  <Icon className="h-5 w-5" />

                  <span className="font-medium">
                    {tab.label}
                  </span>

                </button>

              );

            })}

          </div>

        </div>

        {/* Content */}

        <div className="lg:col-span-9">

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

            {/* GENERAL */}

            {activeTab === "general" && (

              <>

                <div className="mb-8 flex flex-col items-center gap-5 border-b border-border pb-6 sm:flex-row">

                  <div className="relative">

                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">

                      VS

                    </div>

                    <button
                      className="absolute -bottom-1 -right-1 rounded-full bg-primary p-2 text-white shadow"
                    >

                      <Camera className="h-4 w-4" />

                    </button>

                  </div>

                  <div>

                    <h2 className="text-xl font-bold">
                      Vijay Sharma
                    </h2>

                    <p className="text-muted-foreground">
                      Senior Laravel Developer • Exotic InfoTech
                    </p>

                  </div>

                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Full Name
                    </label>

                    <input
                      className="h-11 w-full rounded-xl border border-border px-4"
                      defaultValue="Vijay Sharma"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Email
                    </label>

                    <input
                      className="h-11 w-full rounded-xl border border-border px-4"
                      defaultValue="mentor@careerbridge.com"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Mobile
                    </label>

                    <input
                      className="h-11 w-full rounded-xl border border-border px-4"
                      defaultValue="+91 9876543210"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Location
                    </label>

                    <input
                      className="h-11 w-full rounded-xl border border-border px-4"
                      defaultValue="Bharuch, Gujarat"
                    />

                  </div>

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-medium">
                      Bio
                    </label>

                    <textarea
                      rows={5}
                      className="w-full rounded-xl border border-border p-4"
                      defaultValue="Helping candidates crack interviews, improve resumes and get referrals into top product companies."
                    />

                  </div>

                </div>

                <div className="mt-8">

                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
                  >

                    <Save className="h-5 w-5" />

                    Save Changes

                  </button>

                </div>

              </>

            )}

                        {/* PROFESSIONAL */}

            {activeTab === "professional" && (

              <>

                <div className="mb-6">

                  <h2 className="text-xl font-bold">
                    Professional Information
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Showcase your professional background to attract more candidates.
                  </p>

                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Current Company
                    </label>

                    <input
                      defaultValue="Exotic InfoTech Pvt. Ltd."
                      className="h-11 w-full rounded-xl border border-border px-4"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Designation
                    </label>

                    <input
                      defaultValue="Senior Laravel Developer"
                      className="h-11 w-full rounded-xl border border-border px-4"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Total Experience
                    </label>

                    <input
                      defaultValue="5 Years"
                      className="h-11 w-full rounded-xl border border-border px-4"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Industry
                    </label>

                    <select
                      className="h-11 w-full rounded-xl border border-border px-4"
                    >
                      <option>Information Technology</option>
                      <option>Finance</option>
                      <option>Healthcare</option>
                      <option>Chemical</option>
                      <option>Pharma</option>
                      <option>Manufacturing</option>
                    </select>

                  </div>

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-medium">
                      Skills
                    </label>

                    <input
                      defaultValue="Laravel, PHP, MySQL, React, REST API, Docker"
                      className="h-11 w-full rounded-xl border border-border px-4"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      LinkedIn Profile
                    </label>

                    <input
                      placeholder="https://linkedin.com/in/..."
                      className="h-11 w-full rounded-xl border border-border px-4"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Portfolio Website
                    </label>

                    <input
                      placeholder="https://yourportfolio.com"
                      className="h-11 w-full rounded-xl border border-border px-4"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Resume
                    </label>

                    <input
                      type="file"
                      className="block w-full rounded-xl border border-border p-3"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Languages
                    </label>

                    <input
                      defaultValue="English, Hindi, Gujarati"
                      className="h-11 w-full rounded-xl border border-border px-4"
                    />

                  </div>

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-medium">
                      Professional Summary
                    </label>

                    <textarea
                      rows={5}
                      defaultValue="Experienced Laravel Full Stack Developer helping candidates prepare for interviews, resume building, referrals and career guidance."
                      className="w-full rounded-xl border border-border p-4"
                    />

                  </div>

                </div>

                <div className="mt-8">

                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
                  >

                    <Save className="h-5 w-5" />

                    Save Professional Details

                  </button>

                </div>

              </>

            )}

            {/* BANK */}

{activeTab === "bank" && (

  <>

    <h2 className="mb-6 text-xl font-bold">
      Bank Details
    </h2>

    <div className="grid gap-5 md:grid-cols-2">

      <div>
        <label className="mb-2 block text-sm font-medium">
          Account Holder
        </label>

        <input
          defaultValue="Vijay Sharma"
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Bank Name
        </label>

        <input
          defaultValue="HDFC Bank"
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Account Number
        </label>

        <input
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          IFSC Code
        </label>

        <input
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium">
          UPI ID (Optional)
        </label>

        <input
          placeholder="example@upi"
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

    </div>

    <button className="mt-6 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground">
      Save Bank Details
    </button>

  </>

)}

{/* SECURITY */}

{activeTab === "security" && (

  <>
    <h2 className="mb-6 text-xl font-bold">
      Security
    </h2>

    <div className="space-y-5">

      <input
        type="password"
        placeholder="Current Password"
        className="h-11 w-full rounded-xl border border-border px-4"
      />

      <input
        type="password"
        placeholder="New Password"
        className="h-11 w-full rounded-xl border border-border px-4"
      />

      <input
        type="password"
        placeholder="Confirm Password"
        className="h-11 w-full rounded-xl border border-border px-4"
      />

      <button className="rounded-xl bg-primary px-6 py-3 text-primary-foreground">
        Update Password
      </button>

    </div>
  </>

)}

{/* NOTIFICATIONS */}

{activeTab === "notifications" && (

  <>
    <h2 className="mb-6 text-xl font-bold">
      Notifications
    </h2>

    <div className="space-y-4">

      <label className="flex items-center justify-between">
        <span>Email Notifications</span>
        <input type="checkbox" defaultChecked />
      </label>

      <label className="flex items-center justify-between">
        <span>Session Reminders</span>
        <input type="checkbox" defaultChecked />
      </label>

      <label className="flex items-center justify-between">
        <span>Marketing Emails</span>
        <input type="checkbox" />
      </label>

    </div>
  </>

)}

          </div>
        </div>
      </div>
    </div>
  );
}