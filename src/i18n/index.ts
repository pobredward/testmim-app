import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// 언어 리소스 import
import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';

console.log('🌍 i18n 리소스 로드됨:', {
  ko: Object.keys(ko).length,
  en: Object.keys(en).length,
  ja: Object.keys(ja).length,
  zh: Object.keys(zh).length
});

const resources = {
  ko: { translation: ko },
  en: { translation: en },
  ja: { translation: ja },
  zh: { translation: zh },
};

// 기본 언어 설정 (한국어)
const DEFAULT_LANGUAGE = 'ko';

// 사용자 언어 감지
const getLanguage = async () => {
  try {
    // AsyncStorage에서 저장된 언어 확인
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage && resources[savedLanguage as keyof typeof resources]) {
      console.log('🌍 저장된 언어 사용:', savedLanguage);
      return savedLanguage;
    }
    
    // 디바이스 언어 확인
    const deviceLanguage = Localization.locale.split('-')[0];
    if (resources[deviceLanguage as keyof typeof resources]) {
      console.log('🌍 디바이스 언어 사용:', deviceLanguage);
      return deviceLanguage;
    }
    
    // 기본 언어 반환
    console.log('🌍 기본 언어 사용:', DEFAULT_LANGUAGE);
    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('언어 감지 오류:', error);
    return DEFAULT_LANGUAGE;
  }
};

// i18n 초기화
const initI18n = async () => {
  const language = await getLanguage();
  
  console.log('🌍 i18n 초기화:', language);
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: DEFAULT_LANGUAGE,
      debug: __DEV__, // 개발 모드에서만 디버그
      
      interpolation: {
        escapeValue: false, // React에서는 이미 XSS 보호가 됨
      },
      
      react: {
        useSuspense: false, // React Native에서는 Suspense 사용 안 함
      },
    });
    
  console.log('✅ i18n 초기화 완료:', i18n.language);
  console.log('📚 로드된 키들:', Object.keys(i18n.getDataByLanguage(language)?.translation || {}));
};

// 앱 시작 시 i18n 초기화
initI18n().catch(error => {
  console.error('❌ i18n 초기화 실패:', error);
});

export default i18n; 