import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mymoney888-secret-key';

app.use(cors());
app.use(express.json());

// 提供静态文件服务
app.use(express.static(join(__dirname, '../dist')));

const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'mymoney888',
  password: process.env.DB_PASSWORD || 'mymoney888',
  database: process.env.DB_NAME || 'mymoney888',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function initDatabase() {
  try {
    const sqlPath = join(__dirname, 'init-db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const connection = await pool.getConnection();
    await connection.query(sql);
    connection.release();
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
  }
}

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.isAdmin = decoded.isAdmin;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

async function logMessage(level, message, userId, context = null) {
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO logs (user_id, level, message, context) VALUES (?, ?, ?, ?)',
      [userId || null, level, message, context ? JSON.stringify(context) : null]
    );
    connection.release();
  } catch (error) {
    console.error('日志记录失败:', error.message);
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email, adminCode } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    let isAdmin = false;
    if (adminCode === 'admin123') {
      isAdmin = true;
    }
    const connection = await pool.getConnection();
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ error: '用户名已存在' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await connection.query(
      'INSERT INTO users (username, password_hash, email, is_admin) VALUES (?, ?, ?, ?)',
      [username, passwordHash, email || null, isAdmin]
    );
    await connection.query(
      'INSERT INTO books (user_id, name, description) VALUES (?, ?, ?)',
      [result.insertId, '默认账套', '我的个人账套']
    );
    connection.release();
    await logMessage('info', `用户注册: ${username}`, result.insertId);
    res.json({ message: '注册成功', userId: result.insertId });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败: ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    connection.release();
    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    await logMessage('info', `用户登录: ${username}`, user.id);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败: ' + error.message });
  }
});

app.get('/api/books', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [books] = await connection.query(
      'SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    connection.release();
    res.json(books);
  } catch (error) {
    console.error('获取账套失败:', error);
    res.status(500).json({ error: '获取账套失败: ' + error.message });
  }
});

app.post('/api/books', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO books (user_id, name, description) VALUES (?, ?, ?)',
      [req.userId, name, description || null]
    );
    connection.release();
    await logMessage('info', `创建账套: ${name}`, req.userId);
    res.json({ id: result.insertId, name, description });
  } catch (error) {
    console.error('创建账套失败:', error);
    res.status(500).json({ error: '创建账套失败: ' + error.message });
  }
});

app.get('/api/books/:bookId/accounts', verifyToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const connection = await pool.getConnection();
    const [accounts] = await connection.query(
      'SELECT * FROM accounts WHERE book_id = ? ORDER BY type, name',
      [bookId]
    );
    connection.release();
    res.json(accounts);
  } catch (error) {
    console.error('获取账户失败:', error);
    res.status(500).json({ error: '获取账户失败: ' + error.message });
  }
});

app.post('/api/books/:bookId/accounts', verifyToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { name, type, balance, description } = req.body;
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO accounts (book_id, name, type, balance, description) VALUES (?, ?, ?, ?, ?)',
      [bookId, name, type, balance || 0, description || null]
    );
    connection.release();
    await logMessage('info', `创建账户: ${name}`, req.userId, { bookId });
    res.json({ id: result.insertId, name, type, balance, description });
  } catch (error) {
    console.error('创建账户失败:', error);
    res.status(500).json({ error: '创建账户失败: ' + error.message });
  }
});

app.put('/api/books/:bookId/accounts/:accountId', verifyToken, async (req, res) => {
  try {
    const { bookId, accountId } = req.params;
    const { name, type, balance, description } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE accounts SET name = ?, type = ?, balance = ?, description = ? WHERE id = ? AND book_id = ?',
      [name, type, balance, description || null, accountId, bookId]
    );
    connection.release();
    await logMessage('info', `更新账户: ${name}`, req.userId, { bookId, accountId });
    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新账户失败:', error);
    res.status(500).json({ error: '更新账户失败: ' + error.message });
  }
});

app.delete('/api/books/:bookId/accounts/:accountId', verifyToken, async (req, res) => {
  try {
    const { bookId, accountId } = req.params;
    const connection = await pool.getConnection();
    await connection.query(
      'DELETE FROM accounts WHERE id = ? AND book_id = ?',
      [accountId, bookId]
    );
    connection.release();
    await logMessage('info', `删除账户 ID: ${accountId}`, req.userId, { bookId, accountId });
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除账户失败:', error);
    res.status(500).json({ error: '删除账户失败: ' + error.message });
  }
});

app.get('/api/books/:bookId/categories', verifyToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { type } = req.query;
    const connection = await pool.getConnection();
    let query = 'SELECT * FROM categories WHERE book_id = ?';
    let params = [bookId];
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    query += ' ORDER BY type, name';
    const [categories] = await connection.query(query, params);
    connection.release();
    res.json(categories);
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ error: '获取分类失败: ' + error.message });
  }
});

app.post('/api/books/:bookId/categories', verifyToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { name, type, parentId, icon } = req.body;
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO categories (book_id, name, type, parent_id, icon) VALUES (?, ?, ?, ?, ?)',
      [bookId, name, type, parentId || null, icon || null]
    );
    connection.release();
    res.json({ id: result.insertId, name, type, parentId, icon });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({ error: '创建分类失败: ' + error.message });
  }
});

