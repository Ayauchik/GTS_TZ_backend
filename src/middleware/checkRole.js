const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.currentUser || !req.currentUser.role) {
            return res.status(403).json({ message: "Forbidden: No role information" });
        }

        const userRole = req.currentUser.role;
        
        if (allowedRoles.includes(userRole)) {
            next(); // Role is allowed, proceed to the next middleware/handler
        } else {
            return res.status(403).json({ message: `Forbidden: Access denied. Required role(s): ${allowedRoles.join(', ')}` });
        }
    };
};

module.exports = checkRole;