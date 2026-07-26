<?php

namespace App\Http\Controllers\Api\Admin;

use App\Services\AdminRecruiterService;
use Illuminate\Http\Request;

class AdminDashboardController extends AdminBaseController
{
    public function __construct(private AdminRecruiterService $recruiters)
    {
    }

    public function index(Request $request)
    {
        [$admin, $error] = $this->adminUser($request);
        if ($error) {
            return $error;
        }

        return $this->success(
            $this->recruiters->dashboardStats(),
            'Admin dashboard statistics retrieved successfully.'
        );
    }
}
