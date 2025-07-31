const db = require('../config/db'); // adjust path if needed

// ➕ Add to cart
exports.addToCart = (req, res) => {
    // Debug logging to see what's in req.user
    console.log('req.user:', req.user);
    console.log('req.user.id:', req.user?.id);
    
    // Try multiple possible user ID sources
    const userId = req.user?.id || req.user?.userId || req.userId;
    const { productId, quantity } = req.body;

    // Validate userId exists
    if (!userId) {
        console.error('No user ID found in request. req.user:', req.user);
        return res.status(401).json({ message: 'User not authenticated properly' });
    }

    // Validate productId exists
    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    console.log('Adding to cart - userId:', userId, 'productId:', productId, 'quantity:', quantity);

    const checkSql = 'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?';
    db.query(checkSql, [userId, productId], (err, rows) => {
        if (err) {
            console.error('Check cart error:', err);
            return res.status(500).json({ message: 'Failed to check cart' });
        }

        if (rows.length > 0) {
            const updateSql = 'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?';
            db.query(updateSql, [quantity || 1, userId, productId], (err, result) => {
                if (err) {
                    console.error('Update cart error:', err);
                    return res.status(500).json({ message: 'Failed to update cart' });
                }
                console.log('Cart updated successfully for user:', userId);
                return res.json({ message: 'Cart updated successfully' });
            });
        } else {
            const insertSql = 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)';
            db.query(insertSql, [userId, productId, quantity || 1], (err, result) => {
                if (err) {
                    console.error('Add to cart error:', err);
                    console.error('SQL values:', [userId, productId, quantity || 1]);
                    return res.status(500).json({ message: 'Failed to add to cart' });
                }
                console.log('Added to cart successfully for user:', userId);
                res.json({ message: 'Added to cart successfully' });
            });
        }
    });
};

// 🛒 Get cart items
exports.getCart = (req, res) => {
    const userId = req.user?.id || req.user?.userId || req.userId;
    
    if (!userId) {
        console.error('No user ID found in getCart. req.user:', req.user);
        return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const sql = `
        SELECT c.id AS cart_item_id, c.quantity, p.id AS product_id, p.name, p.price, p.image
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    `;
    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Get cart error:', err);
            return res.status(500).json({ message: 'Failed to get cart' });
        }
        res.json({ cart: rows });
    });
};

// 🗑 Remove item from cart
exports.removeFromCart = (req, res) => {
    const userId = req.user?.id || req.user?.userId || req.userId;
    const cartItemId = req.params.id;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const sql = 'DELETE FROM cart_items WHERE id = ? AND user_id = ?';
    db.query(sql, [cartItemId, userId], (err) => {
        if (err) {
            console.error('Remove from cart error:', err);
            return res.status(500).json({ message: 'Failed to remove item' });
        }
        res.json({ message: 'Item removed successfully' });
    });
};

// ➕ Increment quantity
exports.incrementQuantity = (req, res) => {
    const { id } = req.params; // id = cart_items.id
    const userId = req.user?.id || req.user?.userId || req.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated properly' });
    }

    // Add user_id check for security
    db.query('UPDATE cart_items SET quantity = quantity + 1 WHERE id = ? AND user_id = ?', [id, userId], (err, result) => {
        if (err) {
            console.error('Failed to increment:', err);
            return res.status(500).json({ error: 'Failed to increment' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cart item not found or not owned by user' });
        }
        res.json({ message: 'Quantity increased' });
    });
};

// ➖ Decrement quantity (won't go below 1)
exports.decrementQuantity = (req, res) => {
    const { id } = req.params; // id = cart_items.id
    const userId = req.user?.id || req.user?.userId || req.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated properly' });
    }

    // Add user_id check for security
    db.query('UPDATE cart_items SET quantity = quantity - 1 WHERE id = ? AND user_id = ? AND quantity > 1', [id, userId], (err, result) => {
        if (err) {
            console.error('Failed to decrement:', err);
            return res.status(500).json({ error: 'Failed to decrement' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cart item not found, not owned by user, or quantity already at minimum' });
        }
        res.json({ message: 'Quantity decreased' });
    });
};

// 📊 Get cart count (useful for frontend cart badge)
exports.getCartCount = (req, res) => {
    const userId = req.user?.id || req.user?.userId || req.userId;
    
    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const sql = 'SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE user_id = ?';
    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Get cart count error:', err);
            return res.status(500).json({ message: 'Failed to get cart count' });
        }
        res.json({ count: rows[0].count });
    });
};