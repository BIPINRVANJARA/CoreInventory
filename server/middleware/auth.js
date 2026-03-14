const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/helpers');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendError(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return sendError(res, 'Invalid or expired token.', 401);
    }
}

// Optional: role-based access middleware
function requireRole(...roles) {
    return (req, res, next) => {
        // 'admin' role has super-access to everything
        if (!req.user || (req.user.role !== 'admin' && !roles.includes(req.user.role))) {
            return sendError(res, 'Insufficient permissions.', 403);
        }
        next();
    };
}

module.exports = { authMiddleware, requireRole };
