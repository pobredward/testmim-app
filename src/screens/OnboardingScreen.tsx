import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { updateUserOnboarding, getUserFromFirestore } from '../utils/userAuth';
import { AuthUser } from '../services/socialAuth';
// import DateTimePicker from '@react-native-community/datetimepicker';

type RootStackParamList = {
  Home: undefined;
  Onboarding: undefined;
};

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    nickname: '',
    birthDate: '',
    gender: '',
    bio: '',
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 사용자 정보 로드
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
        navigation.navigate('Home');
        return;
      }

      const user: AuthUser = JSON.parse(userString);
      setCurrentUser(user);

      // Firebase에서 기존 사용자 정보 가져오기
      if (user.uid) {
        try {
          const userData = await getUserFromFirestore(user.uid);
          if (userData) {
            setFormData({
              nickname: userData.nickname || '',
              birthDate: userData.birthDate || '',
              gender: userData.gender || '',
              bio: userData.bio || '',
            });
            
            
          }
        } catch (error) {
          console.error('사용자 정보 로드 오류:', error);
        }
      }
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
      Alert.alert('오류', '사용자 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

    // 생년월일 자동 포맷팅 함수
  const formatBirthDate = (text: string) => {
    // 숫자만 추출
    const numbers = text.replace(/[^\d]/g, '');
    
    // 최대 8자리까지만 허용
    const limitedNumbers = numbers.slice(0, 8);
    
    // 자동 포맷팅
    if (limitedNumbers.length <= 4) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4)}`;
    } else {
      return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4, 6)}-${limitedNumbers.slice(6)}`;
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    } else if (formData.nickname.trim().length < 2) {
      newErrors.nickname = '닉네임은 2글자 이상이어야 합니다.';
    } else if (formData.nickname.trim().length > 20) {
      newErrors.nickname = '닉네임은 20글자 이하여야 합니다.';
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = '생년월일을 입력해주세요.';
    } else if (formData.birthDate.length < 10) {
      newErrors.birthDate = '생년월일을 완전히 입력해주세요. (8자리)';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.birthDate)) {
      newErrors.birthDate = '올바른 날짜 형식이 아닙니다.';
    } else {
      const inputDate = new Date(formData.birthDate);
      const today = new Date();
      const currentYear = today.getFullYear();
      const inputYear = inputDate.getFullYear();
      
      if (isNaN(inputDate.getTime())) {
        newErrors.birthDate = '존재하지 않는 날짜입니다.';
      } else if (inputDate > today) {
        newErrors.birthDate = '미래 날짜는 입력할 수 없습니다.';
      } else if (inputYear < 1900 || inputYear > currentYear) {
        newErrors.birthDate = '올바른 연도를 입력해주세요.';
      }
    }
    
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요.';
    }
    
    if (formData.bio.length > 100) {
      newErrors.bio = '자기소개는 100자 이하로 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !currentUser?.uid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateUserOnboarding(currentUser.uid, {
        nickname: formData.nickname.trim(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        bio: formData.bio.trim(),
      });
      
      // AsyncStorage의 사용자 정보 업데이트
      const updatedUser = {
        ...currentUser,
        nickname: formData.nickname.trim(),
        onboardingCompleted: true,
      };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      Alert.alert(
        '완료',
        '프로필 설정이 완료되었습니다!',
        [
          {
            text: '확인',
            onPress: () => navigation.navigate('Home', { onboardingCompleted: true } as any),
          },
        ]
      );
      
    } catch (error) {
      console.error('온보딩 저장 오류:', error);
      Alert.alert('오류', '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };



  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>프로필 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>프로필 설정</Text>
          <Text style={styles.subtitle}>
            테스트를 시작하기 전에 기본 정보를 입력해주세요.
          </Text>
        </View>

        <View style={styles.form}>
          {/* 닉네임 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>닉네임 *</Text>
            <TextInput
              style={[styles.input, errors.nickname ? styles.inputError : null]}
              value={formData.nickname}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, nickname: text }));
                if (errors.nickname) {
                  setErrors(prev => ({ ...prev, nickname: '' }));
                }
              }}
              placeholder="사용하실 닉네임을 입력해주세요"
              maxLength={20}
            />
            {errors.nickname ? (
              <Text style={styles.errorText}>{errors.nickname}</Text>
            ) : null}
          </View>

          {/* 생년월일 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>생년월일 *</Text>
            <TextInput
              style={[styles.input, errors.birthDate ? styles.inputError : null]}
              value={formData.birthDate}
              onChangeText={(text) => {
                const formattedDate = formatBirthDate(text);
                setFormData(prev => ({ ...prev, birthDate: formattedDate }));
                if (errors.birthDate) {
                  setErrors(prev => ({ ...prev, birthDate: '' }));
                }
              }}
              placeholder="생년월일을 입력해주세요 (예: 19900101)"
              maxLength={10}
              keyboardType="numeric"
            />
            {errors.birthDate ? (
              <Text style={styles.errorText}>{errors.birthDate}</Text>
            ) : null}
          </View>

          {/* 성별 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>성별 *</Text>
            <View style={styles.genderContainer}>
              {['male', 'female', 'other'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    formData.gender === gender ? styles.genderButtonSelected : null,
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, gender }));
                    if (errors.gender) {
                      setErrors(prev => ({ ...prev, gender: '' }));
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      formData.gender === gender ? styles.genderButtonTextSelected : null,
                    ]}
                  >
                    {gender === 'male' ? '남성' : gender === 'female' ? '여성' : '기타'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender ? (
              <Text style={styles.errorText}>{errors.gender}</Text>
            ) : null}
          </View>

          {/* 자기소개 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>자기소개</Text>
            <TextInput
              style={[styles.input, styles.bioInput, errors.bio ? styles.inputError : null]}
              value={formData.bio}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, bio: text }));
                if (errors.bio) {
                  setErrors(prev => ({ ...prev, bio: '' }));
                }
              }}
              placeholder="간단한 자기소개를 입력해주세요 (선택사항)"
              multiline
              numberOfLines={3}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{formData.bio.length}/100</Text>
            {errors.bio ? (
              <Text style={styles.errorText}>{errors.bio}</Text>
            ) : null}
          </View>

          {/* 제출 버튼 */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting ? styles.submitButtonDisabled : null]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>프로필 설정 완료</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>


    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF3B30',
  },

  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 