import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
// Firebase Auth는 현재 사용하지 않음 (Expo Go 호환성 문제)
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
}

// WebBrowser 설정
WebBrowser.maybeCompleteAuthSession();

// 소셜 로그인 설정
const SOCIAL_CONFIG = {
  google: {
    androidClientId: '274479977819-2kh57ilqe4b6j6o4sr8k3b1uo9p3m8uv.apps.googleusercontent.com',
    iosClientId: '274479977819-at0648mvfv01g3saod74t4c6chgqdv9c.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID_HERE',
    scopes: ['openid', 'profile', 'email'],
  },
  naver: {
    clientId: 'YOUR_NAVER_CLIENT_ID',
    clientSecret: 'YOUR_NAVER_CLIENT_SECRET',
    scopes: ['name', 'email', 'profile_image'],
  },
  kakao: {
    appKey: 'da17dcdbbb81e8ed62e5a61f5fd9842e',
    restApiKey: '92516870ec9e92e52b99c261585d9a5a',
  },
  facebook: {
    appId: 'YOUR_FACEBOOK_APP_ID',
    scopes: ['public_profile', 'email'],
  },
};

export class SocialAuthService {
  // Google 로그인 (AuthSession 사용)
  static async signInWithGoogle(): Promise<AuthUser | null> {
    try {
      console.log('🔍 Google 로그인 시작...');
      
      // 플랫폼별 클라이언트 ID 선택
      const clientId = Platform.OS === 'ios' 
        ? SOCIAL_CONFIG.google.iosClientId 
        : SOCIAL_CONFIG.google.androidClientId;
      
      // PKCE를 위한 코드 챌린지 생성
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );

      // AuthSession 요청 설정
      const request = new AuthSession.AuthRequest({
        clientId: clientId,
        scopes: SOCIAL_CONFIG.google.scopes,
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'testmim-app',
          preferLocalhost: true,
        }),
        responseType: AuthSession.ResponseType.Code,
        codeChallenge: codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      // Google OAuth 엔드포인트
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      // 인증 요청 실행
      const result = await request.promptAsync(discovery);
      
      if (result.type === 'success') {
        console.log('Google 인증 성공:', result.params);
        
        // 인증 코드로 토큰 교환
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: clientId,
            code: result.params.code,
            redirectUri: request.redirectUri!,
          },
          discovery
        );

        if (tokenResult.accessToken) {
          // 사용자 정보 가져오기
          const userInfoResponse = await fetch(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
              headers: {
                Authorization: `Bearer ${tokenResult.accessToken}`,
              },
            }
          );

          const userInfo = await userInfoResponse.json();
          
          const authUser: AuthUser = {
            uid: userInfo.id,
            email: userInfo.email,
            displayName: userInfo.name,
            photoURL: userInfo.picture,
            provider: 'google',
          };

          // 사용자 정보 저장
          await AsyncStorage.setItem('user', JSON.stringify(authUser));
          
