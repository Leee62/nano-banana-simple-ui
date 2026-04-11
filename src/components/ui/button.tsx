import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'liquid-button inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-semibold tracking-[-0.01em]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/90',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-60'
  ],
  {
    variants: {
      variant: {
        default: 'liquid-button-primary',
        secondary: 'liquid-button-secondary',
        ghost: 'liquid-button-ghost',
        outline: 'liquid-button-outline'
      },
      size: {
        default: 'h-11 px-5 text-sm',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-7 text-base',
        icon: 'h-11 w-11'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);

Button.displayName = 'Button';

export { Button };
