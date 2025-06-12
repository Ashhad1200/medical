# 🏥 Moiz Medical Store - POS System

A comprehensive Point of Sale (POS) system designed specifically for Moiz Medical Store. This full-stack application provides inventory management, sales tracking, user management, and detailed analytics for efficient pharmacy operations.

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

- **🌐 Frontend**: https://medical-orpin-mu.vercel.app
- **🔧 Backend API**: https://medical-production-308c.up.railway.app/api
- **📊 Health Check**: https://medical-production-308c.up.railway.app/health

### Demo Credentials

| Role          | Username    | Password       |
| ------------- | ----------- | -------------- |
| Admin         | `admin`     | `admin123`     |
| Counter Staff | `counter`   | `counter123`   |
| Warehouse     | `warehouse` | `warehouse123` |

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

### 2. Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3001/api" > .env.local

# Start the development server
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Contact

- **GitHub Issues**: [Create an issue](https://github.com/Ashhad1200/medical/issues)
- **Email**: syedashhad17@gmail.com

## 🚀 Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/Ashhad1200/medical.git
cd medical

# Frontend setup
cd client && npm install && npm run dev

# Access at http://localhost:5173
# Login with: admin / admin123
```

**Built with ❤️ for Moiz Medical Store**

---

_Developed for efficient pharmacy management and operations_
