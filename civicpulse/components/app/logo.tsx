import Link from 'next/link'
import { brand } from '@/lib/brand'
import { cn } from '@/lib/utils'

export function Logo({ href = '/', className, light = false }: { href?: string; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span
        aria-hidden
        className={cn(
          'grid size-8 place-items-center rounded-xl text-sm font-bold',
          light ? 'bg-white text-brand' : 'bg-brand text-white',
        )}
      >
        {brand.name.charAt(0)}
      </span>
      <span className={cn('text-lg', light ? 'text-white' : 'text-text')}>{brand.name}</span>
    </Link>
  )
}
