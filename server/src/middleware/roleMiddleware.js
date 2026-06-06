export const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Authenticated user required.' });
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden. You do not have permissions to perform this action.' });
    }

    next();
  };
};

export default roleMiddleware;
