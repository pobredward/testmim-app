// 로컬 썸네일 이미지 assets
export const THUMBNAILS = {
  animalpersonality: require('../../assets/thumbnails/animalpersonality_thumb.png'),
  dfclass: require('../../assets/thumbnails/dfclass_thumb.png'),
  egenteto: require('../../assets/thumbnails/egenteto_thumb.png'),
  egentetonam: require('../../assets/thumbnails/egentetonam_thumb.png'),
  lollane: require('../../assets/thumbnails/lollane_thumb.png'),
  mbtisns: require('../../assets/thumbnails/mbtisns_thumb.png'),
  pastlife: require('../../assets/thumbnails/pastlife_thumb.png'),
  secretjob: require('../../assets/thumbnails/secretjob_thumb.png'),
  snsless: require('../../assets/thumbnails/snsless_thumb.png'),
  speechstyle: require('../../assets/thumbnails/speechstyle_thumb.png'),
  tralalero: require('../../assets/thumbnails/tralalero_thumb.png'),
};

// 테스트 코드에 따른 썸네일 이미지 반환
export const getThumbnailByCode = (testCode: string) => {
  return THUMBNAILS[testCode as keyof typeof THUMBNAILS];
}; 