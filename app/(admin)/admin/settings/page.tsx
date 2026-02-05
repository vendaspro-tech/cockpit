import { getAuthUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { AccountSettings } from "@/components/settings/account-settings"

export default async function AdminSettingsPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const userData = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || '',
    avatarUrl: user.user_metadata?.avatar_url || '',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Minha Conta</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie suas informações pessoais e preferências.
        </p>
      </div>
      <AccountSettings userData={userData} role="system_owner" />
    </div>
  )
}
