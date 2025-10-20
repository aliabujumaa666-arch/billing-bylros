# BYLROS Customer Operations Platform

A comprehensive web-based customer operations platform for **BYLROS Middle East Aluminium & Glass LLC**. This platform manages the complete customer lifecycle from lead to payment.

## Features

### Core Modules

1. **Customer Management**
   - Track customer information (name, phone, email, location)
   - Manage customer status: Lead → Quoted → Ordered → Delivered → Installed
   - Add notes and attachments
   - Full CRUD operations

2. **Quotation Generator**
   - Dynamic quote builder with line items
   - Auto-calculate area (m²) from height × width × quantity
   - Automatic VAT calculation (5%)
   - Support for discounts and remarks
   - Export to PDF with BYLROS branding
   - Export to Excel spreadsheet
   - Link quotes to customers

3. **Site Visit Manager**
   - Schedule onsite visits with customers
   - Track visit status: Scheduled, Completed, Cancelled
   - Optional payment requirement for visits
   - View and manage all scheduled visits

4. **Order Tracking**
   - Manage confirmed customer orders
   - Track order dates, delivery dates, and installation dates
   - Monitor order status: Confirmed → In Production → Delivered → Installed
   - Public order tracker for customers (search by phone/email)

5. **Invoices & Payments**
   - Generate invoices from orders
   - Track: Total Amount, Deposit Paid, Payment Before Delivery, Balance
   - Payment history tracking
   - Invoice status: Unpaid, Partial, Paid
   - Export invoices to PDF with payment history

6. **Multi-Language Support**
   - English, Arabic, and Chinese
   - RTL layout support for Arabic
   - Language switcher in sidebar

7. **Dashboard**
   - Real-time statistics
   - Total customers, quotes, visits, orders, and revenue
   - Quick action shortcuts

8. **Customer Portal**
   - Separate login for customers
   - Customizable home page (managed from admin panel)
   - View personal profile and update contact information
   - Access all received quotes with PDF download
   - Track orders with visual progress indicators
   - View invoices and payment history
   - See scheduled site visits
   - Secure data access with Row Level Security

9. **Portal Settings (Admin)**
   - Customize customer portal home page
   - Edit hero section (title, subtitle, background color)
   - Configure welcome message and statistics display
   - Add/remove/edit feature cards
   - Update contact information
   - Preview portal in real-time

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Export**: jsPDF + jsPDF-AutoTable
- **Excel Export**: SheetJS (xlsx)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account (already configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. The environment variables are already configured in `.env`

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

### First-Time Setup

1. **Create an admin account**:
   - Navigate to the application login page
   - Click on "Don't have an account? Create one"
   - Enter your email (e.g., admin@bylros.ae)
   - Enter a password (minimum 6 characters)
   - Confirm your password
   - Click "Create Account"
   - You'll see a success message: "Account created successfully! You can now sign in."

2. **Login**:
   - After creating your account, the form automatically switches to sign-in mode
   - Enter your email and password
   - Click "Sign In" to access the platform
   - You'll be redirected to the Dashboard

## Usage Guide

### Managing Customers

1. Navigate to "Customers" from the sidebar
2. Click "Add Customer" to create a new customer
3. Fill in customer details and select their status
4. Edit or delete customers as needed

### Creating Quotes

1. Navigate to "Quotes" from the sidebar
2. Click "Create Quote"
3. Select a customer from the dropdown
4. Add line items with:
   - Location (e.g., "Living Room", "Bedroom")
   - Type (e.g., "Window", "Door", "Sliding Door")
   - Height (cm), Width (cm), Quantity
   - Unit Price (AED per m²)
5. Area and totals calculate automatically
6. Add remarks if needed
7. Export to PDF or Excel once saved

### Scheduling Site Visits

1. Navigate to "Site Visits"
2. Click "Schedule Visit"
3. Select customer, date/time, and location
4. Add any remarks
5. Optionally enable payment requirement

### Managing Orders

1. Navigate to "Orders"
2. Orders can be created from accepted quotes
3. Track order progress through statuses
4. Set delivery and installation dates

### Creating Invoices

1. Navigate to "Invoices"
2. Create invoices from orders
3. Track deposits, payments, and balance
4. Record payment history
5. Export to PDF with complete payment details

### Customizing Customer Portal

1. Navigate to "Portal Settings" from the sidebar
2. **Hero Section**: Edit main title, subtitle, and background color
3. **Welcome Section**: Update welcome message and toggle statistics display
4. **Features**: Add, edit, or remove feature cards (with custom icons, titles, and descriptions)
5. **Contact Section**: Update contact information (email and phone)
6. Click "Preview Portal" to see changes in a new tab
7. Click "Save Changes" to apply your customizations

### Customer Order Tracker

1. Navigate to "Order Tracker"
2. Customers can search using their phone number or email
3. View all orders with progress bars
4. See order dates, delivery dates, and installation dates

### Using the Customer Portal

**For Customers:**

1. **Access the Portal**:
   - Visit `/customer` route or click "Customer Portal" on the admin login page

2. **Create an Account**:
   - Click "New customer? Create an account"
   - Enter your email (must match the email in your customer record)
   - Enter your phone number (must match the phone in your customer record)
   - Create a password (minimum 6 characters)
   - Confirm your password
   - Click "Create Account"

3. **Sign In**:
   - Enter your email and password
   - Click "Sign In"

4. **Dashboard Features**:
   - **Overview**: See statistics of your quotes, orders, invoices, and total value
   - **Profile**: View and update your contact information
   - **Quotes**: View all quotes received from BYLROS with PDF download
   - **Orders**: Track your orders with visual progress indicators
   - **Invoices**: View invoices, payment history, and download invoice PDFs
   - **Site Visits**: See upcoming and past scheduled site visits

**For Admins:**

Customers must first exist in the customer database before they can create a portal account. The sign-up process validates that the email and phone number match an existing customer record.

## Branding

The platform uses BYLROS brand colors:
- Primary Red: #bb2738
- Secondary Blue: #0d6efd
- BYLROS logo and branding on all PDF exports

## Database Schema

The platform uses the following main tables:
- `customers` - Customer information and status
- `customer_users` - Links auth users to customer records (for customer portal)
- `portal_settings` - Customizable settings for customer portal home page (JSONB)
- `quotes` - Quotations with line items (JSONB)
- `site_visits` - Scheduled site visits
- `orders` - Customer orders
- `invoices` - Invoices and payment tracking
- `payments` - Payment history
- `attachments` - File attachments

All tables have Row Level Security (RLS) enabled for data protection.

## Security

- Authentication required for admin access and customer portal
- Separate authentication contexts for admins and customers
- Row Level Security (RLS) on all database tables
- Customers can only view their own data (enforced by RLS policies)
- Admins have full access to all data
- Public read-only access for customer order tracking
- Secure API endpoints through Supabase

## Future Enhancements

Potential features for future development:
- Warranty tracking system
- Customer feedback and rating system
- Inventory management integration
- AI assistant for customer support
- Email notifications for quotes and orders
- SMS notifications for order status updates
- Payment gateway integration (PayPal/Stripe)
- Advanced reporting and analytics
- Mobile app (React Native)

## Support

For issues or questions, contact BYLROS IT support.

---

**BYLROS Middle East Aluminium & Glass LLC**
Dubai, UAE
