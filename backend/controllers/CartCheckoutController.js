const db = require('../config/db');

// Selected items checkout preparation
exports.prepareCartCheckout = (req, res) => {
    
    console.log('prepareCartCheckout - req.user:', req.user);
    
    const userId = req.user?.id || req.user?.userId || req.userId;
    const { selectedItems } = req.body; 

    console.log('prepareCartCheckout - userId:', userId);
    console.log('prepareCartCheckout - selectedItems:', selectedItems);

    // Validate userId exists
    if (!userId) {
        console.error('No user ID found in prepareCartCheckout. req.user:', req.user);
        return res.status(401).json({ message: 'User not authenticated properly' });
    }

    // If no selected items, get all cart items
    let getCartSql;
    let queryParams;

    if (selectedItems && selectedItems.length > 0) {
        // selected items
        const placeholders = selectedItems.map(() => '?').join(',');
        getCartSql = `
            SELECT c.product_id, c.quantity, p.name, p.price, p.image, p.stock,
                   (c.quantity * p.price) as subtotal
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ? AND c.product_id IN (${placeholders})
        `;
        queryParams = [userId, ...selectedItems];
        console.log('Using selected items query with params:', queryParams);
    } else {
        // all cart items
        getCartSql = `
            SELECT c.product_id, c.quantity, p.name, p.price, p.image, p.stock,
                   (c.quantity * p.price) as subtotal
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `;
        queryParams = [userId];
        console.log('Using all cart items query with params:', queryParams);
    }

    console.log('Executing SQL:', getCartSql);
    
    db.query(getCartSql, queryParams, (err, cartItems) => {
        if (err) {
            console.error('Database error in prepareCartCheckout:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        console.log('Cart items found:', cartItems.length);
        console.log('Cart items data:', cartItems);
        
        if (cartItems.length === 0) {
            // check if the user has items in cart
            const checkAllCartSql = 'SELECT * FROM cart_items WHERE user_id = ?';
            db.query(checkAllCartSql, [userId], (err, allCartItems) => {
                if (err) {
                    console.error('Error checking all cart items:', err);
                } else {
                    console.log('Total cart items for user:', allCartItems.length);
                    console.log('All cart items:', allCartItems);
                }
            });
            
            return res.status(400).json({ message: 'No items found for checkout' });
        }

        // checking stock
        const stockIssues = cartItems.filter(item => item.quantity > item.stock);
        if (stockIssues.length > 0) {
            const outOfStockItems = stockIssues.map(item => item.name);
            console.log('Stock issues found:', outOfStockItems);
            return res.status(400).json({ 
                message: 'Some items are out of stock', 
                outOfStockItems 
            });
        }

        // fetch user address
        const getUserAddressSql = `SELECT address FROM users WHERE id = ? LIMIT 1`;
        db.query(getUserAddressSql, [userId], (err, userRows) => {
            if (err) {
                console.error('Error getting user address:', err);
                return res.status(500).json({ message: 'Could not load user address' });
            }

            console.log('User address query result:', userRows);

            const userAddress = userRows.length && userRows[0].address 
                ? userRows[0].address.trim() 
                : null;

            // calculate total
            const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

            // format
            const formattedItems = cartItems.map(item => ({
                product_id: item.product_id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                subtotal: item.subtotal
            }));

            const checkoutData = {
                items: formattedItems,
                userAddress: userAddress || 'No address found',
                total: total,
                checkoutType: 'cart',
                selectedItems: selectedItems || 'all'
            };

            console.log('Checkout data prepared successfully:', checkoutData);

            res.json({ 
                message: 'Cart checkout data prepared', 
                checkout: checkoutData 
            });
        });
    });
};

// solo checkout
exports.prepareSoloCheckout = (req, res) => {
    console.log('prepareSoloCheckout - req.user:', req.user);
    
    const userId = req.user?.id || req.user?.userId || req.userId;
    const { productId } = req.body;

    console.log('prepareSoloCheckout - userId:', userId, 'productId:', productId);

    if (!userId) {
        console.error('No user ID found in prepareSoloCheckout');
        return res.status(401).json({ message: 'User not authenticated properly' });
    }

    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }

    // product details 
    const getProductSql = `
        SELECT id as product_id, name, price, image, stock
        FROM products 
        WHERE id = ?
    `;
    
    db.query(getProductSql, [productId], (err, products) => {
        if (err) {
            console.error('Database error in prepareSoloCheckout:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = products[0];
        
        // check stock
        if (product.stock < 1) {
            return res.status(400).json({ message: 'Product is out of stock' });
        }

        // get address
        const getUserAddressSql = `SELECT address FROM users WHERE id = ? LIMIT 1`;
        db.query(getUserAddressSql, [userId], (err, userRows) => {
            if (err) {
                console.error('Error getting user address:', err);
                return res.status(500).json({ message: 'Could not load user address' });
            }

            const userAddress = userRows.length && userRows[0].address 
                ? userRows[0].address.trim() 
                : null;

            // format
            const checkoutItem = {
                product_id: product.product_id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1, 
                subtotal: product.price
            };

            const checkoutData = {
                items: [checkoutItem],
                userAddress: userAddress || 'No address found',
                total: product.price,
                checkoutType: 'solo',
                selectedItems: [productId]
            };

            console.log('Solo checkout data prepared:', checkoutData);

            res.json({ 
                message: 'Solo checkout data prepared', 
                checkout: checkoutData 
            });
        });
    });
};