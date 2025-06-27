import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { getPrimaryProviders, getSecondaryProviders, SocialProvider } from '../data/socialAuth';
import { SocialAuthService, AuthUser } from '../services/socialAuth';
import AppleSignInButton from '../components/AppleSignInButton';
import * as AppleAuthentication from 'expo-apple-authentication';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  TestDetail: { testCode: string };
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  onLoginSuccess?: (user: AuthUser) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);

  const primaryProviders = getPrimaryProviders();
  const secondaryProviders = getSecondaryProviders();

  // Apple 로그인 가능 여부 확인
  React.useEffect(() => {
    const checkAppleSignInAvailability = async () => {
      if (Platform.OS === 'ios') {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setAppleSignInAvailable(isAvailable);
      }
    };
    
    checkAppleSignInAvailability();
  }, []);

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setLoading(provider.key);
      console.log('🔐 소셜 로그인 시도:', provider.key);

      const user = await SocialAuthService.signInWithProvider(provider.key);
      
      if (user) {
        Alert.alert(
          t('login.loginSuccess'),
          `${user.displayName || user.email}${t('login.welcomeUser')}`,
          [
            {
              text: t('login.ok'),
              onPress: () => {
                onLoginSuccess?.(user);
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('로그인 처리 오류:', error);
      Alert.alert(t('login.error'), t('login.loginError'));
    } finally {
      setLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading('apple');
      console.log('🍎 Apple 로그인 시도');

      const user = await SocialAuthService.signInWithApple();
      
      if (user) {
        Alert.alert(
          t('login.loginSuccess'),
          `${user.displayName || user.email}${t('login.welcomeUser')}`,
          [
            {
              text: t('login.ok'),
              onPress: () => {
                onLoginSuccess?.(user);
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Apple 로그인 처리 오류:', error);
      Alert.alert(t('login.error'), t('login.appleLoginError'));
    } finally {
      setLoading(null);
    }
  };

  const renderPrimaryButton = (provider: SocialProvider) => (
    <TouchableOpacity
      key={provider.key}
      style={[
        styles.primaryButton,
        { backgroundColor: provider.backgroundColor },
        loading === provider.key && styles.buttonDisabled,
      ]}
      onPress={() => handleSocialLogin(provider)}
      disabled={loading !== null}
      activeOpacity={0.8}
    >
      {loading === provider.key ? (
        <ActivityIndicator 
          size="small" 
          color={provider.textColor} 
          style={styles.buttonLoader}
        />
      ) : (
        <>
          <Text style={[styles.buttonIcon, { color: provider.textColor }]}>
            {provider.icon}
          </Text>
          <Text style={[styles.buttonText, { color: provider.textColor }]}>
            {provider.label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );

  const renderSecondaryButton = (provider: SocialProvider) => (
    <TouchableOpacity
      key={provider.key}
      style={[
        styles.secondaryButton,
        loading === provider.key && styles.buttonDisabled,
      ]}
      onPress={() => handleSocialLogin(provider)}
      disabled={loading !== null}
      activeOpacity={0.8}
    >
      {loading === provider.key ? (
        <ActivityIndicator size="small" color="#666" />
      ) : (
        <Text style={styles.secondaryIcon}>{provider.icon}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← {t('login.back')}</Text>
          </TouchableOpacity>
        </View>

        {/* 타이틀 */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>
            {t('login.subtitle')}
          </Text>
        </View>

        {/* Apple 로그인 버튼 (iOS 전용) */}
        {appleSignInAvailable && (
          <View style={styles.appleButtonContainer}>
            <AppleSignInButton 
              onPress={handleAppleLogin}
              style={[
                styles.appleButton,
                loading === 'apple' && styles.buttonDisabled,
              ]}
            />
            {loading === 'apple' && (
              <View style={styles.appleButtonOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>
        )}

        {/* 주요 소셜 로그인 버튼들 */}
        <View style={styles.primaryButtonsContainer}>
          {primaryProviders.map(renderPrimaryButton)}
        </View>

        {/* 구분선 */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('login.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 보조 소셜 로그인 아이콘들 */}
        <View style={styles.secondaryButtonsContainer}>
          {secondaryProviders.map(renderSecondaryButton)}
        </View>

        {/* 개인정보 안내 */}
        <View style={styles.privacyContainer}>
          <Text style={styles.privacyText}>
            {t('login.privacyNotice').split(t('login.privacyBold')).map((part, index) => (
              index === 1 ? (
                <Text key={index} style={styles.privacyBold}>{t('login.privacyBold')}</Text>
              ) : (
                part
              )
            ))}
          </Text>
        </View>

        {/* 테스트밈 로고 */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🧠 TestMim</Text>
          <Text style={styles.logoSubtext}>심리테스트의 모든 것</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  appleButtonContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  appleButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
  },
  appleButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonsContainer: {
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
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
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLoader: {
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryIcon: {
    fontSize: 24,
  },
  privacyContainer: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  privacyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  privacyBold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  logoContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logoSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
}); 