import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

interface AppleSignInButtonProps {
  onPress: () => void;
  style?: any;
}

export default function AppleSignInButton({ onPress, style }: AppleSignInButtonProps) {
  // iOS가 아니거나 Apple 로그인이 지원되지 않는 환경에서는 null 반환
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={[styles.button, style]}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
  },
}); 