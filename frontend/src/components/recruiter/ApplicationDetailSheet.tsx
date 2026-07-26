import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Lock,
  MessageSquare,
  Paperclip,
  Star,
  Unlock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  RecruiterEmptyState,
  RecruiterErrorState,
  RecruiterLoadingSkeleton,
  apiErrorMessage,
} from "@/components/recruiter/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { recruiterService, type RecruiterApplication } from "@/services/recruiterOpportunityService";

type Detail = RecruiterApplication & {
  contact_unlocked?: boolean;
  contact_price?: number;
  reject_reason?: string | null;
  info_request?: string | null;
  timeline?: Array<{
    id: number;
    event?: string;
    from_status?: string | null;
    to_status?: string | null;
    note?: string | null;
    created_at?: string | null;
    actor?: { name?: string } | null;
  }>;
  previous_applications?: Array<{
    id: number;
    status?: string;
    applied_at?: string | null;
    opportunity?: { title?: string | null } | null;
  }>;
  profile_strength?: number;
  candidate?: RecruiterApplication["candidate"] & {
    headline?: string | null;
    education?: string | null;
    bio?: string | null;
    projects?: unknown;
    certificates?: unknown;
    languages?: unknown;
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
    contact_unlocked?: boolean;
  };
};

type MessageItem = {
  id: number;
  body?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  is_read?: boolean;
  created_at?: string | null;
  sender?: { name?: string | null } | null;
};

