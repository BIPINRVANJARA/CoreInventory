/**
 * Utility helpers for Vyntro
 */

// Generate unique reference numbers
function generateReferenceNo(prefix) {
    const num = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    return `${prefix}/${num}`;
}

// Pagination helper
function getPagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

// Standard API response
function sendSuccess(res, data, message = 'Success', statusCode = 200) {
    res.status(statusCode).json({ success: true, message, data });
}

function sendError(res, message = 'Server error', statusCode = 500, errors = null) {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    res.status(statusCode).json(response);
}

module.exports = {
    generateReferenceNo,
    getPagination,
    sendSuccess,
    sendError,
};
