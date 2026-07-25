import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  Bell,
  CalendarClock,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Search,
  Settings2,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import {
  RecruiterConfirmDialog,
  RecruiterEmptyState,
  RecruiterErrorState,
  RecruiterLoadingSkeleton,
  apiErrorMessage,
} from "@/components/recruiter/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { recruiterService } from "@/services/recruiterOpportunityService";

type NotificationItem = {
  id: number;
  title?: string | null;
  message?: string | null;
  body?: string | null;
  type?: string | null;
  is_read?: boolean;
  read?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type PaginatedNotifications = {
  data?: NotificationItem[];
  current_page?: number;
  last_page?: number;
  total?: number;
};

type ReadFilter = "all" | "unread" | "read";

const perPage = 12;

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await recruiterService.notifications({
        page,
        per_page: perPage,
        unread: readFilter === "all" ? undefined : readFilter === "unread",
        search: appliedSearch || undefined,
      });
      const normalized = normalizeNotifications(res.data.notifications);
      setNotifications(normalized.items);
      setPage(normalized.currentPage);
      setLastPage(normalized.lastPage);
      setTotal(normalized.total);
      setUnreadCount(res.data.unread_count ?? 0);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load notifications");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page, readFilter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const markRead = async (notification: NotificationItem) => {
    if (isRead(notification) || saving) return;

    setSaving(true);
    try {
      await recruiterService.markNotificationRead(notification.id);
      toast.success("Notification marked as read");
      await loadNotifications();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not mark notification as read"));
    } finally {
      setSaving(false);
    }
  };

  const markAllRead = async () => {
    setSaving(true);
    try {
      await recruiterService.markAllNotificationsRead();
      toast.success("All notifications marked as read");
      await loadNotifications();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not mark all notifications as read"));
    } finally {
      setSaving(false);
    }
  };

  const deleteNotification = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      await recruiterService.deleteNotification(deleteTarget.id);
      toast.success("Notification deleted");
      setDeleteTarget(null);
      await loadNotifications();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete notification"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <RecruiterLayout
      title="Notifications"
      subtitle={`${unreadCount} unread${total ? ` - ${total} total` : ""}`}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          disabled={saving || unreadCount === 0}
        >
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      }
    >
      <form
        onSubmit={onSearch}
        className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={readFilter}
            onValueChange={(value) => {
              setReadFilter(value as ReadFilter);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Read state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All notifications</SelectItem>
              <SelectItem value="unread">Unread only</SelectItem>
              <SelectItem value="read">Read only</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </div>
      </form>

      <section className="mt-6">
        {loading ? (
          <RecruiterLoadingSkeleton rows={5} />
        ) : error ? (
          <RecruiterErrorState message={error} onRetry={loadNotifications} />
        ) : notifications.length === 0 ? (
          <RecruiterEmptyState
            title="No notifications found"
            description="Try changing filters or check back later for new updates."
            action={<Bell className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                saving={saving}
                onRead={() => markRead(notification)}
                onDelete={() => setDeleteTarget(notification)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {lastPage}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage || loading}
            onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <RecruiterConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete notification?"
        description="This notification will be permanently removed."
        confirmLabel={saving ? "Deleting..." : "Delete"}
        destructive
        onConfirm={deleteNotification}
      />
    </RecruiterLayout>
  );
}

function NotificationCard({
  notification,
  saving,
  onRead,
  onDelete,
}: {
  notification: NotificationItem;
  saving: boolean;
  onRead: () => void;
  onDelete: () => void;
}) {
  const read = isRead(notification);
  const Icon = iconForType(notification.type);
  const tint = tintForType(notification.type);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRead();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onRead}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-card transition-colors sm:p-5",
        !read && "ring-1 ring-primary/15",
      )}
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{notification.title ?? "Notification"}</p>
              {!read && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                  Unread
                </span>
              )}
              {notification.type && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {titleCase(notification.type)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {notification.message ?? notification.body ?? "No details provided."}
            </p>
            <span className="mt-2 block text-xs text-muted-foreground">
              {formatDate(notification.created_at)}
            </span>
          </div>
          {!read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {!read && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onRead();
              }}
              disabled={saving}
            >
              Mark read
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            disabled={saving}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

function normalizeNotifications(input: PaginatedNotifications | NotificationItem[]) {
  if (Array.isArray(input)) {
    return {
      items: input,
      currentPage: 1,
      lastPage: 1,
      total: input.length,
    };
  }

  return {
    items: input?.data ?? [],
    currentPage: input?.current_page ?? 1,
    lastPage: input?.last_page ?? 1,
    total: input?.total ?? input?.data?.length ?? 0,
  };
}

function isRead(notification: NotificationItem) {
  return notification.is_read ?? notification.read ?? false;
}

function iconForType(type?: string | null) {
  const normalized = (type ?? "").toLowerCase();
  if (normalized.includes("application") || normalized.includes("candidate")) return Users;
  if (normalized.includes("interview") || normalized.includes("booking")) return CalendarClock;
  if (
    normalized.includes("payment") ||
    normalized.includes("wallet") ||
    normalized.includes("withdraw")
  ) {
    return CreditCard;
  }
  if (normalized.includes("system") || normalized.includes("setting")) return Settings2;
  return Bell;
}

function tintForType(type?: string | null) {
  const normalized = (type ?? "").toLowerCase();
  if (normalized.includes("application") || normalized.includes("candidate")) {
    return "bg-primary-soft text-primary";
  }
  if (normalized.includes("interview") || normalized.includes("booking")) {
    return "bg-accent-soft text-accent-foreground";
  }
  if (
    normalized.includes("payment") ||
    normalized.includes("wallet") ||
    normalized.includes("withdraw")
  ) {
    return "bg-secondary-soft text-secondary";
  }
  return "bg-muted text-muted-foreground";
}

function formatDate(value?: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString();
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