export function ApplicationDetailSheet({
  applicationId,
  open,
  onOpenChange,
  onChanged,
}: {
  applicationId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notes, setNotes] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [chat, setChat] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewLink, setInterviewLink] = useState("");
  const [rating, setRating] = useState(0);

  const load = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const [appRes, msgRes] = await Promise.all([
        recruiterService.getApplication(id),
        recruiterService.applicationMessages(id).catch(() => ({ data: { messages: [] } })),
      ]);
      const data = appRes.data as Detail;
      setDetail(data);
      setNotes(data.recruiter_notes || "");
      setRejectReason(data.reject_reason || "");
      setRating(Number(data.rating || 0));
      setInterviewAt(toDateTimeLocal(data.interview_at));
      setInterviewLink(data.interview_link || "");
      setMessages((msgRes.data?.messages as MessageItem[]) || []);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load application details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && applicationId) void load(applicationId);
  }, [open, applicationId]);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    if (!applicationId) return;
    setSaving(true);
    try {
      await fn();
      toast.success(label);
      await load(applicationId);
      onChanged?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Action failed"));
    } finally {
      setSaving(false);
    }
  };

  const candidate = detail?.candidate;
  const unlocked = Boolean(detail?.contact_unlocked || candidate?.contact_unlocked);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Application details</SheetTitle>
          <SheetDescription>
            Review candidate profile, take actions, unlock contact, and message.
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="mt-6">
            <RecruiterLoadingSkeleton rows={6} />
          </div>
        )}
        {!loading && error && (
          <div className="mt-6">
            <RecruiterErrorState
              message={error}
              onRetry={() => applicationId && load(applicationId)}
            />
          </div>
        )}
        {!loading && !error && detail && (
          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-3">
              <Avatar className="h-14 w-14">
                <AvatarImage src={candidate?.photo || candidate?.profile_photo || undefined} />
                <AvatarFallback>{(candidate?.name || "C").slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{candidate?.name || "Candidate"}</p>
                <p className="text-sm text-muted-foreground">
                  {candidate?.headline || candidate?.bio || "No headline"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {detail.opportunity?.title} · {detail.status_label || detail.status}
                  {typeof detail.profile_strength === "number"
                    ? ` · Profile ${detail.profile_strength}%`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={saving}
                onClick={() =>
                  run("Moved to under review", () =>
                    recruiterService.underReviewApplication(detail.id),
                  )
                }
              >
                Under review
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() =>
                  run("Shortlisted", () => recruiterService.shortlistApplication(detail.id))
                }
              >
                Shortlist
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() =>
                  run("Accepted", () => recruiterService.acceptApplication(detail.id))
                }
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="brand"
                disabled={saving}
                onClick={() => run("Hired", () => recruiterService.hireApplication(detail.id))}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Hire
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() =>
                  run("Interview completed", () => recruiterService.completeInterview(detail.id))
                }
              >
                Interview done
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() =>
                  run("Marked completed", () => recruiterService.completeApplication(detail.id))
                }
              >
                Complete
              </Button>
            </div>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <h3 className="font-semibold">Schedule interview</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="detail_interview_at">Date and time</Label>
                  <Input
                    id="detail_interview_at"
                    type="datetime-local"
                    value={interviewAt}
                    onChange={(e) => setInterviewAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detail_interview_link">Meeting link</Label>
                  <Input
                    id="detail_interview_link"
                    value={interviewLink}
                    onChange={(e) => setInterviewLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={saving || !interviewAt}
                onClick={() =>
                  run("Interview scheduled", () =>
                    recruiterService.scheduleInterview(detail.id, {
                      interview_at: new Date(interviewAt).toISOString(),
                      interview_link: interviewLink.trim() || undefined,
                      interview_status: "scheduled",
                    }),
                  )
                }
              >
                Schedule interview
              </Button>
            </section>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <Label>Reject with reason</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="Optional rejection reason"
              />
              <Button
                size="sm"
                variant="destructive"
                disabled={saving}
                onClick={() =>
                  run("Rejected", () =>
                    recruiterService.rejectApplication(
                      detail.id,
                      rejectReason.trim() || undefined,
                    ),
                  )
                }
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </section>

            <section className="space-y-2 rounded-xl border border-border p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">Contact details</h3>
                {unlocked ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Unlock className="h-3.5 w-3.5" /> Unlocked
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="brand"
                    disabled={saving}
                    onClick={() =>
                      run("Contact unlocked", () =>
                        recruiterService.unlockCandidateContact(detail.id),
                      )
                    }
                  >
                    <Lock className="mr-1 h-4 w-4" />
                    Unlock ₹{detail.contact_price ?? 49}
                  </Button>
                )}
              </div>
              {unlocked ? (
                <>
                  <p>Email: {candidate?.email || "—"}</p>
                  <p>Phone: {candidate?.mobile || "—"}</p>
                  <p>LinkedIn: {candidate?.linkedin || "—"}</p>
                  <p>Portfolio: {candidate?.portfolio || "—"}</p>
                  <p>GitHub: {candidate?.github || "—"}</p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Unlock to reveal phone, email, LinkedIn and portfolio contacts.
                </p>
              )}
            </section>

            <section className="space-y-2 rounded-xl border border-border p-4 text-sm">
              <h3 className="font-semibold">Profile</h3>
              <p>
                <span className="text-muted-foreground">Experience:</span>{" "}
                {candidate?.experience || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Education:</span>{" "}
                {candidate?.education || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Location:</span>{" "}
                {candidate?.location || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Expected salary:</span>{" "}
                {detail.expected_salary != null ? `₹${detail.expected_salary}` : "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Skills:</span>{" "}
                {Array.isArray(candidate?.skills)
                  ? candidate?.skills.join(", ")
                  : (candidate?.skills as string) || "—"}
              </p>
              <p className="text-muted-foreground">
                {detail.message || "No cover letter provided."}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {detail.resume_url && (
                  <Button asChild size="sm" variant="outline">
                    <a href={detail.resume_url} target="_blank" rel="noreferrer">
                      <Download className="mr-1 h-4 w-4" /> Resume
                    </a>
                  </Button>
                )}
                {unlocked && candidate?.portfolio && candidate.portfolio !== "Locked" && (
                  <Button asChild size="sm" variant="outline">
                    <a href={candidate.portfolio} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" /> Portfolio
                    </a>
                  </Button>
                )}
              </div>
            </section>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <Label>Private notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() =>
                  run("Notes saved", () =>
                    recruiterService.updateApplication(detail.id, { recruiter_notes: notes }),
                  )
                }
              >
                Save notes
              </Button>
            </section>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <Label>Rate candidate</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="rounded p-0.5 text-muted-foreground hover:text-accent disabled:opacity-60"
                    disabled={saving}
                    onClick={() =>
                      run("Rating updated", async () => {
                        await recruiterService.updateApplication(detail.id, { rating: value });
                        setRating(value);
                      })
                    }
                    aria-label={`Rate ${value}`}
                  >
                    <Star
                      className={`h-5 w-5 ${rating >= value ? "fill-accent text-accent" : ""}`}
                    />
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <Label>Request more information</Label>
              <Textarea
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                rows={2}
                placeholder="Ask the candidate for missing details…"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={saving || !infoMessage.trim()}
                onClick={async () => {
                  await run("Information requested", () =>
                    recruiterService.requestApplicationInfo(detail.id, infoMessage.trim()),
                  );
                  setInfoMessage("");
                }}
              >
                Send request
              </Button>
            </section>

            <section className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Messages</h3>
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {messages.length === 0 ? (
                  <RecruiterEmptyState
                    title="No messages yet"
                    description="Start the conversation with the candidate."
                  />
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <p className="text-xs text-muted-foreground">
                        {message.sender?.name || "User"} ·{" "}
                        {message.created_at ? new Date(message.created_at).toLocaleString() : ""}
                        {message.is_read ? "" : " · unread"}
                      </p>
                      {message.body ? <p>{message.body}</p> : null}
                      {message.attachment_url ? (
                        <a
                          href={message.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-primary underline"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {message.attachment_name || "Attachment"}
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <Input
                  value={chat}
                  onChange={(e) => setChat(e.target.value)}
                  placeholder="Write a message…"
                />
                <Input
                  type="file"
                  onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  size="sm"
                  disabled={saving || (!chat.trim() && !attachment)}
                  onClick={async () => {
                    await run("Message sent", () =>
                      recruiterService.sendApplicationMessage(
                        detail.id,
                        chat.trim(),
                        attachment,
                      ),
                    );
                    setChat("");
                    setAttachment(null);
                  }}
                >
                  Send
                </Button>
              </div>
            </section>

            <section className="space-y-2 rounded-xl border border-border p-4">
              <h3 className="font-semibold">Timeline</h3>
              {(detail.timeline || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No timeline events yet.</p>
              ) : (
                detail.timeline?.map((event) => (
                  <div key={event.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                    <p className="font-medium">
                      {(event.event || "update").replaceAll("_", " ")}
                      {event.to_status ? ` → ${event.to_status}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.actor?.name || "System"} ·{" "}
                      {event.created_at ? new Date(event.created_at).toLocaleString() : ""}
                    </p>
                    {event.note && <p className="mt-1 text-muted-foreground">{event.note}</p>}
                  </div>
                ))
              )}
            </section>

            {(detail.previous_applications || []).length > 0 && (
              <section className="space-y-2 rounded-xl border border-border p-4">
                <h3 className="font-semibold">Previous applications</h3>
                {detail.previous_applications?.map((prev) => (
                  <div key={prev.id} className="flex items-center justify-between text-sm">
                    <span>{prev.opportunity?.title || "Opportunity"}</span>
                    <span className="text-muted-foreground">{prev.status}</span>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}
