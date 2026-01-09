# Nightclub Ads

A complete management system for scraped Placeminute billetterie data with web interface for user management.

## Features

### Data Scraping
- Web scraping with Puppeteer
- MySQL database integration with Sequelize
- CSV file parsing and processing
- Automatic event detection and data export
- French phone number normalization (06 12 34 56 78, +33612345678, etc.)
- Smart postal code extraction from addresses
- Date validation and formatting
- Designed to run via cron jobs

### Web Interface
- Secure login system with password reset via email (Ethereal)
- User management dashboard
- Add, edit, delete users manually
- View all scraped users from database
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js (v18 or higher)
- MySQL database
- npm or pnpm
- **Linux uniquement** : Dépendances système pour Puppeteer (voir [INSTALL-LINUX.md](INSTALL-LINUX.md))

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure the `.env` file with your database credentials and Placeminute login:

```env
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nightclub
DB_PORT=3306

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

PLACEMINUTE_URL=https://pro.placeminute.com/connexion.html
PLACEMINUTE_EMAIL=your-email@example.com
PLACEMINUTE_PASSWORD=your-password

BASE_URL=http://localhost:3000
```

3. Sync the database and create the first admin user:

```bash
npm run sync
npm run create-admin
```

## Database Setup

1. Create the MySQL database:

```sql
CREATE DATABASE nightclub;
```

2. Synchronize the database schema:

```bash
npm run sync
```

This will create the `users` and `user_auth` tables.

3. Create your first admin user:

```bash
npm run create-admin
```

## Usage

### Run the Scraper

Download data from Placeminute billetterie:

```bash
npm start
# or
npm run scraper
```

This will:
1. Launch a browser
2. Log in to Placeminute billetterie
3. Navigate to the events page
4. Extract all available events
5. Download CSV files for each event (renamed as `event_{id}_filename.csv`)
6. Parse the CSV files
7. Store user data in the MySQL database (only users with French phone numbers)

### Start the Web Interface

Access the user management dashboard:

```bash
npm run dev
```

Then open your browser at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run server
```

L'application sera servie sur le port **8496** par défaut.

Pour le déploiement sur VPS, voir [DEPLOY-VPS.md](DEPLOY-VPS.md)

## Project Structure

```
nightclub-ads/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── users/
│   │   ├── dashboard/            # User management page
│   │   ├── forgot-password/      # Password reset request
│   │   ├── reset-password/       # Password reset form
│   │   ├── page.js               # Login page
│   │   ├── layout.js             # Root layout
│   │   └── globals.css            # Global styles
│   ├── config/
│   │   ├── database.js           # Sequelize configuration
│   │   └── email.js              # Email service (Ethereal)
│   ├── models/
│   │   ├── user.model.js         # Scraped user model
│   │   └── user-auth.model.js    # Login user model
│   ├── services/
│   │   ├── user.service.js       # User CRUD operations
│   │   └── user-auth.service.js  # Auth operations
│   ├── scraper/
│   │   └── placeminute-scraper.js # Puppeteer scraping
│   ├── utils/
│   │   ├── parse-excel.js        # CSV parsing utilities
│   │   ├── sync-database.js      # Database sync
│   │   └── create-admin.js       # CLI user creation
│   └── index.js                  # Scraper entry point
├── downloads/                     # Downloaded CSV files
├── .env                           # Environment variables
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── package.json
└── README.md
```

## Setting up Cron Job

To run the scraper automatically on a schedule, add a cron job:

```bash
crontab -e
```

Example: Run every day at 2 AM

```bash
0 2 * * * cd /path/to/nightclub-ads && npm start
```

## Database Schema

### Users Table (Scraped Data)

- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `phone_number` (VARCHAR(20), NOT NULL, UNIQUE) - Normalized French format
- `email` (VARCHAR(255), NOT NULL, UNIQUE)
- `first_name` (VARCHAR(100), NULL)
- `last_name` (VARCHAR(100), NULL)
- `postal_code` (VARCHAR(20), NULL) - Extracted from addresses
- `birth_date` (DATE, NULL) - Validated before insertion
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### User Auth Table (Login Users)

- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `email` (VARCHAR(255), NOT NULL, UNIQUE)
- `password` (VARCHAR(255), NOT NULL) - Hashed with bcrypt
- `reset_password_token` (VARCHAR(255), NULL)
- `reset_password_expires` (DATETIME, NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Security Notes

- Password reset emails sent via Ethereal (test only)
- Passwords are hashed using bcrypt with salt rounds of 10
- Phone numbers must be unique in the database
- French phone numbers are automatically normalized to standard format (0670123456)
- Invalid or non-French phone numbers are rejected
- Make sure to keep your `.env` file secure and never commit it
- For production, use a real SMTP server instead of Ethereal

## License

ISC

