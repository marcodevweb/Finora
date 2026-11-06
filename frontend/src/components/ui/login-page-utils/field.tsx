import React from 'react';
import { cn } from '@/lib/utils';

export function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2', className)} {...props} />;
}

export function FieldGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-4', className)} {...props} />;
}

export function FieldLabel({ className, htmlFor, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label htmlFor={htmlFor} className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-polysans', className)} {...props} />;
}

export function FieldDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground font-inter', className)} {...props} />;
}

export function FieldSeparator({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative flex py-2 items-center', className)} {...props}>
      <div className="flex-grow border-t border-border"></div>
      {children && <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase tracking-wider font-polysans">{children}</span>}
      <div className="flex-grow border-t border-border"></div>
    </div>
  );
}
