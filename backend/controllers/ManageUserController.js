const connection = require('../config/db');
const PDFDocument = require('pdfkit');

// Helper function to get user ID from different possible properties
const getUserId = (user) => {
    return user.id || user.user_id || user.userId || user.sub;
};

exports.getAllUsers = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    connection.query(
        "SELECT id, name, email, contact_number, address, role, status FROM users WHERE deleted_at IS NULL",
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
};

exports.getUserById = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const { id } = req.params;
    connection.query(
        "SELECT id, name, email, contact_number, address, role, status FROM users WHERE id = ? AND deleted_at IS NULL",
        [id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ message: 'User not found' });
            res.json(results[0]);
        }
    );
};

exports.updateUserRoleStatus = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const { id } = req.params;
    const { role, status } = req.body;

    const sql = 'UPDATE users SET role = ?, status = ? WHERE id = ?';
    connection.query(sql, [role, status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User role and status updated' });
    });
};

exports.downloadUsersPDF = (req, res) => {
    connection.query(
        "SELECT id, name, email, contact_number, address, role, status FROM users WHERE deleted_at IS NULL",
        (err, results) => {
            if (err) {
                console.error('Error fetching users for PDF:', err);
                return res.status(500).json({ error: 'Failed to generate PDF' });
            }

            const doc = new PDFDocument({ margin: 40, size: 'A4' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=users.pdf');

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
                .text('User List', { align: 'center' })
                .moveDown(0.5);

            // Separator
            doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#ec407a').lineWidth(1.5).stroke().moveDown(0.3);

            // Column positions
            const colX = { id: 45, name: 80, email: 200, phone: 330, role: 410, status: 460 };

            let currentY = doc.y + 5;
            const rowHeight = 14;

            // Header
            doc.fontSize(10).font('Courier-Bold').fillColor('#4a148c')
                .text('ID', colX.id, currentY)
                .text('Name', colX.name, currentY)
                .text('Email', colX.email, currentY)
                .text('Phone', colX.phone, currentY)
                .text('Role', colX.role, currentY)
                .text('Status', colX.status, currentY);

            // Line under header
            currentY += rowHeight;
            doc.moveTo(40, currentY - 2).lineTo(550, currentY - 2).strokeColor('#b39ddb').lineWidth(1).stroke();

            // Rows
            doc.font('Courier').fillColor('black');

            results.forEach((user, idx) => {
                const rowY = currentY + idx * rowHeight;

                // Alternate background
                if (idx % 2 === 0) {
                    doc.rect(40, rowY - 2, 510, rowHeight).fill('#f3e5f5').fillColor('black');
                }

                doc
                    .text(user.id.toString(), colX.id, rowY)
                    .text(user.name.length > 20 ? user.name.substring(0, 20) + '…' : user.name, colX.name, rowY)
                    .text(user.email.length > 22 ? user.email.substring(0, 22) + '…' : user.email, colX.email, rowY)
                    .text(user.contact_number || '-', colX.phone, rowY)
                    .text(user.role, colX.role, rowY)
                    .text(user.status, colX.status, rowY);
            });

            // Footer
            const footerY = currentY + results.length * rowHeight + 10;
            doc.fontSize(9).fillColor('#999').text(`Generated on ${new Date().toLocaleString()}`, 40, footerY, { align: 'right' });

            doc.end();
        }
    );
};