import { Alert, Platform } from 'react-native';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from './socialAuth';

export class KakaoAuthService {
  // 카카오 SDK 초기화
  static async initialize(): Promise<void> {
    try {
      // 카카오 SDK는 플러그인을 통해 자동으로 초기화됩니다.
      console.log('✅ 카카오 SDK 준비 완료');
    } catch (error) {
      console.error('❌ 카카오 SDK 초기화 오류:', error);
    }
  }

  // 카카오 로그인 (네이티브 SDK 사용)
  static async signInWithKakao(): Promise<AuthUser | null> {
    try {
      console.log('💬 카카오 로그인 시작 (네이티브 SDK)...');
      
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
      console.error('❌ 카카오 로그인 오류:', error);
      
      // 사용자가 취소한 경우
      if (error.code === 'E_CANCELLED_OPERATION') {
        console.log('카카오 로그인 취소됨');
        return null;
      }
      
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