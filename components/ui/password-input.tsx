'use client';

import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { cn } from '@/lib/utils';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  wrapperClassName?: string;
};

// Input de contraseña con botón ojo para mostrar/ocultar. Drop-in de <input type="password">
// en login, claim de invitación y reset: deja al usuario verificar lo que tipeó (las
// contraseñas de entrega son largas y fáciles de errar).
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { className, wrapperClassName, ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn('relative', wrapperClassName)}>
      <input
        ref={ref}
        type={show ? 'text' : 'password'}
        className={cn(
          'w-full rounded-lg border border-input bg-white px-3 py-2.5 pr-11 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary',
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
