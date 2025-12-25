/* setting.js - مصحح ومبسط */
const STORAGE_KEY = 'smart_restaurant_settings_v1';

const defaults = {
  language: 'ar',
  theme: 'light',
  fontSize: 16,
  notifications: true
};

function $(id){ return document.getElementById(id); }

/* --------- Storage helpers --------- */
function loadSettings(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : Object.assign({}, defaults);
}

function saveSettings(conf){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conf));
}

/* --------- Apply helpers --------- */
function applyAll(conf){
  applyTheme(conf.theme);
  applyLanguage(conf.language);
  applyFontSize(conf.fontSize);
  // تحديث عناصر التحكم (select / range) لتعكس الإعدادات
  if ($('lang')) $('lang').value = conf.language;
  if ($('theme')) $('theme').value = conf.theme;
  if ($('font-size')) $('font-size').value = conf.fontSize;
}

function applyTheme(t){
  if(t === 'dark'){
    document.documentElement.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
  }
}

function applyLanguage(lang){
  if(lang === 'ar'){
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.lang = lang;
    document.documentElement.dir = 'ltr';
  }

  applyTranslations(lang);
}

function applyFontSize(px){
  document.documentElement.style.fontSize = px + 'px';
}

/* --------- Translations: يدعم data-i18n و placeholder و id keys fallback --------- */
function applyTranslations(lang){
  const dict = translations[lang];
  if (!dict) return;

  // 1) عناصر لها data-i18n  -> نضع النص داخل العنصر
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && key in dict) el.textContent = dict[key];
  });

  // 2) placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && key in dict) el.setAttribute('placeholder', dict[key]);
  });

  // 3) title attribute
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key && key in dict) el.setAttribute('title', dict[key]);
  });

  // 4) alt attribute
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const key = el.getAttribute('data-i18n-alt');
    if (key && key in dict) el.setAttribute('alt', dict[key]);
  });

  // 5) value (inputs/buttons)
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    const key = el.getAttribute('data-i18n-value');
    if (key && key in dict) el.value = dict[key];
  });

  // 6) <title data-i18n="...">
  const titleEl = document.querySelector('head title[data-i18n]');
  if (titleEl) {
    const k = titleEl.getAttribute('data-i18n');
    if (k && k in dict) document.title = dict[k];
  }

  // 7) FALLBACK: العناصر التي تعتمد على id matching keys في ملف الترجمة
  // هذا يضمن ترجمة عناصر مثل <h2 id="title_settings"> وغيرها
  Object.keys(dict).forEach(key => {
    const elById = document.getElementById(key);
    if (elById) {
      // اذا كان عنصر ادخال input/textarea -> نغير placeholder أو value حسب النوع
      if (elById.tagName === 'INPUT' || elById.tagName === 'TEXTAREA') {
        // لو له placeholder مسبقاً نحط الترجمة كـ placeholder، وإلا كقيمة
        if (elById.hasAttribute('placeholder')) {
          elById.setAttribute('placeholder', dict[key]);
        } else {
          elById.value = dict[key];
        }
      } else {
        elById.textContent = dict[key];
      }
    }
  });
}

/* --------- Admin profile (existing functions) --------- */
function saveAdminProfile() {
  const profile = {
    name: $('admin_name')?.value || "",
    email: $('admin_email')?.value || "",
    phone: $('admin_phone')?.value || ""
  };
  localStorage.setItem("admin_profile", JSON.stringify(profile));
}

function loadAdminProfile() {
  const raw = localStorage.getItem("admin_profile");
  if (!raw) return;

  const p = JSON.parse(raw);

  if ($('admin_name')) $('admin_name').value = p.name;
  if ($('admin_email')) $('admin_email').value = p.email;
  if ($('admin_phone')) $('admin_phone').value = p.phone;

  if ($('admin_name')) {
    const name = p.name || "Admin";
    const nameTop = document.getElementById('admin-name-top');
    const nameMenu = document.getElementById('menu_admin_name');
    if(nameTop) nameTop.textContent = name;
    if(nameMenu) nameMenu.textContent = name;
  }
  if ($('admin_email')) {
    const emailMenu = document.getElementById('menu_admin_email');
    if(emailMenu) emailMenu.textContent = p.email || "admin@mail.com";
  }
}

/* --------- Single DOMContentLoaded handler --------- */
document.addEventListener('DOMContentLoaded', () => {
  // Load + apply settings
  const conf = loadSettings();
  applyAll(conf);

  // Load admin profile
  loadAdminProfile();

  // Bind events (lang / theme / font-size)
  const langSelect = $('lang');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      const newLang = e.target.value;
      conf.language = newLang;          // تعديل الإعداد الحالي
      saveSettings(conf);               // حفظه في نفس KEY
      applyLanguage(newLang);           // تطبيق فوري
    });
  }

  const themeSelect = $('theme');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      conf.theme = e.target.value;
      saveSettings(conf);
      applyTheme(conf.theme);
    });
  }

  const fontRange = $('font-size');
  if (fontRange) {
    fontRange.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      conf.fontSize = v;
      saveSettings(conf);
      applyFontSize(v);
    });
  }

  // admin profile live preview & save
  ['admin_name','admin_email','admin_phone'].forEach(id=>{
    const el = $(id);
    if (el) el.addEventListener('input', saveAdminProfile);
  });

  // profile menu toggle
  const profileBtn = document.getElementById("profile-btn");
  const profileMenu = document.getElementById("profile-menu");
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.style.display =
        profileMenu.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", () => {
      profileMenu.style.display = "none";
    });
  }
