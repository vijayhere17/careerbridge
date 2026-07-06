<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorSkill extends Model
{
    use HasFactory;

    protected $fillable = ['mentor_id', 'skill'];

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(MentorProfile::class, 'mentor_id');
    }
}
