const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

/**
 * Log an administrative action to the database.
 * 
 * @param {Object} req - Express request object (to extract admin info and IP)
 * @param {string} action - Action type enum (e.g., 'UPLOAD_SCHEME')
 * @param {string} resource - Human-readable resource name (e.g., 'PM-Kisan')
 * @param {string} resourceId - Database ID of the resource
 * @param {Object} details - Additional metadata about the action
 */
async function logAction(req, action, resource, resourceId = null, details = {}) {
  try {
    const adminId = req.user?.id;
    const adminName = req.user?.name || 'Unknown Admin';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (!adminId) {
      logger.warn(`Attempted to log action "${action}" but no user found in request`);
      return;
    }

    await AuditLog.create({
      adminId,
      adminName,
      action,
      resource,
      resourceId,
      details,
      ipAddress
    });

    logger.info(`Audit Log: ${adminName} → ${action} ON ${resource}`);
  } catch (err) {
    logger.error('Failed to create audit log:', err.message);
  }
}

module.exports = {
  logAction
};
