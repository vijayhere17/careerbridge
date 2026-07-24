import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Briefcase, GraduationCap, Mail, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, clearAuth, getStoredUser, AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — CareerBridge" },
      {
        name: "description",
        content: "Edit your CareerBridge profile details for job seeker or mentor roles.",
      },
    ],
  }),
  component: ProfilePage,
});

type FormValues = {
  fullName: string;
  email: string;
  role: "seeker" | "mentor";
  company?: string;
  currentRole?: string;
  targetRoles: string;
  location: string;
  bio: string;
};

const initialFormValues: FormValues = {
  fullName: "",
  email: "",
  role: "seeker",
  company: "",
  currentRole: "",
  targetRoles: "",
  location: "",
  bio: "",
};

function mapBackendUser(user: AuthUser): FormValues {
  return {
    fullName: user.name,
    email: user.email,
    role: user.role === "mentor" ? "mentor" : "seeker",
    company: user.company ?? "",
    currentRole: user.current_role ?? "",
    targetRoles: user.target_roles ?? "",
    location: user.location ?? "",
    bio: user.bio ?? "",
  };
}

function ProfilePage() {
  const [role, setRole] = useState<"seeker" | "mentor">("seeker");
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await apiFetch<{ user: AuthUser }>("/api/auth/user", {
          method: "GET",
        });

        const nextValues = mapBackendUser(response.user);
        setRole(nextValues.role);
        setFormValues(nextValues);
      } catch (error) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const handleChange =
    (key: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormValues((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await apiFetch<{ user: AuthUser }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify({
        name: formValues.fullName,
        email: formValues.email,
        role: formValues.role,
        company: formValues.company,
        current_role: formValues.currentRole,
        target_roles: formValues.targetRoles,
        location: formValues.location,
        bio: formValues.bio,
      }),
    });

    alert("Profile updated successfully.");
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container-page">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="mx-auto mt-8 max-w-4xl space-y-8">
          <div className="rounded-3xl border border-border bg-surface p-8 shadow-card-hover">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Your profile
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
                  Update your details
                </h1>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Job seekers and mentors can save their role-specific details here. This data will
                  be wired to the Laravel backend later.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={role === "seeker" ? "brand" : "outline"}
                  size="sm"
                  onClick={() => {
                    setRole("seeker");
                    setFormValues((prev) => ({ ...prev, role: "seeker" }));
                  }}
                >
                  <GraduationCap className="h-4 w-4" /> Job Seeker
                </Button>
                <Button
                  variant={role === "mentor" ? "brand" : "outline"}
                  size="sm"
                  onClick={() => {
                    setRole("mentor");
                    setFormValues((prev) => ({ ...prev, role: "mentor" }));
                  }}
                >
                  <Briefcase className="h-4 w-4" /> Mentor
                </Button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                label="Full name"
                icon={User}
                value={formValues.fullName}
                onChange={handleChange("fullName")}
                placeholder="Aarav Sharma"
              />
              <FormField
                label="Email"
                icon={Mail}
                value={formValues.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                type="email"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                label="Location"
                icon={MapPin}
                value={formValues.location}
                onChange={handleChange("location")}
                placeholder="Bengaluru, India"
              />
              <FormField
                label="Target roles"
                icon={Briefcase}
                value={formValues.targetRoles}
                onChange={handleChange("targetRoles")}
                placeholder={role === "mentor" ? "Mentor specialties" : "Job seeker targets"}
              />
            </div>

            {role === "mentor" ? (
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  label="Company"
                  icon={Briefcase}
                  value={formValues.company}
                  onChange={handleChange("company")}
                  placeholder="Google, Meta, etc."
                />
                <FormField
                  label="Current role"
                  icon={Briefcase}
                  value={formValues.currentRole}
                  onChange={handleChange("currentRole")}
                  placeholder="Software engineer"
                />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  label="Job seeker focus"
                  icon={Briefcase}
                  value={formValues.currentRole}
                  onChange={handleChange("currentRole")}
                  placeholder="Current role or last role"
                />
                <div />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bio
              </label>
              <textarea
                value={formValues.bio}
                onChange={handleChange("bio")}
                rows={5}
                className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={
                  role === "mentor"
                    ? "Share your mentoring strengths, experience, and availability."
                    : "Describe your job search goals, skills, and target companies."
                }
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Profile details</p>
                <p className="text-sm text-muted-foreground">
                  This page is currently local-only. Backend integration will connect it to Laravel
                  later.
                </p>
              </div>
              <Button type="submit" variant="brand" size="lg">
                Save profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-3 rounded-3xl border border-border bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
