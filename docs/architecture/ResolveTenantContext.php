<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->organization_id) {
            abort(response()->json([
                'message' => 'User is not provisioned in Vera.',
                'code' => 'USER_NOT_PROVISIONED',
                'correlationId' => $request->headers->get('X-Request-ID', (string) str()->uuid()),
                'errors' => [],
            ], 401));
        }

        DB::beginTransaction();

        try {
            DB::statement(
                'SET LOCAL app.current_organization_id = ?',
                [$user->organization_id]
            );

            $response = $next($request);
            DB::commit();

            return $response;
        } catch (\Throwable $exception) {
            DB::rollBack();
            throw $exception;
        }
    }
}
