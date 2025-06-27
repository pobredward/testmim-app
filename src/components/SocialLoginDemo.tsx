import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SocialAuthService, AuthUser } from '../services/socialAuth';

export default function SocialLoginDemo() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const user = await SocialAuthService.getCurrentUser();
    setCurrentUser(user);
  };

  const handleLogin = async (provider: string) => {
    try {
      setLoading(provider);
      console.log(`🔐 ${provider} 로그인 시도...`);

      const user = await SocialAuthService.signInWithProvider(provider);
      
      if (user) {
        setCurrentUser(user);
        Alert.alert(
          '로그인 성공!',
          `${user.displayName || user.email}님, 환영합니다!`
        );
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await SocialAuthService.signOut();
      setCurrentUser(null);
      Alert.alert('알림', '로그아웃되었습니다.');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  const LoginButton = ({ provider, title, icon, color }: any) => (
    <TouchableOpacity
      style={[styles.loginButton, { backgroundColor: color }]}
      onPress={() => handleLogin(provider)}
      disabled={loading !== null}
    >
      {loading === provider ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Text style={styles.buttonIcon}>{icon}</Text>
          <Text style={styles.buttonText}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🧠 TestMim 소셜 로그인 데모</Text>
        
        {currentUser ? (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoTitle}>현재 로그인 사용자</Text>
            <View style={styles.userCard}>
              <Text style={styles.userName}>
                👤 {currentUser.displayName || '이름 없음'}
              </Text>
              <Text style={styles.userEmail}>
                📧 {currentUser.email || '이메일 없음'}
              </Text>
              <Text style={styles.userProvider}>
                🔐 {currentUser.provider.toUpperCase()} 로그인
              </Text>
              <Text style={styles.userId}>
                🆔 {currentUser.uid}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginSection}>
            <Text style={styles.subtitle}>
              소셜 계정으로 로그인하세요
            </Text>
            
            <LoginButton
              provider="google"
              title="Google로 로그인"
              icon="🔍"
              color="#4285f4"
            />
            
            <LoginButton
              provider="apple"
              title="Apple로 로그인"
              icon="🍎"
              color="#000000"
            />
            
            <LoginButton
              provider="kakao"
              title="카카오로 로그인"
              icon="💬"
              color="#FEE500"
            />
            
            <LoginButton
              provider="naver"
              title="네이버로 로그인"
              icon="🟢"
              color="#03C75A"
            />
            
            <LoginButton
              provider="facebook"
              title="페이스북으로 로그인"
              icon="📘"
              color="#1877F2"
            />
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ℹ️ 이 데모는 개발 및 테스트 목적입니다.
          </Text>
          <Text style={styles.footerText}>
            실제 배포 전에 모든 키를 설정해주세요.
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
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  loginSection: {
    marginBottom: 30,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    marginBottom: 30,
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  userProvider: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  userId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
}); 