import { useEffect, useState } from "react";
import {
  User,
  BriefcaseBusiness,
  Landmark,
  Shield,
  Bell,
  Camera,
  Save,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

export function MentorProfileSettings() {

  const [activeTab, setActiveTab] = useState("general");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
const [selectedImage, setSelectedImage] = useState<File | null>(null);

const [selectedResume, setSelectedResume] = useState<File | null>(null);

const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
});

const [profile, setProfile] = useState({
    id: "",
    name: "",
    last_name: "",
    full_name: "",
    email: "",
    mobile: "",

    company: "",
    designation: "",
    industry: "",
    experience: "",

    linkedin_url: "",
    portfolio_url: "",
    professional_summary: "",

    skills: [] as string[],
    languages: [] as string[],

    resume: "",

    bank: {
    account_holder: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
},

    location: "",
    bio: "",
    profile_photo: "",
});

const changePassword = async () => {
    try {

        setSaving(true);

        await apiFetch("/api/mentor/change-password", {
            method: "POST",
            body: JSON.stringify(passwords),
            headers: {
                "Content-Type": "application/json",
            },
        });

        alert("Password updated successfully.");

        setPasswords({
            current_password: "",
            password: "",
            password_confirmation: "",
        });

    } catch (error) {
        console.error(error);
        alert("Failed to update password.");
    } finally {
        setSaving(false);
    }
};

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
    
  ];

  useEffect(() => {
    loadProfile();
}, []);

const loadProfile = async () => {
    try {
        setLoading(true);

        const response = (await apiFetch("/api/mentor/profile-settings")) as any;

        setProfile({
    id: response.profile.id ?? "",
    name: response.profile.name ?? "",
    last_name: response.profile.last_name ?? "",
    full_name: response.profile.full_name ?? "",
    email: response.profile.email ?? "",
    mobile: response.profile.mobile ?? "",

    company: response.profile.company ?? "",
    designation: response.profile.designation ?? "",
    industry: response.profile.industry ?? "",
    experience: response.profile.experience ?? "",

    linkedin_url: response.profile.linkedin_url ?? "",
    portfolio_url: response.profile.portfolio_url ?? "",
    professional_summary: response.profile.professional_summary ?? "",

    skills: response.profile.skills ?? [],
    languages: response.profile.languages ?? [],

    resume: response.profile.resume ?? "",

    bank: {
    account_holder: response.profile.bank?.account_holder ?? "",
    bank_name: response.profile.bank?.bank_name ?? "",
    account_number: response.profile.bank?.account_number ?? "",
    ifsc_code: response.profile.bank?.ifsc_code ?? "",
    upi_id: response.profile.bank?.upi_id ?? "",
},

    location: response.profile.location ?? "",
    bio: response.profile.bio ?? "",

    profile_photo: response.profile.profile_photo ?? "",
});

    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
};

const saveProfile = async () => {
    try {
        setSaving(true);

        const formData = new FormData();

        formData.append("name", profile.name);
        formData.append("last_name", profile.last_name);
        formData.append("mobile", profile.mobile);
        formData.append("location", profile.location);
        formData.append("bio", profile.bio);
        formData.append("company", profile.company);
formData.append("designation", profile.designation);
formData.append("industry", profile.industry);
formData.append("experience", profile.experience);

formData.append("linkedin_url", profile.linkedin_url);
formData.append("portfolio_url", profile.portfolio_url);
formData.append(
    "professional_summary",
    profile.professional_summary
);

formData.append("account_holder", profile.bank.account_holder);
formData.append("bank_name", profile.bank.bank_name);
formData.append("account_number", profile.bank.account_number);
formData.append("ifsc_code", profile.bank.ifsc_code);
formData.append("upi_id", profile.bank.upi_id);

profile.skills.forEach((skill) => {
    formData.append("skills[]", skill);
});

profile.languages.forEach((language) => {
    formData.append("languages[]", language);
});

if (selectedResume) {
    formData.append("resume", selectedResume);
}

        if (selectedImage) {
            formData.append("profile_photo", selectedImage);
        }

        formData.append("_method", "PUT");

        const response = (await apiFetch(
    "/api/mentor/profile-settings",
    {
        method: "POST",
        body: formData,
    }
)) as any;

       setProfile({
    id: response.profile.id ?? "",
    name: response.profile.name ?? "",
    last_name: response.profile.last_name ?? "",
    full_name: response.profile.full_name ?? "",
    email: response.profile.email ?? "",
    mobile: response.profile.mobile ?? "",

    company: response.profile.company ?? "",
    designation: response.profile.designation ?? "",
    industry: response.profile.industry ?? "",
    experience: response.profile.experience ?? "",

    linkedin_url: response.profile.linkedin_url ?? "",
    portfolio_url: response.profile.portfolio_url ?? "",
    professional_summary: response.profile.professional_summary ?? "",

    skills: response.profile.skills ?? [],
    languages: response.profile.languages ?? [],

    resume: response.profile.resume ?? "",

    bank: {
    account_holder: response.profile.bank?.account_holder ?? "",
    bank_name: response.profile.bank?.bank_name ?? "",
    account_number: response.profile.bank?.account_number ?? "",
    ifsc_code: response.profile.bank?.ifsc_code ?? "",
    upi_id: response.profile.bank?.upi_id ?? "",
},

    location: response.profile.location ?? "",
    bio: response.profile.bio ?? "",

    profile_photo: response.profile.profile_photo ?? "",
});

        alert("Profile updated successfully!");

    } catch (error) {
        console.error(error);
        alert("Failed to update profile.");
    } finally {
        setSaving(false);
    }
};

if (loading) {
    return (
        <div className="flex h-96 items-center justify-center">
            Loading...
        </div>
    );
}

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

                      {profile.profile_photo ? (
    <img
        src={profile.profile_photo}
        alt={profile.full_name}
        className="h-24 w-24 rounded-full object-cover"
    />
) : (
    profile.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
)}

                    </div>

                   <input
    id="profile-photo"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
        if (e.target.files?.length) {
            setSelectedImage(e.target.files[0]);

            setProfile({
                ...profile,
                profile_photo: URL.createObjectURL(e.target.files[0]),
            });
        }
    }}
