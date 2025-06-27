import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../types/comments';
import { getCommentsByTestCode, subscribeToComments } from '../utils/comments';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

interface CommentsSectionProps {
  testCode: string;
  currentUserId?: string | null;
  currentUserName?: string | null;
}

export default function CommentsSection({
  testCode,
  currentUserId = null,
  currentUserName = null
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 답글 모드 상태
  const [replyMode, setReplyMode] = useState<{
    parentId: string;
    parentAuthor: string;
  } | null>(null);
  
  // 수정 모드 상태
  const [editMode, setEditMode] = useState<{
    commentId: string;
    content: string;
  } | null>(null);

  // 실시간 구독 설정
  useEffect(() => {
    if (!testCode) return;

    setLoading(true);
    const unsubscribe = subscribeToComments(testCode, (updatedComments) => {
      setComments(updatedComments);
      setLoading(false);
      setRefreshing(false);
      setError(null);
    });

    // 초기 로딩 타임아웃 (실시간 구독이 느릴 경우)
    const timeout = setTimeout(() => {
      if (loading) {
        loadCommentsOnce();
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [testCode]);

  // 한 번만 댓글 로드 (실시간 구독 백업)
  const loadCommentsOnce = async () => {
    try {
      const commentsData = await getCommentsByTestCode(testCode);
      setComments(commentsData);
      setError(null);
    } catch (error) {
      console.error('댓글 로딩 오류:', error);
      setError('댓글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCommentsOnce();
  };

  // 답글 모드 시작
  const handleReply = (parentId: string, parentAuthor: string) => {
    setReplyMode({ parentId, parentAuthor });
    setEditMode(null);
  };

  // 수정 모드 시작
  const handleEdit = (commentId: string, currentContent: string) => {
    setEditMode({ commentId, content: currentContent });
    setReplyMode(null);
  };

  // 모드 취소
  const handleCancel = () => {
    setReplyMode(null);
    setEditMode(null);
  };

  // 제출 성공 처리
  const handleSubmitSuccess = () => {
    // 실시간 구독으로 자동 업데이트되므로 별도 처리 불필요
  };

  // 댓글 렌더링
  const renderComment = ({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      currentUserId={currentUserId}
      onReply={handleReply}
      onEdit={handleEdit}
    />
  );

  // 에러 재시도
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    loadCommentsOnce();
  };

  if (loading && comments.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="chatbubbles-outline" size={20} color="#333" />
          <Text style={styles.headerTitle}>댓글</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>댓글을 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="chatbubbles-outline" size={20} color="#333" />
          <Text style={styles.headerTitle}>댓글</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Ionicons name="chatbubbles-outline" size={20} color="#333" />
        <Text style={styles.headerTitle}>댓글</Text>
        <Text style={styles.commentCount}>({comments.length})</Text>
      </View>

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>첫 번째 댓글을 남겨보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.commentsList}
        />
      )}

      {/* 댓글 작성 폼 */}
      <CommentForm
        testCode={testCode}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onSubmitSuccess={handleSubmitSuccess}
      />

      {/* 답글 모달 */}
      <Modal
        visible={!!replyMode}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {replyMode && (
              <CommentForm
                testCode={testCode}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                parentId={replyMode.parentId}
                parentAuthor={replyMode.parentAuthor}
                onSubmitSuccess={handleSubmitSuccess}
                onCancel={handleCancel}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* 수정 모달 */}
      <Modal
        visible={!!editMode}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {editMode && (
              <CommentForm
                testCode={testCode}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                editingCommentId={editMode.commentId}
                editingContent={editMode.content}
                onSubmitSuccess={handleSubmitSuccess}
                onCancel={handleCancel}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  commentCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  commentsList: {
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
}); 