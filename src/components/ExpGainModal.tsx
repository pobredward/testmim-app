import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
// Haptics는 선택적으로 사용
let Haptics: any;
try {
  Haptics = require('expo-haptics');
} catch {
  Haptics = {
    notificationAsync: () => Promise.resolve(),
    impactAsync: () => Promise.resolve(),
    NotificationFeedbackType: { Success: 'success' },
    ImpactFeedbackStyle: { Medium: 'medium' },
  };
}
import { getExpToNextLevel, calculateExpProgress } from '../utils/expLevel';

const { width } = Dimensions.get('window');

interface ExpGainModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentLevel: number;
  currentExp: number;
  expGained: number;
}

export default function ExpGainModal({
  isVisible,
  onClose,
  currentLevel,
  currentExp,
  expGained,
}: ExpGainModalProps) {
  // 애니메이션 값들
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // 컨텐츠 표시 상태
  const [showContent, setShowContent] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // 이전 경험치와 현재 경험치 계산
  const previousExp = currentExp - expGained;
  const previousProgress = calculateExpProgress(previousExp, currentLevel);
  const currentProgress = calculateExpProgress(currentExp, currentLevel);
  
  const { currentLevelExp, expToNext, nextLevelRequirement } = getExpToNextLevel(currentExp, currentLevel);

  useEffect(() => {
    if (isVisible) {
      // 햅틱 피드백
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // 모달 열기 애니메이션
      setShowContent(true);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // 아이콘 애니메이션
      setTimeout(() => {
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }).start();
      }, 200);

      // 진행률 바 애니메이션
      setTimeout(() => {
        setShowProgress(true);
        Animated.timing(progressAnim, {
          toValue: currentProgress,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }, 800);

      // 자동 닫기 (4초 후)
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(autoCloseTimer);
    } else {
      // 초기화
      setShowContent(false);
      setShowProgress(false);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      iconScaleAnim.setValue(0);
      progressAnim.setValue(0);
    }
  }, [isVisible]);

  const handleClose = () => {
    // 닫기 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* 배경 */}
        <Animated.View 
          style={[
            styles.background,
            {
              opacity: fadeAnim,
            },
          ]}
        />

        {/* 모달 컨텐츠 */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* 닫기 버튼 */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* 경험치 아이콘 */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { scale: iconScaleAnim },
                ],
              },
            ]}
          >
            <Text style={styles.iconText}>💎</Text>
          </Animated.View>

          {/* 경험치 획득 메시지 */}
          <View style={styles.messageContainer}>
            <Text style={styles.titleText}>💫 경험치 획득!</Text>
            <Text style={styles.expGainedText}>+{expGained} EXP</Text>
          </View>

          {/* 레벨 및 진행률 정보 */}
          <View style={styles.levelInfoContainer}>
            {/* 현재 레벨 */}
            <View style={styles.currentLevelContainer}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv.{currentLevel}</Text>
              </View>
            </View>

            {/* 진행률 바 */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>{currentLevelExp} EXP</Text>
                <Text style={styles.progressLabel}>{nextLevelRequirement} EXP</Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground} />
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
              
              <View style={styles.progressDetails}>
                <Text style={styles.progressDetailText}>
                  진행도: {currentProgress.toFixed(1)}%
                </Text>
                <Text style={styles.progressDetailText}>
                  다음까지: {expToNext} EXP
                </Text>
              </View>
            </View>
          </View>

          {/* 액션 버튼 */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>계속하기</Text>
          </TouchableOpacity>

          {/* 자동 닫기 안내 */}
          <Text style={styles.autoCloseText}>4초 후 자동으로 닫힙니다</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: width - 40,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 36,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  expGainedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  levelInfoContainer: {
    width: '100%',
    marginBottom: 24,
  },
  currentLevelContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E5E7EB',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDetailText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  continueButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  autoCloseText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
}); 