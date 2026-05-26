// app.js - SportBook Ultimate (Supabase Edition) - الجزء الأول
(function(){
  "use strict";

  // ========== إعدادات Supabase ==========
  const SUPABASE_URL = 'https://your-project-id.supabase.co'; // ⚠️ استبدلها
  const SUPABASE_ANON_KEY = 'your-anon-key'; // ⚠️ استبدلها
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ========== الثوابت ==========
  const ADMIN_CODE = 'admin123';
  const DEFAULT_SPORTS = ['football', 'basketball', 'tennis', 'padel'];
  const BOOKING_FEE_PERCENTAGE = 0.15;
  const STORE_FEE_PERCENTAGE = 0.10;
  const PAYMENT_TIMEOUT_MINUTES = 15;
  const PERIODS = [ /* ... */ ];
  const WEEKDAYS = [ /* ... */ ];
  const CURRENCIES = { /* ... */ };

  // ========== دوال مساعدة ==========
  function sanitizeInput(str) { /* ... */ }
  function showToast(msg, isSuccess = true, duration = 3000) { /* ... */ }
  function showLoader() { /* ... */ }
  function hideLoader() { /* ... */ }
  function compressImage(file, maxWidth = 800, quality = 0.7) { /* ... */ }
  async function uploadImageToSupabase(base64String, bucket, fileName) { /* ... */ }

  // ========== i18n (القاموس الكامل) ==========
  let currentLanguage = 'ar';
  const i18n = { ar: { /* ... */ }, en: { /* ... */ } };
  function t(key) { return i18n[currentLanguage]?.[key] || key; }
  function setLanguage(lang) { /* ... */ }
  function updateUITranslations() { /* ... */ }
  function initI18n() { /* ... */ }
  document.addEventListener('DOMContentLoaded', initI18n);

  // ========== المتغيرات العامة ==========
  let currentUser = null;
  let venues = [], bookings = [], users = [], notifications = [], customSports = [], cart = [], reviews = [], blackouts = [], courts = [];
  let coaches = [], coachBookings = [], coachAvailability = {}, coachReviews = [];
  let promoCodes = [], favorites = [], recurringGroups = [], pendingPayments = [];
  let manualLocation = null;
  let customerReviews = [];
  let openInvitations = [];
  let stores = [], products = [], storeCart = [], storeOrders = [];
  let teams = [], teamMembers = [], teamInvitations = [];
  let currentCurrency = 'SAR';
  let map, miniMap, editMiniMap, coachMap;
  let customerLocation = null;
  let pendingConfirmCallback = null;
  let venueMarker = null, editMarker = null, coachMarker = null;
  let pendingBooking = null;
  let selectedRating = 0;
  let currentViewMode = 'courts';

  // ========== المصادقة ==========
  async function login(email, password) { /* ... */ }
  async function register(email, password, fullName, role) { /* ... */ }
  async function logout() { /* ... */ }
  async function getCurrentSession() { /* ... */ }
  supabase.auth.onAuthStateChange(async (event, session) => { /* ... */ });

  // ========== كائن API ==========
  const api = {
    // المنشآت
    async getVenues() { const { data } = await supabase.from('venues').select('*'); return data || []; },
    async saveVenue(venue) { const { data: d } = await supabase.from('venues').insert([venue]).select(); return d?.[0]; },
    async updateVenue(id, updates) { await supabase.from('venues').update(updates).eq('id', id); },
    async deleteVenue(id) { await supabase.from('venues').delete().eq('id', id); },
    // الملاعب
    async getCourts() { const { data } = await supabase.from('courts').select('*'); return data || []; },
    async saveCourt(court) { await supabase.from('courts').insert([court]); },
    async updateCourt(id, updates) { await supabase.from('courts').update(updates).eq('id', id); },
    async deleteCourt(id) { await supabase.from('courts').delete().eq('id', id); },
    // الحجوزات
    async getBookings() { const { data } = await supabase.from('bookings').select('*'); return data || []; },
    async saveBooking(booking) { const { data: d } = await supabase.from('bookings').insert([booking]).select(); return d?.[0]; },
    async updateBooking(id, updates) { await supabase.from('bookings').update(updates).eq('id', id); },
    // ... (باقي الجداول بنفس النمط: coaches, coach_bookings, profiles, reviews, coach_reviews, customer_reviews, promos, favorites, open_invitations, stores, products, store_cart, store_orders, teams, team_members, team_invitations, blackouts, notifications, custom_sports, pending_payments, user_settings)
  };

  // ========== تحميل البيانات ==========
  async function refreshData() { /* Promise.all لجلب جميع الجداول */ }

  // ========== دوال الواجهة والتنقل ==========
  function updateUIBasedOnRole() { /* ... */ }
  function updateUserArea() { /* ... */ }
  function updateNavigation() { /* ... */ }
  function switchSection(sectionId) { /* ... */ }
  function showConfirm(msg, cb) { /* ... */ }

  // ========== فتح مودال المصادقة ==========
  function openAuthModal(mode) { /* ... */ }
  document.getElementById('authForm')?.addEventListener('submit', async e => { /* ... */ });
  document.getElementById('switchAuthModeBtn')?.addEventListener('click', () => { /* ... */ });
  document.getElementById('closeAuthModal')?.addEventListener('click', () => { /* ... */ });

    // ========== الموقع والخرائط ==========
  function setCustomerLocation(lat, lng, source = 'gps') {
    customerLocation = { lat, lng };
    if (source === 'manual' && currentUser) {
      api.saveUserSettings(currentUser.id, { manual_location: { lat, lng } }).catch(() => {});
    }
    if (map) {
      map.setView([lat, lng], 15);
      updateMapMarkers();
    }
    if (document.getElementById('home')?.classList.contains('active')) {
      if (currentViewMode === 'courts') renderCourts(); else renderCoaches();
    }
  }

  document.getElementById('getCustomerLocationBtn')?.addEventListener('click', () => {
    if (!navigator.geolocation) return showToast('متصفحك لا يدعم GPS', false);
    navigator.geolocation.getCurrentPosition(pos => {
      setCustomerLocation(pos.coords.latitude, pos.coords.longitude, 'gps');
      showToast('تم تحديد موقعك');
    }, () => showToast('فشل تحديد الموقع', false));
  });

  document.getElementById('searchLocationBtn')?.addEventListener('click', async () => {
    const query = document.getElementById('manualLocationInput')?.value?.trim();
    if (!query) return showToast('الرجاء إدخال اسم مدينة أو عنوان', false);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setCustomerLocation(parseFloat(data[0].lat), parseFloat(data[0].lon), 'manual');
        showToast(t('locationFound') + ': ' + data[0].display_name);
      } else {
        showToast(t('locationNotFound'), false);
      }
    } catch (e) {
      showToast('حدث خطأ أثناء البحث عن الموقع', false);
    }
  });

  document.getElementById('resetLocationBtn')?.addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setCustomerLocation(pos.coords.latitude, pos.coords.longitude, 'gps');
        if (document.getElementById('manualLocationInput')) document.getElementById('manualLocationInput').value = '';
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

  // ========== الخرائط المصغرة للتسجيل ==========
  function initRegisterMiniMap() {
    const mapEl = document.getElementById('registerMiniMap');
    if (!mapEl || miniMap) return;
    miniMap = L.map('registerMiniMap').setView([24.7136, 46.6753], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
    venueMarker = L.marker([24.7136, 46.6753], { draggable: true }).addTo(miniMap);
    function update() {
      const ll = venueMarker.getLatLng();
      const latEl = document.getElementById('venueLat'), lngEl = document.getElementById('venueLng');
      if (latEl) latEl.value = ll.lat.toFixed(6);
      if (lngEl) lngEl.value = ll.lng.toFixed(6);
    }
    venueMarker.on('dragend', update);
    miniMap.on('click', e => { venueMarker.setLatLng(e.latlng); update(); });
    update();
  }

  function initCoachRegisterMap() {
    const mapEl = document.getElementById('coachRegisterMap');
    if (!mapEl || coachMap) return;
    coachMap = L.map('coachRegisterMap').setView([24.7136, 46.6753], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(coachMap);
    coachMarker = L.marker([24.7136, 46.6753], { draggable: true }).addTo(coachMap);
    function update() {
      const ll = coachMarker.getLatLng();
      const latEl = document.getElementById('coachLat'), lngEl = document.getElementById('coachLng');
      if (latEl) latEl.value = ll.lat.toFixed(6);
      if (lngEl) lngEl.value = ll.lng.toFixed(6);
    }
    coachMarker.on('dragend', update);
    coachMap.on('click', e => { coachMarker.setLatLng(e.latlng); update(); });
    update();
  }

  document.getElementById('getVenueLocationBtn')?.addEventListener('click', () => {
    if (!navigator.geolocation) return showToast('GPS غير مدعوم', false);
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      if (miniMap) { miniMap.setView([lat, lng], 15); venueMarker.setLatLng([lat, lng]); }
      const latEl = document.getElementById('venueLat'), lngEl = document.getElementById('venueLng');
      if (latEl) latEl.value = lat;
      if (lngEl) lngEl.value = lng;
      showToast('تم تحديد الموقع');
    }, () => showToast('فشل', false));
  });

  document.getElementById('getCoachLocationBtn')?.addEventListener('click', () => {
    if (!navigator.geolocation) return showToast('GPS غير مدعوم', false);
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      if (coachMap) { coachMap.setView([lat, lng], 15); coachMarker.setLatLng([lat, lng]); }
      const latEl = document.getElementById('coachLat'), lngEl = document.getElementById('coachLng');
      if (latEl) latEl.value = lat;
      if (lngEl) lngEl.value = lng;
      showToast('تم تحديد الموقع');
    }, () => showToast('فشل', false));
  });

  // ========== عرض الملاعب والمدربين ==========
  async function renderCourts(filterSport = 'all') {
    const container = document.getElementById('venuesList');
    if (!container) return;
    let filteredCourts = courts;
    if (filterSport !== 'all') {
      filteredCourts = courts.filter(c => {
        if (c.multi_sport && c.allowed_sports) {
          return c.allowed_sports.includes(filterSport);
        }
        return c.sport === filterSport;
      });
    }
    if (!filteredCourts.length) { container.innerHTML = '<div class="card">لا توجد ملاعب متاحة</div>'; return; }

    let sortedCourts = [...filteredCourts];
    if (customerLocation) {
      sortedCourts.sort((a, b) => {
        const va = venues.find(v => v.id === a.venue_id);
        const vb = venues.find(v => v.id === b.venue_id);
        if (!va?.lat || !vb?.lat) return 0;
        const dA = getDistanceFromLatLonInKm(customerLocation.lat, customerLocation.lng, va.lat, va.lng);
        const dB = getDistanceFromLatLonInKm(customerLocation.lat, customerLocation.lng, vb.lat, vb.lng);
        return dA - dB;
      });
    }

    const symbol = getCurrencySymbol(currentCurrency);
    let html = '';
    for (let court of sortedCourts) {
      const venue = venues.find(v => v.id === court.venue_id);
      if (!venue) continue;

      let distInfo = '';
      if (customerLocation && venue.lat) {
        const dist = getDistanceFromLatLonInKm(customerLocation.lat, customerLocation.lng, venue.lat, venue.lng).toFixed(1);
        distInfo = `<div class="venue-distance"><i class="fas fa-route"></i> يبعد ${dist} كم (${calculateTravelTime(parseFloat(dist))} دقيقة)</div>`;
      }

      let prices = court.pricing;
      if (typeof prices === 'string') prices = JSON.parse(prices);
      if (!prices || !Array.isArray(prices)) prices = [50,50,50,50];
      const minPrice = Math.min(...prices);
      const sportDisplay = court.multi_sport ? (court.allowed_sports || []).map(s => getSportDisplayName(s)).join(' / ') : getSportDisplayName(court.sport);
      const favClass = favorites.some(f => f.user_id === currentUser?.id && f.item_type === 'venue' && f.item_id === venue.id) ? 'fas' : 'far';

      html += `<div class="venue-card">
        <div class="venue-img" style="background-image:url('${venue.image_url || 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg'}');">
          <span class="venue-type">${sportDisplay}</span>
          <button class="favorite-btn" onclick="window.toggleFavorite('venue', '${venue.id}')"><i class="${favClass} fa-heart" style="color:#ef4444;"></i></button>
        </div>
        <div class="venue-info">
          <div class="venue-header"><div class="venue-name">${sanitizeInput(court.name)}</div></div>
          <div style="color:#64748b; margin-bottom:8px;">${sanitizeInput(venue.name)}</div>
          <div class="venue-pricing"><i class="fas fa-tag"></i> من ${minPrice} ${symbol}/ساعة</div>
          ${distInfo}
          <button class="btn btn-primary book-btn" data-court-id="${court.id}" style="margin-top:12px;">احجز الآن</button>
        </div>
      </div>`;
    }
    container.innerHTML = html;
    container.querySelectorAll('.book-btn').forEach(b => b.addEventListener('click', e => openBookingModal(b.dataset.courtId, 'court')));
    updateMapMarkers();
  }

  // renderCoaches مشابهة لـ renderCourts
  async function renderCoaches(filterSport = 'all') {
    const container = document.getElementById('venuesList');
    if (!container) return;
    let filtered = filterSport === 'all' ? coaches : coaches.filter(c => c.sport === filterSport);
    if (!filtered.length) { container.innerHTML = '<div class="card">لا يوجد مدربين متاحين</div>'; return; }
    const symbol = getCurrencySymbol(currentCurrency);
    let html = '';
    for (let coach of filtered) {
      let distInfo = '';
      if (customerLocation && coach.lat) {
        const dist = getDistanceFromLatLonInKm(customerLocation.lat, customerLocation.lng, coach.lat, coach.lng).toFixed(1);
        distInfo = `<div class="coach-distance"><i class="fas fa-route"></i> يبعد ${dist} كم (${calculateTravelTime(parseFloat(dist))} دقيقة)</div>`;
      }
      const favClass = favorites.some(f => f.user_id === currentUser?.id && f.item_type === 'coach' && f.item_id === coach.id) ? 'fas' : 'far';
      html += `<div class="coach-card">
        <div class="coach-img" style="background-image:url('${coach.image_url || 'https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg'}');">
          <span class="coach-type">${getSportDisplayName(coach.sport)}</span>
          <button class="favorite-btn" onclick="window.toggleFavorite('coach', '${coach.id}')"><i class="${favClass} fa-heart" style="color:#ef4444;"></i></button>
        </div>
        <div class="coach-info">
          <div class="coach-name">${sanitizeInput(coach.name)}</div>
          <div class="coach-sport">${getSportDisplayName(coach.sport)}</div>
          <div class="coach-pricing"><i class="fas fa-tag"></i> ${coach.hourly_rate} ${symbol}/ساعة</div>
          ${distInfo}
          <button class="btn btn-primary book-coach-btn" data-coach-id="${coach.id}" style="margin-top:12px;">احجز جلسة</button>
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

  // ========== المفضلة ==========
  window.toggleFavorite = async function(type, id) {
    if (!currentUser) { showToast('يجب تسجيل الدخول', false); return; }
    const exists = favorites.findIndex(f => f.user_id === currentUser.id && f.item_type === type && f.item_id === id);
    if (exists > -1) {
      await api.removeFavorite(currentUser.id, type, id);
      favorites.splice(exists, 1);
      showToast('تمت الإزالة من المفضلة');
    } else {
      await api.addFavorite(currentUser.id, type, id);
      favorites.push({ user_id: currentUser.id, item_type: type, item_id: id });
      showToast('تمت الإضافة إلى المفضلة');
    }
    if (currentViewMode === 'courts') renderCourts(document.getElementById('sportFilter')?.value || 'all');
    else renderCoaches(document.getElementById('sportFilter')?.value || 'all');
  };

    // ========== دوال الملاعب في التسجيل ==========
  function createCourtField(courtData = null) {
    const container = document.getElementById('courtsListContainer');
    if (!container) return;
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'court-item';
    
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between;">
        <h4>ملعب ${index + 1}</h4>
        <button type="button" class="btn-outline btn-sm remove-court-btn"><i class="fas fa-times"></i></button>
      </div>
      <div class="form-group">
        <label>اسم الملعب</label>
        <input type="text" name="courtName${index}" placeholder="مثال: الملعب الرئيسي" value="${courtData?.name || ''}" required>
      </div>
      <div class="form-group">
        <label>نوع الاستخدام</label>
        <select name="courtType${index}" class="court-type-select">
          <option value="single" ${!courtData?.multiSport ? 'selected' : ''}>رياضة واحدة</option>
          <option value="multi" ${courtData?.multiSport ? 'selected' : ''}>متعدد الرياضات</option>
        </select>
      </div>
      <div class="single-sport-group" style="${courtData?.multiSport ? 'display:none;' : ''}">
        <label>نوع الرياضة</label>
        <select name="courtSport${index}">${getSportOptions(courtData?.sport)}</select>
      </div>
      <div class="multi-sport-group" style="${courtData?.multiSport ? '' : 'display:none;'}">
        <label>الرياضات المسموحة</label>
        <div class="checkbox-group">
          ${getAllSports().map(sport => `
            <label style="display:block;"><input type="checkbox" name="allowedSport${index}" value="${sport}" ${courtData?.allowedSports?.includes(sport) ? 'checked' : ''}> ${getSportDisplayName(sport)}</label>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label><input type="checkbox" name="useCustomPricing${index}" ${courtData?.pricing ? 'checked' : ''}> تسعير خاص بهذا الملعب</label>
      </div>
      <div class="custom-pricing-group" style="${courtData?.pricing ? '' : 'display:none;'}">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div><label>ف1</label><input type="number" name="price1_${index}" min="0" value="${courtData?.pricing?.[0] || 40}" step="5"></div>
          <div><label>ف2</label><input type="number" name="price2_${index}" min="0" value="${courtData?.pricing?.[1] || 50}" step="5"></div>
          <div><label>ف3</label><input type="number" name="price3_${index}" min="0" value="${courtData?.pricing?.[2] || 60}" step="5"></div>
          <div><label>ف4</label><input type="number" name="price4_${index}" min="0" value="${courtData?.pricing?.[3] || 70}" step="5"></div>
        </div>
      </div>
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
    
    pricingCheck.addEventListener('change', (e) => {
      pricingGroup.style.display = e.target.checked ? 'block' : 'none';
    });
    
    div.querySelector('.remove-court-btn').addEventListener('click', () => {
      div.remove();
      updateCourtIndices();
    });
  }
  
  function updateCourtIndices() {
    const items = document.querySelectorAll('.court-item');
    items.forEach((item, idx) => {
      item.querySelector('h4').textContent = `ملعب ${idx + 1}`;
    });
  }

  // ========== تسجيل منشأة (مع رفع الصور إلى Supabase) ==========
  document.getElementById('registerVenueForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentUser || (currentUser.role !== 'venue' && currentUser.role !== 'admin')) {
      showToast('يجب تسجيل الدخول', false);
      return;
    }
    
    const name = sanitizeInput(document.getElementById('venueName')?.value?.trim() || '');
    const lat = parseFloat(document.getElementById('venueLat')?.value);
    const lng = parseFloat(document.getElementById('venueLng')?.value);
    
    if (!name) { showToast('يرجى إدخال اسم المنشأة', false); return; }
    if (isNaN(lat) || isNaN(lng)) { showToast('الرجاء تحديد الموقع على الخريطة', false); return; }
    
    // رفع الصورة إن وجدت
    const imageFile = document.getElementById('venueImage')?.files?.[0];
    let imageUrl = '';
    if (imageFile) {
      try {
        const compressed = await compressImage(imageFile, 800, 0.6);
        const fileName = `venue-${Date.now()}.jpg`;
        imageUrl = await uploadImageToSupabase(compressed, 'venues', fileName);
      } catch (err) {
        console.error('فشل رفع الصورة:', err);
      }
    }
    
    const venueData = {
      name,
      phone: document.getElementById('venuePhone')?.value || '',
      lat, lng,
      image_url: imageUrl,
      description: sanitizeInput(document.getElementById('venueDesc')?.value || ''),
      owner_id: currentUser.id,
      requires_approval: false,
      has_capacity: document.getElementById('regVenueHasCapacity')?.checked || false,
      max_capacity: document.getElementById('regVenueHasCapacity')?.checked ? parseInt(document.getElementById('regVenueMaxCapacity')?.value || '10') : null,
      allow_sharing: document.getElementById('regVenueAllowSharing')?.checked || false,
      pricing: [
        +document.getElementById('pricePeriod1')?.value || 40,
        +document.getElementById('pricePeriod2')?.value || 50,
        +document.getElementById('pricePeriod3')?.value || 60,
        +document.getElementById('pricePeriod4')?.value || 70
      ],
      working_hours: null
    };
    
    try {
      const newVenue = await api.saveVenue(venueData);
      if (!newVenue) throw new Error('فشل حفظ المنشأة');
      
      // إنشاء الملاعب
      const courtItems = document.querySelectorAll('.court-item');
      for (let idx = 0; idx < courtItems.length; idx++) {
        const item = courtItems[idx];
        const type = item.querySelector(`[name="courtType${idx}"]`)?.value || 'single';
        const courtName = item.querySelector(`[name="courtName${idx}"]`)?.value || `ملعب ${idx+1}`;
        
        const court = {
          venue_id: newVenue.id,
          name: sanitizeInput(courtName),
          multi_sport: type === 'multi',
          sport: type === 'single' ? item.querySelector(`[name="courtSport${idx}"]`)?.value : null,
          allowed_sports: type === 'multi' ? Array.from(item.querySelectorAll(`[name="allowedSport${idx}"]:checked`)).map(cb => cb.value) : [],
          pricing: null
        };
        
        if (item.querySelector(`[name="useCustomPricing${idx}"]`)?.checked) {
          court.pricing = [
            +item.querySelector(`[name="price1_${idx}"]`)?.value || 40,
            +item.querySelector(`[name="price2_${idx}"]`)?.value || 50,
            +item.querySelector(`[name="price3_${idx}"]`)?.value || 60,
            +item.querySelector(`[name="price4_${idx}"]`)?.value || 70
          ];
        }
        
        await api.saveCourt(court);
      }
      
      document.getElementById('registerVenueForm').reset();
      const courtsContainer = document.getElementById('courtsListContainer');
      if (courtsContainer) courtsContainer.innerHTML = '';
      createCourtField();
      if (miniMap && venueMarker) { miniMap.setView([24.7136, 46.6753], 13); venueMarker.setLatLng([24.7136, 46.6753]); }
      
      await refreshData();
      showToast('تم تسجيل المنشأة والملاعب بنجاح');
      switchSection(currentUser.role === 'admin' ? 'adminDashboard' : 'venueDashboard');
    } catch (err) {
      console.error('خطأ في تسجيل المنشأة:', err);
      showToast('حدث خطأ: ' + (err.message || 'غير متوقع'), false);
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.id === 'addCourtBtn' || e.target.closest('#addCourtBtn')) {
      e.preventDefault();
      createCourtField();
    }
  });

  // ========== تسجيل مدرب خصوصي ==========
  document.getElementById('registerCoachForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentUser || (currentUser.role !== 'coach' && currentUser.role !== 'admin')) {
      showToast('يجب تسجيل الدخول كمدرب', false);
      return;
    }
    
    const name = sanitizeInput(document.getElementById('coachName')?.value?.trim() || '');
    const lat = parseFloat(document.getElementById('coachLat')?.value);
    const lng = parseFloat(document.getElementById('coachLng')?.value);
    
    if (!name) { showToast('يرجى إدخال الاسم', false); return; }
    if (isNaN(lat) || isNaN(lng)) { showToast('الرجاء تحديد الموقع', false); return; }
    
    const imageFile = document.getElementById('coachImage')?.files?.[0];
    let imageUrl = '';
    if (imageFile) {
      try {
        const compressed = await compressImage(imageFile, 400, 0.7);
        imageUrl = await uploadImageToSupabase(compressed, 'coaches', `coach-${Date.now()}.jpg`);
      } catch (err) { console.error('فشل رفع الصورة:', err); }
    }
    
    try {
      await api.saveCoach({
        name,
        phone: document.getElementById('coachPhone')?.value || '',
        lat, lng,
        image_url: imageUrl,
        description: sanitizeInput(document.getElementById('coachDesc')?.value || ''),
        sport: document.getElementById('coachSport')?.value || 'football',
        hourly_rate: +document.getElementById('coachHourlyRate')?.value || 100,
        owner_id: currentUser.id
      });
      
      document.getElementById('registerCoachForm').reset();
      if (coachMap) { coachMap.setView([24.7136, 46.6753], 13); coachMarker.setLatLng([24.7136, 46.6753]); }
      await refreshData();
      showToast('تم تسجيل المدرب بنجاح');
      switchSection(currentUser.role === 'admin' ? 'adminDashboard' : 'coachDashboard');
    } catch (err) {
      showToast('حدث خطأ: ' + (err.message || 'غير متوقع'), false);
    }
  });

  // ========== دوال ساعات العمل ==========
  function renderWorkingHoursEditor(workingHours) {
    const container = document.getElementById('workingHoursContainer');
    if (!container) return;
    let html = '';
    WEEKDAYS.forEach(day => {
      const dayData = workingHours && workingHours[day.key] ? workingHours[day.key] : { start: '', end: '' };
      html += `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="width:80px;">${day.label}</span>
          <input type="time" id="wh_${day.key}_start" value="${dayData.start || ''}" placeholder="بداية" style="width:120px;">
          <span>-</span>
          <input type="time" id="wh_${day.key}_end" value="${dayData.end || ''}" placeholder="نهاية" style="width:120px;">
          <small style="color:#64748b;">(24 ساعة إذا تُرك فارغاً)</small>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function collectWorkingHoursFromEditor() {
    const workingHours = {};
    WEEKDAYS.forEach(day => {
      const start = document.getElementById(`wh_${day.key}_start`)?.value || '';
      const end = document.getElementById(`wh_${day.key}_end`)?.value || '';
      workingHours[day.key] = (start && end) ? { start, end } : null;
    });
    return workingHours;
  }

  // ========== لوحة تحكم المنشأة ==========
  async function loadVenueDashboard() {
    const container = document.getElementById('venueDashboardContent');
    if (!currentUser || !container) return;
    
    let myVenues = currentUser.role === 'admin' ? venues : venues.filter(v => v.owner_id === currentUser.id);
    if (!myVenues.length) {
      container.innerHTML = '<p>لا توجد منشآت. <a href="#" onclick="switchSection(\'registerVenue\')">سجل منشأة</a></p>';
      return;
    }
    
    let html = '<select id="venueSelectDashboard" class="filter-select"><option>اختر منشأة</option>';
    myVenues.forEach(v => html += `<option value="${v.id}">${sanitizeInput(v.name)}</option>`);
    html += '</select><div id="selectedVenueDetail" style="margin-top:20px;"></div>';
    container.innerHTML = html;
    
    document.getElementById('venueSelectDashboard').addEventListener('change', e => {
      const venue = myVenues.find(v => v.id === e.target.value);
      if (venue) renderVenueDetailForOwner(venue);
    });
  }

  function renderVenueDetailForOwner(venue) {
    const detail = document.getElementById('selectedVenueDetail');
    if (!detail) return;
    
    const venueBookings = bookings.filter(b => b.court_id && courts.find(c => c.id === b.court_id)?.venue_id === venue.id);
    const venueCourts = courts.filter(c => c.venue_id === venue.id);
    const symbol = getCurrencySymbol(currentCurrency);
    const totalRevenue = venueBookings.filter(b => b.status === 'confirmed' || b.status === 'مدفوع').reduce((s, b) => s + (b.price || 0), 0);
    
    let courtsHtml = venueCourts.map(court => {
      const sportInfo = court.multi_sport ? `متعدد: ${(court.allowed_sports || []).map(s => getSportDisplayName(s)).join(', ')}` : getSportDisplayName(court.sport);
      return `<div style="border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between;"><strong>${sanitizeInput(court.name)}</strong><span>${sportInfo}</span></div>
        <div style="margin-top:8px;">
          <button class="btn-outline btn-sm edit-court-btn" data-court-id="${court.id}">تعديل</button>
          <button class="btn-outline btn-sm delete-court-btn" data-court-id="${court.id}">حذف</button>
          <button class="btn-outline btn-sm blackout-court-btn" data-court-id="${court.id}"><i class="fas fa-ban"></i> إغلاق</button>
        </div>
      </div>`;
    }).join('');
    
    let bookingsHtml = '';
    const pending = venueBookings.filter(b => b.status === 'pending');
    const active = venueBookings.filter(b => b.status === 'confirmed' || b.status === 'مدفوع');
    
    if (venue.requires_approval) {
      bookingsHtml += `<h4>حجوزات بانتظار الموافقة (${pending.length})</h4>`;
      pending.forEach(b => {
        const court = courts.find(c => c.id === b.court_id);
        const customer = users.find(u => u.id === b.customer_id);
        bookingsHtml += `<div style="border:1px solid #fbbf24; border-radius:12px; padding:12px; margin-bottom:8px; background:#fef3c7;">
          <div><strong>${sanitizeInput(b.customer_name || customer?.full_name || '')}</strong> (${customer?.email || ''})</div>
          <div>${court?.name || ''} | ${b.date} | ${b.time} (${b.duration} ساعة) | ${b.price} ${symbol}</div>
          <div class="booking-actions">
            <button class="btn-outline btn-sm approve-booking-btn" data-id="${b.id}" style="background:#10b981; color:white;">قبول</button>
            <button class="btn-outline btn-sm reject-booking-btn" data-id="${b.id}" style="background:#ef4444; color:white;">رفض</button>
          </div>
        </div>`;
      });
    }
    
    bookingsHtml += `<h4>الحجوزات النشطة (${active.length})</h4>`;
    active.forEach(b => {
      const court = courts.find(c => c.id === b.court_id);
      const customer = users.find(u => u.id === b.customer_id);
      const canRate = (b.status === 'confirmed' || b.status === 'مدفوع') && !b.customer_rated_by_provider;
      bookingsHtml += `<div style="border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:8px;">
        <div><strong>${sanitizeInput(b.customer_name || customer?.full_name || '')}</strong> (${customer?.email || ''})</div>
        <div>${court?.name || ''} | ${b.date} | ${b.time} (${b.duration} ساعة) | ${b.price} ${symbol}</div>
        <div class="booking-actions">
          <button class="btn-outline btn-sm edit-booking-btn" data-id="${b.id}"><i class="fas fa-edit"></i></button>
          <button class="btn-outline btn-sm cancel-booking-btn" data-id="${b.id}"><i class="fas fa-times"></i></button>
          ${customer?.phone ? `<a class="whatsapp-link btn-outline btn-sm" href="#" data-phone="${customer.phone}"><i class="fab fa-whatsapp"></i></a>` : ''}
          ${canRate ? `<button class="btn-outline btn-sm rate-customer-btn" data-booking-id="${b.id}"><i class="fas fa-star"></i> تقييم العميل</button>` : ''}
        </div>
      </div>`;
    });
    
    detail.innerHTML = `
      <div style="display:flex;justify-content:space-between;"><h3>${sanitizeInput(venue.name)}</h3><button class="btn-outline btn-sm edit-venue-btn" data-id="${venue.id}"><i class="fas fa-edit"></i> تعديل</button></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:16px 0;">
        <div class="card" style="padding:12px;"><strong>الإيرادات:</strong> ${totalRevenue} ${symbol}</div>
        <div class="card" style="padding:12px;"><strong>الملاعب:</strong> ${venueCourts.length}</div>
      </div>
      <div class="card" style="padding:12px; margin-bottom:16px;">
        <label><input type="checkbox" id="requiresApprovalCheck" ${venue.requires_approval ? 'checked' : ''}> تتطلب الحجوزات موافقة مسبقة</label>
      </div>
      <div class="courts-panel"><h4>الملاعب <button class="btn-outline btn-sm" id="addNewCourtBtn" data-venue-id="${venue.id}"><i class="fas fa-plus"></i></button></h4><div id="courtsList">${courtsHtml}</div></div>
      <div>${bookingsHtml}</div>
    `;
    
    // ربط الأحداث
    document.getElementById('requiresApprovalCheck')?.addEventListener('change', async (e) => {
      await api.updateVenue(venue.id, { requires_approval: e.target.checked });
      venue.requires_approval = e.target.checked;
      showToast('تم التحديث');
    });
    
    document.getElementById('addNewCourtBtn')?.addEventListener('click', () => openCourtModal(null, venue.id));
    detail.querySelectorAll('.edit-court-btn').forEach(btn => btn.addEventListener('click', (e) => openCourtModal(btn.dataset.courtId)));
    detail.querySelectorAll('.delete-court-btn').forEach(btn => btn.addEventListener('click', (e) => {
      showConfirm('حذف الملعب؟', async () => {
        await api.deleteCourt(btn.dataset.courtId);
        await refreshData();
        renderVenueDetailForOwner(venue);
      });
    }));
    detail.querySelectorAll('.blackout-court-btn').forEach(btn => btn.addEventListener('click', () => openBlackoutModal('court', btn.dataset.courtId)));
    detail.querySelector('.edit-venue-btn')?.addEventListener('click', () => openEditVenueModal(venue.id));
    detail.querySelectorAll('.approve-booking-btn').forEach(btn => btn.addEventListener('click', () => approveBooking(btn.dataset.id)));
    detail.querySelectorAll('.reject-booking-btn').forEach(btn => btn.addEventListener('click', () => rejectBooking(btn.dataset.id)));
    detail.querySelectorAll('.rate-customer-btn').forEach(btn => btn.addEventListener('click', () => openCustomerRatingModal(btn.dataset.bookingId, 'court')));
    detail.querySelectorAll('.edit-booking-btn').forEach(btn => btn.addEventListener('click', () => openManageBookingModal(btn.dataset.id, 'court')));
    detail.querySelectorAll('.cancel-booking-btn').forEach(btn => btn.addEventListener('click', () => cancelBooking(btn.dataset.id, 'court')));
    detail.querySelectorAll('.whatsapp-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        if (link.dataset.phone) sendWhatsAppMessage(link.dataset.phone, `مرحباً،\nنود إعلامك بتعديل حجزك في ${venue.name}.`);
      });
    });
  }

  async function approveBooking(bookingId) {
    await api.updateBooking(bookingId, { status: 'confirmed' });
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      await api.saveNotification({ user_id: booking.customer_id, message: `تم تأكيد حجزك في ${booking.venue_name}`, type: 'booking' });
      const customer = users.find(u => u.id === booking.customer_id);
      if (customer?.phone) sendWhatsAppMessage(customer.phone, `تم تأكيد حجزك في ${booking.venue_name} بتاريخ ${booking.date}.`);
    }
    await refreshData();
    showToast('تم قبول الحجز');
    loadVenueDashboard();
  }

  async function rejectBooking(bookingId) {
    await api.updateBooking(bookingId, { status: 'cancelled' });
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      await api.saveNotification({ user_id: booking.customer_id, message: `تم رفض حجزك في ${booking.venue_name}`, type: 'booking' });
      const customer = users.find(u => u.id === booking.customer_id);
      if (customer?.phone) sendWhatsAppMessage(customer.phone, `نعتذر، تم رفض حجزك في ${booking.venue_name} بتاريخ ${booking.date}.`);
    }
    await refreshData();
    showToast('تم رفض الحجز');
    loadVenueDashboard();
  }

    // ========== لوحة تحكم المدرب ==========
  let selectedCoachId = null;

  async function loadCoachDashboard() {
    const container = document.getElementById('coachDashboardContent');
    if (!currentUser || !container) return;
    
    let coachList = currentUser.role === 'admin' ? coaches : coaches.filter(c => c.owner_id === currentUser.id);
    if (!coachList.length) {
      container.innerHTML = '<p>لا يوجد مدربين مسجلين. <a href="#" onclick="switchSection(\'registerCoach\')">سجل الآن</a></p>';
      return;
    }

    let html = '<select id="coachSelectDashboard" class="filter-select"><option value="">اختر مدرباً</option>';
    coachList.forEach(c => {
      html += `<option value="${c.id}" ${selectedCoachId === c.id ? 'selected' : ''}>${sanitizeInput(c.name)} (${getSportDisplayName(c.sport)})</option>`;
    });
    html += '</select><div id="selectedCoachDetail" style="margin-top:20px;"></div>';
    container.innerHTML = html;

    if (coachList.length === 1 && currentUser.role !== 'admin') {
      selectedCoachId = coachList[0].id;
      renderCoachDetail(coachList[0]);
    } else if (selectedCoachId) {
      const coach = coaches.find(c => c.id === selectedCoachId);
      if (coach) renderCoachDetail(coach);
    }

    document.getElementById('coachSelectDashboard').addEventListener('change', e => {
      const coach = coaches.find(c => c.id === e.target.value);
      if (coach) { selectedCoachId = coach.id; renderCoachDetail(coach); }
      else document.getElementById('selectedCoachDetail').innerHTML = '';
    });
  }

  function renderCoachDetail(coach) {
    const detail = document.getElementById('selectedCoachDetail');
    if (!detail) return;
    
    const sessions = coachBookings.filter(b => b.coach_id === coach.id);
    const symbol = getCurrencySymbol(currentCurrency);
    const totalRevenue = sessions.filter(s => s.status === 'confirmed' || s.status === 'مدفوع').reduce((sum, s) => sum + (s.price || 0), 0);
    
    let hoursHtml = '';
    WEEKDAYS.forEach(day => {
      const wh = (coachAvailability[coach.id] || {})[day.key];
      hoursHtml += `${day.label}: ${wh?.start && wh?.end ? wh.start + '-' + wh.end : '24 ساعة'}<br>`;
    });
    
    let sessionsHtml = sessions.map(s => {
      const customer = users.find(u => u.id === s.customer_id);
      const canRate = (s.status === 'confirmed' || s.status === 'مدفوع') && !s.customer_rated_by_provider;
      return `<div style="border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:8px;">
        <div><strong>${sanitizeInput(s.customer_name || customer?.full_name || '')}</strong> (${customer?.email || ''})</div>
        <div>${s.date} | ${s.time} (${s.duration} ساعة) | ${s.price} ${symbol}</div>
        <div class="booking-actions">
          <button class="btn-outline btn-sm edit-coach-booking-btn" data-id="${s.id}"><i class="fas fa-edit"></i></button>
          <button class="btn-outline btn-sm cancel-coach-booking-btn" data-id="${s.id}"><i class="fas fa-times"></i></button>
          ${customer?.phone ? `<a class="whatsapp-link btn-outline btn-sm" href="#" data-phone="${customer.phone}"><i class="fab fa-whatsapp"></i></a>` : ''}
          ${canRate ? `<button class="btn-outline btn-sm rate-customer-btn" data-booking-id="${s.id}"><i class="fas fa-star"></i> تقييم العميل</button>` : ''}
        </div>
      </div>`;
    }).join('');

    detail.innerHTML = `
      <div style="display:flex; justify-content:space-between;"><h3>${sanitizeInput(coach.name)}</h3><button class="btn-outline btn-sm" id="editCoachProfileBtn"><i class="fas fa-edit"></i></button></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:16px 0;">
        <div class="card"><strong>الرياضة:</strong> ${getSportDisplayName(coach.sport)}</div>
        <div class="card"><strong>سعر الساعة:</strong> ${coach.hourly_rate} ${symbol}</div>
        <div class="card"><strong>الهاتف:</strong> ${coach.phone}</div>
        <div class="card"><strong>الإيرادات:</strong> ${totalRevenue} ${symbol}</div>
      </div>
      <div class="card"><div style="display:flex; justify-content:space-between;"><strong>ساعات العمل</strong><div><button class="btn-outline btn-sm" id="editCoachAvailBtn"><i class="fas fa-clock"></i></button><button class="btn-outline btn-sm" id="blackoutCoachBtn"><i class="fas fa-ban"></i></button></div></div><div>${hoursHtml}</div></div>
      <div><h4>الجلسات (${sessions.length})</h4>${sessionsHtml || '<p>لا توجد جلسات</p>'}</div>
    `;
    
    document.getElementById('editCoachAvailBtn')?.addEventListener('click', () => openCoachAvailabilityModal(coach.id));
    document.getElementById('blackoutCoachBtn')?.addEventListener('click', () => openBlackoutModal('coach', coach.id));
    document.getElementById('editCoachProfileBtn')?.addEventListener('click', () => openEditCoachModal(coach.id));
    detail.querySelectorAll('.edit-coach-booking-btn').forEach(b => b.addEventListener('click', () => openManageBookingModal(b.dataset.id, 'coach')));
    detail.querySelectorAll('.cancel-coach-booking-btn').forEach(b => b.addEventListener('click', () => cancelCoachBooking(b.dataset.id)));
    detail.querySelectorAll('.rate-customer-btn').forEach(b => b.addEventListener('click', () => openCustomerRatingModal(b.dataset.bookingId, 'coach')));
    detail.querySelectorAll('.whatsapp-link').forEach(link => {
      link.addEventListener('click', e => { e.preventDefault(); if (link.dataset.phone) sendWhatsAppMessage(link.dataset.phone, `مرحباً،\nنود إعلامك بتعديل جلستك مع ${coach.name}.`); });
    });
  }

  function openCoachAvailabilityModal(coachId) {
    renderCoachWorkingHoursEditor(coachId);
    document.getElementById('coachAvailabilityModal').style.visibility = 'visible';
    document.getElementById('saveCoachAvailabilityBtn').onclick = async () => {
      coachAvailability[coachId] = collectCoachWorkingHoursFromEditor();
      // حفظ في Supabase (يمكن إضافته إلى coaches أو جدول منفصل)
      await api.updateCoach(coachId, { working_hours: coachAvailability[coachId] });
      showToast('تم الحفظ');
      document.getElementById('coachAvailabilityModal').style.visibility = 'hidden';
      loadCoachDashboard();
    };
  }

  function openEditCoachModal(coachId) {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) return;
    const newName = prompt('الاسم الجديد:', coach.name);
    if (newName) coach.name = sanitizeInput(newName);
    const newPhone = prompt('رقم الهاتف:', coach.phone);
    if (newPhone) coach.phone = newPhone;
    const newRate = prompt('سعر الساعة:', coach.hourly_rate);
    if (newRate) coach.hourly_rate = +newRate;
    const newDesc = prompt('الوصف:', coach.description);
    if (newDesc) coach.description = sanitizeInput(newDesc);
    api.updateCoach(coachId, { name: coach.name, phone: coach.phone, hourly_rate: coach.hourly_rate, description: coach.description })
      .then(() => { showToast('تم التحديث'); loadCoachDashboard(); });
  }

  async function cancelCoachBooking(bookingId) {
    showConfirm('هل أنت متأكد من إلغاء الجلسة؟', async () => {
      await api.deleteCoachBooking(bookingId);
      const booking = coachBookings.find(b => b.id === bookingId);
      if (booking) {
        await api.saveNotification({ user_id: booking.customer_id, message: `تم إلغاء جلستك مع ${currentUser.name}`, type: 'booking' });
        const customer = users.find(u => u.id === booking.customer_id);
        if (customer?.phone) sendWhatsAppMessage(customer.phone, `نعتذر، تم إلغاء جلستك مع ${currentUser.name} بتاريخ ${booking.date}.`);
      }
      await refreshData();
      showToast('تم الإلغاء');
      loadCoachDashboard();
    });
  }

  // ========== نظام الحجز ==========
  function openBookingModal(targetId, type) {
    if (!currentUser) return showToast('الرجاء تسجيل الدخول', false);
    document.getElementById('bookingType').value = type;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').value = today;
    document.getElementById('bookingTime').value = '10:00';
    document.getElementById('bookingDuration').value = 1;

    if (type === 'court') {
      const court = courts.find(c => c.id === targetId);
      if (!court) return;
      document.getElementById('bookingCourtId').value = court.id;
      document.getElementById('bookingCoachId').value = '';
      updateTimelineForCourt(court, today);
      document.getElementById('bookingDate').onchange = e => updateTimelineForCourt(court, e.target.value);
    } else {
      const coach = coaches.find(c => c.id === targetId);
      if (!coach) return;
      document.getElementById('bookingCoachId').value = coach.id;
      document.getElementById('bookingCourtId').value = '';
      updateTimelineForCoach(coach.id, today);
      document.getElementById('bookingDate').onchange = e => updateTimelineForCoach(coach.id, e.target.value);
    }
    document.getElementById('bookingModal').style.visibility = 'visible';
  }

  // ========== الشريط الزمني ==========
  function updateTimelineForCourt(court, dateStr) {
    const timelineDiv = document.getElementById('timelineDisplay');
    if (!timelineDiv) return;
    const venue = venues.find(v => v.id === court.venue_id);
    const dayBookings = bookings.filter(b => b.court_id === court.id && b.date === dateStr && b.status !== 'cancelled');
    
    const bookedSlots = new Array(24).fill(false);
    dayBookings.forEach(b => { 
      const start = parseInt(b.time.split(':')[0]); 
      for (let i = 0; i < (b.duration || 1); i++) if (start + i < 24) bookedSlots[start + i] = true; 
    });
    
    let html = '';
    const symbol = getCurrencySymbol(currentCurrency);
    for (let h = 0; h < 24; h++) {
      const periodIdx = getPeriodIndex(h);
      const periodColor = PERIODS[periodIdx].color;
      let statusColor = '#cbd5e1';
      if (!isWithinWorkingHours(venue, dateStr, h)) statusColor = '#cbd5e1';
      else if (bookedSlots[h]) statusColor = '#ef4444';
      else statusColor = '#10b981';
      const price = getHourlyPrice(court, h);
      html += `<div class="hour-slot" title="${h}:00 | ${PERIODS[periodIdx].name} | ${price} ${symbol}">
                <div class="period-part" style="background:${periodColor};">${h}</div>
                <div class="status-part" style="background:${statusColor};"></div>
              </div>`;
    }
    timelineDiv.innerHTML = html;
    updatePrice();
  }

  function updateTimelineForCoach(coachId, dateStr) {
    const timelineDiv = document.getElementById('timelineDisplay');
    if (!timelineDiv) return;
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) return;
    const daySessions = coachBookings.filter(b => b.coach_id === coachId && b.date === dateStr && b.status !== 'cancelled');
    
    const bookedSlots = new Array(24).fill(false);
    daySessions.forEach(b => { 
      const start = parseInt(b.time.split(':')[0]); 
      for (let i = 0; i < (b.duration || 1); i++) if (start + i < 24) bookedSlots[start + i] = true; 
    });
    
    let html = '';
    const symbol = getCurrencySymbol(currentCurrency);
    for (let h = 0; h < 24; h++) {
      const periodIdx = getPeriodIndex(h);
      const periodColor = PERIODS[periodIdx].color;
      let statusColor = '#cbd5e1';
      if (!isWithinCoachWorkingHours(coachId, dateStr, h)) statusColor = '#cbd5e1';
      else if (bookedSlots[h]) statusColor = '#ef4444';
      else statusColor = '#10b981';
      html += `<div class="hour-slot" title="${h}:00 | ${PERIODS[periodIdx].name} | ${coach.hourly_rate} ${symbol}">
                <div class="period-part" style="background:${periodColor};">${h}</div>
                <div class="status-part" style="background:${statusColor};"></div>
              </div>`;
    }
    timelineDiv.innerHTML = html;
    updatePrice();
  }

  function updatePrice() {
    const type = document.getElementById('bookingType')?.value;
    const date = document.getElementById('bookingDate')?.value;
    const time = document.getElementById('bookingTime')?.value;
    const duration = +document.getElementById('bookingDuration')?.value || 1;
    let price = 0;
    
    if (type === 'court') {
      const courtId = document.getElementById('bookingCourtId')?.value;
      const court = courts.find(c => c.id === courtId);
      if (court) price = calculateBookingPrice(court, date, time, duration);
    } else {
      const coachId = document.getElementById('bookingCoachId')?.value;
      const coach = coaches.find(c => c.id === coachId);
      if (coach) price = coach.hourly_rate * duration;
    }
    document.getElementById('bookingPrice').textContent = price;
  }

  // ========== التقييم ==========
  function openRatingModal(targetId, bookingId, type) {
    document.getElementById('ratingTargetId').value = targetId;
    document.getElementById('ratingBookingId').value = bookingId;
    document.getElementById('ratingType').value = type;
    selectedRating = 0;
    document.querySelectorAll('#ratingStars i').forEach(star => { star.className = 'far fa-star'; star.style.color = ''; });
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
    
    const review = {
      user_id: currentUser.id,
      user_name: currentUser.name || currentUser.email,
      rating: selectedRating,
      comment,
      booking_id: bookingId
    };

    if (type === 'venue') {
      review.venue_id = targetId;
      await api.saveReview(review);
      await api.updateBooking(bookingId, { rated: true });
    } else {
      review.coach_id = targetId;
      await api.saveCoachReview(review);
      await api.updateCoachBooking(bookingId, { rated: true });
    }
    
    showToast('شكراً لتقييمك! 🌟');
    document.getElementById('ratingModal').style.visibility = 'hidden';
    await refreshData();
    renderCustomerBookings();
  });

  function openCustomerRatingModal(bookingId, type) {
    document.getElementById('customerRatingBookingId').value = bookingId;
    document.getElementById('customerRatingType').value = type;
    selectedRating = 0;
    document.querySelectorAll('#customerRatingStars i').forEach(star => { star.className = 'far fa-star'; star.style.color = ''; });
    document.getElementById('customerRatingModal').style.visibility = 'visible';
  }

  document.getElementById('submitCustomerRatingBtn').addEventListener('click', async () => {
    const bookingId = document.getElementById('customerRatingBookingId').value;
    const type = document.getElementById('customerRatingType').value;
    const comment = sanitizeInput(document.getElementById('customerRatingComment').value);
    if (selectedRating === 0) { showToast('الرجاء اختيار تقييم', false); return; }
    
    const booking = type === 'court' ? bookings.find(b => b.id === bookingId) : coachBookings.find(b => b.id === bookingId);
    if (!booking) return;

    await api.saveCustomerReview({
      customer_id: booking.customer_id,
      reviewer_id: currentUser.id,
      reviewer_name: currentUser.name || currentUser.email,
      rating: selectedRating,
      comment,
      booking_id: bookingId,
      booking_type: type
    });

    if (type === 'court') await api.updateBooking(bookingId, { customer_rated_by_provider: true });
    else await api.updateCoachBooking(bookingId, { customer_rated_by_provider: true });

    showToast('تم تقييم العميل بنجاح');
    document.getElementById('customerRatingModal').style.visibility = 'hidden';
    await refreshData();
    if (document.getElementById('venueDashboard')?.classList.contains('active')) loadVenueDashboard();
    if (document.getElementById('coachDashboard')?.classList.contains('active')) loadCoachDashboard();
  });

    // ========== السلة (محفوظة محلياً) ==========
  async function loadCart() {
    cart = JSON.parse(localStorage.getItem('sport_cart') || '[]');
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

    let total = 0, html = '';
    cart.forEach((item, index) => {
      let itemTotal = 0;
      if (item.type === 'court') {
        const court = courts.find(c => c.id === item.courtId);
        if (court) itemTotal = calculateBookingPrice(court, item.date, item.time, item.duration);
        html += `<div class="cart-item"><div><strong>🏟️ ${item.courtName}</strong><br>${item.date} ${item.time} (${item.duration} ساعة) - ${itemTotal} ${symbol}</div><button onclick="window.removeFromCart(${index})"><i class="fas fa-trash"></i></button></div>`;
      } else {
        const coach = coaches.find(c => c.id === item.coachId);
        if (coach) itemTotal = coach.hourly_rate * item.duration;
        html += `<div class="cart-item"><div><strong>👤 ${item.coachName}</strong><br>${item.date} ${item.time} (${item.duration} ساعة) - ${itemTotal} ${symbol}</div><button onclick="window.removeFromCart(${index})"><i class="fas fa-trash"></i></button></div>`;
      }
      total += itemTotal;
    });

    if (cartItems) cartItems.innerHTML = html;
    if (cartTotal) cartTotal.textContent = total.toFixed(2);
    if (checkoutBtn) checkoutBtn.disabled = false;

    if (penaltyNotice && currentUser && (currentUser.penaltyBalance || 0) > 0) {
      penaltyNotice.style.display = 'block';
      penaltyNotice.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${t('penaltyNotice')}: <strong>${currentUser.penaltyBalance.toFixed(2)} ${symbol}</strong>. ${t('penaltyWillBeAdded')}.`;
    } else if (penaltyNotice) penaltyNotice.style.display = 'none';
  }

  window.removeFromCart = async function(index) {
    cart.splice(index, 1);
    localStorage.setItem('sport_cart', JSON.stringify(cart));
    updateCartUI();
    showToast('تمت إزالة العنصر من السلة');
  };

  async function addToCart(bookingData) {
    cart.push({ ...bookingData, id: Date.now().toString() });
    localStorage.setItem('sport_cart', JSON.stringify(cart));
    updateCartUI();
    showToast('تمت إضافة الحجز إلى السلة');
    return true;
  }

  async function checkoutCart() {
    if (cart.length === 0) return;
    if (!currentUser) { showToast('يجب تسجيل الدخول أولاً', false); return; }
    const total = cart.reduce((sum, item) => {
      if (item.type === 'court') {
        const court = courts.find(c => c.id === item.courtId);
        return sum + (court ? calculateBookingPrice(court, item.date, item.time, item.duration) : 0);
      } else {
        const coach = coaches.find(c => c.id === item.coachId);
        return sum + (coach ? coach.hourly_rate * item.duration : 0);
      }
    }, 0);
    pendingBooking = { items: cart, total, appFee: total * BOOKING_FEE_PERCENTAGE, customerId: currentUser.id, customerName: currentUser.name || currentUser.email, penaltyBalance: currentUser.penaltyBalance || 0 };
    document.getElementById('bookingModal').style.visibility = 'hidden';
    showPaymentModal(pendingBooking);
  }

  // ========== الدفع ==========
  function showPaymentModal(b) {
    const symbol = getCurrencySymbol(currentCurrency);
    let itemsHtml = b.items.map(item => item.type === 'court' ? 
      `<p><strong>🏟️ ${item.courtName}</strong><br>${item.date} ${item.time} (${item.duration} ساعة)</p>` :
      `<p><strong>👤 ${item.coachName}</strong><br>${item.date} ${item.time} (${item.duration} ساعة)</p>`
    ).join('');

    const penaltyAmount = currentUser?.penaltyBalance || 0;
    const penaltySection = penaltyAmount > 0 ? `<div style="background:#fef3c7; padding:12px; border-radius:12px; margin-bottom:16px;"><i class="fas fa-exclamation-triangle"></i> ${t('penaltyNotice')}: <strong>${penaltyAmount.toFixed(2)} ${symbol}</strong></div>` : '';

    const paymentHtml = `
      <div class="form-group"><label>${t('paymentMethod')}</label><select id="paymentMethodSelect" class="filter-select"><option value="card">${t('card')}</option><option value="wallet">${t('wallet')}</option><option value="instapay">${t('instapay')}</option><option value="fawry">${t('fawry')}</option></select></div>
      <div id="cardFields"><div class="form-group"><label>${t('cardNumber')}</label><input type="text" id="cardNumber" placeholder="4242 4242 4242 4242" maxlength="19"></div><div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;"><div class="form-group"><label>${t('expiry')}</label><input type="text" id="cardExpiry" placeholder="MM/YY" maxlength="5"></div><div class="form-group"><label>${t('cvv')}</label><input type="text" id="cardCvv" placeholder="123" maxlength="3"></div></div></div>
      <div id="walletFields" style="display:none;" class="form-group"><label>${t('walletNumber')}</label><input type="text" id="walletNumber" placeholder="01XXXXXXXXX"></div>
      <div id="instructionFields" style="display:none;"><p style="padding:12px; background:#e0f2fe; border-radius:12px;">${t('paymentInstruction')}</p></div>
      <div class="form-group"><label>${t('promoCode')}</label><div style="display:flex; gap:8px;"><input type="text" id="promoCodeInput" placeholder="أدخل الكود" style="flex:1;"><button type="button" id="applyPromoBtn" class="btn-outline btn-sm">${t('apply')}</button></div><div id="promoMessage"></div></div>
    `;

    document.getElementById('paymentDetails').innerHTML = itemsHtml + penaltySection + paymentHtml + `<p>${t('total')}: <span id="displayTotal">${b.total}</span> ${symbol} (${t('fees')}: ${b.appFee.toFixed(2)} ${symbol})</p>`;
    document.getElementById('paymentModal').style.visibility = 'visible';

    let appliedPromo = null, discountedTotal = b.total;
    document.getElementById('paymentMethodSelect').addEventListener('change', (e) => {
      const method = e.target.value;
      document.getElementById('cardFields').style.display = method === 'card' ? 'block' : 'none';
      document.getElementById('walletFields').style.display = method === 'wallet' ? 'block' : 'none';
      document.getElementById('instructionFields').style.display = (method === 'instapay' || method === 'fawry') ? 'block' : 'none';
    });

    document.getElementById('applyPromoBtn').addEventListener('click', () => {
      const code = document.getElementById('promoCodeInput')?.value?.trim();
      if (!code) return;
      const validation = validatePromoCode(code);
      const promoMsgEl = document.getElementById('promoMessage');
      if (!validation.valid) { if (promoMsgEl) promoMsgEl.innerHTML = `<span style="color:#ef4444;">${validation.reason}</span>`; return; }
      appliedPromo = validation.promo;
      discountedTotal = applyPromoToTotal(b.total, appliedPromo);
      document.getElementById('displayTotal').textContent = discountedTotal.toFixed(2);
      if (promoMsgEl) promoMsgEl.innerHTML = `<span style="color:#10b981;">${t('promoApplied')}: ${appliedPromo.code}</span>`;
      pendingBooking.discountAmount = b.total - discountedTotal;
      pendingBooking.promoCode = appliedPromo.code;
    });

    document.getElementById('confirmPaymentBtn').onclick = async () => {
      const method = document.getElementById('paymentMethodSelect')?.value || 'card';
      if (method === 'card' && (!document.getElementById('cardNumber')?.value || document.getElementById('cardNumber')?.value.length < 16)) { showToast(t('invalidCard'), false); return; }
      if (method === 'wallet' && !document.getElementById('walletNumber')?.value) { showToast(t('invalidWallet'), false); return; }

      for (const item of pendingBooking.items) {
        const requiresApproval = item.type === 'court' ? (venues.find(v => v.id === (courts.find(c => c.id === item.courtId)?.venue_id))?.requires_approval || false) : false;
        const status = requiresApproval ? 'pending' : 'confirmed';

        if (item.type === 'court') {
          const court = courts.find(c => c.id === item.courtId);
          const price = calculateBookingPrice(court, item.date, item.time, item.duration);
          await api.saveBooking({
            court_id: item.courtId, customer_id: currentUser.id,
            venue_name: item.venueName, court_name: item.courtName,
            date: item.date, time: item.time, duration: item.duration,
            price, app_fee: price * BOOKING_FEE_PERCENTAGE,
            status, rated: false, promo_code: appliedPromo?.code || null, payment_method: method,
            customer_name: currentUser.name || currentUser.email
          });
          const venue = venues.find(v => v.id === court.venue_id);
          if (venue && !requiresApproval) {
            await api.saveNotification({ user_id: venue.owner_id, message: `حجز جديد في ${item.courtName} (${venue.name})`, type: 'booking' });
          }
        } else {
          const coach = coaches.find(c => c.id === item.coachId);
          const price = coach.hourly_rate * item.duration;
          await api.saveCoachBooking({
            coach_id: item.coachId, customer_id: currentUser.id,
            coach_name: item.coachName, date: item.date, time: item.time, duration: item.duration,
            price, app_fee: price * BOOKING_FEE_PERCENTAGE,
            status: 'confirmed', rated: false, promo_code: appliedPromo?.code || null, payment_method: method,
            customer_name: currentUser.name || currentUser.email
          });
          await api.saveNotification({ user_id: coach.owner_id, message: `جلسة جديدة مع ${currentUser.name || currentUser.email}`, type: 'booking' });
        }
      }

      if (appliedPromo) {
        await api.updatePromo(appliedPromo.code, { used_count: (appliedPromo.used_count || 0) + 1 });
      }

      if (penaltyAmount > 0 && currentUser) {
        await api.updateProfile(currentUser.id, { penalty_balance: 0 });
        currentUser.penaltyBalance = 0;
      }

      cart = []; localStorage.setItem('sport_cart', '[]'); updateCartUI();
      await refreshData();
      showToast(t('paymentSuccess'));
      document.getElementById('paymentModal').style.visibility = 'hidden';
      renderCustomerBookings();
    };
  }

  // ========== الحجوزات المتكررة (نفس المنطق السابق مع api.saveBooking) ==========
  function generateRecurringDates(startDate, endDate, pattern) { /* ... */ }
  async function createRecurringBookings(baseData, pattern, endDate) {
    const dates = generateRecurringDates(baseData.date, endDate, pattern);
    const newItems = [];
    for (const date of dates) {
      // تحقق من التعارضات باستخدام bookings الحالية
      if (baseData.type === 'court') {
        const conflict = bookings.some(b => b.court_id === baseData.courtId && b.date === date && b.status !== 'cancelled');
        if (conflict) continue;
      } else {
        const conflict = coachBookings.some(b => b.coach_id === baseData.coachId && b.date === date && b.status !== 'cancelled');
        if (conflict) continue;
      }
      newItems.push({ ...baseData, date });
    }
    return newItems;
  }

  document.getElementById('bookingForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const type = document.getElementById('bookingType').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const duration = +document.getElementById('bookingDuration').value;
    const recurring = document.getElementById('bookingRecurring')?.value || 'none';
    const endDate = recurring !== 'none' ? document.getElementById('recurringEndDate')?.value : null;

    let baseData;
    if (type === 'court') {
      const court = courts.find(c => c.id === document.getElementById('bookingCourtId').value);
      if (!court) return;
      baseData = { type: 'court', courtId: court.id, venueId: court.venue_id, venueName: venues.find(v => v.id === court.venue_id)?.name, courtName: court.name, date, time, duration, price: calculateBookingPrice(court, date, time, duration), customerId: currentUser.id, customerName: currentUser.name || currentUser.email };
    } else {
      const coach = coaches.find(c => c.id === document.getElementById('bookingCoachId').value);
      if (!coach) return;
      baseData = { type: 'coach', coachId: coach.id, coachName: coach.name, date, time, duration, price: coach.hourly_rate * duration, customerId: currentUser.id, customerName: currentUser.name || currentUser.email };
    }

    if (recurring !== 'none' && endDate) {
      const items = await createRecurringBookings(baseData, recurring, endDate);
      for (const item of items) await addToCart(item);
      showToast(`تمت إضافة ${items.length} حجوزات متكررة`);
    } else {
      await addToCart(baseData);
    }
    document.getElementById('bookingModal').style.visibility = 'hidden';
  });

  document.getElementById('checkoutCartBtn')?.addEventListener('click', checkoutCart);

  // ========== المتجر الرياضي ==========
  async function loadStore() {
    const container = document.getElementById('storeProductsList');
    if (!container) return;
    if (!products.length) { container.innerHTML = `<p>${t('noProducts')}</p>`; return; }
    const symbol = getCurrencySymbol(currentCurrency);
    let html = '';
    products.forEach(prod => {
      const store = stores.find(s => s.id === prod.store_id);
      html += `<div class="store-product-card">
        <div class="store-product-img" style="background-image:url('${prod.image_url || 'https://images.pexels.com/photos/34514/pexels-photo.jpg'}');"></div>
        <div class="store-product-info">
          <div class="store-product-price">${prod.price} ${symbol}</div>
          <h4>${sanitizeInput(prod.name)}</h4>
          <div class="store-product-store">${store ? sanitizeInput(store.name) : ''}</div>
          <button class="btn btn-primary add-to-store-cart-btn" data-id="${prod.id}" style="width:auto;">${t('addToStoreCart')}</button>
        </div>
      </div>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.add-to-store-cart-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const productId = btn.dataset.id;
        const existing = storeCart.find(item => item.product_id === productId);
        if (existing) existing.quantity += 1;
        else storeCart.push({ product_id: productId, store_id: products.find(p => p.id === productId)?.store_id, product_name: products.find(p => p.id === productId)?.name, price: products.find(p => p.id === productId)?.price, quantity: 1 });
        if (currentUser) await api.addToStoreCart({ user_id: currentUser.id, product_id: productId, quantity: existing ? existing.quantity : 1 });
        updateStoreCartUI();
      });
    });
  }

  function updateStoreCartUI() {
    const cartCount = document.getElementById('storeCartCount');
    const cartItems = document.getElementById('storeCartItems');
    const checkoutBtn = document.getElementById('checkoutStoreBtn');
    if (!cartCount || !cartItems || !checkoutBtn) return;
    cartCount.textContent = storeCart.length;
    const symbol = getCurrencySymbol(currentCurrency);
    if (storeCart.length === 0) { cartItems.innerHTML = '<p>السلة فارغة</p>'; checkoutBtn.disabled = true; return; }
    let total = 0, html = '';
    storeCart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      html += `<div class="cart-item"><div>${item.product_name} (${item.quantity}x) - ${itemTotal} ${symbol}</div><button onclick="window.removeFromStoreCart(${index})"><i class="fas fa-trash"></i></button></div>`;
    });
    cartItems.innerHTML = html; checkoutBtn.disabled = false;
  }

  window.removeFromStoreCart = async function(index) {
    const item = storeCart[index];
    if (currentUser) await api.removeFromStoreCart(currentUser.id, item.product_id);
    storeCart.splice(index, 1);
    updateStoreCartUI();
  };

  document.getElementById('checkoutStoreBtn')?.addEventListener('click', async () => {
    if (!currentUser) { showToast('يجب تسجيل الدخول', false); return; }
    if (!storeCart.length) return;
    const total = storeCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await api.saveStoreOrder({
      customer_id: currentUser.id, customer_name: currentUser.name || currentUser.email,
      items: storeCart, total, status: 'قيد التنفيذ'
    });
    const uniqueStores = [...new Set(storeCart.map(item => item.store_id))];
    for (const storeId of uniqueStores) {
      const store = stores.find(s => s.id === storeId);
      if (store) await api.saveNotification({ user_id: store.owner_id, message: `طلب شراء جديد بقيمة ${total} ${getCurrencySymbol(currentCurrency)}`, type: 'store' });
    }
    if (currentUser) await api.clearStoreCart(currentUser.id);
    storeCart = [];
    updateStoreCartUI();
    showToast(t('orderPlaced'));
  });

    // ========== الفرق الرياضية ==========
  async function loadTeams() {
    const container = document.getElementById('teamsList');
    if (!container) return;
    if (!teams.length) { container.innerHTML = '<p>لا توجد فرق حالية</p>'; return; }
    let html = '';
    teams.forEach(team => {
      const memberCount = teamMembers.filter(m => m.team_id === team.id).length;
      html += `<div class="team-card">
        <div class="team-logo" style="background-image:url('${team.logo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(team.name) + '&size=100'}');"></div>
        <div class="team-info">
          <div class="team-name">${sanitizeInput(team.name)}</div>
          <span class="invitation-sport">${getSportDisplayName(team.sport)}</span>
          <p style="color:#64748b;">${sanitizeInput(team.description || '')}</p>
          <span class="team-members"><i class="fas fa-user"></i> ${memberCount} / ${team.max_members || 10} أعضاء</span>
          ${team.owner_id === currentUser?.id ? `<button class="btn-outline btn-sm manage-members-btn" data-team-id="${team.id}" style="margin-top:8px;">إدارة الأعضاء</button>` : ''}
        </div>
      </div>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.manage-members-btn').forEach(btn => btn.addEventListener('click', () => openTeamMembersModal(btn.dataset.teamId)));
  }

  function openTeamModal(teamId = null) {
    if (!currentUser) { showToast('يجب تسجيل الدخول', false); return; }
    document.getElementById('teamSport').innerHTML = getSportOptions();
    if (teamId) {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      document.getElementById('teamModalTitle').textContent = 'تعديل الفريق';
      document.getElementById('teamId').value = team.id;
      document.getElementById('teamName').value = team.name;
      document.getElementById('teamSport').value = team.sport;
      document.getElementById('teamMaxMembers').value = team.max_members || 10;
      document.getElementById('teamDesc').value = team.description || '';
    } else {
      document.getElementById('teamModalTitle').textContent = 'إنشاء فريق';
      document.getElementById('teamId').value = '';
      document.getElementById('teamName').value = '';
      document.getElementById('teamMaxMembers').value = 10;
      document.getElementById('teamDesc').value = '';
    }
    document.getElementById('teamModal').style.visibility = 'visible';
  }

  document.getElementById('teamForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamId = document.getElementById('teamId').value;
    const name = sanitizeInput(document.getElementById('teamName').value.trim());
    const sport = document.getElementById('teamSport').value;
    const maxMembers = parseInt(document.getElementById('teamMaxMembers').value) || 10;
    const desc = sanitizeInput(document.getElementById('teamDesc').value);
    const logoFile = document.getElementById('teamLogo').files[0];
    let logoUrl = '';
    if (logoFile) {
      try {
        const compressed = await compressImage(logoFile, 400, 0.7);
        logoUrl = await uploadImageToSupabase(compressed, 'teams', `team-${Date.now()}.jpg`);
      } catch (err) {}
    }
    if (teamId) {
      await api.updateTeam(teamId, { name, sport, max_members: maxMembers, description: desc, ...(logoUrl && { logo_url: logoUrl }) });
      showToast('تم تحديث الفريق');
    } else {
      await api.saveTeam({ name, sport, max_members: maxMembers, description: desc, logo_url: logoUrl, owner_id: currentUser.id });
      showToast('تم إنشاء الفريق');
    }
    document.getElementById('teamModal').style.visibility = 'hidden';
    await refreshData();
    loadTeams();
  });

  document.getElementById('createTeamBtn')?.addEventListener('click', () => openTeamModal());
  document.getElementById('closeTeamModal')?.addEventListener('click', () => document.getElementById('teamModal').style.visibility = 'hidden');

  function openTeamMembersModal(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team || team.owner_id !== currentUser?.id) { showToast('غير مصرح', false); return; }
    const members = teamMembers.filter(m => m.team_id === teamId);
    let listHtml = members.map(m => `<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #eee;"><span>${sanitizeInput(m.user_name)}</span><button class="btn-outline btn-sm remove-member-btn" data-member-id="${m.id}"><i class="fas fa-trash"></i></button></div>`).join('');
    const modal = document.createElement('div');
    modal.className = 'modal'; modal.style.visibility = 'visible';
    modal.innerHTML = `<div class="modal-card"><h3>إدارة أعضاء ${sanitizeInput(team.name)}</h3>${listHtml || '<p>لا يوجد أعضاء</p>'}<button class="btn-outline" id="closeTeamMembersModal">إغلاق</button></div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('.remove-member-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await api.removeTeamMember(btn.dataset.memberId);
        modal.remove();
        await refreshData();
        openTeamMembersModal(teamId);
      });
    });
    modal.querySelector('#closeTeamMembersModal').addEventListener('click', () => modal.remove());
  }

  // ========== دعوات الفرق والمباريات ==========
  async function loadTeamInvitations() {
    const container = document.getElementById('teamInvitationsList');
    if (!container) return;
    if (!teamInvitations.length) { container.innerHTML = '<p>لا توجد دعوات حالية للفرق</p>'; return; }
    let html = '';
    teamInvitations.forEach(inv => {
      const team = teams.find(t => t.id === inv.team_id);
      if (!team) return;
      const currentCount = teamMembers.filter(m => m.team_id === team.id).length;
      const canJoin = currentUser && inv.creator_id !== currentUser.id && currentCount < inv.max_members && !teamMembers.some(m => m.team_id === team.id && m.user_id === currentUser.id);
      html += `<div class="invitation-card">
        <div class="invitation-header"><strong>${sanitizeInput(team.name)}</strong><span class="invitation-sport">${getSportDisplayName(team.sport)}</span></div>
        <div class="invitation-details"><span class="invitation-players"><i class="fas fa-user"></i> ${currentCount} / ${inv.max_members}</span></div>
        ${canJoin ? `<button class="btn btn-primary join-team-inv-btn" data-inv-id="${inv.id}" style="width:auto;">انضم للفريق</button>` : ''}
      </div>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.join-team-inv-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const inv = teamInvitations.find(i => i.id === btn.dataset.invId);
        if (!inv) return;
        const team = teams.find(t => t.id === inv.team_id);
        if (!team) return;
        const currentCount = teamMembers.filter(m => m.team_id === team.id).length;
        if (currentCount >= inv.max_members) { showToast('اكتمل العدد', false); return; }
        await api.addTeamMember({ team_id: team.id, user_id: currentUser.id, user_name: currentUser.name || currentUser.email });
        await api.saveNotification({ user_id: team.owner_id, message: `انضم ${currentUser.name || currentUser.email} إلى فريقك "${team.name}"`, type: 'team' });
        await refreshData();
        showToast('تم الانضمام');
        loadTeamInvitations();
      });
    });
  }

  function createTeamInvitation() {
    if (!currentUser) { showToast('يجب تسجيل الدخول', false); return; }
    const myTeams = teams.filter(t => t.owner_id === currentUser.id);
    if (!myTeams.length) { showToast('أنت لا تقود أي فريق', false); return; }
    const teamNames = myTeams.map(t => `${t.name} (ID: ${t.id})`).join('\n');
    const teamId = prompt('أدخل معرف الفريق لنشر دعوة:\n' + teamNames);
    if (!teamId) return;
    const team = myTeams.find(t => t.id === teamId);
    if (!team) { showToast('معرف غير صحيح', false); return; }
    api.saveTeamInvitation({
      team_id: team.id, team_name: team.name, sport: team.sport,
      max_members: team.max_members || 10, creator_id: currentUser.id,
      creator_name: currentUser.name || currentUser.email
    }).then(async () => {
      await refreshData();
      showToast('تم نشر الدعوة');
      loadTeamInvitations();
    });
  }

  document.getElementById('createTeamInvitationBtn')?.addEventListener('click', createTeamInvitation);

  async function loadOpenInvitations() {
    const container = document.getElementById('invitationsList');
    if (!container) return;
    if (!openInvitations.length) { container.innerHTML = `<p>${t('noInvitations')}</p>`; return; }
    let html = '';
    openInvitations.forEach(inv => {
      const joinedCount = (inv.joined_players || []).length;
      const canJoin = currentUser && inv.creator_id !== currentUser.id && !(inv.joined_players || []).some(p => p.userId === currentUser.id);
      html += `<div class="invitation-card">
        <div class="invitation-header"><strong>${sanitizeInput(inv.title)}</strong><span class="invitation-sport">${getSportDisplayName(inv.sport)}</span></div>
        <div class="invitation-details"><i class="fas fa-calendar-alt"></i> ${new Date(inv.date_time).toLocaleString()} | <i class="fas fa-clock"></i> ${inv.duration} ساعة</div>
        <div class="invitation-details"><span class="invitation-players"><i class="fas fa-user"></i> ${joinedCount} / ${inv.players_needed}</span></div>
        ${canJoin ? `<button class="btn-outline btn-sm join-invitation-btn" data-id="${inv.id}">${t('joinInvitation')}</button>` : ''}
      </div>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.join-invitation-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const inv = openInvitations.find(i => i.id === btn.dataset.id);
        if (!inv) return;
        if (!currentUser) { showToast('يجب تسجيل الدخول', false); return; }
        if (!inv.joined_players) inv.joined_players = [];
        inv.joined_players.push({ userId: currentUser.id, userName: currentUser.name || currentUser.email });
        await api.updateOpenInvitation(inv.id, { joined_players: inv.joined_players });
        await api.saveNotification({ user_id: inv.creator_id, message: `انضم ${currentUser.name || currentUser.email} إلى دعوتك "${inv.title}"`, type: 'invitation' });
        await refreshData();
        showToast('تم الانضمام');
        loadOpenInvitations();
      });
    });
  }

  // ========== لوحة الأدمن الموسعة ==========
  async function loadAdminDashboard(tab = 'venues') {
    const content = document.getElementById('adminContent');
    if (!content) return;
    document.querySelectorAll('#adminDashboard .btn-outline').forEach(b => b.classList.remove('active'));
    document.getElementById(`adminTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)?.classList.add('active');
    const symbol = getCurrencySymbol(currentCurrency);
    let html = '';

    if (tab === 'venues') {
      html = '<table class="admin-table"><tr><th>الاسم</th><th>المالك</th><th>إجراءات</th></tr>';
      venues.forEach(v => { html += `<tr><td>${sanitizeInput(v.name)}</td><td>${users.find(u=>u.id===v.owner_id)?.full_name||'—'}</td><td><button class="btn-outline btn-sm edit-venue-btn" data-id="${v.id}"><i class="fas fa-edit"></i></button><button class="btn-outline btn-sm delete-venue-btn" data-id="${v.id}"><i class="fas fa-trash"></i></button></td></tr>`; });
      html += '</table>';
    } else if (tab === 'users') {
      html = '<table class="admin-table"><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr>';
      users.forEach(u => { html += `<tr><td>${sanitizeInput(u.full_name)}</td><td>${u.email}</td><td>${t(u.role)}</td><td>${u.is_blocked ? 'محظور' : 'نشط'}</td><td>${u.role!=='admin' ? `<button class="btn-outline btn-sm toggle-block-btn" data-id="${u.id}">${u.is_blocked?'فك الحظر':'حظر'}</button>`:''}</td></tr>`; });
      html += '</table>';
    } else if (tab === 'finance') {
      const venueRev = bookings.filter(b => b.status === 'confirmed' || b.status === 'مدفوع').reduce((s,b) => s + (b.price||0), 0);
      const coachRev = coachBookings.filter(b => b.status === 'confirmed' || b.status === 'مدفوع').reduce((s,b) => s + (b.price||0), 0);
      const storeRev = storeOrders.filter(o => o.status === 'قيد التنفيذ' || o.status === 'مكتمل').reduce((s,o) => s + (o.total||0), 0);
      const fee = (venueRev+coachRev)*BOOKING_FEE_PERCENTAGE + storeRev*STORE_FEE_PERCENTAGE;
      html = `<h3>إجمالي الإيرادات: ${(venueRev+coachRev+storeRev).toFixed(2)} ${symbol}</h3><p>إيرادات الملاعب: ${venueRev.toFixed(2)}</p><p>إيرادات المدربين: ${coachRev.toFixed(2)}</p><p>إيرادات المتاجر: ${storeRev.toFixed(2)}</p><p>إجمالي الرسوم: ${fee.toFixed(2)}</p>`;
    } else if (tab === 'stores') {
      html = '<table class="admin-table"><tr><th>الاسم</th><th>المالك</th><th>إجراءات</th></tr>';
      stores.forEach(s => { html += `<tr><td>${sanitizeInput(s.name)}</td><td>${users.find(u=>u.id===s.owner_id)?.full_name||'—'}</td><td><button class="btn-outline btn-sm edit-store-btn" data-id="${s.id}"><i class="fas fa-edit"></i></button><button class="btn-outline btn-sm delete-store-btn" data-id="${s.id}"><i class="fas fa-trash"></i></button></td></tr>`; });
      html += '</table>';
    } else if (tab === 'products') {
      html = '<table class="admin-table"><tr><th>الاسم</th><th>المتجر</th><th>السعر</th><th>إجراءات</th></tr>';
      products.forEach(p => { html += `<tr><td>${sanitizeInput(p.name)}</td><td>${stores.find(s=>s.id===p.store_id)?.name||''}</td><td>${p.price} ${symbol}</td><td><button class="btn-outline btn-sm edit-product-btn" data-id="${p.id}"><i class="fas fa-edit"></i></button><button class="btn-outline btn-sm delete-product-btn" data-id="${p.id}"><i class="fas fa-trash"></i></button></td></tr>`; });
      html += '</table>';
    }
    content.innerHTML = html;
  }

  // ========== التهيئة النهائية ==========
  (async function init() {
    showLoader();
    await getCurrentSession();
    if (currentUser) {
      const settings = await api.getUserSettings(currentUser.id);
      currentCurrency = settings?.preferred_currency || 'SAR';
      if (settings?.manual_location) customerLocation = settings.manual_location;
    }
    await refreshData();
    const mapEl = document.getElementById('map');
    if (mapEl) {
      map = L.map('map').setView([24.7136, 46.6753], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }
    if (customerLocation) map?.setView([customerLocation.lat, customerLocation.lng], 15);
    renderCourts();
    document.getElementById('filterBtn')?.addEventListener('click', () => renderCourts(document.getElementById('sportFilter')?.value));
    startPendingPaymentChecker();
    hideLoader();
  })();
})();
