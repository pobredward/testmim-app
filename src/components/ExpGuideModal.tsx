import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface ExpGuideModalProps {
  isVisible: boolean;
  onClose: () => void;
}

interface GuideItem {
  icon: string;
  title: string;
  description: string;
  exp: number | string;
  frequency?: string;
}

export default function ExpGuideModal({ isVisible, onClose }: ExpGuideModalProps) {
  const guideItems: GuideItem[] = [
    {
      icon: "🎯",
      title: "테스트 완료",
      description: "심리테스트, MBTI 테스트 등을 완료하면 경험치를 획득할 수 있어요!",
      exp: 15,
      frequency: "테스트당"
    },
    {
      icon: "🎮",
      title: "미니게임",
      description: "반응속도 게임에서 400ms 이내 반응하면 5 경험치, 300ms 이내 반응하면 20 경험치를 획득해요! 개인 최고기록 갱신시 추가 5 경험치 보너스!",
      exp: "5-25",
      frequency: "게임당"
    },
    {
      icon: "🎁",
      title: "보너스 이벤트 (준비중)",
      description: "특별한 이벤트와 도전과제를 통해 추가 경험치를 획득하세요!",
      exp: 25,
      frequency: "이벤트당"
    },
    {
      icon: "📅",
      title: "일일 로그인 (준비중)",
      description: "매일 접속하여 연속 로그인 보너스를 받아보세요!",
      exp: 5,
      frequency: "일일"
    }
  ];

  const levelInfo = [
    { level: 1, totalExp: 0, required: 10 },
    { level: 2, totalExp: 10, required: 20 },
    { level: 3, totalExp: 30, required: 30 },
    { level: 4, totalExp: 60, required: 40 },
    { level: 5, totalExp: 100, required: 50 },
  ];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitle}>
              <Text style={styles.headerIcon}>⭐</Text>
              <Text style={styles.headerText}>경험치 가이드</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 경험치 획득 방법 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💎</Text>
              <Text style={styles.sectionTitle}>경험치 획득 방법</Text>
            </View>
            
            <View style={styles.guideList}>
              {guideItems.map((item, index) => (
                <View key={index} style={styles.guideItem}>
                  <View style={styles.guideItemContent}>
                    <Text style={styles.guideItemIcon}>{item.icon}</Text>
                    <View style={styles.guideItemInfo}>
                      <View style={styles.guideItemHeader}>
                        <Text style={styles.guideItemTitle}>{item.title}</Text>
                        <View style={styles.expBadge}>
                          <Text style={styles.expBadgeText}>+{item.exp}</Text>
                          <Text style={styles.expBadgeLabel}>EXP</Text>
                        </View>
                      </View>
                      <Text style={styles.guideItemDescription}>{item.description}</Text>
                      {item.frequency && (
                        <View style={styles.frequencyBadge}>
                          <Text style={styles.frequencyText}>{item.frequency}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 레벨 시스템 설명 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🏆</Text>
              <Text style={styles.sectionTitle}>레벨 시스템</Text>
            </View>
            
            <View style={styles.levelSystemCard}>
              <Text style={styles.levelSystemDescription}>
                레벨이 올라갈수록 더 많은 경험치가 필요해요. 각 레벨별 필요 경험치는 다음과 같습니다:
              </Text>
              <View style={styles.levelList}>
                {levelInfo.map((level, index) => (
                  <View key={index} style={styles.levelItem}>
                    <Text style={styles.levelItemLabel}>
                      레벨 {level.level} → {level.level + 1}
                    </Text>
                    <Text style={styles.levelItemExp}>
                      {level.required} EXP 필요
                    </Text>
                  </View>
                ))}
                <View style={styles.levelNote}>
                  <Text style={styles.levelNoteText}>
                    ※ 패턴: 레벨 n+1 달성에 (n+1) × 10 경험치 필요
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 팁 섹션 */}
          <View style={styles.section}>
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipTitle}>꿀팁!</Text>
              </View>
              <View style={styles.tipList}>
                <Text style={styles.tipItem}>• 다양한 테스트에 참여해서 경험치를 모아보세요</Text>
                <Text style={styles.tipItem}>• 레벨이 올라갈수록 더 많은 기능을 이용할 수 있어요</Text>
                <Text style={styles.tipItem}>• 반응속도 게임에서 300ms 이내로 반응하면 20 경험치를 획득할 수 있어요! 🎮</Text>
                <Text style={styles.tipItem}>• 개인 최고 기록을 갱신하면 추가 보너스 경험치를 받을 수 있어요 🏆</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#8B5CF6',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  guideList: {
    gap: 12,
  },
  guideItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  guideItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guideItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  guideItemInfo: {
    flex: 1,
  },
  guideItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  guideItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginRight: 2,
  },
  expBadgeLabel: {
    fontSize: 12,
    color: '#A855F7',
  },
  guideItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  frequencyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  frequencyText: {
    fontSize: 12,
    color: '#6B7280',
  },
  levelSystemCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  levelSystemDescription: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 12,
  },
  levelList: {
    gap: 8,
  },
  levelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  levelItemExp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA580C',
  },
  levelNote: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
  },
  levelNoteText: {
    fontSize: 12,
    color: '#A16207',
  },
  tipCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  tipList: {
    gap: 4,
  },
  tipItem: {
    fontSize: 14,
    color: '#1D4ED8',
    lineHeight: 20,
  },
}); 