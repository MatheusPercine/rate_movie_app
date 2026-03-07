import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        'outline-premium':
          'border-2 border-slate-300 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-slate-400 transition-all duration-200 text-slate-700 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500',
        'outline-corporate':
          'border-2 border-slate-300 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-slate-50 hover:border-blue-400 shadow-sm text-slate-700 hover:text-blue-700 transition-all duration-300 dark:bg-slate-900 dark:border-slate-600 dark:hover:from-blue-950 dark:hover:to-slate-900',
        'outline-elevated':
          'border border-slate-200 bg-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:shadow-slate-800/50',
        'outline-accent':
          'border-2 border-slate-300 bg-white hover:border-[#43B9EB] hover:shadow-[0_0_0_3px_rgba(67,185,235,0.1)] transition-all duration-300 text-slate-700 hover:text-[#43B9EB] dark:bg-slate-900 dark:border-slate-600 dark:hover:shadow-[0_0_0_3px_rgba(67,185,235,0.2)]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        success:
          'bg-green-600 text-white shadow-xs hover:bg-green-700 focus-visible:ring-green-600/20 dark:focus-visible:ring-green-400/40',
        warning:
          'bg-yellow-500 text-white shadow-xs hover:bg-yellow-600 focus-visible:ring-yellow-500/20 dark:focus-visible:ring-yellow-400/40',
        info: 'bg-blue-600 text-white shadow-xs hover:bg-blue-700 focus-visible:ring-blue-600/20 dark:focus-visible:ring-blue-400/40',
        neutral:
          'bg-gray-600 text-white shadow-xs hover:bg-gray-700 focus-visible:ring-gray-600/20 dark:focus-visible:ring-gray-400/40',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
