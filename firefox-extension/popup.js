// Popup script for ATS Resume Optimizer Firefox extension

document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extract-btn');
  const openAppBtn = document.getElementById('open-app-btn');
  const jobContent = document.getElementById('job-content');
  const statusDiv = document.getElementById('status');

  // Check if we're on a supported job site
  browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const url = currentTab.url;

    if (isJobSite(url)) {
      // Try to extract job info automatically
      extractJobInfo(currentTab.id);
    } else {
      showNoJobMessage();
    }
  });

  extractBtn.addEventListener('click', function() {
    browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];

      if (!isJobSite(currentTab.url)) {
        showStatus('Please navigate to a job posting page first', 'error');
        return;
      }

      showStatus('Extracting job description...', 'info');
      extractBtn.disabled = true;

      browser.tabs.sendMessage(currentTab.id, { action: 'extractJob' }, function(response) {
        extractBtn.disabled = false;

        if (browser.runtime.lastError) {
          showStatus('Error extracting job data', 'error');
          return;
        }

        if (response) {
          displayJobInfo(response);
          showStatus('Job extracted successfully!', 'success');
        } else {
          showStatus('Could not extract job information', 'error');
        }
      });
    });
  });

  openAppBtn.addEventListener('click', function() {
    // Open the web app
    const appUrl = 'http://localhost:3000'; // Change to your production URL

    browser.tabs.create({ url: appUrl }, function(tab) {
      showStatus('Resume optimizer opened!', 'success');
    });
  });

  function isJobSite(url) {
    const jobSites = [
      'linkedin.com/jobs',
      'indeed.com',
      'glassdoor.com',
      'monster.com',
      'dice.com',
      'ziprecruiter.com',
      'careerbuilder.com'
    ];

    return jobSites.some(site => url.includes(site));
  }

  function extractJobInfo(tabId) {
    browser.tabs.sendMessage(tabId, { action: 'extractJob' }, function(response) {
      if (browser.runtime.lastError) {
        showNoJobMessage();
        return;
      }

      if (response && (response.title || response.company || response.description)) {
        displayJobInfo(response);
      } else {
        showNoJobMessage();
      }
    });
  }

  function displayJobInfo(jobData) {
    const html = `
      <div class="job-info">
        <div class="job-title">${jobData.title || 'Job Title Not Found'}</div>
        <div class="job-company">${jobData.company || 'Company Not Found'}</div>
        <div class="job-location">${jobData.location || 'Location Not Found'}</div>
      </div>
    `;

    jobContent.innerHTML = html;
  }

  function showNoJobMessage() {
    jobContent.innerHTML = '<p class="no-job">Navigate to a job posting to get started</p>';
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.style.color = type === 'error' ? '#e53e3e' :
                           type === 'success' ? '#38a169' : '#718096';

    // Clear status after 3 seconds
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 3000);
  }
});