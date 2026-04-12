import https from 'https';

// 测试东方财富基金搜索API
console.log('=== 测试东方财富基金搜索 ===');
const url = 'https://search-api-web.eastmoney.com/search/jsonp?cb=jQuery&param={"uid":"","keyword":"000001","type":14,"client":"web","clientType":"pc","clientVersion":"curr","param":{}}';

https.get(encodeURI(url), res => {
  console.log('状态:', res.statusCode);
  console.log('CORS:', res.headers['access-control-allow-origin'] || '无');
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('数据:', data.substring(0, 600));
  });
}).on('error', e => console.log('错误:', e.message));
