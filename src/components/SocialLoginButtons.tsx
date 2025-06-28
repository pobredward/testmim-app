import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { SocialProvider } from '../data/socialAuth';
import { 
  KakaoIcon, 
  GoogleIcon, 
  AppleIcon, 
  NaverIcon, 
  FacebookIcon 
} from './SocialIcons';

interface SocialButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

// 아이콘 렌더러
const renderIcon = (iconType: string, size: number = 20, color?: string) => {
  switch (iconType) {
    case 'kakao':
      return <KakaoIcon width={size} height={size} color={color} />;
    case 'google':
      return <GoogleIcon width={size} height={size} />;
    case 'apple':
      return <AppleIcon width={size} height={size} color={color} />;
    case 'naver':
      return <NaverIcon width={size} height={size} color={color} />;
    case 'facebook':
      return <FacebookIcon width={size} height={size} color={color} />;
    default:
      return null;
  }
};

// 카카오 로그인 버튼 (완성형)
export const KakaoLoginButton: React.FC<SocialButtonProps> = ({ 
  provider, 
  onPress, 
  loading, 
  disabled, 
  style 
}) => (
  <TouchableOpacity
    style={[
      styles.kakaoButton,
      { backgroundColor: provider.backgroundColor },
      disabled && styles.buttonDisabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator size="small" color={provider.textColor} />
    ) : (
      <View style={styles.kakaoButtonContent}>
        {renderIcon(provider.icon, 20, provider.textColor)}
        <Text style={[styles.kakaoButtonText, { color: provider.textColor }]}>
          {provider.label}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// 구글 로그인 버튼 (완성형)
export const GoogleLoginButton: React.FC<SocialButtonProps> = ({ 
  provider, 
  onPress, 
  loading, 
  disabled, 
  style 
}) => (
  <TouchableOpacity
    style={[
      styles.googleButton,
      { 
        backgroundColor: provider.backgroundColor,
        borderColor: provider.borderColor 
      },
      disabled && styles.buttonDisabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator size="small" color={provider.textColor} />
    ) : (
      <View style={styles.googleButtonContent}>
        {renderIcon(provider.icon, 18)}
        <Text style={[styles.googleButtonText, { color: provider.textColor }]}>
          {provider.label}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// 범용 Primary 버튼 (카카오, 구글 외)
export const PrimaryLoginButton: React.FC<SocialButtonProps> = ({ 
  provider, 
  onPress, 
  loading, 
  disabled, 
  style 
}) => (
  <TouchableOpacity
    style={[
      styles.primaryButton,
      { backgroundColor: provider.backgroundColor },
      disabled && styles.buttonDisabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator size="small" color={provider.textColor} />
    ) : (
      <View style={styles.primaryButtonContent}>
        {renderIcon(provider.icon, 20, provider.textColor)}
        <Text style={[styles.primaryButtonText, { color: provider.textColor }]}>
          {provider.label}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// 아이콘형 버튼 (네이버, 페이스북)
export const IconLoginButton: React.FC<SocialButtonProps> = ({ 
  provider, 
  onPress, 
  loading, 
  disabled, 
  style 
}) => (
  <TouchableOpacity
    style={[
      styles.iconButton,
      { backgroundColor: provider.backgroundColor },
      disabled && styles.buttonDisabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator size="small" color={provider.textColor} />
    ) : (
      renderIcon(provider.icon, 24, provider.textColor)
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  // 카카오 버튼 스타일 (공식 가이드라인)
  kakaoButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  kakaoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // 구글 버튼 스타일 (공식 가이드라인)
  googleButton: {
    height: 48,
    borderRadius: 4, // 구글 가이드라인에 따른 작은 radius
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },

  // 범용 Primary 버튼
  primaryButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // 아이콘형 버튼
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  // 공통 스타일
  buttonDisabled: {
    opacity: 0.6,
  },
}); 