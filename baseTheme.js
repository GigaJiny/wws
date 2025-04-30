let simCounter = 0;
let marketState = "NORMAL"; // 'NORMAL', 'UP', 'DOWN' 상태 추가
let stateStartTime = 0; // 상태 시작 시간
let stateTargetDuration = 0; // 상태 지속 시간(초)
let boostingThemes = []; // UP 상태에서 특별히 많이 오르는 테마들
let isBoostingThemesInitialized = false; // 부스팅 테마가 초기화되었는지 여부

function fetchRealTimeData(filter) {
  // filter 인자 추가 (현재 미사용)
  console.log(
    `임시 데이터 생성 중... (필터: ${
      filter ?? "없음"
    }, 카운터: ${simCounter}, 상태: ${marketState})`
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

  // 부스팅 테마 초기화 (최초 1회만)
  if (!isBoostingThemesInitialized) {
    const sortedThemes = [...baseThemes].sort(
      (a, b) => a.avgChange - b.avgChange
    );
    const candidateThemes = sortedThemes.slice(1, 4); // 하위 2~4등

    // 1~2개의 테마 랜덤 선택
    while (
      boostingThemes.length < Math.floor(Math.random() * 2) + 1 &&
      candidateThemes.length > 0
    ) {
      const randomIndex = Math.floor(Math.random() * candidateThemes.length);
      boostingThemes.push(candidateThemes[randomIndex].themeId);
      candidateThemes.splice(randomIndex, 1);
    }

    console.log(`부스팅 테마 초기화: ${boostingThemes.join(", ")}`);
    isBoostingThemesInitialized = true;
  }

  // 랜덤하게 상태 변경 (약 10초마다 상태 변경 시도)
  const currentTime = Date.now() / 1000;
  if (
    marketState === "NORMAL" &&
    Math.random() < 0.1 // 10% 확률로 상태 변경
  ) {
    if (Math.random() < 0.5) {
      marketState = "UP";
      stateStartTime = currentTime;
      stateTargetDuration = 10; // 10초 지속
      console.log(`상승장 시작! 부스팅 테마: ${boostingThemes.join(", ")}`);
    } else {
      marketState = "DOWN";
      stateStartTime = currentTime;
      stateTargetDuration = 5; // 5초 지속
      console.log("하락장 시작!");
    }
  }

  // 상태 종료 체크
  if (
    (marketState === "UP" || marketState === "DOWN") &&
    currentTime > stateStartTime + stateTargetDuration
  ) {
    marketState = "NORMAL";
    console.log("정상 시장으로 복귀");
  }

  const currentThemes =
    simCounter % 2 === 0
      ? baseThemes
      : baseThemes.filter((_, index) => index !== 2);

  return currentThemes
    .map((theme, index) => {
      let fluctuation = 0;

      if (marketState === "UP") {
        // 상승장 - avgChange가 높을수록 크게 오름
        const baseFluctuation = 0.3 + Math.random() * 0.4; // 기본 상승률
        // 부스팅 테마는 더 크게 오름
        if (boostingThemes.includes(theme.themeId)) {
          fluctuation = baseFluctuation * 3 + Math.random() * 1.5; // 3~4.5배 더 크게 상승
        } else {
          fluctuation = baseFluctuation * (1 + theme.avgChange / 5); // avgChange가 높을수록 크게 상승
        }
      } else if (marketState === "DOWN") {
        // 하락장 - avgChange가 높을수록 크게 떨어짐
        const baseDecline = -0.2 - Math.random() * 0.3; // 기본 하락률
        if (boostingThemes.includes(theme.themeId)) {
          // 이전에 부스팅된 테마는 덜 하락
          fluctuation = baseDecline * 0.3;
        } else {
          fluctuation = baseDecline * (1 + theme.avgChange / 5); // avgChange가 높을수록 크게 하락
        }
      } else {
        // 일반 시장 - 기존 로직 사용
        fluctuation = Math.sin(simCounter * 0.5 + index * 0.3) * 0.5;
      }

      return {
        ...theme,
        avgChange: parseFloat((theme.avgChange + fluctuation).toFixed(2)),
      };
    })
    .sort(() => Math.random() - 0.5);
}

module.exports = { fetchRealTimeData };
