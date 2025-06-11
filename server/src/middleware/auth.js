const authService = require("../services/authService");
const {
  AuthenticationError,
  AuthorizationError,
  asyncHandler,
} = require("../utils/errors");

/**
 * Protect routes - requires valid JWT token
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AuthenticationError("Access denied. No token provided.");
  }

  try {
    // Verify token
    const decoded = authService.verifyToken(token);

    // Get user data
    const user = await authService.getUserById(decoded.userId);

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    throw new AuthenticationError("Invalid or expired token");
  }
});

/**
 * Authorize specific roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError("Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError(
        `User role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const adminOnly = authorize("admin");

/**
 * Check if user is admin or warehouse
 */
const adminOrWarehouse = authorize("admin", "warehouse");

/**
 * Check if user is admin or counter
 */
const adminOrCounter = authorize("admin", "counter");

/**
 * Check if user is counter or warehouse (for general operations)
 */
const counterOrWarehouse = authorize("counter", "warehouse");

/**
 * Optional authentication - doesn't throw error if no token
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = authService.verifyToken(token);
      const user = await authService.getUserById(decoded.userId);
      req.user = user;
    } catch (error) {
      // Continue without user if token is invalid
      req.user = null;
    }
  }

  next();
});

/**
 * Rate limiting for specific user actions
 */
const userRateLimit = (maxAttempts = 10, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userAttempts = attempts.get(userId) || {
      count: 0,
      resetTime: now + windowMs,
    };

    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + windowMs;
    }

    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000),
      });
    }

    userAttempts.count++;
    attempts.set(userId, userAttempts);
    next();
  };
};

/**
 * Validate user status (active, not banned, etc.)
 */
const validateUserStatus = (req, res, next) => {
  if (!req.user) {
    throw new AuthenticationError("Authentication required");
  }

  if (!req.user.isActive) {
    throw new AuthorizationError(
      "Account is deactivated. Please contact administrator."
    );
  }

  next();
};

/**
 * Log user activity
 */
const logActivity = (action) => {
  return (req, res, next) => {
    if (req.user) {
      console.log(
        `[${new Date().toISOString()}] User ${req.user.username} (${
          req.user.role
        }) - ${action}`
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
  adminOnly,
  adminOrWarehouse,
  adminOrCounter,
  counterOrWarehouse,
  optionalAuth,
  userRateLimit,
  validateUserStatus,
  logActivity,
};
