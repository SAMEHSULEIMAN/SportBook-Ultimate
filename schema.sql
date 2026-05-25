-- ================================================
--  SportBook Ultimate - Supabase Schema (الجزء 1)
-- ================================================

-- 1. جدول الملفات الشخصية (مرتبط بـ auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('customer', 'venue', 'coach', 'admin')) DEFAULT 'customer',
  is_blocked BOOLEAN DEFAULT false,
  penalty_balance DECIMAL DEFAULT 0,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. المنشآت
CREATE TABLE venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  lat DECIMAL,
  lng DECIMAL,
  image_url TEXT,
  owner_id UUID REFERENCES profiles(id),
  pricing DECIMAL[] DEFAULT '{40,50,60,70}',
  working_hours JSONB,
  requires_approval BOOLEAN DEFAULT false,
  has_capacity BOOLEAN DEFAULT false,
  max_capacity INT,
  allow_sharing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. الملاعب
CREATE TABLE courts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  multi_sport BOOLEAN DEFAULT false,
  sport TEXT,
  allowed_sports TEXT[],
  pricing DECIMAL[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. المدربون
CREATE TABLE coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  lat DECIMAL,
  lng DECIMAL,
  image_url TEXT,
  description TEXT,
  sport TEXT,
  hourly_rate DECIMAL DEFAULT 100,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. توفر المدربين (ساعات العمل)
CREATE TABLE coach_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  day_of_week TEXT, -- 'sun', 'mon', ...
  start_time TIME,
  end_time TIME,
  UNIQUE(coach_id, day_of_week)
);

-- 6. حجوزات الملاعب
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES profiles(id),
  date DATE,
  time TIME,
  duration INT,
  price DECIMAL,
  app_fee DECIMAL,
  status TEXT DEFAULT 'pending',
  rated BOOLEAN DEFAULT false,
  customer_rated_by_provider BOOLEAN DEFAULT false,
  promo_code TEXT,
  payment_method TEXT,
  recurring_group_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. جلسات المدربين
CREATE TABLE coach_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES profiles(id),
  date DATE,
  time TIME,
  duration INT,
  price DECIMAL,
  app_fee DECIMAL,
  status TEXT DEFAULT 'confirmed',
  rated BOOLEAN DEFAULT false,
  customer_rated_by_provider BOOLEAN DEFAULT false,
  promo_code TEXT,
  payment_method TEXT,
  recurring_group_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. الكوبونات
CREATE TABLE promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'value')),
  discount_value DECIMAL,
  max_uses INT,
  used_count INT DEFAULT 0,
  valid_from DATE,
  valid_until DATE,
  applicable_to TEXT DEFAULT 'all',
  target_ids TEXT[]
);

-- 9. المفضلة
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT CHECK (item_type IN ('venue', 'coach')),
  item_id UUID,
  UNIQUE(user_id, item_type, item_id)
);

-- 10. تقييمات المنشآت
CREATE TABLE venue_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. تقييمات المدربين
CREATE TABLE coach_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  booking_id UUID REFERENCES coach_bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. تقييمات العملاء (من قبل مقدم الخدمة)
CREATE TABLE customer_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id),
  reviewer_id UUID REFERENCES profiles(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  booking_id UUID,
  booking_type TEXT CHECK (booking_type IN ('court', 'coach')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. الدعوات المفتوحة
CREATE TABLE open_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  sport TEXT,
  date_time TIMESTAMPTZ,
  duration INT,
  players_needed INT,
  court_id UUID REFERENCES courts(id),
  court_name TEXT,
  notes TEXT,
  creator_id UUID REFERENCES profiles(id),
  creator_name TEXT,
  joined_players JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
--  SportBook Ultimate - Supabase Schema (الجزء 2)
-- ================================================

-- 14. المتاجر
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id),
  phone TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. المنتجات
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. سلة مشتريات المتجر (لكل مستخدم)
CREATE TABLE store_cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT DEFAULT 1,
  UNIQUE(user_id, product_id)
);

-- 17. طلبات المتجر
CREATE TABLE store_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id),
  items JSONB,
  total DECIMAL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. الفرق
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT,
  description TEXT,
  logo_url TEXT,
  max_members INT DEFAULT 5,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. أعضاء الفرق
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 20. دعوات الفرق
CREATE TABLE team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  team_name TEXT,
  sport TEXT,
  max_members INT,
  creator_id UUID REFERENCES profiles(id),
  creator_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. الإشعارات
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  type TEXT DEFAULT 'info',
  related_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. مجموعات الحجوزات المتكررة
CREATE TABLE recurring_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('court', 'coach')),
  start_date DATE,
  end_date DATE,
  pattern TEXT,
  count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. المدفوعات المعلقة
CREATE TABLE pending_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('court', 'coach')),
  booking_id UUID,
  customer_id UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. قائمة الرياضات المخصصة
CREATE TABLE custom_sports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- 25. إعدادات المستخدم (العملة، اللغة، الموقع اليدوي، السلة)
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_currency TEXT DEFAULT 'SAR',
  language TEXT DEFAULT 'ar',
  manual_location JSONB,
  cart_data JSONB
);

-- 26. الإغلاقات (Blackouts)
CREATE TABLE blackouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT CHECK (item_type IN ('court', 'coach')),
  item_id UUID,
  date DATE,
  start_hour TIME,
  duration INT,
  reason TEXT
);

