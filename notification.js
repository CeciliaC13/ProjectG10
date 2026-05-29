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

    // ── 1. Concurrent Fetch: Grab Notifications AND Broadcasts ──
    const [notifResult, broadcastResult] = await Promise.all([
      db.from('notifications')
        .select('*')
        .eq('student_id', studentId.trim()),
      db.from('broadcasts')
        .select('*')
    ]);

    if (notifResult.error) throw notifResult.error;
    if (broadcastResult.error) throw broadcastResult.error;

    // ── 2. Standardize & Merge Both Tables ──
    const standardNotifications = (notifResult.data || []).map(n => ({
      ...n,
      isBroadcast: false
    }));

    const convertedBroadcasts = (broadcastResult.data || []).map(b => ({
      id: b.id,
      type: 'System Announcement', // Identifiable type string
      message: b.message,
      title: b.title, // Preserving broadcast specific title
      created_at: b.created_at,
      isBroadcast: true // Flag to hide individual dismiss cross controls
    }));

    // Combine and sort chronologically (Newest first)
    const combinedData = [...standardNotifications, ...convertedBroadcasts].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // ── 3. Manage The Unread Status Badge Count ──
    // Note: Broadcast entries do not carry an unread state column, so we count unread standard rows
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

    // ── 4. Render Merged Feeds ──
    listContainer.innerHTML = combinedData.map(item => {
      const isBroadcastItem = item.isBroadcast;
      
      // Separate out dynamic context text values
      let typeText = item.type || 'Alert Notice';
      let messageText = item.message || 'Update details processed.';
      
      // If it's a broadcast tracking object, inject the actual title string
      if (isBroadcastItem && item.title) {
        typeText = `Broadcast: ${item.title}`;
      }

      // Format timestamp text
      const timeStr = item.created_at 
        ? new Date(item.created_at).toLocaleDateString('en-MY', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        : 'Just now';
      
      // 🎨 Dynamic Icon Picker matched to your notification styling rules
      let icon = '📌';
      let iconColor = '#b91c1c'; // Maroon/Red alert profile default
      
      if (item.type === 'Report Status Update') {
        icon = '🛠️';
        iconColor = '#0284c7'; 
      } else if (item.type === 'Booking Status Update') {
        icon = '📅';
        iconColor = '#16a34a'; 
      } else if (isBroadcastItem) {
        icon = '📢';
        iconColor = '#6b092a'; // Distinct color matching your app theme header
      }
      
      // Render individual dismiss button asset conditionally (Hide on broadcasts)
      const actionButtonHtml = !isBroadcastItem 
        ? `<button onclick="dismissSingleNotification('${item.id}', event)" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ccc; cursor: pointer; font-size: 14px;" title="Dismiss">&times;</button>`
        : '';

      return `
        <div style="padding: 12px 15px; border-bottom: 1px solid #eee; background: ${isBroadcastItem ? '#fffafb' : '#fff'}; position: relative; border-left: 3px solid ${iconColor};">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 4px; color: ${iconColor}; font-weight: bold; font-size: 13px;">
            <span>${icon}</span> <span>${typeText}</span>
          </div>
          <p style="margin: 0; padding-right: 20px; font-size: 12px; color: #555; line-height: 1.4; white-space: normal;">${messageText}</p>
          <div style="font-size: 10px; color: #aaa; margin-top: 4px;"><i class="bi bi-clock"></i> ${timeStr}</div>
          ${actionButtonHtml}
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load global notifications:', err.message);
  }
}

// Helper to clear individual standard notifications
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

// Bulk purge execution target for standard notices (leaves global broadcasts untouched)
async function markAllNotificationsAsRead() {
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
  if (!studentId) return;
  
  try {
    if (typeof db === 'undefined') return;

    // Remove personal notifications assigned to the user
    const { error } = await db
      .from('notifications')
      .delete()
      .eq('student_id', studentId.trim());

    if (error) throw error;
    
    // Refresh the component UI view state to display remaining global announcements
    loadGlobalNotifications();

    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('show');

  } catch (err) {
    console.error('Failed processing bulk purge:', err.message);
  }
}

// Orchestrated single execution listener loop setup initialization closure
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

window.loadGlobalNotifications = loadGlobalNotifications;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.dismissSingleNotification = dismissSingleNotification;