import { useState } from "react";
import { Check, Plus, Trash2, Clock, Save, X } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
  "08:00 PM", "09:00 PM",
];

interface DaySchedule {
  enabled: boolean;
  slots: string[];
}

type Schedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: Schedule = {
  Monday:    { enabled: true,  slots: ["10:00 AM", "11:00 AM", "03:00 PM", "04:00 PM"] },
  Tuesday:   { enabled: true,  slots: ["10:00 AM", "11:00 AM", "03:00 PM"] },
  Wednesday: { enabled: false, slots: [] },
  Thursday:  { enabled: true,  slots: ["02:00 PM", "03:00 PM", "04:00 PM"] },
  Friday:    { enabled: true,  slots: ["10:00 AM", "05:00 PM", "06:00 PM"] },
  Saturday:  { enabled: false, slots: [] },
  Sunday:    { enabled: false, slots: [] },
};

function SlotPicker({
  day,
  schedule,
  onToggleSlot,
  onClose,
}: {
  day: string;
  schedule: DaySchedule;
  onToggleSlot: (slot: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 lg:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-surface shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-sm">{day} — Time Slots</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">Tap to toggle slots on or off</p>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((slot) => {
              const active = schedule.slots.includes(slot);
              return (
                <button
                  key={slot}
                  onClick={() => onToggleSlot(slot)}
                  className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" /> Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function MentorAvailability() {
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [editDay, setEditDay] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: prev[day].enabled ? [] : prev[day].slots,
      },
    }));
  };

  const toggleSlot = (day: string, slot: string) => {
    setSchedule((prev) => {
      const current = prev[day].slots;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          slots: current.includes(slot)
            ? current.filter((s) => s !== slot)
            : [...current, slot].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b)),
        },
      };
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalSlots = Object.values(schedule).reduce((s, d) => s + d.slots.length, 0);
  const activeDays = Object.values(schedule).filter((d) => d.enabled).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-2xl font-bold">{activeDays}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active days</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-2xl font-bold">{totalSlots}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Open slots</p>
        </div>
      </div>

      <div className="space-y-2">
        {DAYS.map((day) => {
          const d = schedule[day];
          return (
            <div key={day} className={`rounded-xl border bg-surface p-4 transition-all ${d.enabled ? "border-border" : "border-border opacity-50"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`h-6 w-11 rounded-full transition-colors shrink-0 relative ${d.enabled ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${d.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{day}</p>
                    {d.enabled && d.slots.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {d.slots.slice(0, 3).join(" · ")}{d.slots.length > 3 ? ` +${d.slots.length - 3}` : ""}
                      </p>
                    )}
                    {d.enabled && d.slots.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-0.5">No slots added</p>
                    )}
                    {!d.enabled && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">Unavailable</p>
                    )}
                  </div>
                </div>

                {d.enabled && (
                  <button
                    onClick={() => setEditDay(day)}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {d.slots.length > 0 ? "Edit" : "Add"} slots
                  </button>
                )}
              </div>

              {d.enabled && d.slots.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.slots.map((slot) => (
                    <span
                      key={slot}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-semibold text-primary"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Availability</>}
      </button>

      {editDay && (
        <SlotPicker
          day={editDay}
          schedule={schedule[editDay]}
          onToggleSlot={(slot) => toggleSlot(editDay, slot)}
          onClose={() => setEditDay(null)}
        />
      )}
    </div>
  );
}