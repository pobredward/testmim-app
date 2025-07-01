import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { getExpRequiredForLevel } from '../utils/expLevel';

const { width } = Dimensions.get('window');

interface LevelProgressBarProps {
  currentExp: number;
  currentLevel: number;
}

export default function LevelProgressBar({ currentExp, currentLevel }: LevelProgressBarProps) {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [expForCurrentLevel, setExpForCurrentLevel] = useState(0);
  const [expForNextLevel, setExpForNextLevel] = useState(0);
  const [expNeededForNext, setExpNeededForNext] = useState(0);
  
  // 애니메이션 값 - useState로 관리하여 컴포넌트가 재렌더링되어도 값이 초기화되지 않도록 함
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // 현재 레벨까지 필요한 총 경험치 계산
    let totalExpForCurrentLevel = 0;
    for (let i = 1; i < currentLevel; i++) {
      totalExpForCurrentLevel += getExpRequiredForLevel(i + 1);
    }
    
    // 현재 레벨에서 사용된 경험치
    const usedExpInCurrentLevel = currentExp - totalExpForCurrentLevel;
    
    // 다음 레벨까지 필요한 경험치
    const nextLevelExp = getExpRequiredForLevel(currentLevel + 1);
    
    // 다음 레벨까지 남은 경험치
    const remainingExp = Math.max(0, nextLevelExp - usedExpInCurrentLevel);
    
    setExpForCurrentLevel(usedExpInCurrentLevel);
    setExpForNextLevel(nextLevelExp);
    setExpNeededForNext(remainingExp);
    
    // 진행률 계산 (0-100%)
    const progress = nextLevelExp > 0 ? (usedExpInCurrentLevel / nextLevelExp) * 100 : 0;
    const finalProgress = Math.min(100, Math.max(0, progress));
    setProgressPercentage(finalProgress);
    
    // 진행률 바 애니메이션
    Animated.timing(progressAnim, {
      toValue: finalProgress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [currentExp, currentLevel]);

  return (
    <View style={styles.container}>
      {/* 레벨 헤더 */}
      <View style={styles.headerContainer}>
        <View style={styles.levelInfoContainer}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>L</Text>
          </View>
          <View style={styles.levelTextContainer}>
            <Text style={styles.levelText}>레벨 {currentLevel}</Text>
            <Text style={styles.expText}>총 {currentExp.toLocaleString()} EXP</Text>
          </View>
        </View>
        
        {/* 다음 레벨 */}
        <View style={styles.nextLevelContainer}>
          <View style={styles.nextLevelBadge}>
            <Text style={styles.nextLevelText}>{currentLevel + 1}</Text>
          </View>
          <Text style={styles.nextLevelLabel}>다음 레벨</Text>
        </View>
      </View>

      {/* 진행률 바 섹션 */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressInfoText}>{expForCurrentLevel} EXP</Text>
          <Text style={styles.progressInfoText}>{expForNextLevel} EXP</Text>
        </View>
        
        {/* 진행률 바 */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
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
        </View>
        
        <View style={styles.progressDetails}>
          <Text style={styles.progressDetailText}>
            진행도: {progressPercentage.toFixed(1)}%
          </Text>
          <Text style={styles.progressDetailText}>
            다음 레벨까지: {expNeededForNext} EXP
          </Text>
        </View>
      </View>

      {/* 레벨업 정보 카드 */}
      <View style={styles.levelUpCard}>
        <View style={styles.levelUpInfo}>
          <View style={styles.levelUpIconContainer}>
            <Text style={styles.levelUpIcon}>⭐</Text>
            <Text style={styles.levelUpLabel}>레벨업까지</Text>
          </View>
          <View style={styles.levelUpValueContainer}>
            <Text style={styles.levelUpValue}>{expNeededForNext} EXP</Text>
            <Text style={styles.levelUpMessage}>
              {expNeededForNext <= 10 ? '거의 다 왔어요!' : '화이팅! 💪'}
            </Text>
          </View>
        </View>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: width - 32, // 화면 너비에서 좌우 마진 제외
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // flex 컨테이너에서 텍스트 잘림 방지
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  levelBadgeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelTextContainer: {
    flex: 1,
    minWidth: 0, // flex에서 텍스트 ellipsis 적용을 위해 필요
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  expText: {
    fontSize: 13,
    color: '#6b7280',
  },
  nextLevelContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  nextLevelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  nextLevelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  nextLevelLabel: {
    fontSize: 9,
    color: '#9ca3af',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  progressInfoText: {
    fontSize: 11,
    color: '#6b7280',
    flex: 1,
    textAlign: 'left',
  },
  progressBarContainer: {
    marginBottom: 6,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 5,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  progressDetailText: {
    fontSize: 9,
    color: '#6b7280',
    flex: 1,
  },
  levelUpCard: {
    backgroundColor: '#f3f0ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  levelUpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelUpIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  levelUpIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  levelUpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
    flex: 1,
  },
  levelUpValueContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  levelUpValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 1,
  },
  levelUpMessage: {
    fontSize: 9,
    color: '#a855f7',
  },
}); 