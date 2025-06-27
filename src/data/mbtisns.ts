import type { TestAnswer, TestResult } from "../types/tests";

export const MBTISNS_TEST = {
  code: "mbtisns",
  docId: "mbtisns",
  title: "SNS에서 당신은 어떤 유형일까? (MBTI Ver.2)",
  description: "당신이 SNS 계정이라면 어떤 스타일일까요? 피드 꾸미기, 댓글 반응, 좋아요 패턴까지! SNS 속 당신의 MBTI 유형을 찾아보세요.",
  bgGradient: "from-[#f3e5f5] via-[#e1f5fe] to-[#fbe9e7]",
  mainColor: "#7b1fa2",
  icon: "📱",
  thumbnailUrl: "/thumbnails/mbtisns_thumb.png",
  tags: ["MBTI", "SNS", "심리"],
  seoKeywords: "MBTI, SNS 분석, SNS 스타일",
  views: 0,
  likes: 0,
  scraps: 0,
  category: "자아",
  questions: [
    {
      question: "1. 당신의 피드에는 어떤 게시물이 많을까?",
      options: [
        { text: "여행, 파티, 사람들과 함께 찍은 사진", value: "E", score: 1 },
        { text: "풍경이나 소소한 일상 사진", value: "I", score: 1 },
        { text: "관찰한 디테일이나 분석글", value: "S", score: 1 },
        { text: "상상력 자극하는 밈과 창작물", value: "N", score: 1 }
      ]
    },
    {
      question: "2. 친구가 감정적인 글을 올렸을 때 당신은?",
      options: [
        { text: "괜찮아? 바로 DM 보냄", value: "F", score: 1 },
        { text: "상황을 먼저 파악하고 신중히 행동", value: "T", score: 1 },
        { text: "댓글로 짧게 반응해줌", value: "E", score: 1 },
        { text: "혼자 속으로 걱정하고 끝", value: "I", score: 1 }
      ]
    },
    {
      question: "3. SNS에서 콘텐츠를 올릴 때 당신은?",
      options: [
        { text: "정해둔 시간에 맞춰 규칙적으로 올림", value: "J", score: 1 },
        { text: "기분 내킬 때마다 자유롭게 올림", value: "P", score: 1 },
        { text: "테마와 분위기를 세심히 맞춤", value: "S", score: 1 },
        { text: "즉흥적이고 감각적인 포스트가 많음", value: "N", score: 1 }
      ]
    },
    {
      question: "4. 좋아요/댓글을 누르는 기준은?",
      options: [
        { text: "재밌거나 감동적이면 바로 반응", value: "E", score: 1 },
        { text: "내가 아는 사람 위주로만 반응", value: "I", score: 1 },
        { text: "정보성/실용성 위주로 반응", value: "T", score: 1 },
        { text: "감정이입/공감 위주로 반응", value: "F", score: 1 }
      ]
    },
    {
      question: "5. SNS에서 가장 신경 쓰는 것은?",
      options: [
        { text: "팔로워와의 소통/반응", value: "E", score: 1 },
        { text: "내 피드의 일관성/분위기", value: "J", score: 1 },
        { text: "새로운 트렌드/밈 찾기", value: "N", score: 1 },
        { text: "실제 내 삶과의 연결감", value: "S", score: 1 }
      ]
    },
    {
      question: "6. DM(쪽지) 알림이 왔을 때 당신은?",
      options: [
        { text: "바로 답장, 대화 이어가기", value: "E", score: 1 },
        { text: "읽고 나서 천천히 답장", value: "I", score: 1 },
        { text: "상황에 따라 다름, 즉흥적", value: "P", score: 1 },
        { text: "상대방의 의도/맥락을 분석", value: "T", score: 1 }
      ]
    },
    {
      question: "7. SNS에서 나를 가장 잘 설명하는 말은?",
      options: [
        { text: "밈/유행에 민감한 트렌드세터", value: "N", score: 1 },
        { text: "감정공감/위로가 특기", value: "F", score: 1 },
        { text: "정보/분석/정리왕", value: "S", score: 1 },
        { text: "계획적이고 꾸준한 운영자", value: "J", score: 1 }
      ]
    },
    {
      question: "8. SNS에서 가장 싫은 상황은?",
      options: [
        { text: "내가 올린 글에 아무 반응 없음", value: "E", score: 1 },
        { text: "내 사생활이 너무 노출됨", value: "I", score: 1 },
        { text: "논리 없는 비난/악플", value: "T", score: 1 },
        { text: "감정적 폭주/싸움", value: "F", score: 1 }
      ]
    },
    {
      question: "9. SNS에서 친구를 추가할 때 기준은?",
      options: [
        { text: "서로 소통이 잘 되는 사람", value: "E", score: 1 },
        { text: "비슷한 관심사/취향", value: "S", score: 1 },
        { text: "새로운 자극/다양성", value: "N", score: 1 },
        { text: "오래 알고 지낸 신뢰감", value: "J", score: 1 }
      ]
    },
    {
      question: "10. SNS에서 내 피드백 스타일은?",
      options: [
        { text: "짧고 직설적인 피드백", value: "T", score: 1 },
        { text: "공감/위로 위주로 피드백", value: "F", score: 1 },
        { text: "상황별로 다르게 반응", value: "P", score: 1 },
        { text: "분석/정리해서 피드백", value: "S", score: 1 }
      ]
    },
    {
      question: "11. SNS에서 이벤트/챌린지 참여는?",
      options: [
        { text: "계획 세워 미리 준비", value: "J", score: 1 },
        { text: "즉흥적으로 참여", value: "P", score: 1 },
        { text: "친구들과 함께 참여", value: "E", score: 1 },
        { text: "혼자서 조용히 관찰", value: "I", score: 1 }
      ]
    },
    {
      question: "12. SNS에서 나의 DM/댓글 빈도는?",
      options: [
        { text: "자주, 여러 사람과 활발히 소통", value: "E", score: 1 },
        { text: "필요할 때만, 신중하게", value: "I", score: 1 },
        { text: "상황 따라 다름, 즉흥적", value: "P", score: 1 },
        { text: "분석/정보 공유 위주", value: "S", score: 1 }
      ]
    }
  ],
  results: [
    { type: "INFP", title: "🌙 감성 기록러 INFP", desc: "감정과 생각을 조용히 기록하는 몽환적 감성 SNS러!", subDesc: "혼자서 피드를 가꾸고, 긴 글에 내면을 담는 스타일입니다.", icon: "🌙", hashtags: ["#감성글귀", "#혼잣말계정", "#몽환피드"], condition: (type: string) => type === "INFP" },
    { type: "ENTP", title: "🔥 밈 장인 ENTP", desc: "이야깃거리와 밈으로 세상을 흔드는 SNS 개척자!", subDesc: "댓글에 댓글을 달고, 매번 화제를 일으키는 밈 크리에이터입니다.", icon: "🔥", hashtags: ["#밈러", "#반응속도 1등", "#SNS유머"], condition: (type: string) => type === "ENTP" },
    { type: "ENFP", title: "🎉 에너지 뿜뿜 ENFP", desc: "밝고 긍정적인 에너지로 피드를 가득 채우는 SNS 인싸!", subDesc: "다양한 챌린지와 이벤트에 적극적으로 참여합니다.", icon: "🎉", hashtags: ["#인싸", "#챌린지왕", "#긍정에너지"], condition: (type: string) => type === "ENFP" },
    { type: "INFJ", title: "🦄 영감 수집가 INFJ", desc: "깊은 통찰과 영감을 SNS에 담아내는 조용한 크리에이터!", subDesc: "감성적이면서도 의미 있는 콘텐츠를 선호합니다.", icon: "🦄", hashtags: ["#영감수집", "#의미추구", "#조용한SNS"], condition: (type: string) => type === "INFJ" },
    { type: "INTJ", title: "🧠 전략가 INTJ", desc: "분석과 전략으로 피드를 설계하는 SNS 마스터!", subDesc: "계획적이고 체계적인 SNS 운영을 즐깁니다.", icon: "🧠", hashtags: ["#전략적", "#분석러", "#계획형"], condition: (type: string) => type === "INTJ" },
    { type: "ENTJ", title: "👑 SNS 리더 ENTJ", desc: "SNS에서도 리더십을 발휘하는 추진력 갑!", subDesc: "이슈를 주도하고, 팔로워를 이끄는 스타일입니다.", icon: "👑", hashtags: ["#리더십", "#이슈메이커", "#추진력"], condition: (type: string) => type === "ENTJ" },
    { type: "ISFJ", title: "🍀 따뜻한 기록자 ISFJ", desc: "소소한 일상과 따뜻한 순간을 기록하는 힐링 SNS러!", subDesc: "친구와 가족, 소중한 사람들과의 추억을 중시합니다.", icon: "🍀", hashtags: ["#힐링피드", "#추억저장", "#따뜻함"], condition: (type: string) => type === "ISFJ" },
    { type: "ESFJ", title: "💬 소통왕 ESFJ", desc: "댓글, DM, 좋아요로 소통을 즐기는 SNS 커뮤니케이터!", subDesc: "팔로워와의 관계를 소중히 여기며, 활발한 피드백을 남깁니다.", icon: "💬", hashtags: ["#소통왕", "#피드백장인", "#관계중시"], condition: (type: string) => type === "ESFJ" },
    { type: "ISTJ", title: "📚 정석러 ISTJ", desc: "정직하고 신중하게 피드를 관리하는 SNS 정석러!", subDesc: "규칙적이고 일관된 콘텐츠를 선호합니다.", icon: "📚", hashtags: ["#정석운영", "#신중함", "#일관성"], condition: (type: string) => type === "ISTJ" },
    { type: "ESTJ", title: "🗂️ 운영자 ESTJ", desc: "SNS를 체계적으로 관리하는 운영자형!", subDesc: "계획과 실행, 효율을 중시하는 스타일입니다.", icon: "🗂️", hashtags: ["#운영자", "#효율중시", "#계획실행"], condition: (type: string) => type === "ESTJ" },
    { type: "ISFP", title: "🌸 감성 아티스트 ISFP", desc: "감각적이고 자유로운 피드를 꾸미는 예술가형!", subDesc: "사진, 음악, 영상 등 다양한 감성 콘텐츠를 즐깁니다.", icon: "🌸", hashtags: ["#감성아트", "#자유로운피드", "#예술가"], condition: (type: string) => type === "ISFP" },
    { type: "ESFP", title: "🎈 피드의 분위기메이커 ESFP", desc: "밝고 유쾌한 분위기로 피드를 채우는 SNS 엔터테이너!", subDesc: "이벤트, 밈, 챌린지에 적극적으로 참여합니다.", icon: "🎈", hashtags: ["#분위기메이커", "#이벤트참여", "#유쾌함"], condition: (type: string) => type === "ESFP" },
    { type: "ISTP", title: "🔧 실험가 ISTP", desc: "새로운 기능, 다양한 포맷을 실험하는 SNS 탐구가!", subDesc: "기술, 도구, 트렌드에 관심이 많습니다.", icon: "🔧", hashtags: ["#실험정신", "#도구덕후", "#트렌드체크"], condition: (type: string) => type === "ISTP" },
    { type: "ESTP", title: "🚀 액션러 ESTP", desc: "즉흥적이고 에너지 넘치는 SNS 액션러!", subDesc: "새로운 시도와 도전을 즐깁니다.", icon: "🚀", hashtags: ["#즉흥참여", "#도전정신", "#에너지"], condition: (type: string) => type === "ESTP" },
    { type: "INTP", title: "🧩 분석가 INTP", desc: "호기심과 분석력으로 SNS를 탐구하는 지적 유형!", subDesc: "정보, 밈, 트렌드의 원리를 파헤치는 것을 즐깁니다.", icon: "🧩", hashtags: ["#분석러", "#지적호기심", "#트렌드탐구"], condition: (type: string) => type === "INTP" },
    { type: "ENFJ", title: "🌟 영감 리더 ENFJ", desc: "팔로워에게 긍정적 영향과 영감을 주는 SNS 리더!", subDesc: "공감과 소통, 의미 있는 콘텐츠를 추구합니다.", icon: "🌟", hashtags: ["#영감리더", "#공감소통", "#의미추구"], condition: (type: string) => type === "ENFJ" }
  ],
  calculateResult(answers: TestAnswer[]): TestResult {
    // MBTI 지표별 점수 집계
    const mbti = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    answers.forEach((a) => {
      if (mbti[a.value as keyof typeof mbti] !== undefined) mbti[a.value as keyof typeof mbti] += a.score;
    });
    const type =
      (mbti.E >= mbti.I ? "E" : "I") +
      (mbti.S >= mbti.N ? "S" : "N") +
      (mbti.T >= mbti.F ? "T" : "F") +
      (mbti.J >= mbti.P ? "J" : "P");
    return this.results.find((r) => r.type === type) || this.results[0];
  }
}; 