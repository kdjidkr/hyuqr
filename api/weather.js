// Vercel Serverless Function: Weather & Air Quality API Proxy
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const LAT = 37.297;
  const LNG = 126.834;

  try {
    // 1. 날씨 및 자외선 데이터 호출
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,weather_code,uv_index&hourly=weather_code&timezone=Asia%2FSeoul&forecast_days=1`;
    
    // 2. 대기질 데이터 호출 (미세먼지, 초미세먼지)
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LNG}&current=pm10,pm2_5&timezone=Asia%2FSeoul`;

    const [weatherRes, airRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(airQualityUrl)
    ]);

    const weatherData = await weatherRes.json();
    const airData = await airRes.json();

    const currentTemp = Math.round(weatherData.current.temperature_2m);
    const weatherCode = weatherData.current.weather_code;
    const uvIndex = weatherData.current.uv_index;

    // 대기질 및 자외선 정보 가공
    const pm10 = Math.round(airData.current.pm10);
    const pm25 = Math.round(airData.current.pm2_5);

    // 07:00 ~ 22:00 강수 예보
    const hourlyCodes = weatherData.hourly.weather_code.slice(7, 23); 
    let precipType = null;
    let precipTime = null;

    for (let i = 0; i < hourlyCodes.length; i++) {
      const code = hourlyCodes[i];
      const hour = i + 7;
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        precipType = 'rain'; precipTime = hour; break;
      } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        precipType = 'snow'; precipTime = hour; break;
      }
    }

    const processedData = {
      temp: currentTemp,
      description: getWeatherDescription(weatherCode),
      message: generateWeatherMessage(weatherCode, currentTemp, precipType, precipTime),
      hasPrecipitation: !!precipType,
      airQuality: {
        pm10: { value: pm10, ...getPm10Status(pm10) },
        pm25: { value: pm25, ...getPm25Status(pm25) },
        uv: { value: uvIndex, ...getUvStatus(uvIndex) }
      },
      updatedAt: Date.now()
    };

    return res.status(200).json(processedData);
  } catch (error) {
    console.error('Weather/Air fetch error:', error);
    return res.status(500).json({ error: 'Weather fetch failed' });
  }
}

function getPm10Status(val) {
  if (val <= 30) return { label: '좋음', color: '#3b82f6' };
  if (val <= 80) return { label: '보통', color: '#22c55e' };
  if (val <= 150) return { label: '나쁨', color: '#f59e0b' };
  return { label: '매우나쁨', color: '#ef4444' };
}

function getPm25Status(val) {
  if (val <= 15) return { label: '좋음', color: '#3b82f6' };
  if (val <= 35) return { label: '보통', color: '#22c55e' };
  if (val <= 75) return { label: '나쁨', color: '#f59e0b' };
  return { label: '매우나쁨', color: '#ef4444' };
}

function getUvStatus(val) {
  if (val <= 2) return { label: '낮음', color: '#3b82f6' };
  if (val <= 5) return { label: '보통', color: '#22c55e' };
  if (val <= 7) return { label: '높음', color: '#f59e0b' };
  if (val <= 10) return { label: '매우높음', color: '#ef4444' };
  return { label: '위험', color: '#991b1b' };
}

function generateWeatherMessage(code, temp, precipType, precipTime) {
  const rand = Math.floor(Math.random() * 3);
  if (precipType === 'snow') return [`오늘 ${precipTime}시경에 눈 소식이 있습니다. 미끄러운 길 조심하세요.`, `${precipTime}시쯤부터 눈이 내릴 것으로 예상됩니다. 안전에 유의하세요.`, `오후 ${precipTime}시경 눈 예보가 있습니다. 이동 시 주의하시기 바랍니다.`][rand];
  if (precipType === 'rain') return [`오늘 ${precipTime}시경부터 비 소식이 있습니다. 우산을 미리 챙기세요.`, `${precipTime}시쯤 비가 시작될 것으로 보입니다. 외출 시 참고하세요.`, `오늘 오후 ${precipTime}시경에 비가 예보되어 있습니다.`][rand];
  if (temp <= 0) return ["날씨가 매우 춥습니다. 옷을 든든하게 챙겨 입으세요.", "기온이 낮아 체감 온도가 많이 떨어졌습니다. 따뜻하게 입으세요.", "추운 날씨입니다. 감기 조심하시고 보온에 신경 쓰세요."][rand];
  if (temp >= 28) return ["현재 기온이 매우 높습니다. 무더위에 지치지 않게 조심하세요.", "폭염이 예상되는 날씨입니다. 야외 활동 시 수분 섭취를 자주 하세요.", "날씨가 많이 덥습니다. 통풍이 잘 되는 옷을 입고 건강에 유의하세요."][rand];
  if (code >= 45 || code === 2 || code === 3) return ["현재 하늘에 구름이 많고 조금 흐린 상태입니다.", "구름이 해를 가려 조금 어두운 날씨가 이어지겠습니다.", "오늘은 전반적으로 흐린 날씨가 예상됩니다."][rand];
  return ["오늘은 맑은 하늘이 계속되겠습니다. 즐거운 하루 보내세요!", "구름 없이 화창한 날씨입니다. 야외 활동하기 좋겠네요.", "현재 날씨가 매우 맑습니다. 기분 좋게 하루 시작하세요!"][rand];
}

function getWeatherDescription(code) {
  if (code <= 1) return '맑음';
  if (code === 2) return '구름 조금';
  if (code === 3 || (code >= 45 && code <= 48)) return '흐림';
  if (code <= 67) return '비';
  if (code <= 77) return '눈';
  if (code <= 82) return '소나기';
  return '흐림';
}
