// Background script for ATS Resume Optimizer Firefox extension

// Listen for messages from content scripts and popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractJobDescription') {
    // Handle job description extraction
    extractJobDescription(sender.tab.id);
  } else if (message.action === 'openAppWithJob') {
    // Open the web app with job description
    openAppWithJob(message.jobData);
  }
});

async function extractJobDescription(tabId) {
  try {
    const results = await browser.tabs.executeScript(tabId, {
      file: 'content.js'
    });
    return results[0];
  } catch (error) {
    console.error('Error extracting job description:', error);
  }
}

function openAppWithJob(jobData) {
  // Open the web app in a new tab with job data
  const appUrl = browser.runtime.getURL('https://your-app-domain.com'); // Replace with your actual domain
  const jobParam = encodeURIComponent(JSON.stringify(jobData));

  browser.tabs.create({
    url: `${appUrl}?job=${jobParam}`
  });
}

// Handle extension installation
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First time installation
    console.log('ATS Resume Optimizer extension installed');

    // You could show a welcome page or tutorial here
    // browser.tabs.create({ url: 'welcome.html' });
  }
});