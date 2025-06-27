import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { KakaoAuthService } from '../services/kakaoAuth';
import { AuthUser } from '../services/socialAuth';

export default function KakaoLoginTest() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkCurrentUser();
    initializeKakao();
  }, []);

  const initializeKakao = async () => {
    await KakaoAuthService.initialize();
  };

  const checkCurrentUser = async () => {
    try {
      const user = await KakaoAuthService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.log('저장된 사용자 없음');
    }
  };

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      console.log('💬 카카오 로그인 테스트 시작...');

      const user = await KakaoAuthService.signInWithKakao();
      
      if (user) {
        setCurrentUser(user);
        Alert.alert(
          '카카오 로그인 성공! 🎉',
          `${user.displayName || user.email}님, 환영합니다!\n\n` +
          `이메일: ${user.email || '제공되지 않음'}\n` +
          `제공자: ${user.provider.toUpperCase()}\n` +
          `UID: ${user.uid}`,
          [{ text: '확인', style: 'default' }]
        );
      } else {
        Alert.alert('알림', '카카오 로그인이 취소되었습니다.');
      }
    } catch (error) {
      console.error('카카오 로그인 테스트 오류:', error);
      Alert.alert('오류', '카카오 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogout = async () => {
    try {
      setLoading(true);
      await KakaoAuthService.signOut();
      setCurrentUser(null);
      Alert.alert('알림', '카카오 로그아웃되었습니다.');
    } catch (error) {
      console.error('카카오 로그아웃 오류:', error);
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoUnlink = async () => {
    Alert.alert(
      '연결 해제 확인',
      '카카오 계정 연결을 해제하시겠습니까?\n(회원탈퇴와 같은 효과)',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '연결 해제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await KakaoAuthService.unlink();
              setCurrentUser(null);
              Alert.alert('완료', '카카오 계정 연결이 해제되었습니다.');
            } catch (error) {
              console.error('카카오 연결 해제 오류:', error);
              Alert.alert('오류', '연결 해제 중 오류가 발생했습니다.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>💬 카카오 로그인 테스트</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 설정 정보</Text>
          <Text style={styles.infoText}>
            • 네이티브 앱 키: da17dcdbbb81e8ed62e5a61f5fd9842e{'\n'}
            • REST API 키: 92516870ec9e92e52b99c261585d9a5a{'\n'}
            • 번들 ID: com.onmindlab.testmim{'\n'}
            • URL 스킴: kakaoda17dcdbbb81e8ed62e5a61f5fd9842e
          </Text>
        </View>

        {currentUser ? (
          <View style={styles.userSection}>
            <Text style={styles.sectionTitle}>현재 로그인 사용자</Text>
            
            <View style={styles.userCard}>
              <Text style={styles.userInfo}>
                👤 이름: {currentUser.displayName || '제공되지 않음'}
              </Text>
              <Text style={styles.userInfo}>
                📧 이메일: {currentUser.email || '제공되지 않음'}
              </Text>
              <Text style={styles.userInfo}>
                🔐 제공자: {currentUser.provider.toUpperCase()}
              </Text>
              <Text style={styles.userInfo}>
                🆔 UID: {currentUser.uid}
              </Text>
              {currentUser.photoURL && (
                <Text style={styles.userInfo}>
                  📷 프로필 이미지: 있음
                </Text>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={handleKakaoLogout}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>로그아웃</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.unlinkButton]}
                onPress={handleKakaoUnlink}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>연결 해제</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.loginSection}>
            <Text style={styles.sectionTitle}>카카오 로그인 테스트</Text>
            
            <TouchableOpacity
              style={[styles.button, styles.kakaoButton]}
              onPress={handleKakaoLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#3C1E1E" />
              ) : (
                <>
                  <Text style={styles.kakaoIcon}>💬</Text>
                  <Text style={styles.kakaoButtonText}>카카오로 로그인</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>⚠️ 주의사항</Text>
          <Text style={styles.statusText}>
            • Development Build 또는 Production Build에서만 작동{'\n'}
            • Expo Go에서는 테스트 불가{'\n'}
            • 카카오톡 앱이 있으면 앱으로, 없으면 웹으로 로그인{'\n'}
            • 카카오 개발자 콘솔에서 플랫폼 등록 필요
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#856404',
  },
  infoText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  userSection: {
    marginBottom: 30,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  loginSection: {
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  kakaoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  kakaoButtonText: {
    color: '#3C1E1E',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#6c757d',
  },
  unlinkButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBox: {
    backgroundColor: '#d1ecf1',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0c5460',
  },
  statusText: {
    fontSize: 12,
    color: '#0c5460',
    lineHeight: 18,
  },
}); 