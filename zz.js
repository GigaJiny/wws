const fs = require("fs");

function getInitialConsonant(char) {
  // 한글 유니코드 범위 체크 (가~힣)
  if (/[가-힣]/.test(char)) {
    // 한글 유니코드 계산식을 사용하여 초성 추출
    const code = char.charCodeAt(0) - 44032;
    const consonantIndex = Math.floor(code / 588);
    // 초성 배열
    const consonants = [
      "ㄱ",
      "ㄲ",
      "ㄴ",
      "ㄷ",
      "ㄸ",
      "ㄹ",
      "ㅁ",
      "ㅂ",
      "ㅃ",
      "ㅅ",
      "ㅆ",
      "ㅇ",
      "ㅈ",
      "ㅉ",
      "ㅊ",
      "ㅋ",
      "ㅌ",
      "ㅍ",
      "ㅎ",
    ];
    return consonants[consonantIndex];
  }
  return char; // 한글이 아닌 경우 그대로 반환
}

const findTranslation = async (original, code) => {
  try {
    const firstChar = original.trim().charAt(0);
    const dbDir = `${__dirname}/db`;
    const jsonPath = `${dbDir}/${getInitialConsonant(firstChar)}.json`;

    console.log(jsonPath, "ㅇㅅㅇ");

    // 디렉토리가 존재하는지 확인
    const dirExists = fs.existsSync(dbDir);
    if (!dirExists) {
      fs.mkdirSync(dbDir);
      return null;
    }

    // Check if file exists and read its content
    let jsonContent = {};
    const fileExists = fs.existsSync(jsonPath);
    if (!fileExists) return null;
    const fileContent = fs.readFileSync(jsonPath, "utf8");
    jsonContent = JSON.parse(fileContent);
    console.log(jsonContent, "제이슨 콘텐츠");
    if (!jsonContent[original]) return null;
    if (!jsonContent[original][code]) return null;
    return jsonContent[original][code];
  } catch (err) {
    console.log(err, "에러임ㅋㅋ");
    return null;
  }
};
findTranslation('"개인', "en");
