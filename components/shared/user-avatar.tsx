import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

/**
 * Extract initials from a name string.
 * 
 * @example
 * getInitials("João Silva") // "JS"
 * getInitials("Maria", 1) // "M"
 */
export function getInitials(name: string, maxChars: number = 2): string {
  if (!name) return ''
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, maxChars)
}

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const fallbackColors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400',
  'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
]

function getColorFromName(name: string): string {
  if (!name) return fallbackColors[0]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return fallbackColors[hash % fallbackColors.length]
}

interface UserAvatarProps {
  name?: string | null
  imageUrl?: string | null
  size?: AvatarSize
  className?: string
  fallbackClassName?: string
}

/**
 * Reusable user avatar component with automatic initials fallback.
 * 
 * @example
 * ```tsx
 * <UserAvatar name="João Silva" size="md" />
 * <UserAvatar name="Maria" imageUrl="/avatars/maria.jpg" size="lg" />
 * ```
 */
export function UserAvatar({ 
  name, 
  imageUrl, 
  size = 'md',
  className,
  fallbackClassName
}: UserAvatarProps) {
  const initials = name ? getInitials(name) : '?'
  const colorClass = name ? getColorFromName(name) : fallbackColors[0]

  return (
    <Avatar className={cn(sizeClasses[size], 'border border-border', className)}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name || 'User'} />}
      <AvatarFallback className={cn(colorClass, 'font-medium', fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
