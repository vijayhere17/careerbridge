<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedMentor extends Model
{
    use HasFactory;

    protected $fillable = ['candidate_id', 'mentor_id'];

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_id');
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(MentorProfile::class, 'mentor_id');
    }
}
