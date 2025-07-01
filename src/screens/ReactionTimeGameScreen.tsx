import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocialAuthService, AuthUser } from '../services/socialAuth';
import { getGameById } from '../data/games';
import { GameResult } from '../types/games';
import { 
  getGameLeaderboard, 
  saveGameResult, 
  getUserDailyPlayCount, 
  incrementUserDailyPlayCount, 
  canUserPlay 
} from '../utils/gameUtils';
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

interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  details: any;
  completedAt: string;
  rank: number;
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
  
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentRound, setCurrentRound] = useState(1);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [dailyPlays, setDailyPlays] = useState(0);
  const [canPlayGame, setCanPlayGame] = useState(true);
  
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
  const totalRounds = 1;
  const DAILY_PLAY_LIMIT = 5;

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check user first
        const currentUser = await SocialAuthService.getCurrentUser();
        setUser(currentUser);
        
        // Load best time from localStorage
        const saved = await AsyncStorage.getItem(`${gameId}-best`);
        if (saved) {
          setBestTime(parseInt(saved));
        }
        
        // Load daily plays using Firebase for logged in users
        if (currentUser?.uid) {
          try {
            const currentPlays = await getUserDailyPlayCount(currentUser.uid, 'reaction-time');
            setDailyPlays(currentPlays);
            setCanPlayGame(currentPlays < DAILY_PLAY_LIMIT);
          } catch (error) {
            console.error('Failed to load daily plays:', error);
            setDailyPlays(0);
            setCanPlayGame(true);
          }
        } else {
          // Guest users have no daily limit
          setDailyPlays(0);
          setCanPlayGame(true);
        }
        
        // Load leaderboard
        const leaderboardData = await getGameLeaderboard('reaction-time', 10);
        setLeaderboard(leaderboardData);
        setLeaderboardLoading(false);
        
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, [gameId]);

  const startGame = useCallback(async () => {
    if (gameState !== 'ready') return;
    
    // Check daily play limit (only for logged in users)
    if (user?.uid) {
      try {
        const { canPlay: userCanPlay, currentCount } = await canUserPlay(user.uid, 'reaction-time', DAILY_PLAY_LIMIT);
        
        if (!userCanPlay) {
          Alert.alert('플레이 제한', `하루 ${DAILY_PLAY_LIMIT}회 플레이 제한에 도달했습니다. 내일 다시 시도해주세요!`);
          return;
        }

        // Increment play count
        const newPlayCount = await incrementUserDailyPlayCount(user.uid, 'reaction-time');
        setDailyPlays(newPlayCount);
        setCanPlayGame(newPlayCount < DAILY_PLAY_LIMIT);
      } catch (error) {
        console.error('Failed to check/update play count:', error);
        // Continue with game for error cases
      }
    }
    
    setGameState('waiting');
    const randomDelay = Math.random() * 3000 + 2000; // 2-5 seconds
    
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = Date.now();
      setGameState('react');
    }, randomDelay);
  }, [gameState, user]);

  const handleTouch = useCallback(() => {
    if (gameState === 'waiting') {
      // Too early touch
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setGameState('too-early');
      return;
    }
    
    if (gameState === 'too-early') {
      // Handle retry after too early click - start new game immediately
      setAttempts([]);
      setCurrentTime(null);
      setCurrentRound(1);
      setGameState('ready');
      return;
    }
    
    if (gameState === 'react') {
      const reactionTime = Date.now() - startTimeRef.current;
      setCurrentTime(reactionTime);
      
      const newAttempt: AttemptResult = {
        time: reactionTime,
        round: currentRound,
      };
      
      setAttempts(prev => [...prev, newAttempt]);
      setGameState('result');
    }
  }, [gameState, currentRound]);

  const resetGame = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setGameState('ready');
    setCurrentRound(1);
    setAttempts([]);
    setCurrentTime(null);
  };

  const calculateResults = () => {
    if (attempts.length === 0) return null;
    
    const attempt = attempts[0]; // 1라운드이므로 첫 번째 시도만
    if (!attempt || attempt.time <= 0) return null;
    
    return {
      reactionTime: attempt.time,
      isSuccess: true,
    };
  };

  const getRating = (reactionTime: number): string => {
    if (reactionTime < 250) return '🔥 놀라운 반사신경!';
    if (reactionTime < 300) return '⚡ 매우 빠름!';
    if (reactionTime < 400) return '🎯 빠름';
    if (reactionTime < 500) return '👍 평균 이상';
    if (reactionTime < 600) return '👌 평균';
    return '🐌 연습이 필요해요';
  };

  const formatScore = (score: number): string => {
    return `${score}ms`;
  };

  const getRankMedal = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}위`;
    }
  };

    const saveResult = async () => {
    const results = calculateResults();
    if (!results) return;
    
    setLoading(true);
    
    try {
      // Always update local storage and check for personal best
      let isNewPersonalBest = false;
      
      if (results.isSuccess) {
        if (!bestTime || results.reactionTime < bestTime) {
          setBestTime(results.reactionTime);
          await AsyncStorage.setItem(`${gameId}-best`, results.reactionTime.toString());
          isNewPersonalBest = true;
        }
      }
      
      // Save to Firebase if user is logged in and it's a personal best (web logic)
      if (user?.uid && results.isSuccess) {
        // Get user's nickname from users collection
        let userName = user.email?.split('@')[0] || `Player ${user.uid?.substring(0, 8)}`;
        
        try {
          const currentUserData = await getUserFromFirestore(user.uid);
          if (currentUserData) {
            userName = currentUserData.nickname || 
                      currentUserData.name || 
                      userName;
          }
        } catch (error) {
          console.warn('Failed to get user nickname:', error);
        }

        const gameResult: GameResult = {
          gameId: 'reaction-time',
          userId: user.uid,
          userName: userName,
          score: results.reactionTime,
          details: results,
          experienceGained: 0, // Will be calculated separately
          completedAt: new Date().toISOString(),
          duration: 30, // Single round duration
        };
        
        const saveSuccess = await saveGameResult(gameResult, isNewPersonalBest);
        
        if (saveSuccess) {
          console.log('Game result saved to Firebase:', gameResult);
          // Refresh leaderboard after saving result  
          const leaderboardData = await getGameLeaderboard('reaction-time', 10);
          setLeaderboard(leaderboardData);
        }

        // 미니게임 완료시 경험치 지급 (성공한 경우에만)
        try {
          // 현재 사용자 데이터 조회
          const currentUserData = await getUserFromFirestore(user.uid);
          
          // 미니게임 완료 경험치 지급
          const levelUpResult = await giveExpForMiniGameCompletion(
            user.uid,
            gameId,
            results.reactionTime,
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
            }, 1000);
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
            }, 1000);
          }
        } catch (expError) {
          console.error('미니게임 경험치 지급 오류:', expError);
          // 경험치 지급 실패해도 게임 결과는 정상 표시
        }
      } else {
        console.log('Result not saved to Firebase - user not logged in or failed');
      }
      
    } catch (error) {
      console.error('Failed to save game result:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameState === 'result' && attempts.length === totalRounds) {
      saveResult();
    }
  }, [gameState, attempts.length, totalRounds]);

  const getGameAreaStyle = () => {
    switch (gameState) {
      case 'ready':
        return { backgroundColor: '#f3f4f6' };
      case 'waiting':
        return { backgroundColor: '#ef4444' };
      case 'react':
        return { backgroundColor: '#22c55e' };
      case 'too-early':
        return { backgroundColor: '#dc2626' };
      default:
        return { backgroundColor: '#f3f4f6' };
    }
  };

  const getGameAreaText = () => {
    switch (gameState) {
      case 'ready':
        return user?.uid 
          ? `클릭하여 시작\n(${DAILY_PLAY_LIMIT - dailyPlays}번 남음)`
          : '클릭하여 시작\n(로그인하면 플레이 기록이 저장됩니다)';
      case 'waiting':
        return '기다리세요...';
      case 'react':
        return '지금 클릭!';
      case 'too-early':
        return `너무 빨라요!\n실패\n클릭하여 결과 확인`;
      default:
        return '';
    }
  };

  if (gameState === 'result') {
    const results = calculateResults();
    if (!results) return null;

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

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← 게임 목록으로</Text>
            </TouchableOpacity>
            
            <Text style={styles.gameIcon}>⚡</Text>
            <Text style={styles.headerTitle}>반응속도 게임 완료!</Text>
            <Text style={styles.headerSubtitle}>
              {getRating(results.reactionTime)}
            </Text>
          </View>

          {/* Results Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>게임 결과</Text>
            
            <View style={styles.resultsGrid}>
              <View style={[styles.resultItem, { backgroundColor: '#dbeafe' }]}>
                <Text style={[styles.resultValue, { color: '#2563eb' }]}>
                  {results.isSuccess ? `${results.reactionTime}ms` : 'FAIL'}
                </Text>
                <Text style={[styles.resultLabel, { color: '#1d4ed8' }]}>반응시간</Text>
              </View>
              
              <View style={[styles.resultItem, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.resultValue, { color: '#16a34a' }]}>
                  {bestTime ? `${bestTime}ms` : 'N/A'}
                </Text>
                <Text style={[styles.resultLabel, { color: '#15803d' }]}>개인 최고 기록</Text>
              </View>
            </View>

            {/* Personal Best */}
            {results.isSuccess && results.reactionTime === bestTime && (
              <View style={styles.personalBest}>
                <Text style={styles.personalBestTitle}>
                  🎉 새로운 개인 기록 달성!
                </Text>
                <Text style={styles.personalBestSubtext}>
                  {results.reactionTime}ms
                </Text>
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
                              <Text style={styles.secondaryButtonText}>게임 목록</Text>
            </TouchableOpacity>
          </View>

          {/* Leaderboard */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 반응속도 게임 랭킹</Text>
            
            {leaderboardLoading ? (
              <Text style={styles.loadingText}>랭킹 로딩 중...</Text>
            ) : leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>아직 랭킹 데이터가 없습니다.</Text>
            ) : (
              <View>
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <View key={entry.userId} style={styles.leaderboardItem}>
                    <Text style={styles.leaderboardRank}>
                      {getRankMedal(entry.rank)}
                    </Text>
                    <View style={styles.leaderboardInfo}>
                      <Text style={styles.leaderboardName}>{entry.userName}</Text>
                      <Text style={styles.leaderboardDate}>
                        {new Date(entry.completedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.leaderboardScore}>
                      {formatScore(entry.score)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </>
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

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← 게임 목록으로</Text>
          </TouchableOpacity>
          
          <Text style={styles.gameIcon}>⚡</Text>
          <Text style={styles.headerTitle}>
            {gameData?.title || '반응속도 게임'}
          </Text>
          <Text style={styles.headerSubtitle}>
            초록색으로 바뀌는 순간 빠르게 터치하세요!
          </Text>
          
          {/* Daily play counter */}
          <View style={styles.dailyPlayCard}>
            <Text style={styles.dailyPlayText}>
              오늘 플레이 횟수: {dailyPlays}/{DAILY_PLAY_LIMIT}
            </Text>
            {dailyPlays >= DAILY_PLAY_LIMIT && (
              <Text style={styles.dailyPlayLimitText}>
                오늘의 플레이 제한에 도달했습니다. 내일 다시 시도해주세요!
              </Text>
            )}
          </View>
        </View>

        {/* Game Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>게임 방법</Text>
          <Text style={styles.instruction}>1. 아래 영역을 터치하여 게임을 시작하세요</Text>
          <Text style={styles.instruction}>2. 빨간색일 때는 기다리세요</Text>
          <Text style={styles.instruction}>3. 초록색으로 바뀌는 순간 빠르게 터치!</Text>
          <Text style={styles.instruction}>4. 개인 기록을 갱신하면 랭킹에 등록됩니다</Text>
        </View>

        {/* Game Area */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[
              styles.gameArea,
              getGameAreaStyle(),
              dailyPlays >= DAILY_PLAY_LIMIT && { backgroundColor: '#9ca3af' }
            ]}
            onPress={dailyPlays >= DAILY_PLAY_LIMIT ? undefined : (gameState === 'ready' ? startGame : handleTouch)}
            activeOpacity={0.8}
            disabled={dailyPlays >= DAILY_PLAY_LIMIT}
          >
            <Text style={styles.gameAreaText}>
              {dailyPlays >= DAILY_PLAY_LIMIT ? '오늘의 플레이 완료\n내일 다시 도전하세요!' : getGameAreaText()}
            </Text>
          </TouchableOpacity>
          
          {currentTime && gameState === 'ready' && (
            <View style={styles.currentTimeDisplay}>
              <Text style={styles.currentTimeValue}>
                {currentTime}ms
              </Text>
              <Text style={styles.currentTimeLabel}>이번 시도</Text>
            </View>
          )}
        </View>

        {/* Best Record */}
        {bestTime && (
          <View style={styles.card}>
            <Text style={styles.bestRecordTitle}>
              🏆 개인 최고 기록
            </Text>
            <Text style={styles.bestRecordValue}>
              {bestTime}ms
            </Text>
          </View>
        )}

        {/* Leaderboard */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 반응속도 게임 랭킹</Text>
          
          {leaderboardLoading ? (
            <Text style={styles.loadingText}>랭킹 로딩 중...</Text>
          ) : leaderboard.length === 0 ? (
            <Text style={styles.emptyText}>아직 랭킹 데이터가 없습니다.</Text>
          ) : (
            <View>
              {leaderboard.slice(0, 5).map((entry, index) => (
                <View key={entry.userId} style={styles.leaderboardItem}>
                  <Text style={styles.leaderboardRank}>
                    {getRankMedal(entry.rank)}
                  </Text>
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>{entry.userName}</Text>
                    <Text style={styles.leaderboardDate}>
                      {new Date(entry.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.leaderboardScore}>
                    {formatScore(entry.score)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
    marginBottom: 16,
  },
  dailyPlayCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
  },
  dailyPlayText: {
    fontSize: 16,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  dailyPlayLimitText: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 20,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  instruction: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  gameArea: {
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameAreaText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 28,
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
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  bestRecordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#eab308',
    textAlign: 'center',
    marginBottom: 8,
  },
  bestRecordValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d97706',
    textAlign: 'center',
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 14,
  },
  personalBest: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  personalBestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d97706',
    marginBottom: 4,
  },
  personalBestSubtext: {
    fontSize: 14,
    color: '#92400e',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  leaderboardRank: {
    fontSize: 20,
    marginRight: 16,
    minWidth: 50,
    textAlign: 'center',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  leaderboardDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  leaderboardScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
}); 