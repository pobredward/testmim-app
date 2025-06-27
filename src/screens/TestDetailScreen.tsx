import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getTestByCode } from '../data';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import CommentsSection from '../components/CommentsSection';
import { getThumbnailByCode } from '../constants/thumbnails';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  TestDetail: { testCode: string };
  TestExecution: { testCode: string };
};

type TestDetailScreenRouteProp = RouteProp<RootStackParamList, 'TestDetail'>;
type TestDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TestDetail'>;

interface Test {
  code: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  views: number;
  thumbnailUrl?: string;
  icon?: string;
  docId: string;
  questions?: any[];
  results?: any[];
}

export default function TestDetailScreen() {
  const route = useRoute<TestDetailScreenRouteProp>();
  const navigation = useNavigation<TestDetailScreenNavigationProp>();
  const { t, i18n } = useTranslation();
  const { testCode } = route.params;
  
  const [test, setTest] = useState<Test | null>(null);
  const [views, setViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestData();
    incrementViewCount();
  }, [testCode, i18n.language]);

  const loadTestData = async () => {
    try {
      const testData = getTestByCode(testCode, i18n.language);
      if (testData) {
        setTest(testData);
        
        // Firebase에서 실시간 조회수 가져오기
        const docRef = doc(db, "testStats", testData.docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setViews(data.views || testData.views);
        } else {
          setViews(testData.views);
        }
      }
    } catch (error) {
      console.error('테스트 데이터 로드 오류:', error);
      Alert.alert('오류', '테스트 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      const testData = getTestByCode(testCode, i18n.language);
      if (testData) {
        const docRef = doc(db, "testStats", testData.docId);
        await updateDoc(docRef, {
          views: increment(1)
        });
      }
    } catch (error) {
      console.warn('조회수 업데이트 실패:', error);
    }
  };

  const handleStartTest = () => {
    navigation.navigate('TestExecution', { testCode });
  };

  const formatViews = (viewCount: number): string => {
    if (viewCount >= 10000) {
      return `${(viewCount / 10000).toFixed(1)}만`;
    } else if (viewCount >= 1000) {
      return `${(viewCount / 1000).toFixed(1)}천`;
    } else {
      return `${viewCount}`;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('testDetail.loading')}</Text>
      </View>
    );
  }

  if (!test) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('testDetail.notFound')}</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{t('testDetail.backHome')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 헤더 이미지 */}
      <View style={styles.headerContainer}>
        {getThumbnailByCode(test.code) ? (
          <Image 
            source={getThumbnailByCode(test.code)} 
            style={styles.headerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.iconHeaderContainer}>
            <Text style={styles.headerIcon}>
              {typeof test.icon === "string" ? test.icon : "🧩"}
            </Text>
          </View>
        )}
        <View style={styles.headerOverlay}>
          <TouchableOpacity 
            style={styles.backButtonHeader} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonHeaderText}>← {t('testDetail.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 테스트 정보 */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{test.title}</Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.statsContainer}>
            <Text style={styles.viewsText}>🔥 {formatViews(views)}{t('testDetail.views')}</Text>
            <Text style={styles.questionsText}>
              📝 {test.questions?.length || 0}{t('testDetail.questions')}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{test.description}</Text>

        {/* 태그들 */}
        <View style={styles.tagsContainer}>
          {test.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* 테스트 시작 버튼 */}
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={handleStartTest}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>{t('testDetail.startTest')}</Text>
        </TouchableOpacity>

        {/* 테스트 정보 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>{t('testDetail.infoTitle')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('testDetail.category')}</Text>
            <Text style={styles.infoValue}>{test.category}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('testDetail.questionCount')}</Text>
            <Text style={styles.infoValue}>{test.questions?.length || 0}{t('testDetail.questions')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('testDetail.resultTypes')}</Text>
            <Text style={styles.infoValue}>{test.results?.length || 0}{t('testDetail.resultTypesCount')}</Text>
          </View>
        </View>

        {/* 댓글 섹션 */}
        <CommentsSection
          testCode={testCode}
          currentUserId={null} // 현재는 게스트 사용자로 처리
          currentUserName={null}
        />
      </View>
    </ScrollView>
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  iconHeaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerIcon: {
    fontSize: 64,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  backButtonHeader: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonHeaderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaContainer: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  questionsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#EC4899',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#EC4899',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
}); 