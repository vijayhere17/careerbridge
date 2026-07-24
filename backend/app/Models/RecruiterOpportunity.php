<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecruiterOpportunity extends Model
{
    protected $fillable = [

'user_id',

'opportunity_type',

'title',

'company_name',

'location',

'employment_type',

'experience_level',

'salary_min',

'salary_max',

'application_deadline',

'skills',

'description',

'responsibilities',

'requirements',

'benefits',

'work_mode',

'contact_visibility',

'status',

'views',

'applications_count',

];
}