app.get('/api/books/:bookId/transactions', verifyToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { type, startDate, endDate, limit } = req.query;
    const connection = await pool.getConnection();
    let query = 'SELECT t.*, a.name as account_name, cat.name as category_name, m.name as merchant_name FROM transactions t LEFT JOIN accounts a ON t.account_id = a.id LEFT JOIN categories cat ON t.category_id = cat.id LEFT JOIN merchants m ON t.merchant_id = m.id WHERE t.book_id = ?';
    let params = [bookId];
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }
    if (startDate) {
      query += ' AND t.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND t.date <= ?';
      params.push(endDate);
    }
    query += ' ORDER BY t.date DESC, t.created_at DESC';
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    const [transactions] = await connection.query(query, params);
    connection.release();
    res.json(transactions);
  } catch (error) {
    console.error('获取交易失败:', error);
    res.status(500).json({ error: '获取交易失败: ' + error.message });
  }
});

app.post('/api/books/:bookId/transactions', verifyToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { type, amount, accountId, toAccountId, categoryId, merchantId, date, remark, isInstallment, installmentId, installmentPeriod, installmentTotalPeriods } = req.body;
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    const [result] = await connection.query('INSERT INTO transactions (book_id, user_id, type, amount, account_id, to_account_id, category_id, merchant_id, date, remark, is_installment, installment_id, installment_period, installment_total_periods) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [bookId, req.userId, type, amount, accountId, toAccountId || null, categoryId || null, merchantId || null, date, remark || null, isInstallment || false, installmentId || null, installmentPeriod || null, installmentTotalPeriods || null]);
    if (type === 'income') {
      await connection.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, accountId]);
    } else if (type === 'expense') {
      await connection.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);
    } else if (type === 'transfer') {
      await connection.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, accountId]);
      await connection.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toAccountId]);
    }
    await connection.commit();
    connection.release();
    await logMessage('info', `创建交易: ${type} ${amount}`, req.userId, { bookId });
    res.json({ id: result.insertId, message: '创建成功' });
  } catch (error) {
    console.error('创建交易失败:', error);
    res.status(500).json({ error: '创建交易失败: ' + error.message });
  }
});

app.delete('/api/books/:bookId/transactions/:transactionId', verifyToken, async (req, res) => {
  try {
    const { bookId, transactionId } = req.params;
    const connection = await pool.getConnection();
    const [transactions] = await connection.query('SELECT * FROM transactions WHERE id = ? AND book_id = ?', [transactionId, bookId]);
    if (transactions.length === 0) {
      connection.release();
      return res.status(404).json({ error: '交易不存在' });
    }
    const transaction = transactions[0];
    await connection.beginTransaction();
    if (transaction.type === 'income') {
      await connection.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [transaction.amount, transaction.account_id]);
    } else if (transaction.type === 'expense') {
      await connection.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [transaction.amount, transaction.account_id]);
    } else if (transaction.type === 'transfer') {
      await connection.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [transaction.amount, transaction.account_id]);
      if (transaction.to_account_id) {
        await connection.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [transaction.amount, transaction.to_account_id]);
      }
    }
    await connection.query('DELETE FROM transactions WHERE id = ?', [transactionId]);
    await connection.commit();
    connection.release();
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除交易失败:', error);
    res.status(500).json({ error: '删除交易失败: ' + error.message });
  }
});

app.get('/api/books/:bookId/merchants', verifyToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const connection = await pool.getConnection();
    const [merchants] = await connection.query('SELECT * FROM merchants WHERE book_id = ? ORDER BY name', [bookId]);
    connection.release();
    res.json(merchants);
  } catch (error) {
    console.error('获取商家失败:', error);
    res.status(500).json({ error: '获取商家失败: ' + error.message });
  }
});

app.post('/api/books/:bookId/merchants', verifyToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { name, categoryId } = req.body;
    const connection = await pool.getConnection();
    const [result] = await connection.query('INSERT INTO merchants (book_id, name, category_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE category_id = VALUES(category_id)', [bookId, name, categoryId || null]);
    connection.release();
    res.json({ id: result.insertId, name, categoryId });
  } catch (error) {
    console.error('创建商家失败:', error);
    res.status(500).json({ error: '创建商家失败: ' + error.message });
  }
});

app.get('/api/books/:bookId/statistics', verifyToken, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { startDate, endDate } = req.query;
    const connection = await pool.getConnection();
    let dateFilter = '';
    let params = [bookId];
    if (startDate && endDate) {
      dateFilter = ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    const [incomeByCategory] = await connection.query('SELECT c.name, SUM(t.amount) as total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.book_id = ? AND t.type = "income"' + dateFilter + ' GROUP BY c.id, c.name ORDER BY total DESC', params);
    const [expenseByCategory] = await connection.query('SELECT c.name, SUM(t.amount) as total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.book_id = ? AND t.type = "expense"' + dateFilter + ' GROUP BY c.id, c.name ORDER BY total DESC', params);
    const [totals] = await connection.query('SELECT SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) as total_income, SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END) as total_expense, SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) - SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END) as balance FROM transactions WHERE book_id = ?' + dateFilter, params);
    connection.release();
    res.json({
      incomeByCategory,
      expenseByCategory,
      totals: totals[0] || { total_income: 0, total_expense: 0, balance: 0 }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '获取统计失败: ' + error.message });
  }
});

app.get('/api/logs', verifyToken, async (req, res) => {
  try {
    const { level, limit } = req.query;
    const connection = await pool.getConnection();
    let query = 'SELECT * FROM logs WHERE 1=1';
    let params = [];
    if (req.isAdmin) {
    } else {
      query += ' AND user_id = ?';
      params.push(req.userId);
    }
    if (level) {
      query += ' AND level = ?';
      params.push(level);
    }
    query += ' ORDER BY created_at DESC';
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    const [logs] = await connection.query(query, params);
    connection.release();
    res.json(logs);
  } catch (error) {
    console.error('获取日志失败:', error);
    res.status(500).json({ error: '获取日志失败: ' + error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0' });
});

// 处理所有未匹配的路由，重定向到前端的 index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`服务器运行在端口 ${PORT}`);
  await initDatabase();
});