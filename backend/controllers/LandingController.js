const connection = require('../config/db');

exports.getLandingData = (req, res) => {
    // Public: get limited products for landing page showcase
    const query = `
        SELECT id, name, category, usage_type, description, price, color, stock, image, created_at
        FROM products
        WHERE stock > 0
        ORDER BY created_at DESC
        LIMIT 15
    `;
    
    connection.query(query, (err, products) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to load products' });
        }
        res.json({ products });
    });
};

exports.getFeaturedProducts = (req, res) => {
    // Get featured products (latest 6 products with stock)
    const query = `
        SELECT id, name, category, usage_type, description, price, color, stock, image, created_at
        FROM products
        WHERE stock > 0
        ORDER BY created_at DESC
        LIMIT 6
    `;
    
    connection.query(query, (err, featuredProducts) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to load featured products' });
        }
        res.json({ featuredProducts });
    });
};

exports.getProductsByCategory = (req, res) => {
    const { category } = req.params;
    
    const query = `
        SELECT id, name, category, usage_type, description, price, color, stock, image, created_at
        FROM products
        WHERE category = ? AND stock > 0
        ORDER BY name ASC
        LIMIT 15
    `;
    
    connection.query(query, [category], (err, products) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to load products by category' });
        }
        res.json({ products });
    });
};

exports.getProductsByUsageType = (req, res) => {
    const { usageType } = req.params;
    
    const query = `
        SELECT id, name, category, usage_type, description, price, color, stock, image, created_at
        FROM products
        WHERE usage_type = ? AND stock > 0
        ORDER BY name ASC
        LIMIT 15
    `;
    
    connection.query(query, [usageType], (err, products) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to load products by usage type' });
        }
        res.json({ products });
    });
};

exports.getProductDetails = (req, res) => {
    const { productId } = req.params;
    
    const query = `
        SELECT id, name, category, usage_type, description, price, color, stock, image, created_at
        FROM products
        WHERE id = ?
    `;
    
    connection.query(query, [productId], (err, product) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to load product details' });
        }
        
        if (product.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ product: product[0] });
    });
};