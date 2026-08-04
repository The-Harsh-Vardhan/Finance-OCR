/**
 * GramIQ Production PostgreSQL / Supabase Client Module
 */

const { Pool } = require('pg');

class DatabaseClient {
  constructor(connectionString = process.env.DATABASE_URL) {
    this.connectionString = connectionString;
    this.pool = null;
  }

  getPool() {
    if (!this.pool) {
      if (!this.connectionString) {
        throw new Error('DATABASE_URL environment variable is not defined.');
      }
      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: this.connectionString.includes('supabase') ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }
    return this.pool;
  }

  async query(text, params) {
    const pool = this.getPool();
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  }

  async getFarmerNotebooks(farmerId) {
    const res = await this.query(
      'SELECT * FROM public.notebooks WHERE farmer_id = $1 ORDER BY upload_time DESC',
      [farmerId]
    );
    return res.rows;
  }

  async getTransactionsByNotebook(notebookId) {
    const res = await this.query(
      'SELECT * FROM public.transactions WHERE notebook_id = $1 ORDER BY created_at ASC',
      [notebookId]
    );
    return res.rows;
  }

  async getFarmerAnalyticsSummary(farmerId = null) {
    let whereClause = farmerId ? 'WHERE n.farmer_id = $1' : '';
    let params = farmerId ? [farmerId] : [];

    const totalsQuery = `
      SELECT 
        COUNT(DISTINCT n.id) AS total_notebooks,
        COUNT(t.id) AS total_transactions,
        SUM(CASE WHEN t.verified = true THEN 1 ELSE 0 END) AS verified_transactions,
        SUM(CASE WHEN t.type = 'Expense' THEN t.amount ELSE 0 END) AS total_expenses,
        SUM(CASE WHEN t.type = 'Income' THEN t.amount ELSE 0 END) AS total_income
      FROM public.notebooks n
      LEFT JOIN public.transactions t ON t.notebook_id = n.id
      ${whereClause}
    `;

    const totalsRes = await this.query(totalsQuery, params);
    const totals = totalsRes.rows[0] || {};

    const totalIncome = parseFloat(totals.total_income || 0);
    const totalExpenses = parseFloat(totals.total_expenses || 0);
    const netPnl = totalIncome - totalExpenses;

    const catQuery = `
      SELECT 
        t.category,
        SUM(t.amount) as total_amount,
        COUNT(t.id) as transaction_count
      FROM public.transactions t
      JOIN public.notebooks n ON n.id = t.notebook_id
      ${whereClause ? whereClause + " AND t.type = 'Expense'" : "WHERE t.type = 'Expense'"}
      GROUP BY t.category
      ORDER BY total_amount DESC
    `;
    const catRes = await this.query(catQuery, params);

    return {
      total_notebooks: parseInt(totals.total_notebooks || 0, 10),
      total_transactions: parseInt(totals.total_transactions || 0, 10),
      verified_transactions: parseInt(totals.verified_transactions || 0, 10),
      unverified_transactions: parseInt(totals.total_transactions || 0, 10) - parseInt(totals.verified_transactions || 0, 10),
      total_expenses: totalExpenses,
      total_income: totalIncome,
      net_profit_loss: netPnl,
      category_breakdown: catRes.rows.map(r => ({
        category: r.category,
        total_amount: parseFloat(r.total_amount),
        percentage: totalExpenses > 0 ? parseFloat(((r.total_amount / totalExpenses) * 100).toFixed(2)) : 0.0,
        transaction_count: parseInt(r.transaction_count, 10)
      }))
    };
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

module.exports = DatabaseClient;
