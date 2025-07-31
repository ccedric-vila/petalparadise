// controllers/logoutController.js
const connection = require('../config/db');

const logoutUser = (req, res) => {
    const userId = req.user.userId; // From JWT middleware

    // Clear JWT token from database
    connection.query(
        'UPDATE users SET jwt_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId],
        (err) => {
            if (err) {
                console.error("Logout error:", err);
                return res.status(500).json({ message: 'Logout failed.' });
            }

            console.log(`✅ JWT Token cleared for user ID: ${userId}`);
            res.status(200).json({ message: 'Logged out successfully.' });
        }
    );
};

module.exports = { logoutUser };