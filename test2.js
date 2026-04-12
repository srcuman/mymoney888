import https from 'https';

async function test() {
  // 测试天天基金
  console.log('=== 测试天天基金 ===');
  await fetchUrl('https://fundgz.1234567.com.cn/js/000001.js?rt=1');
  
  // 测试东方财富基金基本信息
  console.log('\n=== 测试东方财富基金基本信息 ===');
  await fetchUrl('https://fund.eastmoney.com/pingzhongdata/000001.js');
  
  // 测试东方财富基金搜索API
  console.log('\n=== 测试东方财富基金搜索 ===');
  await fetchUrl('https://fundsearch.eastmoney.com/api/funddetail/get?pagesize=1&pageno=1&keyword=000001');
}

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, res => {
      console.log('URL:', url);
      console.log('状态:', res.statusCode);
      console.log('CORS:', res.headers['access-control-allow-origin'] || '无');
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log('数据:', data.substring(0, 250));
        resolve();
      });
    }).on('error', e => {
      console.log('错误:', e.message);
      resolve();
    });
  });
}

test();
