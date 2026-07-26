import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, FileText, Paperclip, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import {
  RecruiterEmptyState,
  RecruiterErrorState,
  RecruiterLoadingSkeleton,
  apiErrorMessage,
} from "@/components/recruiter/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { recruiterService } from "@/services/recruiterOpportunityService";

type ConversationItem = {
  application_id: number;
  status?: string | null;
  unread_count?: number | null;
  candidate?: {
    id?: number;
    name?: string | null;
    profile_photo?: string | null;
  } | null;
  opportunity?: {
    id?: number;
    title?: string | null;
    company_name?: string | null;
  } | null;
  last_message?: {
    id?: number;
    body?: string | null;
    attachment_name?: string | null;
    created_at?: string | null;
    sender_name?: string | null;
    is_mine?: boolean;
  } | null;
};

type MessageItem = {
  id: number;
  recruiter_application_id?: number;
  body?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  created_at?: string | null;
  sender?: {
    id?: number;
    name?: string | null;
    profile_photo?: string | null;
  } | null;
  receiver?: {
    id?: number;
    name?: string | null;
  } | null;
};

type Pagination = {
  currentPage: number;
  lastPage: number;
  total: number;
};

const perPage = 20;

function initialApplicationId() {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("applicationId");
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [selectedId, setSelectedId] = useState<number | null>(() => initialApplicationId());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationsError, setConversationsError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.application_id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setConversationsError("");
    try {
      const res = await recruiterService.conversations({
        page,
        per_page: perPage,
        search: appliedSearch || undefined,
        unread: readFilter === "unread" ? true : undefined,
      });
      const data = res.data ?? {};
      const items = Array.isArray(data.conversations)
        ? (data.conversations as ConversationItem[])
        : [];
      setConversations(items);
      setUnreadCount(Number(data.unread_count ?? 0));
      setPagination({
        currentPage: data.pagination?.current_page ?? page,
        lastPage: data.pagination?.last_page ?? 1,
        total: data.pagination?.total ?? items.length,
      });
      setSelectedId((current) => {
        if (current && items.some((conversation) => conversation.application_id === current)) {
          return current;
        }
        return items[0]?.application_id ?? current ?? null;
      });
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load conversations");
      setConversationsError(message);
      setConversations([]);
      toast.error(message);
    } finally {
      setLoadingConversations(false);
    }
  }, [appliedSearch, page, readFilter]);

  const loadMessages = useCallback(async (applicationId: number) => {
    setLoadingMessages(true);
    setMessagesError("");
    try {
      const res = await recruiterService.applicationMessages(applicationId);
      setMessages((res.data?.messages as MessageItem[]) ?? []);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.application_id === applicationId
            ? { ...conversation, unread_count: 0 }
            : conversation,
        ),
      );
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load message history");
      setMessagesError(message);
      setMessages([]);
      toast.error(message);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    } else {
      setMessages([]);
    }
  }, [loadMessages, selectedId]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || sending || (!draft.trim() && !attachment)) return;

    setSending(true);
    try {
      await recruiterService.sendApplicationMessage(selectedId, draft.trim(), attachment);
      toast.success("Message sent");
      setDraft("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await Promise.all([loadMessages(selectedId), loadConversations()]);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not send message"));
    } finally {
      setSending(false);
    }
  };

  return (
    <RecruiterLayout
      title="Messages"
      subtitle={`${unreadCount} unread${pagination.total ? ` - ${pagination.total} conversations` : ""}`}
    >
      <form
        onSubmit={onSearch}
        className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search candidate, opportunity, or message..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={readFilter}
            onValueChange={(value) => {
              setReadFilter(value as "all" | "unread");
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Read state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All conversations</SelectItem>
              <SelectItem value="unread">Unread only</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </div>
      </form>

      <section className="mt-6 grid min-h-[640px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:grid-cols-[380px_1fr]">
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Inbox</h2>
            <p className="text-sm text-muted-foreground">
              {pagination.total
                ? `${pagination.total} conversation${pagination.total === 1 ? "" : "s"}`
                : "Candidate conversations"}
            </p>
          </div>

          <div className="max-h-[560px] overflow-y-auto p-3">
            {loadingConversations ? (
              <RecruiterLoadingSkeleton rows={5} />
            ) : conversationsError ? (
              <RecruiterErrorState message={conversationsError} onRetry={loadConversations} />
            ) : conversations.length === 0 ? (
              <RecruiterEmptyState
                title="No conversations found"
                description="Try changing filters or open an application to start messaging."
              />
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <ConversationButton
                    key={conversation.application_id}
                    conversation={conversation}
                    active={conversation.application_id === selectedId}
                    onClick={() => setSelectedId(conversation.application_id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border p-3 text-sm">
            <span className="text-muted-foreground">
              Page {pagination.currentPage} of {pagination.lastPage}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loadingConversations}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.lastPage || loadingConversations}
                onClick={() => setPage((current) => Math.min(pagination.lastPage, current + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex min-h-[640px] flex-col">
          {selectedId ? (
            <>
              <div className="border-b border-border p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage
                      src={selectedConversation?.candidate?.profile_photo || undefined}
                    />
                    <AvatarFallback>
                      {(selectedConversation?.candidate?.name || "C").slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold">
                        {selectedConversation?.candidate?.name || "Candidate"}
                      </h2>
                      {selectedConversation?.status && (
                        <Badge variant="secondary">{titleCase(selectedConversation.status)}</Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {selectedConversation?.opportunity?.title || "Selected application"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loadingMessages ? (
                  <RecruiterLoadingSkeleton rows={5} />
                ) : messagesError ? (
                  <RecruiterErrorState
                    message={messagesError}
                    onRetry={() => selectedId && loadMessages(selectedId)}
                  />
                ) : messages.length === 0 ? (
                  <RecruiterEmptyState
                    title="No messages yet"
                    description="Send the first message to this candidate."
                  />
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={sendMessage} className="space-y-3 border-t border-border p-4">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message..."
                  rows={3}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                  />
                  <Button type="submit" disabled={sending || (!draft.trim() && !attachment)}>
                    <Send className="h-4 w-4" />
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </div>
                {attachment && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Paperclip className="h-3.5 w-3.5" />
                    {attachment.name}
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6">
              <RecruiterEmptyState
                title="Select a conversation"
                description="Choose a candidate conversation from the inbox to view messages."
              />
            </div>
          )}
        </div>
      </section>
    </RecruiterLayout>
  );
}

function ConversationButton({
  conversation,
  active,
  onClick,
}: {
  conversation: ConversationItem;
  active: boolean;
  onClick: () => void;
}) {
  const unread = Number(conversation.unread_count ?? 0);
  const preview =
    conversation.last_message?.body ||
    (conversation.last_message?.attachment_name
      ? `Attachment: ${conversation.last_message.attachment_name}`
      : "No preview available");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-colors",
        active
          ? "border-primary bg-primary-soft/70"
          : "border-border bg-background hover:bg-muted/60",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.candidate?.profile_photo || undefined} />
          <AvatarFallback>{(conversation.candidate?.name || "C").slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium">{conversation.candidate?.name || "Candidate"}</p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatShortTime(conversation.last_message?.created_at)}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.opportunity?.title || "Opportunity"}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {conversation.last_message?.is_mine ? "You: " : ""}
            {preview}
          </p>
        </div>
        {unread > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: MessageItem }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{message.sender?.name || "User"}</span>
        <span>{formatDateTime(message.created_at)}</span>
        {!message.is_read && <span>Unread</span>}
      </div>
      {message.body && <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>}
      {message.attachment_url && (
        <a
          href={message.attachment_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-primary hover:bg-muted"
        >
          <FileText className="h-4 w-4" />
          {message.attachment_name || "Attachment"}
        </a>
      )}
    </div>
  );
}

function formatShortTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function titleCase(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const Messages = MessagesPage;
