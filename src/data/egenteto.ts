import type { TestAnswer, TestResult } from "../types/tests";

export const EGENTETO_TEST = {
  code: "egenteto",
  docId: "egenteto",
  title: "당신의 호르몬 성향 에겐녀 vs 테토녀",
  description: "10가지 질문으로 알아보는 나의 성향! 에겐녀일까, 테토녀일까?",
  bgGradient: "from-[#f8fafc] via-[#e0e7ff] to-[#f0fdfa]", // 연보라~연파랑~연민트
  mainColor: "#6c5ce7",
  icon: "💧🔥",
  thumbnailUrl: "/thumbnails/egenteto_thumb.png",
  tags: ["에겐", "테토", "연애"],
  seoKeywords: "에겐녀, 테토녀, 호르몬 테스트, 심리 테스트, 연애 테스트",
  views: 0,
  likes: 0,
  scraps: 0,
  category: "밈",
  questions: [
    {
      question: "친구들과의 모임에서 당신의 역할은?",
      options: [
        { text: "분위기를 주도하며 모두를 이끈다.", value: "TETO", score: 2 },
        { text: "조용히 분위기를 즐기며 관찰한다.", value: "EGEN", score: 2 },
      ],
    },
    {
      question: "갈등 상황에서의 대처 방식은?",
      options: [
        { text: "직접적으로 문제를 해결하려 한다.", value: "TETO", score: 2 },
        { text: "상대의 감정을 고려하며 조심스럽게 접근한다.", value: "EGEN", score: 2 },
      ],
    },
    {
      question: "휴일에 선호하는 활동은?",
      options: [
        { text: "액티브한 야외 활동이나 운동", value: "TETO", score: 2 },
        { text: "독서나 영화 감상 등 조용한 실내 활동", value: "EGEN", score: 2 },
      ],
    },
    {
      question: "감정을 표현하는 방식은?",
      options: [
        { text: "솔직하게 표현하며 감정을 숨기지 않는다.", value: "TETO", score: 2 },
        { text: "감정을 내색하지 않고 내면에 간직한다.", value: "EGEN", score: 2 },
      ],
    },
    {
      question: "새로운 도전에 대한 태도는?",
      options: [
        { text: "주저하지 않고 도전한다.", value: "TETO", score: 2 },
        { text: "신중하게 고민한 후 결정한다.", value: "EGEN", score: 2 },
      ],
    },
    {
      question: "친구가 고민을 털어놓을 때 당신의 반응은?",
      options: [
        { text: "해결책을 제시하며 조언한다.", value: "TETO", score: 2 },
        { text: "공감하며 경청한다.", value: "EGEN", score: 2 },
      ],
    },
    {
      question: "자신의 외모에 대한 관심은?",
      options: [
        { text: "실용적이고 편안한 스타일을 선호한다.", value: "TETO", score: 2 },
        { text: "섬세하고 세련된 스타일을 추구한다.", value: "EGEN", score: 2 },
      ],
    },
    {
      question: "리더십에 대한 생각은?",
      options: [
        { text: "리더의 역할을 자주 맡으며 주도한다.", value: "TETO", score: 2 },
        { text: "서포터로서 팀을 돕는 것을 선호한다.", value: "EGEN", score: 2 },
      ],
    },
    {
      question: "스트레스 해소 방법은?",
      options: [
        { text: "운동이나 활동적인 방법으로 해소한다.", value: "TETO", score: 2 },
        { text: "음악 감상이나 명상 등으로 해소한다.", value: "EGEN", score: 2 },
      ],
    },
    {
      question: "자신을 한 단어로 표현한다면?",
      options: [
        { text: "열정적", value: "TETO", score: 2 },
        { text: "감성적", value: "EGEN", score: 2 },
      ],
    },
  ],
  results: [
    {
      type: "TETO_HIGH",
      title: "테토녀 상위",
      desc: "주도적이고 열정적인 성향으로, 어떤 상황에서도 리더십을 발휘합니다. 감정보다 이성을 중시하며, 도전적인 삶을 추구합니다.",
      subDesc: "- 목표를 세우고 추진하는 데 능숙해요.\n- 새로운 도전을 두려워하지 않아요.\n- 때로는 주변을 이끌며, 강한 추진력을 보여줍니다.",
      recommend: [
        "감성적이고 배려심 깊은 에겐남",
        "리더십이 필요한 직업 (기획자, 창업가 등)",
        "액티브한 라이프스타일"
      ],
      imageDesc: undefined,
      icon: "🔥",
      hashtags: ["#테토녀", "#리더십", "#열정적"],
      condition: (teto: number, egen: number) => teto >= 16,
    },
    {
      type: "TETO_MID",
      title: "테토녀 중위",
      desc: "상황에 따라 리더십을 발휘하며, 감정 표현에도 능숙합니다. 균형 잡힌 성향으로 다양한 사람들과 잘 어울립니다.",
      subDesc: "- 감정과 이성의 균형을 잘 잡아요.\n- 다양한 사람들과 소통이 원활해요.\n- 때로는 주도, 때로는 서포트 역할도 잘합니다.",
      recommend: [
        "공감 능력이 뛰어난 에겐남",
        "팀워크가 중요한 직업 (마케터, 교사 등)",
        "밸런스 잡힌 라이프스타일"
      ],
      imageDesc: undefined,
      icon: "🌟",
      hashtags: ["#테토녀중위", "#밸런스", "#유연성"],
      condition: (teto: number, egen: number) => teto >= 12 && teto <= 14,
    },
    {
      type: "TETO_LOW",
      title: "테토녀 하위",
      desc: "내면에 열정과 주도성이 있지만, 때로는 감성적으로 행동합니다. 상황에 따라 성향이 달라질 수 있습니다.",
      subDesc: "- 감성적이지만, 필요할 땐 주도적으로 변해요.\n- 주변 분위기에 따라 성향이 달라질 수 있어요.\n- 다양한 상황에 유연하게 대처합니다.",
      recommend: [
        "섬세하고 이해심 많은 에겐남",
        "융통성이 필요한 직업 (디자이너, 상담가 등)",
        "유연한 라이프스타일"
      ],
      imageDesc: undefined,
      icon: "🌬️",
      hashtags: ["#테토녀하위", "#감성적", "#유연함"],
      condition: (teto: number, egen: number) => teto >= 8 && teto <= 10,
    },
    {
      type: "EGEN_HIGH",
      title: "에겐녀 상위",
      desc: "감성적이고 공감 능력이 뛰어나며, 타인의 감정을 잘 이해합니다. 조용하고 섬세한 성향으로 깊은 인간관계를 선호합니다.",
      subDesc: "- 타인의 감정에 민감하게 반응해요.\n- 깊고 진솔한 관계를 중요하게 생각해요.\n- 섬세하고 배려심이 많아요.",
      recommend: [
        "열정적이고 주도적인 테토남",
        "상담, 예술 등 감성이 중요한 직업",
        "차분한 라이프스타일"
      ],
      imageDesc: undefined,
      icon: "💧",
      hashtags: ["#에겐녀", "#감성적", "#공감력"],
      condition: (teto: number, egen: number) => egen >= 16,
    },
    {
      type: "EGEN_MID",
      title: "에겐녀 중위",
      desc: "감성과 이성의 균형을 잘 유지하며, 상황에 따라 유연하게 대처합니다. 다양한 사람들과 원활한 관계를 유지합니다.",
      subDesc: "- 상황에 따라 감성/이성을 조절해요.\n- 다양한 사람들과 잘 어울려요.\n- 유연하고 융통성 있는 성격입니다.",
      recommend: [
        "주도적이면서도 배려심 있는 테토남",
        "협업이 중요한 직업 (연구원, 기획자 등)",
        "밸런스 잡힌 라이프스타일"
      ],
      imageDesc: undefined,
      icon: "🌈",
      hashtags: ["#에겐녀중위", "#균형감", "#협력적"],
      condition: (teto: number, egen: number) => egen >= 12 && egen <= 14,
    },
    {
      type: "EGEN_LOW",
      title: "에겐녀 하위",
      desc: "내면에 감성적인 면이 있지만, 때로는 주도적으로 행동합니다. 상황에 따라 성향이 달라질 수 있습니다.",
      subDesc: "- 내면에 감성이 있지만, 필요할 땐 주도적으로 변해요.\n- 상황에 따라 성향이 달라질 수 있어요.\n- 다양한 경험을 추구합니다.",
      recommend: [
        "열정적이고 리더십 있는 테토남",
        "다양한 경험이 중요한 직업 (여행가, 창작자 등)",
        "도전적인 라이프스타일"
      ],
      imageDesc: undefined,
      icon: "🌙",
      hashtags: ["#에겐녀하위", "#다양성", "#경험추구"],
      condition: (teto: number, egen: number) => egen >= 8 && egen <= 10,
    },
  ] as TestResult[],
  calculateResult(answers: TestAnswer[]): TestResult {
    // EgentetoAnswer 타입 가드
    function isEgentetoAnswer(value: string): value is "TETO" | "EGEN" {
      return value === "TETO" || value === "EGEN";
    }
    let teto = 0, egen = 0;
    answers.forEach((a) => {
      if (isEgentetoAnswer(a.value)) {
        if (a.value === "TETO") teto += a.score;
        else egen += a.score;
      }
    });
    const total = teto + egen;
    const tetoPercent = total ? Math.round((teto / total) * 100) : 0;
    const egenPercent = total ? Math.round((egen / total) * 100) : 0;
    for (const result of this.results) {
      if (result.condition && result.condition(teto, egen)) {
        return {
          ...result,
          teto,
          egen,
          tetoPercent,
          egenPercent,
        };
      }
    }
    return { ...this.results[0], teto, egen, tetoPercent, egenPercent };
  },
}; 