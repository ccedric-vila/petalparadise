const db = require('../config/db');
const mailer = require('../utils/mailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to get user ID from different possible properties
const getUserId = (user) => {
    return user.id || user.user_id || user.userId || user.sub;
};

// Get all orders with total amount and user details
exports.getAllOrders = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const sql = `
    SELECT o.*, 
        u.name as customer_name,
        u.email as customer_email,
        u.address as customer_address,
        (SELECT SUM(oi.quantity * p.price) 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = o.id) AS total_amount
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
`;
    db.query(sql, (err, rows) => {
        if (err) {
            console.error('Failed to get orders:', err);
            return res.status(500).json({ message: 'Failed to get orders' });
        }
        res.status(200).json(rows);
    });
};

// Accept order → status becomes 'Confirmed'
exports.acceptOrder = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const orderId = req.params.id;
    const sql = 'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?';
    db.query(sql, ['Confirmed', orderId], (err, result) => {
        if (err) {
            console.error('Failed to accept order:', err);
            return res.status(500).json({ message: 'Failed to accept order' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({ message: 'Order accepted successfully' });
    });
};

// Update order status + send email + PDF if Confirmed or Delivered + subtract stock if Confirmed
exports.updateOrderStatus = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const orderId = req.params.id;
    const { status } = req.body;

    const sql = 'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?';
    db.query(sql, [status, orderId], async (err, result) => {
        if (err) {
            console.error('Failed to update status:', err);
            return res.status(500).json({ message: 'Failed to update status' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If status is 'Confirmed', subtract stock
        if (status === 'Confirmed') {
            db.query(
                `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
                [orderId],
                (err2, orderItems) => {
                    if (err2) {
                        console.error('Failed to get order items for stock update:', err2);
                        return res.status(500).json({ message: 'Status updated, but failed to update stock' });
                    }

                    // Update stock for each product
                    orderItems.forEach(item => {
                        db.query(
                            'UPDATE products SET stock = stock - ? WHERE id = ?',
                            [item.quantity, item.product_id],
                            (err3, updateResult) => {
                                if (err3) {
                                    console.error(`Failed to update stock for product ${item.product_id}:`, err3);
                                }
                            }
                        );
                    });
                }
            );
        }

        // Get user email & info
        db.query(
            `SELECT u.email, u.name, o.id, o.created_at, o.shipping_address 
             FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
            [orderId],
            async (err2, users) => {
                if (err2) {
                    console.error('Failed to fetch user for email:', err2);
                    return res.status(500).json({ message: 'Status updated, but failed to notify user' });
                }
                if (users.length === 0) {
                    return res.status(404).json({ message: 'Order updated, but user not found' });
                }

                const user = users[0];

                // get order items & total amount
                db.query(
                    `SELECT p.name, oi.quantity, p.price 
                     FROM order_items oi 
                     JOIN products p ON oi.product_id = p.id 
                     WHERE oi.order_id = ?`,
                    [orderId],
                    async (err3, items) => {
                        if (err3) {
                            console.error('Failed to fetch order items:', err3);
                            return res.status(500).json({ message: 'Status updated, but failed to get items' });
                        }

                        let totalAmount = 0;
                        items.forEach(item => {
                            totalAmount += item.quantity * item.price;
                        });

                        try {
                            let emailOptions = {
                                email: user.email,
                                subject: `Your order #${user.id} status updated`,
                                message: `Hello ${user.name},<br>Your order status has been updated to: <b>${status}</b>.`
                            };

                            // Send receipt for both Confirmed and Delivered status
                            if (status === 'Confirmed' || status === 'Delivered') {
                                const receiptsDir = path.join(__dirname, '../receipts');
                                if (!fs.existsSync(receiptsDir)) {
                                    fs.mkdirSync(receiptsDir);
                                }

                                const pdfPath = path.join(receiptsDir, `receipt_order_${orderId}.pdf`);
                                await generatePdfReceipt(user, items, totalAmount, pdfPath);

                                emailOptions.attachments = [
                                    { filename: `receipt_order_${orderId}.pdf`, path: pdfPath }
                                ];

                                if (status === 'Confirmed') {
                                    emailOptions.message += "<br>Your order has been confirmed! Your receipt is attached.";
                                } else if (status === 'Delivered') {
                                    emailOptions.message += "<br>Your order has been delivered! Your receipt is attached.";
                                }
                            }

                            await mailer(emailOptions);
                        } catch (emailErr) {
                            console.error('Failed to send email:', emailErr);
                        }

                        res.status(200).json({ message: 'Status updated and user notified' });
                    }
                );
            }
        );
    });
};

// Helper: generate PDF with product names & total
async function generatePdfReceipt(order, items, totalAmount, filePath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc
            .fillColor('#d6336c') // flower pink
            .fontSize(26)
            .text('Petal Paradise Receipt', { align: 'center' })
            .moveDown();

        doc
            .strokeColor('#e6a1b0')
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke()
            .moveDown(1);

        // Order details
        doc
            .fillColor('#333') // dark text
            .fontSize(12)
            .text(`Order ID: ${order.id}`)
            .text(`Customer Name: ${order.name}`)
            .text(`Order Date: ${new Date(order.created_at).toLocaleString()}`)
            .text(`Shipping Address: ${order.shipping_address}`)
            .moveDown();

        // Products header
        doc
            .fillColor('#d6336c')
            .fontSize(16)
            .text('Products', { underline: true })
            .moveDown(0.5);

        // Product list
        items.forEach((item, index) => {
            doc
                .fillColor('#000')
                .fontSize(12)
                .text(
                    `${index + 1}. ${item.name} — Qty: ${item.quantity} — Price: ${item.price} pesos`
                );
        });

        doc.moveDown(1);

        // Total
        doc
            .strokeColor('#e6a1b0')
            .lineWidth(1)
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke()
            .moveDown(0.5);

        doc
            .fillColor('#000')
            .fontSize(14)
            .text(`Total Amount: ${totalAmount.toFixed(2)} pesos`, { align: 'right' })
            .moveDown(1);

        // Footer / thank you note
        doc
            .fillColor('#d6336c')
            .fontSize(12)
            .text('Thank you for making your day bloom with Petal Paradise!', { align: 'center' })
            .moveDown(0.5);

        doc
            .fontSize(10)
            .fillColor('#888')
            .text('www.petalparadise.com • @PetalParadiseShop', { align: 'center' });

        doc.end();

        stream.on('finish', resolve);
        stream.on('error', reject);
    });

}

exports.downloadOrdersPDF = (req, res) => {
    db.query(
        `SELECT o.id, o.created_at, o.status, 
                u.name as customer_name, u.email, u.address,
                (SELECT COALESCE(SUM(oi.quantity * p.price), 0)
                 FROM order_items oi 
                 JOIN products p ON oi.product_id = p.id 
                 WHERE oi.order_id = o.id) AS total_amount
         FROM orders o
         JOIN users u ON o.user_id = u.id
         ORDER BY o.created_at DESC`,
        (err, results) => {
            if (err) {
                console.error('Error fetching orders for PDF:', err);
                return res.status(500).json({ error: 'Failed to generate PDF' });
            }

            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=orders.pdf');
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
                .text('Order List', { align: 'center' })
                .moveDown(0.5);

            // Separator
            doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#ec407a').lineWidth(1.5).stroke().moveDown(0.3);

            // Columns
            const colX = { id: 45, date: 90, customer: 180, status: 330, total: 400 };
            let currentY = doc.y + 5;
            const rowHeight = 14;

            // Header row
            doc.fontSize(10).font('Courier-Bold').fillColor('#4a148c')
                .text('ID', colX.id, currentY)
                .text('Date', colX.date, currentY)
                .text('Customer', colX.customer, currentY)
                .text('Status', colX.status, currentY)
                .text('Total', colX.total, currentY);

            currentY += rowHeight;
            doc.moveTo(40, currentY - 2).lineTo(550, currentY - 2).strokeColor('#b39ddb').lineWidth(1).stroke();

            // Rows
            doc.font('Courier').fillColor('black');
            results.forEach((order, idx) => {
                const rowY = currentY + idx * rowHeight;

                if (idx % 2 === 0) {
                    doc.rect(40, rowY - 2, 510, rowHeight).fill('#f3e5f5').fillColor('black');
                }

                doc
                    .text(order.id.toString(), colX.id, rowY)
                    .text(new Date(order.created_at).toLocaleDateString(), colX.date, rowY)
                    .text(order.customer_name.length > 20 ? order.customer_name.substring(0, 20) + '…' : order.customer_name, colX.customer, rowY)
                    .text(order.status, colX.status, rowY)
                    .text(Number(order.total_amount).toFixed(2) + ' ', colX.total, rowY);
            });

            // Footer
            const footerY = currentY + results.length * rowHeight + 10;
            doc.fontSize(9).fillColor('#999')
                .text(`Generated on ${new Date().toLocaleString()}`, 40, footerY, { align: 'right' });

            doc.end();
        }
    );
};
