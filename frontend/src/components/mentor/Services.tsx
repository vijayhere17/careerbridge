import { useState } from "react";
import {
  Plus, Edit2, Trash2, Video, Phone, MessageCircle,
  Clock, DollarSign, CheckCircle2, X, Save, Eye, EyeOff,
  ToggleLeft, ToggleRight,
} from "lucide-react";

type SessionType = "Video Call" | "Audio Call" | "Chat";

interface Service {
  id: string;
  title: string;
  description: string;
  type: SessionType;
  duration: number;
  price: number;
  active: boolean;
  bookings: number;
}

const INITIAL_SERVICES: Service[] = [
  {
    id: "s1",
    title: "PM Mock Interview",
    description: "Full PM interview simulation with detailed feedback on product sense, execution, and behavioral questions.",
    type: "Video Call",
    duration: 60,
    price: 1499,
    active: true,
    bookings: 48,
  },
  {
    id: "s2",
    title: "Resume & Portfolio Review",
    description: "In-depth review and optimisation of your PM resume and case study portfolio.",
    type: "Video Call",
    duration: 45,
    price: 999,
    active: true,
    bookings: 32,
  },
  {
    id: "s3",
    title: "Career Guidance Session",
    description: "1-on-1 career path planning, role transition advice, and personalised action plan.",
    type: "Audio Call",
    duration: 30,
    price: 699,
    active: true,
    bookings: 21,
  },
  {
    id: "s4",
    title: "Quick Chat",
    description: "15-minute chat for a specific question or quick advice.",
    type: "Chat",
    duration: 15,
    price: 299,
    active: false,
    bookings: 5,
  },
];

const SESSION_TYPE_OPTIONS: { type: SessionType; icon: React.ElementType; label: string }[] = [
  { type: "Video Call",  icon: Video,          label: "Video Call" },
  { type: "Audio Call",  icon: Phone,          label: "Audio Call" },
  { type: "Chat",        icon: MessageCircle,  label: "Chat" },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const TYPE_ICONS: Record<SessionType, React.ElementType> = {
  "Video Call": Video,
  "Audio Call": Phone,
  "Chat":       MessageCircle,
};

const emptyService = (): Omit<Service, "id" | "bookings"> => ({
  title: "",
  description: "",
  type: "Video Call",
  duration: 60,
  price: 0,
  active: true,
});

function ServiceForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Service, "id" | "bookings">;
  onSave: (s: Omit<Service, "id" | "bookings">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const valid = form.title.trim() && form.description.trim() && form.price > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 lg:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
          <h3 className="font-bold text-sm">{initial.title ? "Edit Service" : "Add New Service"}</h3>
          <button onClick={onCancel} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Service Title *
            </label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. PM Mock Interview"
              className="dash-input w-full"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="What will candidates get from this session?"
              className="dash-input w-full resize-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1 text-right">{form.description.length}/300</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Session Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SESSION_TYPE_OPTIONS.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => set("type", type)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                    form.type === type
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${form.type === type ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-semibold ${form.type === type ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Duration (minutes) *
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => set("duration", d)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    form.duration === d
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Price (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
              <input
                type="number"
                min={0}
                value={form.price || ""}
                onChange={(e) => set("price", parseInt(e.target.value) || 0)}
                placeholder="0"
                className="dash-input w-full pl-7"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-semibold">Active</p>
              <p className="text-xs text-muted-foreground">Candidates can book this service</p>
            </div>
            <button onClick={() => set("active", !form.active)}>
              {form.active
                ? <ToggleRight className="h-7 w-7 text-primary" />
                : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => valid && onSave(form)}
              disabled={!valid}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" /> Save Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteDialog({ service, onConfirm, onCancel }: {
  service: Service;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 lg:items-center">
      <div className="w-full max-w-xs rounded-2xl bg-surface p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-sm">Delete service?</p>
            <p className="text-xs text-muted-foreground truncate">{service.title}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          This service has <span className="font-semibold">{service.bookings} past bookings</span>. Deleting it will not affect completed sessions.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
  onToggle,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const Icon = TYPE_ICONS[service.type];

  return (
    <div className={`rounded-xl border bg-surface p-4 transition-all ${service.active ? "border-border" : "border-border opacity-60"}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{service.title}</p>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                  service.active
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}>
                  {service.active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{service.description}</p>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {service.duration} min
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon className="h-3 w-3" /> {service.type}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-primary">
              <DollarSign className="h-3 w-3" /> ₹{service.price.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" /> {service.bookings} bookings
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onToggle}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted transition-colors"
            >
              {service.active
                ? <><EyeOff className="h-3 w-3" /> Deactivate</>
                : <><Eye className="h-3 w-3" /> Activate</>}
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted transition-colors"
            >
              <Edit2 className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 transition-colors ml-auto"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MentorServices() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const activeCount   = services.filter((s) => s.active).length;
  const totalBookings = services.reduce((sum, s) => sum + s.bookings, 0);
  const minPrice      = services.length ? Math.min(...services.map((s) => s.price)) : 0;
  const maxPrice      = services.length ? Math.max(...services.map((s) => s.price)) : 0;

  const handleAdd = (data: Omit<Service, "id" | "bookings">) => {
    setServices((prev) => [...prev, { ...data, id: `s${Date.now()}`, bookings: 0 }]);
    setShowForm(false);
  };

  const handleEdit = (data: Omit<Service, "id" | "bookings">) => {
    if (!editTarget) return;
    setServices((prev) => prev.map((s) => s.id === editTarget.id ? { ...s, ...data } : s));
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleToggle = (id: string) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Services", value: services.length },
          { label: "Active",         value: activeCount },
          { label: "Total Bookings", value: totalBookings },
          { label: "Price Range",    value: services.length ? `₹${minPrice}–₹${maxPrice}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Your Services ({services.length})
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted mb-3">
            <Video className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No services yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Add your first service to start receiving bookings.</p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => setEditTarget(service)}
              onDelete={() => setDeleteTarget(service)}
              onToggle={() => handleToggle(service.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ServiceForm
          initial={emptyService()}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editTarget && (
        <ServiceForm
          initial={{
            title: editTarget.title,
            description: editTarget.description,
            type: editTarget.type,
            duration: editTarget.duration,
            price: editTarget.price,
            active: editTarget.active,
          }}
          onSave={handleEdit}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          service={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}