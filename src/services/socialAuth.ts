import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
// Firebase Auth는 현재 사용하지 않음 (Expo Go 호환성 문제)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createUserInFirestore, 
  updateUserLoginInfo, 
  checkUserExists,
  generateUniqueUID,
  checkFirebaseConnection,
  UserData
} from '../utils/userAuth';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  nickname?: string | null;
  onboardingCompleted?: boolean;
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
  /**
   * Firebase users 컬렉션에 사용자 생성 또는 업데이트
   */
  static async createOrUpdateFirebaseUser(authUser: AuthUser): Promise<AuthUser> {
    try {
      // Apple 로그인이 아닌 경우에만 이메일 필수 체크
      if (!authUser.email && authUser.provider !== 'apple') {
        console.warn("⚠️ 이메일이 없어 Firebase 사용자 생성을 건너뜁니다.");
        return authUser;
      }
      
      // Apple 로그인에서 이메일이 없는 경우 로그 출력
      if (!authUser.email && authUser.provider === 'apple') {
        console.log("🍎 Apple 로그인: 이메일 정보 없음 (정상적인 상황)");
      }

      // Firebase 연결 확인
      if (!checkFirebaseConnection()) {
        console.error("❌ Firestore 연결이 설정되지 않았습니다.");
        return authUser;
      }

      // 소셜 제공자별로 고유한 UID 생성
      const uniqueUID = generateUniqueUID(authUser.provider, authUser.uid);
      
      console.log("🔐 Firebase 사용자 처리:", {
        provider: authUser.provider,
        email: authUser.email,
        providerId: authUser.uid,
        uniqueUID: uniqueUID
      });

      // 사용자 존재 여부 확인
      const userExists = await checkUserExists(uniqueUID);
      
      if (!userExists) {
        // 새 사용자 생성
        await createUserInFirestore({
          uid: uniqueUID,
          email: authUser.email,
          name: authUser.displayName || "",
          image: authUser.photoURL || "",
          provider: authUser.provider,
          providerId: authUser.uid,
        });
        
        console.log("✅ 새 사용자 생성 성공:", {
          uid: uniqueUID,
          email: authUser.email,
          provider: authUser.provider
        });

        // 새 사용자는 온보딩이 필요하고 nickname은 아직 없음
        authUser.onboardingCompleted = false;
        authUser.nickname = null;
      } else {
        // 기존 사용자 로그인 정보 업데이트
        await updateUserLoginInfo(uniqueUID, {
          name: authUser.displayName || "",
          image: authUser.photoURL || "",
        });
        
        console.log("🔄 기존 사용자 로그인 성공:", {
          uid: uniqueUID,
          email: authUser.email,
          provider: authUser.provider
        });

        // 기존 사용자 정보 확인하여 온보딩 완료 여부와 nickname 설정
        // 실제 사용자 정보를 가져와 onboardingCompleted와 nickname 확인
        const { getUserFromFirestore } = await import('../utils/userAuth');
        const userData = await getUserFromFirestore(uniqueUID);
        authUser.onboardingCompleted = userData?.onboardingCompleted || false;
        authUser.nickname = userData?.nickname || null;
      }
      
      // 고유 UID로 업데이트
      authUser.uid = uniqueUID;
      
      return authUser;
    } catch (error) {
      console.error("❌ Firebase 사용자 저장 오류:", error);
      // Firebase 오류가 발생해도 로그인은 계속 진행
      return authUser;
    }
  }

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
          
          let authUser: AuthUser = {
            uid: userInfo.id,
            email: userInfo.email,
            displayName: userInfo.name,
            photoURL: userInfo.picture,
            provider: 'google',
            nickname: null,
          };

          // Firebase users 컬렉션에 사용자 생성 또는 업데이트
          authUser = await this.createOrUpdateFirebaseUser(authUser);

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

  // Apple Identity Token 디코딩 함수
  private static decodeAppleIdentityToken(token: string): any {
    try {
      // JWT는 header.payload.signature 형태로 구성됨
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // payload 부분 디코딩
      const payload = parts[1];
      // base64url을 base64로 변환
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      // padding 추가
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      
      // React Native용 base64 디코딩
      let decodedString = '';
      try {
        if (typeof atob !== 'undefined') {
          decodedString = atob(padded);
        } else {
          // React Native 환경에서 atob이 없는 경우 폴리필 사용
          decodedString = this.base64Decode(padded);
        }
      } catch (e) {
        // base64 디코딩 실패 시 폴리필 사용
        decodedString = this.base64Decode(padded);
      }
      
      const decoded = JSON.parse(decodedString);
      console.log('🍎 디코딩된 Apple Token:', decoded);
      return decoded;
    } catch (error) {
      console.error('🍎 Apple Token 디코딩 오류:', error);
      return null;
    }
  }

  // Base64 디코딩 폴리필
  private static base64Decode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    
    str = str.replace(/[^A-Za-z0-9+/]/g, '');
    
    for (let i = 0; i < str.length; i += 4) {
      const encoded1 = chars.indexOf(str.charAt(i));
      const encoded2 = chars.indexOf(str.charAt(i + 1));
      const encoded3 = chars.indexOf(str.charAt(i + 2));
      const encoded4 = chars.indexOf(str.charAt(i + 3));
      
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
      
      const chr1 = (bitmap >> 16) & 255;
      const chr2 = (bitmap >> 8) & 255;
      const chr3 = bitmap & 255;
      
      output += String.fromCharCode(chr1);
      
      if (encoded3 !== 64) {
        output += String.fromCharCode(chr2);
      }
      if (encoded4 !== 64) {
        output += String.fromCharCode(chr3);
      }
    }
    
    return output;
  }

  // Apple 사용자 정보 저장/조회 헬퍼 함수들
  private static async saveAppleUserInfo(userId: string, userInfo: { email?: string | null, displayName?: string | null }) {
    try {
      const key = `apple_user_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(userInfo));
      console.log('🍎 Apple 사용자 정보 저장:', userInfo);
    } catch (error) {
      console.error('Apple 사용자 정보 저장 오류:', error);
    }
  }

  private static async getAppleUserInfo(userId: string): Promise<{ email?: string | null, displayName?: string | null } | null> {
    try {
      const key = `apple_user_${userId}`;
      const storedInfo = await AsyncStorage.getItem(key);
      if (storedInfo) {
        const parsed = JSON.parse(storedInfo);
        console.log('🍎 저장된 Apple 사용자 정보 조회:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Apple 사용자 정보 조회 오류:', error);
    }
    return null;
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

      console.log('🍎 Apple credential 받음:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        authorizationCode: credential.authorizationCode ? 'present' : 'null',
        identityToken: credential.identityToken ? 'present' : 'null'
      });

      // Apple Identity Token에서 이메일 정보 추출 시도
      let tokenEmail = null;
      if (credential.identityToken) {
        try {
          const tokenPayload = this.decodeAppleIdentityToken(credential.identityToken);
          if (tokenPayload?.email) {
            tokenEmail = tokenPayload.email;
            console.log('🍎 Identity Token에서 이메일 추출:', tokenEmail);
          }
        } catch (error) {
          console.log('🍎 Identity Token 디코딩 실패:', error);
        }
      }

      // 기존에 저장된 사용자 정보 조회
      const storedUserInfo = await this.getAppleUserInfo(credential.user);

      // displayName 처리
      let displayName = null;
      if (credential.fullName?.givenName || credential.fullName?.familyName) {
        const firstName = credential.fullName.givenName || '';
        const lastName = credential.fullName.familyName || '';
        displayName = `${firstName} ${lastName}`.trim();
        if (displayName === '') displayName = null;
      } else if (storedUserInfo?.displayName) {
        // 저장된 정보에서 이름 가져오기
        displayName = storedUserInfo.displayName;
        console.log('🍎 저장된 이름 사용:', displayName);
      }

      // 이메일 처리 (여러 소스에서 확인)
      let email = credential.email || tokenEmail;
      if (!email && storedUserInfo?.email) {
        // 저장된 정보에서 이메일 가져오기
        email = storedUserInfo.email;
        console.log('🍎 저장된 이메일 사용:', email);
      } else if (!email) {
        console.log('🍎 이메일 정보 없음 - Apple의 정상적인 동작');
        // 필요하다면 Apple Private Relay 이메일 생성
        // email = `${credential.user}@privaterelay.appleid.com`;
      }

      // 새로운 정보가 있다면 저장 (첫 로그인이거나 정보가 업데이트된 경우)
      if (credential.email || credential.fullName || tokenEmail) {
        await this.saveAppleUserInfo(credential.user, {
          email: credential.email || tokenEmail || storedUserInfo?.email,
          displayName: displayName || storedUserInfo?.displayName
        });
      }

      let authUser: AuthUser = {
        uid: credential.user,
        email: email,
        displayName: displayName,
        photoURL: null,
        provider: 'apple',
        nickname: null,
      };

      console.log('🍎 최종 Apple 사용자 정보:', authUser);

      // Firebase users 컬렉션에 사용자 생성 또는 업데이트
      authUser = await this.createOrUpdateFirebaseUser(authUser);

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
            let authUser: AuthUser = {
              uid: userData.response.id,
              email: userData.response.email,
              displayName: userData.response.name,
              photoURL: userData.response.profile_image,
              provider: 'naver',
              nickname: null,
            };

            // Firebase users 컬렉션에 사용자 생성 또는 업데이트
            authUser = await this.createOrUpdateFirebaseUser(authUser);

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
          
          let authUser: AuthUser = {
            uid: userData.id,
            email: userData.email || null,
            displayName: userData.name,
            photoURL: userData.picture?.data?.url || null,
            provider: 'facebook',
            nickname: null,
          };

          // Firebase users 컬렉션에 사용자 생성 또는 업데이트
          authUser = await this.createOrUpdateFirebaseUser(authUser);

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
      
      // 현재 사용자 정보 확인
      const currentUser = await this.getCurrentUser();
      
      // Apple 사용자인 경우 저장된 정보도 삭제
      if (currentUser?.provider === 'apple' && currentUser.uid) {
        // Apple UID에서 실제 Apple user ID 추출
        const appleUserId = currentUser.uid.replace('apple_', '');
        const key = `apple_user_${appleUserId}`;
        await AsyncStorage.removeItem(key);
        console.log('🍎 Apple 사용자 정보 삭제');
      }
      
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
      console.log('🔍 AsyncStorage에서 사용자 정보 조회 중...');
      const userJson = await AsyncStorage.getItem('user');
      
      if (userJson) {
        const user = JSON.parse(userJson);
        console.log('✅ 현재 사용자 정보 발견:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          nickname: user.nickname,
          provider: user.provider,
          onboardingCompleted: user.onboardingCompleted
        });
        return user;
      } else {
        console.log('❌ AsyncStorage에 사용자 정보 없음');
        return null;
      }
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