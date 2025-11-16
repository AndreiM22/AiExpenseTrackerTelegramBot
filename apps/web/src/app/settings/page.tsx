import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Settings - Expense Tracker",
  description: "Manage your account settings and preferences",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p className="mt-1 text-lg">{session.user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <p className="mt-1 text-lg">{session.user.name || "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Telegram Integration</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your Telegram account to add expenses via chat bot.
        </p>
        <div className="rounded-md bg-muted p-4">
          <p className="text-sm">
            🤖 Telegram bot integration is enabled. Send messages to your bot to
            track expenses.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Data & Privacy</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Your data is stored securely and is never shared with third parties.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2">
            <span>AI-powered expense parsing</span>
            <span className="text-green-600 font-medium">Enabled</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Voice message transcription</span>
            <span className="text-green-600 font-medium">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
