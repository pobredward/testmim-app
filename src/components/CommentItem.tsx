import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../types/comments';
import { voteComment, removeVote, deleteComment, reportComment } from '../utils/comments';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | null;
  onReply: (parentId: string, parentAuthor: string) => void;
  onEdit?: (commentId: string, currentContent: string) => void;
  depth?: number;
}

export default function CommentItem({ 
  comment, 
  currentUserId, 
  onReply, 
  onEdit,
  depth = 0 
}: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(
    currentUserId ? comment.likedBy.includes(currentUserId) : false
  );
  const [isDisliked, setIsDisliked] = useState(
    currentUserId ? comment.dislikedBy.includes(currentUserId) : false
  );
  const [likesCount, setLikesCount] = useState(comment.likes);
  const [dislikesCount, setDislikesCount] = useState(comment.dislikes);
  const [isVoting, setIsVoting] = useState(false);

  const canEdit = currentUserId === comment.authorId;
  const canDelete = currentUserId === comment.authorId;

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 좋아요/싫어요 처리
  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!currentUserId) {
      Alert.alert('로그인 필요', '투표하려면 로그인이 필요합니다.');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    try {
      if (voteType === 'like') {
        if (isLiked) {
          // 좋아요 취소
          await removeVote(comment.id, currentUserId);
          setIsLiked(false);
          setLikesCount(prev => prev - 1);
        } else {
          // 좋아요 (기존 싫어요가 있다면 취소)
          await voteComment(comment.id, currentUserId, 'like');
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
          if (isDisliked) {
            setIsDisliked(false);
            setDislikesCount(prev => prev - 1);
          }
        }
      } else {
        if (isDisliked) {
          // 싫어요 취소
          await removeVote(comment.id, currentUserId);
          setIsDisliked(false);
          setDislikesCount(prev => prev - 1);
        } else {
          // 싫어요 (기존 좋아요가 있다면 취소)
          await voteComment(comment.id, currentUserId, 'dislike');
          setIsDisliked(true);
          setDislikesCount(prev => prev + 1);
          if (isLiked) {
            setIsLiked(false);
            setLikesCount(prev => prev - 1);
          }
        }
      }
    } catch (error) {
      console.error('투표 오류:', error);
      Alert.alert('오류', '투표 중 오류가 발생했습니다.');
    } finally {
      setIsVoting(false);
    }
  };

  // 댓글 삭제
  const handleDelete = () => {
    if (!currentUserId || !canDelete) return;

    Alert.alert(
      '댓글 삭제',
      '정말로 이 댓글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(comment.id, currentUserId);
            } catch (error) {
              console.error('댓글 삭제 오류:', error);
              Alert.alert('오류', '댓글 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 댓글 신고
  const handleReport = () => {
    if (!currentUserId) {
      Alert.alert('로그인 필요', '신고하려면 로그인이 필요합니다.');
      return;
    }

    Alert.alert(
      '댓글 신고',
      '이 댓글을 신고하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신고',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportComment(comment.id, currentUserId, '부적절한 내용');
              Alert.alert('신고 완료', '신고가 접수되었습니다.');
            } catch (error) {
              console.error('댓글 신고 오류:', error);
              Alert.alert('오류', '신고 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 더보기 메뉴
  const showMoreOptions = () => {
    const options = ['취소'];
    const actions = [];

    if (canEdit && onEdit) {
      options.unshift('수정');
      actions.unshift(() => onEdit(comment.id, comment.content));
    }

    if (canDelete) {
      options.unshift('삭제');
      actions.unshift(handleDelete);
    }

    if (currentUserId && currentUserId !== comment.authorId) {
      options.unshift('신고');
      actions.unshift(handleReport);
    }

    if (options.length === 1) return; // 취소만 있는 경우

    Alert.alert(
      '댓글 옵션',
      '',
      [
        ...actions.map((action, index) => ({
          text: options[index],
          onPress: action,
          style: (options[index] === '삭제' || options[index] === '신고') ? 'destructive' as const : 'default' as const
        })),
        { text: '취소', style: 'cancel' as const }
      ]
    );
  };

  return (
    <View style={[styles.container, { marginLeft: depth * 20 }]}>
      {/* 댓글 헤더 */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {comment.authorName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>{comment.authorName}</Text>
          <Text style={styles.timestamp}>{formatTime(comment.createdAt)}</Text>
        </View>
        <TouchableOpacity onPress={showMoreOptions}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 댓글 내용 */}
      <Text style={styles.content}>{comment.content}</Text>

      {/* 액션 버튼들 */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, isLiked && styles.actionButtonActive]}
          onPress={() => handleVote('like')}
          disabled={isVoting}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={16} 
            color={isLiked ? "#ff6b6b" : "#666"} 
          />
          <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, isDisliked && styles.actionButtonActive]}
          onPress={() => handleVote('dislike')}
          disabled={isVoting}
        >
          <Ionicons 
            name={isDisliked ? "heart-dislike" : "heart-dislike-outline"} 
            size={16} 
            color={isDisliked ? "#6b73ff" : "#666"} 
          />
          <Text style={[styles.actionText, isDisliked && styles.actionTextActive]}>
            {dislikesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onReply(comment.id, comment.authorName)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.actionText}>답글</Text>
        </TouchableOpacity>
      </View>

      {/* 대댓글들 */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.replies}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  actionButtonActive: {
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actionTextActive: {
    color: '#007AFF',
  },
  replies: {
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#e9ecef',
    paddingLeft: 12,
  },
}); 