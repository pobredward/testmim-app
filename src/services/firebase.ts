import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase 설정 (google-services.json에서 가져온 값들)
const firebaseConfig = {
  apiKey: "AIzaSyDCgpPxX10bOPpeGZ32dTmYTOYVkmXVQQQ",
  authDomain: "test-zip-98f68.firebaseapp.com",
  projectId: "test-zip-98f68",
  storageBucket: "test-zip-98f68.firebasestorage.app",
  messagingSenderId: "511331550799",
  appId: "1:511331550799:android:ceea67da783c89d8404c3a"
};

console.log('🔥 Firebase JavaScript SDK 초기화 중...');

// Firebase 앱 초기화
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase 앱 초기화 완료');
} else {
  app = getApp();
  console.log('🔥 기존 Firebase 앱 사용');
}

// Firebase 서비스 초기화 (Auth 제외)
export const db = getFirestore(app);

console.log('🔥 Firebase JavaScript SDK 서비스 초기화 완료:', {
  firestore: db ? '✅ Firestore 준비됨' : '❌ Firestore 실패',
  projectId: firebaseConfig.projectId
});

export default app; 