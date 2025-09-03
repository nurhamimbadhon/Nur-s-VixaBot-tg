const User = require('../database/User');
const config = require('../config.json');

async function checkPermission(userId, requiredRole) {
    if (config.ownerIds.includes(userId.toString())) return true;
    
    const userRole = await User.getRole(userId);
    return userRole >= requiredRole;
}

module.exports = { checkPermission };
