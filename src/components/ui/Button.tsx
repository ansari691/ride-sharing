import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { styled } from 'nativewind';

const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  className?: string;
  textClassName?: string;
}

export function Button({ title, variant = 'primary', className, textClassName, ...props }: ButtonProps) {
  let bgClass = 'bg-blue-600';
  let textColor = 'text-white';

  if (variant === 'secondary') {
    bgClass = 'bg-gray-200';
    textColor = 'text-gray-900';
  } else if (variant === 'outline') {
    bgClass = 'bg-white border border-gray-300';
    textColor = 'text-gray-900';
  } else if (variant === 'ghost') {
    bgClass = 'bg-transparent';
    textColor = 'text-gray-900';
  } else if (variant === 'destructive') {
    bgClass = 'bg-red-600';
    textColor = 'text-white';
  }

  return (
    <StyledTouchableOpacity 
      className={`p-3 rounded-md items-center justify-center ${bgClass} ${className}`} 
      {...props}
    >
      <StyledText className={`font-medium ${textColor} ${textClassName}`}>
        {title}
      </StyledText>
    </StyledTouchableOpacity>
  );
}
