import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('liquid-panel rounded-[30px]', className)} {...props} />
  )
);

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('relative z-10 p-6 pt-0', className)} {...props} />
  )
);

Card.displayName = 'Card';
CardContent.displayName = 'CardContent';

export { Card, CardContent };