/>

<button
    type="button"
    onClick={() => document.getElementById("profile-photo")?.click()}
    className="absolute -bottom-1 -right-1 rounded-full bg-primary p-2 text-white shadow"
>
    <Camera className="h-4 w-4" />
</button>

                  </div>

                  <div>

                    <h2 className="text-xl font-bold">
                      {profile.full_name}
                    </h2>

                    <p className="text-muted-foreground">
                      Mentor • CareerBridge
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
                      value={profile.name}
onChange={(e) =>
    setProfile({
        ...profile,
        name: e.target.value,
    })
}
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Email
                    </label>

                    <input
                      className="h-11 w-full rounded-xl border border-border px-4"
                      value={profile.email}
onChange={(e) =>
    setProfile({
        ...profile,
        email: e.target.value,
    })
}
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Mobile
                    </label>

                    <input
                      className="h-11 w-full rounded-xl border border-border px-4"
                      value={profile.mobile}
onChange={(e) =>
    setProfile({
        ...profile,
        mobile: e.target.value,
    })
}
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Location
                    </label>

                    <input
                      className="h-11 w-full rounded-xl border border-border px-4"
                      value={profile.location}
                      onChange={(e) =>
    setProfile({
        ...profile,
        location: e.target.value,
    })
}
                    />

                  </div>

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-medium">
                      Bio
                    </label>

                    <textarea
    rows={5}
    className="w-full rounded-xl border border-border p-4"
    value={profile.bio}
    onChange={(e) =>
        setProfile({
            ...profile,
            bio: e.target.value,
        })
    }
/>

                  </div>

                </div>

                <div className="mt-8">

                  <button
    onClick={saveProfile}
    disabled={saving}
    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
>

                    <Save className="h-5 w-5" />

{saving ? "Saving..." : "Save Changes"}

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
    value={profile.company}
    onChange={(e) =>
        setProfile({
            ...profile,
            company: e.target.value,
        })
    }
    className="h-11 w-full rounded-xl border border-border px-4"
/>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Designation
                    </label>

                    <input
    value={profile.designation}
    onChange={(e) =>
        setProfile({
            ...profile,
            designation: e.target.value,
        })
    }
    className="h-11 w-full rounded-xl border border-border px-4"
/>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Total Experience
                    </label>

                   <input
    value={profile.experience}
    onChange={(e) =>
        setProfile({
            ...profile,
            experience: e.target.value,
        })
    }
    className="h-11 w-full rounded-xl border border-border px-4"
/>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Industry
                    </label>

                   <select
    value={profile.industry}
    onChange={(e) =>
        setProfile({
            ...profile,
            industry: e.target.value,
        })
    }
    className="h-11 w-full rounded-xl border border-border px-4"
>
    <option value="">Select Industry</option>
    <option value="Information Technology">Information Technology</option>
    <option value="Finance">Finance</option>
    <option value="Healthcare">Healthcare</option>
    <option value="Chemical">Chemical</option>
    <option value="Pharma">Pharma</option>
    <option value="Manufacturing">Manufacturing</option>
