<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\DB;

class TenantContext
{
    public static function set(string $organizationId): void
    {
        DB::statement('SET LOCAL app.current_organization_id = ?', [$organizationId]);
    }

    public static function runAs(string $organizationId, Closure $callback): mixed
    {
        return DB::transaction(function () use ($organizationId, $callback) {
            static::set($organizationId);
            return $callback();
        });
    }

    public static function withoutTenant(Closure $callback): mixed
    {
        return DB::transaction(function () use ($callback) {
            DB::statement('SET LOCAL row_security = off');
            return $callback();
        });
    }
}
