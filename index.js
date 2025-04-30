const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const http = require("http"); // http 모듈 확인
const WebSocket = require("ws");
// './baseTheme' 파일이 실제로 존재하고 fetchRealTimeData 함수를 export 하는지 확인하세요.
// 파일이 없다면 아래 라인을 주석 처리하거나 실제 경로로 수정해야 합니다.
const { fetchRealTimeData } = require("./baseTheme");

const mockData = [
  {
    name: "코스피지수",
    value: 2293.7,
    change: 40.5348,
    changeRate: 0.0174,
    state: "Down",
  },
  {
    name: "코스피 50",
    value: 2108.68,
    change: 36.12048,
    changeRate: 1.68,
    state: "Up",
  },
  {
    name: "코스닥",
    value: 643.39484,
    change: 15.0684,
    changeRate: 0.0229,
    state: "Up",
  },
];

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Firebase Admin SDK 초기화 - 경로 확인
const serviceAccountPath = path.join(
  __dirname,
  "./oktether-552e6-firebase-adminsdk-fbsvc-47ec0b1dda.json"
);
if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    "Firebase service account key file not found at:",
    serviceAccountPath
  );
  process.exit(1); // 키 파일 없으면 서버 시작 중단
}
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const userJsonPath = path.join(__dirname, "user.json");

// user.json 파일이 없으면 빈 배열로 초기화된 파일 생성
if (!fs.existsSync(userJsonPath)) {
  console.log("user.json not found, creating an empty file.");
  fs.writeFileSync(
    userJsonPath,
    JSON.stringify({ tokens: [] }, null, 2),
    "utf8"
  );
}

// API to send FCM notification
app.post("/api/send-notification", async (req, res) => {
  try {
    console.log("send-notification request received:", req.body);
    const { title, body } = req.body;

    // Read tokens from file
    let tokens = [];
    try {
      const userData = JSON.parse(fs.readFileSync(userJsonPath, "utf8"));
      tokens = userData.tokens || [];
    } catch (readError) {
      console.error("Error reading or parsing user.json:", readError);
      // 파일 읽기/파싱 오류 시에도 계속 진행하되 로그를 남김
    }

    console.log("Tokens found:", tokens);

    if (tokens.length === 0) {
      console.log("No tokens found in user.json");
      return res.status(404).json({ error: "알림을 보낼 토큰이 없습니다." });
    }

    // Default test message if not provided
    const notificationTitle = title || "테스트 타이틀";
    const notificationBody = body || "테스트 컨텐츠";

    //- 메시지 페이로드 생성
    const message = {
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      android: {
        // priority: 'high', // 필요시 우선순위 설정
        notification: {
          channelId: "ok-tether", // 앱의 알림 채널 ID와 일치해야 함
          // sound: 'default', // 기본 알림 소리
          // tag: 'your_notification_tag' // 필요시 알림 그룹화 태그
        },
      },
      apns: {
        headers: {
          "apns-priority": "10", // iOS 우선순위 (5 또는 10)
        },
        payload: {
          aps: {
            alert: {
              title: notificationTitle,
              body: notificationBody,
            },
            sound: "default", // 기본 알림 소리
            // 'content-available': 1, // 백그라운드 업데이트 알림 시 필요 (일반 알림과 동시 사용 주의)
            // 'mutable-content': 1, // Notification Service Extension 사용 시
          },
        },
      },
      // 데이터 페이로드: 앱이 포그라운드/백그라운드 상태일 때 추가 데이터 전달
      data: {
        screen: "Mypage", // 클라이언트 앱에서 이 값을 사용하여 특정 화면으로 이동
        // 추가적인 필요한 데이터 전달 가능
        // 'custom_key': 'custom_value'
      },
      tokens: tokens, // 배열 형태로 토큰 전달
    };

    console.log("Sending FCM message:", JSON.stringify(message, null, 2));

    //- 메시지 전송
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("FCM response received:", response);

    // 실패한 토큰 처리 (선택적)
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error(`Token ${tokens[idx]} failed: ${resp.error}`);
          // 필요시 실패한 토큰을 user.json에서 제거하는 로직 추가
        }
      });
      console.log("Failed tokens:", failedTokens);
    }

    res.status(200).json({
      message: `알림 전송 완료`,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error("알림 전송 중 오류 발생:", error);
    res.status(500).json({ error: "서버 내부 오류 발생" });
  }
});

