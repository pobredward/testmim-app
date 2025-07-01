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
// Haptics는 선택적으로 사용 (설치되어 있지 않으면 무시)
let Haptics: any;
try {
  Haptics = require('expo-haptics');
} catch {
  // expo-haptics가 설치되어 있지 않으면 더미 객체 사용
  Haptics = {
    notificationAsync: () => Promise.resolve(),
    impactAsync: () => Promise.resolve(),
    NotificationFeedbackType: { Success: 'success' },
    ImpactFeedbackStyle: { Heavy: 'heavy' },
  };
}
import { useTranslation } from 'react-i18next';
import { getExpToNextLevel, calculateExpProgress } from '../utils/expLevel';

const { width, height } = Dimensions.get('window');

interface LevelUpModalProps {
  isVisible: boolean;
  onClose: () => void;
  oldLevel: number;
  newLevel: number;
  expGained: number;
  currentExp: number;
}

export default function LevelUpModal({
  isVisible,
  onClose,
  oldLevel,
  newLevel,
  expGained,
  currentExp,
}: LevelUpModalProps) {
  const { t } = useTranslation();
  
  // 애니메이션 값들
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  
  // 컨텐츠 표시 상태
  const [showContent, setShowContent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // 햅틱 피드백 - 레벨업 성공
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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

      // 아이콘 애니메이션 (약간의 지연 후)
      setTimeout(() => {
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }).start();
      }, 200);

      // 축하 이펙트 (더 늦은 지연 후)
      setTimeout(() => {
        setShowConfetti(true);
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }, 500);

      // 자동 닫기 (6초 후)
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, 6000);

      return () => clearTimeout(autoCloseTimer);
    } else {
      // 초기화
      setShowContent(false);
      setShowConfetti(false);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      iconScaleAnim.setValue(0);
      confettiAnim.setValue(0);
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

  const confettiElements = Array.from({ length: 15 }, (_, i) => {
    const randomDelay = Math.random() * 500;
    const randomX = Math.random() * width;
    const randomRotation = Math.random() * 360;
    const icons = ['🎉', '⭐', '✨', '🎊', '🌟'];
    const icon = icons[i % icons.length];

    return (
      <Animated.View
        key={i}
        style={[
          styles.confettiItem,
          {
            left: randomX,
            transform: [
              {
                translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, height + 50],
                }),
              },
              {
                rotate: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${randomRotation}deg`],
                }),
              },
            ],
            opacity: confettiAnim.interpolate({
              inputRange: [0, 0.1, 0.9, 1],
              outputRange: [0, 1, 1, 0],
            }),
          },
        ]}
      >
        <Text style={styles.confettiText}>{icon}</Text>
      </Animated.View>
    );
  });

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

        {/* 축하 이펙트 */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {confettiElements}
          </View>
        )}

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

          {/* 레벨업 아이콘 */}
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
            <Text style={styles.iconText}>🎯</Text>
          </Animated.View>

          {/* 축하 메시지 */}
          <View style={styles.messageContainer}>
            <Text style={styles.titleText}>🎉 레벨업!</Text>
            <Text style={styles.subtitleText}>
              축하합니다! 새로운 레벨에 도달했습니다!
            </Text>
          </View>

          {/* 레벨 정보 */}
          <View style={styles.levelInfoContainer}>
            <View style={styles.levelComparisonContainer}>
              {/* 이전 레벨 */}
              <View style={styles.levelItem}>
                <View style={styles.oldLevelBadge}>
                  <Text style={styles.oldLevelText}>Lv.{oldLevel}</Text>
                </View>
                <Text style={styles.levelLabel}>이전</Text>
              </View>

              {/* 화살표 */}
              <Text style={styles.arrow}>→</Text>

              {/* 새 레벨 */}
              <View style={styles.levelItem}>
                <View style={styles.newLevelBadge}>
                  <Text style={styles.newLevelText}>Lv.{newLevel}</Text>
                </View>
                <Text style={styles.newLevelLabel}>새 레벨!</Text>
              </View>
            </View>

            {/* 경험치 정보 */}
            <View style={styles.expInfoContainer}>
              <View style={styles.expRow}>
                <Text style={styles.expLabel}>획득 경험치</Text>
                <Text style={styles.expGainedText}>+{expGained} EXP</Text>
              </View>
              
              {/* 새 레벨에서의 진행률 바 */}
              {(() => {
                const { currentLevelExp, expToNext, nextLevelRequirement } = getExpToNextLevel(currentExp, newLevel);
                const progress = calculateExpProgress(currentExp, newLevel);
                
                return (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressLabel}>{currentLevelExp} EXP</Text>
                      <Text style={styles.progressLabel}>{nextLevelRequirement} EXP</Text>
                    </View>
                    
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar,
                          { width: `${progress}%` }
                        ]}
                      />
                    </View>
                    
                    <View style={styles.progressDetails}>
                      <Text style={styles.progressDetailText}>
                        진행도: {progress.toFixed(1)}%
                      </Text>
                      <Text style={styles.progressDetailText}>
                        다음까지: {expToNext} EXP
                      </Text>
                    </View>
                  </View>
                );
              })()}
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
          <Text style={styles.autoCloseText}>6초 후 자동으로 닫힙니다</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiItem: {
    position: 'absolute',
    top: -50,
  },
  confettiText: {
    fontSize: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: width - 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#f59e0b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 32,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  levelInfoContainer: {
    width: '100%',
    marginBottom: 24,
  },
  levelComparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  levelItem: {
    alignItems: 'center',
  },
  oldLevelBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  oldLevelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  newLevelBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  newLevelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  levelLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  newLevelLabel: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
    color: '#8b5cf6',
    marginHorizontal: 20,
    fontWeight: 'bold',
  },
  expInfoContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  expRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  expGainedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDetailText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  continueButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  autoCloseText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
}); 