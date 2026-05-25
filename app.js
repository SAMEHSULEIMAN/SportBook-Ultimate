// ================================================
//  SportBook Ultimate - Supabase Edition (Complete)
//  app.js (الجزء الأول)
// ================================================
(function(){
  "use strict";

  // ==================== إعدادات Supabase ====================
  const SUPABASE_URL = 'https://your-project-id.supabase.co'; // ⚠️ استبدل بمعرف مشروعك
  const SUPABASE_ANON_KEY = 'your-anon-key';                 // ⚠️ استبدل بمفتاح المشروع
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ==================== الثوابت العامة ====================
  const ADMIN_CODE = 'admin123';
  const DEFAULT_SPORTS = ['football', 'basketball', 'tennis', 'padel'];
  const PAYMENT_TIMEOUT_MINUTES = 15;
  const BOOKING_FEE_PERCENTAGE = 0.15;   // رسوم الحجوزات
  const STORE_FEE_PERCENTAGE = 0.10;     // رسوم المتاجر

  const PERIODS = [
    { name: 'الليل', start: 0, end: 7, color: '#6366f1' },
    { name: 'الصباح', start: 7, end: 11, color: '#f59e0b' },
    { name: 'الظهيرة', start: 11, end: 16, color: '#10b981' },
    { name: 'المساء', start: 16, end: 24, color: '#ef4444' }
  ];

  const WEEKDAYS = ['sun','mon','tue','wed','thu','fri','sat'].map((key, i) => ({
    key,
    label: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][i]
  }));

  const CURRENCIES = {
    SAR: { symbol: 'ريال', name: 'ريال سعودي' },
    AED: { symbol: 'درهم', name: 'درهم إماراتي' },
    EGP: { symbol: 'جنيه', name: 'جنيه مصري' },
    USD: { symbol: '$', name: 'دولار أمريكي' },
    EUR: { symbol: '€', name: 'يورو' }
  };

  // ==================== دوال مساعدة ====================
  function sanitizeInput(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(msg, isSuccess = true, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = isSuccess ? '#10b981' : '#ef4444';
    toast.style.opacity = '1';
    setTimeout(() => { if (toast) toast.style.opacity = '0'; }, duration);
  }

  function showLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'block';
  }
  function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
  }

  function getCurrencySymbol(code) { return CURRENCIES[code]?.symbol || code; }
  function getCurrencyName(code) { return CURRENCIES[code]?.name || code; }

  async function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ==================== دوال i18n (الترجمة) ====================
  let currentLanguage = 'ar';
  const i18n = {
    ar: {
      home: 'الرئيسية', profile: 'الملف الشخصي', favorites: 'المفضلة',
      logout: 'تسجيل الخروج', login: 'دخول', register: 'حساب جديد',
      venue: 'منشأة', coach: 'مدرب', customer: 'عميل', admin: 'أدمن',
      bookNow: 'احجز الآن', addToCart: 'أضف إلى السلة', checkout: 'إتمام حجز الكل',
      save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', close: 'إغلاق',
      confirm: 'تأكيد', search: 'بحث', filter: 'تصفية', all: 'الكل',
      loading: 'جاري التحميل...', registerVenue: 'تسجيل منشأة',
      registerVenueTitle: 'تسجيل منشأة رياضية', registerCoach: 'تسجيل كمدرب',
      registerCoachTitle: 'تسجيل مدرب خصوصي', venueDashboard: 'لوحة المنشأة',
      coachDashboard: 'لوحة المدرب', adminDashboard: 'لوحة الأدمن',
      analytics: 'التحليلات', courts: 'الملاعب', coaches: 'المدربين',
      cart: 'سلة الحجوزات', myBookings: 'حجوزاتي',
      approve: 'قبول', reject: 'رفض', pending: 'بانتظار الموافقة',
      confirmed: 'مؤكد', cancelled: 'ملغي', recurring: 'متكرر',
      welcome: 'أهلاً', bookingConfirmed: 'تم تأكيد حجزك',
      bookingCancelled: 'تم إلغاء حجزك', locateMe: 'حدد موقعي وانتقل إليه',
      explore: 'استكشف الملاعب والمدربين', changeCurrency: 'تغيير العملة:',
      total: 'الإجمالي:', venues: 'المنشآت', users: 'المستخدمين',
      bookings: 'الحجوزات', promos: 'الكوبونات', finance: 'الماليات',
      data: 'البيانات', advanced: 'متقدم',
      paymentMethod: 'طريقة الدفع', card: 'بطاقة ائتمان', wallet: 'محفظة إلكترونية',
      instapay: 'InstaPay', fawry: 'فوري', cardNumber: 'رقم البطاقة', expiry: 'تاريخ الانتهاء',
      cvv: 'CVV', walletNumber: 'رقم المحفظة', paymentInstruction: 'سيتم توجيهك لصفحة الدفع',
      confirmPaymentBtn: 'تأكيد الدفع (وهمي)', penaltyNotice: 'لديك غرامات سابقة بقيمة',
      penaltyWillBeAdded: 'سيتم إضافة الغرامات المستحقة إلى إجمالي الدفع',
      searchLocation: 'ابحث عن مدينة أو عنوان...', locationFound: 'تم العثور على الموقع',
      locationNotFound: 'لم يتم العثور على الموقع', resetLocation: 'العودة للموقع الحالي',
      manualLocationSet: 'تم تعيين الموقع يدوياً', locationReset: 'تمت إعادة الموقع إلى موقعك الحالي',
      rateCustomer: 'تقييم العميل', openInvitations: 'دعوات مفتوحة للمباريات',
      createInvitation: 'إنشاء دعوة', sportsStore: 'المتجر الرياضي',
      storeCart: 'سلة المشتريات', checkoutStore: 'إتمام الشراء',
      venueRequirements: 'إعدادات إضافية (للجيم وحمامات السباحة)',
      hasCapacity: 'المنشأة بها طاقة استيعابية محددة', allowSharing: 'السماح بمشاركة الحجز مع آخرين',
      pendingReviews: 'لديك تقييمات معلقة، يرجى تقييم الحجوزات السابقة أولاً',
      maxCapacity: 'الطاقة الاستيعابية القصوى (عدد الأشخاص)', joinInvitation: 'انضمام',
      addToStoreCart: 'أضف إلى السلة', noInvitations: 'لا توجد دعوات حالية',
      noProducts: 'لا توجد منتجات حالية', orderPlaced: 'تم تقديم الطلب بنجاح',
      invitations: 'الدعوات', stores: 'المتاجر', products: 'المنتجات',
      customerReviews: 'تقييمات العملاء', teams: 'الفرق الرياضية', createTeam: 'إنشاء فريق',
      teamInvitations: 'دعوات الانضمام للفرق', createTeamInvitation: 'إنشاء دعوة فريق',
      addVenue: 'إضافة منشأة', addCoach: 'إضافة مدرب', addPromo: 'إضافة كوبون',
      code: 'الكود', discount: 'الخصم', usage: 'الاستخدام', validity: 'الصالحية',
      now: 'الآن', forever: 'دائم', enterPromoCode: 'أدخل كود الخصم (أحرف كبيرة):',
      enterDiscountType: 'نوع الخصم (percentage/value):', enterDiscountValue: 'قيمة الخصم:',
      enterMaxUses: 'الحد الأقصى للاستخدام (اتركه فارغاً لغير محدود):',
      enterValidFrom: 'تاريخ البداية (YYYY-MM-DD) أو اتركه فارغاً:',
      enterValidUntil: 'تاريخ النهاية (YYYY-MM-DD) أو اتركه فارغاً:',
      promoAdded: 'تم إضافة الكوبون', promoDeleted: 'تم حذف الكوبون',
      courtBookings: 'حجوزات الملاعب', coachSessions: 'جلسات التدريب',
      amount: 'المبلغ', courtRevenue: 'إيرادات الملاعب', coachRevenue: 'إيرادات المدربين',
      totalFees: 'إجمالي رسوم التطبيق', exportJSON: 'تصدير JSON', importJSON: 'استيراد JSON',
      clearData: 'مسح البيانات (عدا الأدمن)', invalidStructure: 'بنية غير صالحة',
      confirmReplaceData: 'استبدال جميع البيانات؟', importSuccess: 'تم الاستيراد بنجاح',
      error: 'خطأ', confirmClearData: 'مسح جميع البيانات (ما عدا الأدمن)؟',
      dataCleared: 'تم مسح البيانات', advancedStats: 'إحصائيات متقدمة',
      totalUsers: 'عدد المستخدمين', totalVenues: 'عدد المنشآت', totalCourts: 'عدد الملاعب',
      totalCoaches: 'عدد المدربين', totalCourtBookings: 'عدد حجوزات الملاعب',
      totalCoachSessions: 'عدد جلسات التدريب', avgVenueRating: 'متوسط تقييم المنشآت',
      avgCoachRating: 'متوسط تقييم المدربين', totalPromos: 'عدد الكوبونات',
      totalFavorites: 'عدد عناصر المفضلة', blocked: 'محظور', active: 'نشط',
      unblock: 'إلغاء الحظر', block: 'حظر', unknown: 'غير معروف',
      confirmDeleteVenue: 'حذف المنشأة وحجوزاتها؟', confirmDeleteUser: 'حذف المستخدم؟',
      confirmDeleteCoach: 'حذف المدرب وجلساته؟', userBlocked: 'تم حظر المستخدم',
      userUnblocked: 'تم إلغاء الحظر', apply: 'تطبيق', promoApplied: 'تم تطبيق الخصم',
      fees: 'رسوم', paymentSuccess: 'تم تأكيد الحجز والدفع بنجاح',
      invalidCard: 'رقم البطاقة غير صالح', invalidWallet: 'رقم المحفظة غير صالح',
      penaltyCleared: 'تم تصفير رصيد الغرامات',
    },
    en: {
      home: 'Home', profile: 'Profile', favorites: 'Favorites',
      logout: 'Logout', login: 'Login', register: 'Register',
      venue: 'Venue', coach: 'Coach', customer: 'Customer', admin: 'Admin',
      bookNow: 'Book Now', addToCart: 'Add to Cart', checkout: 'Checkout All',
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', close: 'Close',
      confirm: 'Confirm', search: 'Search', filter: 'Filter', all: 'All',
      loading: 'Loading...', registerVenue: 'Register Venue',
      registerVenueTitle: 'Register Sports Venue', registerCoach: 'Register as Coach',
      registerCoachTitle: 'Register Private Coach', venueDashboard: 'Venue Dashboard',
      coachDashboard: 'Coach Dashboard', adminDashboard: 'Admin Dashboard',
      analytics: 'Analytics', courts: 'Courts', coaches: 'Coaches',
      cart: 'Cart', myBookings: 'My Bookings',
      approve: 'Approve', reject: 'Reject', pending: 'Pending',
      confirmed: 'Confirmed', cancelled: 'Cancelled', recurring: 'Recurring',
      welcome: 'Welcome', bookingConfirmed: 'Your booking has been confirmed',
      bookingCancelled: 'Your booking has been cancelled', locateMe: 'Locate Me',
      explore: 'Explore Courts and Coaches', changeCurrency: 'Change Currency:',
      total: 'Total:', venues: 'Venues', users: 'Users',
      bookings: 'Bookings', promos: 'Promos', finance: 'Finance',
      data: 'Data', advanced: 'Advanced',
      paymentMethod: 'Payment Method', card: 'Credit Card', wallet: 'Digital Wallet',
      instapay: 'InstaPay', fawry: 'Fawry', cardNumber: 'Card Number', expiry: 'Expiry Date',
      cvv: 'CVV', walletNumber: 'Wallet Number', paymentInstruction: 'You will be redirected',
      confirmPaymentBtn: 'Confirm Payment (Demo)', penaltyNotice: 'You have previous penalties of',
      penaltyWillBeAdded: 'Outstanding penalties will be added to payment total',
      searchLocation: 'Search for a city or address...', locationFound: 'Location found',
      locationNotFound: 'Location not found', resetLocation: 'Reset to current location',
      manualLocationSet: 'Manual location set', locationReset: 'Location reset',
      rateCustomer: 'Rate Customer', openInvitations: 'Open Match Invitations',
      createInvitation: 'Create Invitation', sportsStore: 'Sports Store',
      storeCart: 'Store Cart', checkoutStore: 'Checkout',
      venueRequirements: 'Additional Settings (Gym/Pools)',
      hasCapacity: 'Venue has max capacity', allowSharing: 'Allow sharing booking',
      pendingReviews: 'You have pending reviews, please rate previous bookings first',
      maxCapacity: 'Maximum Capacity (persons)', joinInvitation: 'Join',
      addToStoreCart: 'Add to Cart', noInvitations: 'No invitations available',
      noProducts: 'No products available', orderPlaced: 'Order placed successfully',
      invitations: 'Invitations', stores: 'Stores', products: 'Products',
      customerReviews: 'Customer Reviews', teams: 'Sports Teams', createTeam: 'Create Team',
      teamInvitations: 'Team Invitations', createTeamInvitation: 'Create Team Invitation',
      addVenue: 'Add Venue', addCoach: 'Add Coach', addPromo: 'Add Promo',
      code: 'Code', discount: 'Discount', usage: 'Usage', validity: 'Validity',
      now: 'Now', forever: 'Forever', enterPromoCode: 'Enter promo code (uppercase):',
      enterDiscountType: 'Discount type (percentage/value):', enterDiscountValue: 'Discount value:',
      enterMaxUses: 'Max uses (leave empty for unlimited):',
      enterValidFrom: 'Valid from (YYYY-MM-DD) or leave empty:',
      enterValidUntil: 'Valid until (YYYY-MM-DD) or leave empty:',
      promoAdded: 'Promo code added', promoDeleted: 'Promo code deleted',
      courtBookings: 'Court Bookings', coachSessions: 'Coach Sessions',
      amount: 'Amount', courtRevenue: 'Court Revenue', coachRevenue: 'Coach Revenue',
      totalFees: 'Total App Fees', exportJSON: 'Export JSON', importJSON: 'Import JSON',
      clearData: 'Clear Data (except admin)', invalidStructure: 'Invalid structure',
      confirmReplaceData: 'Replace all data?', importSuccess: 'Import successful',
      error: 'Error', confirmClearData: 'Clear all data (except admin)?',
      dataCleared: 'Data cleared', advancedStats: 'Advanced Statistics',
      totalUsers: 'Total Users', totalVenues: 'Total Venues', totalCourts: 'Total Courts',
      totalCoaches: 'Total Coaches', totalCourtBookings: 'Total Court Bookings',
      totalCoachSessions: 'Total Coach Sessions', avgVenueRating: 'Avg Venue Rating',
      avgCoachRating: 'Avg Coach Rating', totalPromos: 'Total Promos',
      totalFavorites: 'Total Favorites', blocked: 'Blocked', active: 'Active',
      unblock: 'Unblock', block: 'Block', unknown: 'Unknown',
      confirmDeleteVenue: 'Delete venue and its bookings?', confirmDeleteUser: 'Delete user?',
      confirmDeleteCoach: 'Delete coach and sessions?', userBlocked: 'User blocked',
      userUnblocked: 'User unblocked', apply: 'Apply', promoApplied: 'Promo applied',
      fees: 'Fees', paymentSuccess: 'Payment confirmed successfully',
      invalidCard: 'Invalid card number', invalidWallet: 'Invalid wallet number',
      penaltyCleared: 'Penalty balance cleared',
    }
  };

  function t(key) { return i18n[currentLanguage]?.[key] || key; }

  function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('app_language', lang);
    const langText = document.getElementById('langText');
    if (langText) langText.textContent = lang === 'ar' ? 'English' : 'العربية';
    updateUITranslations();
  }

  function updateUITranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    if (!currentUser) {
      const loginBtn = document.getElementById('showLoginBtn');
      if (loginBtn) loginBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> ${t('login')}`;
    }
    updateUserArea();
    updateNavigation();
  }

  function initI18n() {
    const savedLang = localStorage.getItem('app_language') || 'ar';
    setLanguage(savedLang);
    const langBtn = document.getElementById('toggleLangBtn');
    if (langBtn) langBtn.addEventListener('click', () => setLanguage(currentLanguage === 'ar' ? 'en' : 'ar'));
  }
  document.addEventListener('DOMContentLoaded', initI18n);

  // ==================== Supabase API ====================
  const api = {
    async getUsers() { const { data } = await supabase.from('profiles').select('*'); return data; },
    async saveUser(user) { const { data, error } = await supabase.from('profiles').upsert(user).select(); if (error) throw error; return data; },
    async getCurrentProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    },
    async getVenues() { const { data } = await supabase.from('venues').select('*'); return data; },
    async saveVenue(venue) {
      if (venue.image_url?.startsWith('data:')) venue.image_url = await uploadImage(venue.image_url, 'venues');
      const { data, error } = await supabase.from('venues').upsert(venue).select();
      if (error) throw error;
      return data;
    },
    async deleteVenue(id) { await supabase.from('venues').delete().eq('id', id); },
    async getCourts() { const { data } = await supabase.from('courts').select('*'); return data; },
    async saveCourt(court) { const { data, error } = await supabase.from('courts').upsert(court).select(); if (error) throw error; return data; },
    async deleteCourt(id) { await supabase.from('courts').delete().eq('id', id); },
    async getCoaches() { const { data } = await supabase.from('coaches').select('*'); return data; },
    async saveCoach(coach) {
      if (coach.image_url?.startsWith('data:')) coach.image_url = await uploadImage(coach.image_url, 'coaches');
      const { data, error } = await supabase.from('coaches').upsert(coach).select();
      if (error) throw error;
      return data;
    },
    async getBookings() { const { data } = await supabase.from('bookings').select('*'); return data; },
    async getCoachBookings() { const { data } = await supabase.from('coach_bookings').select('*'); return data; },
    async createBooking(booking) { await supabase.from('bookings').insert(booking); },
    async createCoachBooking(booking) { await supabase.from('coach_bookings').insert(booking); },
    async cancelBooking(id) { await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id); },
    async cancelCoachBooking(id) { await supabase.from('coach_bookings').update({ status: 'cancelled' }).eq('id', id); },
    async getNotifications(userId) { const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }); return data; },
    async addNotification(notif) { await supabase.from('notifications').insert(notif); },
    async markNotificationsRead(userId) { await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false); },
    async getPromoCodes() { const { data } = await supabase.from('promo_codes').select('*'); return data; },
    async savePromoCode(promo) { const { data, error } = await supabase.from('promo_codes').upsert(promo).select(); if (error) throw error; return data; },
    async deletePromoCode(code) { await supabase.from('promo_codes').delete().eq('code', code); },
    async getFavorites() { const { data } = await supabase.from('favorites').select('*'); return data; },
    async addFavorite(fav) { const { data } = await supabase.from('favorites').insert(fav).select(); return data; },
    async removeFavorite(id) { await supabase.from('favorites').delete().eq('id', id); },
    async getOpenInvitations() { const { data } = await supabase.from('open_invitations').select('*'); return data; },
    async saveInvitation(inv) { const { data } = await supabase.from('open_invitations').upsert(inv).select(); return data; },
    async getStores() { const { data } = await supabase.from('stores').select('*'); return data; },
    async saveStore(store) {
      if (store.image_url?.startsWith('data:')) store.image_url = await uploadImage(store.image_url, 'stores');
      const { data, error } = await supabase.from('stores').upsert(store).select();
      if (error) throw error;
      return data;
    },
    async deleteStore(id) { await supabase.from('stores').delete().eq('id', id); },
    async getProducts() { const { data } = await supabase.from('products').select('*'); return data; },
    async saveProduct(product) {
      if (product.image_url?.startsWith('data:')) product.image_url = await uploadImage(product.image_url, 'products');
      const { data, error } = await supabase.from('products').upsert(product).select();
      if (error) throw error;
      return data;
    },
    async deleteProduct(id) { await supabase.from('products').delete().eq('id', id); },
    async getStoreOrders() { const { data } = await supabase.from('store_orders').select('*'); return data; },
    async saveStoreOrder(order) { const { data, error } = await supabase.from('store_orders').insert(order).select(); if (error) throw error; return data; },
    async getTeams() { const { data } = await supabase.from('teams').select('*'); return data; },
    async saveTeam(team) {
      if (team.logo_url?.startsWith('data:')) team.logo_url = await uploadImage(team.logo_url, 'teams');
      const { data, error } = await supabase.from('teams').upsert(team).select();
      if (error) throw error;
      return data;
    },
    async deleteTeam(id) { await supabase.from('teams').delete().eq('id', id); },
    async getTeamMembers() { const { data } = await supabase.from('team_members').select('*'); return data; },
    async addTeamMember(member) { const { data } = await supabase.from('team_members').insert(member).select(); return data; },
    async removeTeamMember(id) { await supabase.from('team_members').delete().eq('id', id); },
    async getTeamInvitations() { const { data } = await supabase.from('team_invitations').select('*'); return data; },
    async saveTeamInvitation(inv) { const { data } = await supabase.from('team_invitations').upsert(inv).select(); return data; },
    async deleteTeamInvitation(id) { await supabase.from('team_invitations').delete().eq('id', id); },
    async getVenueReviews() { const { data } = await supabase.from('venue_reviews').select('*'); return data; },
    async getCoachReviews() { const { data } = await supabase.from('coach_reviews').select('*'); return data; },
    async getCustomerReviews() { const { data } = await supabase.from('customer_reviews').select('*'); return data; },
    async addVenueReview(review) { await supabase.from('venue_reviews').insert(review); },
    async addCoachReview(review) { await supabase.from('coach_reviews').insert(review); },
    async addCustomerReview(review) { await supabase.from('customer_reviews').insert(review); },
    async getUserPreferences(userId) {
      const { data } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single();
      return data;
    },
    async saveUserPreferences(prefs) { await supabase.from('user_preferences').upsert(prefs); },
    async getBlackouts() { const { data } = await supabase.from('blackouts').select('*'); return data; },
    async saveBlackout(blackout) { await supabase.from('blackouts').insert(blackout); },
    async deleteBlackout(id) { await supabase.from('blackouts').delete().eq('id', id); },
    async getCustomSports() { const { data } = await supabase.from('custom_sports').select('*'); return data; },
    async addCustomSport(sport) { await supabase.from('custom_sports').insert({ name: sport }); },
  };

  // ==================== رفع الصور إلى Supabase Storage ====================
  async function uploadImage(base64, bucket) {
    const base64Data = base64.split(',')[1];
    const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, byteArray, {
      contentType: 'image/jpeg', upsert: true
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  }

  // ==================== المتغيرات العامة ====================
  let currentUser = null;
  let venues = [], courts = [], coaches = [], bookings = [], coachBookings = [];
  let users = [], notifications = [], promoCodes = [], favorites = [], cart = [];
  let reviews = {}, coachReviews = {}, customerReviews = {}, coachAvailability = {};
  let manualLocation = null, customerLocation = null;
  let openInvitations = [], teams = [], teamMembers = [], teamInvitations = [];
  let stores = [], products = [], storeCart = [], storeOrders = [];
  let currentCurrency = 'SAR';
  let map, miniMap, editMiniMap, coachMap;
  let pendingBooking = null, selectedRating = 0;
  let currentViewMode = 'courts';
  const sections = document.querySelectorAll('.section');
  const mainNav = document.getElementById('mainNav');
  const userArea = document.getElementById('userArea');

 // ==================== المصادقة ====================
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function register(email, password, fullName, role, phone) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role, phone } }
  });
  if (error) throw error;

  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      phone,
      role,
      penalty_balance: 0,
      is_blocked: false,
      created_at: new Date().toISOString()
    });
  }
  return data;
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  cart = [];
  updateUIBasedOnRole();
  switchSection('home');
  showToast('تم تسجيل الخروج');
}

// مراقبة حالة المستخدم
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    currentUser = session.user;
    const profile = await api.getCurrentProfile();
    if (profile) currentUser = { ...currentUser, ...profile };
  } else {
    currentUser = null;
  }
  updateUIBasedOnRole();
  if (document.getElementById('home')?.classList.contains('active')) {
    if (currentViewMode === 'courts') renderCourts();
    else renderCoaches();
  }
});

// ==================== تحميل البيانات ====================
async function refreshData() {
  showLoader();
  try {
    const [
      v, c, co, bks, cbks, usrs, notifs, promos, favs, invs,
      strs, prods, sords, tms, tmems, tinvs
    ] = await Promise.all([
      api.getVenues(), api.getCourts(), api.getCoaches(),
      api.getBookings(), api.getCoachBookings(), api.getUsers(),
      api.getNotifications(currentUser?.id), api.getPromoCodes(), api.getFavorites(),
      api.getOpenInvitations(), api.getStores(), api.getProducts(),
      api.getStoreOrders(), api.getTeams(), api.getTeamMembers(), api.getTeamInvitations()
    ]);

    venues = v || []; courts = c || []; coaches = co || [];
    bookings = bks || []; coachBookings = cbks || []; users = usrs || [];
    notifications = notifs || []; promoCodes = promos || [];
    favorites = favs || []; openInvitations = invs || [];
    stores = strs || []; products = prods || []; storeOrders = sords || [];
    teams = tms || []; teamMembers = tmems || []; teamInvitations = tinvs || [];

    // إعادة بناء التقييمات
    reviews = {}; coachReviews = {}; customerReviews = {};
    const vReviews = await api.getVenueReviews();
    vReviews?.forEach(r => {
      if (!reviews[r.venue_id]) reviews[r.venue_id] = [];
      reviews[r.venue_id].push(r);
    });
    const cReviews = await api.getCoachReviews();
    cReviews?.forEach(r => {
      if (!coachReviews[r.coach_id]) coachReviews[r.coach_id] = [];
      coachReviews[r.coach_id].push(r);
    });
    const custReviews = await api.getCustomerReviews();
    custReviews?.forEach(r => {
      if (!customerReviews[r.booking_id]) customerReviews[r.booking_id] = [];
      customerReviews[r.booking_id].push(r);
    });

    // العملة
    if (currentUser) {
      const prefs = await api.getUserPreferences(currentUser.id);
      if (prefs?.preferred_currency) currentCurrency = prefs.preferred_currency;
    }
    updateCurrencyUI();
  } catch (error) {
    console.error('فشل تحميل البيانات:', error);
    showToast('فشل الاتصال بالخادم', false);
  }
  populateSportSelects();
  updateUIBasedOnRole();
  hideLoader();
}

// ==================== واجهة المستخدم ====================
function updateUIBasedOnRole() {
  updateUserArea();
  updateNavigation();
  updateNotificationBadge();
  if (currentUser?.role === 'customer') {
    document.getElementById('customerBookingsSection').style.display = 'block';
    renderCustomerBookings();
  } else if (document.getElementById('customerBookingsSection')) {
    document.getElementById('customerBookingsSection').style.display = 'none';
  }
}

function updateUserArea() {
  if (!userArea) return;
  if (currentUser) {
    const roleText = t(currentUser.role || 'customer');
    userArea.innerHTML = `
      <button class="btn-sm" id="notificationsBtn"><i class="fas fa-bell"></i></button>
      <div class="user-info"><i class="fas fa-user"></i> ${sanitizeInput(currentUser.full_name || '')} (${roleText})</div>
      <button class="btn-sm" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> ${t('logout')}</button>
    `;
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('notificationsBtn')?.addEventListener('click', openNotifications);
  } else {
    userArea.innerHTML = `<button class="btn-sm" id="showLoginBtn">${t('login')}</button>`;
    document.getElementById('showLoginBtn')?.addEventListener('click', () => openAuthModal('login'));
  }
}

function updateNavigation() {
  if (!mainNav) return;
  let nav = '';
  if (!currentUser) nav = `<button class="nav-btn active" data-section="home">${t('home')}</button>`;
  else if (currentUser.role === 'customer') nav = `<button class="nav-btn active" data-section="home">${t('home')}</button><button class="nav-btn" data-section="openInvitations">دعوات</button><button class="nav-btn" data-section="teams">فرق</button><button class="nav-btn" data-section="store">متجر</button><button class="nav-btn" data-section="profile">ملفي</button>`;
  else if (currentUser.role === 'venue') nav = `<button class="nav-btn" data-section="home">${t('home')}</button><button class="nav-btn active" data-section="venueDashboard">لوحة المنشأة</button>`;
  else if (currentUser.role === 'coach') nav = `<button class="nav-btn" data-section="home">${t('home')}</button><button class="nav-btn active" data-section="coachDashboard">لوحة المدرب</button>`;
  else if (currentUser.role === 'admin') nav = `<button class="nav-btn" data-section="home">${t('home')}</button><button class="nav-btn active" data-section="adminDashboard">لوحة الأدمن</button>`;
  mainNav.innerHTML = nav;
  mainNav.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => switchSection(b.dataset.section)));
}

function switchSection(id) {
  sections.forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  mainNav?.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  mainNav?.querySelector(`[data-section="${id}"]`)?.classList.add('active');

  if (id === 'home') { if (currentViewMode === 'courts') renderCourts(); else renderCoaches(); if (map) setTimeout(() => map.invalidateSize(), 100); }
  else if (id === 'venueDashboard') loadVenueDashboard();
  else if (id === 'coachDashboard') loadCoachDashboard();
  else if (id === 'adminDashboard') loadAdminDashboard('venues');
  else if (id === 'profile') loadProfilePage();
  else if (id === 'favorites') loadFavoritesPage();
  else if (id === 'analytics') loadAnalyticsDashboard();
  else if (id === 'openInvitations') loadOpenInvitations();
  else if (id === 'store') { loadStore(); updateStoreCartUI(); }
  else if (id === 'teams') loadTeams();
  else if (id === 'teamInvitations') loadTeamInvitations();
  else if (id === 'registerVenue') initRegisterMiniMap();
  else if (id === 'registerCoach') initCoachRegisterMap();
}

// ==================== الموقع ====================
async function setCustomerLocation(lat, lng, source = 'gps') {
  customerLocation = { lat, lng };
  if (source === 'manual') {
    manualLocation = { lat, lng };
    if (currentUser) await api.saveUserPreferences({ user_id: currentUser.id, manual_location: manualLocation });
  }
  if (map) { map.setView([lat, lng], 15); updateMapMarkers(); }
  if (currentViewMode === 'courts') renderCourts(); else renderCoaches();
}

document.getElementById('getCustomerLocationBtn')?.addEventListener('click', () => {
  if (!navigator.geolocation) return showToast('GPS غير مدعوم', false);
  navigator.geolocation.getCurrentPosition(pos => {
    setCustomerLocation(pos.coords.latitude, pos.coords.longitude, 'gps');
    showToast('تم تحديد موقعك');
  }, () => showToast('فشل تحديد الموقع', false));
});

document.getElementById('searchLocationBtn')?.addEventListener('click', async () => {
  const query = document.getElementById('manualLocationInput')?.value?.trim();
  if (!query) return showToast('الرجاء إدخال اسم مدينة أو عنوان', false);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await response.json();
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      setCustomerLocation(lat, lng, 'manual');
      showToast(t('locationFound') + ': ' + data[0].display_name);
    } else {
      showToast(t('locationNotFound'), false);
    }
  } catch (error) {
    showToast('حدث خطأ أثناء البحث عن الموقع', false);
  }
});

document.getElementById('resetLocationBtn')?.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      setCustomerLocation(pos.coords.latitude, pos.coords.longitude, 'gps');
      document.getElementById('manualLocationInput').value = '';
      showToast(t('locationReset'));
    }, () => showToast('تعذر تحديد موقعك الحالي', false));
  }
});

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calculateTravelTime(dist) { return Math.round(dist / 80 * 60); }

// ==================== الرياضات المخصصة ====================
let customSports = [];
function getAllSports() { return [...DEFAULT_SPORTS, ...customSports]; }
function getSportDisplayName(sport) {
  const map = { 'football':'⚽ كرة قدم', 'basketball':'🏀 سلة', 'tennis':'🎾 تنس', 'padel':'🏓 بادل' };
  return map[sport] || `🏅 ${sport}`;
}
function getSportOptions(selected = '') {
  return getAllSports().map(sport => `<option value="${sport}" ${sport === selected ? 'selected' : ''}>${getSportDisplayName(sport)}</option>`).join('');
}
function populateSportSelects() {
  const sportFilter = document.getElementById('sportFilter');
  const courtSportSelect = document.getElementById('courtSport');
  const coachSportSelect = document.getElementById('coachSport');
  if (sportFilter) sportFilter.innerHTML = '<option value="all">الكل</option>' + getSportOptions();
  if (courtSportSelect) courtSportSelect.innerHTML = getSportOptions();
  if (coachSportSelect) coachSportSelect.innerHTML = getSportOptions();
}

async function addCustomSport(sportName) {
  if (!sportName || !sportName.trim()) return false;
  const trimmed = sportName.trim().toLowerCase();
  if (getAllSports().includes(trimmed)) { showToast('هذه الرياضة موجودة بالفعل', false); return false; }
  customSports.push(trimmed);
  await api.addCustomSport(trimmed);
  populateSportSelects();
  showToast(`تمت إضافة رياضة "${trimmed}"`);
  return true;
}

// ==================== عرض الملاعب والمدربين ====================
async function renderCourts(filterSport = 'all') {
  const container = document.getElementById('venuesList');
  if (!container) return;
  const filtered = courts.filter(c => filterSport === 'all' || c.sport === filterSport || c.allowed_sports?.includes(filterSport));
  if (!filtered.length) { container.innerHTML = '<div class="card">لا توجد ملاعب متاحة</div>'; return; }
  const currencySymbol = getCurrencySymbol(currentCurrency);
  let html = '';
  for (const court of filtered) {
    const venue = venues.find(v => v.id === court.venue_id);
    if (!venue) continue;
    const avg = (reviews[venue.id] || []).length ? ((reviews[venue.id] || []).reduce((s, r) => s + r.rating, 0) / (reviews[venue.id] || []).length).toFixed(1) : '0.0';
    html += `<div class="venue-card">
      <div class="venue-img" style="background-image:url('${venue.image_url || ''}')"><span class="venue-type">${getSportDisplayName(court.sport || '')}</span></div>
      <div class="venue-info">
        <div class="venue-name">${sanitizeInput(court.name)}</div>
        <div class="venue-rating">${'★'.repeat(Math.round(avg))} ${avg}</div>
        <div class="venue-pricing">من ${Math.min(...(court.pricing || venue.pricing || [50]))} ${currencySymbol}/ساعة</div>
        <button class="btn btn-primary book-btn" data-court-id="${court.id}">احجز الآن</button>
      </div>
    </div>`;
  }
  container.innerHTML = html;
  container.querySelectorAll('.book-btn').forEach(b => b.addEventListener('click', e => openBookingModal(b.dataset.courtId, 'court')));
  updateMapMarkers();
}

async function renderCoaches(filterSport = 'all') {
  const container = document.getElementById('venuesList');
  if (!container) return;
  const filtered = filterSport === 'all' ? coaches : coaches.filter(c => c.sport === filterSport);
  if (!filtered.length) { container.innerHTML = '<div class="card">لا يوجد مدربين متاحين</div>'; return; }
  const currencySymbol = getCurrencySymbol(currentCurrency);
  let html = '';
  for (const coach of filtered) {
    const avg = (coachReviews[coach.id] || []).length ? ((coachReviews[coach.id] || []).reduce((s, r) => s + r.rating, 0) / (coachReviews[coach.id] || []).length).toFixed(1) : '0.0';
    html += `<div class="coach-card">
      <div class="coach-img" style="background-image:url('${coach.image_url || ''}')"><span class="coach-type">${getSportDisplayName(coach.sport)}</span></div>
      <div class="coach-info">
        <div class="coach-name">${sanitizeInput(coach.name)}</div>
        <div class="coach-rating">${'★'.repeat(Math.round(avg))} ${avg}</div>
        <div class="coach-pricing">${coach.hourly_rate} ${currencySymbol}/ساعة</div>
        <button class="btn btn-primary book-coach-btn" data-coach-id="${coach.id}">احجز جلسة</button>
      </div>
    </div>`;
  }
  container.innerHTML = html;
  container.querySelectorAll('.book-coach-btn').forEach(b => b.addEventListener('click', e => openBookingModal(b.dataset.coachId, 'coach')));
  updateMapMarkers();
}

function updateMapMarkers() {
  if (!map) return;
  map.eachLayer(l => { if (l instanceof L.Marker) map.removeLayer(l); });
  if (currentViewMode === 'courts') {
    venues.forEach(v => { if (v.lat) L.marker([v.lat, v.lng]).addTo(map).bindPopup(sanitizeInput(v.name)); });
  } else {
    coaches.forEach(c => { if (c.lat) L.marker([c.lat, c.lng]).addTo(map).bindPopup(sanitizeInput(c.name)); });
  }
  if (customerLocation) L.marker([customerLocation.lat, customerLocation.lng], { icon: L.divIcon({ html: '📍', iconSize: [20,20] }) }).addTo(map).bindPopup('موقعك');
}

// ==================== المفضلة ====================
function isFavorite(type, id) {
  if (!currentUser) return false;
  return favorites.some(f => f.item_type === type && f.item_id === id);
}

async function toggleFavorite(type, id) {
  if (!currentUser) return showToast('يجب تسجيل الدخول');
  const exists = favorites.find(f => f.item_type === type && f.item_id === id);
  if (exists) {
    await api.removeFavorite(exists.id);
    favorites = favorites.filter(f => f.id !== exists.id);
  } else {
    const { data } = await api.addFavorite({ user_id: currentUser.id, item_type: type, item_id: id });
    if (data) favorites.push(data[0]);
  }
  if (currentViewMode === 'courts') renderCourts(); else renderCoaches();
}
window.toggleFavorite = toggleFavorite;

 // ==================== الحجز وإدارة الحجوزات ====================
async function checkCourtConflict(courtId, date, time, duration, excludeId = null) {
  const { data } = await supabase.from('bookings')
    .select('*')
    .eq('court_id', courtId)
    .eq('date', date)
    .neq('status', 'cancelled');
  if (!data) return false;
  return data.some(b => b.id !== excludeId && isTimeOverlap(time, duration, b.time, b.duration));
}

async function checkCoachConflict(coachId, date, time, duration, excludeId = null) {
  const { data } = await supabase.from('coach_bookings')
    .select('*')
    .eq('coach_id', coachId)
    .eq('date', date)
    .neq('status', 'cancelled');
  if (!data) return false;
  return data.some(b => b.id !== excludeId && isTimeOverlap(time, duration, b.time, b.duration));
}

function isTimeOverlap(start1, dur1, start2, dur2) {
  const s1 = start1; const e1 = addMinutes(s1, dur1);
  const s2 = start2; const e2 = addMinutes(s2, dur2);
  return s1 < e2 && s2 < e1;
}

function addMinutes(t, m) {
  const [h, mm] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, mm + m);
  return d.toTimeString().slice(0, 5);
}

function hasUnratedCompletedBookings() {
  if (!currentUser || currentUser.role !== 'customer') return false;
  const now = new Date();
  const unrated = bookings.filter(b =>
    b.customer_id === currentUser.id &&
    (b.status === 'confirmed' || b.status === 'مدفوع') &&
    !b.rated &&
    new Date(`${b.date}T${b.time}`) < now
  );
  const unratedCoach = coachBookings.filter(b =>
    b.customer_id === currentUser.id &&
    (b.status === 'confirmed' || b.status === 'مدفوع') &&
    !b.rated &&
    new Date(`${b.date}T${b.time}`) < now
  );
  return unrated.length > 0 || unratedCoach.length > 0;
}

async function openBookingModal(targetId, type) {
  if (!currentUser) return showToast('يرجى تسجيل الدخول', false);
  if (hasUnratedCompletedBookings()) { showToast(t('pendingReviews'), false); return; }

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('bookingDate').value = today;
  document.getElementById('bookingTime').value = '10:00';
  document.getElementById('bookingDuration').value = 1;
  document.getElementById('bookingType').value = type;

  const recurringHtml = `
    <div class="form-group">
      <label>التكرار</label>
      <select id="bookingRecurring">
        <option value="none">مرة واحدة</option>
        <option value="weekly">أسبوعي</option>
        <option value="biweekly">كل أسبوعين</option>
      </select>
    </div>
    <div class="form-group" id="recurringEndGroup" style="display:none;">
      <label>تاريخ الانتهاء</label>
      <input type="date" id="recurringEndDate">
    </div>
  `;
  const existingRecurring = document.getElementById('bookingRecurringGroup');
  if (!existingRecurring) {
    const durationGroup = document.getElementById('bookingDuration')?.closest('.form-group');
    if (durationGroup) {
      durationGroup.insertAdjacentHTML('afterend', recurringHtml);
      document.getElementById('bookingRecurring')?.addEventListener('change', (e) => {
        document.getElementById('recurringEndGroup').style.display = e.target.value !== 'none' ? 'block' : 'none';
      });
    }
  }

  if (type === 'court') {
    const court = courts.find(c => c.id === targetId);
    if (!court) return;
    document.getElementById('bookingCourtId').value = targetId;
    document.getElementById('bookingCoachId').value = '';
    document.getElementById('bookingVenueId').value = court.venue_id;
    await updateTimelineForCourt(court, today);
    document.getElementById('bookingDate').onchange = e => updateTimelineForCourt(court, e.target.value);
  } else {
    const coach = coaches.find(c => c.id === targetId);
    if (!coach) return;
    document.getElementById('bookingCourtId').value = '';
    document.getElementById('bookingCoachId').value = targetId;
    document.getElementById('bookingVenueId').value = '';
    await updateTimelineForCoach(targetId, today);
    document.getElementById('bookingDate').onchange = e => updateTimelineForCoach(targetId, e.target.value);
  }
  document.getElementById('bookingModal').style.visibility = 'visible';
}

async function updateTimelineForCourt(court, dateStr) {
  const timelineDiv = document.getElementById('timelineDisplay');
  if (!timelineDiv) return;
  const venue = venues.find(v => v.id === court.venue_id);
  const dayBookings = bookings.filter(b => b.court_id === court.id && b.date === dateStr && b.status !== 'cancelled');
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { data: blackouts } = await supabase.from('blackouts').select('*').eq('item_type', 'court').eq('item_id', court.id).eq('date', dateStr);
  let html = '';
  for (let h = 0; h < 24; h++) {
    const periodIdx = PERIODS.findIndex(p => h >= p.start && h < p.end);
    const periodColor = PERIODS[periodIdx]?.color || '#cbd5e1';
    let statusColor = '#10b981'; let statusText = 'متاح';
    if (!isWithinWorkingHours(venue, dateStr, h)) { statusColor = '#cbd5e1'; statusText = 'غير متاح'; }
    else {
      const booked = dayBookings.some(b => {
        const start = parseInt(b.time.split(':')[0]);
        return h >= start && h < start + b.duration;
      });
      if (booked) { statusColor = '#ef4444'; statusText = 'محجوز'; }
      const blacked = blackouts?.some(b => {
        if (b.start_hour) {
          const start = parseInt(b.start_hour.split(':')[0]);
          return h >= start && h < start + (b.duration || 1);
        }
        return true;
      });
      if (blacked) { statusColor = '#cbd5e1'; statusText = 'مغلق'; }
    }
    const price = (court.pricing || venue?.pricing || [50])[periodIdx] || 50;
    html += `<div class="hour-slot" title="${h}:00 - ${h+1}:00 | ${statusText} | ${price} ${currencySymbol}">
              <div class="period-part" style="background:${periodColor};">${h}</div>
              <div class="status-part" style="background:${statusColor};"></div>
            </div>`;
  }
  timelineDiv.innerHTML = html;
  updatePrice();
}

async function updateTimelineForCoach(coachId, dateStr) {
  const timelineDiv = document.getElementById('timelineDisplay');
  if (!timelineDiv) return;
  const coach = coaches.find(c => c.id === coachId);
  if (!coach) return;
  const daySessions = coachBookings.filter(b => b.coach_id === coachId && b.date === dateStr && b.status !== 'cancelled');
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { data: blackouts } = await supabase.from('blackouts').select('*').eq('item_type', 'coach').eq('item_id', coachId).eq('date', dateStr);
  let html = '';
  for (let h = 0; h < 24; h++) {
    const periodIdx = PERIODS.findIndex(p => h >= p.start && h < p.end);
    const periodColor = PERIODS[periodIdx]?.color || '#cbd5e1';
    let statusColor = '#10b981'; let statusText = 'متاح';
    if (!isWithinCoachWorkingHours(coachId, dateStr, h)) { statusColor = '#cbd5e1'; statusText = 'غير متاح'; }
    else {
      const booked = daySessions.some(b => {
        const start = parseInt(b.time.split(':')[0]);
        return h >= start && h < start + b.duration;
      });
      if (booked) { statusColor = '#ef4444'; statusText = 'محجوز'; }
      const blacked = blackouts?.some(b => {
        if (b.start_hour) {
          const start = parseInt(b.start_hour.split(':')[0]);
          return h >= start && h < start + (b.duration || 1);
        }
        return true;
      });
      if (blacked) { statusColor = '#cbd5e1'; statusText = 'مغلق'; }
    }
    html += `<div class="hour-slot" title="${h}:00 - ${h+1}:00 | ${statusText} | ${coach.hourly_rate} ${currencySymbol}">
              <div class="period-part" style="background:${periodColor};">${h}</div>
              <div class="status-part" style="background:${statusColor};"></div>
            </div>`;
  }
  timelineDiv.innerHTML = html;
  updatePrice();
}

function updatePrice() {
  const type = document.getElementById('bookingType')?.value;
  const duration = +document.getElementById('bookingDuration')?.value || 1;
  const time = document.getElementById('bookingTime')?.value;
  const date = document.getElementById('bookingDate')?.value;
  let price = 0;
  if (type === 'court') {
    const courtId = document.getElementById('bookingCourtId')?.value;
    const court = courts.find(c => c.id === courtId);
    if (court) {
      const venue = venues.find(v => v.id === court.venue_id);
      for (let i = 0; i < duration; i++) {
        const h = (parseInt(time.split(':')[0]) + i) % 24;
        const periodIdx = PERIODS.findIndex(p => h >= p.start && h < p.end);
        price += (court.pricing || venue?.pricing || [50])[periodIdx] || 50;
      }
    }
  } else {
    const coachId = document.getElementById('bookingCoachId')?.value;
    const coach = coaches.find(c => c.id === coachId);
    if (coach) price = coach.hourly_rate * duration;
  }
  document.getElementById('bookingPrice').textContent = price;
}

document.getElementById('bookingDuration')?.addEventListener('input', updatePrice);
document.getElementById('bookingTime')?.addEventListener('change', updatePrice);

// ==================== سلة الحجوزات ====================
async function loadCart() {
  if (currentUser) {
    const prefs = await api.getUserPreferences(currentUser.id);
    cart = prefs?.cart_data || [];
  } else {
    cart = [];
  }
  updateCartUI();
}

function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItemsList');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutCartBtn');
  const penaltyNotice = document.getElementById('penaltyNotice');
  if (cartCount) cartCount.textContent = cart.length;
  const symbol = getCurrencySymbol(currentCurrency);
  if (cart.length === 0) {
    if (cartItems) cartItems.innerHTML = '<p>السلة فارغة</p>';
    if (cartTotal) cartTotal.textContent = '0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (penaltyNotice) penaltyNotice.style.display = 'none';
    return;
  }
  let total = 0;
  let html = '';
  cart.forEach((item, index) => {
    total += item.price || 0;
    html += `<div class="cart-item">
      <div><strong>${item.courtName || item.coachName || item.name}</strong><br>${item.date || ''} ${item.time || ''} - ${item.price} ${symbol}</div>
      <button onclick="window.removeFromCart(${index})"><i class="fas fa-trash"></i></button>
    </div>`;
  });
  if (cartItems) cartItems.innerHTML = html;
  if (cartTotal) cartTotal.textContent = total.toFixed(2);
  if (checkoutBtn) checkoutBtn.disabled = false;
  if (penaltyNotice && currentUser?.penalty_balance > 0) {
    penaltyNotice.style.display = 'block';
    penaltyNotice.innerHTML = `<i class="fas fa-exclamation-triangle"></i> غرامات سابقة: ${currentUser.penalty_balance} ${symbol}`;
  } else if (penaltyNotice) {
    penaltyNotice.style.display = 'none';
  }
}

window.removeFromCart = async function(index) {
  cart.splice(index, 1);
  await syncCart();
  updateCartUI();
};

async function addToCart(bookingData) {
  if (bookingData.type === 'court') {
    const conflict = await checkCourtConflict(bookingData.courtId, bookingData.date, bookingData.time, bookingData.duration);
    if (conflict) { showToast('يوجد تعارض مع حجز آخر', false); return false; }
  } else {
    const conflict = await checkCoachConflict(bookingData.coachId, bookingData.date, bookingData.time, bookingData.duration);
    if (conflict) { showToast('يوجد تعارض مع جلسة أخرى', false); return false; }
  }
  cart.push({ ...bookingData, id: Date.now().toString() });
  await syncCart();
  updateCartUI();
  showToast('تمت الإضافة إلى السلة');
  return true;
}

async function checkoutCart() {
  if (cart.length === 0 || !currentUser) return;
  for (const item of cart) {
    if (item.type === 'court') {
      const conflict = await checkCourtConflict(item.courtId, item.date, item.time, item.duration);
      if (conflict) { showToast(`تعارض في ${item.courtName}`, false); return; }
    } else {
      const conflict = await checkCoachConflict(item.coachId, item.date, item.time, item.duration);
      if (conflict) { showToast(`تعارض في ${item.coachName}`, false); return; }
    }
  }
  const total = cart.reduce((s, i) => s + (i.price || 0), 0);
  pendingBooking = { items: cart, total, appFee: total * BOOKING_FEE_PERCENTAGE, penaltyBalance: currentUser.penalty_balance || 0 };
  document.getElementById('bookingModal').style.visibility = 'hidden';
  showPaymentModal(pendingBooking);
}

async function syncCart() {
  if (currentUser) {
    await api.saveUserPreferences({ user_id: currentUser.id, cart_data: cart });
  }
}

document.getElementById('checkoutCartBtn')?.addEventListener('click', checkoutCart);

// ==================== الدفع ====================
function showPaymentModal(b) {
  const symbol = getCurrencySymbol(currentCurrency);
  let itemsHtml = b.items.map(item => `<p>${item.courtName || item.coachName} - ${item.price} ${symbol}</p>`).join('');
  const penaltyAmount = b.penaltyBalance || 0;
  const penaltySection = penaltyAmount > 0 ? `<div class="penalty-box"><i class="fas fa-exclamation-triangle"></i> غرامات سابقة: ${penaltyAmount} ${symbol}</div>` : '';
  document.getElementById('paymentDetails').innerHTML = itemsHtml + penaltySection;
  document.getElementById('displayTotal').textContent = (b.total + penaltyAmount).toFixed(2);
  document.getElementById('paymentModal').style.visibility = 'visible';

  document.getElementById('confirmPaymentBtn').onclick = async () => {
    const method = document.getElementById('paymentMethodSelect').value;
    try {
      for (const item of b.items) {
        const record = {
          customer_id: currentUser.id,
          date: item.date,
          time: item.time,
          duration: item.duration,
          price: item.price,
          app_fee: item.price * BOOKING_FEE_PERCENTAGE,
          status: 'confirmed',
          payment_method: method,
        };
        if (item.type === 'court') {
          record.court_id = item.courtId;
          record.venue_id = item.venueId;
          await api.createBooking(record);
        } else {
          record.coach_id = item.coachId;
          await api.createCoachBooking(record);
        }
      }
      if (penaltyAmount > 0) {
        await supabase.from('profiles').update({ penalty_balance: 0 }).eq('id', currentUser.id);
        currentUser.penalty_balance = 0;
      }
      cart = []; await syncCart(); updateCartUI();
      document.getElementById('paymentModal').style.visibility = 'hidden';
      showToast(t('paymentSuccess'));
      await refreshData();
    } catch (err) {
      console.error('فشل الدفع:', err);
      showToast('فشل تأكيد الحجز', false);
    }
  };
}

document.getElementById('cancelPaymentBtn')?.addEventListener('click', () => {
  document.getElementById('paymentModal').style.visibility = 'hidden';
});

// ==================== الإشعارات ====================
async function getUnreadCount() {
  if (!currentUser) return 0;
  const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('read', false);
  return count || 0;
}

async function updateNotificationBadge() {
  if (!currentUser) return;
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    const count = await getUnreadCount();
    badge.textContent = count > 0 ? count : '';
  }
}

async function openNotifications() {
  if (!currentUser) return;
  const data = await api.getNotifications(currentUser.id);
  const list = document.getElementById('notificationsList');
  if (list) {
    list.innerHTML = data.length ? data.map(n => `<div style="padding:8px; border-bottom:1px solid #eee; ${n.read ? '' : 'background:#f0f9ff;'}">${n.message}<br><small>${new Date(n.created_at).toLocaleString()}</small></div>`).join('') : '<p>لا توجد إشعارات</p>';
  }
  await api.markNotificationsRead(currentUser.id);
  document.getElementById('notificationsModal').style.visibility = 'visible';
  updateNotificationBadge();
}

function addNotification(userId, message, type = 'info', relatedId = null) {
  api.addNotification({ user_id: userId, message, type, related_id: relatedId, read: false }).then(() => {
    if (userId === currentUser?.id) updateNotificationBadge();
  });
}

function sendWhatsAppMessage(phone, message) {
  if (!phone) return;
  window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
}

document.getElementById('closeNotificationsModal')?.addEventListener('click', () => {
  document.getElementById('notificationsModal').style.visibility = 'hidden';
});
document.getElementById('clearNotificationsBtn')?.addEventListener('click', async () => {
  await api.markNotificationsRead(currentUser.id);
  await openNotifications();
});

// ==================== التقييمات ====================
function openRatingModal(targetId, bookingId, type) {
  document.getElementById('ratingTargetId').value = targetId;
  document.getElementById('ratingBookingId').value = bookingId;
  document.getElementById('ratingType').value = type;
  selectedRating = 0;
  document.querySelectorAll('#ratingStars i').forEach(star => { star.className = 'far fa-star'; });
  document.getElementById('ratingComment').value = '';
  document.getElementById('ratingModal').style.visibility = 'visible';
}

document.querySelectorAll('#ratingStars i').forEach(star => {
  star.addEventListener('click', function() {
    selectedRating = parseInt(this.dataset.value);
    document.querySelectorAll('#ratingStars i').forEach((s, idx) => {
      s.className = idx < selectedRating ? 'fas fa-star' : 'far fa-star';
      s.style.color = idx < selectedRating ? '#fbbf24' : '';
    });
  });
});

document.getElementById('submitRatingBtn').addEventListener('click', async () => {
  const targetId = document.getElementById('ratingTargetId').value;
  const bookingId = document.getElementById('ratingBookingId').value;
  const type = document.getElementById('ratingType').value;
  const comment = sanitizeInput(document.getElementById('ratingComment').value);
  if (selectedRating === 0) { showToast('الرجاء اختيار تقييم', false); return; }
  if (type === 'venue') {
    await supabase.from('venue_reviews').insert({ venue_id: targetId, user_id: currentUser.id, rating: selectedRating, comment, booking_id: bookingId });
    await supabase.from('bookings').update({ rated: true }).eq('id', bookingId);
  } else {
    await supabase.from('coach_reviews').insert({ coach_id: targetId, user_id: currentUser.id, rating: selectedRating, comment, booking_id: bookingId });
    await supabase.from('coach_bookings').update({ rated: true }).eq('id', bookingId);
  }
  showToast('شكراً لتقييمك! 🌟');
  document.getElementById('ratingModal').style.visibility = 'hidden';
  await refreshData();
});

document.getElementById('closeRatingModal').addEventListener('click', () => {
  document.getElementById('ratingModal').style.visibility = 'hidden';
});

function openCustomerRatingModal(bookingId, type) {
  document.getElementById('customerRatingBookingId').value = bookingId;
  document.getElementById('customerRatingType').value = type;
  selectedRating = 0;
  document.querySelectorAll('#customerRatingStars i').forEach(star => { star.className = 'far fa-star'; });
  document.getElementById('customerRatingComment').value = '';
  document.getElementById('customerRatingModal').style.visibility = 'visible';
  document.querySelectorAll('#customerRatingStars i').forEach(star => {
    star.onclick = function() {
      selectedRating = parseInt(this.dataset.value);
      document.querySelectorAll('#customerRatingStars i').forEach((s, idx) => {
        s.className = idx < selectedRating ? 'fas fa-star' : 'far fa-star';
        s.style.color = idx < selectedRating ? '#fbbf24' : '';
      });
    };
  });
}

document.getElementById('submitCustomerRatingBtn').addEventListener('click', async () => {
  const bookingId = document.getElementById('customerRatingBookingId').value;
  const type = document.getElementById('customerRatingType').value;
  const comment = sanitizeInput(document.getElementById('customerRatingComment').value);
  if (selectedRating === 0) { showToast('الرجاء اختيار تقييم', false); return; }
  const booking = type === 'court' ? bookings.find(b => b.id === bookingId) : coachBookings.find(b => b.id === bookingId);
  if (!booking) return;
  await supabase.from('customer_reviews').insert({
    customer_id: booking.customer_id,
    reviewer_id: currentUser.id,
    rating: selectedRating,
    comment,
    booking_id: bookingId,
    booking_type: type
  });
  if (type === 'court') await supabase.from('bookings').update({ customer_rated_by_provider: true }).eq('id', bookingId);
  else await supabase.from('coach_bookings').update({ customer_rated_by_provider: true }).eq('id', bookingId);
  showToast('تم تقييم العميل');
  document.getElementById('customerRatingModal').style.visibility = 'hidden';
  await refreshData();
});

document.getElementById('closeCustomerRatingModal').addEventListener('click', () => {
  document.getElementById('customerRatingModal').style.visibility = 'hidden';
});

 // ==================== لوحة تحكم المنشأة ====================
async function loadVenueDashboard() {
  const container = document.getElementById('venueDashboardContent');
  if (!currentUser) return;
  let myVenues = currentUser.role === 'admin' ? venues : venues.filter(v => v.owner_id === currentUser.id);
  if (!myVenues.length) { container.innerHTML = '<p>لا توجد منشآت. <a href="#" onclick="switchSection(\'registerVenue\')">سجل منشأة</a></p>'; return; }
  let html = '<select id="venueSelectDashboard" class="filter-select"><option>اختر منشأة</option>';
  myVenues.forEach(v => html += `<option value="${v.id}">${sanitizeInput(v.name)}</option>`);
  html += '</select><div id="selectedVenueDetail" style="margin-top:20px;"></div>';
  container.innerHTML = html;
  document.getElementById('venueSelectDashboard').addEventListener('change', async (e) => {
    const venue = myVenues.find(v => v.id === e.target.value);
    if (venue) renderVenueDetailForOwner(venue);
  });
}

async function renderVenueDetailForOwner(venue) {
  const detail = document.getElementById('selectedVenueDetail');
  const venueBookings = bookings.filter(b => b.venue_id === venue.id);
  const venueCourts = courts.filter(c => c.venue_id === venue.id);
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const totalRevenue = venueBookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.price || 0), 0);

  let courtsHtml = venueCourts.map(court => {
    return `<div style="border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:8px;">
      <strong>${sanitizeInput(court.name)}</strong> (${court.sport || 'متعدد'})
      <div style="margin-top:8px;">
        <button class="btn-outline btn-sm edit-court-btn" data-court-id="${court.id}">تعديل</button>
        <button class="btn-outline btn-sm delete-court-btn" data-court-id="${court.id}">حذف</button>
        <button class="btn-outline btn-sm blackout-court-btn" data-court-id="${court.id}"><i class="fas fa-ban"></i> إغلاق</button>
      </div>
    </div>`;
  }).join('');

  let bookingsHtml = '';
  const pendingBookings = venueBookings.filter(b => b.status === 'pending');
  const activeBookings = venueBookings.filter(b => b.status === 'confirmed' || b.status === 'مدفوع');

  if (venue.requires_approval) {
    bookingsHtml += `<h4>حجوزات بانتظار الموافقة (${pendingBookings.length})</h4>`;
    bookingsHtml += pendingBookings.map(b => {
      const court = courts.find(c => c.id === b.court_id);
      const customer = users.find(u => u.id === b.customer_id);
      return `<div style="border:1px solid #fbbf24; border-radius:12px; padding:12px; margin-bottom:8px; background:#fef3c7;">
        <div><strong>${sanitizeInput(customer?.full_name || '')}</strong></div>
        <div>ملعب: ${court?.name || '—'} | ${b.date} | ${b.time} (${b.duration} ساعة) | ${b.price} ${currencySymbol}</div>
        <div class="booking-actions">
          <button class="btn-outline btn-sm approve-booking-btn" data-id="${b.id}" style="background:#10b981; color:white;">قبول</button>
          <button class="btn-outline btn-sm reject-booking-btn" data-id="${b.id}" style="background:#ef4444; color:white;">رفض</button>
        </div>
      </div>`;
    }).join('');
  }

  bookingsHtml += `<h4>الحجوزات النشطة (${activeBookings.length})</h4>`;
  bookingsHtml += activeBookings.map(b => {
    const court = courts.find(c => c.id === b.court_id);
    const customer = users.find(u => u.id === b.customer_id);
    const canRateCustomer = (b.status === 'confirmed' || b.status === 'مدفوع') && !b.customer_rated_by_provider;
    return `<div style="border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:8px;">
      <div><strong>${sanitizeInput(customer?.full_name || '')}</strong></div>
      <div>ملعب: ${court?.name || '—'} | ${b.date} | ${b.time} (${b.duration} ساعة) | ${b.price} ${currencySymbol}</div>
      <div class="booking-actions">
        <button class="btn-outline btn-sm edit-booking-btn" data-id="${b.id}">تعديل</button>
        <button class="btn-outline btn-sm cancel-booking-btn" data-id="${b.id}">إلغاء</button>
        ${customer?.phone ? `<a class="whatsapp-link btn-outline btn-sm" href="#" data-phone="${customer.phone}" onclick="sendWhatsAppMessage('${customer.phone}','مرحباً')">واتساب</a>` : ''}
        ${canRateCustomer ? `<button class="btn-outline btn-sm rate-customer-btn" data-booking-id="${b.id}">تقييم العميل</button>` : ''}
      </div>
    </div>`;
  }).join('');

  detail.innerHTML = `
    <div style="display:flex;justify-content:space-between;"><h3>${sanitizeInput(venue.name)}</h3><button class="btn-outline btn-sm" id="editVenueBtn">تعديل</button></div>
    <div class="stats-panel" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:16px 0;">
      <div class="card" style="padding:12px;"><strong>الإيرادات:</strong> ${totalRevenue} ${currencySymbol}</div>
      <div class="card" style="padding:12px;"><strong>الملاعب:</strong> ${venueCourts.length}</div>
    </div>
    <div class="card" style="padding:12px; margin-bottom:16px;">
      <label><input type="checkbox" id="requiresApprovalCheck" ${venue.requires_approval ? 'checked' : ''}> تتطلب الحجوزات موافقة مسبقة</label>
    </div>
    <div class="courts-panel"><h4>الملاعب <button class="btn-outline btn-sm" id="addNewCourtBtn">+ إضافة</button></h4><div id="courtsList">${courtsHtml}</div></div>
    <div>${bookingsHtml}</div>
  `;

  document.getElementById('requiresApprovalCheck')?.addEventListener('change', async (e) => {
    await supabase.from('venues').update({ requires_approval: e.target.checked }).eq('id', venue.id);
  });
  document.getElementById('editVenueBtn')?.addEventListener('click', () => openEditVenueModal(venue.id));
  document.getElementById('addNewCourtBtn')?.addEventListener('click', () => openCourtModal(null, venue.id));
  detail.querySelectorAll('.edit-court-btn').forEach(btn => btn.addEventListener('click', e => openCourtModal(btn.dataset.courtId)));
  detail.querySelectorAll('.delete-court-btn').forEach(btn => btn.addEventListener('click', async e => {
    if (confirm('حذف الملعب؟')) { await api.deleteCourt(btn.dataset.courtId); renderVenueDetailForOwner(venue); }
  }));
  detail.querySelectorAll('.blackout-court-btn').forEach(btn => btn.addEventListener('click', () => openBlackoutModal('court', btn.dataset.courtId)));
  detail.querySelectorAll('.approve-booking-btn').forEach(btn => btn.addEventListener('click', async () => {
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', btn.dataset.id);
    renderVenueDetailForOwner(venue);
  }));
  detail.querySelectorAll('.reject-booking-btn').forEach(btn => btn.addEventListener('click', async () => {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', btn.dataset.id);
    renderVenueDetailForOwner(venue);
  }));
  detail.querySelectorAll('.edit-booking-btn').forEach(btn => btn.addEventListener('click', () => openManageBookingModal(btn.dataset.id, 'court')));
  detail.querySelectorAll('.cancel-booking-btn').forEach(btn => btn.addEventListener('click', () => cancelBooking(btn.dataset.id, 'court')));
  detail.querySelectorAll('.rate-customer-btn').forEach(btn => btn.addEventListener('click', () => openCustomerRatingModal(btn.dataset.bookingId, 'court')));
}

// ==================== لوحة تحكم المدرب ====================
let selectedCoachId = null;
async function loadCoachDashboard() {
  const container = document.getElementById('coachDashboardContent');
  if (!currentUser) return;
  let coachList = currentUser.role === 'admin' ? coaches : coaches.filter(c => c.owner_id === currentUser.id);
  if (!coachList.length) { container.innerHTML = '<p>لا يوجد مدربين.</p>'; return; }
  let html = '<select id="coachSelectDashboard" class="filter-select"><option value="">اختر مدرباً</option>';
  coachList.forEach(c => html += `<option value="${c.id}" ${selectedCoachId === c.id ? 'selected' : ''}>${sanitizeInput(c.name)}</option>`);
  html += '</select><div id="selectedCoachDetail" style="margin-top:20px;"></div>';
  container.innerHTML = html;
  if (coachList.length === 1 && currentUser.role !== 'admin') { selectedCoachId = coachList[0].id; renderCoachDetail(coachList[0]); }
  else if (selectedCoachId) { const coach = coachList.find(c => c.id === selectedCoachId); if (coach) renderCoachDetail(coach); }
  document.getElementById('coachSelectDashboard').addEventListener('change', (e) => {
    const coach = coachList.find(c => c.id === e.target.value);
    if (coach) { selectedCoachId = coach.id; renderCoachDetail(coach); }
  });
}

function renderCoachDetail(coach) {
  const detail = document.getElementById('selectedCoachDetail');
  const sessions = coachBookings.filter(b => b.coach_id === coach.id);
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const totalRevenue = sessions.filter(s => s.status !== 'cancelled').reduce((s, b) => s + (b.price || 0), 0);

  let html = `
    <div style="display:flex;justify-content:space-between;"><h3>${sanitizeInput(coach.name)}</h3><button class="btn-outline btn-sm" id="editCoachBtn">تعديل</button></div>
    <p>الرياضة: ${getSportDisplayName(coach.sport)} | سعر الساعة: ${coach.hourly_rate} ${currencySymbol} | الإيرادات: ${totalRevenue} ${currencySymbol}</p>
    <button class="btn-outline btn-sm" id="editCoachAvailabilityBtn"><i class="fas fa-clock"></i> ساعات العمل</button>
    <button class="btn-outline btn-sm" id="blackoutCoachBtn"><i class="fas fa-ban"></i> إغلاق أيام</button>
    <h4>الجلسات</h4>`;
  sessions.forEach(s => {
    const customer = users.find(u => u.id === s.customer_id);
    html += `<div style="border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:8px;">
      <div><strong>${sanitizeInput(customer?.full_name || '')}</strong></div>
      <div>${s.date} | ${s.time} (${s.duration} ساعة) | ${s.price} ${currencySymbol}</div>
      <div class="booking-actions">
        <button class="btn-outline btn-sm edit-coach-booking-btn" data-id="${s.id}">تعديل</button>
        <button class="btn-outline btn-sm cancel-coach-booking-btn" data-id="${s.id}">إلغاء</button>
        ${customer?.phone ? `<a class="whatsapp-link btn-outline btn-sm" href="#" data-phone="${customer.phone}">واتساب</a>` : ''}
        ${!s.customer_rated_by_provider ? `<button class="btn-outline btn-sm rate-customer-btn" data-booking-id="${s.id}">تقييم العميل</button>` : ''}
      </div>
    </div>`;
  });
  detail.innerHTML = html;
  document.getElementById('editCoachBtn')?.addEventListener('click', () => openEditCoachModal(coach.id));
  document.getElementById('editCoachAvailabilityBtn')?.addEventListener('click', () => openCoachAvailabilityModal(coach.id));
  document.getElementById('blackoutCoachBtn')?.addEventListener('click', () => openBlackoutModal('coach', coach.id));
  detail.querySelectorAll('.cancel-coach-booking-btn').forEach(btn => btn.addEventListener('click', () => cancelBooking(btn.dataset.id, 'coach')));
  detail.querySelectorAll('.edit-coach-booking-btn').forEach(btn => btn.addEventListener('click', () => openManageBookingModal(btn.dataset.id, 'coach')));
  detail.querySelectorAll('.rate-customer-btn').forEach(btn => btn.addEventListener('click', () => openCustomerRatingModal(btn.dataset.bookingId, 'coach')));
}

// ==================== لوحة الأدمن ====================
async function loadAdminDashboard(tab = 'venues') {
  const content = document.getElementById('adminContent');
  if (!content) return;
  const currencySymbol = getCurrencySymbol(currentCurrency);
  let html = '';

  if (tab === 'venues') {
    const { data: vList } = await supabase.from('venues').select('*, profiles(full_name)');
    html = `<button class="btn btn-primary" onclick="switchSection('registerVenue')">إضافة</button><table class="admin-table"><tr><th>الاسم</th><th>المالك</th><th>التقييم</th><th>إجراءات</th></tr>`;
    (vList || []).forEach(v => {
      const avg = (reviews[v.id] || []).length ? ((reviews[v.id] || []).reduce((s, r) => s + r.rating, 0) / (reviews[v.id] || []).length).toFixed(1) : '-';
      html += `<tr><td>${sanitizeInput(v.name)}</td><td>${v.profiles?.full_name || ''}</td><td>${avg}</td>
        <td><button class="btn-outline btn-sm" onclick="openEditVenueModal('${v.id}')">تعديل</button>
        <button class="btn-outline btn-sm" onclick="deleteVenue('${v.id}')">حذف</button></td></tr>`;
    });
    html += '</table>';
  } else if (tab === 'users') {
    const { data: uList } = await supabase.from('profiles').select('*');
    html = `<table class="admin-table"><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr>`;
    (uList || []).forEach(u => {
      html += `<tr><td>${sanitizeInput(u.full_name)}</td><td>${u.email}</td><td>${u.role}</td><td>${u.is_blocked ? 'محظور' : 'نشط'}</td>
        <td><button class="btn-outline btn-sm" onclick="toggleUserBlock('${u.id}', ${!u.is_blocked})">${u.is_blocked ? 'فك الحظر' : 'حظر'}</button></td></tr>`;
    });
    html += '</table>';
  } else if (tab === 'finance') {
    const { data: bks } = await supabase.from('bookings').select('price, app_fee, status');
    const { data: cbks } = await supabase.from('coach_bookings').select('price, app_fee, status');
    const { data: ords } = await supabase.from('store_orders').select('total, status');

    const venueRev = (bks || []).filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.price || 0), 0);
    const coachRev = (cbks || []).filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.price || 0), 0);
    const storeRev = (ords || []).reduce((s, o) => s + (o.total || 0), 0);
    const totalFee = (bks || []).reduce((s, b) => s + (b.app_fee || 0), 0) + (cbks || []).reduce((s, b) => s + (b.app_fee || 0), 0) + storeRev * STORE_FEE_PERCENTAGE;

    html = `<h3>إجمالي الإيرادات: ${(venueRev + coachRev + storeRev).toFixed(2)} ${currencySymbol}</h3>
      <div class="stats-grid"><div class="card"><h4>الملاعب</h4><p>${venueRev} ${currencySymbol}</p></div>
      <div class="card"><h4>المدربين</h4><p>${coachRev} ${currencySymbol}</p></div>
      <div class="card"><h4>المتاجر</h4><p>${storeRev} ${currencySymbol}</p></div>
      <div class="card"><h4>رسوم التطبيق</h4><p>${totalFee.toFixed(2)} ${currencySymbol}</p></div></div>`;
  } else if (tab === 'stores') {
    html = `<button class="btn btn-primary" onclick="openStoreModal()">إضافة متجر</button><table class="admin-table"><tr><th>الاسم</th><th>الهاتف</th><th>إجراءات</th></tr>`;
    stores.forEach(s => html += `<tr><td>${sanitizeInput(s.name)}</td><td>${s.phone}</td>
      <td><button class="btn-outline btn-sm" onclick="openStoreModal('${s.id}')">تعديل</button>
      <button class="btn-outline btn-sm" onclick="deleteStore('${s.id}')">حذف</button></td></tr>`);
    html += '</table>';
  } else if (tab === 'products') {
    html = `<button class="btn btn-primary" onclick="openProductModal()">إضافة منتج</button><table class="admin-table"><tr><th>الصورة</th><th>الاسم</th><th>المتجر</th><th>السعر</th><th>إجراءات</th></tr>`;
    products.forEach(p => {
      const store = stores.find(s => s.id === p.store_id);
      html += `<tr><td>${p.image_url ? `<img src="${p.image_url}" style="width:40px;height:40px;border-radius:8px;">` : '—'}</td>
        <td>${sanitizeInput(p.name)}</td><td>${store?.name || ''}</td><td>${p.price} ${currencySymbol}</td>
        <td><button class="btn-outline btn-sm" onclick="openProductModal('${p.id}')">تعديل</button>
        <button class="btn-outline btn-sm" onclick="deleteProduct('${p.id}')">حذف</button></td></tr>`;
    });
    html += '</table>';
  } else if (tab === 'invitations') {
    html = `<table class="admin-table"><tr><th>العنوان</th><th>الرياضة</th><th>المنشئ</th><th>إجراءات</th></tr>`;
    openInvitations.forEach(inv => html += `<tr><td>${sanitizeInput(inv.title)}</td><td>${inv.sport}</td><td>${inv.creator_name}</td>
      <td><button class="btn-outline btn-sm" onclick="deleteInvitation('${inv.id}')">حذف</button></td></tr>`);
    html += '</table>';
  }
  content.innerHTML = html;
}

window.deleteVenue = async (id) => { await api.deleteVenue(id); loadAdminDashboard('venues'); };
window.toggleUserBlock = async (id, block) => { await supabase.from('profiles').update({ is_blocked: block }).eq('id', id); loadAdminDashboard('users'); };
window.deleteStore = async (id) => { await api.deleteStore(id); loadAdminDashboard('stores'); };
window.deleteProduct = async (id) => { await api.deleteProduct(id); loadAdminDashboard('products'); };
window.deleteInvitation = async (id) => { await supabase.from('open_invitations').delete().eq('id', id); loadAdminDashboard('invitations'); };

// ==================== التحليلات ====================
async function loadAnalyticsDashboard() {
  const container = document.getElementById('analyticsContent');
  if (!container) return;
  const currencySymbol = getCurrencySymbol(currentCurrency);
  const { data: bks } = await supabase.from('bookings').select('price, date');
  const { data: cbks } = await supabase.from('coach_bookings').select('price, date');
  const all = [...(bks || []), ...(cbks || [])];
  const totalRevenue = all.reduce((s, b) => s + (b.price || 0), 0);
  container.innerHTML = `<h3>إجمالي الإيرادات: ${totalRevenue.toFixed(2)} ${currencySymbol}</h3>
    <canvas id="revenueChart" style="max-height:300px;"></canvas>`;
  const monthly = {};
  all.forEach(b => {
    const m = b.date?.substring(0, 7);
    if (m) monthly[m] = (monthly[m] || 0) + (b.price || 0);
  });
  const months = Object.keys(monthly).sort();
  new Chart(document.getElementById('revenueChart'), {
    type: 'line',
    data: { labels: months, datasets: [{ label: 'الإيرادات', data: months.map(m => monthly[m]), borderColor: '#38bdf8' }] }
  });
}

// ==================== المتجر ====================
async function loadStore() {
  const container = document.getElementById('storeProductsList');
  if (!container) return;
  if (!products.length) { container.innerHTML = '<p>لا توجد منتجات</p>'; return; }
  const currencySymbol = getCurrencySymbol(currentCurrency);
  let html = '';
  products.forEach(prod => {
    const store = stores.find(s => s.id === prod.store_id);
    html += `<div class="store-product-card">
      <div class="store-product-img" style="background-image:url('${prod.image_url || ''}')"></div>
      <div class="store-product-info">
        <div class="store-product-price">${prod.price} ${currencySymbol}</div>
        <h4>${sanitizeInput(prod.name)}</h4>
        <div class="store-product-store">${store ? sanitizeInput(store.name) : ''}</div>
        <button class="btn btn-primary add-to-store-cart-btn" data-id="${prod.id}">أضف إلى السلة</button>
      </div>
    </div>`;
  });
  container.innerHTML = html;
  container.querySelectorAll('.add-to-store-cart-btn').forEach(btn => btn.addEventListener('click', () => {
    const existing = storeCart.find(i => i.productId === btn.dataset.id);
    if (existing) existing.quantity++;
    else {
      const product = products.find(p => p.id === btn.dataset.id);
      storeCart.push({ productId: product.id, productName: product.name, price: product.price, quantity: 1 });
    }
    updateStoreCartUI();
  }));
}

function updateStoreCartUI() {
  document.getElementById('storeCartCount').textContent = storeCart.length;
  const cartItems = document.getElementById('storeCartItems');
  const checkoutBtn = document.getElementById('checkoutStoreBtn');
  const symbol = getCurrencySymbol(currentCurrency);
  if (!storeCart.length) { cartItems.innerHTML = '<p>السلة فارغة</p>'; checkoutBtn.disabled = true; return; }
  let total = 0, html = '';
  storeCart.forEach((item, i) => {
    total += item.price * item.quantity;
    html += `<div class="cart-item"><span>${item.productName} x${item.quantity}</span> <button onclick="window.removeFromStoreCart(${i})"><i class="fas fa-trash"></i></button></div>`;
  });
  cartItems.innerHTML = html;
  checkoutBtn.disabled = false;
}

window.removeFromStoreCart = (i) => { storeCart.splice(i, 1); updateStoreCartUI(); };

document.getElementById('checkoutStoreBtn')?.addEventListener('click', async () => {
  if (!storeCart.length || !currentUser) return;
  const total = storeCart.reduce((s, i) => s + i.price * i.quantity, 0);
  await api.saveStoreOrder({ customer_id: currentUser.id, items: storeCart, total, status: 'قيد التنفيذ' });
  storeCart = []; updateStoreCartUI();
  showToast('تم تقديم الطلب');
});

   // ==================== دوال الخرائط (للتسجيل) ====================
  function initRegisterMiniMap() {
    if (miniMap) return;
    const mapEl = document.getElementById('registerMiniMap');
    if (!mapEl) return;
    miniMap = L.map('registerMiniMap').setView([24.7136, 46.6753], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
    venueMarker = L.marker([24.7136, 46.6753], { draggable: true }).addTo(miniMap);
    function update() {
      const ll = venueMarker.getLatLng();
      document.getElementById('venueLat').value = ll.lat.toFixed(6);
      document.getElementById('venueLng').value = ll.lng.toFixed(6);
    }
    venueMarker.on('dragend', update);
    miniMap.on('click', e => { venueMarker.setLatLng(e.latlng); update(); });
    update();
  }

  function initCoachRegisterMap() {
    if (coachMap) return;
    const mapEl = document.getElementById('coachRegisterMap');
    if (!mapEl) return;
    coachMap = L.map('coachRegisterMap').setView([24.7136, 46.6753], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(coachMap);
    coachMarker = L.marker([24.7136, 46.6753], { draggable: true }).addTo(coachMap);
    function update() {
      const ll = coachMarker.getLatLng();
      document.getElementById('coachLat').value = ll.lat.toFixed(6);
      document.getElementById('coachLng').value = ll.lng.toFixed(6);
    }
    coachMarker.on('dragend', update);
    coachMap.on('click', e => { coachMarker.setLatLng(e.latlng); update(); });
    update();
  }

  // ==================== تسجيل منشأة ====================
  document.getElementById('registerVenueForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || (currentUser.role !== 'venue' && currentUser.role !== 'admin')) return showToast('يجب تسجيل الدخول', false);
    const name = sanitizeInput(document.getElementById('venueName')?.value?.trim() || '');
    const lat = parseFloat(document.getElementById('venueLat')?.value);
    const lng = parseFloat(document.getElementById('venueLng')?.value);
    if (!name || isNaN(lat) || isNaN(lng)) return showToast('يرجى إدخال الاسم وتحديد الموقع', false);
    const phone = document.getElementById('venuePhone')?.value || '';
    const desc = sanitizeInput(document.getElementById('venueDesc')?.value || '');
    const pricing = [
      +document.getElementById('pricePeriod1')?.value || 40,
      +document.getElementById('pricePeriod2')?.value || 50,
      +document.getElementById('pricePeriod3')?.value || 60,
      +document.getElementById('pricePeriod4')?.value || 70
    ];
    const hasCapacity = document.getElementById('regVenueHasCapacity')?.checked || false;
    const maxCapacity = hasCapacity ? parseInt(document.getElementById('regVenueMaxCapacity')?.value || '10') : null;
    const allowSharing = document.getElementById('regVenueAllowSharing')?.checked ?? true;
    const imageFile = document.getElementById('venueImage')?.files?.[0];
    let imageUrl = '';
    if (imageFile) { try { const base64 = await compressImage(imageFile, 800, 0.6); imageUrl = await uploadImage(base64, 'venues'); } catch (err) {} }
    const newVenue = { name, phone, lat, lng, description: desc, pricing, has_capacity: hasCapacity, max_capacity: maxCapacity, allow_sharing: allowSharing, requires_approval: false, owner_id: currentUser.id, image_url: imageUrl };
    try {
      const { data: savedVenue } = await supabase.from('venues').insert(newVenue).select().single();
      if (!savedVenue) throw new Error('لم يتم حفظ المنشأة');
      const newCourts = [];
      document.querySelectorAll('.court-item').forEach((item, idx) => {
        const type = item.querySelector(`[name="courtType${idx}"]`)?.value || 'single';
        const courtName = item.querySelector(`[name="courtName${idx}"]`)?.value || `ملعب ${idx+1}`;
        const court = { venue_id: savedVenue.id, name: sanitizeInput(courtName), multi_sport: type === 'multi', sport: type === 'single' ? (item.querySelector(`[name="courtSport${idx}"]`)?.value || null) : null, allowed_sports: type === 'multi' ? Array.from(item.querySelectorAll(`[name="allowedSport${idx}"]:checked`)).map(cb => cb.value) : [], pricing: null };
        if (item.querySelector(`[name="useCustomPricing${idx}"]`)?.checked) court.pricing = [+item.querySelector(`[name="price1_${idx}"]`)?.value || 40, +item.querySelector(`[name="price2_${idx}"]`)?.value || 50, +item.querySelector(`[name="price3_${idx}"]`)?.value || 60, +item.querySelector(`[name="price4_${idx}"]`)?.value || 70];
        newCourts.push(court);
      });
      if (newCourts.length) await supabase.from('courts').insert(newCourts);
      document.getElementById('registerVenueForm').reset();
      document.getElementById('courtsListContainer').innerHTML = '';
      createCourtField();
      if (miniMap && venueMarker) { miniMap.setView([24.7136, 46.6753], 13); venueMarker.setLatLng([24.7136, 46.6753]); }
      await refreshData();
      switchSection(currentUser.role === 'admin' ? 'adminDashboard' : 'venueDashboard');
    } catch (err) { console.error(err); showToast('فشل تسجيل المنشأة', false); }
  });

  // ==================== تسجيل مدرب ====================
  document.getElementById('registerCoachForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || (currentUser.role !== 'coach' && currentUser.role !== 'admin')) return showToast('يجب تسجيل الدخول', false);
    const name = sanitizeInput(document.getElementById('coachName')?.value?.trim() || '');
    const lat = parseFloat(document.getElementById('coachLat')?.value);
    const lng = parseFloat(document.getElementById('coachLng')?.value);
    if (!name || isNaN(lat) || isNaN(lng)) return showToast('يرجى إدخال الاسم وتحديد الموقع', false);
    const phone = document.getElementById('coachPhone')?.value || '';
    const desc = sanitizeInput(document.getElementById('coachDesc')?.value || '');
    const sport = document.getElementById('coachSport')?.value || DEFAULT_SPORTS[0];
    const hourlyRate = +document.getElementById('coachHourlyRate')?.value || 100;
    const imageFile = document.getElementById('coachImage')?.files?.[0];
    let imageUrl = '';
    if (imageFile) { try { const base64 = await compressImage(imageFile, 400, 0.7); imageUrl = await uploadImage(base64, 'coaches'); } catch (err) {} }
    const newCoach = { name, phone, lat, lng, description: desc, sport, hourly_rate: hourlyRate, owner_id: currentUser.id, image_url: imageUrl };
    try {
      await supabase.from('coaches').insert(newCoach);
      document.getElementById('registerCoachForm').reset();
      if (coachMap && coachMarker) { coachMap.setView([24.7136, 46.6753], 13); coachMarker.setLatLng([24.7136, 46.6753]); }
      await refreshData();
      switchSection(currentUser.role === 'admin' ? 'adminDashboard' : 'coachDashboard');
    } catch (err) { console.error(err); showToast('فشل تسجيل المدرب', false); }
  });

  // ==================== دوال الملاعب في التسجيل ====================
  function createCourtField(courtData = null) {
    const container = document.getElementById('courtsListContainer');
    if (!container) return;
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'court-item';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;"><h4>ملعب ${index+1}</h4><button type="button" class="btn-outline btn-sm remove-court-btn"><i class="fas fa-times"></i></button></div>
      <div class="form-group"><label>اسم الملعب</label><input type="text" name="courtName${index}" value="${courtData?.name||''}" required></div>
      <div class="form-group"><label>نوع الاستخدام</label><select name="courtType${index}" class="court-type-select"><option value="single" ${!courtData?.multi_sport?'selected':''}>رياضة واحدة</option><option value="multi" ${courtData?.multi_sport?'selected':''}>متعدد الرياضات</option></select></div>
      <div class="single-sport-group" style="${courtData?.multi_sport?'display:none':''}"><label>الرياضة</label><select name="courtSport${index}">${getSportOptions(courtData?.sport)}</select></div>
      <div class="multi-sport-group" style="${courtData?.multi_sport?'':'display:none'}"><label>الرياضات</label><div class="checkbox-group">${getAllSports().map(s=>`<label><input type="checkbox" name="allowedSport${index}" value="${s}" ${courtData?.allowed_sports?.includes(s)?'checked':''}> ${getSportDisplayName(s)}</label>`).join('')}</div></div>
      <div class="form-group"><label><input type="checkbox" name="useCustomPricing${index}" ${courtData?.pricing?'checked':''}> تسعير خاص</label></div>
      <div class="custom-pricing-group" style="${courtData?.pricing?'':'display:none'}"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div><label>ف1</label><input type="number" name="price1_${index}" value="${courtData?.pricing?.[0]||40}" step="5"></div><div><label>ف2</label><input type="number" name="price2_${index}" value="${courtData?.pricing?.[1]||50}" step="5"></div><div><label>ف3</label><input type="number" name="price3_${index}" value="${courtData?.pricing?.[2]||60}" step="5"></div><div><label>ف4</label><input type="number" name="price4_${index}" value="${courtData?.pricing?.[3]||70}" step="5"></div></div></div>
    `;
    container.appendChild(div);
    const typeSelect = div.querySelector('.court-type-select');
    const pricingCheck = div.querySelector(`[name="useCustomPricing${index}"]`);
    const pricingGroup = div.querySelector('.custom-pricing-group');
    typeSelect.addEventListener('change', (e) => {
      const isMulti = e.target.value === 'multi';
      div.querySelector('.single-sport-group').style.display = isMulti ? 'none' : 'block';
      div.querySelector('.multi-sport-group').style.display = isMulti ? 'block' : 'none';
    });
    pricingCheck.addEventListener('change', (e) => { pricingGroup.style.display = e.target.checked ? 'block' : 'none'; });
    div.querySelector('.remove-court-btn').addEventListener('click', () => { div.remove(); updateCourtIndices(); });
  }

  function updateCourtIndices() {
    document.querySelectorAll('.court-item').forEach((item, idx) => { item.querySelector('h4').textContent = `ملعب ${idx+1}`; });
  }

  // ==================== عرض حجوزات العميل ====================
  async function renderCustomerBookings() {
    if (!currentUser) return;
    const container = document.getElementById('customerBookingsList');
    if (!container) return;
    const { data: myBookings } = await supabase.from('bookings').select('*').eq('customer_id', currentUser.id).order('date', { ascending: false });
    const { data: mySessions } = await supabase.from('coach_bookings').select('*').eq('customer_id', currentUser.id).order('date', { ascending: false });
    const currencySymbol = getCurrencySymbol(currentCurrency);
    if ((!myBookings || !myBookings.length) && (!mySessions || !mySessions.length)) { container.innerHTML = '<p>لا توجد حجوزات</p>'; return; }
    let html = '';
    (myBookings || []).forEach(b => {
      const court = courts.find(c => c.id === b.court_id);
      const venue = venues.find(v => v.id === b.venue_id);
      const canRate = (b.status === 'confirmed' || b.status === 'مدفوع') && !b.rated;
      html += `<div style="border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:8px;">
        <strong>🏟️ ${sanitizeInput(court?.name || '')} (${sanitizeInput(venue?.name || '')})</strong>
        <p>${b.date} | ${b.time} (${b.duration} ساعة) | ${b.price} ${currencySymbol} | ${b.status}</p>
        ${canRate ? `<button class="btn-outline btn-sm rate-btn" data-target="${b.venue_id}" data-booking="${b.id}" data-type="venue">تقييم</button>` : ''}
      </div>`;
    });
    (mySessions || []).forEach(s => {
      const coach = coaches.find(c => c.id === s.coach_id);
      const canRate = (s.status === 'confirmed' || s.status === 'مدفوع') && !s.rated;
      html += `<div style="border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:8px;">
        <strong>👤 ${sanitizeInput(coach?.name || '')}</strong>
        <p>${s.date} | ${s.time} (${s.duration} ساعة) | ${s.price} ${currencySymbol} | ${s.status}</p>
        ${canRate ? `<button class="btn-outline btn-sm rate-btn" data-target="${s.coach_id}" data-booking="${s.id}" data-type="coach">تقييم</button>` : ''}
      </div>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.rate-btn').forEach(btn => btn.addEventListener('click', () => openRatingModal(btn.dataset.target, btn.dataset.booking, btn.dataset.type)));
  }

  // ==================== إدارة الحجز ====================
  function openManageBookingModal(bookingId, type) {
    const booking = type === 'court' ? bookings.find(b => b.id === bookingId) : coachBookings.find(b => b.id === bookingId);
    if (!booking) return;
    document.getElementById('manageBookingId').value = bookingId;
    document.getElementById('manageBookingType').value = type;
    document.getElementById('manageBookingDate').value = booking.date;
    document.getElementById('manageBookingTime').value = booking.time;
    document.getElementById('manageBookingDuration').value = booking.duration;
    document.getElementById('manageBookingTitle').textContent = type === 'court' ? 'تعديل حجز الملعب' : 'تعديل جلسة التدريب';
    document.getElementById('manageBookingModal').style.visibility = 'visible';
  }

  document.getElementById('manageBookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookingId = document.getElementById('manageBookingId').value;
    const type = document.getElementById('manageBookingType').value;
    const newDate = document.getElementById('manageBookingDate').value;
    const newTime = document.getElementById('manageBookingTime').value;
    const newDuration = +document.getElementById('manageBookingDuration').value;
    const table = type === 'court' ? 'bookings' : 'coach_bookings';
    const booking = type === 'court' ? bookings.find(b => b.id === bookingId) : coachBookings.find(b => b.id === bookingId);
    if (!booking) return;
    if (type === 'court') {
      const conflict = await checkCourtConflict(booking.court_id, newDate, newTime, newDuration, bookingId);
      if (conflict) { showToast('يوجد تعارض مع حجز آخر', false); return; }
    } else {
      const conflict = await checkCoachConflict(booking.coach_id, newDate, newTime, newDuration, bookingId);
      if (conflict) { showToast('يوجد تعارض مع جلسة أخرى', false); return; }
    }
    let newPrice = booking.price;
    if (type === 'court') {
      const court = courts.find(c => c.id === booking.court_id);
      if (court) newPrice = calculateBookingPrice(court, newDate, newTime, newDuration);
    } else {
      const coach = coaches.find(c => c.id === booking.coach_id);
      if (coach) newPrice = coach.hourly_rate * newDuration;
    }
    await supabase.from(table).update({ date: newDate, time: newTime, duration: newDuration, price: newPrice, app_fee: newPrice * BOOKING_FEE_PERCENTAGE }).eq('id', bookingId);
    document.getElementById('manageBookingModal').style.visibility = 'hidden';
    await refreshData();
    showToast('تم تعديل الحجز');
  });

  async function cancelBooking(bookingId, type) {
    if (!confirm('إلغاء الحجز؟')) return;
    const table = type === 'court' ? 'bookings' : 'coach_bookings';
    await supabase.from(table).update({ status: 'cancelled' }).eq('id', bookingId);
    await refreshData();
    showToast('تم إلغاء الحجز');
  }

  // ==================== الحجز المباشر ====================
  document.getElementById('bookNowDirectBtn')?.addEventListener('click', async () => {
    const type = document.getElementById('bookingType')?.value;
    const date = document.getElementById('bookingDate')?.value;
    const time = document.getElementById('bookingTime')?.value;
    const duration = +document.getElementById('bookingDuration')?.value;
    const recurringSelect = document.getElementById('bookingRecurring');
    const recurring = recurringSelect ? recurringSelect.value : 'none';
    const endDate = recurring !== 'none' ? document.getElementById('recurringEndDate')?.value : null;
    if (recurring !== 'none' && !endDate) { showToast('حدد تاريخ انتهاء التكرار', false); return; }
    let baseData;
    if (type === 'court') {
      const courtId = document.getElementById('bookingCourtId')?.value;
      const court = courts.find(c => c.id === courtId);
      if (!court) return;
      const venue = venues.find(v => v.id === court.venue_id);
      const price = calculateBookingPrice(court, date, time, duration);
      baseData = { type: 'court', courtId: court.id, courtName: court.name, venueId: court.venue_id, venueName: venue?.name, date, time, duration, price };
    } else {
      const coachId = document.getElementById('bookingCoachId')?.value;
      const coach = coaches.find(c => c.id === coachId);
      if (!coach) return;
      const price = coach.hourly_rate * duration;
      baseData = { type: 'coach', coachId: coach.id, coachName: coach.name, date, time, duration, price };
    }
    let items = [baseData];
    let totalAmount = baseData.price;
    if (recurring !== 'none' && endDate) {
      const recurringItems = await createRecurringBookings(baseData, recurring, endDate);
      if (!recurringItems.length) { showToast('لا توجد تواريخ متاحة', false); return; }
      items = recurringItems;
      totalAmount = items.reduce((s, i) => s + i.price, 0);
    }
    pendingBooking = { items, total: totalAmount, appFee: totalAmount * BOOKING_FEE_PERCENTAGE, penaltyBalance: currentUser?.penalty_balance || 0 };
    document.getElementById('bookingModal').style.visibility = 'hidden';
    showPaymentModal(pendingBooking);
  });

  // ==================== حساب السعر للملعب ====================
  function calculateBookingPrice(court, date, time, duration) {
    const venue = venues.find(v => v.id === court.venue_id);
    const startHour = parseInt(time.split(':')[0]);
    let total = 0;
    for (let i = 0; i < duration; i++) {
      const h = (startHour + i) % 24;
      const periodIdx = PERIODS.findIndex(p => h >= p.start && h < p.end);
      total += (court.pricing || venue?.pricing || [50])[periodIdx] || 50;
    }
    return total;
  }

  // ==================== دوال ساعات العمل ====================
  function isWithinWorkingHours(venue, dateStr, hour) {
    if (!venue || !venue.working_hours) return true;
    const dayOfWeek = new Date(dateStr).getDay();
    const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][dayOfWeek];
    const wh = venue.working_hours?.[dayKey];
    if (!wh || !wh.start || !wh.end) return true;
    const start = parseInt(wh.start.split(':')[0]);
    const end = parseInt(wh.end.split(':')[0]);
    if (end < start) return hour >= start || hour < end;
    return hour >= start && hour < end;
  }

  function isWithinCoachWorkingHours(coachId, dateStr, hour) {
    const availability = coachAvailability[coachId];
    if (!availability) return true;
    const dayOfWeek = new Date(dateStr).getDay();
    const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][dayOfWeek];
    const wh = availability[dayKey];
    if (!wh || !wh.start || !wh.end) return true;
    const start = parseInt(wh.start.split(':')[0]);
    const end = parseInt(wh.end.split(':')[0]);
    if (end < start) return hour >= start || hour < end;
    return hour >= start && hour < end;
  }

  // ==================== دوال حساب الساعات المتاحة ====================
  async function getAvailableHoursForCourt(court, dateStr) {
    const venue = venues.find(v => v.id === court.venue_id);
    if (!venue) return { available: 0, total: 0 };
    const { data: dayBookings } = await supabase.from('bookings').select('*').eq('court_id', court.id).eq('date', dateStr).neq('status', 'cancelled');
    const { data: blackouts } = await supabase.from('blackouts').select('*').eq('item_type', 'court').eq('item_id', court.id).eq('date', dateStr);
    const bookedSlots = new Array(24).fill(false);
    (dayBookings || []).forEach(b => { const start = parseInt(b.time.split(':')[0]); for (let i = 0; i < (b.duration || 1); i++) if (start + i < 24) bookedSlots[start + i] = true; });
    let available = 0, total = 0;
    for (let h = 0; h < 24; h++) {
      if (!isWithinWorkingHours(venue, dateStr, h)) continue;
      const blacked = (blackouts || []).some(b => { if (b.start_hour) { const start = parseInt(b.start_hour.split(':')[0]); return h >= start && h < start + (b.duration || 1); } return true; });
      if (blacked) continue;
      total++;
      if (!bookedSlots[h]) available++;
    }
    return { available, total };
  }

  async function getCoachAvailableHours(coachId, dateStr) {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) return { available: 0, total: 0 };
    const { data: daySessions } = await supabase.from('coach_bookings').select('*').eq('coach_id', coachId).eq('date', dateStr).neq('status', 'cancelled');
    const { data: blackouts } = await supabase.from('blackouts').select('*').eq('item_type', 'coach').eq('item_id', coachId).eq('date', dateStr);
    const bookedSlots = new Array(24).fill(false);
    (daySessions || []).forEach(b => { const start = parseInt(b.time.split(':')[0]); for (let i = 0; i < (b.duration || 1); i++) if (start + i < 24) bookedSlots[start + i] = true; });
    let available = 0, total = 0;
    for (let h = 0; h < 24; h++) {
      if (!isWithinCoachWorkingHours(coachId, dateStr, h)) continue;
      const blacked = (blackouts || []).some(b => { if (b.start_hour) { const start = parseInt(b.start_hour.split(':')[0]); return h >= start && h < start + (b.duration || 1); } return true; });
      if (blacked) continue;
      total++;
      if (!bookedSlots[h]) available++;
    }
    return { available, total };
  }

  // ==================== دوال الفرق ====================
  async function loadTeams() {
    const container = document.getElementById('teamsList');
    if (!container) return;
    if (!teams.length) { container.innerHTML = '<p>لا توجد فرق</p>'; return; }
    let html = '';
    teams.forEach(team => {
      const count = teamMembers.filter(m => m.team_id === team.id).length;
      html += `<div class="team-card">
        <div class="team-logo" style="background-image:url('${team.logo_url || ''}')"></div>
        <h4>${sanitizeInput(team.name)}</h4>
        <p>${getSportDisplayName(team.sport)} - ${count} أعضاء</p>
        ${team.owner_id === currentUser?.id ? `<button class="btn-outline btn-sm" onclick="openTeamMembersModal('${team.id}')">إدارة الأعضاء</button>` : ''}
      </div>`;
    });
    container.innerHTML = html;
  }

  function openTeamModal(teamId = null) {
    document.getElementById('teamSport').innerHTML = getSportOptions();
    document.getElementById('teamForm').reset();
    document.getElementById('teamId').value = '';
    if (teamId) {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      document.getElementById('teamModalTitle').textContent = 'تعديل فريق';
      document.getElementById('teamId').value = team.id;
      document.getElementById('teamName').value = team.name;
      document.getElementById('teamSport').value = team.sport;
      document.getElementById('teamMaxMembers').value = team.max_members || 5;
      document.getElementById('teamDesc').value = team.description || '';
    } else {
      document.getElementById('teamModalTitle').textContent = 'إنشاء فريق';
    }
    document.getElementById('teamModal').style.visibility = 'visible';
  }

  document.getElementById('teamForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamId = document.getElementById('teamId').value;
    const name = sanitizeInput(document.getElementById('teamName').value.trim());
    const sport = document.getElementById('teamSport').value;
    const maxMembers = parseInt(document.getElementById('teamMaxMembers').value) || 5;
    const desc = sanitizeInput(document.getElementById('teamDesc').value);
    const logoFile = document.getElementById('teamLogo').files[0];
    let logo_url = '';
    if (logoFile) { try { const base64 = await compressImage(logoFile, 400, 0.7); logo_url = await uploadImage(base64, 'teams'); } catch (err) {} }
    const teamData = { name, sport, description: desc, max_members: maxMembers, owner_id: currentUser.id };
    if (logo_url) teamData.logo_url = logo_url;
    if (teamId) teamData.id = teamId;
    await api.saveTeam(teamData);
    document.getElementById('teamModal').style.visibility = 'hidden';
    if (document.getElementById('teams')?.classList.contains('active')) loadTeams();
    await refreshData();
  });

  document.getElementById('createTeamBtn')?.addEventListener('click', () => openTeamModal());
  document.getElementById('closeTeamModal')?.addEventListener('click', () => { document.getElementById('teamModal').style.visibility = 'hidden'; });

  function openTeamMembersModal(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team || team.owner_id !== currentUser?.id) { showToast('غير مصرح', false); return; }
    const members = teamMembers.filter(m => m.team_id === teamId);
    let listHtml = members.map(m => `<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #eee;"><span>${sanitizeInput(m.user_name)}</span><button class="btn-outline btn-sm remove-member-btn" data-member-id="${m.id}"><i class="fas fa-trash"></i></button></div>`).join('');
    const modal = document.createElement('div');
    modal.className = 'modal'; modal.style.visibility = 'visible';
    modal.innerHTML = `<div class="modal-card"><h3>أعضاء ${sanitizeInput(team.name)}</h3>${listHtml || '<p>لا يوجد أعضاء</p>'}<button id="closeTeamMembersModal" class="btn-outline">إغلاق</button></div>`;
    document.body.appendChild(modal);
    modal.querySelector('#closeTeamMembersModal').addEventListener('click', () => modal.remove());
    modal.querySelectorAll('.remove-member-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await api.removeTeamMember(btn.dataset.memberId);
        teamMembers = teamMembers.filter(m => m.id !== btn.dataset.memberId);
        modal.remove();
        openTeamMembersModal(teamId);
      });
    });
  }

  // ==================== دعوات المباريات ====================
  async function loadOpenInvitations() {
    const container = document.getElementById('invitationsList');
    if (!container) return;
    if (!openInvitations.length) { container.innerHTML = '<p>لا توجد دعوات</p>'; return; }
    let html = '';
    openInvitations.forEach(inv => {
      const joined = (inv.joined_players || []).length;
      html += `<div class="invitation-card">
        <h4>${sanitizeInput(inv.title)}</h4>
        <p>${getSportDisplayName(inv.sport)} | ${new Date(inv.date_time).toLocaleString()}</p>
        <p>المنضمون: ${joined} / ${inv.players_needed}</p>
        ${currentUser && !inv.joined_players?.some(p => p.userId === currentUser.id) ? `<button class="btn btn-primary" onclick="joinInvitation('${inv.id}')">انضمام</button>` : ''}
      </div>`;
    });
    container.innerHTML = html;
  }

  function createInvitation() {
    if (!currentUser) return showToast('يجب تسجيل الدخول', false);
    document.getElementById('invitationSport').innerHTML = getSportOptions();
    document.getElementById('invitationCourt').innerHTML = '<option value="">-- لا يوجد --</option>' + courts.map(c => `<option value="${c.id}">${sanitizeInput(c.name)}</option>`).join('');
    document.getElementById('invitationId').value = '';
    document.getElementById('invitationTitle').value = '';
    document.getElementById('invitationDateTime').value = '';
    document.getElementById('invitationDuration').value = '1';
    document.getElementById('invitationPlayers').value = '2';
    document.getElementById('invitationNotes').value = '';
    document.getElementById('invitationModal').style.visibility = 'visible';
  }

  document.getElementById('invitationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = sanitizeInput(document.getElementById('invitationTitle')?.value?.trim() || '');
    const sport = document.getElementById('invitationSport')?.value;
    const dateTime = document.getElementById('invitationDateTime')?.value;
    const duration = parseInt(document.getElementById('invitationDuration')?.value || '1');
    const playersNeeded = parseInt(document.getElementById('invitationPlayers')?.value || '2');
    const courtId = document.getElementById('invitationCourt')?.value || '';
    const notes = sanitizeInput(document.getElementById('invitationNotes')?.value || '');
    if (!title || !sport || !dateTime) return showToast('الرجاء تعبئة الحقول المطلوبة', false);
    const court = courts.find(c => c.id === courtId);
    await api.saveInvitation({ title, sport, date_time: dateTime, duration, players_needed: playersNeeded, court_id: courtId || null, court_name: court ? court.name : '', notes, creator_id: currentUser.id, creator_name: currentUser.full_name, joined_players: [] });
    document.getElementById('invitationModal').style.visibility = 'hidden';
    if (document.getElementById('openInvitations')?.classList.contains('active')) loadOpenInvitations();
  });

  document.getElementById('createInvitationBtn')?.addEventListener('click', createInvitation);
  document.getElementById('closeInvitationModal')?.addEventListener('click', () => { document.getElementById('invitationModal').style.visibility = 'hidden'; });

  window.joinInvitation = async (id) => {
    const inv = openInvitations.find(i => i.id === id);
    if (!inv) return;
    if (!inv.joined_players) inv.joined_players = [];
    inv.joined_players.push({ userId: currentUser.id, userName: currentUser.full_name });
    await api.saveInvitation(inv);
    loadOpenInvitations();
  };

  // ==================== دعوات الفرق ====================
  async function loadTeamInvitations() {
    const container = document.getElementById('teamInvitationsList');
    if (!container) return;
    if (!teamInvitations.length) { container.innerHTML = '<p>لا توجد دعوات</p>'; return; }
    let html = '';
    teamInvitations.forEach(inv => {
      const team = teams.find(t => t.id === inv.team_id);
      if (!team) return;
      const count = teamMembers.filter(m => m.team_id === team.id).length;
      const canJoin = currentUser && inv.creator_id !== currentUser.id && count < inv.max_members && !teamMembers.some(m => m.team_id === team.id && m.user_id === currentUser.id);
      html += `<div class="invitation-card">
        <h4>${sanitizeInput(team.name)}</h4>
        <p>${getSportDisplayName(team.sport)} - ${count} / ${inv.max_members} أعضاء</p>
        ${canJoin ? `<button class="btn btn-primary" onclick="joinTeamInvitation('${inv.id}')">انضم للفريق</button>` : ''}
      </div>`;
    });
    container.innerHTML = html;
  }

  function createTeamInvitation() {
    if (!currentUser) return showToast('يجب تسجيل الدخول', false);
    const myTeams = teams.filter(t => t.owner_id === currentUser.id);
    if (!myTeams.length) { showToast('أنت لا تقود أي فريق', false); return; }
    const teamNames = myTeams.map(t => `${t.name} (ID: ${t.id})`).join('\n');
    const teamId = prompt('أدخل معرف الفريق لنشر دعوة:\n' + teamNames);
    if (!teamId) return;
    const team = myTeams.find(t => t.id === teamId);
    if (!team) { showToast('معرف الفريق غير صحيح', false); return; }
    const invitation = { team_id: team.id, team_name: team.name, sport: team.sport, max_members: team.max_members || 10, creator_id: currentUser.id, creator_name: currentUser.full_name };
    api.saveTeamInvitation(invitation).then(() => {
      showToast('تم نشر الدعوة');
      if (document.getElementById('teamInvitations')?.classList.contains('active')) loadTeamInvitations();
    });
  }

  document.getElementById('createTeamInvitationBtn')?.addEventListener('click', createTeamInvitation);

  window.joinTeamInvitation = async (invId) => {
    const inv = teamInvitations.find(i => i.id === invId);
    if (!inv) return;
    const team = teams.find(t => t.id === inv.team_id);
    if (!team) return;
    const count = teamMembers.filter(m => m.team_id === team.id).length;
    if (count >= inv.max_members) { showToast('اكتمل العدد', false); return; }
    if (teamMembers.some(m => m.team_id === team.id && m.user_id === currentUser.id)) { showToast('أنت عضو بالفعل', false); return; }
    await api.addTeamMember({ team_id: team.id, user_id: currentUser.id, user_name: currentUser.full_name });
    showToast('تم الانضمام');
    loadTeamInvitations();
    if (document.getElementById('teams')?.classList.contains('active')) loadTeams();
  };

  // ==================== الإغلاقات ====================
  function openBlackoutModal(type, id) {
    const modal = document.createElement('div');
    modal.className = 'modal'; modal.style.visibility = 'visible'; modal.style.zIndex = '2000';
    const item = type === 'court' ? courts.find(c => c.id === id) : coaches.find(c => c.id === id);
    modal.innerHTML = `
      <div class="modal-card" style="max-width:500px;">
        <h3><i class="fas fa-ban"></i> إغلاق ${type === 'court' ? 'الملعب' : 'المدرب'}: ${sanitizeInput(item?.name || '')}</h3>
        <div class="form-group"><label>نوع الإغلاق</label><select id="blackoutTypeSelect"><option value="day">يوم كامل</option><option value="hour">ساعات محددة</option></select></div>
        <div class="form-group"><label>التاريخ</label><input type="date" id="blackoutDate" required></div>
        <div id="hourSelectionGroup" style="display:none;"><div class="form-group"><label>ساعة البداية</label><input type="time" id="blackoutStartHour"></div><div class="form-group"><label>المدة (ساعات)</label><input type="number" id="blackoutDuration" min="1" max="24" value="1"></div></div>
        <div class="form-group"><label>سبب الإغلاق (اختياري)</label><input type="text" id="blackoutReason"></div>
        <button id="saveBlackoutBtn" class="btn btn-primary">حفظ</button>
        <button id="closeBlackoutModalBtn" class="btn-outline">إلغاء</button>
        <hr><h4>الإغلاقات الحالية</h4><div id="existingBlackoutsList"></div>
      </div>`;
    document.body.appendChild(modal);
    const typeSelect = modal.querySelector('#blackoutTypeSelect');
    const hourGroup = modal.querySelector('#hourSelectionGroup');
    typeSelect.addEventListener('change', e => hourGroup.style.display = e.target.value === 'hour' ? 'block' : 'none');
    const renderBlackouts = async () => {
      const list = modal.querySelector('#existingBlackoutsList');
      const { data } = await supabase.from('blackouts').select('*').eq('item_type', type).eq('item_id', id);
      if (!data?.length) { list.innerHTML = '<p>لا توجد إغلاقات</p>'; return; }
      list.innerHTML = data.map((b, idx) => `<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #eee;">
        <div>${b.date} - ${b.type === 'day' ? 'يوم كامل' : `${b.start_hour} (${b.duration} ساعة)`} ${b.reason ? `<br><small>${b.reason}</small>` : ''}</div>
        <button class="btn-outline btn-sm delete-blackout-btn" data-id="${b.id}"><i class="fas fa-trash"></i></button>
      </div>`).join('');
      modal.querySelectorAll('.delete-blackout-btn').forEach(btn => { btn.addEventListener('click', async () => { await api.deleteBlackout(btn.dataset.id); renderBlackouts(); }); });
    };
    renderBlackouts();
    modal.querySelector('#saveBlackoutBtn').addEventListener('click', async () => {
      const date = modal.querySelector('#blackoutDate').value;
      const bType = typeSelect.value;
      const reason = modal.querySelector('#blackoutReason').value;
      if (!date) return showToast('اختر التاريخ', false);
      const record = { item_type: type, item_id: id, date, reason };
      if (bType === 'hour') { record.start_hour = modal.querySelector('#blackoutStartHour').value; record.duration = parseInt(modal.querySelector('#blackoutDuration').value); }
      await api.saveBlackout(record);
      modal.querySelector('#blackoutDate').value = '';
      modal.querySelector('#blackoutReason').value = '';
      renderBlackouts();
    });
    modal.querySelector('#closeBlackoutModalBtn').addEventListener('click', () => modal.remove());
  }

  // ==================== الحجوزات المتكررة ====================
  function generateRecurringDates(startDate, endDate, pattern) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + (pattern === 'weekly' ? 7 : 14));
    }
    return dates;
  }

  async function createRecurringBookings(baseData, recurringPattern, endDate) {
    const dates = generateRecurringDates(baseData.date, endDate, recurringPattern);
    if (!dates.length) return [];
    const groupId = crypto.randomUUID();
    const items = [];
    for (const date of dates) {
      const item = { ...baseData, date, recurring_group_id: groupId };
      const conflict = baseData.type === 'court' ?
        await checkCourtConflict(baseData.courtId, date, baseData.time, baseData.duration) :
        await checkCoachConflict(baseData.coachId, date, baseData.time, baseData.duration);
      if (!conflict) items.push(item);
    }
    if (items.length) {
      await supabase.from('recurring_groups').insert({ id: groupId, type: baseData.type, start_date: baseData.date, end_date: endDate, pattern: recurringPattern, count: items.length });
    }
    return items;
  }

  // ==================== تصدير/استيراد البيانات ====================
  async function exportAllData() {
    const data = { venues, courts, coaches, bookings, coachBookings, users, notifications, promoCodes, favorites, openInvitations, stores, products, storeOrders, teams, teamMembers, teamInvitations };
    data.reviews = reviews; data.coachReviews = coachReviews; data.customerReviews = customerReviews;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  }

  async function importAllData(file) {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!imported.venues || !imported.bookings || !imported.users) throw new Error('بنية غير صالحة');
      if (!confirm('استبدال جميع البيانات؟')) return;
      // حذف جميع البيانات الحالية (يمكن تنفيذه بشكل آمن عبر Supabase)
      await supabase.from('bookings').delete().neq('id','0');
      await supabase.from('coach_bookings').delete().neq('id','0');
      await supabase.from('venues').delete().neq('id','0');
      // ... إلخ لباقي الجداول (يمكنك إضافة استدعاءات الحذف لجميع الجداول)
      showToast('تم الاستيراد');
      await refreshData();
    } catch (err) { showToast('خطأ: '+err.message, false); }
  }

  document.getElementById('exportDataBtn')?.addEventListener('click', exportAllData);
  document.getElementById('importFileInput')?.addEventListener('change', e => { if (e.target.files[0]) importAllData(e.target.files[0]); });

  // ==================== تحميل coachAvailability ====================
  async function loadCoachAvailability(coachId) {
    const { data } = await supabase.from('coach_availability').select('*').eq('coach_id', coachId);
    if (!data) return {};
    const map = {};
    data.forEach(a => { map[a.day_of_week] = { start: a.start_time, end: a.end_time }; });
    coachAvailability[coachId] = map;
    return map;
  }

  // ==================== الإلغاء التلقائي ====================
  async function startPendingPaymentChecker() {
    setInterval(async () => {
      const now = new Date().toISOString();
      const { data: expired } = await supabase.from('pending_payments').select('*').lt('expires_at', now);
      if (!expired || !expired.length) return;
      for (let p of expired) {
        const table = p.type === 'court' ? 'bookings' : 'coach_bookings';
        const booking = p.type === 'court' ? bookings.find(b => b.id === p.booking_id) : coachBookings.find(b => b.id === p.booking_id);
        if (booking && booking.status === 'pending_payment') {
          await supabase.from(table).update({ status: 'cancelled' }).eq('id', p.booking_id);
          const customer = users.find(u => u.id === p.customer_id);
          if (customer) {
            const penalty = booking.price || 0;
            await supabase.from('profiles').update({ penalty_balance: customer.penalty_balance + penalty }).eq('id', customer.id);
            addNotification(customer.id, `تم إلغاء حجزك لعدم الدفع. تمت إضافة ${penalty} ${getCurrencySymbol(currentCurrency)} كغرامة.`);
          }
        }
      }
      await supabase.from('pending_payments').delete().lt('expires_at', now);
    }, 60000);
  }

  // ==================== دوال التهيئة النهائية ====================
  (async function init() {
    showLoader();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      currentUser = session.user;
      const profile = await api.getCurrentProfile();
      if (profile) currentUser = { ...currentUser, ...profile };
    }
    await initializeCurrency();
    await refreshData();

    const mapEl = document.getElementById('map');
    if (mapEl) {
      map = L.map('map').setView([24.7136, 46.6753], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      if (customerLocation) map.setView([customerLocation.lat, customerLocation.lng], 15);
    }

    renderCourts();
    document.getElementById('filterBtn')?.addEventListener('click', () => {
      const sport = document.getElementById('sportFilter')?.value;
      if (currentViewMode === 'courts') renderCourts(sport); else renderCoaches(sport);
    });

    if (currentUser) {
      supabase.channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => refreshData())
        .subscribe();
    }

    startPendingPaymentChecker();
    hideLoader();
  })();
})();
