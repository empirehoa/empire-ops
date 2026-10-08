import Link from 'next/link'
import { requireAdminPage } from '@/lib/auth/admin'
import { AdminNav } from './_components/admin-nav'

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdminPage()
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <Link href="/admin/executive" className="text-base font-medium text-foreground">
            Empire Ops
          </Link>
          <AdminNav />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">{admin.email}</span>
            <form action="/api/auth/sign-out" method="post">
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">{children}</main>
    </div>
  )
}
