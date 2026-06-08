<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RlsIsolationTest extends TestCase
{
    public function test_cross_tenant_read_returns_zero_rows(): void
    {
        $orgA = DB::table('vera_core.management_organizations')->insertGetId(['name' => 'Org A']);
        $orgB = DB::table('vera_core.management_organizations')->insertGetId(['name' => 'Org B']);

        DB::table('vera_core.associations')->insert([
            'organization_id' => $orgA,
            'name' => 'Lakeview HOA',
            'association_type' => 'hoa',
            'status' => 'active',
        ]);

        DB::beginTransaction();
        DB::statement('SET LOCAL app.current_organization_id = ?', [$orgB]);
        $rows = DB::table('vera_core.associations')->get();
        DB::rollBack();

        $this->assertCount(0, $rows);
    }

    public function test_no_context_read_returns_zero_rows(): void
    {
        $rows = DB::table('vera_core.associations')->get();
        $this->assertCount(0, $rows);
    }

    public function test_invitation_isolation_blocks_cross_tenant_visibility(): void
    {
        $orgA = DB::table('vera_core.management_organizations')->insertGetId(['name' => 'Org A']);
        $orgB = DB::table('vera_core.management_organizations')->insertGetId(['name' => 'Org B']);

        DB::table('vera_core.user_invitations')->insert([
            'organization_id' => $orgA,
            'email' => 'invitee@example.com',
            'invitation_token' => 'token-123',
            'role' => 'manager',
            'expires_at' => now()->addDay(),
        ]);

        DB::beginTransaction();
        DB::statement('SET LOCAL app.current_organization_id = ?', [$orgB]);
        $rows = DB::table('vera_core.user_invitations')->get();
        DB::rollBack();

        $this->assertCount(0, $rows);
    }
}
