/* ============================================================
   BharatFlow — script.js v2
   Shared logic: Theme toggle, Bilingual i18n, Auth modal,
   Toasts, Password strength, Navbar scroll effect
   ============================================================ */

'use strict';

// ══════════════════════════════════════════
// TRANSLATIONS  (EN / HI)
// ══════════════════════════════════════════
const i18n = {
  en: {
    // Navbar
    'nav.features':   'Features',
    'nav.how':        'How It Works',
    'nav.reviews':    'Reviews',
    'nav.signin':     'Sign In',
    'nav.getstarted': 'Get Started Free',

    // Hero
    'hero.badge':    'Trusted by 2,000+ professionals across India',
    'hero.title1':   'Your Inbox,',
    'hero.title2':   'Intelligently Filtered',
    'hero.title3':   'Delivered to WhatsApp',
    'hero.subtitle': 'BharatFlow uses AI to cut through the noise — filtering emails, job alerts, and notifications to surface only what truly matters, delivered instantly on WhatsApp.',
    'hero.cta1':     'Start for Free',
    'hero.cta2':     'See How It Works',
    'hero.stat1':    'Noise Reduced',
    'hero.stat2':    'Delivery Time',
    'hero.stat3':    'Powered Filters',

    // Preview card
    'preview.title':  'Live Feed',
    'preview.live':   'Live',
    'preview.blocked':'Auto-blocked',
    'preview.wa':     'Delivering via WhatsApp',
    'preview.today':  'sent today',

    // Tags
    'tag.sent':     'Sent',
    'tag.filtered': 'Filtered',
    'tag.queued':   'Queued',

    // Features section
    'features.eyebrow': 'Why BharatFlow',
    'features.title1':  'Built for the',
    'features.title2':  'Smart Professional',
    'features.subtitle':'Everything you need to reclaim your focus and stay on top of what matters.',
    'feat1.title': 'AI-Powered Filtering',
    'feat1.desc':  'Our model learns your preferences to surface only genuinely relevant notifications, automatically improving over time.',
    'feat2.title': 'WhatsApp Delivery',
    'feat2.desc':  'Filtered results land directly in your WhatsApp — no extra app needed. Uses Meta Cloud API for speed and reliability.',
    'feat3.title': 'Gmail Integration',
    'feat3.desc':  'Connect your Gmail in one click via OAuth2. We read, classify and filter in real-time — fully secure, read-only access.',
    'feat4.title': 'Smart Dashboard',
    'feat4.desc':  'View active filters, delivery stats, and keyword performance. Manage everything from a clean, unified interface.',
    'feat5.title': 'Multi-Source Tracking',
    'feat5.desc':  'Monitor job boards, GitHub, LinkedIn, news feeds, and custom domains — all scored by your personal relevance model.',
    'feat6.title': 'Privacy First',
    'feat6.desc':  'Your data stays yours. We never sell email content. All processing is server-side with full encryption.',

    // How it works
    'how.eyebrow':  'Process',
    'how.title':    'How BharatFlow Works',
    'how.subtitle': 'Three steps. Zero noise. Instant WhatsApp delivery.',
    'step1.title':  'Connect Your Sources',
    'step1.desc':   'Link your Gmail and specify domains to monitor. Setup takes under 2 minutes.',
    'step2.title':  'Set Your Filters',
    'step2.desc':   'Define keywords, topics and goals. Our AI learns from your choices automatically.',
    'step3.title':  'Receive on WhatsApp',
    'step3.desc':   'Relevant alerts arrive on WhatsApp instantly with a summary and direct link.',

    // Testimonials
    'testi.eyebrow': 'Testimonials',
    'testi.title1':  'Loved by',
    'testi.title2':  'Professionals',
    'testi1.text': '"I was missing job alerts buried in 200 promotional emails. BharatFlow fixed that completely. Now only relevant SDE roles hit my WhatsApp."',
    'testi2.text': '"The WhatsApp delivery is brilliant. I check email maybe once a day now, but urgent items reach me in seconds. My focus has improved massively."',
    'testi3.text': '"As a freelancer tracking multiple clients, BharatFlow\'s domain whitelist feature is a game changer. Zero clutter, all signal."',

    // CTA
    'cta.title1':   'Ready to',
    'cta.title2':   'Cut the Noise?',
    'cta.subtitle': 'Join thousands of professionals who reclaimed their focus with BharatFlow.',
    'cta.btn':      "Get Started — It's Free",

    // Footer
    'footer.tagline': 'AI-powered notification intelligence for Indian professionals.',
    'footer.privacy': 'Privacy',
    'footer.terms':   'Terms',
    'footer.contact': 'Contact',

    // Auth modal
    'auth.signin':  'Sign In',
    'auth.create':  'Create Account',
    'auth.google':  'Continue with Google',
    'login.title':  'Welcome Back',
    'login.sub':    'Sign in to your BharatFlow account',
    'signup.title': 'Create Account',
    'signup.sub':   'Start filtering smarter today — free forever',
    'signup.btn':   'Create My Account',

    // Form labels
    'form.email':    'Email Address',
    'form.password': 'Password',
    'form.forgot':   'Forgot?',
    'form.fname':    'First Name',
    'form.lname':    'Last Name',
    'form.phone':    'WhatsApp Number',
    'form.orwith':   'or continue with',
    'form.agree':    'I agree to the',
    'form.terms':    'Terms of Service',
    'form.privacy2': 'Privacy Policy',

    // Dashboard
    'dash.overview':   'Overview',
    'dash.filters':    'Active Filters',
    'dash.feed':       'Live Feed',
    'dash.analytics':  'Analytics',
    'dash.settings':   'Settings',
    'dash.pause':      'Pause',
    'dash.resume':     'Resume',
    'dash.addfilter':  'Add Filter',
    'dash.active':     'System Active',
    'dash.paused':     'System Paused',
    'stat.sent':       'Sent Today',
    'stat.filtered':   'Filtered Out',
    'stat.filters':    'Active Filters',
    'stat.score':      'Relevance Score',

    // Onboarding
    'ob.step1':   'Your Profile',
    'ob.step2':   'Your Goals',
    'ob.step3':   'Filter Settings',
    'ob.step4':   'Connect Gmail',
    'ob.skip':    'Skip Setup →',
    'ob.next1':   'Continue — Set Your Goals →',
    'ob.next2':   'Continue — Set Filters →',
    'ob.next3':   'Continue — Connect Gmail →',
    'ob.finish':  '🚀 Launch My Dashboard →',
    'ob.title1':  'Tell Us About You',
    'ob.sub1':    'Set up your profile so BharatFlow can personalize your experience.',
    'ob.title2':  'What Are Your Goals?',
    'ob.sub2':    'Select what matters to you. BharatFlow will prioritize these types.',
    'ob.title3':  'Configure Your Filters',
    'ob.sub3':    'Define keywords and domains to hone your personal filter engine.',
    'ob.title4':  'Connect Your Inbox',
    'ob.sub4':    'Link your Gmail account so BharatFlow can start monitoring in real-time.',
  },

  hi: {
    // Navbar
    'nav.features':   'विशेषताएं',
    'nav.how':        'कैसे काम करता है',
    'nav.reviews':    'समीक्षाएं',
    'nav.signin':     'साइन इन',
    'nav.getstarted': 'मुफ़्त शुरू करें',

    // Hero
    'hero.badge':    'भारत भर में 2,000+ पेशेवरों का भरोसा',
    'hero.title1':   'आपका इनबॉक्स,',
    'hero.title2':   'स्मार्ट फ़िल्टरिंग के साथ',
    'hero.title3':   'WhatsApp पर डिलीवर',
    'hero.subtitle': 'BharatFlow AI से ईमेल, जॉब अलर्ट और नोटिफिकेशन फ़िल्टर करता है — केवल जो ज़रूरी है वही आपके WhatsApp पर तुरंत पहुंचाता है।',
    'hero.cta1':     'मुफ़्त शुरू करें',
    'hero.cta2':     'देखें कैसे काम करता है',
    'hero.stat1':    'शोर कम',
    'hero.stat2':    'डिलीवरी समय',
    'hero.stat3':    'AI फ़िल्टर',

    // Preview card
    'preview.title':  'लाइव फ़ीड',
    'preview.live':   'लाइव',
    'preview.blocked':'ऑटो-ब्लॉक',
    'preview.wa':     'WhatsApp पर डिलीवर हो रहा है',
    'preview.today':  'आज भेजे',

    // Tags
    'tag.sent':     'भेजा',
    'tag.filtered': 'फ़िल्टर',
    'tag.queued':   'कतार में',

    // Features
    'features.eyebrow': 'BharatFlow क्यों?',
    'features.title1':  'बना है',
    'features.title2':  'स्मार्ट पेशेवर के लिए',
    'features.subtitle':'आपकी एकाग्रता वापस पाने और ज़रूरी चीज़ों पर ध्यान रखने के लिए सब कुछ।',
    'feat1.title': 'AI-संचालित फ़िल्टरिंग',
    'feat1.desc':  'हमारा मॉडल आपकी प्राथमिकताएं सीखता है और केवल असली ज़रूरी नोटिफिकेशन दिखाता है।',
    'feat2.title': 'WhatsApp डिलीवरी',
    'feat2.desc':  'फ़िल्टर किए गए रिजल्ट सीधे WhatsApp पर आते हैं — कोई अतिरिक्त ऐप नहीं चाहिए।',
    'feat3.title': 'Gmail इंटीग्रेशन',
    'feat3.desc':  'एक क्लिक में OAuth2 से Gmail कनेक्ट करें। रियल-टाइम फ़िल्टरिंग — पूरी तरह सुरक्षित।',
    'feat4.title': 'स्मार्ट डैशबोर्ड',
    'feat4.desc':  'सक्रिय फ़िल्टर, डिलीवरी आंकड़े और कीवर्ड प्रदर्शन देखें। सब एक जगह।',
    'feat5.title': 'बहु-स्रोत ट्रैकिंग',
    'feat5.desc':  'जॉब बोर्ड, GitHub, LinkedIn, न्यूज़ और कस्टम डोमेन — सब आपके रिलेवेंस स्कोर से।',
    'feat6.title': 'गोपनीयता पहले',
    'feat6.desc':  'आपका डेटा आपका है। हम ईमेल बेचते नहीं। पूरी एन्क्रिप्शन के साथ।',

    // How it works
    'how.eyebrow':  'प्रक्रिया',
    'how.title':    'BharatFlow कैसे काम करता है',
    'how.subtitle': 'तीन स्टेप। शून्य शोर। तुरंत WhatsApp डिलीवरी।',
    'step1.title':  'स्रोत जोड़ें',
    'step1.desc':   'Gmail कनेक्ट करें और डोमेन बताएं। 2 मिनट से कम में सेटअप।',
    'step2.title':  'फ़िल्टर सेट करें',
    'step2.desc':   'कीवर्ड और लक्ष्य बताएं। हमारा AI आपकी पसंद से खुद सीखता है।',
    'step3.title':  'WhatsApp पर पाएं',
    'step3.desc':   'ज़रूरी अलर्ट WhatsApp पर सारांश और लिंक के साथ तुरंत आते हैं।',

    // Testimonials
    'testi.eyebrow': 'प्रशंसापत्र',
    'testi.title1':  'पसंद है',
    'testi.title2':  'पेशेवरों को',
    'testi1.text': '"200 प्रमोशनल ईमेल में जॉब अलर्ट दब जाते थे। BharatFlow ने यह पूरी तरह ठीक किया। अब सिर्फ़ SDE रोल्स WhatsApp पर आते हैं।"',
    'testi2.text': '"WhatsApp डिलीवरी शानदार है। अब मैं दिन में एक बार ईमेल देखता हूं, पर ज़रूरी चीज़ें सेकंड में मिल जाती हैं।"',
    'testi3.text': '"फ्रीलांसर के तौर पर कई क्लाइंट ट्रैक करना पड़ता है — BharatFlow का डोमेन व्हाइटलिस्ट फीचर बेहद काम का है।"',

    // CTA
    'cta.title1':   'तैयार हैं',
    'cta.title2':   'शोर कम करने के लिए?',
    'cta.subtitle': 'हज़ारों पेशेवरों से जुड़ें जिन्होंने BharatFlow से अपनी एकाग्रता वापस पाई।',
    'cta.btn':      'शुरू करें — बिल्कुल मुफ़्त',

    // Footer
    'footer.tagline': 'भारतीय पेशेवरों के लिए AI-संचालित नोटिफिकेशन इंटेलिजेंस।',
    'footer.privacy': 'गोपनीयता',
    'footer.terms':   'शर्तें',
    'footer.contact': 'संपर्क',

    // Auth modal
    'auth.signin':  'साइन इन',
    'auth.create':  'खाता बनाएं',
    'auth.google':  'Google से जारी रखें',
    'login.title':  'वापसी पर स्वागत है',
    'login.sub':    'अपने BharatFlow खाते में साइन इन करें',
    'signup.title': 'खाता बनाएं',
    'signup.sub':   'आज ही स्मार्ट फ़िल्टरिंग शुरू करें — हमेशा के लिए मुफ़्त',
    'signup.btn':   'मेरा खाता बनाएं',

    // Form
    'form.email':    'ईमेल पता',
    'form.password': 'पासवर्ड',
    'form.forgot':   'भूल गए?',
    'form.fname':    'पहला नाम',
    'form.lname':    'अंतिम नाम',
    'form.phone':    'WhatsApp नंबर',
    'form.orwith':   'या इससे जारी रखें',
    'form.agree':    'मैं सहमत हूं',
    'form.terms':    'सेवा की शर्तें',
    'form.privacy2': 'गोपनीयता नीति',

    // Dashboard
    'dash.overview':  'अवलोकन',
    'dash.filters':   'सक्रिय फ़िल्टर',
    'dash.feed':      'लाइव फ़ीड',
    'dash.analytics': 'विश्लेषण',
    'dash.settings':  'सेटिंग',
    'dash.pause':     'रोकें',
    'dash.resume':    'फिर शुरू करें',
    'dash.addfilter': 'फ़िल्टर जोड़ें',
    'dash.active':    'सिस्टम सक्रिय',
    'dash.paused':    'सिस्टम रुका',
    'stat.sent':      'आज भेजे',
    'stat.filtered':  'फ़िल्टर किए',
    'stat.filters':   'सक्रिय फ़िल्टर',
    'stat.score':     'रिलेवेंस स्कोर',

    // Onboarding
    'ob.step1':  'आपकी प्रोफ़ाइल',
    'ob.step2':  'आपके लक्ष्य',
    'ob.step3':  'फ़िल्टर सेटिंग',
    'ob.step4':  'Gmail जोड़ें',
    'ob.skip':   'सेटअप छोड़ें →',
    'ob.next1':  'जारी रखें — लक्ष्य सेट करें →',
    'ob.next2':  'जारी रखें — फ़िल्टर सेट करें →',
    'ob.next3':  'जारी रखें — Gmail जोड़ें →',
    'ob.finish': '🚀 डैशबोर्ड खोलें →',
    'ob.title1': 'अपने बारे में बताएं',
    'ob.sub1':   'BharatFlow को आपका अनुभव personalize करने दें।',
    'ob.title2': 'आपके लक्ष्य क्या हैं?',
    'ob.sub2':   'चुनें क्या मायने रखता है। BharatFlow इन्हें प्राथमिकता देगा।',
    'ob.title3': 'फ़िल्टर कॉन्फ़िगर करें',
    'ob.sub3':   'कीवर्ड और डोमेन बताएं।',
    'ob.title4': 'इनबॉक्स जोड़ें',
    'ob.sub4':   'रियल-टाइम मॉनिटरिंग के लिए Gmail लिंक करें।',
  },
};

