"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    toast.success("Signed out");
    router.push("/login");
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your account and preferences."
      />

      <div className="space-y-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profile</CardTitle>
              <p className="text-sm text-[color:var(--color-fg-subtle)] mt-0.5">
                How you show up in Dayframe.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] flex items-center justify-center text-base font-semibold">
                {user?.username.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-[color:var(--color-fg-subtle)] font-mono">
                  {user?.id}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Preferences</CardTitle>
              <p className="text-sm text-[color:var(--color-fg-subtle)] mt-0.5">
                More settings coming soon.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="text-sm text-[color:var(--color-fg-subtle)]">
              Timezone, notifications, and data export will live here.
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Session</CardTitle>
              <p className="text-sm text-[color:var(--color-fg-subtle)] mt-0.5">
                Sign out of this browser.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <Button variant="danger" onClick={handleLogout}>
              <LogOut size={16} />
              Sign out
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
