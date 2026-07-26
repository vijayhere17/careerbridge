import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Ban, RotateCcw, StickyNote, History } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminConfirmDialog,
  AdminErrorState,
  AdminLoadingSkeleton,
  StatusPill,
  apiErrorMessage,
  formatDate,
  typeLabel,
} from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminService,
  type AdminRecruiterDetail,
  type AdminReviewAction,
} from "@/services/adminService";

type PendingAction = AdminReviewAction | null;

export function AdminRecruiterDetailPage({ userId }: { userId: number }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [detail, setDetail] = useState<AdminRecruiterDetail | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [requiredChanges, setRequiredChanges] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [showHistory, setShowHistory] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.getRecruiter(userId);
      setDetail(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load recruiter details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [userId]);

  const profile = (detail?.profile ?? {}) as Record<string, any>;
  const status = String(profile.approval_status ?? detail?.onboarding?.approval_status ?? "Pending");

  const confirmCopy: Record<Exclude<AdminReviewAction, never>, { title: string; description: string; destructive?: boolean }> = {
    approve: {
      title: "Approve recruiter?",
      description: "This recruiter will gain full dashboard access.",
    },
    reject: {
      title: "Reject recruiter?",
      description: "The recruiter will be blocked from the dashboard until they resubmit.",
      destructive: true,
    },
    request_changes: {
      title: "Request changes?",
      description: "The recruiter will be notified and asked to update their profile.",
    },
    suspend: {
      title: "Suspend recruiter?",
      description: "Dashboard access will be revoked immediately.",
      destructive: true,
    },
    reactivate: {
      title: "Reactivate recruiter?",
      description: "The recruiter will regain approved dashboard access.",
    },
    internal_note: {
      title: "Add internal note?",
      description: "This note is visible only to admins.",
    },
  };

  const runAction = async () => {
    if (!pendingAction) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body = {
        action: pendingAction,
        rejection_reason: reason,
        admin_remarks: notes,
        required_changes: requiredChanges,
        internal_notes: internalNotes,
      };
      // Prefer dedicated admin endpoint; falls back is unnecessary since both share logic.
      const res = await adminService.review(userId, body);
      setDetail(res.data);
      setSuccess("Action completed successfully.");
      setPendingAction(null);
      setReason("");
      setNotes("");
      setRequiredChanges("");
      setInternalNotes("");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update recruiter."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Recruiter details"
      subtitle={profile.company_name || detail?.user.name}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/recruiters">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
      }
    >
      {loading && <AdminLoadingSkeleton rows={6} />}
      {!loading && error && !detail && <AdminErrorState message={error} onRetry={load} />}
      {!loading && detail && (
        <div className="space-y-6">
          {success && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
              {success}
            </div>
          )}
          {error && <AdminErrorState message={error} />}

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {profile.company_logo ? (
                <img src={profile.company_logo} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                  {(profile.company_name || "R").slice(0, 1)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-bold">{profile.company_name || "Untitled company"}</h2>
                  <StatusPill status={status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {profile.recruiter_name || detail.user.name} · {typeLabel(profile.recruiter_type)} · {profile.industry || "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Registered {formatDate(detail.user.created_at)} · Submitted {formatDate(profile.submitted_at)} · Completion {profile.profile_completion ?? 0}%
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(status === "Pending" || status === "ChangesRequested" || status === "Rejected") && (
                    <Button disabled={saving} onClick={() => setPendingAction("approve")}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />Approve
                    </Button>
                  )}
                  {(status === "Pending" || status === "ChangesRequested") && (
                    <>
                      <Button variant="destructive" disabled={saving} onClick={() => setPendingAction("reject")}>
                        <XCircle className="mr-2 h-4 w-4" />Reject
                      </Button>
                      <Button variant="outline" disabled={saving} onClick={() => setPendingAction("request_changes")}>
                        <RefreshCw className="mr-2 h-4 w-4" />Request Changes
                      </Button>
                    </>
                  )}
                  {status === "Approved" && (
                    <Button variant="outline" disabled={saving} onClick={() => setPendingAction("suspend")}>
                      <Ban className="mr-2 h-4 w-4" />Suspend
                    </Button>
                  )}
                  {(status === "Suspended" || status === "Rejected") && (
                    <Button variant="outline" disabled={saving} onClick={() => setPendingAction("reactivate")}>
                      <RotateCcw className="mr-2 h-4 w-4" />Reactivate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-surface p-5 space-y-2 text-sm">
              <h3 className="font-semibold">Company information</h3>
              <p><span className="text-muted-foreground">Website:</span> {profile.website || "—"}</p>
              <p><span className="text-muted-foreground">LinkedIn:</span> {profile.linkedin || "—"}</p>
              <p><span className="text-muted-foreground">Size:</span> {profile.company_size || "—"}</p>
              <p><span className="text-muted-foreground">Registration #:</span> {profile.company_registration_number || "—"}</p>
              <p><span className="text-muted-foreground">GST:</span> {profile.gst_number || "—"}</p>
              <p className="pt-2 text-muted-foreground">{profile.about_company || profile.company_description || "No company description."}</p>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 space-y-2 text-sm">
              <h3 className="font-semibold">Recruiter information</h3>
              <p><span className="text-muted-foreground">Name:</span> {profile.recruiter_name || detail.user.name}</p>
              <p><span className="text-muted-foreground">Designation:</span> {profile.designation || "—"}</p>
              <p><span className="text-muted-foreground">Email:</span> {profile.email || detail.user.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {profile.phone || detail.user.mobile || "—"}</p>
              <p><span className="text-muted-foreground">Email verified:</span> {detail.user.verified_email ? "Yes" : "No"}</p>
              <p><span className="text-muted-foreground">Mobile verified:</span> {detail.user.verified_mobile ? "Yes" : "No"}</p>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 space-y-2 text-sm">
              <h3 className="font-semibold">Address</h3>
              <p>{profile.office_address || "—"}</p>
              <p>{[profile.city, profile.state, profile.country, profile.pin_code].filter(Boolean).join(", ") || "—"}</p>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 space-y-2 text-sm">
              <h3 className="font-semibold">Review context</h3>
              <p><span className="text-muted-foreground">Reason:</span> {detail.rejection_reason || "—"}</p>
              <p><span className="text-muted-foreground">Required changes:</span> {detail.required_changes || "—"}</p>
              <p><span className="text-muted-foreground">Admin remarks:</span> {profile.admin_remarks || "—"}</p>
              <p><span className="text-muted-foreground">Internal notes:</span> {detail.internal_notes || "—"}</p>
              <p><span className="text-muted-foreground">Reviewed by:</span> {detail.reviewed_by?.name || "—"}</p>
            </section>
          </div>

          <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <h3 className="font-semibold">Admin actions</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Reason</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection / change reason" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Admin remarks shared with recruiter" />
              </div>
              <div>
                <Label>Required changes</Label>
                <Textarea value={requiredChanges} onChange={(e) => setRequiredChanges(e.target.value)} placeholder="List required profile updates" />
              </div>
              <div>
                <Label>Internal notes</Label>
                <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Private admin-only notes" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={() => setPendingAction("approve")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>
              <Button variant="destructive" disabled={saving} onClick={() => setPendingAction("reject")}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
              <Button variant="outline" disabled={saving} onClick={() => setPendingAction("request_changes")}><RefreshCw className="mr-2 h-4 w-4" />Request Changes</Button>
              <Button variant="outline" disabled={saving} onClick={() => setPendingAction("suspend")}><Ban className="mr-2 h-4 w-4" />Suspend</Button>
              <Button variant="outline" disabled={saving} onClick={() => setPendingAction("reactivate")}><RotateCcw className="mr-2 h-4 w-4" />Reactivate</Button>
              <Button variant="secondary" disabled={saving} onClick={() => setPendingAction("internal_note")}><StickyNote className="mr-2 h-4 w-4" />Add Internal Notes</Button>
              <Button variant="ghost" onClick={() => setShowHistory((v) => !v)}><History className="mr-2 h-4 w-4" />View History</Button>
            </div>
          </section>

          {showHistory && (
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="mb-3 font-semibold">Activity timeline</h3>
              <div className="space-y-2">
                {detail.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No history yet.</p>
                ) : (
                  detail.history.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border px-3 py-2.5 text-sm">
                      <p className="font-medium">
                        {item.action.replaceAll("_", " ")}
                        {item.to_status ? ` → ${item.to_status}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.admin?.name || "Admin"} · {formatDate(item.created_at)}
                      </p>
                      {item.reason && <p className="mt-1">Reason: {item.reason}</p>}
                      {item.notes && <p className="mt-1">Notes: {item.notes}</p>}
                      {item.required_changes && <p className="mt-1">Required: {item.required_changes}</p>}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {pendingAction && (
        <AdminConfirmDialog
          open={!!pendingAction}
          onOpenChange={(open) => !open && setPendingAction(null)}
          title={confirmCopy[pendingAction].title}
          description={confirmCopy[pendingAction].description}
          confirmLabel="Confirm"
          destructive={confirmCopy[pendingAction].destructive}
          onConfirm={() => void runAction()}
        />
      )}
    </AdminLayout>
  );
}
