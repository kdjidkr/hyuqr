const key = '4557506f416b646a33337a7566784c';
const url = `http://openAPI.seoul.go.kr:8088/${key}/json/SearchSTNTimeTableByIDService/1/10/1755/1/1/`;

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
