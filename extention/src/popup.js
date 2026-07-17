document.addEventListener('DOMContentLoaded', () => {
  const PORTAL_URL = "http://localhost:5173";

  chrome.storage.local.get([
    "amanguard_connected",
    "amanguard_user",
    "amanguard_last_scan",
    "amanguard_enabled"
  ], (stored) => {

    // Connection status
    const connDot  = document.getElementById('conn-dot');
    const connText = document.getElementById('conn-text');
    if (stored.amanguard_connected) {
      connDot.style.background = '#22c55e';
      connText.textContent = 'متصل | Connected';
      connText.style.color = '#22c55e';
    } else {
      connDot.style.background = '#ef4444';
      connText.textContent = 'غير متصل | Not connected';
      connText.style.color = '#8090a0';
    }

    // Protection enabled/disabled state (persists across refreshes via chrome.storage.local)
    const isEnabled = stored.amanguard_enabled !== false; // default true
    const protDot   = document.getElementById('protection-dot');
    const protText  = document.getElementById('protection-text');
    const protBadge = document.getElementById('protection-badge');
    if (isEnabled) {
      protDot.style.background = '#22c55e';
      protText.textContent = 'فعّالة | Active';
      protBadge.style.color = '#22c55e';
    } else {
      protDot.style.background = '#ef4444';
      protText.textContent = 'معطّلة | Disabled';
      protBadge.style.color = '#ef4444';
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
        const color = scan.risk_level === 'Critical' ? '#ef4444'
                    : scan.risk_level === 'High'     ? '#f97316'
                    : '#22c55e';
        const icon  = scan.risk_level === 'Critical' ? '🚫'
                    : scan.risk_level === 'High'     ? '⚠️' : '✅';
        const scanRow = document.createElement('div');
        scanRow.style.cssText = 'display:flex;align-items:center;gap:10px;';
        const iconEl = document.createElement('span');
        iconEl.style.fontSize = '20px';
        iconEl.textContent = icon;
        const info = document.createElement('div');
        const levelEl = document.createElement('div');
        levelEl.style.cssText = 'font-size:13px;font-weight:700;color:' + color + ';';
        levelEl.textContent = scan.risk_level || '—';
        const siteEl = document.createElement('div');
        siteEl.style.cssText = 'font-size:12px;color:#8090a0;margin-top:2px;';
        siteEl.textContent = scan.domain || '—';
        info.appendChild(levelEl);
        info.appendChild(siteEl);
        scanRow.appendChild(iconEl);
        scanRow.appendChild(info);
        const container = document.getElementById('last-scan-content');
        container.innerHTML = '';
        container.appendChild(scanRow);
      } catch(e) {}
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
