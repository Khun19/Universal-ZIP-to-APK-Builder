# Personal Finance & Expense Tracker

A modern, mobile-first personal finance and expense tracking web application built with **React**, **TypeScript**, and **Vite**. All data is stored privately and locally in your browser with zero external backend dependencies.

## ✨ Features

- **📊 Dashboard Overview**
  - Real-time **Total Balance**, **Total Income**, and **Total Expenses**
  - Net savings rate calculation
  - Interactive **Spending by Category** SVG Donut chart with live hover breakdowns
  - **Monthly Cash Flow** income vs. expense comparison bar chart
  - Recent transactions list with direct quick actions

- **💳 Complete Transactions Ledger**
  - Search transactions by title, note, or category
  - Filter by type: **All**, **Expense**, or **Income**
  - Filter by category: Food, Transport, Shopping, Bills, Entertainment, Health, Education, Salary, Other
  - Filter by date preset (**All Time**, **This Month**, **Last Month**, **This Year**) or **Custom Date Range**
  - Sort by date (newest/oldest) or amount (highest/lowest)
  - Aggregate indicators showing filtered items count, filtered inflow, and filtered outflow

- **➕ Add & Edit Transactions**
  - Form validation with inline error messaging
  - Transaction title, amount, date picker, type selector, category grid, and optional notes
  - Edit existing transactions or delete with a safe confirmation dialog

- **📈 Analytics & Deep-Dive Reports**
  - Savings rate meter
  - Top spending category highlight
  - Average monthly expenditure metrics
  - Detailed category ranking table with percentage distribution progress bars
  - 6-month historical cash flow trend chart

- **💾 Local Storage & Data Management**
  - 100% offline-first architecture using browser `localStorage`
  - Realistic sample dataset preloaded on initial launch
  - Export data to **CSV** spreadsheet
  - Full **JSON Backup** export and restore/import
  - One-click reset to sample dataset or clear ledger

## 🛠️ Tech Stack

- **React 19**
- **TypeScript**
- **Vite 6** (configured with relative asset paths `base: "./"`)
- **Tailwind CSS v4**
- **Lucide React** (iconography)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone or extract the repository
git clone <repository-url>
cd personal-finance-tracker

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` (or the port indicated by Vite).

### Production Build

```bash
npm run build
```

The production assets will be output to the `dist/` directory with relative asset paths (`base: "./"`), ready for standalone hosting or static deployment.

### Preview Production Build

```bash
npm run preview
```

## 🔒 Privacy

All financial calculations and data storage occur strictly on your device within `localStorage`. No data is ever transmitted over the network or saved to external databases.