// HTTP 서버 생성
const PORT = process.env.PORT || 8080;
const server = http.createServer(app); // Express 앱을 http 서버에 연결

// WebSocket 서버 설정 (*** 핵심 수정 부분 ***)
// 1. 각 WebSocket 서버를 noServer: true 옵션으로 생성
const wssKospi = new WebSocket.Server({ noServer: true });
const wssTheme = new WebSocket.Server({ noServer: true });

// Kospi 데이터 브로드캐스트 함수
const broadcastKospi = () => {
  if (wssKospi.clients.size === 0) return; // 연결된 클라이언트 없으면 실행 안함

  const calculatedData = mockData.map((item) => {
    const currentValue = item.value;
    // 좀 더 현실적인 변동성 부여 (예: +- 1% 범위 내 랜덤 변동)
    const fluctuation = (Math.random() - 0.5) * (currentValue * 0.02);
    const nextValue = Math.max(0, currentValue + fluctuation); // 0 미만 방지
    const change = nextValue - currentValue;
    const changeRate = currentValue !== 0 ? change / currentValue : 0;
    return {
      ...item,
      value: parseFloat(nextValue.toFixed(4)),
      change: parseFloat(change.toFixed(4)),
      changeRate: parseFloat(changeRate.toFixed(4)),
      state: change >= 0 ? "Up" : "Down",
    };
  });

  const message = JSON.stringify({
    kospi: calculatedData,
    serverTime: new Date(),
  });

  wssKospi.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Theme 데이터 브로드캐스트 함수
const broadcastTheme = () => {
  if (wssTheme.clients.size === 0) return; // 연결된 클라이언트 없으면 실행 안함

  try {
    const themeData = fetchRealTimeData(); // 실제 데이터 가져오기
    const message = JSON.stringify({
      theme: themeData,
      serverTime: new Date(),
    });

    wssTheme.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  } catch (error) {
    console.error("테마 데이터 가져오기 또는 전송 오류:", error);
    // 에러 발생 시 클라이언트에 알림 (선택적)
    const errorMessage = JSON.stringify({
      error: "테마 데이터 처리 중 오류 발생",
      serverTime: new Date(),
    });
    wssTheme.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(errorMessage);
      }
    });
  }
};

// 주기적 브로드캐스트 설정
const broadcastInterval = setInterval(broadcastKospi, 1000);
const broadcastThemeInterval = setInterval(broadcastTheme, 1000);

// WebSocket 연결 처리 - Kospi
wssKospi.on("connection", (ws, req) => {
  // req 객체를 통해 클라이언트 정보 접근 가능
  const clientIp = req.socket.remoteAddress || req.headers["x-forwarded-for"]; // IP 주소 로깅 (프록시 고려)
  console.log(`코스피 클라이언트 연결됨: ${clientIp}`);

  ws.on("message", (message) => {
    try {
      // Buffer를 문자열로 변환 후 JSON 파싱
      const messageString = message.toString("utf8");
      const parsedMessage = JSON.parse(messageString);
      console.log(`[Kospi] 메시지 수신 (${clientIp}):`, parsedMessage);

      // 메시지 구조 확인 및 처리
      const { header: token, body } = parsedMessage;
      if (body && body.symbolList) {
        const { symbolList } = body;
        console.log(`[Kospi] 요청된 심볼 목록 (${clientIp}):`, symbolList);
        // 여기서 symbolList 기반의 추가 작업 수행 가능
      } else {
        console.log(`[Kospi] (${clientIp}) 메시지 body 또는 symbolList 누락`);
      }
    } catch (error) {
      console.error(`[Kospi] (${clientIp}) 메시지 처리 오류:`, error);
      ws.send(JSON.stringify({ error: "잘못된 메시지 형식입니다." })); // 오류 응답 전송
    }
  });

  ws.on("error", (error) => {
    console.error(`[Kospi] 웹소켓 오류 (${clientIp}):`, error);
  });

  ws.on("close", (code, reason) => {
    // reason을 Buffer에서 문자열로 변환
    const reasonString = reason
      ? reason.toString("utf8")
      : "No reason provided";
    console.log(
      `코스피 클라이언트 연결 종료 (${clientIp}): 코드 ${code}, 이유: ${reasonString}`
    );
  });
});

