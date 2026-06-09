// ── STUDENT NOTIFICATIONS ENGINE (WITH LOCAL EXCLUSION FOR DISMISSED BROADCASTS) ──

async function loadGlobalNotifications() {
  const badge = document.getElementById('notificationBadge');
  const listContainer = document.getElementById('notificationList');
  
  const id1 = localStorage.getItem('studentId');
  const id2 = localStorage.getItem('currentStudentId');
  const studentId = id1 || id2; 

  if (!studentId) {
    if (badge) badge.style.display = 'none';
    return;
  }

  try {
    if (typeof db === 'undefined') return;

    // ── 1. Concurrent Fetch: Grab Personal Notifications AND Global Broadcasts ──
    const [notifResult, broadcastResult] = await Promise.all([
      db.from('notifications')
        .select('*')
        .eq('student_id', studentId.trim()),
      db.from('broadcasts')
        .select('*')
    ]);

    if (notifResult.error) throw notifResult.error;
    if (broadcastResult.error) throw broadcastResult.error;

    // ── 2. Filter Broadcasts Locally Using Student's Unique Dismiss Cache ──
    const dismissedKey = `dismissed_broadcasts_${studentId.trim()}`;
    const dismissedIds = JSON.parse(localStorage.getItem(dismissedKey)) || [];
    
    // Keep only broadcasts that this specific student hasn't hidden
    const activeBroadcasts = (broadcastResult.data || []).filter(b => !dismissedIds.includes(String(b.id)));

    // ── 3. Standardize & Merge Both Tables ──
    const standardNotifications = (notifResult.data || []).map(n => ({
      ...n,
      isBroadcast: false
    }));

    const convertedBroadcasts = activeBroadcasts.map(b => ({
      id: b.id,
      type: 'System Announcement',
      message: b.message,
      title: b.title,
      created_at: b.created_at,
      isBroadcast: true 
    }));

    // Combine and sort chronologically (Newest first)
    const combinedData = [...standardNotifications, ...convertedBroadcasts].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // ── 4. Manage The Unread Status Badge Count ──
    const unreadCount = standardNotifications.filter(n => !n.read).length;
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }

    if (!listContainer) return;
    
    if (combinedData.length === 0) {
      listContainer.innerHTML = `<div style="padding: 15px; text-align: center; color: #888; font-size: 13px;">No notifications found.</div>`;
      return;
    }

    // ── 5. Render Merged Feeds ──
    listContainer.innerHTML = combinedData.map(item => {
      const isBroadcastItem = item.isBroadcast;
      
      let typeText = item.type || 'Alert Notice';
      let messageText = item.message || 'Update details processed.';
      
      if (isBroadcastItem && item.title) {
        typeText = `Broadcast: ${item.title}`;
      }

      const timeStr = item.created_at 
        ? new Date(item.created_at).toLocaleDateString('en-MY', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        : 'Just now';
      
      let icon = '📌';
      let iconColor = '#b91c1c';
      
      if (item.type === 'Report Status Update') {
        icon = '🛠️';
        iconColor = '#0284c7'; 
      } else if (item.type === 'Booking Status Update') {
        icon = '📅';
        iconColor = '#16a34a'; 
      } else if (isBroadcastItem) {
        icon = '📢';
        iconColor = '#6b092a'; 
      }
      
      // Route the click event conditionally: Database delete for alerts, Local storage hide for broadcasts
      const clickAction = isBroadcastItem 
        ? `dismissSingleBroadcast('${item.id}', event)`
        : `dismissSingleNotification('${item.id}', event)`;

      return `
        <div style="padding: 12px 15px; border-bottom: 1px solid #eee; background: ${isBroadcastItem ? '#fffafb' : '#fff'}; position: relative; border-left: 3px solid ${iconColor};">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 4px; color: ${iconColor}; font-weight: bold; font-size: 13px;">
            <span>${icon}</span> <span>${typeText}</span>
          </div>
          <p style="margin: 0; padding-right: 20px; font-size: 12px; color: #555; line-height: 1.4; white-space: normal;">${messageText}</p>
          <div style="font-size: 10px; color: #aaa; margin-top: 4px;"><i class="bi bi-clock"></i> ${timeStr}</div>
          <button onclick="${clickAction}" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ccc; cursor: pointer; font-size: 14px;" title="Dismiss">&times;</button>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load global notifications:', err.message);
  }
}

// ── NEW FEATURE: DISMISS A SINGLE BROADCAST INDIVIDUALLY FOR THIS STUDENT ──
function dismissSingleBroadcast(broadcastId, event) {
  if (event) event.stopPropagation();
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
  if (!studentId) return;

  const dismissedKey = `dismissed_broadcasts_${studentId.trim()}`;
  let dismissedIds = JSON.parse(localStorage.getItem(dismissedKey)) || [];
  
  if (!dismissedIds.includes(String(broadcastId))) {
    dismissedIds.push(String(broadcastId));
    localStorage.setItem(dismissedKey, JSON.stringify(dismissedIds));
  }

  loadGlobalNotifications(); // Instantly update view
}

// Helper to clear individual standard notifications from database
async function dismissSingleNotification(notifId, event) {
  if (event) event.stopPropagation();
  try {
    if (typeof db === 'undefined') return;

    const { error } = await db
      .from('notifications')
      .delete()
      .eq('id', notifId);

    if (error) throw error;
    
    loadGlobalNotifications();
  } catch (err) {
    console.error('Failed clearing notification item:', err.message);
  }
}

// ── FIXED: MARK ALL AS READ CLEARS ALERTS FROM DB AND HIDES BROADCASTS LOCALLY ──
async function markAllNotificationsAsRead() {
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
  if (!studentId) return;
  
  try {
    if (typeof db === 'undefined') return;

    // 1. Delete personal notifications assigned to the user from Supabase
    const { error } = await db
      .from('notifications')
      .delete()
      .eq('student_id', studentId.trim());

    if (error) throw error;
    
    // 2. Fetch all current broadcast IDs from the database to save them as hidden
    const { data: currentBroadcasts } = await db.from('broadcasts').select('id');
    if (currentBroadcasts) {
      const dismissedKey = `dismissed_broadcasts_${studentId.trim()}`;
      const allBroadcastIds = currentBroadcasts.map(b => String(b.id));
      localStorage.setItem(dismissedKey, JSON.stringify(allBroadcastIds));
    }

    // Refresh UI smoothly
    loadGlobalNotifications();

    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('show');

  } catch (err) {
    console.error('Failed processing bulk purge:', err.message);
  }
}

(function initializeNotificationSystem() {
  const setupUI = () => {
    const btn = document.getElementById('notificationBtn');
    const dropdown = document.getElementById('notificationDropdown');

    if (!btn || !dropdown) return false;

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== newBtn) {
        dropdown.classList.remove('show');
      }
    });

    return true;
  };

  let attempts = 0;
  const checkRegistry = setInterval(() => {
    attempts++;
    const isUiReady = setupUI();
    const isDbReady = (typeof db !== 'undefined');

    if (isDbReady && isUiReady) {
      clearInterval(checkRegistry);
      loadGlobalNotifications();
    } 
    if (attempts > 30) clearInterval(checkRegistry);
  }, 200);
})();


// ── ADMINISTRATIVE BROADCAST OPERATIONS (UNCHANGED & SCOPED TO ADMIN VIEW) ──

let broadcastItemsData = [];

function formatBroadcastTime(isoString) {
  if (!isoString) return "Just now";
  const date = new Date(isoString);
  return date.toLocaleDateString('en-MY', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderBroadcasts() {
  const list = document.getElementById('broadcastList');
  if (!list) return;

  if (broadcastItemsData.length === 0) {
    list.innerHTML = `
      <div class="notification-empty" style="text-align: center; padding: 30px; color: #94a3b8;">
        <i class="bi bi-bell-slash" style="font-size: 28px;"></i>
        <p style="margin-top: 8px; font-size: 13px;">No broadcast history found.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = broadcastItemsData.map(function(item) {
    const timeStr = formatBroadcastTime(item.created_at);
    const typeText = `Broadcast: ${item.title || 'Announcement'}`;
    const iconColor = '#6b092a';

    return `
      <div class="notification-item read" 
           data-id="${item.id}" 
           style="padding: 12px 15px; border-bottom: 1px solid #eee; background: #fffafb; position: relative; border-left: 3px solid ${iconColor}; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.01); text-align: left;">
        
        <div class="broadcast-actions" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 6px;">
          <button class="btn-delete" 
                  title="Delete Broadcast" 
                  onclick="confirmDeleteBroadcast('${item.id}', this)"
                  style="background: transparent; color: #94a3b8; border: none; cursor: pointer; padding: 4px 8px; border-radius: 6px; font-size: 14px; transition: all 0.2s ease;">
            <i class="bi bi-trash"></i>
          </button>
        </div>

        <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 4px; color: ${iconColor}; font-weight: bold; font-size: 13px;">
          <span>📢</span> <span>${typeText}</span>
        </div>
        <p style="margin: 0; padding-right: 35px; font-size: 12px; color: #555; line-height: 1.4; white-space: normal;">${item.message || ''}</p>
        <div style="font-size: 10px; color: #aaa; margin-top: 4px; display: inline-flex; align-items: center; gap: 4px;">
          <i class="bi bi-clock"></i> ${timeStr}
        </div>
      </div>
    `;
  }).join('');
}

async function fetchAdminBroadcastsOnly() {
  if (typeof db === 'undefined' || !db) return;

  try {
    const { data, error } = await db
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    broadcastItemsData = data || [];
    renderBroadcasts();
  } catch (err) {
    console.error('Failed fetching broadcasts from Supabase:', err.message);
  }
}

async function sendBroadcast() {
  const title = document.getElementById('broadcastTitle').value.trim();
  const message = document.getElementById('broadcastMessage').value.trim();
  const btn = document.getElementById('sendBroadcastBtn');

  if (!title || !message) {
    alert('Please fill in both the title and message fields.');
    return;
  }

  if (typeof db === 'undefined' || !db) {
    alert('Database connection error. Please try again later.');
    return;
  }

  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Sending...';

  try {
    const { error } = await db
      .from('broadcasts')
      .insert([{ title, message }]);

    if (error) throw error;

    document.getElementById('broadcastTitle').value = '';
    document.getElementById('broadcastMessage').value = '';
    
    await fetchAdminBroadcastsOnly();

    const successBox = document.getElementById('successBox');
    if (successBox) {
      successBox.style.display = 'block';
      setTimeout(function() { successBox.style.display = 'none'; }, 2500);
    }

  } catch (err) {
    alert('Broadcast transmission failed: ' + err.message);
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

function confirmDeleteBroadcast(broadcastId, btn) {
  btn.style.display = 'none';
  
  const wrap = document.createElement('div');
  wrap.style.cssText = "display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: #fdf2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 11px;";
  wrap.innerHTML = `
    <span style="color: #dc2626; font-weight: 600;">Delete?</span>
    <button style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 600; cursor: pointer;" onclick="executeDeleteBroadcast('${broadcastId}', this)">Yes</button>
    <button style="background: #e2e8f0; color: #1e293b; border: none; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 600; cursor: pointer;" onclick="renderBroadcasts()">No</button>
  `;
  btn.parentNode.appendChild(wrap);
}

async function executeDeleteBroadcast(broadcastId, btn) {
  if (typeof db === 'undefined' || !db) return;
  btn.disabled = true;

  try {
    const { error } = await db
      .from('broadcasts')
      .delete()
      .eq('id', broadcastId);

    if (error) throw error;

    await fetchAdminBroadcastsOnly();
  } catch (err) {
    alert('Deletion execution failed: ' + err.message);
    renderBroadcasts();
  }
}

(function initBroadcastHistorySystem() {
  let checkAttempts = 0;
  const registryCheck = setInterval(() => {
    checkAttempts++;
    const isDbReady = (typeof db !== 'undefined');
    const isUiReady = document.getElementById('broadcastList') !== null;

    if (isDbReady && isUiReady) {
      clearInterval(registryCheck);
      fetchAdminBroadcastsOnly();
    }
    if (checkAttempts > 30) clearInterval(registryCheck);
  }, 200);
})();

// ── GLOBAL REGISTRY MAPPING ──
window.loadGlobalNotifications = loadGlobalNotifications;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.dismissSingleNotification = dismissSingleNotification;
window.dismissSingleBroadcast = dismissSingleBroadcast;