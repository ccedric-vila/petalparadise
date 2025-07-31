const connection = require('../config/db');
const PDFDocument = require('pdfkit');

// Helper function to get user ID from different possible properties
const getUserId = (user) => {
    return user.id || user.user_id || user.userId || user.sub;
};

exports.createSupplier = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const { supplier_name, email, phone, address } = req.body;
    if (!supplier_name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    const sql = 'INSERT INTO supplier (supplier_name, email, phone, address) VALUES (?, ?, ?, ?)';
    connection.query(sql, [supplier_name, email, phone, address], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Supplier added', id: result.insertId });
    });
};

exports.getSuppliers = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    connection.query('SELECT * FROM supplier', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getSupplierById = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const { id } = req.params;
    connection.query('SELECT * FROM supplier WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(results[0]);
    });
};

exports.updateSupplier = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const { id } = req.params;
    const { supplier_name, email, phone, address } = req.body;

    const sql = 'UPDATE supplier SET supplier_name = ?, email = ?, phone = ?, address = ? WHERE id = ?';
    connection.query(sql, [supplier_name, email, phone, address, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Supplier updated' });
    });
};

exports.deleteSupplier = (req, res) => {
    // Handle user ID if authentication is required
    if (req.user) {
        const userId = getUserId(req.user);
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }
    }

    const { id } = req.params;
    connection.query('DELETE FROM supplier WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Supplier deleted' });
    });
};

exports.downloadSupplierPDF = (req, res) => {
    connection.query('SELECT * FROM supplier', (err, results) => {
        if (err) {
            console.error('Error fetching suppliers for PDF:', err);
            return res.status(500).json({ error: 'Failed to generate PDF' });
        }

        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=suppliers.pdf');

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
            .text('Supplier List', { align: 'center' })
            .moveDown(0.5);

        // Separator
        doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#ec407a').lineWidth(1.5).stroke().moveDown(0.3);

        // Column positions (adjusted without phone)
        const colX = { id: 45, name: 100, email: 250, address: 420 };

        let currentY = doc.y + 5;
        const rowHeight = 14;

        // Header
        doc.fontSize(10).font('Courier-Bold').fillColor('#4a148c')
            .text('ID', colX.id, currentY)
            .text('Name', colX.name, currentY)
            .text('Email', colX.email, currentY)
            .text('Address', colX.address, currentY);

        // Line under header
        currentY += rowHeight;
        doc.moveTo(40, currentY - 2).lineTo(550, currentY - 2).strokeColor('#b39ddb').lineWidth(1).stroke();

        // Rows
        doc.font('Courier').fillColor('black');

        results.forEach((supplier, idx) => {
            const rowY = currentY + idx * rowHeight;

            // Alternate background
            if (idx % 2 === 0) {
                doc.rect(40, rowY - 2, 510, rowHeight).fill('#f3e5f5').fillColor('black');
            }

            doc
                .text(supplier.id.toString(), colX.id, rowY)
                .text(supplier.supplier_name.length > 20 ? supplier.supplier_name.substring(0, 20) + '…' : supplier.supplier_name, colX.name, rowY)
                .text(supplier.email.length > 22 ? supplier.email.substring(0, 22) + '…' : supplier.email, colX.email, rowY)
                .text(supplier.address ? (supplier.address.length > 18 ? supplier.address.substring(0, 18) + '…' : supplier.address) : '-', colX.address, rowY);
        });

        // Footer
        const footerY = currentY + results.length * rowHeight + 10;
        doc.fontSize(9).fillColor('#999').text(`Generated on ${new Date().toLocaleString()}`, 40, footerY, { align: 'right' });

        doc.end();
    });
};
