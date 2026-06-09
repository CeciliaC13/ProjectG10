/**
* Template Name: Story
* Template URL: https://bootstrapmade.com/story-bootstrap-blog-template/
* Updated: Aug 11 2025 with Bootstrap v5.3.7
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  let notificationsData = [];
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  if (scrollTop) {
    scrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  

window.addEventListener('load', () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
    console.log("AOS successfully initialized!");
  } else {
    console.warn("AOS script library not detected on this page.");
  }
});
  

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Initiate Pure Counter
   */
  if (typeof PureCounter !== 'undefined') {
    new PureCounter();
  }

  // ==============================================
  // NOTIFICATION FUNCTIONS
  // ==============================================
  
  // Render notification dropdown
  function renderNotificationDropdown() {
    const container = document.getElementById('notificationList');
    if (!container) return;
    
    if (notificationsData.length === 0) {
      container.innerHTML = `
        <div class="notification-empty">
          <i class="bi bi-bell-slash"></i>
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notificationsData.map(notification => `
      <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
        <div class="notification-title">📌 ${notification.title}</div>
        <div class="notification-time">
          <i class="bi bi-clock"></i> ${notification.time}
        </div>
        <a href="${notification.link}" class="view-link">View full notification →</a>
      </div>
    `).join('');
  }

// 1. Pass the data when calling the function
updateNotificationBadge(notificationsData);

// 2. Accept the data as a parameter (e.g., dataArray)
function updateNotificationBadge(dataArray) {
  // Add a safety check to prevent crashing if data hasn't loaded yet
  if (!dataArray || !Array.isArray(dataArray)) {
    console.log("No notification data available yet.");
    return;
  }

  // Filter using the passed parameter instead of a global variable
  const unreadCount = dataArray.filter(n => !n.read).length;
  console.log("Unread notifications count:", unreadCount);
  
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex'; // Or 'block', depending on your CSS layout
    } else {
      badge.style.display = 'none';
    }
  }
}
 // 1. Updated Mark single notification as read
function markAsRead(notificationId) {
  const index = notificationsData.findIndex(n => n.id === notificationId);
  if (index !== -1 && !notificationsData[index].read) {
    notificationsData[index].read = true;
    localStorage.setItem('dashboard_notifications', JSON.stringify(notificationsData));
    
    // UI Updates
    renderNotificationDropdown();
    updateNotificationBadge(notificationsData); // <-- Fixed: Passed the data array here
  }
}

// 2. Updated Mark all notifications as read
function markAllAsRead() {
  notificationsData = notificationsData.map(n => ({ ...n, read: true }));
  localStorage.setItem('dashboard_notifications', JSON.stringify(notificationsData));
  
  // UI Updates
  renderNotificationDropdown();
  updateNotificationBadge(notificationsData); // <-- Fixed: Passed the data array here
}

// 3. Keep your robust badge function exactly like this
function updateNotificationBadge(dataArray) {
  // If no array is passed, fallback to global notificationsData if it exists
  const targetData = dataArray || notificationsData;
  
  if (!targetData || !Array.isArray(targetData)) {
    console.log("No notification data available yet.");
    return;
  }

  const unreadCount = targetData.filter(n => !n.read).length;
  console.log("Unread notifications count:", unreadCount);
  
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex'; 
    } else {
      badge.style.display = 'none';
    }
  }
}

  // Close dropdown when clicking outside
  function closeDropdownOnClickOutside(e) {
    const wrapper = document.querySelector('.notification-wrapper');
    const dropdown = document.getElementById('notificationDropdown');
    if (wrapper && !wrapper.contains(e.target) && dropdown && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  }

  // Initialize notification event listeners
  function initNotificationListeners() {
    const notificationBtn = document.getElementById('notificationBtn');
    const markAllBtn = document.getElementById('markAllNotifications');
    
    if (notificationBtn) {
      notificationBtn.removeEventListener('click', toggleNotificationDropdown);
      notificationBtn.addEventListener('click', toggleNotificationDropdown);
    }
    
    if (markAllBtn) {
      markAllBtn.removeEventListener('click', markAllAsRead);
      markAllBtn.addEventListener('click', function(e) {
        e.preventDefault();
        markAllAsRead();
      });
    }
    
    document.removeEventListener('click', closeDropdownOnClickOutside);
    document.addEventListener('click', closeDropdownOnClickOutside);

    // Handle clicking on notification items to mark as read
    document.removeEventListener('click', handleNotificationItemClick);
    document.addEventListener('click', handleNotificationItemClick);
  }

  function handleNotificationItemClick(e) {
    const notificationItem = e.target.closest('.notification-item');
    if (notificationItem) {
      const id = parseInt(notificationItem.dataset.id);
      markAsRead(id);
    }
  }

  // ==============================================
  // USER PROFILE MANAGEMENT
  // ==============================================
  
  const UserManager = {
    // Save user data after login/registration
    saveUserData: function(userData) {
      localStorage.setItem('currentUser', JSON.stringify(userData));
      this.updateUI(userData);
    },

    // Get current user data
    getUserData: function() {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    },

    // Update the dropdown UI with user data
    updateUI: function(userData) {
      if (!userData) return;
      
      // Get the first letter for avatar
      const initial = userData.name ? userData.name.charAt(0).toUpperCase() : 'S';
      
      // Update avatar initials
      const avatarInitial = document.getElementById('avatarInitial');
      if (avatarInitial) avatarInitial.textContent = initial;
      
      // Update user info in dropdown
      const userName = document.getElementById('dropdownUserName');
      const userRole = document.getElementById('dropdownUserRole');
      const userEmail = document.getElementById('dropdownUserEmail');
      
      if (userName) userName.textContent = userData.name || 'Student name';
      if (userRole) userRole.textContent = userData.role || 'Student';
      if (userEmail) userEmail.textContent = userData.email || 'Their email@gmail.com';
      
      // Update notification badge
      this.updateNotificationBadge();
    },

    // Update notification badge
    updateNotificationBadge: function() {
      updateNotificationBadge();
    },

    // Load user data on page load
    loadUserData: function() {
      const userData = this.getUserData();
      if (userData) {
        this.updateUI(userData);
      }
    },

    // Logout function
    logout: function() {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('studentEmail');
      localStorage.removeItem('studentId');
      localStorage.removeItem('studentName');
      window.location.href = '../Student/logout.html';
    }
  };

  // Auto-sync header dropdown with Supabase
  async function loadHeaderProfile() {
    const studentEmail = localStorage.getItem('studentEmail');
    const staffEmail = localStorage.getItem('staffEmail');      
    const adminEmail = localStorage.getItem('adminEmail');      

    const email = studentEmail || staffEmail || adminEmail;
    if (!email) return;

    const nameEl = document.getElementById('dropdownUserName');
    const emailEl = document.getElementById('dropdownUserEmail');
    const avatarEl = document.getElementById('avatarInitial');
    const roleEl = document.getElementById('dropdownUserRole');
    if (!nameEl || !emailEl || !avatarEl) return;

    if (typeof db !== 'undefined' && db) {
      if (studentEmail) {
        // Student page
        const { data, error } = await db
          .from('Student')
          .select('name, email')
          .eq('email', studentEmail)
          .single();

        if (!error && data) {
          const initial = data.name ? data.name.charAt(0).toUpperCase() : 'S';
          avatarEl.textContent = initial;
          nameEl.textContent = data.name;
          emailEl.textContent = data.email;
          if (roleEl) roleEl.textContent = 'Student';
        }

      } else if (staffEmail || adminEmail) {
        // Admin or Staff page
        const { data, error } = await db
          .from('Staff')
          .select('name, email, role')
          .eq('email', email)
          .single();

        if (!error && data) {
          const initial = data.name ? data.name.charAt(0).toUpperCase() : 'A';
          avatarEl.textContent = initial;
          nameEl.textContent = data.name;
          emailEl.textContent = data.email;
          if (roleEl) roleEl.textContent = data.role || 'Staff';
        }
      }
    }
  }

  // Initialize everything when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Load user data
    if (!window.__skipUserManager) {        // <-- add this check
    UserManager.loadUserData();
    loadHeaderProfile();
  }
    
    // Load notifications
    loadNotificationData();
    
    // Initialize notification event listeners
    initNotificationListeners();
    
    // Set up logout button handler (multiple possible IDs)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        UserManager.logout();
      });
    }
    
    // Also handle any other logout buttons
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        UserManager.logout();
      });
    });
  });

  //  RIGHT: Added "async" here
  async function loadNotificationData() {
    
    const { data, error } = await db.from('notifications').select('*');
    
    if (!error && data) {
        notificationsData = data;
        updateNotificationBadge();
    }
}
  // =========================================================================
  // EXPOSE FUNCTIONS TO THE GLOBAL WINDOW SCOPE (ADD THIS BEFORE THE IIFE ENDS)
  // =========================================================================
  window.loadGlobalNotifications = loadNotificationData; 
  window.markAllNotificationsAsRead = markAllAsRead;
  window.dismissSingleNotification = markAsRead; 

})(); 