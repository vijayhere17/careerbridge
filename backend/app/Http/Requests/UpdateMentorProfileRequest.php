<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMentorProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
{
    return [

        /*
        |--------------------------------------------------------------------------
        | General
        |--------------------------------------------------------------------------
        */

        'name' => 'required|string|max:100',

        'last_name' => 'nullable|string|max:100',

        'mobile' => 'nullable|string|max:20',

        'location' => 'nullable|string|max:255',

        'bio' => 'nullable|string|max:2000',

        'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

        /*
        |--------------------------------------------------------------------------
        | Professional
        |--------------------------------------------------------------------------
        */

        'company' => 'nullable|string|max:255',

        'designation' => 'nullable|string|max:255',

        'industry' => 'nullable|string|max:255',

        'experience' => 'nullable|string|max:100',

        'linkedin_url' => 'nullable|url|max:255',

        'portfolio_url' => 'nullable|url|max:255',

        'professional_summary' => 'nullable|string|max:5000',

        'resume' => 'nullable|file|mimes:pdf,doc,docx|max:5120',

        'skills' => 'nullable|array',

        'skills.*' => 'string|max:100',

        'languages' => 'nullable|array',

        'languages.*' => 'string|max:100',

        'account_holder' => 'nullable|string|max:255',

'bank_name' => 'nullable|string|max:255',

'account_number' => 'nullable|string|max:100',

'ifsc_code' => 'nullable|string|max:50',

'upi_id' => 'nullable|string|max:255',

    ];
}
}