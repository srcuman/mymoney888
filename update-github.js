// GitHub文件更新脚本
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
    
    // 更新 index.html
    const indexHtml = readFile('z:\\AI\\项目\\mymoney888\\dist\\index.html');
    await createOrUpdateFile('dist/index.html', indexHtml, '修复Tailwind CSS CDN，使用官方CDN支持渐变样式');
    
    // 更新 app.js
    const appJs = readFile('z:\\AI\\项目\\mymoney888\\dist\\app.js');
    await createOrUpdateFile('dist/app.js', appJs, 'v1.3.0 界面优化：添加渐变样式、图标美化、响应式布局');
    
    console.log('\n✅ 所有文件更新成功！');
  } catch (error) {
    console.error('\n❌ 更新失败:', error.message);
    process.exit(1);
  }
}

main();