// WebSocket 연결 처리 - Theme
wssTheme.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress || req.headers["x-forwarded-for"];
  console.log(`테마 클라이언트 연결됨: ${clientIp}`);

  ws.on("message", (message) => {
    try {
      const messageString = message.toString("utf8");
      const parsedMessage = JSON.parse(messageString);
      console.log(`[Theme] 메시지 수신 (${clientIp}):`, parsedMessage);

      const { header: token, body } = parsedMessage;
      if (body && body.symbolList) {
        const { symbolList } = body;
        console.log(`[Theme] 요청된 심볼 목록 (${clientIp}):`, symbolList);
      } else {
        console.log(`[Theme] (${clientIp}) 메시지 body 또는 symbolList 누락`);
      }
    } catch (error) {
      console.error(`[Theme] (${clientIp}) 메시지 처리 오류:`, error);
      ws.send(JSON.stringify({ error: "잘못된 메시지 형식입니다." }));
    }
  });

  ws.on("error", (error) => {
    console.error(`[Theme] 웹소켓 오류 (${clientIp}):`, error);
  });

  ws.on("close", (code, reason) => {
    const reasonString = reason
      ? reason.toString("utf8")
      : "No reason provided";
    console.log(
      `테마 클라이언트 연결 종료 (${clientIp}): 코드 ${code}, 이유: ${reasonString}`
    );
  });
});

// 2. HTTP 서버의 'upgrade' 이벤트를 직접 처리하여 WebSocket 요청 라우팅 (*** 핵심 수정 부분 ***)
server.on("upgrade", (request, socket, head) => {
  const pathname = request.url; // 요청 URL 경로 확인

  console.log(`WebSocket 업그레이드 요청 수신: ${pathname}`);

  if (pathname === "/kospi") {
    // '/kospi' 경로 요청 시 wssKospi가 처리하도록 연결
    wssKospi.handleUpgrade(request, socket, head, (ws) => {
      // 연결 성공 시 'connection' 이벤트 발생시킴
      wssKospi.emit("connection", ws, request);
    });
  } else if (pathname === "/theme") {
    // '/theme' 경로 요청 시 wssTheme가 처리하도록 연결
    wssTheme.handleUpgrade(request, socket, head, (ws) => {
      // 연결 성공 시 'connection' 이벤트 발생시킴
      wssTheme.emit("connection", ws, request);
    });
  } else {
    // 정의되지 않은 경로로의 WebSocket 요청은 거부
    console.log(`정의되지 않은 WebSocket 경로(${pathname}) 요청 거부됨.`);
    socket.destroy();
  }
});

// 서버 종료 시 인터벌 정리
process.on("SIGINT", () => {
  console.log("서버 종료 신호 수신 (SIGINT)... 인터벌 정리 중.");
  clearInterval(broadcastInterval);
  clearInterval(broadcastThemeInterval);
  // WebSocket 서버 명시적 종료 (선택적이지만 권장)
  wssKospi.close(() => console.log("Kospi WebSocket 서버 닫힘."));
  wssTheme.close(() => console.log("Theme WebSocket 서버 닫힘."));
  server.close(() => {
    console.log("HTTP 서버 닫힘.");
    process.exit(0); // 모든 정리 후 프로세스 종료
  });
});

// 서버 리스닝 시작
server.listen(PORT, () => {
  console.log(`HTTP 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`Kospi WebSocket: ws://localhost:${PORT}/kospi`);
  console.log(`Theme WebSocket: ws://localhost:${PORT}/theme`);
  console.log(
    `FCM 알림 API: POST http://localhost:${PORT}/api/send-notification`
  );
});
