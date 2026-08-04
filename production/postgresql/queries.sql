-- GramIQ Production SQL Queries Reference

-- 1. Get Farmer Notebook List with Extracted Transaction Counts
SELECT 
    n.id AS notebook_id,
    n.farmer_id,
    n.original_filename,
    n.status,
    n.quality_score,
    n.upload_time,
    COUNT(t.id) AS total_transactions,
    SUM(CASE WHEN t.type = 'Expense' THEN t.amount ELSE 0 END) AS total_expense,
    SUM(CASE WHEN t.type = 'Income' THEN t.amount ELSE 0 END) AS total_income
FROM public.notebooks n
LEFT JOIN public.transactions t ON t.notebook_id = n.id
GROUP BY n.id
ORDER BY n.upload_time DESC;

-- 2. Compute Farm Category Expenses Breakdown
SELECT 
    category,
    COUNT(id) AS transaction_count,
    SUM(amount) AS total_spent,
    ROUND((SUM(amount) / (SELECT SUM(amount) FROM public.transactions WHERE type = 'Expense') * 100)::numeric, 2) AS percentage_of_expenses
FROM public.transactions
WHERE type = 'Expense'
GROUP BY category
ORDER BY total_spent DESC;

-- 3. Compute Crop Profitability Analysis
SELECT 
    crop,
    SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) AS crop_income,
    SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) AS crop_expense,
    (SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END)) AS net_profit
FROM public.transactions
WHERE crop IS NOT NULL AND crop != ''
GROUP BY crop
ORDER BY net_profit DESC;

-- 4. Get Unverified Transactions Pending Human-in-the-loop Farmer Review
SELECT 
    t.id,
    t.notebook_id,
    t.description,
    t.category,
    t.amount,
    t.type,
    t.confidence,
    t.confidence_level
FROM public.transactions t
WHERE t.verified = false
ORDER BY t.created_at DESC;
