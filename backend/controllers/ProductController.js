const connection = require('../config/db');
const PDFDocument = require('pdfkit');

// Helper function to get user ID 
const getUserId = (user) => {
    return user.id || user.user_id || user.userId || user.sub;
};

exports.createProduct = (req, res) => {
    
    if (req.user) {
        console.log('req.user object:', req.user);
        const userId = getUserId(req.user);
        console.log('Extracted userId:', userId);
    }

    const {
        name, category, usage_type, description,
        price, color, stock, supplier_id
    } = req.body;

    // validate
    if (!name || !category || !price) {
        return res.status(400).json({ 
            error: 'Missing required fields: name, category, and price are required' 
        });
    }

    // multiple or solo images
    let imageValue = null;
    if (req.files) {
        
        const allFiles = [
            ...(req.files.image || []),
            ...(req.files.images || [])
        ];
        imageValue = allFiles.map(file => file.filename).join(',');
        console.log('Processed images:', imageValue); // Debug log
    }

    const sql = `
        INSERT INTO products (name, category, usage_type, description, 
        price, color, stock, image, supplier_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        name, 
        category, 
        usage_type, 
        description,
        parseFloat(price), 
        color, 
        parseInt(stock) || 0, 
        imageValue, 
        supplier_id ? parseInt(supplier_id) : null 
    ];

    console.log('SQL params:', params); 

    connection.query(sql, params, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Failed to create product',
                details: err.message 
            });
        }
        
        console.log('Product created with ID:', result.insertId); 
        
        res.status(201).json({ 
            message: 'Product added successfully', 
            id: result.insertId,
            images: imageValue ? imageValue.split(',') : []
        });
    });
};

exports.getProducts = (req, res) => {
    
    if (req.user) {
        console.log('req.user object:', req.user);
        const userId = getUserId(req.user);
        console.log('Extracted userId:', userId);
    }

    const sql = `
        SELECT p.*, s.supplier_name 
        FROM products p 
        LEFT JOIN supplier s ON p.supplier_id = s.id
        ORDER BY p.id DESC
    `;
    
    console.log('Executing getProducts query'); 
    
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Database error in getProducts:', err);
            return res.status(500).json({ error: err.message });
        }
        
        console.log('Found products:', results.length); 
        
        
        const processedResults = results.map(product => {
            if (product.image && product.image.trim() !== '') {
                product.images = product.image.split(',').filter(img => img.trim() !== '');
            } else {
                product.images = [];
            }
            return product;
        });
        
        res.json(processedResults);
    });
};

exports.getProductById = (req, res) => {
    const { id } = req.params;
    
    // Validate 
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    
    if (req.user) {
        console.log('req.user object:', req.user);
        const userId = getUserId(req.user);
        console.log('Extracted userId:', userId);
    }
    
    console.log('Getting product by ID:', id); 
    
    connection.query('SELECT * FROM products WHERE id = ?', [parseInt(id)], (err, results) => {
        if (err) {
            console.error('Database error in getProductById:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            console.log('Product not found for ID:', id); 
            return res.status(404).json({ message: 'Product not found' });
        }
        
        
        const product = results[0];
        if (product.image && product.image.trim() !== '') {
            product.images = product.image.split(',').filter(img => img.trim() !== '');
        } else {
            product.images = [];
        }
        
        console.log('Product found:', { id: product.id, name: product.name }); 
        res.json(product);
    });
};

exports.updateProduct = (req, res) => {
    const { id } = req.params;
    
    // Validate 
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    
    if (req.user) {
        console.log('req.user object:', req.user);
        const userId = getUserId(req.user);
        console.log('Extracted userId:', userId);
    }
    
    const {
        name, category, usage_type, description,
        price, color, stock, supplier_id
    } = req.body;

    // Validate 
    if (!name || !category || !price) {
        return res.status(400).json({ 
            error: 'Missing required fields: name, category, and price are required' 
        });
    }

    let sql = `UPDATE products SET 
        name = ?, category = ?, usage_type = ?, description = ?,
        price = ?, color = ?, stock = ?, supplier_id = ?`;
    
    const params = [
        name, 
        category, 
        usage_type, 
        description,
        parseFloat(price), 
        color, 
        parseInt(stock) || 0, 
        supplier_id ? parseInt(supplier_id) : null 
    ];

    // 
    if (req.files) {
        
        const allFiles = [
            ...(req.files.image || []),
            ...(req.files.images || [])
        ];
        const newImages = allFiles.map(file => file.filename).join(',');
        sql += `, image = ?`;
        params.push(newImages);
        console.log('Updating with new images:', newImages); 
    }

    sql += ` WHERE id = ?`;
    params.push(parseInt(id));

    console.log('Update SQL params:', params); 

    connection.query(sql, params, (err, result) => {
        if (err) {
            console.error('Database error in updateProduct:', err);
            return res.status(500).json({ 
                error: 'Failed to update product',
                details: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            console.log('No product found to update for ID:', id); 
            return res.status(404).json({ message: 'Product not found' });
        }
        
        console.log('Product updated successfully for ID:', id); 
        res.json({ message: 'Product updated successfully' });
    });
};

exports.deleteProduct = (req, res) => {
    const { id } = req.params;
    
    // Validate 
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (req.user) {
        console.log('req.user object:', req.user);
        const userId = getUserId(req.user);
        console.log('Extracted userId:', userId);
    }
    
    console.log('Deleting product with ID:', id); 
    
    connection.query('DELETE FROM products WHERE id = ?', [parseInt(id)], (err, result) => {
        if (err) {
            console.error('Database error in deleteProduct:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (result.affectedRows === 0) {
            console.log('No product found to delete for ID:', id); 
            return res.status(404).json({ message: 'Product not found' });
        }
        
        console.log('Product deleted successfully for ID:', id); 
        res.json({ message: 'Product deleted successfully' });
    });
};

exports.downloadPDF = (req, res) => {
    connection.query('SELECT * FROM products', (err, results) => {
        if (err) {
            console.error('Error fetching products for PDF:', err);
            return res.status(500).json({ error: 'Failed to generate PDF' });
        }

        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=products.pdf');

        doc.pipe(res);

        // title
        doc
            .fillColor('#6a1b9a')
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Petal Paradise', { align: 'center' })
            .moveDown(0.2)
            .fontSize(14)
            .font('Helvetica')
            .fillColor('#ad1457')
            .text('Product List', { align: 'center' })
            .moveDown(0.5);

        // separator
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#ec407a').lineWidth(1.5).stroke().moveDown(0.3);

        // column positions
        const colX = { id: 45, name: 75, category: 235, usage: 310, price: 380, stock: 440 };

        // header row Y position
        let currentY = doc.y + 5;
        const rowHeight = 14;

        // header
        doc.fontSize(10).font('Courier-Bold').fillColor('#4a148c')
            .text('ID', colX.id, currentY)
            .text('Name', colX.name, currentY)
            .text('Category', colX.category, currentY)
            .text('Usage', colX.usage, currentY)
            .text('Price', colX.price, currentY, { width: 50, align: 'right' })
            .text('Stock', colX.stock, currentY, { width: 40, align: 'right' });

        // line under header
        currentY += rowHeight;
        doc.moveTo(40, currentY - 2).lineTo(550, currentY - 2).strokeColor('#b39ddb').lineWidth(1).stroke();

        // rows
        doc.font('Courier').fillColor('black');

        results.forEach((prod, idx) => {
            const rowY = currentY + idx * rowHeight;

            // alternate background
            if (idx % 2 === 0) {
                doc.rect(40, rowY - 2, 510, rowHeight).fill('#f3e5f5').fillColor('black');
            }

            doc
                .text(prod.id.toString(), colX.id, rowY)
                .text(prod.name.length > 18 ? prod.name.substring(0, 18) + '…' : prod.name, colX.name, rowY)
                .text(prod.category, colX.category, rowY)
                .text(prod.usage_type, colX.usage, rowY)
                .text(`${Number(prod.price).toFixed(2)}`, colX.price + 50 - doc.widthOfString(`${Number(prod.price).toFixed(2)}`), rowY)
                .text(prod.stock.toString(), colX.stock + 40 - doc.widthOfString(prod.stock.toString()), rowY);
        });

        // footer
        const footerY = currentY + results.length * rowHeight + 10;
        doc.fontSize(9).fillColor('#999').text(`Generated on ${new Date().toLocaleString()}`, 40, footerY, { align: 'right' });

        doc.end();
    });
};

