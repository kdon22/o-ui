import React from 'react';
import { RadioGroup, RadioGroupItem, Label } from '@/components/ui';
import { cn } from '@/lib/utils/generalUtils';

interface RadioOption {
  value: string;
  label: string;
}

export interface RadioProps {
  id: string;
  value?: string;
  onChange: (value: string) => void;
  options?: RadioOption[];
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32
};

const getFlexDirection = (position: 'top' | 'bottom' | 'left' | 'right') => {
  switch (position) {
    case 'top': return 'flex-col';
    case 'bottom': return 'flex-col-reverse';
    case 'left': return 'flex-row';
    case 'right': return 'flex-row-reverse';
    default: return 'flex-row';
  }
};

export function Radio({ 
  id, 
  value,
  onChange,
  options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ],
  disabled = false,
  className,
  style,
  size = 'md',
  labelPosition = 'right'
}: RadioProps) {
  const itemSize = sizeMap[size];
  const flexDirection = getFlexDirection(labelPosition);
  const isVertical = labelPosition === 'top' || labelPosition === 'bottom';

  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className={cn('space-y-2', className)}
      disabled={disabled}
    >
      <div className={cn(
        'flex gap-4',
        isVertical ? 'flex-col' : 'flex-row'
      )}>
        {options.map((option) => (
          <div
            key={option.value}
            className={cn(
              'flex items-center gap-2',
              flexDirection
            )}
          >
            <RadioGroupItem 
              value={option.value}
              id={`${id}-${option.value}`}
              className={cn(
                'peer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                borderColor: style?.color || '#000000',
                width: `${itemSize}px`,
                height: `${itemSize}px`,
                ...style
              }}
            />
            <Label 
              htmlFor={`${id}-${option.value}`}
              className={cn(
                'text-sm cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}

export default Radio; 