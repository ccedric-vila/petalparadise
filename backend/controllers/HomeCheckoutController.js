const db = require('../config/db');

// single product checkout preparation
exports.prepareSoloCheckout = (req, res) => {
    const userId = req.user?.id || req.user?.userId || req.userId;
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    // product details for checkout display
    const getProductSql = `
        SELECT id, name, price, image, stock, description 
        FROM products 
        WHERE id = ?
    `;
    
    db.query(getProductSql, [productId], (err, products) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (products.length === 0) {
            return res.status(400).json({ message: 'Product not found' });
        }

        const product = products[0];
        
        // check if product is in stock
        if (product.stock < 1) {
            return res.status(400).json({ message: 'Product is out of stock' });
        }

        // get user's address for checkout display
        const getUserAddressSql = `SELECT address FROM users WHERE id = ? LIMIT 1`;
        db.query(getUserAddressSql, [userId], (err, userRows) => {
            if (err) return res.status(500).json({ message: 'Could not load user address' });

            const userAddress = userRows.length && userRows[0].address 
                ? userRows[0].address.trim() 
                : null;

            // prepare checkout data for frontend
            const checkoutData = {
                items: [{
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1, 
                    subtotal: product.price
                }],
                userAddress: userAddress || 'No address found',
                total: product.price,
                checkoutType: 'solo'
            };

            res.json({ 
                message: 'Solo checkout data prepared', 
                checkout: checkoutData 
            });
        });
    });
};