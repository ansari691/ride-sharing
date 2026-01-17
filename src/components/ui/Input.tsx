import { TextInput, TextInputProps, View, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledTextInput = styled(TextInput);
const StyledView = styled(View);
const StyledText = styled(Text);

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({ label, error, className, containerClassName, ...props }: InputProps) {
  return (
    <StyledView className={`w-full space-y-2 ${containerClassName}`}>
      {label && <StyledText className="text-sm font-medium text-gray-700">{label}</StyledText>}
      <StyledTextInput 
        className={`w-full p-3 border border-gray-300 rounded-md bg-white ${className}`}
        placeholderTextColor="#9CA3AF"
        {...props} 
      />
      {error && <StyledText className="text-sm text-red-500">{error}</StyledText>}
    </StyledView>
  );
}
