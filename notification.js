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

    const { data: notifications, error } = await db
      .from('notifications')
      .select('*')
      .eq('student_id', studentId.trim())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const count = notifications ? notifications.length : 0;
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    if (!listContainer) return;
    
    if (!notifications || notifications.length === 0) {
      listContainer.innerHTML = `<div style="padding: 15px; text-align: center; color: #888; font-size: 13px;">No notifications found.</div>`;
      return;
    }

    listContainer.innerHTML = notifications.map(notif => {
      const typeText = notif.type || 'Alert Notice';
      const messageText = notif.message || 'Update details processed.';
      
      // 🎨 Dynamic Icon Picker based on notification types
      let icon = '📌';
      let iconColor = '#b91c1c'; // Red for general alerts
      
      if (typeText === 'Report Status Update') {
        icon = '🛠️';
        iconColor = '#0284c7'; // Blue for issues/maintenance
      } else if (typeText === 'Booking Status Update') {
        icon = '📅';
        iconColor = '#16a34a'; // Green for bookings
      }
      
      return `
        <div style="padding: 12px 15px; border-bottom: 1px solid #eee; background: #fff; position: relative;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 4px; color: ${iconColor}; font-weight: bold; font-size: 13px;">
            <span>${icon}</span> <span>${typeText}</span>
          </div>
          <p style="margin: 0; padding-right: 20px; font-size: 12px; color: #555; line-height: 1.4; white-space: normal;">${messageText}</p>
          
          <button onclick="dismissSingleNotification('${notif.id}', event)" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ccc; cursor: pointer; font-size: 14px;">&times;</button>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load global notifications:', err.message);
  }
}

// 💥 New helper feature to clear individual notifications
async function dismissSingleNotification(notifId, event) {
  if (event) event.stopPropagation();
  try {
    if (typeof db === 'undefined') return;

    const { error } = await db
      .from('notifications')
      .delete()
      .eq('id', notifId);

    if (error) throw error;
    
    // Reload state seamlessly
    loadGlobalNotifications();
  } catch (err) {
    console.error('Failed clearing notification item:', err.message);
  }
}

async function markAllNotificationsAsRead() {
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
  if (!studentId) return;
  
  try {
    if (typeof db === 'undefined') return;

    const { error } = await db
      .from('notifications')
      .delete()
      .eq('student_id', studentId.trim());

    if (error) throw error;
    
    const listContainer = document.getElementById('notificationList');
    if (listContainer) {
      listContainer.innerHTML = `<div style="padding: 15px; text-align: center; color: #888; font-size: 13px;">No notifications found.</div>`;
    }

    const badge = document.getElementById('notificationBadge');
    if (badge) {
      badge.textContent = '0';
      badge.style.display = 'none';
    }

    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('show');

  } catch (err) {
    console.error('Failed processing bulk purge:', err.message);
  }
}

// Single initialization orchestration loop wrapper
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