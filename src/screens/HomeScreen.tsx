import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SocialAuthService, AuthUser } from '../services/socialAuth';
import { getThumbnailByCode } from '../constants/thumbnails';
import LanguageSelector from '../components/LanguageSelector';
import ProfileDropdown from '../components/ProfileDropdown';

type RootStackParamList = {
  Home: undefined;
  TestDetail: { testCode: string };
  Login: undefined;
  Games: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
import { db } from '../services/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { getAllTests } from '../data';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 양쪽 패딩 16, 중간 간격 16

interface Test {
  code: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  views: number;
  thumbnailUrl?: string;
  icon?: string;
  isNew?: boolean;
  docId: string;
}

interface Stats {
  [code: string]: { views: number };
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute();
  const [tests, setTests] = useState<Test[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [user, setUser] = useState<AuthUser | null>(null);

  // 언어 변경 시 테스트 데이터 업데이트
  useEffect(() => {
    console.log('🌍 Language changed to:', i18n.language);
    const allTests = getAllTests(i18n.language);
    console.log('📚 Loaded tests:', allTests.length);
    setTests(allTests);
  }, [i18n.language]);

  // 사용자 상태 확인 함수
  const checkUserStatus = useCallback(async () => {
    try {
      const currentUser = await SocialAuthService.getCurrentUser();
      console.log('🔍 현재 사용자 상태 확인:', currentUser);
      setUser(currentUser);
    } catch (error) {
      console.error('❌ 사용자 상태 확인 오류:', error);
      setUser(null);
    }
  }, []);

  // 화면 포커스 시마다 사용자 상태 확인
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 HomeScreen 포커스됨 - 사용자 상태 확인');
      checkUserStatus();
    }, [checkUserStatus])
  );

  // 로그인 성공 또는 온보딩 완료 후 HomeScreen으로 돌아온 경우 처리
  useEffect(() => {
    const params = route.params as any;
    if (params?.loginSuccess) {
      console.log('🎉 로그인 성공으로 HomeScreen 돌아옴 - 사용자 상태 다시 확인');
      checkUserStatus();
      // params 초기화 (중복 실행 방지)
      navigation.setParams({ loginSuccess: undefined } as any);
    } else if (params?.onboardingCompleted) {
      console.log('✅ 온보딩 완료로 HomeScreen 돌아옴 - 사용자 상태 다시 확인');
      checkUserStatus();
      // params 초기화 (중복 실행 방지)
      navigation.setParams({ onboardingCompleted: undefined } as any);
    }
  }, [route.params, checkUserStatus, navigation]);

  // 숫자 포맷팅 함수
  const formatViews = (views: number): string => {
    if (views >= 10000) {
      return `${(views / 10000).toFixed(1)}만`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}천`;
    } else {
      return `${views}`;
    }
  };

  // Firebase에서 통계 데이터 가져오기
  useEffect(() => {
    async function fetchStats() {
      try {
        const updates: Stats = {};
        await Promise.all(
          tests.map(async (test) => {
            try {
              const docRef = doc(db, "testStats", test.docId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const data = docSnap.data();
                updates[test.code] = {
                  views: data.views ?? test.views,
                };
              } else {
                updates[test.code] = {
                  views: test.views,
                };
              }
            } catch (error) {
              console.warn(`Failed to fetch stats for ${test.code}:`, error);
              updates[test.code] = { views: test.views };
            }
          })
        );
        setStats(updates);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }
    
    if (tests.length > 0) {
      fetchStats();
    }
  }, [tests]);

  // 카테고리별 배경색
  const CATEGORY_COLORS: Record<string, string> = {
    "자아": "#FDF2F8", // pink-50
    "밈": "#FEF3C7",   // yellow-100
    "연애": "#FCE7F3", // pink-100
    "게임": "#EFF6FF", // blue-50
  };

  // 카테고리 레이블 가져오기
  const getCategoryLabel = (category: string) => {
    // 먼저 다국어 번역을 시도
    const translatedCategory = t(`categories.${category}`);
    
    // 번역이 키 그대로 반환되면 (번역이 없으면) 기본값 사용
    if (translatedCategory === `categories.${category}`) {
      const fallbackLabels: Record<string, string> = {
        "자아": "🧠 자아 탐구",
        "밈": "🤪 밈 테스트",
        "연애": "💘 연애 테스트",
        "게임": "🎮 게임 테스트",
      };
      return fallbackLabels[category] || category;
    }
    
    return translatedCategory;
  };

  // 카테고리별로 테스트 그룹화
  const testsByCategory = tests.reduce((acc, test) => {
    if (!test.category) return acc;
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, Test[]>);

  // "자아" 카테고리에서 politics를 항상 맨 앞으로 정렬
  if (testsByCategory["자아"]) {
    testsByCategory["자아"].sort((a, b) => {
      if (a.code === "politics") return -1;
      if (b.code === "politics") return 1;
      return 0;
    });
  }

  // 카테고리 순서 정의
  const CATEGORY_ORDER = ["밈", "자아", "연애", "게임"];

  // 뱃지 컴포넌트
  const getBadge = (test: Test) => {
    const currentViews = stats[test.code]?.views ?? test.views;
    if (currentViews > 50) {
      return (
        <View style={styles.badgePopular}>
          <Text style={styles.badgeText}>{t('badges.popular')}</Text>
        </View>
      );
    }
    if (test.isNew) {
      return (
        <View style={styles.badgeNew}>
          <Text style={styles.badgeText}>{t('badges.new')}</Text>
        </View>
      );
    }
    return null;
  };

  // 테스트 카드 컴포넌트
  const TestCard = ({ test }: { test: Test }) => {
    const handlePress = () => {
      navigation.navigate('TestDetail', { testCode: test.code });
    };

    return (
      <TouchableOpacity 
        style={styles.testCard} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {getBadge(test)}
        
        {/* 썸네일 영역 */}
        <View style={styles.thumbnailContainer}>
          {getThumbnailByCode(test.code) ? (
            <Image 
              source={getThumbnailByCode(test.code)} 
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>
                {typeof test.icon === "string" ? test.icon : "🧩"}
              </Text>
            </View>
          )}
        </View>

        {/* 내용 영역 */}
        <View style={styles.cardContent}>
          <Text style={styles.testTitle} numberOfLines={2}>
            {test.title}
          </Text>
          
          {/* 태그들 */}
          <View style={styles.tagsContainer}>
            {test.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
          
          {/* 조회수 */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              🔥 {formatViews(stats[test.code]?.views ?? test.views)}회
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 네온 배너 컴포넌트
  const NeonBanner = () => (
    <View style={styles.neonBanner}>
              <Text style={styles.neonText}>✨ {t('common.welcome')} ✨</Text>
    </View>
  );

  // 헤더 (웹과 동일한 구조)
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerContainer}>
        {/* 왼쪽 영역: 로고 + 제목 */}
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.7}
          >
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoTitle}>{t('header.siteName')}</Text>
          </TouchableOpacity>
        </View>
        
        {/* 오른쪽 영역: 언어 선택기 + 프로필 */}
        <View style={styles.rightSection}>
          <LanguageSelector />
          <ProfileDropdown 
            user={user} 
            onUserChange={setUser}
          />
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header />
      <NeonBanner />
      
      <Text style={styles.description}>
        {t('home.description')}
      </Text>

      {/* 미니게임 버튼 */}
      <TouchableOpacity 
        style={styles.miniGameCard}
        onPress={() => navigation.navigate('Games')}
        activeOpacity={0.8}
      >
        <View style={styles.miniGameContent}>
          <View style={styles.miniGameLeft}>
            <Text style={styles.miniGameIcon}>🎮</Text>
            <View style={styles.miniGameTextContainer}>
              <Text style={styles.miniGameTitle}>미니게임</Text>
              <Text style={styles.miniGameDescription}>재미있는 게임으로 경험치를 획득하세요!</Text>
            </View>
          </View>
          <View style={styles.miniGameRight}>
            <Text style={styles.playText}>지금 플레이</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </View>
        </View>
      </TouchableOpacity>

      {CATEGORY_ORDER.map(category => 
        testsByCategory[category]?.length > 0 && (
          <View 
            key={category} 
            style={[
              styles.categorySection, 
              { backgroundColor: CATEGORY_COLORS[category] || '#F9FAFB' }
            ]}
          >
            <Text style={styles.categoryTitle}>
              {getCategoryLabel(category)}
            </Text>
            
            <FlatList
              data={testsByCategory[category]}
              renderItem={({ item }) => <TestCard test={item} />}
              keyExtractor={(item) => item.code}
              numColumns={2}
              columnWrapperStyle={styles.cardRow}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>
        )
      )}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('home.footer.copyright')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  neonBanner: {
    margin: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#EC4899',
    shadowColor: '#EC4899',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  neonText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    marginHorizontal: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  categorySection: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  cardRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  testCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 200,
  },
  badgePopular: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EC4899',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeNew: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  thumbnailContainer: {
    width: '100%',
    height: 80,
    backgroundColor: '#F3F4F6',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  iconText: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 44, // status bar 고려
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniGameCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  miniGameContent: {
    backgroundColor: '#8b5cf6',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniGameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniGameIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  miniGameTextContainer: {
    flex: 1,
  },
  miniGameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  miniGameDescription: {
    fontSize: 14,
    color: '#e9d5ff',
    lineHeight: 20,
  },
  miniGameRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playText: {
    fontSize: 14,
    color: '#e9d5ff',
    marginRight: 8,
  },
  arrowIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
}); 