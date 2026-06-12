import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function Select({ value, options, onChange, placeholder = '请选择', className = '', size = 'md' }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);
  const padding = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between gap-2 bg-bg-secondary border border-border-primary rounded-md text-text-primary transition-colors focus:outline-none focus:border-accent-primary',
          padding,
          open && 'border-accent-primary'
        )}
      >
        <span className={selected ? 'text-text-primary' : 'text-text-muted'}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-bg-card border border-border-primary rounded-md shadow-card py-1 max-h-60 overflow-y-auto animate-fade-in">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onChange?.(option.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors',
                value === option.value
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-text-primary hover:bg-bg-hover'
              )}
            >
              {option.label}
              {value === option.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
