import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  arrayUnion, 
  arrayRemove, 
  increment,
  writeBatch,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Comment, CommentInput, CommentVote, CommentReport } from '../types/comments';

// 댓글 생성
export async function createComment(commentInput: CommentInput): Promise<string> {
  try {
    const commentData = {
      ...commentInput,
      createdAt: new Date(),
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      isDeleted: false,
      isReported: false,
      reportCount: 0,
    };

    const docRef = await addDoc(collection(db, 'comments'), commentData);
    return docRef.id;
  } catch (error) {
    console.error('댓글 생성 오류:', error);
    throw new Error('댓글을 생성하는 중 오류가 발생했습니다.');
  }
}

// 특정 테스트의 댓글 목록 가져오기
export async function getCommentsByTestCode(testCode: string): Promise<Comment[]> {
  try {
    const q = query(
      collection(db, 'comments'),
      where('testCode', '==', testCode),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      } as Comment);
    });

    // 댓글을 계층구조로 정리 (부모 댓글과 대댓글)
    return organizeComments(comments);
  } catch (error) {
    console.error('댓글 목록 가져오기 오류:', error);
    throw new Error('댓글을 불러오는 중 오류가 발생했습니다.');
  }
}

// 댓글을 계층구조로 정리하는 함수
function organizeComments(comments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];

  // 모든 댓글을 맵에 저장
  comments.forEach(comment => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  // 계층구조 구성
  comments.forEach(comment => {
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies!.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  // 각 댓글의 대댓글들을 최신순으로 정렬
  rootComments.forEach(comment => {
    if (comment.replies) {
      comment.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
  });

  return rootComments;
}

// 댓글 실시간 구독
export function subscribeToComments(
  testCode: string, 
  callback: (comments: Comment[]) => void
): () => void {
  const q = query(
    collection(db, 'comments'),
    where('testCode', '==', testCode),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const comments: Comment[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      } as Comment);
    });

    const organizedComments = organizeComments(comments);
    callback(organizedComments);
  });
}

// 댓글 좋아요/싫어요
export async function voteComment(
  commentId: string, 
  userId: string, 
  voteType: 'like' | 'dislike'
): Promise<void> {
  try {
    const commentRef = doc(db, 'comments', commentId);
    const batch = writeBatch(db);

    if (voteType === 'like') {
      batch.update(commentRef, {
        likedBy: arrayUnion(userId),
        dislikedBy: arrayRemove(userId), // 싫어요에서 제거
        likes: increment(1),
        dislikes: increment(-1), // 싫어요가 있었다면 감소
      });
    } else {
      batch.update(commentRef, {
        dislikedBy: arrayUnion(userId),
        likedBy: arrayRemove(userId), // 좋아요에서 제거
        dislikes: increment(1),
        likes: increment(-1), // 좋아요가 있었다면 감소
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('댓글 투표 오류:', error);
    throw new Error('투표하는 중 오류가 발생했습니다.');
  }
}

// 댓글 좋아요/싫어요 취소
export async function removeVote(commentId: string, userId: string): Promise<void> {
  try {
    const commentRef = doc(db, 'comments', commentId);
    
    await updateDoc(commentRef, {
      likedBy: arrayRemove(userId),
      dislikedBy: arrayRemove(userId),
    });
  } catch (error) {
    console.error('투표 취소 오류:', error);
    throw new Error('투표를 취소하는 중 오류가 발생했습니다.');
  }
}

// 댓글 삭제 (소프트 삭제)
export async function deleteComment(commentId: string, userId: string): Promise<void> {
  try {
    const commentRef = doc(db, 'comments', commentId);
    
    await updateDoc(commentRef, {
      isDeleted: true,
      content: '[삭제된 댓글입니다]',
      deletedAt: new Date(),
      deletedBy: userId,
    });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    throw new Error('댓글을 삭제하는 중 오류가 발생했습니다.');
  }
}

// 댓글 신고
export async function reportComment(
  commentId: string, 
  reporterId: string, 
  reason: string
): Promise<void> {
  try {
    // 신고 정보 저장
    await addDoc(collection(db, 'commentReports'), {
      commentId,
      reporterId,
      reason,
      createdAt: new Date(),
    });

    // 댓글의 신고 카운트 증가
    const commentRef = doc(db, 'comments', commentId);
    await updateDoc(commentRef, {
      reportCount: increment(1),
      isReported: true,
    });
  } catch (error) {
    console.error('댓글 신고 오류:', error);
    throw new Error('신고하는 중 오류가 발생했습니다.');
  }
}

// 댓글 수정
export async function updateComment(
  commentId: string, 
  content: string, 
  userId: string
): Promise<void> {
  try {
    const commentRef = doc(db, 'comments', commentId);
    
    await updateDoc(commentRef, {
      content,
      updatedAt: new Date(),
      editedBy: userId,
    });
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    throw new Error('댓글을 수정하는 중 오류가 발생했습니다.');
  }
}

// 사용자 고유 ID 생성 (임시 사용자용)
export function generateGuestUserId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 사용자 이름 생성 (임시 사용자용)
export function generateGuestUserName(): string {
  const adjectives = ['즐거운', '신나는', '멋진', '재미있는', '똑똑한', '용감한', '친절한', '귀여운'];
  const nouns = ['사자', '고양이', '강아지', '토끼', '햄스터', '판다', '코알라', '펭귄'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective} ${noun}${number}`;
} 