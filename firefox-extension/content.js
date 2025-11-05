// Content script for extracting job descriptions from various job sites

function extractJobDescription() {
  const hostname = window.location.hostname;

  let jobData = {
    title: '',
    company: '',
    location: '',
    description: '',
    url: window.location.href,
    source: hostname
  };

  try {
    if (hostname.includes('linkedin.com')) {
      jobData = extractFromLinkedIn(jobData);
    } else if (hostname.includes('indeed.com')) {
      jobData = extractFromIndeed(jobData);
    } else if (hostname.includes('glassdoor.com')) {
      jobData = extractFromGlassdoor(jobData);
    } else if (hostname.includes('monster.com')) {
      jobData = extractFromMonster(jobData);
    } else {
      // Generic extraction for other sites
      jobData = extractGeneric(jobData);
    }
  } catch (error) {
    console.error('Error extracting job data:', error);
  }

  return jobData;
}

function extractFromLinkedIn(jobData) {
  // LinkedIn job posting selectors
  const titleSelectors = [
    '.job-details-jobs-unified-top-card__job-title h1',
    '.jobs-details__main-content h1',
    '[data-test-id="job-title"]'
  ];

  const companySelectors = [
    '.job-details-jobs-unified-top-card__company-name a',
    '.jobs-details__main-content .job-details-jobs-unified-top-card__company-name',
    '[data-test-id="company-name"]'
  ];

  const locationSelectors = [
    '.job-details-jobs-unified-top-card__bullet',
    '.jobs-details__main-content .job-details-jobs-unified-top-card__bullet',
    '[data-test-id="job-location"]'
  ];

  const descriptionSelectors = [
    '.jobs-description__content',
    '.job-details-jobs-unified-top-card__description',
    '[data-test-id="job-description"]'
  ];

  jobData.title = getTextFromSelectors(titleSelectors) || jobData.title;
  jobData.company = getTextFromSelectors(companySelectors) || jobData.company;
  jobData.location = getTextFromSelectors(locationSelectors) || jobData.location;
  jobData.description = getTextFromSelectors(descriptionSelectors) || jobData.description;

  return jobData;
}

function extractFromIndeed(jobData) {
  // Indeed job posting selectors
  jobData.title = document.querySelector('h1.jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
  jobData.company = document.querySelector('.jobsearch-InlineCompanyRating .icl-u-lg-mr--sm')?.textContent?.trim() || '';
  jobData.location = document.querySelector('.jobsearch-JobInfoHeader-subtitle .icl-u-lg-mr--sm')?.textContent?.trim() || '';
  jobData.description = document.querySelector('#jobDescriptionText')?.textContent?.trim() || '';

  return jobData;
}

function extractFromGlassdoor(jobData) {
  // Glassdoor job posting selectors
  jobData.title = document.querySelector('h1[data-test="job-title"]')?.textContent?.trim() || '';
  jobData.company = document.querySelector('[data-test="employer-name"]')?.textContent?.trim() || '';
  jobData.location = document.querySelector('[data-test="location"]')?.textContent?.trim() || '';
  jobData.description = document.querySelector('[data-test="job-description"]')?.textContent?.trim() || '';

  return jobData;
}

function extractFromMonster(jobData) {
  // Monster job posting selectors
  jobData.title = document.querySelector('h1.title')?.textContent?.trim() || '';
  jobData.company = document.querySelector('.job-company-name')?.textContent?.trim() || '';
  jobData.location = document.querySelector('.job-location')?.textContent?.trim() || '';
  jobData.description = document.querySelector('.job-description')?.textContent?.trim() || '';

  return jobData;
}

function extractGeneric(jobData) {
  // Generic extraction using common patterns
  const titleSelectors = ['h1', '.job-title', '[class*="title"]'];
  const companySelectors = ['.company', '[class*="company"]', '.employer'];
  const locationSelectors = ['.location', '[class*="location"]'];
  const descriptionSelectors = ['.description', '[class*="description"]', '.job-description', '#job-description'];

  jobData.title = getTextFromSelectors(titleSelectors) || document.title.split(' | ')[0] || '';
  jobData.company = getTextFromSelectors(companySelectors) || '';
  jobData.location = getTextFromSelectors(locationSelectors) || '';
  jobData.description = getTextFromSelectors(descriptionSelectors) || '';

  return jobData;
}

function getTextFromSelectors(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      return element.textContent.trim();
    }
  }
  return null;
}

// Listen for messages from popup or background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractJob') {
    const jobData = extractJobDescription();
    sendResponse(jobData);
  }
  return true; // Keep the message channel open for async response
});

// Inject a floating action button on job pages
function injectActionButton() {
  // Check if button already exists
  if (document.getElementById('ats-resume-optimizer-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'ats-resume-optimizer-btn';
  button.innerHTML = '🚀 Optimize Resume';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: #4299E1;
    color: white;
    border: none;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.2s ease;
  `;

  button.onmouseover = () => {
    button.style.background = '#3182CE';
    button.style.transform = 'translateY(-2px)';
  };

  button.onmouseout = () => {
    button.style.background = '#4299E1';
    button.style.transform = 'translateY(0)';
  };

  button.onclick = () => {
    const jobData = extractJobDescription();

    // Send message to background script to open app
    browser.runtime.sendMessage({
      action: 'openAppWithJob',
      jobData: jobData
    });
  };

  document.body.appendChild(button);
}

// Inject the button when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectActionButton);
} else {
  injectActionButton();
}