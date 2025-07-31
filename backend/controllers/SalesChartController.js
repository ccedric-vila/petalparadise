const db = require('../config/db');


// Pie chart: Most sold products (with month/year filter)
exports.getMostSoldProducts = (req, res) => {
    const { year, month } = req.query;
    
    let sql = `
        SELECT p.name, SUM(oi.quantity) as total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (year) {
        conditions.push('YEAR(o.created_at) = ?');
        params.push(year);
    }
    
    if (month) {
        conditions.push('MONTH(o.created_at) = ?');
        params.push(month);
    }
    
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += `
        GROUP BY oi.product_id
        ORDER BY total_sold DESC
        LIMIT 10
    `;
    
    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error', error: err });
        res.json(rows);
    });
};

// Line chart: Most buyer addresses (with month/year filter)
exports.getOrdersByAddress = (req, res) => {
    const { year, month } = req.query;
    
    let sql = `
        SELECT shipping_address as address, COUNT(*) as total_orders
        FROM orders
    `;
    
    const conditions = [];
    const params = [];
    
    if (year) {
        conditions.push('YEAR(created_at) = ?');
        params.push(year);
    }
    
    if (month) {
        conditions.push('MONTH(created_at) = ?');
        params.push(month);
    }
    
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += `
        GROUP BY shipping_address
        ORDER BY total_orders DESC
        LIMIT 10
    `;
    
    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error', error: err });
        res.json(rows);
    });
};

// Bar chart: Sales per month (with optional filter)
exports.getMonthlySales = (req, res) => {
    const { year, month } = req.query;
    
    let sql = `
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total_amount) as total_sales
        FROM orders
    `;
    
    const conditions = [];
    const params = [];
    
    if (year) {
        conditions.push('YEAR(created_at) = ?');
        params.push(year);
    }
    
    if (month) {
        conditions.push('MONTH(created_at) = ?');
        params.push(month);
    }
    
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += `
        GROUP BY month
        ORDER BY month ASC
    `;
    
    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error', error: err });
        res.json(rows);
    });
};


exports.getMostLoyalCustomers = (req, res) => {
    const { year, month } = req.query;

    let sql = `
        SELECT u.id, u.name, u.email, SUM(oi.quantity) AS total_items_purchased
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN users u ON o.user_id = u.id
    `;

    const conditions = [];
    const params = [];

    if (year) {
        conditions.push('YEAR(o.created_at) = ?');
        params.push(year);
    }

    if (month) {
        conditions.push('MONTH(o.created_at) = ?');
        params.push(month);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += `
        GROUP BY u.id
        ORDER BY total_items_purchased DESC
        LIMIT 10
    `;

    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error', error: err });
        res.json(rows);
    });
};


