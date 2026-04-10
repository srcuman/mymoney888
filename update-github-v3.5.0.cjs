// GitHub文件更新脚本 - v3.5.0
const fs = require('fs');
const https = require('https');

const OWNER = 'srcuman';
const REPO = 'mymoney888';
const BRANCH = 'main';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('错误：请设置GITHUB_TOKEN环境变量');
  process.exit(1);
}

// 读取文件内容
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Base64编码
function toBase64(content) {
  return Buffer.from(content).toString('base64');
}

// 获取文件当前SHA（如果存在）
function getFileSha(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'Node.js',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          resolve(json.sha);
        } else if (res.statusCode === 404) {
          resolve(null); // 文件不存在
        } else {
          reject(new Error(`获取文件SHA失败: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// 创建或更新文件
async function createOrUpdateFile(path, content, message) {
  try {
    const sha = await getFileSha(path);
    
    const body = {
      message: message,
      content: toBase64(content),
      branch: BRANCH
    };
    
    if (sha) {
      body.sha = sha;
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${OWNER}/${REPO}/contents/${path}`,
        method: 'PUT',
        headers: {
          'Authorization': `token ${TOKEN}`,
          'User-Agent': 'Node.js',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ 成功更新: ${path}`);
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`更新失败: ${res.statusCode} ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(body));
      req.end();
    });
  } catch (error) {
    console.error(`❌ 更新 ${path} 失败:`, error.message);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    console.log('开始更新GitHub文件...\n');
    
    // 更新 package.json
    const packageJson = readFile('z:\\AI\\项目\\888-2\\package.json');
    await createOrUpdateFile('package.json', packageJson, 'v3.5.0 更新版本号');
    
    // 更新 README.md
    const readmeMd = readFile('z:\\AI\\项目\\888-2\\README.md');
    await createOrUpdateFile('README.md', readmeMd, 'v3.5.0 更新README.md');
    
    // 更新 DATABASE_DESIGN.md
    const databaseDesignMd = readFile('z:\\AI\\项目\\888-2\\DATABASE_DESIGN.md');
    await createOrUpdateFile('DATABASE_DESIGN.md', databaseDesignMd, 'v3.5.0 更新数据库设计文档');
    
    // 更新 src/App.vue
    const appVue = readFile('z:\\AI\\项目\\888-2\\src\\App.vue');
    await createOrUpdateFile('src/App.vue', appVue, 'v3.5.0 添加投资管理导航链接和更新版本号');
    
    // 更新 src/views/StatisticsView.vue
    const statisticsViewVue = readFile('z:\\AI\\项目\\888-2\\src\\views\\StatisticsView.vue');
    await createOrUpdateFile('src/views/StatisticsView.vue', statisticsViewVue, 'v3.5.0 优化统计分析功能');
    
    // 更新 src/views/InvestmentsView.vue
    const investmentsViewVue = readFile('z:\\AI\\项目\\888-2\\src\\views\\InvestmentsView.vue');
    await createOrUpdateFile('src/views/InvestmentsView.vue', investmentsViewVue, 'v3.5.0 添加投资管理功能');
    
    // 更新 src/router/index.js
    const routerIndexJs = readFile('z:\\AI\\项目\\888-2\\src\\router\\index.js');
    await createOrUpdateFile('src/router/index.js', routerIndexJs, 'v3.5.0 添加投资管理路由');
    
    console.log('\n✅ 所有文件更新成功！');
  } catch (error) {
    console.error('\n❌ 更新失败:', error.message);
    process.exit(1);
  }
}

main();