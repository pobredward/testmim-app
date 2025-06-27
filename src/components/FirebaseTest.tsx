import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, serverTimestamp, limit, query } from 'firebase/firestore';

export default function FirebaseTest() {
  const [status, setStatus] = useState('연결 확인 중...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      // Firestore 연결 테스트 (Firebase JavaScript SDK 방식)
      const testCollection = collection(db, 'test');
      const q = query(testCollection, limit(1));
      await getDocs(q);
      
      setStatus('✅ Firebase 연결 성공!');
      setIsConnected(true);
    } catch (error) {
      console.error('Firebase 연결 오류:', error);
      setStatus('❌ Firebase 연결 실패');
      setIsConnected(false);
    }
  };

  const testWrite = async () => {
    try {
      const testCollection = collection(db, 'test');
      const docRef = await addDoc(testCollection, {
        message: 'Hello from Firebase JavaScript SDK!',
        timestamp: serverTimestamp(),
        device: 'mobile',
        platform: 'react-native-expo-go'
      });
      
      Alert.alert('성공', `문서가 생성되었습니다: ${docRef.id}`);
    } catch (error) {
      console.error('쓰기 오류:', error);
      Alert.alert('오류', '문서 생성에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Firebase JavaScript SDK 연동 테스트</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      {isConnected && (
        <TouchableOpacity style={styles.button} onPress={testWrite}>
          <Text style={styles.buttonText}>Firestore에 테스트 데이터 쓰기</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.retryButton} onPress={testFirebaseConnection}>
        <Text style={styles.retryButtonText}>다시 연결 테스트</Text>
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>📱 연동 방식</Text>
        <Text style={styles.infoText}>
          • Firebase JavaScript SDK 사용{'\n'}
          • Expo Go와 호환{'\n'}
          • 웹과 동일한 Firebase 프로젝트{'\n'}
          • React Native 환경에서 안정적
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  statusContainer: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: '#4285f4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0369a1',
  },
  infoText: {
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 18,
  },
}); 