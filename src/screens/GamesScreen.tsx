import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { SocialAuthService, AuthUser } from '../services/socialAuth';
// LinearGradient import removed - using View instead
import { 
  availableGames, 
  getAvailableGames, 
  getComingSoonGames, 
  getDifficultyColor,
  getDifficultyBgColor,
  getDifficultyText 
} from '../data/games';
import { MiniGame } from '../types/games';

const { width } = Dimensions.get('window');

interface GamesScreenProps {
  navigation: any;
}

export default function GamesScreen({ navigation }: GamesScreenProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [availableGamesList, setAvailableGamesList] = useState<MiniGame[]>([]);
  const [comingSoonGamesList, setComingSoonGamesList] = useState<MiniGame[]>([]);

  useEffect(() => {
    setAvailableGamesList(getAvailableGames());
    setComingSoonGamesList(getComingSoonGames());
    
    // Check if user is logged in
    const checkUser = async () => {
      const currentUser = await SocialAuthService.getCurrentUser();
      setUser(currentUser);
    };
    checkUser();
  }, []);

  const handleGamePress = (gameId: string, isAvailable: boolean) => {
    if (isAvailable) {
      // Navigate to specific game screen (login encouragement will be shown after game)
      if (gameId === 'reaction-time') {
        navigation.navigate('ReactionTimeGame', { gameId });
      } else {
        navigation.navigate('GameDetail', { gameId });
      }
    } else {
      Alert.alert('준비중', '이 게임은 곧 출시 예정입니다!');
    }
  };

  const renderGameCard = (game: MiniGame, isAvailable: boolean = true) => (
    <TouchableOpacity
      key={game.id}
      style={[styles.gameCard, !isAvailable && styles.disabledCard]}
      onPress={() => handleGamePress(game.id, isAvailable)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {!isAvailable && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>준비중</Text>
          </View>
        )}
        
        <Text style={[styles.gameIcon, !isAvailable && styles.disabledIcon]}>
          {game.icon}
        </Text>
        
        <Text style={[styles.gameTitle, !isAvailable && styles.disabledText]}>
          {game.title}
        </Text>
        
        <Text style={[styles.gameDescription, !isAvailable && styles.disabledText]}>
          {game.description}
        </Text>
        
        <View style={styles.gameInfo}>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: isAvailable ? getDifficultyBgColor(game.difficulty) : '#f3f4f6' }
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: isAvailable ? getDifficultyColor(game.difficulty) : '#6b7280' }
              ]}
            >
              {getDifficultyText(game.difficulty)}
            </Text>
          </View>
          <Text style={[styles.estimatedTime, !isAvailable && styles.disabledText]}>
            ~{game.estimatedTime}분
          </Text>
        </View>
        
        <View style={styles.gameActions}>
          <View style={styles.expReward}>
            <Text style={[styles.expIcon, !isAvailable && styles.disabledText]}>💎</Text>
            <Text style={[styles.expText, !isAvailable && styles.disabledText]}>
              +{game.experienceReward} EXP
            </Text>
          </View>
          
          <View
            style={[
              styles.playButton,
              { backgroundColor: isAvailable ? '#8b5cf6' : '#d1d5db' }
            ]}
          >
            <Text style={[styles.playButtonText, !isAvailable && styles.disabledButtonText]}>
              {isAvailable ? '플레이' : '준비중'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* User Status Alert */}
      {!user && (
        <View style={[styles.alertContainer, { marginTop: 16 }]}>
          <View style={styles.alertIcon}>
            <Text>💡</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>로그인하면 더 많은 혜택이!</Text>
            <Text style={styles.alertMessage}>
              게임은 누구나 플레이 가능하지만, 로그인하면 기록 저장과 경험치 획득이 가능해요.
            </Text>
          </View>
        </View>
      )}

      {/* Available Games Section */}
      <View style={[styles.section, { marginTop: user ? 16 : 0 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🚀</Text>
          <Text style={styles.sectionTitle}>지금 플레이 가능</Text>
        </View>
        
        <View style={styles.gamesGrid}>
          {availableGamesList.map(game => renderGameCard(game, true))}
        </View>
      </View>

      {/* Coming Soon Games Section */}
      {comingSoonGamesList.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔮</Text>
            <Text style={styles.sectionTitle}>곧 출시 예정</Text>
          </View>
          
          <View style={styles.gamesGrid}>
            {comingSoonGamesList.map(game => renderGameCard(game, false))}
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  alertContainer: {
    flexDirection: 'row',
    backgroundColor: '#fefce8',
    borderColor: '#fde047',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#a16207',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  gamesGrid: {
    paddingHorizontal: 16,
  },
  gameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  disabledCard: {
    opacity: 0.6,
  },
  cardContent: {
    position: 'relative',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fed7aa',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ea580c',
  },
  gameIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  disabledIcon: {
    opacity: 0.4,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  gameDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  disabledText: {
    color: '#9ca3af',
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  gameActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expReward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  expText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  playButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButtonText: {
    color: '#d1d5db',
  },

  bottomPadding: {
    height: 24,
  },
}); 