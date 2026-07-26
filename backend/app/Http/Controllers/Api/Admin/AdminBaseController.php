<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Roles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBaseController extends Controller
{
    protected function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        return $token ? User::where('api_token', $token)->first() : null;
    }

    /**
     * @return array{0: ?User, 1: ?JsonResponse}
     */
    protected function adminUser(Request $request): array
    {
        $user = $this->authUser($request);

        if (! $user) {
            return [null, $this->unauthorized()];
        }

        if ($user->role !== Roles::ADMIN) {
            return [null, $this->forbidden('Admin access required.')];
        }

        return [$user, null];
    }

    protected function unauthorized(string $message = 'Unauthorized.'): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], 401);
    }

    protected function forbidden(string $message = 'Forbidden.'): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], 403);
    }

    protected function notFound(string $message = 'Not found.'): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], 404);
    }

    protected function success(mixed $data = null, string $message = 'OK', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function validationError(mixed $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed.',
            'errors' => $errors,
        ], 422);
    }
}
