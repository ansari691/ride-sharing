import { View, ViewProps, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export function Card({ className, children, ...props }: ViewProps) {
  return (
    <StyledView className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`} {...props}>
      {children}
    </StyledView>
  );
}

export function CardHeader({ className, children, ...props }: ViewProps) {
  return (
    <StyledView className={`p-6 flex-col space-y-1.5 ${className}`} {...props}>
      {children}
    </StyledView>
  );
}

export function CardTitle({ className, children, ...props }: ViewProps & { children: React.ReactNode }) {
  return (
      <StyledText className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
        {children}
      </StyledText>
  );
}

export function CardContent({ className, children, ...props }: ViewProps) {
  return (
    <StyledView className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </StyledView>
  );
}
