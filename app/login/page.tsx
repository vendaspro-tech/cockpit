import { GalleryVerticalEnd } from "lucide-react"
import Link from "next/link" // Added import for Link

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md p-6">
        <div className="flex justify-center mb-8">
          {/* Wrapped the logo content in a Link component */}
          <Link href="/" className="relative z-20 flex items-center text-lg font-medium gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#A08D5A] to-[#7a6b43]">
              <span className="font-bold text-white">C</span>
            </div>
            Cockpit Comercial
          </Link>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
