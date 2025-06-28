export interface SocialProvider {
  name: string;
  key: string;
  label: string;
  primary: boolean;
  backgroundColor: string;
  textColor: string;
  icon: string;
  borderColor?: string;
}

export const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    name: "구글",
    key: "google",
    label: "Google 로그인",
    primary: true,
    backgroundColor: "#FFFFFF",
    textColor: "#3C4043",
    borderColor: "#DADCE0",
    icon: "google", // SVG 아이콘 컴포넌트 사용
  },
  {
    name: "애플",
    key: "apple",
    label: "Apple로 로그인",
    primary: false,
    backgroundColor: "#000000",
    textColor: "#FFFFFF",
    icon: "apple",
  },
  {
    name: "카카오",
    key: "kakao",
    label: "카카오 로그인",
    primary: true,
    backgroundColor: "#FEE500",
    textColor: "rgba(0, 0, 0, 0.85)",
    icon: "kakao",
  },
  {
    name: "페이스북",
    key: "facebook",
    label: "Facebook으로 로그인",
    primary: false,
    backgroundColor: "#1877F2",
    textColor: "#FFFFFF",
    icon: "facebook",
  },
  {
    name: "네이버",
    key: "naver",
    label: "네이버로 로그인",
    primary: false,
    backgroundColor: "#03C75A",
    textColor: "#FFFFFF",
    icon: "naver",
  },
];

// 주요 소셜 로그인 버튼으로 표시할 제공자들 (완성형)
export const getPrimaryProviders = () => SOCIAL_PROVIDERS.filter(provider => provider.primary);

// 아이콘으로만 표시할 제공자들 (아이콘형)
export const getSecondaryProviders = () => SOCIAL_PROVIDERS.filter(provider => !provider.primary); 