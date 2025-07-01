import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocialAuthService, AuthUser } from '../services/socialAuth';
import { getGameById } from '../data/games';
import { GameResult, ReactionGameResult } from '../types/games';
import { saveGameResult } from '../utils/gameUtils';
import { giveExpForMiniGameCompletion } from '../utils/expLevel';
import { getUserFromFirestore } from '../utils/userAuth';
import LevelUpModal from '../components/LevelUpModal';
import ExpGainModal from '../components/ExpGainModal';

// Optional haptic feedback import
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (error) {
  // Haptics not available
}

const { width, height } = Dimensions.get('window');

type GameState = 'ready' | 'waiting' | 'react' | 'too-early' | 'result';

interface AttemptResult {
  time: number;
  round: number;
}

interface ReactionTimeGameScreenProps {
  navigation: any;
  route: {
    params: {
      gameId: string;
    };
  };
}

export default function ReactionTimeGameScreen({ navigation, route }: ReactionTimeGameScreenProps) {
  const { gameId } = route.params;
  const [user, setUser] = useState<AuthUser | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentRound, setCurrentRound] = useState(1);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 모달 관련 상태
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showExpGainModal, setShowExpGainModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState({
    oldLevel: 1,
    newLevel: 1,
    expGained: 0,
    currentExp: 0,
  });
  const [expGainData, setExpGainData] = useState({
    currentLevel: 1,
    currentExp: 0,
    expGained: 0,
  });
  
  const gameData = getGameById(gameId);
  const totalRounds = 3;

  // Load best time from AsyncStorage
  useEffect(() => {
    const loadBestTime = async () => {
      try {
        const saved = await AsyncStorage.getItem(`${gameId}-best`);
        if (saved) {
          setBestTime(parseInt(saved));
        }
      } catch (error) {
        console.log('Failed to load best time:', error);
      }
    };
    loadBestTime();
  }, [gameId]);

  // Check if user is logged in (but allow playing without login)
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await SocialAuthService.getCurrentUser();
      setUser(currentUser);
    };
    checkUser();
  }, []);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Haptics?.impactAsync) {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    }
  }, []);

  const startGame = useCallback(() => {
    if (gameState !== 'ready') return;
    
    triggerHaptic('light');
    setGameState('waiting');
    
    // Animate to waiting state
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    const randomDelay = Math.random() * 3000 + 2000; // 2-5 seconds
    
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = Date.now();
      setGameState('react');
      triggerHaptic('medium');
      
      // Animate to react state
      Animated.timing(animatedValue, {
        toValue: 2,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, randomDelay);
  }, [gameState, animatedValue, triggerHaptic]);

  const handleTouch = useCallback(() => {
    if (gameState === 'waiting') {
      // Too early touch
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      triggerHaptic('heavy');
      setGameState('too-early');
      
      // Reset animation
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      return;
    }
    
    if (gameState === 'react') {
      const reactionTime = Date.now() - startTimeRef.current;
      setCurrentTime(reactionTime);
      triggerHaptic('medium');
      
      const newAttempt: AttemptResult = {
        time: reactionTime,
        round: currentRound,
      };
      
      setAttempts(prev => [...prev, newAttempt]);
      
      // Reset animation
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
      if (currentRound >= totalRounds) {
        setGameState('result');
      } else {
        setCurrentRound(prev => prev + 1);
        setGameState('ready');
      }
    }
  }, [gameState, currentRound, totalRounds, animatedValue, triggerHaptic]);

  const resetGame = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setGameState('ready');
    setCurrentRound(1);
    setAttempts([]);
    setCurrentTime(null);
    animatedValue.setValue(0);
  };

  const tryAgain = () => {
    setGameState('ready');
    animatedValue.setValue(0);
  };

  const calculateResults = () => {
    if (attempts.length === 0) return null;
    
    const times = attempts.map(a => a.time);
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const bestAttempt = Math.min(...times);
    const accuracy = 100; // Since we completed all rounds
    
    return {
      attempts: times,
      averageTime: Math.round(averageTime),
      bestTime: bestAttempt,
      accuracy,
    };
  };

  const getScoreFromAverage = (avgTime: number): number => {
    if (avgTime < 250) return 100;
    if (avgTime < 300) return 90;
    if (avgTime < 400) return 80;
    if (avgTime < 500) return 70;
    if (avgTime < 600) return 60;
    if (avgTime < 800) return 50;
    return 40;
  };

  const getRating = (avgTime: number): string => {
    if (avgTime < 250) return '🔥 놀라운 반사신경!';
    if (avgTime < 300) return '⚡ 매우 빠름!';
    if (avgTime < 400) return '🎯 빠름';
    if (avgTime < 500) return '👍 평균 이상';
    if (avgTime < 600) return '👌 평균';
    return '🐌 연습이 필요해요';
  };

  const saveResult = async () => {
    if (!user?.uid || attempts.length === 0) return;
    
    const results = calculateResults();
    if (!results) return;
    
    setLoading(true);
    
    try {
      const score = getScoreFromAverage(results.averageTime);
      const expGained = score >= 70 ? 10 : 5; // Higher EXP for good performance
      
      // Check if this is a personal best
      let isNewPersonalBest = false;
      if (!bestTime || results.bestTime < bestTime) {
        setBestTime(results.bestTime);
        isNewPersonalBest = true;
        try {
          await AsyncStorage.setItem(`${gameId}-best`, results.bestTime.toString());
        } catch (error) {
          console.log('Failed to save best time:', error);
        }
      }
      
      const gameResult: GameResult = {
        gameId,
        userId: user.uid,
        score: results.averageTime,
        details: results,
        experienceGained: expGained,
        completedAt: new Date().toISOString(),
        duration: 60, // Estimated game duration
      };
      
      // Save to Firebase
      await saveGameResult(gameResult);
      
      console.log('Game result saved:', gameResult);

      // 미니게임 완료시 경험치 지급
      try {
        // 현재 사용자 데이터 조회
        const currentUserData = await getUserFromFirestore(user.uid);
        
        // 미니게임 완료 경험치 지급
        const levelUpResult = await giveExpForMiniGameCompletion(
          user.uid,
          gameId,
          results.averageTime,
          isNewPersonalBest,
          currentUserData || undefined
        );
        
        console.log('✅ 미니게임 경험치 지급 완료:', levelUpResult);
        
        // 레벨업했다면 레벨업 모달 표시
        if (levelUpResult.leveledUp) {
          setLevelUpData({
            oldLevel: levelUpResult.oldLevel,
            newLevel: levelUpResult.newLevel,
            expGained: levelUpResult.expGained,
            currentExp: levelUpResult.totalExp,
          });
          
          // 결과 페이지가 완전히 로드된 후 모달 표시
          setTimeout(() => {
            setShowLevelUpModal(true);
          }, 1500);
        } else if (levelUpResult.expGained > 0) {
          // 레벨업은 없지만 경험치를 획득한 경우 경험치 획득 모달 표시
          setExpGainData({
            currentLevel: levelUpResult.newLevel,
            currentExp: levelUpResult.totalExp,
            expGained: levelUpResult.expGained,
          });
          
          // 결과 페이지가 완전히 로드된 후 모달 표시
          setTimeout(() => {
            setShowExpGainModal(true);
          }, 1500);
        }
      } catch (expError) {
        console.error('미니게임 경험치 지급 오류:', expError);
        // 경험치 지급 실패해도 게임 결과는 정상 표시
      }
      
    } catch (error) {
      console.error('Failed to save game result:', error);
      Alert.alert('오류', '게임 결과 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameState === 'result' && attempts.length === totalRounds && user) {
      saveResult();
    }
  }, [gameState, attempts.length, totalRounds, user]);

  const getGameAreaStyle = () => {
    const backgroundColor = animatedValue.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ['#f3f4f6', '#ef4444', '#22c55e'], // gray -> red -> green
      extrapolate: 'clamp',
    });

    return [
      styles.gameArea,
      {
        backgroundColor,
        transform: [
          {
            scale: animatedValue.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [1, 0.95, 1.05],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
    ];
  };

  const getGameAreaText = () => {
    switch (gameState) {
      case 'ready':
        return `라운드 ${currentRound}/${totalRounds}\n터치하여 시작`;
      case 'waiting':
        return '기다리세요...';
      case 'react':
        return '지금 터치!';
      case 'too-early':
        return '너무 빨라요!\n다시 시도하세요';
      default:
        return '';
    }
  };

  if (gameState === 'result') {
    const results = calculateResults();
    if (!results) return null;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
          
          <Text style={styles.gameIcon}>⚡</Text>
          <Text style={styles.headerTitle}>게임 완료!</Text>
          <Text style={styles.headerSubtitle}>
            {getRating(results.averageTime)}
          </Text>
        </View>

        {/* Results Card */}
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>게임 결과</Text>
          
          <View style={styles.resultsGrid}>
            <View style={[styles.resultItem, { backgroundColor: '#dbeafe' }]}>
              <Text style={[styles.resultValue, { color: '#2563eb' }]}>
                {results.averageTime}ms
              </Text>
              <Text style={[styles.resultLabel, { color: '#1d4ed8' }]}>평균 반응시간</Text>
            </View>
            
            <View style={[styles.resultItem, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.resultValue, { color: '#16a34a' }]}>
                {results.bestTime}ms
              </Text>
              <Text style={[styles.resultLabel, { color: '#15803d' }]}>최고 기록</Text>
            </View>
          </View>

          {/* Attempt Details */}
          <View style={styles.attemptsSection}>
            <Text style={styles.attemptsTitle}>시도 기록</Text>
            {attempts.map((attempt, index) => (
              <View key={index} style={styles.attemptItem}>
                <Text style={styles.attemptRound}>라운드 {attempt.round}</Text>
                <Text style={[
                  styles.attemptTime,
                  attempt.time === results.bestTime && styles.bestAttemptTime
                ]}>
                  {attempt.time}ms
                  {attempt.time === results.bestTime && ' 🏆'}
                </Text>
              </View>
            ))}
          </View>

          {/* Personal Best */}
          {bestTime && (
            <View style={styles.personalBest}>
              <Text style={styles.personalBestTitle}>
                개인 최고 기록: {bestTime}ms
              </Text>
              {results.bestTime === bestTime && (
                <Text style={styles.newRecordText}>
                  🎉 새로운 개인 기록 달성!
                </Text>
              )}
            </View>
          )}

          {/* Experience Points / Login Prompt */}
          {user ? (
            <View style={styles.expSection}>
              <Text style={styles.expText}>
                💎 +{getScoreFromAverage(results.averageTime) >= 70 ? 10 : 5} EXP 획득!
              </Text>
              <Text style={styles.expSubtext}>
                좋은 기록일수록 더 많은 경험치를 얻어요
              </Text>
            </View>
          ) : (
            <View style={styles.loginPromptSection}>
              <Text style={styles.loginPromptTitle}>
                🔒 게임 기록을 저장하고 경험치를 얻으려면 로그인하세요
              </Text>
              <Text style={styles.loginPromptSubtext}>
                로그인하면 기록 저장, 경험치 획득, 랭킹 참여가 가능해요!
              </Text>
              <TouchableOpacity 
                style={styles.loginPromptButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginPromptButtonText}>로그인하러 가기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={resetGame}
          >
            <Text style={styles.primaryButtonText}>다시 플레이</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>다른 게임 플레이</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  }

  return (
    <>
      {/* 레벨업 모달 */}
      <LevelUpModal
        isVisible={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        oldLevel={levelUpData.oldLevel}
        newLevel={levelUpData.newLevel}
        expGained={levelUpData.expGained}
        currentExp={levelUpData.currentExp}
      />
      
      {/* 경험치 획득 모달 */}
      <ExpGainModal
        isVisible={showExpGainModal}
        onClose={() => setShowExpGainModal(false)}
        currentLevel={expGainData.currentLevel}
        currentExp={expGainData.currentExp}
        expGained={expGainData.expGained}
      />

      <View style={styles.container}>
        {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        
        <Text style={styles.gameIcon}>⚡</Text>
        <Text style={styles.headerTitle}>
          {gameData?.title || '반응속도 게임'}
        </Text>
        <Text style={styles.headerSubtitle}>
          초록색으로 바뀌는 순간 빠르게 터치하세요!
        </Text>
      </View>

      {/* Game Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>게임 방법</Text>
        <View style={styles.instructionsList}>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionBadge, { backgroundColor: '#f3f4f6' }]}>
              <Text style={styles.instructionNumber}>1</Text>
            </View>
            <Text style={styles.instructionText}>아래 영역을 터치하여 게임을 시작하세요</Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionBadge, { backgroundColor: '#ef4444' }]}>
              <Text style={[styles.instructionNumber, { color: '#ffffff' }]}>2</Text>
            </View>
            <Text style={styles.instructionText}>빨간색일 때는 기다리세요</Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionBadge, { backgroundColor: '#22c55e' }]}>
              <Text style={[styles.instructionNumber, { color: '#ffffff' }]}>3</Text>
            </View>
            <Text style={styles.instructionText}>초록색으로 바뀌는 순간 빠르게 터치!</Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={[styles.instructionBadge, { backgroundColor: '#3b82f6' }]}>
              <Text style={[styles.instructionNumber, { color: '#ffffff' }]}>4</Text>
            </View>
            <Text style={styles.instructionText}>총 3라운드 진행됩니다</Text>
          </View>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameCard}>
        <Text style={styles.roundText}>
          라운드 {currentRound} / {totalRounds}
        </Text>
        
        <Animated.View style={getGameAreaStyle()}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={gameState === 'ready' ? startGame : handleTouch}
            activeOpacity={1}
          >
            <View style={styles.gameAreaContent}>
              <Text style={styles.gameAreaText}>
                {getGameAreaText()}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        {currentTime && gameState === 'ready' && (
          <View style={styles.currentTimeDisplay}>
            <Text style={styles.currentTimeValue}>
              {currentTime}ms
            </Text>
            <Text style={styles.currentTimeLabel}>이번 시도</Text>
          </View>
        )}
      </View>

      {/* Progress */}
      {attempts.length > 0 && (
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>진행 상황</Text>
          {attempts.map((attempt, index) => (
            <View key={index} style={styles.progressItem}>
              <Text style={styles.progressRound}>라운드 {attempt.round}</Text>
              <Text style={styles.progressTime}>{attempt.time}ms</Text>
            </View>
          ))}
        </View>
      )}

      {/* Best Record */}
      {bestTime && (
        <View style={styles.bestRecordCard}>
          <Text style={styles.bestRecordTitle}>
            🏆 개인 최고 기록
          </Text>
          <Text style={styles.bestRecordValue}>
            {bestTime}ms
          </Text>
        </View>
      )}
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  gameIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  instructionsCard: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  gameCard: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  roundText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  gameArea: {
    width: width - 80,
    height: 200,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gameAreaContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameAreaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
  },
  currentTimeDisplay: {
    alignItems: 'center',
  },
  currentTimeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  currentTimeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressCard: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  progressRound: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  bestRecordCard: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  bestRecordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  bestRecordValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d97706',
  },
  resultCard: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  resultItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  attemptsSection: {
    marginBottom: 20,
  },
  attemptsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  attemptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 4,
  },
  attemptRound: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  attemptTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  bestAttemptTime: {
    color: '#22c55e',
  },
  personalBest: {
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  personalBestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d97706',
  },
  newRecordText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
  },
  expSection: {
    padding: 16,
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    alignItems: 'center',
  },
  expText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  expSubtext: {
    fontSize: 12,
    color: '#8b5cf6',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 40,
  },
  loginPromptSection: {
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
  },
  loginPromptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d97706',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginPromptSubtext: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 12,
  },
  loginPromptButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  loginPromptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
}); 