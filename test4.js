import https from 'https';

// 测试东方财富基金详情API
console.log('=== 测试东方财富基金估值API ===');
const url2 = 'https://api.fund.eastmoney.com/f10/lsjz?fundCode=000001&pageIndex=1&pageSize=1';
https.get(url2, {headers: {'Referer': 'https://fund.eastmoney.com', 'User-Agent': 'Mozilla/5.0'}}, res => {
  console.log('状态:', res.statusCode);
  console.log('CORS:', res.headers['access-control-allow-origin'] || '无');
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('数据:', data.substring(0, 600));
  });
}).on('error', e => console.log('错误:', e.message));
