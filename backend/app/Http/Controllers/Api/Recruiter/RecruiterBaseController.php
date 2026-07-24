<?php

namespace App\Http\Controllers\Api\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class RecruiterBaseController extends Controller
{
    protected function authUser(Request $request): ?User
    {
        $token = $request->bearerToken() ?: $request->header('X-API-TOKEN');

        return $token ? User::where('api_token', $token)->first() : null;
    }

    protected function ensureRecruiterAccess(User $user): bool
    {
        return in_array($user->role, ['opportunity_provider', 'admin', 'hr'], true);
    }

    protected function recruiterUser(Request $request): array
    {
        $user = $this->authUser($request);

        if (!$user) {
            return [null, $this->unauthorized()];
        }

        if (!$this->ensureRecruiterAccess($user)) {
            return [null, $this->forbidden('Recruiter access required.')];
        }

        return [$user, null];
    }

    protected function unauthorized(): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
    }

    protected function forbidden(string $message = 'Forbidden.'): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], 403);
    }

    protected function notFound(string $message = 'Not found.'): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], 404);
    }

    protected function success(mixed $data = null, string $message = 'OK', int $status = 200, array $extra = []): JsonResponse
    {
        return response()->json(array_merge([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $extra), $status);
    }

    protected function validationError(mixed $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed.',
            'errors' => $errors,
        ], 422);
    }

    protected function mediaUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return str_starts_with($path, 'http')
            ? $path
            : asset('storage/' . ltrim($path, '/'));
    }
}
