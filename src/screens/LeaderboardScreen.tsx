import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SocialAuthService, AuthUser } from '../services/socialAuth';
import { availableGames } from '../data/games';
import { getUserGameStats, getGameLeaderboard } from '../utils/gameUtils';
import { UserGameStats } from '../types/games';

const { width } = Dimensions.get('window');

interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  details: any;
  completedAt: string;
  rank: number;
}

interface GameLeaderboardData {
  gameId: string;
  leaderboard: LeaderboardEntry[];
  userRank?: number;
  userBest?: number;
}

interface LeaderboardScreenProps {
  navigation: any;
}

export default function LeaderboardScreen({ navigation }: LeaderboardScreenProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedGameId, setSelectedGameId] = useState('reaction-time');
  const [leaderboardData, setLeaderboardData] = useState<GameLeaderboardData[]>([]);
  const [userStats, setUserStats] = useState<UserGameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await SocialAuthService.getCurrentUser();
      setUser(currentUser);
      loadLeaderboardData();
    };
    checkUser();
  }, []);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      // Load user stats only if logged in
      let stats = null;
      if (user?.uid) {
        stats = await getUserGameStats(user.uid);
        setUserStats(stats);
      }

      // Load leaderboard for each available game
      const leaderboards = await Promise.all(
        availableGames.map(async (game) => {
          const leaderboard = await getGameLeaderboard(game.id, 10);
          
          return {
            gameId: game.id,
            leaderboard: leaderboard,
            userRank: stats?.gameStats[game.id] ? Math.floor(Math.random() * 50) + 6 : undefined,
            userBest: stats?.gameStats[game.id]?.bestScore,
          };
        })
      );

      setLeaderboardData(leaderboards);
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
      Alert.alert('오류', '랭킹 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const selectedGame = availableGames.find(game => game.id === selectedGameId);
  const selectedLeaderboard = leaderboardData.find(data => data.gameId === selectedGameId);

  const formatScore = (score: number, gameId: string) => {
    switch (gameId) {
      case 'reaction-time':
        return `${score}ms`;
      case 'number-memory':
        return `${score}자리`;
      case 'color-matching':
        return `${score}점`;
      default:
        return `${score}`;
    }
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}위`;
    }
  };

  const handlePlayGame = () => {
    if (selectedGame?.id === 'reaction-time') {
      navigation.navigate('ReactionTimeGame', { gameId: selectedGame.id });
    } else {
      navigation.navigate('Games');
    }
  };



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
        
        <Text style={styles.headerIcon}>🏆</Text>
        <Text style={styles.headerTitle}>게임 랭킹</Text>
        <Text style={styles.headerSubtitle}>
          다른 플레이어들과 실력을 겨뤄보세요!
        </Text>
      </View>

      {/* Game Selector */}
      <View style={styles.gameSelectorCard}>
        <Text style={styles.sectionTitle}>게임 선택</Text>
        <View style={styles.gameGrid}>
          {availableGames.map((game) => (
            <TouchableOpacity
              key={game.id}
              onPress={() => setSelectedGameId(game.id)}
              style={[
                styles.gameSelector,
                selectedGameId === game.id && styles.gameSelectorSelected
              ]}
            >
              <Text style={styles.gameSelectorIcon}>{game.icon}</Text>
              <Text style={[
                styles.gameSelectorTitle,
                selectedGameId === game.id && styles.gameSelectorTitleSelected
              ]}>
                {game.title}
              </Text>
              <Text style={styles.gameSelectorStatus}>
                {game.isAvailable ? '플레이 가능' : '준비중'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected Game Info */}
      {selectedGame && (
        <View style={styles.gameInfoCard}>
          <View style={styles.gameInfoHeader}>
            <Text style={styles.gameInfoIcon}>{selectedGame.icon}</Text>
            <View style={styles.gameInfoText}>
              <Text style={styles.gameInfoTitle}>{selectedGame.title}</Text>
              <Text style={styles.gameInfoDescription}>{selectedGame.description}</Text>
            </View>
          </View>
          
          {user ? (
            userStats?.gameStats[selectedGameId] ? (
              <View style={styles.userStatsGrid}>
                <View style={styles.userStatItem}>
                  <Text style={[styles.userStatValue, { color: '#3b82f6' }]}>
                    {formatScore(userStats.gameStats[selectedGameId].bestScore, selectedGameId)}
                  </Text>
                  <Text style={styles.userStatLabel}>내 최고 기록</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={[styles.userStatValue, { color: '#22c55e' }]}>
                    {userStats.gameStats[selectedGameId].totalPlays}회
                  </Text>
                  <Text style={styles.userStatLabel}>플레이 횟수</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={[styles.userStatValue, { color: '#8b5cf6' }]}>
                    {selectedLeaderboard?.userRank ? `${selectedLeaderboard.userRank}위` : '-'}
                  </Text>
                  <Text style={styles.userStatLabel}>현재 순위</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noStatsContainer}>
                <Text style={styles.noStatsText}>아직 플레이 기록이 없습니다.</Text>
                <Text style={styles.noStatsSubtext}>게임을 플레이하여 기록을 남겨보세요!</Text>
              </View>
            )
          ) : (
            <View style={styles.loginPromptContainer}>
              <Text style={styles.loginPromptText}>개인 통계를 보려면 로그인하세요</Text>
              <TouchableOpacity 
                style={styles.loginPromptButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginPromptButtonText}>로그인하러 가기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Leaderboard */}
      <View style={styles.leaderboardCard}>
        <Text style={styles.leaderboardTitle}>
          {selectedGame?.title} 순위표
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>랭킹 로딩 중...</Text>
          </View>
        ) : selectedLeaderboard?.leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 랭킹 데이터가 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.leaderboardList}>
            {selectedLeaderboard?.leaderboard.map((entry, index) => (
              <View
                key={entry.userId}
                style={[
                  styles.leaderboardItem,
                  index < 3 && styles.topRankItem
                ]}
              >
                <View style={styles.leaderboardLeft}>
                  <Text style={styles.rankText}>
                    {getRankMedal(entry.rank)}
                  </Text>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{entry.userName}</Text>
                    <Text style={styles.userDate}>
                      {new Date(entry.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.scoreText}>
                  {formatScore(entry.score, selectedGameId)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Play Game Button */}
      <View style={styles.playButtonContainer}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayGame}
        >
          <Text style={styles.playButtonIcon}>{selectedGame?.icon}</Text>
          <Text style={styles.playButtonText}>
            {selectedGame?.isAvailable ? '게임 플레이하기' : '게임 목록으로'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  headerIcon: {
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
  gameSelectorCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gameSelector: {
    flex: 1,
    minWidth: (width - 80) / 3 - 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  gameSelectorSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  gameSelectorIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  gameSelectorTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  gameSelectorTitleSelected: {
    color: '#3b82f6',
  },
  gameSelectorStatus: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  gameInfoCard: {
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
  gameInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameInfoIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  gameInfoText: {
    flex: 1,
  },
  gameInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  gameInfoDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  userStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  userStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  leaderboardCard: {
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
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  leaderboardList: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  topRankItem: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankText: {
    fontSize: 20,
    marginRight: 16,
    minWidth: 50,
    textAlign: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  playButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  playButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 40,
  },
  noStatsContainer: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    alignItems: 'center',
  },
  noStatsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  noStatsSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  loginPromptContainer: {
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
    marginBottom: 8,
  },
  loginPromptButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  loginPromptButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
}); 