// restaurant logo handling
const logoInput = document.getElementById('restaurant_logo');
const logoPreview = document.getElementById('logo_preview');

// تحميل الشعار الحالي من localStorage
const savedLogo = localStorage.getItem('restaurant_logo');
if(savedLogo){
  if(logoPreview) logoPreview.src = savedLogo;
  const sidebarLogo = document.querySelector('.sidebar .brand img');
  if(sidebarLogo) sidebarLogo.src = savedLogo;
}

// عند تغيير الشعار
if(logoInput){
  logoInput.addEventListener('change', function(e){
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(ev){
      const src = ev.target.result;            // صورة Base64
      localStorage.setItem('restaurant_logo', src); // حفظها
      if(logoPreview) logoPreview.src = src;        // تحديث المعاينة
      const sidebarLogo = document.querySelector('.sidebar .brand img');
      if(sidebarLogo) sidebarLogo.src = src;       // تحديث الشعار في الـ sidebar
    };
    reader.readAsDataURL(file);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  const savedLogo = localStorage.getItem('restaurant_logo');
  if(savedLogo){
    const sidebarLogo = document.querySelector('.sidebar .brand img');
    if(sidebarLogo) sidebarLogo.src = savedLogo;
  }
});

  // restaurant logo handling (if present)
  const systemSettingsSection = document.querySelector('.settings-section');
  if (systemSettingsSection) {
    const logoInput = document.getElementById('restaurant_logo');
    const logoPreview = document.getElementById('logo_preview');
    const savedLogo = localStorage.getItem('restaurant_logo');
    if (savedLogo && document.querySelector('.sidebar .brand img')) {
      document.querySelector('.sidebar .brand img').src = savedLogo;
    }
    if (logoInput) {
      logoInput.addEventListener('change', function(e){
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = function(ev){
          const src = ev.target.result;
          localStorage.setItem('restaurant_logo', src);
          if (logoPreview) logoPreview.src = src;
          const sidebarLogo = document.querySelector('.sidebar .brand img');
          if (sidebarLogo) sidebarLogo.src = src;
        };
        reader.readAsDataURL(file);
      });
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Load admin profile
  const rawProfile = localStorage.getItem("admin_profile");
  if(rawProfile){
    const profile = JSON.parse(rawProfile);
    const nameTop = document.getElementById('admin-name-top');
    const nameMenu = document.getElementById('menu_admin_name');
    const emailMenu = document.getElementById('menu_admin_email');

    if(nameTop) nameTop.textContent = profile.name || "Admin";
    if(nameMenu) nameMenu.textContent = profile.name || "Admin";
    if(emailMenu) emailMenu.textContent = profile.email || "admin@mail.com";
  }

  // Load restaurant logo
  const savedLogo = localStorage.getItem('restaurant_logo');
  if(savedLogo){
    const sidebarLogo = document.querySelector('.sidebar .brand img');
    const logoPreview = document.getElementById('logo_preview');
    if(sidebarLogo) sidebarLogo.src = savedLogo;
    if(logoPreview) logoPreview.src = savedLogo;
  }
});

window.addEventListener('storage', (e) => {
  if(e.key === "admin_profile"){
    const profile = JSON.parse(e.newValue);
    const nameTop = document.getElementById('admin-name-top');
    const nameMenu = document.getElementById('menu_admin_name');
    const emailMenu = document.getElementById('menu_admin_email');

    if(nameTop) nameTop.textContent = profile.name || "Admin";
    if(nameMenu) nameMenu.textContent = profile.name || "Admin";
    if(emailMenu) emailMenu.textContent = profile.email || "admin@mail.com";
  }

  if(e.key === "restaurant_logo"){
    const sidebarLogo = document.querySelector('.sidebar .brand img');
    const logoPreview = document.getElementById('logo_preview');
    if(sidebarLogo) sidebarLogo.src = e.newValue;
    if(logoPreview) logoPreview.src = e.newValue;
  }
});
// --------- Admin profile image handling ----------
const adminImgInput = document.getElementById('admin_img');
const adminImgPreview = document.getElementById('profile-menu-img'); // المعاينة في القائمة
const adminImgTop = document.querySelector('.admin-profile img');   // الصورة في الـ header

// تحميل الصورة الحالية من localStorage
const savedAdminImg = localStorage.getItem('admin_profile_img');
if(savedAdminImg){
  if(adminImgPreview) adminImgPreview.src = savedAdminImg;
  if(adminImgTop) adminImgTop.src = savedAdminImg;
}

// عند تغيير الصورة
if(adminImgInput){
  adminImgInput.addEventListener('change', function(e){
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(ev){
      const src = ev.target.result;               // Base64 image
      localStorage.setItem('admin_profile_img', src); // حفظ الصورة
      if(adminImgPreview) adminImgPreview.src = src;  // تحديث المعاينة
      if(adminImgTop) adminImgTop.src = src;          // تحديث الصورة في الـ header
    };
    reader.readAsDataURL(file);
  });
}

// --------- الاستماع لتغييرات localStorage لمزامنة الصورة بين الصفحات ----------
window.addEventListener('storage', (e) => {
  if(e.key === "admin_profile_img"){
    const src = e.newValue;
    if(adminImgPreview) adminImgPreview.src = src;
    if(adminImgTop) adminImgTop.src = src;
  }
});