// ══════════════════════════════════════════
// LANGUAGE SYSTEM
// ══════════════════════════════════════════
let currentLang = localStorage.getItem('bf_lang') || 'en';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('bf_lang', lang);

  // Update html lang attribute
  document.documentElement.lang = lang;

  // Update active button
  document.querySelectorAll('.lang-opt').forEach(btn => {
    btn.classList.toggle('active', btn.id === `lang-${lang}`);
    btn.setAttribute('aria-pressed', btn.id === `lang-${lang}` ? 'true' : 'false');
  });

  // Apply translations
  applyTranslations();
}

function applyTranslations() {
  const dict = i18n[currentLang] || i18n.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      // Don't replace child elements, only text content
      if (el.children.length === 0) {
        el.textContent = dict[key];
      } else {
        // For elements with mixed content, update only text nodes
        el.childNodes.forEach(node => {
          if (node.nodeType === 3 && node.textContent.trim()) {
            // skip — handled separately
          }
        });
        el.textContent = dict[key]; // safe for leaf nodes
      }
    }
  });

  // Special: elements that have child HTML (links inside labels)
  // These we handle with data-i18n-html
  document.querySelectorAll('[data-i18n-key]').forEach(el => {
    const key = el.getAttribute('data-i18n-key');
    if (dict[key]) el.textContent = dict[key];
  });
}

