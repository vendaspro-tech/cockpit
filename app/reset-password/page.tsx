import { ResetPasswordForm } from "@/components/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md p-6">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A08D5A] to-[#7a6b43] flex items-center justify-center text-white">
              C
            </div>
            Cockpit Comercial
          </div>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
