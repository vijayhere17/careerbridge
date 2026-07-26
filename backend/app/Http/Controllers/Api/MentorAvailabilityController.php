<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MentorAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MentorAvailabilityController extends Controller
{
    private const DAYS = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
    ];

    private function authUser(Request $request): ?User
    {
        $token = $request->bearerToken()
            ?: $request->header('X-API-TOKEN');

        return $token
            ? User::where('api_token', $token)->first()
            : null;
    }

    public function show(Request $request)
    {
        $user = $this->authUser($request);

        if (! $user || ! $user->mentorProfile) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $rows = MentorAvailability::where('mentor_id', $user->mentorProfile->id)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        $schedule = [];

        foreach (self::DAYS as $index => $day) {
            $dayRows = $rows->where('day_of_week', $index);
            $enabled = $dayRows->contains(fn ($row) => (bool) $row->is_available);
            $slots = $dayRows
                ->filter(fn ($row) => (bool) $row->is_available)
                ->map(fn ($row) => $this->toDisplayTime($row->start_time))
                ->unique()
                ->values()
                ->all();

            $schedule[$day] = [
                'enabled' => $enabled,
                'slots' => $slots,
            ];
        }

        return response()->json([
            'schedule' => $schedule,
            'timezone' => $user->timezone ?? 'Asia/Kolkata',
        ]);
    }

    public function update(Request $request)
    {
        $user = $this->authUser($request);

        if (! $user || ! $user->mentorProfile) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'schedule' => 'required|array',
            'schedule.*.enabled' => 'required|boolean',
            'schedule.*.slots' => 'nullable|array',
            'schedule.*.slots.*' => 'string|max:20',
        ]);

        $mentorId = $user->mentorProfile->id;

        DB::transaction(function () use ($validated, $mentorId) {
            MentorAvailability::where('mentor_id', $mentorId)->delete();

            foreach (self::DAYS as $index => $day) {
                $daySchedule = $validated['schedule'][$day] ?? null;

                if (! $daySchedule) {
                    continue;
                }

                $enabled = (bool) ($daySchedule['enabled'] ?? false);
                $slots = array_values(array_unique($daySchedule['slots'] ?? []));

                if (! $enabled || empty($slots)) {
                    continue;
                }

                foreach ($slots as $slot) {
                    $start = $this->toDbTime($slot);
                    if (! $start) {
                        continue;
                    }

                    $end = Carbon::createFromFormat('H:i:s', $start)
                        ->addHour()
                        ->format('H:i:s');

                    MentorAvailability::create([
                        'mentor_id' => $mentorId,
                        'day_of_week' => $index,
                        'start_time' => $start,
                        'end_time' => $end,
                        'is_available' => true,
                    ]);
                }
            }
        });

        return $this->show($request);
    }

    private function toDisplayTime(mixed $time): string
    {
        try {
            return Carbon::parse($time)->format('h:i A');
        } catch (\Throwable) {
            return (string) $time;
        }
    }

    private function toDbTime(string $slot): ?string
    {
        try {
            return Carbon::parse($slot)->format('H:i:s');
        } catch (\Throwable) {
            return null;
        }
    }
}