function t(key) {
  return (i18n[currentLang] || i18n.en)[key] || key;
}

// ══════════════════════════════════════════
// THEME SYSTEM
// ══════════════════════════════════════════
let currentTheme = localStorage.getItem('bf_theme') || 'dark';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  localStorage.setItem('bf_theme', theme);

  const sun  = document.getElementById('icon-sun');
  const moon = document.getElementById('icon-moon');
  if (sun)  sun.style.display  = theme === 'light' ? 'block' : 'none';
  if (moon) moon.style.display = theme === 'dark'  ? 'block' : 'none';
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// ══════════════════════════════════════════
// AUTH MODAL
// ══════════════════════════════════════════
function openModal(tab = 'login') {
  const backdrop = document.getElementById('modal-backdrop');
  const modal    = document.getElementById('auth-modal');
  if (!backdrop || !modal) return;

  backdrop.classList.add('open');
  modal.style.display = 'block';
  requestAnimationFrame(() => modal.classList.add('open'));
  document.body.style.overflow = 'hidden';
  switchTab(tab);
}

function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  const modal    = document.getElementById('auth-modal');
  if (!backdrop || !modal) return;

  backdrop.classList.remove('open');
  modal.classList.remove('open');
  setTimeout(() => { modal.style.display = 'none'; }, 280);
  document.body.style.overflow = '';
}

