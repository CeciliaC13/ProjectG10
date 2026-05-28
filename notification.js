async function loadGlobalNotifications() {
  const badge = document.getElementById('notificationBadge');
  const listContainer = document.getElementById('notificationList');
  
  // 🔍 DEBUG 1: Check what keys exist in LocalStorage
  const id1 = localStorage.getItem('studentId');
  const id2 = localStorage.getItem('currentStudentId');
  console.log("DEBUG: LocalStorage values found -> studentId:", id1, "| currentStudentId:", id2);

  const studentId = id1 || id2; 

  if (!studentId) {
    console.warn("⚠️ DEBUG: No student ID found in LocalStorage. Stopping function.");
    if (badge) badge.style.display = 'none';
    return;
  }

  try {
    if (typeof db === 'undefined') {
      console.error("❌ DEBUG: 'db' is undefined inside the function.");
      return;
    }

    console.log(`📡 DEBUG: Sending query to Supabase for student_id: '${studentId.trim()}'`);

    // Fetch from database
    const { data: notifications, error } = await db
      .from('notifications')
      .select('*')
      .eq('student_id', studentId.trim())
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ DEBUG: Supabase Database Error:", error);
      throw error;
    }

    // 🔍 DEBUG 2: What did the database actually give us back?
    console.log("📥 DEBUG: Raw data received from Supabase:", notifications);

    const count = notifications ? notifications.length : 0;
    console.log(`📊 DEBUG: Total notifications count is: ${count}`);

    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    if (!listContainer) {
      console.error("❌ DEBUG: HTML Element with id='notificationList' was NOT found in your HTML!");
      return;
    }
    
    if (!notifications || notifications.length === 0) {
      listContainer.innerHTML = `<div style="padding: 15px; text-align: center; color: #888; font-size: 13px;">No notifications found.</div>`;
      return;
    }

    listContainer.innerHTML = notifications.map(notif => {
      const typeText = notif.type || 'Alert Notice';
      const messageText = notif.message || 'Update details processed.';
      
      return `
        <div style="padding: 12px 15px; border-bottom: 1px solid #eee; background: #fff;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 4px; color: #b91c1c; font-weight: bold; font-size: 13px;">
            <span>📌</span> <span>${typeText}</span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #555; line-height: 1.4; white-space: normal;">${messageText}</p>
        </div>
      `;
    }).join('');

    console.log("✅ DEBUG: HTML injected successfully into listContainer.");

  } catch (err) {
    console.error('❌ DEBUG: Catch Block Caught Error:', err.message);
  }
}

async function markAllNotificationsAsRead() {
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
  if (!studentId) return;
  
  try {
    if (typeof db === 'undefined') return;

    // 1. Clear Supabase
    const { error } = await db
      .from('notifications')
      .delete()
      .eq('student_id', studentId.trim());

    if (error) throw error;
    
    // 2. Clear custom HTML UI containers immediately
    const listContainer = document.getElementById('notificationList');
    if (listContainer) {
      listContainer.innerHTML = `<div style="padding: 15px; text-align: center; color: #888; font-size: 13px;">No notifications found.</div>`;
    }

    const badge = document.getElementById('notificationBadge');
    if (badge) {
      badge.textContent = '0';
      badge.style.display = 'none';
    }

    // 3. Close the dropdown smoothly after clearing
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('show');

  } catch (err) {
    console.error('Failed processing bulk purge:', err.message);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('notificationBtn');
  const dropdown = document.getElementById('notificationDropdown');

  if (btn && dropdown) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.classList.remove('show');
      }
    });
  }

  // 🛡️ BETTER INITIALIZATION: Check for db and log issues immediately
  if (typeof db === 'undefined') {
    console.error("❌ Notification Error: 'db' client is not defined! Check your Supabase script tags.");
  } else {
    console.log("🔄 'db' detected. Attempting to load notifications...");
    loadGlobalNotifications(); // Call it immediately once DOM is ready
  }
});

(function initializeNotificationSystem() {
  console.log("⚡ Notification system UI binding initialized.");

  const setupUI = () => {
    const btn = document.getElementById('notificationBtn');
    const dropdown = document.getElementById('notificationDropdown');

    if (!btn || !dropdown) return false;

    // Clone button to strip away breaking overlapping listeners from main.js
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    // Toggle dropdown UI visibility
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle('show');
      console.log("🎯 Bell clicked. Current classes:", dropdown.className);
    });

    // Close dropdown automatically if user clicks anywhere else on the dashboard
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== newBtn) {
        dropdown.classList.remove('show');
      }
    });

    return true;
  };

  // Run routine check until database structure and elements match up
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

// Expose setups globally
window.loadGlobalNotifications = loadGlobalNotifications;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;

if (typeof db !== 'undefined') {
  setTimeout(loadGlobalNotifications, 500);
}