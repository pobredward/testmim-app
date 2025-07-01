import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getUserDailyPlayCount, getGameLeaderboard, getUserBestScore } from '../utils/gameUtils';

interface GameStatsCardProps {
  userId: string;
}

interface GameStats {
  gameId: string;
  gameName: string;
  icon: string;
  dailyPlaysUsed: number;
  dailyPlayLimit: number;
  bestScore: number | null;
  userRank: number | null;
  totalPlayers: number;
}

export default function GameStatsCard({ userId }: GameStatsCardProps) {
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameStats();
  }, [userId]);

  const loadGameStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const games = [
        { gameId: 'reaction-time', gameName: '반응속도', icon: '⚡' }
      ];

      const statsPromises = games.map(async (game) => {
        const [dailyPlays, bestScore, leaderboard] = await Promise.all([
          getUserDailyPlayCount(userId, game.gameId),
          getUserBestScore(userId, game.gameId),
          getGameLeaderboard(game.gameId, 100) // 더 많이 가져와서 사용자 순위 찾기
        ]);

        // 사용자 순위 찾기
        const userRank = leaderboard.findIndex(entry => entry.userId === userId) + 1;

        return {
          gameId: game.gameId,
          gameName: game.gameName,
          icon: game.icon,
          dailyPlaysUsed: dailyPlays,
          dailyPlayLimit: 5,
          bestScore,
          userRank: userRank > 0 ? userRank : null,
          totalPlayers: leaderboard.length,
        };
      });

      const stats = await Promise.all(statsPromises);
      setGameStats(stats);
    } catch (error) {
      console.error('게임 통계 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (gameId: string, score: number | null) => {
    if (score === null) return 'N/A';
    
    if (gameId === 'reaction-time') {
      return `${score}ms`;
    }
    
    return score.toString();
  };

  const getRemainingPlays = (used: number, limit: number) => {
    return Math.max(0, limit - used);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎮 미니게임 기록</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text style={styles.loadingText}>통계를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎮 미니게임 기록</Text>
        <TouchableOpacity onPress={loadGameStats} style={styles.refreshButton}>
          <Text style={styles.refreshText}>새로고침</Text>
        </TouchableOpacity>
      </View>

      {gameStats.map((game) => (
        <View key={game.gameId} style={styles.gameCard}>
          <View style={styles.gameHeader}>
            <View style={styles.gameInfo}>
              <Text style={styles.gameIcon}>{game.icon}</Text>
              <Text style={styles.gameName}>{game.gameName}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {/* 최고 기록 */}
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>최고 기록</Text>
              <Text style={styles.statValue}>
                {formatScore(game.gameId, game.bestScore)}
              </Text>
            </View>

            {/* 순위 */}
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>내 순위</Text>
              <Text style={styles.statValue}>
                {game.userRank ? `${game.userRank}위` : 'N/A'}
                {game.totalPlayers > 0 && (
                  <Text style={styles.totalPlayers}> / {game.totalPlayers}명</Text>
                )}
              </Text>
            </View>

            {/* 남은 플레이 횟수 */}
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>오늘 남은 횟수</Text>
              <Text style={[
                styles.statValue,
                getRemainingPlays(game.dailyPlaysUsed, game.dailyPlayLimit) === 0 && styles.noPlaysLeft
              ]}>
                {getRemainingPlays(game.dailyPlaysUsed, game.dailyPlayLimit)}회
              </Text>
              <Text style={styles.playLimit}>
                (총 {game.dailyPlayLimit}회)
              </Text>
            </View>
          </View>
        </View>
      ))}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  gameCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  totalPlayers: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: 'normal',
  },
  playLimit: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  noPlaysLeft: {
    color: '#ef4444',
  },
}); 