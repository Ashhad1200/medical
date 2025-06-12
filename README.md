# 🏥 Medical Store POS System

A comprehensive Point of Sale (POS) system designed specifically for medical stores and pharmacies. This full-stack application provides inventory management, sales tracking, user management, and detailed analytics for efficient pharmacy operations.

## 🌟 Features

### 💰 Point of Sale (POS)

- **Quick Sales Processing** - Fast barcode scanning and search functionality
- **Real-time Inventory Updates** - Automatic stock deduction upon sale
- **Receipt Generation** - PDF receipts with detailed transaction information
- **Multiple Payment Methods** - Cash, card, and digital payment support
- **Customer Information** - Track customer purchase history

### 📦 Inventory Management

- **Medicine Database** - Comprehensive medicine catalog with details
- **Stock Level Monitoring** - Real-time stock tracking and low-stock alerts
- **Expiry Date Management** - Track and alert for expiring medicines
- **Batch Tracking** - Monitor medicine batches and suppliers
- **Bulk Import/Export** - Excel/CSV import/export functionality

### 👥 User Management

- **Role-Based Access Control** - Admin, Counter Staff, and Warehouse roles
- **User Authentication** - Secure JWT-based authentication
- **Activity Logging** - Track user actions and system activities
- **Permission Management** - Granular access control for different features

### 📊 Analytics & Reporting

- **Sales Dashboard** - Real-time sales metrics and trends
- **Inventory Reports** - Stock levels, low stock, and expiry reports
- **Financial Analytics** - Revenue, profit, and sales performance
- **Custom Date Ranges** - Flexible reporting periods
- **Export Capabilities** - Download reports in PDF/Excel formats

### 🏪 Supplier Management

- **Supplier Database** - Maintain supplier contact information
- **Purchase Orders** - Create and track purchase orders
- **Supplier Performance** - Track delivery times and quality metrics
- **Payment Tracking** - Monitor outstanding payments and terms

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - State management with RTK Query
- **React Router** - Client-side routing
- **React Hook Form** - Form validation and handling
- **Chart.js** - Data visualization and charts
- **Axios** - HTTP client for API requests

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing and security
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting and protection

### DevOps & Deployment

- **Railway** - Backend hosting and deployment
- **Vercel** - Frontend hosting and deployment
- **MongoDB Atlas** - Cloud database hosting
- **Git** - Version control system
- **GitHub** - Code repository and collaboration

## 🚀 Live Demo

- **🌐 Frontend**: https://medical-osg7l4ms2-syed-ashhads-projects.vercel.app
- **🔧 Backend API**: https://medical-production-308c.up.railway.app/api
- **📊 Health Check**: https://medical-production-308c.up.railway.app/health

### Demo Credentials

| Role          | Username    | Password       |
| ------------- | ----------- | -------------- |
| Admin         | `admin`     | `admin123`     |
| Counter Staff | `counter`   | `counter123`   |
| Warehouse     | `warehouse` | `warehouse123` |

## 📁 Project Structure

```
medical/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── store/          # Redux store and slices
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # CSS and styling files
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   └── vercel.json         # Vercel deployment config
│
├── server/                 # Backend Node.js application
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   ├── scripts/            # Utility scripts
│   ├── package.json        # Backend dependencies
│   └── railway.json        # Railway deployment config
│
├── README.md               # Project documentation
└── LICENSE                 # MIT License
```

## 🔧 Installation & Setup

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Ashhad1200/medical.git
cd medical
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp config/env.example .env

# Update .env with your configurations
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret_key
# NODE_ENV=development
# PORT=3001

# Seed the database (optional)
npm run seed

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3001/api" > .env.local

# Start the development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🚀 Deployment

### Backend Deployment (Railway)

1. Create a Railway account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `backend` branch
4. Set environment variables in Railway dashboard
5. Deploy automatically

### Frontend Deployment (Vercel)

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `client`
4. Configure environment variables
5. Deploy automatically

**Detailed deployment guides are available:**

- [Backend Railway Deployment](server/RAILWAY_DEPLOYMENT.md)
- [Frontend Vercel Deployment](client/VERCEL_DEPLOYMENT.md)

## 📖 API Documentation

### Authentication Endpoints

```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
GET  /api/auth/profile        # Get user profile
POST /api/auth/logout         # User logout
```

### Medicine Endpoints

```
GET    /api/medicines         # Get all medicines
POST   /api/medicines         # Create new medicine
GET    /api/medicines/:id     # Get medicine by ID
PUT    /api/medicines/:id     # Update medicine
DELETE /api/medicines/:id     # Delete medicine
GET    /api/medicines/search  # Search medicines
```

### Order Endpoints

```
GET    /api/orders           # Get all orders
POST   /api/orders           # Create new order
GET    /api/orders/:id       # Get order by ID
PUT    /api/orders/:id       # Update order
DELETE /api/orders/:id       # Delete order
GET    /api/orders/:id/pdf   # Download order PDF
```

### User Management Endpoints

```
GET    /api/users            # Get all users (Admin only)
POST   /api/users            # Create new user (Admin only)
PUT    /api/users/:id        # Update user (Admin only)
DELETE /api/users/:id        # Delete user (Admin only)
```

### Dashboard & Analytics

```
GET    /api/dashboard/stats     # Get dashboard statistics
GET    /api/dashboard/analytics # Get analytics data
GET    /api/reports/sales       # Get sales reports
GET    /api/reports/inventory   # Get inventory reports
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt password encryption
- **Rate Limiting** - API request rate limiting
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Comprehensive input sanitization
- **Role-Based Access** - Permission-based feature access
- **Secure Headers** - Helmet.js security headers

## 🎯 User Roles & Permissions

### 👨‍💼 Admin

- Full system access
- User management
- Analytics and reports
- System configuration
- All counter and warehouse permissions

### 🛒 Counter Staff

- Process sales and orders
- Medicine catalog access
- Customer management
- Basic inventory viewing
- Receipt generation

### 📦 Warehouse Staff

- Inventory management
- Stock updates
- Supplier management
- Purchase orders
- Expiry tracking

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

- **GitHub Issues**: [Create an issue](https://github.com/Ashhad1200/medical/issues)
- **Email**: syedashhad17@gmail.com
- **Documentation**: Check the deployment guides in respective directories

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **Tailwind CSS** - For the beautiful utility-first CSS framework
- **MongoDB** - For the flexible NoSQL database
- **Vercel & Railway** - For excellent deployment platforms
- **Open Source Community** - For the countless libraries and tools

---

## 🚀 Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/Ashhad1200/medical.git
cd medical

# Backend setup
cd server && npm install && npm run dev

# Frontend setup (new terminal)
cd client && npm install && npm run dev

# Access at http://localhost:5173
# Login with: admin / admin123
```

**Built with ❤️ for efficient pharmacy management**

---

_Last updated: June 2025_
