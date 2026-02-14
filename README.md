# Abu Fragrance E-commerce Application

A modern, responsive e-commerce web application built with React, Vite, TypeScript, and Tailwind CSS. Features a public storefront and a secure admin dashboard.

## 🚀 Features

- **Public Store**: Browse products, view details, and add to cart.
- **Smart Checkout**: Automatic delivery fee calculation based on Wilaya (58 Wilayas supported).
- **Admin Dashboard**: Manage products (add/edit/delete) and view orders.
- **Telegram Integration**: Receive instant order notifications directly to your Telegram.
- **Responsive Design**: Fully optimized for mobile and desktop.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **State Management**: React Context API

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone <your-repo-url>
    cd e-shop
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    - Rename `.env.example` to `.env`
    - Add your Telegram Bot credentials:
      ```env
      VITE_TELEGRAM_BOT_TOKEN=your_token_here
      VITE_TELEGRAM_CHAT_ID=your_chat_id_here
      ```

4.  **Start Development Server**
    ```bash
    npm run dev
    ```

## 🚢 Deployment

### Option 1: Vercel (Recommended)
1.  Push your code to GitHub.
2.  Import the project in Vercel.
3.  Vercel will automatically detect Vite.
4.  Add your Environment Variables (`VITE_TELEGRAM_BOT_TOKEN`, etc.) in the Vercel Project Settings.
5.  Click **Deploy**.

### Option 2: Netlify
1.  Drag and drop the `dist` folder (after running `npm run build`) or connect via Git.
2.  Set Build Command: `npm run build`
3.  Set Publish Directory: `dist`
4.  Add Environment Variables in Site Settings.

### Option 3: Traditional Hosting (Apache/Nginx)
1.  Build the project:
    ```bash
    npm run build
    ```
2.  Upload the contents of the `dist` folder to your server's public directory (e.g., `public_html`).
3.  **Important**: Configure your server to redirect all requests to `index.html` (SPA Routing).
    - **Apache (.htaccess)**:
      ```apache
      <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
      </IfModule>
      ```

## 🔐 Admin Access

- **URL**: `/admin`
- **Default Credentials**:
  - Email: `admin@eshop.dz`
  - Password: `admin123`
  
  *Note: In a real production app, you should implement a real backend authentication system.*

## 🤖 Telegram Bot Setup

1.  Open Telegram and search for **@BotFather**.
2.  Send `/newbot` and follow instructions to get your **Token**.
3.  Create a channel or group (or just chat with the bot).
4.  Add the bot to the channel/group as an admin.
5.  Get the **Chat ID** (you can use `@userinfobot` or forward a message to `@JsonDumpBot`).
6.  Add these values to your `.env` file.

## 📄 License

MIT
