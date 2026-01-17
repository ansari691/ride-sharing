import { View, ViewProps, SafeAreaView, Platform, StatusBar } from 'react-native';
import { styled } from 'nativewind';

const StyledSafeAreaView = styled(SafeAreaView);
const StyledView = styled(View);

export function Container({ className, children, ...props }: ViewProps) {
  return (
    <StyledSafeAreaView className={`flex-1 bg-gray-50 ${className}`} style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }} {...props}>
      <StyledView className="flex-1 p-4">
        {children}
      </StyledView>
    </StyledSafeAreaView>
  );
}
