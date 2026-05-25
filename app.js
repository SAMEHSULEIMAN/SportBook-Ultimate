// ================================================
//  SportBook Ultimate - Supabase Edition
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

  // دالة ضغط الصور (تستخدم قبل الرفع)
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
    // --- المستخدمين ---
    async getUsers() { const { data } = await supabase.from('profiles').select('*'); return data; },
    async saveUser(user) { const { data, error } = await supabase.from('profiles').upsert(user).select(); if (error) throw error; return data; },
    async getCurrentProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    },
    // --- المنشآت ---
    async getVenues() { const { data } = await supabase.from('venues').select('*'); return data; },
    async saveVenue(venue) {
      if (venue.image_url?.startsWith('data:')) venue.image_url = await uploadImage(venue.image_url, 'venues');
      const { data, error } = await supabase.from('venues').upsert(venue).select();
      if (error) throw error;
      return data;
    },
    async deleteVenue(id) { await supabase.from('venues').delete().eq('id', id); },
    // --- الملاعب ---
    async getCourts() { const { data } = await supabase.from('courts').select('*'); return data; },
    async saveCourt(court) { const { data, error } = await supabase.from('courts').upsert(court).select(); if (error) throw error; return data; },
    async deleteCourt(id) { await supabase.from('courts').delete().eq('id', id); },
    // --- المدربون ---
    async getCoaches() { const { data } = await supabase.from('coaches').select('*'); return data; },
    async saveCoach(coach) {
      if (coach.image_url?.startsWith('data:')) coach.image_url = await uploadImage(coach.image_url, 'coaches');
      const { data, error } = await supabase.from('coaches').upsert(coach).select();
      if (error) throw error;
      return data;
    },
    // --- الحجوزات ---
    async getBookings() { const { data } = await supabase.from('bookings').select('*'); return data; },
    async getCoachBookings() { const { data } = await supabase.from('coach_bookings').select('*'); return data; },
    async createBooking(booking) { await supabase.from('bookings').insert(booking); },
    async createCoachBooking(booking) { await supabase.from('coach_bookings').insert(booking); },
    async cancelBooking(id) { await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id); },
    async cancelCoachBooking(id) { await supabase.from('coach_bookings').update({ status: 'cancelled' }).eq('id', id); },
    // --- الإشعارات ---
    async getNotifications(userId) { const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }); return data; },
    async addNotification(notif) { await supabase.from('notifications').insert(notif); },
    async markNotificationsRead(userId) { await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false); },
    // --- الكوبونات ---
    async getPromoCodes() { const { data } = await supabase.from('promo_codes').select('*'); return data; },
    async savePromoCode(promo) { const { data, error } = await supabase.from('promo_codes').upsert(promo).select(); if (error) throw error; return data; },
    async deletePromoCode(code) { await supabase.from('promo_codes').delete().eq('code', code); },
    // --- المفضلة ---
    async getFavorites() { const { data } = await supabase.from('favorites').select('*'); return data; },
    async addFavorite(fav) { const { data } = await supabase.from('favorites').insert(fav).select(); return data; },
    async removeFavorite(id) { await supabase.from('favorites').delete().eq('id', id); },
    // --- الدعوات ---
    async getOpenInvitations() { const { data } = await supabase.from('open_invitations').select('*'); return data; },
    async saveInvitation(inv) { const { data } = await supabase.from('open_invitations').upsert(inv).select(); return data; },
    // --- المتاجر والمنتجات ---
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
    // --- الفرق والأعضاء ---
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
    // --- التقييمات ---
    async getVenueReviews() { const { data } = await supabase.from('venue_reviews').select('*'); return data; },
    async getCoachReviews() { const { data } = await supabase.from('coach_reviews').select('*'); return data; },
    async getCustomerReviews() { const { data } = await supabase.from('customer_reviews').select('*'); return data; },
    async addVenueReview(review) { await supabase.from('venue_reviews').insert(review); },
    async addCoachReview(review) { await supabase.from('coach_reviews').insert(review); },
    async addCustomerReview(review) { await supabase.from('customer_reviews').insert(review); },
    // --- تفضيلات المستخدم ---
    async getUserPreferences(userId) {
      const { data } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single();
      return data;
    },
    async saveUserPreferences(prefs) { await supabase.from('user_preferences').upsert(prefs); },
    // --- الإغلاقات ---
    async getBlackouts() { const { data } = await supabase.from('blackouts').select('*'); return data; },
    async saveBlackout(blackout) { await supabase.from('blackouts').insert(blackout); },
    async deleteBlackout(id) { await supabase.from('blackouts').delete().eq('id', id); },
    // --- الرياضات المخصصة ---
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
  let reviews = {}, coachReviews = {}, customerReviews = {};
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
      updateTimelineForCourt(court, today);
      document.getElementById('bookingDate').onchange = e => updateTimelineForCourt(court, e.target.value);
    } else {
      const coach = coaches.find(c => c.id === targetId);
      if (!coach) return;
      document.getElementById('bookingCourtId').value = '';
      document.getElementById('bookingCoachId').value = targetId;
      document.getElementById('bookingVenueId').value = '';
      updateTimelineForCoach(targetId, today);
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
    let html = '';
    for (let h = 0; h < 24; h++) {
      const periodIdx = PERIODS.findIndex(p => h >= p.start && h < p.end);
      const periodColor = PERIODS[periodIdx]?.color || '#cbd5e1';
      let statusColor = '#10b981'; let statusText = 'متاح';
      const booked = dayBookings.some(b => {
        const start = parseInt(b.time.split(':')[0]);
        return h >= start && h < start + b.duration;
      });
      if (booked) { statusColor = '#ef4444'; statusText = 'محجوز'; }
      const price = (court.pricing || venue.pricing || [50])[periodIdx] || 50;
      html += `<div class="hour-slot" title="${h}:00 - ${h+1}:00 | ${PERIODS[periodIdx]?.name || ''} | ${statusText} | ${price} ${currencySymbol}">
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
    let html = '';
    for (let h = 0; h < 24; h++) {
      const periodIdx = PERIODS.findIndex(p => h >= p.start && h < p.end);
      const periodColor = PERIODS[periodIdx]?.color || '#cbd5e1';
      let statusColor = '#10b981'; let statusText = 'متاح';
      const booked = daySessions.some(b => {
        const start = parseInt(b.time.split(':')[0]);
        return h >= start && h < start + b.duration;
      });
      if (booked) { statusColor = '#ef4444'; statusText = 'محجوز'; }
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
          price += (court.pricing || venue.pricing || [50])[periodIdx] || 50;
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
          ${customer?.phone ? `<a class="whatsapp-link btn-outline btn-sm" href="#" data-phone="${customer.phone}">واتساب</a>` : ''}
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
      <div class="courts-panel"><h4>الملاعب <button class="btn-outline btn-sm" id="addNewCourtBtn">+ إضافة</button></h4><div id="courtsList">${courtsHtml}</div></div>
      <div>${bookingsHtml}</div>
    `;

    document.getElementById('editVenueBtn')?.addEventListener('click', () => openEditVenueModal(venue.id));
    document.getElementById('addNewCourtBtn')?.addEventListener('click', () => openCourtModal(null, venue.id));
    detail.querySelectorAll('.edit-court-btn').forEach(btn => btn.addEventListener('click', e => openCourtModal(btn.dataset.courtId)));
    detail.querySelectorAll('.delete-court-btn').forEach(btn => btn.addEventListener('click', async e => {
      if (confirm('حذف الملعب؟')) {
        await api.deleteCourt(btn.dataset.courtId);
        courts = courts.filter(c => c.id !== btn.dataset.courtId);
        renderVenueDetailForOwner(venue);
      }
    }));
    detail.querySelectorAll('.approve-booking-btn').forEach(btn => btn.addEventListener('click', async () => {
      await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', btn.dataset.id);
      showToast('تم القبول');
      renderVenueDetailForOwner(venue);
    }));
    detail.querySelectorAll('.reject-booking-btn').forEach(btn => btn.addEventListener('click', async () => {
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', btn.dataset.id);
      showToast('تم الرفض');
      renderVenueDetailForOwner(venue);
    }));
    detail.querySelectorAll('.cancel-booking-btn').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('إلغاء الحجز؟')) {
        await api.cancelBooking(btn.dataset.id);
        renderVenueDetailForOwner(venue);
      }
    }));
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
      <h3>${sanitizeInput(coach.name)}</h3>
      <p>الرياضة: ${getSportDisplayName(coach.sport)} | سعر الساعة: ${coach.hourly_rate} ${currencySymbol} | الإيرادات: ${totalRevenue} ${currencySymbol}</p>
      <h4>الجلسات</h4>`;
    sessions.forEach(s => {
      const customer = users.find(u => u.id === s.customer_id);
      html += `<div style="border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:8px;">
        <div><strong>${sanitizeInput(customer?.full_name || '')}</strong></div>
        <div>${s.date} | ${s.time} (${s.duration} ساعة) | ${s.price} ${currencySymbol}</div>
        <div class="booking-actions">
          <button class="btn-outline btn-sm cancel-coach-booking-btn" data-id="${s.id}">إلغاء</button>
          ${customer?.phone ? `<a class="whatsapp-link btn-outline btn-sm" href="#" data-phone="${customer.phone}">واتساب</a>` : ''}
          ${!s.customer_rated_by_provider ? `<button class="btn-outline btn-sm rate-customer-btn" data-booking-id="${s.id}">تقييم العميل</button>` : ''}
        </div>
      </div>`;
    });
    detail.innerHTML = html;
    detail.querySelectorAll('.cancel-coach-booking-btn').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('إلغاء الجلسة؟')) { await api.cancelCoachBooking(btn.dataset.id); renderCoachDetail(coach); }
    }));
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

  // ==================== دوال إضافية للأدمن ====================
  window.openEditVenueModal = (id) => { /* ... */ };
  window.deleteVenue = async (id) => { await api.deleteVenue(id); loadAdminDashboard('venues'); };
  window.toggleUserBlock = async (id, block) => { await supabase.from('profiles').update({ is_blocked: block }).eq('id', id); loadAdminDashboard('users'); };
  window.openStoreModal = (id) => { /* ... */ };
  window.deleteStore = async (id) => { await api.deleteStore(id); loadAdminDashboard('stores'); };
  window.openProductModal = (id) => { /* ... */ };
  window.deleteProduct = async (id) => { await api.deleteProduct(id); loadAdminDashboard('products'); };
  window.deleteInvitation = async (id) => { await supabase.from('open_invitations').delete().eq('id', id); loadAdminDashboard('invitations'); };

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

  // ==================== الفرق والدعوات ====================
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

  window.joinInvitation = async (id) => {
    const inv = openInvitations.find(i => i.id === id);
    if (!inv) return;
    if (!inv.joined_players) inv.joined_players = [];
    inv.joined_players.push({ userId: currentUser.id, userName: currentUser.full_name });
    await api.saveInvitation(inv);
    loadOpenInvitations();
  };

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

  // ==================== التهيئة النهائية ====================
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

    hideLoader();
  })();
})();