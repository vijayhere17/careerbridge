import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminErrorState,
  AdminLoadingSkeleton,
  apiErrorMessage,
  typeLabel,
} from "@/components/admin/shared";
import { adminService } from "@/services/adminService";

export function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.settings();
      setSettings(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load admin settings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const types = (settings?.recruiter_types as string[] | undefined) ?? [];
  const statuses = (settings?.approval_statuses as string[] | undefined) ?? [];
  const actions = (settings?.actions as string[] | undefined) ?? [];

  return (
    <AdminLayout title="Settings" subtitle="Admin platform configuration">
      {loading && <AdminLoadingSkeleton />}
      {!loading && error && <AdminErrorState message={error} onRetry={load} />}
      {!loading && !error && settings && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-surface p-5 space-y-2 text-sm">
            <h2 className="font-semibold">Recruiter approval</h2>
            <p>
              Require admin approval:{" "}
              <span className="font-semibold">
                {settings.require_admin_approval ? "Enabled" : "Disabled"}
              </span>
            </p>
            <p className="text-muted-foreground">
              Controlled by <code>RECRUITER_REQUIRE_ADMIN_APPROVAL</code>.
            </p>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 space-y-2 text-sm">
            <h2 className="font-semibold">Recruiter types</h2>
            <ul className="list-disc pl-5">
              {types.map((type) => (
                <li key={type}>{typeLabel(type)}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 space-y-2 text-sm">
            <h2 className="font-semibold">Approval statuses</h2>
            <ul className="list-disc pl-5">
              {statuses.map((status) => (
                <li key={status}>{status}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 space-y-2 text-sm">
            <h2 className="font-semibold">Available actions</h2>
            <ul className="list-disc pl-5">
              {actions.map((action) => (
                <li key={action}>{action.replaceAll("_", " ")}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
