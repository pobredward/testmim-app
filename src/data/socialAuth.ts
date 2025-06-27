export interface SocialProvider {
  name: string;
  key: string;
  label: string;
  primary: boolean;
  backgroundColor: string;
  textColor: string;
  icon: string;
}

export const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    name: "구글",
    key: "google",
    label: "구글로 로그인",
    primary: true,
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    icon: "🔍", // 실제로는 Google 아이콘 이미지 사용
  },
  {
    name: "애플",
    key: "apple",
    label: "Apple로 로그인",
    primary: true,
    backgroundColor: "#000000",
    textColor: "#FFFFFF",
    icon: "🍎",
  },
  {
    name: "카카오",
    key: "kakao",
    label: "카카오로 로그인",
    primary: false,
    backgroundColor: "#FEE500",
    textColor: "#392020",
    icon: "💬",
  },
  {
    name: "페이스북",
    key: "facebook",
    label: "페이스북으로 로그인",
    primary: false,
    backgroundColor: "#1877F2",
    textColor: "#FFFFFF",
    icon: "📘",
  },
  {
    name: "네이버",
    key: "naver",
    label: "네이버로 로그인",
    primary: false,
    backgroundColor: "#03C75A",
    textColor: "#FFFFFF",
    icon: "🟢",
  },
];

// 주요 소셜 로그인 버튼으로 표시할 제공자들
export const getPrimaryProviders = () => SOCIAL_PROVIDERS.filter(provider => provider.primary);

// 아이콘으로만 표시할 제공자들
export const getSecondaryProviders = () => SOCIAL_PROVIDERS.filter(provider => !provider.primary); 