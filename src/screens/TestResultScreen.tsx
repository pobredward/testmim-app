import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getTestByCode } from '../data';
import { db } from '../services/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import * as Sharing from 'expo-sharing';
import type { TestAnswer, TestResult } from '../types/tests';
import CommentsSection from '../components/CommentsSection';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  TestDetail: { testCode: string };
  TestExecution: { testCode: string };
  TestResult: { testCode: string; answers: TestAnswer[] };
};

type TestResultScreenRouteProp = RouteProp<RootStackParamList, 'TestResult'>;
type TestResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TestResult'>;

interface Test {
  code: string;
  title: string;
  description: string;
  docId: string;
  calculateResult: (answers: TestAnswer[]) => TestResult;
}

export default function TestResultScreen() {
  const route = useRoute<TestResultScreenRouteProp>();
  const navigation = useNavigation<TestResultScreenNavigationProp>();
  const { t, i18n } = useTranslation();
  const { testCode, answers } = route.params;
  
  const [test, setTest] = useState<Test | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const resultViewRef = useRef<View>(null);

  useEffect(() => {
    loadTestAndCalculateResult();
    incrementCompletionCount();
  }, [testCode, i18n.language]);

  const loadTestAndCalculateResult = async () => {
    try {
      const testData = getTestByCode(testCode, i18n.language);
      if (testData) {
        setTest(testData);
        const calculatedResult = testData.calculateResult(answers);
        setResult(calculatedResult);
      } else {
        Alert.alert(t('login.error'), t('testExecution.notFound'), [
          { text: t('login.ok'), onPress: () => navigation.navigate('Home') }
        ]);
      }
    } catch (error) {
      console.error('테스트 결과 계산 오류:', error);
      Alert.alert(t('login.error'), t('testResult.notFound'), [
        { text: t('login.ok'), onPress: () => navigation.navigate('Home') }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const incrementCompletionCount = async () => {
    try {
      const testData = getTestByCode(testCode, i18n.language);
      if (testData) {
        const docRef = doc(db, "testStats", testData.docId);
        await updateDoc(docRef, {
          completions: increment(1)
        });
      }
    } catch (error) {
      console.warn('완료 수 업데이트 실패:', error);
    }
  };

  const handleShare = async () => {
    if (!result || !test) return;
    
    setSharing(true);
    try {
      // 텍스트 형태로 결과 공유
      const shareText = `${test.title}\n\n${result.title}\n\n${result.desc}\n\n${result.hashtags ? result.hashtags.join(' ') : ''}\n\ntestmim.com에서 더 많은 테스트를 즐겨보세요!`;

      // 공유 가능 여부 확인
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // TODO: 나중에 이미지 생성 기능 추가 예정
        Alert.alert(
          t('testResult.shareTitle'),
          shareText,
          [
            { text: t('testResult.shareCancel'), style: 'cancel' },
            { text: t('testResult.shareCopy'), onPress: () => {
              // 클립보드에 복사하는 기능은 나중에 추가
              Alert.alert(t('common.notice'), t('testResult.shareText'));
            }}
          ]
        );
      } else {
        Alert.alert(t('login.error'), t('testResult.shareNotAvailable'));
      }
    } catch (error) {
      console.error('공유 오류:', error);
      Alert.alert(t('login.error'), t('testResult.shareError'));
    } finally {
      setSharing(false);
    }
  };

  const goHome = () => {
    navigation.navigate('Home');
  };

  const retakeTest = () => {
    navigation.navigate('TestExecution', { testCode });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('testResult.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!test || !result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('testResult.notFound')}</Text>
          <TouchableOpacity style={styles.homeButton} onPress={goHome}>
            <Text style={styles.homeButtonText}>{t('testResult.homeButton')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 캡처할 결과 영역 */}
        <View ref={resultViewRef} style={styles.resultContainer}>
          {/* 헤더 */}
          <View style={styles.headerContainer}>
            <Text style={styles.testTitle}>{test.title}</Text>
            <Text style={styles.watermark}>{t('testResult.watermark')}</Text>
          </View>

          {/* 결과 아이콘 */}
          <View style={styles.iconContainer}>
            <Text style={styles.resultIcon}>{result.icon}</Text>
          </View>

          {/* 결과 제목 */}
          <View style={styles.titleContainer}>
            <Text style={styles.resultTitle}>{result.title}</Text>
          </View>

          {/* 결과 설명 */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.resultDescription}>{result.desc}</Text>
            {result.subDesc && (
              <Text style={styles.resultSubDescription}>{result.subDesc}</Text>
            )}
          </View>

          {/* 해시태그 */}
          {result.hashtags && (
            <View style={styles.hashtagsContainer}>
              {result.hashtags.map((tag: string, index: number) => (
                <View key={index} style={styles.hashtag}>
                  <Text style={styles.hashtagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 추천 사항 */}
          {result.recommend && (
            <View style={styles.recommendContainer}>
              <Text style={styles.recommendTitle}>{t('testResult.recommend')}</Text>
              {result.recommend.map((item: string, index: number) => (
                <Text key={index} style={styles.recommendItem}>• {item}</Text>
              ))}
            </View>
          )}
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.shareButton, sharing && styles.disabledButton]} 
            onPress={handleShare}
            disabled={sharing}
          >
            <Text style={styles.shareButtonText}>
              {sharing ? t('testResult.shareLoading') : t('testResult.shareResult')}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.retakeButton]} 
              onPress={retakeTest}
            >
              <Text style={styles.retakeButtonText}>{t('testResult.retakeTest')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.homeButtonStyle]} 
              onPress={goHome}
            >
              <Text style={styles.homeButtonStyleText}>{t('testResult.goHome')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 댓글 섹션 */}
        <CommentsSection
          testCode={testCode}
          currentUserId={null} // 현재는 게스트 사용자로 처리
          currentUserName={null}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  homeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  testTitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  watermark: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultIcon: {
    fontSize: 80,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 32,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  resultDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  resultSubDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  hashtag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  hashtagText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  recommendContainer: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  recommendItem: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    marginBottom: 4,
  },
  actionsContainer: {
    padding: 20,
  },
  shareButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  retakeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButtonStyle: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  homeButtonStyleText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
}); 