function switchTab(tab) {
  const login  = document.getElementById('form-login');
  const signup = document.getElementById('form-signup');
  const tLogin = document.getElementById('tab-login');
  const tSignup= document.getElementById('tab-signup');
  if (!login) return;

  if (tab === 'login') {
    login.style.display  = 'flex'; signup.style.display = 'none';
    tLogin.classList.add('active'); tSignup.classList.remove('active');
  } else {
    login.style.display  = 'none'; signup.style.display = 'flex';
    tLogin.classList.remove('active'); tSignup.classList.add('active');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-login');
  setLoading(btn, true);
  setTimeout(() => {
    setLoading(btn, false);
    const email = document.getElementById('l-email')?.value;
    localStorage.setItem('bf_user', JSON.stringify({ email, name: 'User' }));
    showToast(currentLang === 'hi' ? 'स्वागत है! डैशबोर्ड पर जा रहे हैं…' : 'Welcome back! Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
  }, 1200);
}

function handleSignup(e) {
  e.preventDefault();
  const terms = document.getElementById('s-terms');
  if (!terms?.checked) {
    showToast(currentLang === 'hi' ? 'कृपया शर्तें स्वीकार करें' : 'Please accept the Terms of Service', 'warning');
    return;
  }
  const btn = document.getElementById('btn-signup');
  setLoading(btn, true);
  setTimeout(() => {
    setLoading(btn, false);
    const name  = document.getElementById('s-fn')?.value;
    const email = document.getElementById('s-email')?.value;
    const phone = document.getElementById('s-phone')?.value;
    localStorage.setItem('bf_user', JSON.stringify({ name, email, phone }));
    showToast(currentLang === 'hi' ? 'खाता बनाया! प्रोफ़ाइल सेटअप करें 🎉' : 'Account created! Setting up your profile 🎉', 'success');
    setTimeout(() => { window.location.href = 'onboarding.html'; }, 1000);
  }, 1400);
}

function handleGoogle() {
  showToast(currentLang === 'hi' ? 'Google OAuth पर जा रहे हैं…' : 'Redirecting to Google OAuth…', 'info');
  setTimeout(() => {
    localStorage.setItem('bf_user', JSON.stringify({ name: 'Google User', email: 'user@gmail.com' }));
    showToast(currentLang === 'hi' ? 'Google से साइन इन!' : 'Signed in with Google!', 'success');
    setTimeout(() => { window.location.href = 'onboarding.html'; }, 600);
  }, 900);
}

// Escape key closes modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ══════════════════════════════════════════
// PASSWORD EYE + STRENGTH
// ══════════════════════════════════════════
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type   = isText ? 'password' : 'text';
  btn.innerHTML = isText
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
}

// ══════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════
function showToast(message, type = 'info', duration = 3200) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(10px)';
    setTimeout(() => el.remove(), 320);
  }, duration);
}

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
function setLoading(btn, on) {
  if (!btn) return;
  const txt = btn.querySelector('.btn-text');
  const spin = btn.querySelector('.spinner');
  btn.disabled = on;
  if (txt)  txt.style.display  = on ? 'none'         : '';
  if (spin) spin.style.display = on ? 'inline-block' : 'none';
}

