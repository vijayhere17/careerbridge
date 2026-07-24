<?php

namespace App\Http\Controllers\Api\Mentor;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MentorSecurityController extends Controller
{
    private function authUser(Request $request)
    {
        $token = $request->bearerToken()
            ?: $request->header('X-API-TOKEN');

        return User::where('api_token', $token)->first();
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $this->authUser($request);

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        if (!Hash::check($request->current_password, $user->password)) {

            return response()->json([
                'message' => 'Current password is incorrect.'
            ], 422);

        }

        $user->password = Hash::make($request->password);

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.'
        ]);
    }
}