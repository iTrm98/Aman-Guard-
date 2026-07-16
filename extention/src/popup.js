document.addEventListener('DOMContentLoaded', () => {
  const PORTAL_URL = "http://localhost:5173";

  // Load stored data
  chrome.storage.local.get([
    "amanguard_connected",
    "amanguard_user",
    "amanguard_last_scan"
  ], (stored) => {

    // Connection status
    const connDot  = document.getElementById('conn-dot');
    const connText = document.getElementById('conn-text');
    if (stored.amanguard_connected) {
      connDot.className  = 'dot dot-green';
      connText.textContent = 'متصل | Connected';
    } else {
      connDot.className  = 'dot dot-red';
      connText.textContent = 'غير متصل | Not connected';
    }

    // User info
    if (stored.amanguard_user) {
      try {
        const user = JSON.parse(stored.amanguard_user);
        const name = user.name || user.nameEn || "مستخدم";
        document.getElementById('user-section').style.display = 'block';
        document.getElementById('user-avatar').textContent = name.charAt(0);
        document.getElementById('user-name').textContent = name;
        document.getElementById('user-role').textContent =
          user.role === 'BANK_OFFICER' ? 'موظف البنك | Bank Officer' : 'عميل | Customer';

        // Show SOC button for officers
        if (user.role === 'BANK_OFFICER') {
          document.getElementById('open-soc').style.display = 'block';
        }
      } catch(e) {}
    }

    // Last scan result
    if (stored.amanguard_last_scan) {
      try {
        const scan = JSON.parse(stored.amanguard_last_scan);
        const levelClass = {
          Critical: 'level-critical',
          High: 'level-high',
          Low: 'level-low'
        }[scan.risk_level] ?? 'level-low';

        const icon = scan.risk_level === 'Critical' ? '🚫' :
                     scan.risk_level === 'High' ? '⚠️' : '✅';

        document.getElementById('last-scan-content').innerHTML = `
          <div class="scan-result">
            <span class="scan-icon">${icon}</span>
            <div>
              <div class="scan-level ${levelClass}">${scan.risk_level}</div>
              <div class="scan-site">${scan.domain ?? '—'}</div>
            </div>
          </div>
        `;
      } catch(e) {}
    }
  });

  // Protection enabled/disabled state (persists across refreshes via chrome.storage.local).
  // NOTE: target the 2nd .status-badge (protection) — ':last-child' would match the
  // connection badge too and querySelector would return that one instead.
  chrome.storage.local.get(['amanguard_enabled'], (stored) => {
    const isEnabled = stored.amanguard_enabled !== false; // default true
    const protectionEl = document.querySelectorAll('.status-badge')[1];
    if (protectionEl) {
      if (isEnabled) {
        protectionEl.innerHTML = '<span class="dot dot-green"></span><span>فعّالة | Active</span>';
        protectionEl.style.color = '#22c55e';
      } else {
        protectionEl.innerHTML = '<span class="dot dot-red"></span><span>معطّلة | Disabled</span>';
        protectionEl.style.color = '#ef4444';
      }
    }
  });

  // Button actions
  document.getElementById('open-portal').addEventListener('click', () => {
    chrome.tabs.create({ url: `${PORTAL_URL}` });
  });

  document.getElementById('open-soc').addEventListener('click', () => {
    chrome.tabs.create({ url: `${PORTAL_URL}` });
  });
});
