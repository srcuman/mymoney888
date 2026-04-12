// 基金API测试脚本
// 运行: node test-fund-api.js

const https = require('https');

// 天天基金API测试 (东方财富代理)
const testTianTianFund = (code) => {
  return new Promise((resolve, reject) => {
    // 模拟Vite代理: /fund/005310.js -> https://fundgz.1234567.com.cn/js/005310.js
    const url = `https://fundgz.1234567.com.cn/js/${code}.js?rt=1`;
    console.log(`\n=== 测试天天基金API ===`);
    console.log(`URL: ${url}`);

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`状态码: ${res.statusCode}`);
        console.log(`原始响应: ${data.substring(0, 200)}...`);
        
        // 解析数据
        try {
          const match = data.match(/jsonpgz\((.+)\)/);
          if (match) {
            const fundData = JSON.parse(match[1]);
            console.log(`\n解析成功!`);
            console.log(`名称: ${fundData.name}`);
            console.log(`代码: ${fundData.fundcode}`);
            console.log(`估算净值: ${fundData.gsz}`);
            console.log(`估算涨幅: ${fundData.gszzl}%`);
            console.log(`日期时间: ${fundData.gztime}`);
            resolve(fundData);
          } else {
            console.log(`响应格式不匹配`);
            reject(new Error('响应格式不匹配'));
          }
        } catch (e) {
          console.log(`解析失败: ${e.message}`);
          reject(e);
        }
      });
    }).on('error', err => {
      console.log(`请求失败: ${err.message}`);
      reject(err);
    });
  });
};

// 东方财富基金历史净值API测试
const testEastMoneyFund = (code) => {
  return new Promise((resolve, reject) => {
    const url = `https://api.fund.eastmoney.com/f10/lsjz?fundCode=${code}&pageIndex=1&pageSize=1`;
    console.log(`\n=== 测试东方财富基金API ===`);
    console.log(`URL: ${url}`);

    https.get(url, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      console.log(`CORS头: ${res.headers['access-control-allow-origin'] || '无'}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`原始响应: ${data.substring(0, 300)}...`);
        
        try {
          const json = JSON.parse(data);
          if (json.Data && json.Data.LSJZList && json.Data.LSJZList.length > 0) {
            const latest = json.Data.LSJZList[0];
            console.log(`\n解析成功!`);
            console.log(`净值日期: ${latest.FSRQ}`);
            console.log(`单位净值: ${latest.DWJZ}`);
            console.log(`累计净值: ${latest.LJJZ}`);
            resolve(latest);
          } else {
            console.log(`无净值数据`);
            reject(new Error('无净值数据'));
          }
        } catch (e) {
          console.log(`解析失败: ${e.message}`);
          reject(e);
        }
      });
    }).on('error', err => {
      console.log(`请求失败: ${err.message}`);
      reject(err);
    });
  });
};

// 运行测试
async function runTests() {
  const code = process.argv[2] || '005310';
  console.log(`\n========== 基金API测试 - 代码: ${code} ==========`);

  // 测试天天基金
  try {
    await testTianTianFund(code);
  } catch (e) {
    console.log(`天天基金失败: ${e.message}`);
  }

  // 测试东方财富基金
  try {
    await testEastMoneyFund(code);
  } catch (e) {
    console.log(`东方财富基金失败: ${e.message}`);
  }
}

runTests();
