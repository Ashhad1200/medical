const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// Import configurations
const config = require("./config/env");
const database = require("./config/database");

// Import error handling
const {
  globalErrorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
} = require("./utils/errors");

// Import routes
const authRoutes = require("./routes/auth");
const medicineRoutes = require("./routes/medicines");
const orderRoutes = require("./routes/orders");
const userRoutes = require("./routes/users");

class MedicalPosApp {
  constructor() {
    this.app = express();
    this.setupErrorHandlers();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorMiddleware();
  }

  /**
   * Setup global error handlers
   */
  setupErrorHandlers() {
    handleUncaughtException();
    handleUnhandledRejection();
  }

  /**
   * Setup application middleware
   */
  setupMiddleware() {
    // Trust proxy (for production deployment)
    this.app.set("trust proxy", 1);

    // Security middleware
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        success: false,
        message: "Too many requests from this IP, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/", limiter);

    // Stricter rate limiting for auth routes
    const authLimiter = rateLimit({
      windowMs: config.authRateLimit.windowMs,
      max: config.authRateLimit.max,
      message: {
        success: false,
        message: "Too many authentication attempts, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/auth/login", authLimiter);
    this.app.use("/api/auth/register", authLimiter);

    // Body parsing middleware
    this.app.use(
      express.json({
        limit: "10mb",
        verify: (req, res, buf) => {
          try {
            JSON.parse(buf);
          } catch (e) {
            res.status(400).json({
              success: false,
              message: "Invalid JSON payload",
            });
            return;
          }
        },
      })
    );

    this.app.use(
      express.urlencoded({
        extended: true,
        limit: "10mb",
      })
    );

    // Compression middleware
    this.app.use(compression());

    // CORS configuration
    this.app.use(cors(config.cors));

    // Logging middleware
    if (config.env === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(morgan("combined"));
    }

    // Request ID middleware for tracking
    this.app.use((req, res, next) => {
      req.requestId = Math.random().toString(36).substr(2, 9);
      res.set("X-Request-ID", req.requestId);
      next();
    });
  }

  /**
   * Setup application routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({
        success: true,
        message: "Moiz Medical Store API is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: process.env.npm_package_version || "1.0.0",
        requestId: req.requestId,
      });
    });

    // API info endpoint
    this.app.get("/api", (req, res) => {
      res.json({
        success: true,
        message: "Moiz Medical Store Inventory & POS API",
        version: "1.0.0",
        documentation: "/api/docs",
        endpoints: {
          auth: "/api/auth",
          medicines: "/api/medicines",
          orders: "/api/orders",
          users: "/api/users",
        },
      });
    });

    // API routes
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/medicines", medicineRoutes);
    this.app.use("/api/orders", orderRoutes);
    this.app.use("/api/users", userRoutes);

    // 404 handler for undefined routes
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        requestId: req.requestId,
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  setupErrorMiddleware() {
    this.app.use(globalErrorHandler);
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Connect to database
      await database.connect();

      // Start server
      const server = this.app.listen(config.port, () => {
        console.log(`
🚀 Moiz Medical Store Server Started Successfully!
🌐 Environment: ${config.env}
📍 Port: ${config.port}
🔗 Health Check: http://localhost:${config.port}/health
📊 API Endpoint: http://localhost:${config.port}/api
🏥 Company: ${config.company.name}
📧 Contact: ${config.company.email}
🕐 Started at: ${new Date().toISOString()}
        `);
      });

      // Graceful shutdown
      this.setupGracefulShutdown(server);

      return server;
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown(server) {
    const shutdown = async (signal) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log("🔌 HTTP server closed");

        try {
          // Close database connection
          await database.disconnect();
          console.log("🛑 Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force close after timeout
      setTimeout(() => {
        console.log("⏰ Forcing shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }

  /**
   * Get Express app instance
   */
  getApp() {
    return this.app;
  }
}

module.exports = MedicalPosApp;
