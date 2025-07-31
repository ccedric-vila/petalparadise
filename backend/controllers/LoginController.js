const connection = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Check if user exists and is verified
        connection.query(
            'SELECT * FROM users WHERE email = ? AND is_verified = "yes" AND deleted_at IS NULL',
            [email],
            async (err, results) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ message: 'Database error.' });
                }

                if (results.length === 0) {
                    return res.status(401).json({ message: 'Invalid credentials or account not verified.' });
                }

                const user = results[0];

                // Check if user account is active
                if (user.status === 'inactive') {
                    return res.status(401).json({ message: 'Account has been deactivated. Please contact support.' });
                }

                // Check password
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.status(401).json({ message: 'Invalid credentials.' });
                }

                // 🔑 GENERATE JWT TOKEN FOR AUTHENTICATION (15pts)
                const token = jwt.sign(
                    { 
                        userId: user.id, 
                        email: user.email,
                        role: user.role,
                        name: user.name
                    },
                    process.env.JWT_SECRET, // Using your JWT_SECRET from .env
                    { expiresIn: process.env.JWT_EXPIRATION || '1h' } // Using your JWT_EXPIRATION from .env
                );

                // 💾 SAVE TOKEN IN USERS TABLE (5pts)
                connection.query(
                    'UPDATE users SET jwt_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [token, user.id],
                    (updateErr) => {
                        if (updateErr) {
                            console.error("Token save error:", updateErr);
                            return res.status(500).json({ message: 'Login successful but token storage failed.' });
                        }

                        console.log(`✅ JWT Token generated and saved for user ID: ${user.id}`);

                        // Return success response with token and user data (matching your frontend expectations)
                        res.status(200).json({
                            success: 'Login successful!',
                            token: token,
                            user: {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role,
                                contact_number: user.contact_number,
                                address: user.address,
                                profile_image: user.profile_image,
                                status: user.status
                            }
                        });
                    }
                );
            }
        );
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { loginUser };