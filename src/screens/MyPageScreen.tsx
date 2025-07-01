import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SocialAuthService, AuthUser } from '../services/socialAuth';
import { getUserFromFirestore, updateUserProfile } from '../utils/userAuth';
import LevelProgressBar from '../components/LevelProgressBar';
import ExpGuideModal from '../components/ExpGuideModal';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  TestDetail: { testCode: string };
};

type MyPageScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  nickname: string | null;
  image: string | null;
  provider: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  createdAt?: { seconds: number };
  onboardingCompleted?: boolean;
}

interface TestResult {
  id: string;
  testCode: string;
  testTitle: string;
  resultTitle: string;
  shareUrl: string;
  createdAt: Date;
}

export default function MyPageScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<MyPageScreenNavigationProp>();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExpGuideOpen, setIsExpGuideOpen] = useState(false);
  
  // 경험치/레벨 상태
  const [userLevel, setUserLevel] = useState(1);
  const [userExp, setUserExp] = useState(0);
  const [expLoading, setExpLoading] = useState(true);
  const [editFormData, setEditFormData] = useState({
    nickname: '',
    bio: '',
    birthDate: '',
    gender: undefined as 'male' | 'female' | 'other' | undefined,
  });

  // 사용자 정보 로드
  const loadUserData = useCallback(async () => {
    try {
      const currentUser = await SocialAuthService.getCurrentUser();
      if (!currentUser) {
        navigation.replace('Login');
        return;
      }

      setUser(currentUser);

      // Firestore에서 상세 사용자 정보 가져오기
      const userData = await getUserFromFirestore(currentUser.uid);
      if (userData) {
        setUserProfile(userData as UserProfile);
        setEditFormData({
          nickname: userData.nickname || '',
          bio: userData.bio || '',
          birthDate: userData.birthDate || '',
          gender: (userData.gender === 'male' || userData.gender === 'female' || userData.gender === 'other') 
            ? userData.gender 
            : undefined,
        });
        
        // 경험치/레벨 정보 설정
        setUserLevel(userData.level || 1);
        setUserExp(userData.exp || 0);
      }

      // TODO: 테스트 결과 로드 (현재는 Mock 데이터)
      setTestResults([]);
      
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
      Alert.alert('오류', '사용자 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setExpLoading(false);
    }
  }, [navigation]);

  // 화면 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  // 새로고침
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, [loadUserData]);

  // 로그아웃
  const handleLogout = () => {
    Alert.alert(
      t('mypage.logout.title'),
      t('mypage.logout.message'),
      [
        { text: t('mypage.logout.cancel'), style: 'cancel' },
        {
          text: t('mypage.logout.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await SocialAuthService.signOut();
              navigation.replace('Login');
            } catch (error) {
              console.error('로그아웃 오류:', error);
            }
          },
        },
      ]
    );
  };

  // 프로필 수정 저장
  const handleSaveProfile = async () => {
    if (!userProfile) return;

    try {
      await updateUserProfile(userProfile.uid, {
        nickname: editFormData.nickname,
        bio: editFormData.bio,
        birthDate: editFormData.birthDate,
        gender: editFormData.gender,
      });

      // 로컬 상태 업데이트
      setUserProfile(prev => prev ? {
        ...prev,
        nickname: editFormData.nickname,
        bio: editFormData.bio,
        birthDate: editFormData.birthDate,
        gender: editFormData.gender as 'male' | 'female' | 'other' | undefined,
      } : null);

      setIsEditModalOpen(false);
      Alert.alert('성공', '프로필이 수정되었습니다.');
    } catch (error) {
      console.error('프로필 수정 오류:', error);
      Alert.alert('오류', '프로필 수정 중 오류가 발생했습니다.');
    }
  };

  // 나이 계산
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 성별 텍스트
  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male': return t('mypage.gender.male');
      case 'female': return t('mypage.gender.female');
      case 'other': return t('mypage.gender.other');
      default: return t('mypage.gender.notSet');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>{t('mypage.loading')}</Text>
      </View>
    );
  }

  if (!user || !userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>사용자 정보를 불러올 수 없습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const age = userProfile.birthDate ? calculateAge(userProfile.birthDate) : null;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('mypage.title')}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>{t('mypage.logout.title')}</Text>
        </TouchableOpacity>
      </View>

      {/* 프로필 정보 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('mypage.profileInfo')}</Text>
        <View style={styles.profileCard}>
          {userProfile.image && (
            <Image source={{ uri: userProfile.image }} style={styles.profileImage} />
          )}
          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.profileName}>
                {userProfile.nickname || userProfile.name || t('mypage.values.noName')}
              </Text>
              {userProfile.nickname && userProfile.name && (
                <Text style={styles.realName}>({userProfile.name})</Text>
              )}
            </View>
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
            <Text style={styles.providerText}>
              {userProfile.provider} {t('mypage.loginWith')}
            </Text>
          </View>
        </View>
      </View>

      {/* 레벨 & 경험치 섹션 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>레벨 & 경험치</Text>
          <TouchableOpacity 
            onPress={() => setIsExpGuideOpen(true)}
            style={styles.guideButton}
          >
            <Text style={styles.guideButtonIcon}>💡</Text>
            <Text style={styles.guideButtonText}>가이드</Text>
          </TouchableOpacity>
        </View>
        {expLoading ? (
          <View style={styles.levelLoadingContainer}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={styles.levelLoadingText}>경험치 정보를 불러오는 중...</Text>
          </View>
        ) : (
          <LevelProgressBar currentExp={userExp} currentLevel={userLevel} />
        )}
      </View>

      {/* 상세 정보 섹션 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('mypage.detailInfo')}</Text>
          <TouchableOpacity onPress={() => setIsEditModalOpen(true)}>
            <Text style={styles.editButton}>{t('mypage.edit')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailGrid}>
          {/* 닉네임 */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('mypage.fields.nickname')}</Text>
            <Text style={styles.detailValue}>
              {userProfile.nickname || t('mypage.values.notSet')}
            </Text>
          </View>

          {/* 나이/생년월일 */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('mypage.fields.age')}</Text>
            <Text style={styles.detailValue}>
              {age ? `${age}${t('mypage.values.years')}` : t('mypage.values.notSet')}
              {userProfile.birthDate && (
                <Text style={styles.birthDateText}>
                  {'\n'}({new Date(userProfile.birthDate).toLocaleDateString()})
                </Text>
              )}
            </Text>
          </View>

          {/* 성별 */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('mypage.fields.gender')}</Text>
            <Text style={styles.detailValue}>
              {userProfile.gender ? getGenderText(userProfile.gender) : t('mypage.values.notSet')}
            </Text>
          </View>

          {/* 가입일 */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('mypage.fields.joinDate')}</Text>
            <Text style={styles.detailValue}>
              {userProfile.createdAt 
                ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString()
                : t('mypage.values.noInfo')
              }
            </Text>
          </View>
        </View>

        {/* 한줄소개 */}
        {userProfile.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.detailLabel}>{t('mypage.fields.bio')}</Text>
            <Text style={styles.bioText}>{userProfile.bio}</Text>
          </View>
        )}
      </View>

      {/* 테스트 결과 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('mypage.testResults')}</Text>
        {testResults.length === 0 ? (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>아직 완료한 테스트가 없어요</Text>
            <Text style={styles.emptyDescription}>다양한 테스트에 참여해보세요!</Text>
            <TouchableOpacity 
              style={styles.goToTestButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.goToTestButtonText}>테스트 하러 가기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.testResultsList}>
            {/* TODO: 테스트 결과 목록 구현 */}
          </View>
        )}
      </View>

      {/* 안내 메시지 */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ <Text style={styles.infoTitle}>{t('mypage.privacy.title')}</Text>{'\n'}
          {t('mypage.privacy.description')}
        </Text>
      </View>

      {/* 프로필 수정 모달 */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
              <Text style={styles.modalCancelButton}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>프로필 수정</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.modalSaveButton}>저장</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 닉네임 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>닉네임</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.nickname}
                onChangeText={(text) => setEditFormData(prev => ({ ...prev, nickname: text }))}
                placeholder="닉네임을 입력하세요"
              />
            </View>

            {/* 한줄소개 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>한줄소개</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.bio}
                onChangeText={(text) => setEditFormData(prev => ({ ...prev, bio: text }))}
                placeholder="자신을 소개해보세요"
                multiline
              />
            </View>

            {/* 생년월일 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>생년월일</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.birthDate}
                onChangeText={(text) => setEditFormData(prev => ({ ...prev, birthDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* 성별 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>성별</Text>
              <View style={styles.genderContainer}>
                {(['male', 'female', 'other'] as const).map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      editFormData.gender === gender && styles.genderOptionSelected
                    ]}
                    onPress={() => setEditFormData(prev => ({ ...prev, gender }))}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      editFormData.gender === gender && styles.genderOptionTextSelected
                    ]}>
                      {getGenderText(gender)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 경험치 가이드 모달 */}
      <ExpGuideModal 
        isVisible={isExpGuideOpen}
        onClose={() => setIsExpGuideOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  editButton: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  realName: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  profileEmail: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  providerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  birthDateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bioContainer: {
    marginTop: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 48,
    marginHorizontal: 4,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  goToTestButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goToTestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testResultsList: {
    // TODO: 테스트 결과 목록 스타일
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  infoTitle: {
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelButton: {
    color: '#6B7280',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSaveButton: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#1F2937',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
  },
  // 레벨/경험치 섹션 스타일
  levelLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  levelLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  guideButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  guideButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
}); 