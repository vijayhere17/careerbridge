<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMentorBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mentor_id' => ['required', 'exists:mentor_profiles,id'],
            'service_id' => ['required', 'exists:mentor_services,id'],
            'date' => ['required', 'date'],
            'time' => ['required', 'string', 'max:50'],
            'requirements' => ['nullable', 'string', 'max:1000'],
            'amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
