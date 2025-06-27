# 📱 TestMim App 소셜 로그인 가이드

이 가이드는 TestMim 앱에서 소셜 로그인을 설정하고 사용하는 방법을 설명합니다.

## 🔧 지원하는 소셜 로그인

- **Google** ✅ (완전 구현)
- **Apple** ✅ (iOS 전용, 완전 구현)
- **카카오** ✅ (네이티브 SDK 사용, 완전 구현)
- **네이버** ✅ (OAuth 2.0 구현)
- **페이스북** ✅ (OAuth 2.0 구현)

## 📋 설정 준비사항

### 1. 카카오 로그인 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com/)에 접속
2. 애플리케이션 등록 및 앱 키 발급
3. `app.json` 파일에서 `YOUR_KAKAO_APP_KEY_HERE`를 실제 앱 키로 변경:

```json
{
  "plugins": [
    [
      "@react-native-seoul/kakao-login",
      {
        "kakaoAppKey": "실제_카카오_앱_키",
        "kotlinVersion": "1.6.10"
      }
    ]
  ]
}
```

4. iOS 설정: `kakao{KAKAO_APP_KEY}` 부분을 실제 키로 변경

### 2. Google 로그인 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 현재 설정된 클라이언트 ID 확인:
   - Android: `274479977819-2kh57ilqe4b6j6o4sr8k3b1uo9p3m8uv.apps.googleusercontent.com`
   - iOS: `274479977819-at0648mvfv01g3saod74t4c6chgqdv9c.apps.googleusercontent.com`

### 3. 네이버 로그인 설정

1. [네이버 개발자 센터](https://developers.naver.com/)에서 애플리케이션 등록
2. `socialAuth.ts`에서 `SOCIAL_CONFIG.naver` 부분의 클라이언트 ID/시크릿 설정

### 4. 페이스북 로그인 설정

1. [Facebook 개발자](https://developers.facebook.com/)에서 앱 생성
2. `socialAuth.ts`에서 `SOCIAL_CONFIG.facebook.appId` 설정

## 🚀 사용 방법

### 기본 사용법

```typescript
import { SocialAuthService } from '../services/socialAuth';

// 각 플랫폼별 로그인
const user = await SocialAuthService.signInWithGoogle();
const user = await SocialAuthService.signInWithApple();
const user = await SocialAuthService.signInWithKakao();
const user = await SocialAuthService.signInWithNaver();
const user = await SocialAuthService.signInWithFacebook();

// 공통 인터페이스 사용
const user = await SocialAuthService.signInWithProvider('google');
```

### 현재 사용자 확인

```typescript
const currentUser = await SocialAuthService.getCurrentUser();
```

### 로그아웃

```typescript
await SocialAuthService.signOut();
```

## 📱 빌드 및 배포

### Development Build 생성

```bash
# iOS
expo run:ios

# Android
expo run:android
```

### EAS Build (권장)

```bash
# 설정
eas build:configure

# 빌드
eas build --platform ios
eas build --platform android
```

## ⚠️ 주의사항

1. **Expo Go 제한사항**: 소셜 로그인은 Development Build나 Production Build에서만 작동합니다.

2. **iOS Apple 로그인**: App Store 배포 시 다른 소셜 로그인을 제공하면 Apple 로그인도 반드시 제공해야 합니다.

3. **카카오 SDK**: 
   - 네이티브 SDK를 사용하므로 Development Build 필요
   - 카카오톡 앱이 설치되어 있으면 앱을 통해 로그인, 없으면 웹뷰 로그인

4. **프로덕션 키**: 실제 배포 전에 모든 플레이스홀더 키를 실제 키로 변경해야 합니다.

## 🔍 디버깅

### 로그 확인
모든 로그인 과정은 상세한 로그를 제공합니다:

```typescript
console.log('🔍 Google 로그인 시작...');
console.log('✅ 로그인 성공:', user);
console.log('❌ 로그인 오류:', error);
```

### 일반적인 문제 해결

1. **카카오 로그인 실패**: 앱 키와 URL 스킴 확인
2. **Google 로그인 실패**: 클라이언트 ID와 SHA-1 인증서 확인
3. **Apple 로그인 안보임**: iOS 기기와 iOS 13+ 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. 각 플랫폼의 개발자 콘솔 설정
2. 번들 ID 및 패키지명 일치 여부
3. 개발자 계정 설정 상태
4. 네트워크 연결 상태

---

**마지막 업데이트**: 2024년 1월
**버전**: 1.0.0 