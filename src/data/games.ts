import { MiniGame } from '../types/games';

export const availableGames: MiniGame[] = [
  {
    id: 'reaction-time',
    title: '⚡ 반응속도 게임',
    description: '색깔이 바뀌는 순간을 놓치지 마세요! 빠른 반응속도를 측정해보세요.',
    icon: '⚡',
    difficulty: 'easy',
    category: 'reaction',
    estimatedTime: 2,
    experienceReward: 10,
    isAvailable: true,
    comingSoon: false
  },
  {
    id: 'number-memory',
    title: '🧠 숫자 기억 게임',
    description: '점점 길어지는 숫자 시퀀스를 기억해보세요. 당신의 기억력은?',
    icon: '🧠',
    difficulty: 'medium',
    category: 'memory',
    estimatedTime: 5,
    experienceReward: 15,
    isAvailable: false,
    comingSoon: true
  },
  {
    id: 'color-matching',
    title: '🎨 색깔 매칭 게임',
    description: '색상 이름과 실제 색깔이 일치하는지 빠르게 판단하세요!',
    icon: '🎨',
    difficulty: 'medium',
    category: 'focus',
    estimatedTime: 3,
    experienceReward: 12,
    isAvailable: false,
    comingSoon: true
  }
];

export const getGameById = (gameId: string): MiniGame | undefined => {
  return availableGames.find(game => game.id === gameId);
};

export const getAvailableGames = (): MiniGame[] => {
  return availableGames.filter(game => game.isAvailable);
};

export const getComingSoonGames = (): MiniGame[] => {
  return availableGames.filter(game => game.comingSoon);
};

export const getGamesByCategory = (category: MiniGame['category']): MiniGame[] => {
  return availableGames.filter(game => game.category === category);
};

export const getDifficultyColor = (difficulty: MiniGame['difficulty']): string => {
  switch (difficulty) {
    case 'easy':
      return '#16a34a'; // green-600
    case 'medium':
      return '#ca8a04'; // yellow-600
    case 'hard':
      return '#dc2626'; // red-600
    default:
      return '#6b7280'; // gray-500
  }
};

export const getDifficultyBgColor = (difficulty: MiniGame['difficulty']): string => {
  switch (difficulty) {
    case 'easy':
      return '#dcfce7'; // green-100
    case 'medium':
      return '#fef3c7'; // yellow-100
    case 'hard':
      return '#fee2e2'; // red-100
    default:
      return '#f3f4f6'; // gray-100
  }
};

export const getDifficultyText = (difficulty: MiniGame['difficulty']): string => {
  switch (difficulty) {
    case 'easy':
      return '쉬움';
    case 'medium':
      return '보통';
    case 'hard':
      return '어려움';
    default:
      return '알 수 없음';
  }
}; 