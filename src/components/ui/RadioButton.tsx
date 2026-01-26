import { View, TouchableOpacity, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

interface RadioButtonOption {
  label: string;
  value: string;
}

interface RadioButtonGroupProps {
  label?: string;
  value: string;
  options: RadioButtonOption[];
  onValueChange: (value: string) => void;
  containerClassName?: string;
}

export function RadioButtonGroup({
  label,
  value,
  options,
  onValueChange,
  containerClassName = '',
}: RadioButtonGroupProps) {
  return (
    <StyledView className={`w-full my-5 ${containerClassName}`}>
      {label && <StyledText className="text-sm font-medium text-gray-700 mb-1.5">{label}</StyledText>}
      <StyledView className="flex-row gap-6">
        {options.map((option) => (
          <StyledTouchableOpacity
            key={option.value}
            onPress={() => onValueChange(option.value)}
            className="flex-row items-center"
          >
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
              value === option.value ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
            }`}>
              {value === option.value && (
                <View className="w-2 h-2 bg-white rounded-full" />
              )}
            </View>
            <StyledText className="text-base text-gray-900 ml-3">{option.label}</StyledText>
          </StyledTouchableOpacity>
        ))}
      </StyledView>
    </StyledView>
  );
}
