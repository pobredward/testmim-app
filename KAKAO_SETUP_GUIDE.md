# 💬 카카오 로그인 설정 가이드

TestMim 앱에서 카카오 로그인을 사용하기 위한 카카오 개발자 콘솔 설정 가이드입니다.

## 🔑 현재 설정된 키 정보

- **네이티브 앱 키**: `da17dcdbbb81e8ed62e5a61f5fd9842e`
- **REST API 키**: `92516870ec9e92e52b99c261585d9a5a`
- **JavaScript 키**: `fb0f5f530568e9835396712dbc73c727`
- **Admin 키**: `d48c41f8bb49d6c9f4d941d2215e4ef7`

## 📋 카카오 개발자 콘솔 설정 단계

### 1. 카카오 개발자 콘솔 접속

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. 카카오 계정으로 로그인
3. 기존 앱 선택 또는 새 앱 생성

### 2. 플랫폼 설정

#### iOS 플랫폼 설정
1. **앱 설정** > **플랫폼** > **iOS 추가**
2. 다음 정보 입력:
   - **번들 ID**: `com.onmindlab.testmim`
   - **앱 스토어 ID**: (선택사항, 배포 후 입력)
   - **팀 ID**: (Apple Developer 계정의 Team ID)

#### Android 플랫폼 설정
1. **앱 설정** > **플랫폼** > **Android 추가**
2. 다음 정보 입력:
   - **패키지명**: `com.onmindlab.testmim`
   - **마켓 URL**: (선택사항, 배포 후 입력)
   - **키 해시**: (아래 방법으로 생성)

### 3. Android 키 해시 생성

#### Development Build용 키 해시
```bash
# Expo에서 키 해시 확인
expo fetch:android:hashes

# 또는 직접 생성 (macOS/Linux)
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64

# Windows의 경우
keytool -exportcert -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore | openssl sha1 -binary | openssl base64
```

#### Production Build용 키 해시
EAS Build를 사용하는 경우:
```bash
# EAS Build 키 해시 확인
eas credentials
```

### 4. 카카오 로그인 활성화

1. **제품 설정** > **카카오 로그인** 선택
2. **활성화 설정**을 **ON**으로 변경
3. **OpenID Connect** 활성화 (권장)
4. **Redirect URI** 설정:
   - `testmim-app://oauth` (커스텀 스킴)
   - 개발 중에는 Expo 제공 URI도 추가 가능

### 5. 동의항목 설정

1. **제품 설정** > **카카오 로그인** > **동의항목**
2. 필요한 정보 선택:
   - **닉네임** (필수)
   - **프로필 사진** (선택)
   - **카카오계정(이메일)** (선택)

### 6. 비즈니스 설정 (선택사항)

개인 개발자는 월 10,000명까지 무료 사용 가능합니다.
더 많은 사용자가 필요한 경우 비즈니스 앱으로 전환하세요.

## 🚀 테스트 방법

### 1. Development Build 생성
```bash
# iOS
expo run:ios

# Android  
expo run:android
```

### 2. 테스트 컴포넌트 사용
앱에서 `KakaoLoginTest` 컴포넌트를 사용하여 로그인을 테스트할 수 있습니다.

### 3. 로그 확인
개발자 도구에서 다음과 같은 로그를 확인하세요:
```
💬 카카오 로그인 시작 (네이티브 SDK)...
카카오 토큰 받기 성공: { accessToken: "...", ... }
카카오 프로필 받기 성공: { id: "...", nickname: "...", ... }
✅ 카카오 로그인 성공 (네이티브): { uid: "...", ... }
```

## ⚠️ 주의사항

1. **Expo Go 제한**: 카카오 로그인은 Development Build나 Production Build에서만 작동합니다.

2. **카카오톡 앱 연동**: 
   - 카카오톡 앱이 설치되어 있으면 앱을 통해 로그인
   - 카카오톡 앱이 없으면 웹뷰를 통해 로그인

3. **URL 스킴**: 
   - iOS: `kakaoda17dcdbbb81e8ed62e5a61f5fd9842e`
   - Android: 자동으로 처리됨

4. **개발자 검수**: 
   - 개발 단계에서는 등록된 팀 멤버만 로그인 가능
   - 실제 서비스를 위해서는 카카오 검수 필요

## 🔧 문제 해결

### 일반적인 오류들

1. **"앱 키가 유효하지 않습니다"**
   - `app.json`의 `kakaoAppKey` 확인
   - 네이티브 앱 키 사용 확인

2. **"등록되지 않은 플랫폼입니다"**
   - 카카오 개발자 콘솔에서 iOS/Android 플랫폼 등록 확인
   - 번들 ID/패키지명 일치 확인

3. **"키 해시가 일치하지 않습니다" (Android)**
   - 올바른 키 해시 등록 확인
   - Development/Production 키 해시 구분

4. **카카오톡 앱으로 이동하지 않음**
   - URL 스킴 설정 확인
   - LSApplicationQueriesSchemes 설정 확인

## 📞 지원

문제가 지속되면 다음을 확인하세요:

1. [카카오 개발자 문서](https://developers.kakao.com/docs)
2. [React Native 카카오 로그인 라이브러리 문서](https://github.com/react-native-seoul/react-native-kakao-login)
3. 카카오 개발자 콘솔의 **문의하기**

---

**마지막 업데이트**: 2024년 1월
**앱 버전**: 1.0.0 