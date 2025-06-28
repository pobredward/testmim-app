import { Alert, Platform } from 'react-native';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from './socialAuth';

export class KakaoAuthService {
  // 카카오 SDK 초기화
  static async initialize(): Promise<void> {
    try {
      // 카카오 SDK 상태 확인
      const isKakaoAvailable = !!KakaoLogin;
      console.log('🔍 카카오 SDK 상태 확인:', isKakaoAvailable);
      
      if (!KakaoLogin) {
        throw new Error('카카오 SDK가 로드되지 않았습니다.');
      }

      // 카카오 SDK 초기화 확인
      try {
        // 간단한 테스트로 SDK가 제대로 로드되었는지 확인
        const hasLogin = typeof KakaoLogin.login === 'function';
        console.log('🔍 카카오 로그인 메서드 확인:', hasLogin);
        
        if (!hasLogin) {
          throw new Error('카카오 로그인 메서드가 사용 불가능합니다.');
        }
        
        console.log('✅ 카카오 SDK 준비 완료');
      } catch (testError) {
        console.error('❌ 카카오 SDK 테스트 실패:', testError);
        throw testError;
      }
    } catch (error) {
      console.error('❌ 카카오 SDK 초기화 오류:', error);
      throw error;
    }
  }

  // 카카오 로그인 (네이티브 SDK 사용)
  static async signInWithKakao(): Promise<AuthUser | null> {
    try {
      console.log('💬 카카오 로그인 시작 (네이티브 SDK)...');
      
      // 카카오 SDK 상태 재확인
      if (!KakaoLogin || typeof KakaoLogin.login !== 'function') {
        console.warn('⚠️ 네이티브 카카오 SDK 사용 불가, 웹 로그인으로 전환...');
        return await this.signInWithKakaoWeb();
      }
      
      // 카카오 로그인 실행
      const token = await KakaoLogin.login();
      console.log('카카오 토큰 받기 성공:', token);

      if (token.accessToken) {
        // 사용자 프로필 정보 가져오기
        const profile = await KakaoLogin.getProfile();
        console.log('카카오 프로필 받기 성공:', profile);

        let authUser: AuthUser = {
          uid: profile.id.toString(),
          email: profile.email || null,
          displayName: profile.nickname || null,
          photoURL: profile.profileImageUrl || null,
          provider: 'kakao',
          nickname: null,
        };

        // Firebase users 컬렉션에 사용자 생성 또는 업데이트
        const { SocialAuthService } = await import('./socialAuth');
        authUser = await SocialAuthService.createOrUpdateFirebaseUser(authUser);

        // 사용자 정보 저장
        await AsyncStorage.setItem('user', JSON.stringify(authUser));
        
        console.log('✅ 카카오 로그인 성공 (네이티브):', authUser);
        return authUser;
      }

      return null;
      
    } catch (error: any) {
      console.error('❌ 네이티브 카카오 로그인 오류:', error);
      
      // 사용자가 취소한 경우
      if (error.code === 'E_CANCELLED_OPERATION') {
        console.log('카카오 로그인 취소됨');
        return null;
      }
      
      // 네이티브 SDK 오류 시 웹 로그인으로 fallback
      console.warn('⚠️ 네이티브 카카오 로그인 실패, 웹 로그인으로 전환...');
      return await this.signInWithKakaoWeb();
    }
  }

  // 카카오 웹 로그인 (AuthSession 사용)
  static async signInWithKakaoWeb(): Promise<AuthUser | null> {
    try {
      console.log('🌐 카카오 웹 로그인 시작...');
      
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'testmim-app',
        preferLocalhost: true,
      });

      // 카카오 OAuth 인증 URL
      const authUrl = `https://kauth.kakao.com/oauth/authorize?` +
        `client_id=da17dcdbbb81e8ed62e5a61f5fd9842e&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=profile_nickname,account_email,profile_image`;

      console.log('카카오 인증 URL:', authUrl);
      console.log('리다이렉트 URI:', redirectUri);

      // WebBrowser로 인증 페이지 열기
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success') {
        const urlParams = new URLSearchParams(result.url.split('?')[1]);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('인증 코드를 받지 못했습니다.');
        }

        console.log('카카오 인증 코드 받기 성공');

        // 액세스 토큰 요청
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `grant_type=authorization_code&` +
                `client_id=da17dcdbbb81e8ed62e5a61f5fd9842e&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `code=${code}`,
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          console.log('카카오 액세스 토큰 받기 성공');

          // 사용자 정보 요청
          const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          });

          const userData = await userResponse.json();
          console.log('카카오 사용자 정보 받기 성공:', userData);

          let authUser: AuthUser = {
            uid: userData.id.toString(),
            email: userData.kakao_account?.email || null,
            displayName: userData.kakao_account?.profile?.nickname || null,
            photoURL: userData.kakao_account?.profile?.profile_image_url || null,
            provider: 'kakao',
            nickname: null,
          };

          // Firebase users 컬렉션에 사용자 생성 또는 업데이트
          const { SocialAuthService } = await import('./socialAuth');
          authUser = await SocialAuthService.createOrUpdateFirebaseUser(authUser);

          // 사용자 정보 저장
          await AsyncStorage.setItem('user', JSON.stringify(authUser));
          
          console.log('✅ 카카오 웹 로그인 성공:', authUser);
          return authUser;
        }
      }

      return null;
      
    } catch (error: any) {
      console.error('❌ 카카오 웹 로그인 오류:', error);
      Alert.alert('오류', '카카오 로그인 중 오류가 발생했습니다.');
      return null;
    }
  }

  // 카카오 로그아웃
  static async signOut(): Promise<void> {
    try {
      console.log('카카오 로그아웃 중...');
      
      // 카카오 토큰 삭제
      await KakaoLogin.logout();
      
      console.log('✅ 카카오 로그아웃 완료');
      
    } catch (error) {
      console.error('❌ 카카오 로그아웃 오류:', error);
    }
  }

  // 카카오 연결 해제 (회원탈퇴)
  static async unlink(): Promise<void> {
    try {
      console.log('카카오 연결 해제 중...');
      
      // 카카오 계정 연결 해제
      await KakaoLogin.unlink();
      
      // AsyncStorage에서도 사용자 정보 제거
      await AsyncStorage.removeItem('user');
      
      console.log('✅ 카카오 연결 해제 완료');
      
    } catch (error) {
      console.error('❌ 카카오 연결 해제 오류:', error);
    }
  }

  // 현재 저장된 사용자 정보 가져오기
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user.provider === 'kakao') {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ 카카오 사용자 정보 조회 오류:', error);
      return null;
    }
  }
} 