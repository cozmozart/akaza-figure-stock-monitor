# 🎌 Akaza Figure Stock Monitor

A beautiful, automated stock monitoring system for the Akaza Demon Slayer figure from BigBadToyStore. Get notified instantly when this rare figure comes back in stock!

![Akaza Figure](https://via.placeholder.com/400x300/667eea/ffffff?text=Akaza+Figure)

## ✨ Features

- 🔍 **Automated Monitoring**: Checks BigBadToyStore every hour
- 📧 **Email Notifications**: Get notified instantly when back in stock
- 🎨 **Beautiful UI**: Modern, responsive design
- 📱 **Mobile Friendly**: Works perfectly on all devices
- 🔧 **Expandable**: Easy to add more products to monitor
- 🆓 **Free Hosting**: Runs on GitHub Pages with GitHub Actions

## 🚀 Quick Setup

### 1. Fork and Clone

```bash
git clone https://github.com/yourusername/akaza-figure-stock-monitor.git
cd akaza-figure-stock-monitor
```

### 2. Enable GitHub Pages

1. Go to your repository settings
2. Scroll to "Pages" section
3. Set source to "Deploy from a branch"
4. Select "main" branch and "/ (root)" folder
5. Save

Your site will be available at: `https://yourusername.github.io/akaza-figure-stock-monitor`

### 3. Configure Email Notifications

1. Go to your repository settings
2. Click "Secrets and variables" → "Actions"
3. Add these repository secrets:

```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
NOTIFICATION_EMAIL=your-notification-email@gmail.com
```

#### Setting up Gmail App Password:

1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings → Security
3. Generate an "App Password" for this application
4. Use this app password (not your regular password) for `EMAIL_PASS`

### 4. Test the System

1. Go to the "Actions" tab in your repository
2. Click "Stock Monitor" workflow
3. Click "Run workflow" to test manually
4. Check your email for notifications!

## 🛠️ How It Works

### Frontend (GitHub Pages)
- **index.html**: Beautiful landing page with real-time status
- **styles.css**: Modern, responsive styling
- **script.js**: Client-side monitoring and user interaction

### Backend (GitHub Actions)
- **monitor.js**: Core monitoring logic that checks BigBadToyStore
- **stock-monitor.yml**: GitHub Actions workflow that runs hourly
- **package.json**: Node.js dependencies

### Monitoring Process
1. GitHub Actions runs every hour
2. Script fetches the BigBadToyStore page
3. Parses HTML to determine stock status
4. Compares with previous status
5. Sends email notification if item is back in stock
6. Updates status file and commits changes

## 📁 Project Structure

```
akaza-figure-stock-monitor/
├── .github/
│   └── workflows/
│       └── stock-monitor.yml    # GitHub Actions workflow
├── index.html                   # Main webpage
├── styles.css                   # Styling
├── script.js                    # Frontend JavaScript
├── monitor.js                   # Backend monitoring script
├── package.json                 # Node.js dependencies
├── status.json                  # Current stock status (auto-generated)
└── README.md                    # This file
```

## 🔧 Adding More Products

To monitor additional items, edit the `products` array in both `monitor.js` and `script.js`:

```javascript
const CONFIG = {
    products: [
        {
            id: 'akaza-buzzmod',
            name: 'Akaza - Demon Slayer: Kimetsu no Yaiba [BUZZmod.]',
            url: 'https://www.bigbadtoystore.com/Product/VariationDetails/186410',
            price: '$154.99',
            store: 'BigBadToyStore'
        },
        // Add more products here
        {
            id: 'another-figure',
            name: 'Another Figure Name',
            url: 'https://example.com/product',
            price: '$99.99',
            store: 'Example Store'
        }
    ]
};
```

## 🎯 Customization

### Changing Check Frequency
Edit the cron schedule in `.github/workflows/stock-monitor.yml`:

```yaml
schedule:
  - cron: '0 * * * *'  # Every hour
  - cron: '*/30 * * * *'  # Every 30 minutes
  - cron: '0 */6 * * *'   # Every 6 hours
```

### Styling
Modify `styles.css` to match your preferences:
- Colors: Update the CSS custom properties
- Layout: Adjust the container max-width
- Typography: Change the Google Fonts import

### Email Template
Customize the email notification in `monitor.js` in the `sendNotification` function.

## 🐛 Troubleshooting

### GitHub Actions Not Running
- Check that the workflow file is in `.github/workflows/`
- Ensure the cron syntax is correct
- Verify repository secrets are set

### Email Notifications Not Working
- Double-check Gmail app password
- Verify all secrets are set correctly
- Check GitHub Actions logs for errors

### Stock Detection Issues
- BigBadToyStore may have changed their HTML structure
- Update the selectors in `parseStockStatus()` function
- Test the selectors manually on the product page

## 📊 Monitoring Your Monitor

- **GitHub Actions**: Check the "Actions" tab for run history
- **Status File**: `status.json` contains current stock status
- **Email Logs**: Check your email for notification history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this for your own stock monitoring needs!

## 🙏 Acknowledgments

- Built for anime figure collectors everywhere
- Inspired by the need to never miss a rare figure drop
- Thanks to BigBadToyStore for having awesome figures

---

**Happy Hunting! 🎌**

*May your figures always be in stock and your notifications always be timely.*
