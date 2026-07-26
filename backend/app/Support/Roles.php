<?php

namespace App\Support;

class Roles
{
    public const SEEKER = 'seeker';

    public const MENTOR = 'mentor';

    public const RECRUITER = 'opportunity_provider';

    public const ADMIN = 'admin';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [
            self::SEEKER,
            self::MENTOR,
            self::RECRUITER,
            self::ADMIN,
        ];
    }

    /**
     * Roles users may self-select during onboarding.
     *
     * @return list<string>
     */
    public static function selectable(): array
    {
        return [
            self::SEEKER,
            self::MENTOR,
            self::RECRUITER,
        ];
    }

    public static function validationRule(bool $includeAdmin = false): string
    {
        $roles = $includeAdmin ? self::all() : self::selectable();

        return 'in:' . implode(',', $roles);
    }
}