</select>

                  </div>

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-medium">
                      Skills
                    </label>

                    <input
    value={profile.skills.join(", ")}
    onChange={(e) =>
        setProfile({
            ...profile,
            skills: e.target.value
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean),
        })
    }
    placeholder="Laravel, PHP, React"
    className="h-11 w-full rounded-xl border border-border px-4"
/>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      LinkedIn Profile
                    </label>

                    <input
    value={profile.linkedin_url}
    onChange={(e) =>
        setProfile({
            ...profile,
            linkedin_url: e.target.value,
        })
    }
    placeholder="https://linkedin.com/in/..."
    className="h-11 w-full rounded-xl border border-border px-4"
/>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Portfolio Website
                    </label>

                    <input
    value={profile.portfolio_url}
    onChange={(e) =>
        setProfile({
            ...profile,
            portfolio_url: e.target.value,
        })
    }
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
    accept=".pdf,.doc,.docx"
    className="block w-full rounded-xl border border-border p-3"
    onChange={(e) => {
        if (e.target.files?.length) {
            setSelectedResume(e.target.files[0]);
        }
    }}
/>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium">
                      Languages
                    </label>

                    <input
    value={profile.languages.join(", ")}
    onChange={(e) =>
        setProfile({
            ...profile,
            languages: e.target.value
                .split(",")
                .map((language) => language.trim())
                .filter(Boolean),
        })
    }
    placeholder="English, Hindi"
    className="h-11 w-full rounded-xl border border-border px-4"
/>

                  </div>

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-medium">
                      Professional Summary
                    </label>

                    <textarea
    rows={5}
    value={profile.professional_summary}
    onChange={(e) =>
        setProfile({
            ...profile,
            professional_summary: e.target.value,
        })
    }
    className="w-full rounded-xl border border-border p-4"
/>

                  </div>

                </div>

                <div className="mt-8">

                 <button
    onClick={saveProfile}
    disabled={saving}
    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
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
    value={profile.bank.account_holder}
    onChange={(e) =>
        setProfile({
            ...profile,
            bank: {
                ...profile.bank,
                account_holder: e.target.value,
            },
        })
    }
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Bank Name
        </label>

        <input
          value={profile.bank.bank_name}
onChange={(e) =>
    setProfile({
        ...profile,
        bank: {
            ...profile.bank,
            bank_name: e.target.value,
        },
    })
}
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Account Number
        </label>

        <input
        value={profile.bank.account_number}
onChange={(e) =>
    setProfile({
        ...profile,
        bank: {
            ...profile.bank,
            account_number: e.target.value,
        },
    })
}
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          IFSC Code
        </label>

        <input
        value={profile.bank.ifsc_code}
onChange={(e) =>
    setProfile({
        ...profile,
        bank: {
            ...profile.bank,
            ifsc_code: e.target.value,
        },
    })
}
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-medium">
          UPI ID (Optional)
        </label>

        <input
          placeholder="example@upi"
          value={profile.bank.upi_id}
onChange={(e) =>
    setProfile({
        ...profile,
        bank: {
            ...profile.bank,
            upi_id: e.target.value,
        },
    })
}
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

    </div>

    <button
    onClick={saveProfile}
    disabled={saving}
    className="mt-6 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground disabled:opacity-60"
>
      {saving ? "Saving..." : "Save Bank Details"}
    </button>

  </>

)}

{/* SECURITY */}

{/* SECURITY */}

{activeTab === "security" && (

  <>
    <h2 className="mb-6 text-xl font-bold">
      Security
    </h2>

    <div className="space-y-5">

      <div>
        <label className="mb-2 block text-sm font-medium">
          Current Password
        </label>

        <input
          type="password"
          placeholder="Enter current password"
          value={passwords.current_password}
          onChange={(e) =>
            setPasswords({
              ...passwords,
              current_password: e.target.value,
            })
          }
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          New Password
        </label>

        <input
          type="password"
          placeholder="Enter new password"
          value={passwords.password}
          onChange={(e) =>
            setPasswords({
              ...passwords,
              password: e.target.value,
            })
          }
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Confirm Password
        </label>

        <input
          type="password"
          placeholder="Confirm new password"
          value={passwords.password_confirmation}
          onChange={(e) =>
            setPasswords({
              ...passwords,
              password_confirmation: e.target.value,
            })
          }
          className="h-11 w-full rounded-xl border border-border px-4"
        />
      </div>

      <button
        onClick={changePassword}
        disabled={saving}
        className="rounded-xl bg-primary px-6 py-3 text-primary-foreground disabled:opacity-60"
      >
        {saving ? "Updating..." : "Update Password"}
      </button>

    </div>
  </>

)}



          </div>
        </div>
      </div>
    </div>
  );
}