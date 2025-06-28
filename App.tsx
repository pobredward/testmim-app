import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import i18n from './src/i18n'; // i18n import

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // 카카오 SDK 초기화
      try {
        const { KakaoAuthService } = await import('./src/services/kakaoAuth');
        await KakaoAuthService.initialize();
        console.log('✅ 카카오 SDK 초기화 완료');
      } catch (error) {
        console.warn('⚠️ 카카오 SDK 초기화 실패:', error);
      }

      // i18n이 이미 초기화되었는지 확인
      if (i18n.isInitialized) {
        console.log('✅ i18n already initialized');
        setI18nReady(true);
        return;
      }

      // i18n 초기화 대기
      const checkI18n = () => {
        if (i18n.isInitialized) {
          console.log('✅ i18n initialization completed');
          setI18nReady(true);
        } else {
          console.log('⏳ Waiting for i18n initialization...');
          setTimeout(checkI18n, 100);
        }
      };

      checkI18n();
    };

    initializeApp();
  }, []);

  if (!i18nReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#EC4899" />
          <Text style={{ marginTop: 16, color: '#6B7280' }}>Initializing...</Text>
        </View>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
} 