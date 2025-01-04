import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token provided', state: false });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('JWT verification error:', err);
                return res.status(403).json({ message: 'Invalid or expired token', state: false });
            }

            // Use userId directly from the token
            req.user = {
                userId: decoded.userId,
                email: decoded.email
            };
            
            console.log('Authenticated user:', req.user);
            next();
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Authentication error', error: error.message, state: false });
    }
};