          console.log('✅ Google 로그인 성공:', authUser);
          return authUser;
        }
      } else {
        console.log('Google 로그인 취소 또는 실패:', result);
        return null;
      }
      
    } catch (error: any) {
      console.error('❌ Google 로그인 오류:', error);
      Alert.alert('오류', 'Google 로그인 중 오류가 발생했습니다.');
      return null;
    }
  }

  // Apple 로그인 (iOS만 지원)
  static async signInWithApple(): Promise<AuthUser | null> {
    try {
      console.log('🍎 Apple 로그인 시작...');
      
      if (Platform.OS !== 'ios') {
        Alert.alert('알림', 'Apple 로그인은 iOS에서만 지원됩니다.');
        return null;
      }

      // Apple 로그인 가능 여부 확인
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('알림', '이 기기에서는 Apple 로그인을 사용할 수 없습니다.');
        return null;
      }

      // Apple 로그인 실행
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const authUser: AuthUser = {
        uid: credential.user,
        email: credential.email,
        displayName: credential.fullName 
          ? `${credential.fullName.givenName} ${credential.fullName.familyName}`.trim()
          : null,
        photoURL: null,
        provider: 'apple',
      };

      // 사용자 정보 저장
      await AsyncStorage.setItem('user', JSON.stringify(authUser));
      
      console.log('✅ Apple 로그인 성공:', authUser);
      return authUser;
      
    } catch (error: any) {
      console.error('❌ Apple 로그인 오류:', error);
      if (error.code === 'ERR_CANCELED') {
        console.log('Apple 로그인 취소됨');
        return null;
      }
      Alert.alert('오류', 'Apple 로그인 중 오류가 발생했습니다.');
      return null;
    }
  }

  // 네이버 로그인
  static async signInWithNaver(): Promise<AuthUser | null> {
    try {
      console.log('🟢 네이버 로그인 시작...');
      
      // 네이버 OAuth 상태값 생성
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // 네이버 인증 URL 생성
      const redirectUri = AuthSession.makeRedirectUri();
      const authUrl = `https://nid.naver.com/oauth2.0/authorize?` +
        `response_type=code&` +
        `client_id=${SOCIAL_CONFIG.naver.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=name,email,profile_image`;

      // WebBrowser로 인증 페이지 열기
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success') {
        const urlParams = new URLSearchParams(result.url.split('?')[1]);
        const code = urlParams.get('code');
        const returnedState = urlParams.get('state');
        
        if (returnedState !== state || !code) {
          throw new Error('상태값이 일치하지 않거나 코드가 없습니다.');
        }

        // 액세스 토큰 요청
        const tokenUrl = `https://nid.naver.com/oauth2.0/token?` +
          `grant_type=authorization_code&` +
          `client_id=${SOCIAL_CONFIG.naver.clientId}&` +
          `client_secret=${SOCIAL_CONFIG.naver.clientSecret}&` +
          `code=${code}&` +
          `state=${state}`;

        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          // 사용자 정보 요청
          const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });

          const userData = await userResponse.json();
          
          if (userData.response) {
            const authUser: AuthUser = {
              uid: userData.response.id,
              email: userData.response.email,
              displayName: userData.response.name,
              photoURL: userData.response.profile_image,
              provider: 'naver',
            };

            // 사용자 정보 저장
            await AsyncStorage.setItem('user', JSON.stringify(authUser));
            
            console.log('✅ 네이버 로그인 성공:', authUser);
            return authUser;
          }
        }
      }

      return null;
      
    } catch (error: any) {
      console.error('❌ 네이버 로그인 오류:', error);
      Alert.alert('오류', '네이버 로그인 중 오류가 발생했습니다.');
      return null;
    }
  }

  // 카카오 로그인 (네이티브 SDK 사용)
  static async signInWithKakao(): Promise<AuthUser | null> {
    // 네이티브 카카오 SDK를 사용하기 위해 별도 서비스 호출
    const { KakaoAuthService } = await import('./kakaoAuth');
    return await KakaoAuthService.signInWithKakao();
  }

  // 페이스북 로그인 (AuthSession 사용)
  static async signInWithFacebook(): Promise<AuthUser | null> {
    try {
      console.log('📘 페이스북 로그인 시작...');
      
      // 페이스북 OAuth 인증 URL 생성
      const redirectUri = AuthSession.makeRedirectUri();
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${SOCIAL_CONFIG.facebook.appId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=${SOCIAL_CONFIG.facebook.scopes.join(',')}&` +
        `response_type=code`;

      // WebBrowser로 인증 페이지 열기
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success') {
        const urlParams = new URLSearchParams(result.url.split('?')[1]);
        const code = urlParams.get('code');
        const returnedState = urlParams.get('state');
        
        if (returnedState !== state || !code) {
          throw new Error('상태값이 일치하지 않거나 코드가 없습니다.');
        }

        // 액세스 토큰 요청
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
          `client_id=${SOCIAL_CONFIG.facebook.appId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `code=${code}`;

        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          // 사용자 정보 요청
          const userResponse = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
          );

          const userData = await userResponse.json();
          
          const authUser: AuthUser = {
            uid: userData.id,
            email: userData.email || null,
            displayName: userData.name,
            photoURL: userData.picture?.data?.url || null,
            provider: 'facebook',
          };

          // 사용자 정보 저장
          await AsyncStorage.setItem('user', JSON.stringify(authUser));
          
          console.log('✅ 페이스북 로그인 성공:', authUser);
          return authUser;
        }
      }

      return null;
      
    } catch (error: any) {
      console.error('❌ 페이스북 로그인 오류:', error);
      Alert.alert('오류', '페이스북 로그인 중 오류가 발생했습니다.');
      return null;
    }
  }

  // 로그아웃
  static async signOut(): Promise<void> {
    try {
      console.log('🚪 로그아웃 중...');
      
      // AsyncStorage에서 사용자 정보 제거
      await AsyncStorage.removeItem('user');
      
      console.log('✅ 로그아웃 완료');
      
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    }
  }

  // 현재 로그인된 사용자 정보 가져오기
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        console.log('현재 사용자:', user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('❌ 사용자 정보 조회 오류:', error);
      return null;
    }
  }

  // 공통 로그인 메서드
  static async signInWithProvider(provider: string): Promise<AuthUser | null> {
    switch (provider) {
      case 'google':
        return await this.signInWithGoogle();
      case 'apple':
        return await this.signInWithApple();
      case 'naver':
        return await this.signInWithNaver();
      case 'kakao':
        return await this.signInWithKakao();
      case 'facebook':
        return await this.signInWithFacebook();
      default:
        console.error('지원하지 않는 로그인 방식:', provider);
        return null;
    }
  }
} 