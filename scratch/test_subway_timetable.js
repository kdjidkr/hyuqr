const key = '4557506f416b646a33337a7566784c';
// 0449: 한대앞 (Line 4)
// DayType: 1 (Weekday), 2 (Sat), 3 (Sun)
// UpDown: 1 (Up), 2 (Down)
const url = `http://openAPI.seoul.go.kr:8088/${key}/json/SearchSTNTimeTableByIDService/1/500/0449/1/1/`;

async function test() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