function scrollTo(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function logout() {
  localStorage.removeItem('bf_user');
  showToast(t('nav.signin') === 'साइन इन' ? 'लॉग आउट हो गए' : 'Logged out', 'info');
  setTimeout(() => { window.location.href = 'index.html'; }, 700);
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme & language immediately
  applyTheme(currentTheme);
  setLang(currentLang);

  // Navbar scroll shadow
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // Password strength
  const pwdInput = document.getElementById('s-pwd');
  if (pwdInput) {
    pwdInput.addEventListener('input', () => {
      const val  = pwdInput.value;
      const wrap = document.getElementById('pwd-strength');
      const fill = document.getElementById('pwd-fill');
      const lbl  = document.getElementById('pwd-label');
      if (!wrap || !fill || !lbl) return;

      if (!val) { wrap.classList.remove('show'); return; }
      wrap.classList.add('show');

      let score = 0;
      if (val.length >= 8)        score++;
      if (/[A-Z]/.test(val))      score++;
      if (/[0-9]/.test(val))      score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      const levels = [
        { pct: '25%', color: '#EF4444', en: 'Weak', hi: 'कमज़ोर' },
        { pct: '50%', color: '#F59E0B', en: 'Fair', hi: 'ठीक' },
        { pct: '75%', color: '#3B82F6', en: 'Good', hi: 'अच्छा' },
        { pct: '100%',color: '#10B981', en: 'Strong 💪', hi: 'मज़बूत 💪' },
      ];
      const lvl = levels[Math.min(score, 4) - 1] || levels[0];
      fill.style.width      = lvl.pct;
      fill.style.background = lvl.color;
      lbl.textContent       = currentLang === 'hi' ? lvl.hi : lvl.en;
      lbl.style.color       = lvl.color;
    });
  }

  // IntersectionObserver for stagger animations
  const staggerEls = document.querySelectorAll('.stagger');
  const observer   = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      Array.from(entry.target.children).forEach((child, i) => {
        child.style.animationDelay = `${i * 0.07}s`;
        child.style.animation      = 'fade-up 0.5s ease forwards';
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  staggerEls.forEach(el => observer.observe(el));

  // Greeting for dashboard
  const greetEl = document.getElementById('dash-greeting');
  if (greetEl) {
    const h     = new Date().getHours();
    const user  = JSON.parse(localStorage.getItem('bf_user') || '{}');
    const name  = user.name ? `, ${user.name.split(' ')[0]}` : '';
    const greet = h < 12 ? (currentLang === 'hi' ? `सुप्रभात${name} ☀️` : `Good Morning${name} ☀️`)
                : h < 17 ? (currentLang === 'hi' ? `नमस्ते${name} 🌤️`   : `Good Afternoon${name} 🌤️`)
                :           (currentLang === 'hi' ? `शुभ संध्या${name} 🌙` : `Good Evening${name} 🌙`);
    greetEl.textContent = greet;
  }

  const dateEl = document.getElementById('dash-date');
  if (dateEl) {
    const locale = currentLang === 'hi' ? 'hi-IN' : 'en-IN';
    dateEl.textContent = new Date().toLocaleDateString(locale, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
});
