
const key = process.env.SUBWAY_KEY;
const codes = {
  '1004': '0449',
  '1075': 'K251'
};

async function test() {
  console.log('Testing Subway Timetable API...');
  if (!key) {
    console.error('ERROR: SUBWAY_KEY not provided in env');
    return;
  }
  
  for (const [line, code] of Object.entries(codes)) {
    console.log(`\nLine ${line} (Code: ${code}):`);
    for (const upDown of ['1', '2']) {
      const url = `http://openAPI.seoul.go.kr:8088/${key}/json/SearchSTNTimeTableByIDService/1/5/${code}/1/${upDown}/`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.SearchSTNTimeTableByIDService) {
          console.log(`  Direction ${upDown}: SUCCESS (${data.SearchSTNTimeTableByIDService.list_total_count} entries)`);
          const first = data.SearchSTNTimeTableByIDService.row[0];
          console.log(`  Sample: ${first.ARRIVETIME} ${first.SUBWAYENAME} (Train ${first.TRAIN_NO})`);
        } else {
          console.log(`  Direction ${upDown}: FAILED`, JSON.stringify(data.RESULT || data));
        }
      } catch (e) {
        console.log(`  Direction ${upDown}: ERROR`, e.message);
      }
    }
  }
}

test();
