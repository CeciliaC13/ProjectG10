/**
* Template Name: Story
* Template URL: https://bootstrapmade.com/story-bootstrap-blog-template/
* Updated: Aug 11 2025 with Bootstrap v5.3.7
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
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
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

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
  // USER PROFILE MANAGEMENT (ADDED)
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
      const dropdownAvatarInitial = document.getElementById('dropdownAvatarInitial');
      if (avatarInitial) avatarInitial.textContent = initial;
      if (dropdownAvatarInitial) dropdownAvatarInitial.textContent = initial;
      
      // Update user info in dropdown
      const userName = document.getElementById('dropdownUserName');
      const userRole = document.getElementById('dropdownUserRole');
      const userEmail = document.getElementById('dropdownUserEmail');
      
      if (userName) userName.textContent = userData.name || 'Student name';
      if (userRole) userRole.textContent = userData.role || 'Student';
      if (userEmail) userEmail.textContent = userData.email || 'Their email@gmail.com';
      
      // Update notification badge if user has unread notifications
      this.updateNotificationBadge();
    },

    // Update notification badge (example - you can expand this)
    updateNotificationBadge: function() {
      const notificationBadge = document.getElementById('notificationCount');
      if (notificationBadge) {
        // Get unread notifications from localStorage or set default
        let unreadCount = localStorage.getItem('unreadNotifications');
        if (unreadCount === null) {
          unreadCount = '3';
        }
        notificationBadge.textContent = unreadCount;
        
        if (unreadCount === '0' || unreadCount === 0) {
          notificationBadge.style.display = 'none';
        } else {
          notificationBadge.style.display = 'flex';
        }
      }
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
      window.location.href = 'login.html';
    }
  };

  // Initialize user data when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    UserManager.loadUserData();
    
    // Set up logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        UserManager.logout();
      });
    }
  });

})(); // End of main IIFE