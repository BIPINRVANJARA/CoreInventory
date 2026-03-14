const { sendError } = require('../utils/helpers');

/**
 * Validate request body fields
 * @param {Array} rules - Array of { field, label, type, required, min, max, pattern }
 */
function validateBody(rules) {
    return (req, res, next) => {
        const errors = [];

        for (const rule of rules) {
            const value = req.body[rule.field];
            const label = rule.label || rule.field;

            // Required check
            if (rule.required && (value === undefined || value === null || value === '')) {
                errors.push(`${label} is required.`);
                continue;
            }

            // Skip optional empty fields
            if (value === undefined || value === null || value === '') continue;

            // Type checks
            if (rule.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors.push(`${label} must be a valid email address.`);
                }
            }

            if (rule.type === 'number') {
                const num = Number(value);
                if (isNaN(num)) {
                    errors.push(`${label} must be a number.`);
                } else {
                    if (rule.min !== undefined && num < rule.min) {
                        errors.push(`${label} must be at least ${rule.min}.`);
                    }
                    if (rule.max !== undefined && num > rule.max) {
                        errors.push(`${label} must be at most ${rule.max}.`);
                    }
                }
            }

            if (rule.type === 'string') {
                if (rule.min !== undefined && value.length < rule.min) {
                    errors.push(`${label} must be at least ${rule.min} characters.`);
                }
                if (rule.max !== undefined && value.length > rule.max) {
                    errors.push(`${label} must be at most ${rule.max} characters.`);
                }
            }

            if (rule.pattern && !rule.pattern.test(value)) {
                errors.push(`${label} format is invalid.`);
            }

            if (rule.enum && !rule.enum.includes(value)) {
                errors.push(`${label} must be one of: ${rule.enum.join(', ')}.`);
            }
        }

        if (errors.length > 0) {
            return sendError(res, 'Validation failed.', 422, errors);
        }

        next();
    };
}

module.exports = { validateBody };
