const db = require('../config/db');
const PDFDocument = require('pdfkit');

// Helper function to get user ID from different possible properties
const getUserId = (user) => {
    return user.id || user.user_id || user.userId || user.sub;
};

// Get all reviews with user & order info (fixed to match schema)
exports.getAllReviews = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const sql = `
        SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
               u.id as user_id, u.name as user_name,
               o.id as order_id, o.total_amount,
               GROUP_CONCAT(p.name SEPARATOR ', ') as products_ordered
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN orders o ON r.order_id = o.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY r.id, r.rating, r.comment, r.created_at, r.updated_at, u.id, u.name, o.id, o.total_amount
        ORDER BY r.created_at DESC
    `;
    
    db.query(sql, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to load reviews' });
        }
        res.json({ reviews: rows });
    });
};

// Delete review by ID
exports.deleteReviewById = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const reviewId = req.params.id;
    
    // First check if review exists
    const checkSql = 'SELECT id FROM reviews WHERE id = ?';
    db.query(checkSql, [reviewId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Failed to check review' });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        // Delete the review
        const deleteSql = 'DELETE FROM reviews WHERE id = ?';
        db.query(deleteSql, [reviewId], (err, deleteResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Failed to delete review' });
            }
            
            res.json({ message: 'Review deleted successfully' });
        });
    });
};

exports.downloadReviewsPDF = (req, res) => {
    // Optional: get user ID if needed
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const sql = `
        SELECT r.id, r.rating, r.comment, r.created_at, 
               u.name as user_name,
               GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') as products_ordered
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN orders o ON r.order_id = o.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY r.id, r.rating, r.comment, r.created_at, u.name
        ORDER BY r.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching reviews for PDF:', err);
            return res.status(500).json({ error: 'Failed to generate PDF' });
        }

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reviews.pdf');
        doc.pipe(res);

        // Title
        doc
            .fillColor('#6a1b9a')
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Petal Paradise', { align: 'center' })
            .moveDown(0.2)
            .fontSize(14)
            .font('Helvetica')
            .fillColor('#ad1457')
            .text('Customer Reviews', { align: 'center' })
            .moveDown(0.5);

        // Separator
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#ec407a').lineWidth(1.5).stroke().moveDown(0.3);

        // Column positions
        const colX = { id: 45, user: 80, rating: 200, products: 250, comment: 400 };
        let currentY = doc.y + 5;
        const rowHeight = 14;

        // Header
        doc.fontSize(9).font('Courier-Bold').fillColor('#4a148c')
            .text('ID', colX.id, currentY)
            .text('User', colX.user, currentY)
            .text('Rating', colX.rating, currentY)
            .text('Products', colX.products, currentY)
            .text('Comment', colX.comment, currentY);

        // Line under header
        currentY += rowHeight;
        doc.moveTo(40, currentY - 2).lineTo(550, currentY - 2).strokeColor('#b39ddb').lineWidth(1).stroke();

        // Rows
        doc.font('Courier').fillColor('black');
        results.forEach((review, idx) => {
            const rowY = currentY + idx * rowHeight;

            if (idx % 2 === 0) {
                doc.rect(40, rowY - 2, 510, rowHeight).fill('#f3e5f5').fillColor('black');
            }

            doc
                .text(review.id.toString(), colX.id, rowY)
                .text(review.user_name.length > 15 ? review.user_name.substring(0, 15) + '…' : review.user_name, colX.user, rowY)
                .text(review.rating.toString(), colX.rating, rowY)
                .text(
                    review.products_ordered && review.products_ordered.length > 20 
                        ? review.products_ordered.substring(0, 20) + '…' 
                        : (review.products_ordered || '-'),
                    colX.products, rowY
                )
                .text(review.comment && review.comment.length > 20 
                        ? review.comment.substring(0, 20) + '…' 
                        : (review.comment || '-'), 
                    colX.comment, rowY);
        });

        // Footer
        const footerY = currentY + results.length * rowHeight + 10;
        doc.fontSize(9).fillColor('#999')
            .text(`Generated on ${new Date().toLocaleString()}`, 40, footerY, { align: 'right' });

        doc.end();
    });
};