-- ================================================
--  سياسات الأمان (Row Level Security)
-- ================================================

-- تفعيل RLS على الجداول الرئيسية
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_sports ENABLE ROW LEVEL SECURITY;

-- سياسات عامة: الملفات الشخصية
CREATE POLICY "Public profiles read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- المنشآت: القراءة عامة، الإدارة للمالك
CREATE POLICY "Public venues read" ON venues FOR SELECT USING (true);
CREATE POLICY "Owner manage venues" ON venues FOR ALL USING (auth.uid() = owner_id);

-- الملاعب: القراءة عامة، الإدارة للمالك عبر المنشأة
CREATE POLICY "Public courts read" ON courts FOR SELECT USING (true);
CREATE POLICY "Owner manage courts" ON courts FOR ALL USING (
  EXISTS (SELECT 1 FROM venues WHERE id = courts.venue_id AND owner_id = auth.uid())
);

-- المدربون: القراءة عامة، الإدارة للمالك
CREATE POLICY "Public coaches read" ON coaches FOR SELECT USING (true);
CREATE POLICY "Coach manage own" ON coaches FOR ALL USING (auth.uid() = owner_id);

-- الحجوزات: العميل يرى حجوزاته، المالك يرى حجوزات منشأته
CREATE POLICY "Customers see own bookings" ON bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Venue owners see their bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM venues WHERE id = bookings.venue_id AND owner_id = auth.uid())
);
CREATE POLICY "Customers create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers update own bookings" ON bookings FOR UPDATE USING (auth.uid() = customer_id);

-- جلسات المدربين: العميل يرى جلساته، المدرب يرى جلساته
CREATE POLICY "Customers see own coach bookings" ON coach_bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Coaches see their sessions" ON coach_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM coaches WHERE id = coach_bookings.coach_id AND owner_id = auth.uid())
);
CREATE POLICY "Customers create coach bookings" ON coach_bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- الإشعارات: المستخدم يرى إشعاراته فقط
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- المفضلة: المستخدم يرى مفضلته فقط
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- المتاجر: القراءة عامة، الإدارة للمالك
CREATE POLICY "Public stores read" ON stores FOR SELECT USING (true);
CREATE POLICY "Owner manage stores" ON stores FOR ALL USING (auth.uid() = owner_id);

-- المنتجات: القراءة عامة، الإدارة لمالك المتجر
CREATE POLICY "Public products read" ON products FOR SELECT USING (true);
CREATE POLICY "Owner manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE id = products.store_id AND owner_id = auth.uid())
);

-- طلبات المتجر: العميل يرى طلباته، مالك المتجر يرى طلبات متجره
CREATE POLICY "Customers see own orders" ON store_orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Store owners see orders" ON store_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM stores WHERE id = products.store_id AND owner_id = auth.uid())
);

-- الدعوات المفتوحة: عامة للجميع
CREATE POLICY "Public invitations read" ON open_invitations FOR SELECT USING (true);

-- الفرق: عامة للقراءة، القائد يدير فريقه
CREATE POLICY "Public teams read" ON teams FOR SELECT USING (true);
CREATE POLICY "Owner manage teams" ON teams FOR ALL USING (auth.uid() = owner_id);

-- أعضاء الفرق: عامة للقراءة، القائد يدير
CREATE POLICY "Public members read" ON team_members FOR SELECT USING (true);
CREATE POLICY "Owner manage members" ON team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND owner_id = auth.uid())
);

-- تفضيلات المستخدم: خاصة بكل مستخدم
CREATE POLICY "Users manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- الإغلاقات: عامة للقراءة، المالك يدير
CREATE POLICY "Public blackouts read" ON blackouts FOR SELECT USING (true);
CREATE POLICY "Owner manage blackouts" ON blackouts FOR ALL USING (
  (item_type = 'court' AND EXISTS (SELECT 1 FROM courts WHERE id = item_id AND venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())))
  OR (item_type = 'coach' AND EXISTS (SELECT 1 FROM coaches WHERE id = item_id AND owner_id = auth.uid()))
);

-- تقييمات المنشآت: عامة للقراءة، العملاء ينشئون
CREATE POLICY "Public venue reviews read" ON venue_reviews FOR SELECT USING (true);
CREATE POLICY "Customers create venue reviews" ON venue_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- تقييمات المدربين: عامة للقراءة، العملاء ينشئون
CREATE POLICY "Public coach reviews read" ON coach_reviews FOR SELECT USING (true);
CREATE POLICY "Customers create coach reviews" ON coach_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- تقييمات العملاء: عامة للقراءة، مقدمو الخدمة ينشئون
CREATE POLICY "Public customer reviews read" ON customer_reviews FOR SELECT USING (true);
CREATE POLICY "Providers create customer reviews" ON customer_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- الكوبونات: الأدمن فقط
CREATE POLICY "Admin manage promos" ON promo_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- مجموعات الحجوزات المتكررة: عامة
CREATE POLICY "Public recurring groups" ON recurring_groups FOR SELECT USING (true);

-- المدفوعات المعلقة: العميل يرى فقط ما يخصه
CREATE POLICY "Customers see own pending payments" ON pending_payments FOR SELECT USING (auth.uid() = customer_id);

-- الرياضات المخصصة: عامة
CREATE POLICY "Public custom sports" ON custom_sports FOR SELECT USING (true);