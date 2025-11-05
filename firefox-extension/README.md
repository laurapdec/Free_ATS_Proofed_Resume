# ATS Resume Optimizer - Firefox Extension

A Firefox extension that helps you extract job descriptions from popular job sites and optimize your resume using AI.

## Features

- **Automatic Job Detection**: Detects when you're on supported job posting sites
- **Job Description Extraction**: Extracts job title, company, location, and description
- **Floating Action Button**: Quick access button on job pages to optimize your resume
- **Integration with Web App**: Seamlessly opens your resume in the ATS optimizer
- **Multi-Site Support**: Works with LinkedIn, Indeed, Glassdoor, Monster, and more

## Supported Job Sites

- LinkedIn Jobs
- Indeed
- Glassdoor
- Monster
- Dice
- ZipRecruiter
- CareerBuilder

## Installation

### For Development

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the sidebar
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from this directory

### For Production

1. Package the extension as a `.xpi` file
2. Submit to Firefox Add-ons for review
3. Or host it on your own site for self-distribution

## Development

### File Structure

```
firefox-extension/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── content.js            # Content script for job pages
├── content.css           # Styles for content script
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Building and Testing

1. Make your changes to the extension files
2. Reload the extension in `about:debugging`
3. Test on various job sites
4. Check the browser console for errors

## API Integration

The extension communicates with the ATS Resume Optimizer web app through:

- **Job Data Extraction**: Automatically extracts job information from pages
- **Web App Integration**: Opens the web app with pre-filled job data
- **Authentication**: Respects user authentication state

## Permissions

The extension requires the following permissions:

- `activeTab`: To interact with the current tab
- `storage`: To store user preferences
- `https://*/*`, `http://*/*`: To work on job sites

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on multiple job sites
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact the development team or create an issue in the repository.