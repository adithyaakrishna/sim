'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/core/utils/cn'

/**
 * Tooltip provider component that must wrap your app or tooltip usage area.
 */
const Provider = ({
  delayDuration = 400,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
)

/**
 * Root tooltip component that wraps trigger and content.
 */
const Root = TooltipPrimitive.Root

/**
 * Trigger element that activates the tooltip on hover.
 */
const Trigger = TooltipPrimitive.Trigger

/**
 * Tooltip content component with consistent styling.
 *
 * @example
 * ```tsx
 * <Tooltip.Root>
 *   <Tooltip.Trigger asChild>
 *     <Button>Hover me</Button>
 *   </Tooltip.Trigger>
 *   <Tooltip.Content>
 *     <p>Tooltip text</p>
 *   </Tooltip.Content>
 * </Tooltip.Root>
 * ```
 */
const Content = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={8}
      avoidCollisions={true}
      className={cn(
        'z-[var(--z-tooltip)] rounded-sm bg-[var(--bg)] px-2 py-[3.5px] font-base text-white text-xs shadow-sm dark:bg-[#fdfdfd] dark:text-black',
        className
      )}
      {...props}
    >
      {props.children}
      <TooltipPrimitive.Arrow className='fill-[var(--bg)] dark:fill-[#fdfdfd]' />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
Content.displayName = TooltipPrimitive.Content.displayName

interface ShortcutProps {
  /** The keyboard shortcut keys to display (e.g., "⌘D", "⌘K") */
  keys: string
  /** Optional additional class names */
  className?: string
  /** Optional children to display before the shortcut */
  children?: React.ReactNode
}

/**
 * Displays a keyboard shortcut within tooltip content.
 *
 * @example
 * ```tsx
 * <Tooltip.Content>
 *   <Tooltip.Shortcut keys="⌘D">Clear console</Tooltip.Shortcut>
 * </Tooltip.Content>
 * ```
 */
const Shortcut = ({ keys, className, children }: ShortcutProps) => (
  <span className={cn('flex items-center gap-2', className)}>
    {children && <span>{children}</span>}
    <span className='opacity-70'>{keys}</span>
  </span>
)
Shortcut.displayName = 'Tooltip.Shortcut'

export const Tooltip = {
  Root,
  Trigger,
  Content,
  Provider,
  Shortcut,
}
