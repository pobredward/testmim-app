import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getTestByCode } from '../data';
import type { TestAnswer } from '../types/tests';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  TestDetail: { testCode: string };
  TestExecution: { testCode: string };
  TestResult: { testCode: string; answers: TestAnswer[] };
};

type TestExecutionScreenRouteProp = RouteProp<RootStackParamList, 'TestExecution'>;
type TestExecutionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TestExecution'>;

interface Question {
  question: string;
  options: Array<{
    text: string;
    value: string;
    score: number;
    type?: string;
  }>;
}

interface Test {
  code: string;
  title: string;
  questions: Question[];
  calculateResult: (answers: TestAnswer[]) => any;
}

export default function TestExecutionScreen() {
  const route = useRoute<TestExecutionScreenRouteProp>();
  const navigation = useNavigation<TestExecutionScreenNavigationProp>();
  const { t, i18n } = useTranslation();
  const { testCode } = route.params;
  
  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<TestAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestData();
  }, [testCode, i18n.language]);

  const loadTestData = async () => {
    try {
      const testData = getTestByCode(testCode, i18n.language);
      if (testData) {
        setTest(testData);
      } else {
        Alert.alert(t('common.error'), t('testExecution.notFound'), [
          { text: t('login.ok'), onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('테스트 데이터 로드 오류:', error);
      Alert.alert(t('common.error'), t('testDetail.error'), [
        { text: t('login.ok'), onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option: { text: string; value: string; score: number; type?: string }) => {
    const newAnswer: TestAnswer = {
      value: option.value,
      score: option.score,
      type: option.type
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (test && currentQuestionIndex < test.questions.length - 1) {
      // 다음 질문으로
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 테스트 완료, 결과 화면으로 이동
      navigation.navigate('TestResult', { testCode, answers: newAnswers });
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const getProgressPercentage = () => {
    if (!test) return 0;
    return ((currentQuestionIndex + 1) / test.questions.length) * 100;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('testExecution.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!test) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('testExecution.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← {t('testExecution.exit')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentQuestionIndex + 1} / {test.questions.length}
        </Text>
      </View>

      {/* 진행률 바 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${getProgressPercentage()}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(getProgressPercentage())}%
        </Text>
      </View>

      {/* 질문 영역 */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      {/* 답변 옵션들 */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionButton}
            onPress={() => handleAnswer(option)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 이전 버튼 */}
      {currentQuestionIndex > 0 && (
        <TouchableOpacity 
          style={styles.previousButton} 
          onPress={goToPreviousQuestion}
        >
          <Text style={styles.previousButtonText}>{t('testExecution.previousQuestion')}</Text>
        </TouchableOpacity>
      )}
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
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  questionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 28,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  previousButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  previousButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
}); 