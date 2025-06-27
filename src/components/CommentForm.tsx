import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createComment, updateComment } from '../utils/comments';
import { generateGuestUserId, generateGuestUserName } from '../utils/comments';

interface CommentFormProps {
  testCode: string;
  currentUserId: string | null;
  currentUserName: string | null;
  parentId?: string | null;
  parentAuthor?: string;
  editingCommentId?: string | null;
  editingContent?: string;
  onSubmitSuccess: () => void;
  onCancel?: () => void;
}

export default function CommentForm({
  testCode,
  currentUserId,
  currentUserName,
  parentId = null,
  parentAuthor,
  editingCommentId = null,
  editingContent = '',
  onSubmitSuccess,
  onCancel
}: CommentFormProps) {
  const [content, setContent] = useState(editingContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestUserId, setGuestUserId] = useState<string | null>(null);
  const [guestUserName, setGuestUserName] = useState<string | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isEditing = !!editingCommentId;
  const isReply = !!parentId;

  useEffect(() => {
    // 게스트 사용자 정보 생성
    if (!currentUserId) {
      setGuestUserId(generateGuestUserId());
      setGuestUserName(generateGuestUserName());
    }

    // 애니메이션
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // 자동 포커스 (답글 또는 수정 모드일 때)
    if ((isReply || isEditing) && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('알림', '댓글 내용을 입력해주세요.');
      return;
    }

    if (content.length > 500) {
      Alert.alert('알림', '댓글은 500자 이내로 작성해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && editingCommentId) {
        // 댓글 수정
        if (!currentUserId) {
          Alert.alert('오류', '수정 권한이 없습니다.');
          return;
        }
        await updateComment(editingCommentId, content.trim(), currentUserId);
      } else {
        // 새 댓글 생성
        const userId = currentUserId || guestUserId;
        const userName = currentUserName || guestUserName;
        
        if (!userId || !userName) {
          Alert.alert('오류', '사용자 정보를 가져올 수 없습니다.');
          return;
        }

        await createComment({
          testCode,
          content: content.trim(),
          authorId: currentUserId, // 로그인한 사용자만 ID 저장, 게스트는 null
          authorName: userName,
          parentId
        });
      }

      setContent('');
      Keyboard.dismiss();
      onSubmitSuccess();
      
      if (isReply || isEditing) {
        onCancel?.();
      }
    } catch (error) {
      console.error('댓글 제출 오류:', error);
      Alert.alert('오류', isEditing ? '댓글 수정에 실패했습니다.' : '댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent(editingContent);
    Keyboard.dismiss();
    onCancel?.();
  };

  const getPlaceholder = () => {
    if (isEditing) return '댓글을 수정하세요...';
    if (isReply && parentAuthor) return `@${parentAuthor}님에게 답글...`;
    return '댓글을 입력하세요...';
  };

  const getButtonText = () => {
    if (isSubmitting) return isEditing ? '수정 중...' : '작성 중...';
    return isEditing ? '수정' : '작성';
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* 헤더 (답글 또는 수정 모드일 때) */}
        {(isReply || isEditing) && (
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {isEditing ? '댓글 수정' : `@${parentAuthor}님에게 답글`}
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* 사용자 정보 (게스트일 때) */}
        {!currentUserId && guestUserName && (
          <View style={styles.guestInfo}>
            <View style={styles.guestAvatar}>
              <Text style={styles.guestAvatarText}>
                {guestUserName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.guestName}>{guestUserName}</Text>
            <Text style={styles.guestLabel}>(임시 이름)</Text>
          </View>
        )}

        {/* 댓글 입력 영역 */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder={getPlaceholder()}
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
            textAlignVertical="top"
            blurOnSubmit={false}
          />
          
          {/* 글자수 표시 */}
          <Text style={styles.characterCount}>
            {content.length}/500
          </Text>
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actions}>
          {!currentUserId && (
            <Text style={styles.guestNotice}>
              익명으로 댓글이 작성됩니다
            </Text>
          )}
          
          <View style={styles.buttonContainer}>
            {(isReply || isEditing) && (
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!content.trim() || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              <Text style={[
                styles.submitButtonText,
                (!content.trim() || isSubmitting) && styles.submitButtonTextDisabled
              ]}>
                {getButtonText()}
              </Text>
              {!isSubmitting && (
                <Ionicons 
                  name="send" 
                  size={16} 
                  color={content.trim() ? "#fff" : "#ccc"} 
                  style={styles.sendIcon}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  keyboardAvoidingView: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  guestAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  guestAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  guestName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  guestLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 12,
  },
  textInput: {
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    minHeight: 80,
    maxHeight: 120,
    color: '#333',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guestNotice: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonTextDisabled: {
    color: '#ccc',
  },
  sendIcon: {
    marginLeft: 4,
  },
}); 