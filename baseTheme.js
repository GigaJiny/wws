let simCounter = 0;
function fetchRealTimeData(filter) {
  // filter 인자 추가 (현재 미사용)
  console.log(
    `임시 데이터 생성 중... (필터: ${filter ?? "없음"}, 카운터: ${simCounter})`
  );
  simCounter++;
  const baseThemes = [
    {
      themeId: "T01",
      themeName: "인공지능",

      avgChange: 3.5,

      color: "#D53A43",
    },
    {
      themeId: "T02",
      themeName: "반도체",

      avgChange: 2.1,

      color: "#3B60A3",
    },
    {
      themeId: "T03",
      themeName: "전기차",

      avgChange: -1.2,

      color: "#61A0A8",
    },
    {
      themeId: "T04",
      themeName: "바이오",

      avgChange: 0.8,

      color: "#E98F6F",
    },
    {
      themeId: "T05",
      themeName: "게임",

      avgChange: -0.5,

      color: "#847E91",
    },
    {
      themeId: "T06",
      themeName: "콘텐츠",

      avgChange: 1.5,

      color: "#C23531",
    },
    {
      themeId: "T07",
      themeName: "메타버스",

      avgChange: 2.7,

      color: "#2F4554",
    },
    {
      themeId: "T08",
      themeName: "클라우드",

      avgChange: 1.9,

      color: "#61A0A8",
    },
    {
      themeId: "T09",
      themeName: "로봇",

      avgChange: -0.7,

      color: "#D48265",
    },
    {
      themeId: "T10",
      themeName: "블록체인",

      avgChange: 4.1,

      color: "#91C7AE",
    },
    {
      themeId: "T11",
      themeName: "사이버보안",

      avgChange: 1.3,

      color: "#749F83",
    },
    {
      themeId: "T12",
      themeName: "핀테크",

      avgChange: -1.5,

      color: "#CA8622",
    },
    {
      themeId: "T13",
      themeName: "에너지저장",

      avgChange: 2.3,

      color: "#BDA29A",
    },
    {
      themeId: "T14",
      themeName: "바이오헬스",

      avgChange: 3.2,

      color: "#6E7074",
    },
    {
      themeId: "T15",
      themeName: "스마트팩토리",

      avgChange: 0.9,

      color: "#546570",
    },
    {
      themeId: "T16",
      themeName: "신재생에너지",

      avgChange: 2.6,

      color: "#C4CCD3",
    },
    {
      themeId: "T17",
      themeName: "우주항공",

      avgChange: 1.7,

      color: "#F05B72",
    },
    {
      themeId: "T18",
      themeName: "자율주행",

      avgChange: -0.8,

      color: "#5A8CAF",
    },
    {
      themeId: "T19",
      themeName: "스마트시티",

      avgChange: 1.4,

      color: "#9A60B4",
    },
    {
      themeId: "T20",
      themeName: "양자컴퓨팅",

      avgChange: 2.9,

      color: "#EE6666",
    },
  ];
  // ... (기존 데이터 변동 로직 유지) ...
  const currentThemes =
    simCounter % 2 === 0
      ? baseThemes
      : baseThemes.filter((_, index) => index !== 2);
  return currentThemes
    .map((theme, index) => {
      const fluctuation = Math.sin(simCounter * 0.5 + index * 0.3) * 0.5;
      return {
        ...theme,
        avgChange: parseFloat((theme.avgChange + fluctuation).toFixed(2)),
      };
    })
    .sort(() => Math.random() - 0.5);
}

module.exports = { fetchRealTimeData };
