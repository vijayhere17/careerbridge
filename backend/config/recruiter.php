<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Admin approval for recruiters
    |--------------------------------------------------------------------------
    |
    | When enabled, opportunity providers must be approved by an admin before
    | they can access the recruiter dashboard or post opportunities.
    |
    */
    'require_admin_approval' => (bool) env('RECRUITER_REQUIRE_ADMIN_APPROVAL', true),

    /*
    |--------------------------------------------------------------------------
    | Recruiter types
    |--------------------------------------------------------------------------
    */
    'types' => [
        'company_recruiter',
        'hr_agency',
        'startup',
        'consultancy',
        'individual_recruiter',
    ],

];
