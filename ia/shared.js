document.addEventListener('DOMContentLoaded', () => {
  // ====== عناصر الصفحة ======
  const sidebarLogo = document.querySelector('.sidebar .brand img');
  const profileImgTop = document.querySelector('.admin-profile img');
  const profileNameTop = document.getElementById('admin-name-top');
  const profileMenuImg = document.getElementById('profile-menu-img');
  const profileMenuName = document.getElementById('menu_admin_name');
  const profileMenuEmail = document.getElementById('menu_admin_email');

  // ====== تحميل بيانات المدير ======
  const adminProfile = JSON.parse(localStorage.getItem('admin_profile') || '{}');
  if (adminProfile.name) {
    if(profileNameTop) profileNameTop.textContent = adminProfile.name;
    if(profileMenuName) profileMenuName.textContent = adminProfile.name;
  }
  if (adminProfile.email && profileMenuEmail) profileMenuEmail.textContent = adminProfile.email;

  // ====== تحميل صورة المدير ======
  const adminImg = localStorage.getItem('admin_profile_img');
  if(adminImg) {
    if(profileImgTop) profileImgTop.src = adminImg;
    if(profileMenuImg) profileMenuImg.src = adminImg;
  }

  // ====== تحميل شعار المطعم ======
  const logo = localStorage.getItem('restaurant_logo');
  if(logo && sidebarLogo) sidebarLogo.src = logo;

  // ====== تحميل الإعدادات (Theme, Font, Language) ======
  const settings = JSON.parse(localStorage.getItem('smart_restaurant_settings_v1') || '{}');

  if(settings.theme) document.documentElement.classList.toggle('dark-theme', settings.theme === 'dark');
  if(settings.fontSize) document.documentElement.style.fontSize = settings.fontSize + 'px';
  if(settings.language) {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = (settings.language === 'ar') ? 'rtl' : 'ltr';
  }

  // ====== Profile Menu Toggle ======
  const profileBtn = document.getElementById("profile-btn");
  const profileMenu = document.getElementById("profile-menu");
  if(profileBtn && profileMenu) {
    profileBtn.addEventListener('click', e => {
      e.stopPropagation();
      profileMenu.style.display = profileMenu.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => profileMenu.style.display = 'none');
  }
});
