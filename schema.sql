-- =============================================
-- 1. إضافة امتداد pgcrypto لتوليد UUID (إن لم يكن مثبتاً)
-- =============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- 2. جداول المستخدمين والمنشآت والملاعب
-- =============================================

-- الملف الشخصي للمستخدم (مرتبط بـ auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('customer', 'venue', 'coach', 'admin')) DEFAULT 'customer',
  is_blocked BOOLEAN DEFAULT false,
  penalty_balance DECIMAL DEFAULT 0,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- المنشآت
CREATE TABLE venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  lat DECIMAL,
  lng DECIMAL,
  image_url TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  requires_approval BOOLEAN DEFAULT false,
  has_capacity BOOLEAN DEFAULT false,
  max_capacity INT,
  allow_sharing BOOLEAN DEFAULT false,
  pricing JSONB DEFAULT '[40,50,60,70]',
  working_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- الملاعب
CREATE TABLE courts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT,
  multi_sport BOOLEAN DEFAULT false,
  sport TEXT,
  allowed_sports TEXT[],
  pricing JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- الحجوزات
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  venue_name TEXT,
  court_name TEXT,
  date DATE,
  time TIME,
  duration INT,
  price DECIMAL,
  app_fee DECIMAL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'مدفوع')) DEFAULT 'pending',
  rated BOOLEAN DEFAULT false,
  promo_code TEXT,
  payment_method TEXT,
  customer_rated_by_provider BOOLEAN DEFAULT false,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- المدربين
CREATE TABLE coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  phone TEXT,
  lat DECIMAL,
  lng DECIMAL,
  image_url TEXT,
  description TEXT,
  sport TEXT,
  hourly_rate DECIMAL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  working_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جلسات المدربين
CREATE TABLE coach_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE,
  time TIME,
  duration INT,
  price DECIMAL,
  app_fee DECIMAL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'مدفوع')) DEFAULT 'confirmed',
  rated BOOLEAN DEFAULT false,
  promo_code TEXT,
  payment_method TEXT,
  customer_rated_by_provider BOOLEAN DEFAULT false,
  customer_name TEXT,
  coach_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. جداول التقييمات
-- =============================================

-- تقييمات المنشآت
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  booking_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تقييمات المدربين
CREATE TABLE coach_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  booking_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تقييمات العملاء
CREATE TABLE customer_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_name TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  booking_id UUID,
  booking_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. جداول الكوبونات والمفضلة والدعوات
-- =============================================

-- الكوبونات
CREATE TABLE promos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'value')),
  discount_value DECIMAL,
  max_uses INT,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  applicable_to TEXT DEFAULT 'all',
  target_ids TEXT[]
);

-- المفضلة
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT CHECK (item_type IN ('venue', 'coach')),
  item_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- الدعوات المفتوحة للمباريات
CREATE TABLE open_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  sport TEXT,
  date_time TIMESTAMPTZ,
  duration INT,
  players_needed INT,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  court_name TEXT,
  notes TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  creator_name TEXT,
  joined_players JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. جداول المتجر والمنتجات والطلبات
-- =============================================

-- المتاجر
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  image_url TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE
);

-- المنتجات
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT,
  price DECIMAL,
  description TEXT,
  image_url TEXT
);

-- سلة المشتريات (لكل مستخدم)
CREATE TABLE store_cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  UNIQUE(user_id, product_id)
);

-- طلبات الشراء
CREATE TABLE store_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_name TEXT,
  items JSONB,
  total DECIMAL,
  status TEXT DEFAULT 'قيد التنفيذ',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. جداول الفرق والأعضاء والدعوات
-- =============================================

-- الفرق
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT,
  description TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  max_members INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- أعضاء الفرق
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- دعوات الفرق
CREATE TABLE team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  team_name TEXT,
  sport TEXT,
  max_members INT,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  creator_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. جداول الإغلاقات والإشعارات والإعدادات
-- =============================================

-- الإغلاقات (للملاعب والمدربين)
CREATE TABLE blackouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT CHECK (item_type IN ('court', 'coach')),
  item_id UUID,
  type TEXT CHECK (type IN ('day', 'hour')),
  date DATE,
  start_hour TEXT,
  duration INT,
  reason TEXT
);

-- الإشعارات
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  type TEXT DEFAULT 'info',
  related_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- الرياضات المخصصة
CREATE TABLE custom_sports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- المدفوعات المعلقة
CREATE TABLE pending_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_type TEXT,
  booking_id UUID,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إعدادات المستخدم
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_currency TEXT DEFAULT 'SAR',
  manual_location JSONB
);

-- =============================================
-- 8. تفعيل RLS لجميع الجداول
-- =============================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- =============================================
-- 9. سياسات RLS أساسية
-- =============================================

-- Profiles: المستخدم يرى ملفه الشخصي فقط (والأدمن يرى الكل)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Venues: الكل يرى المنشآت، المالك يعدل أو يحذف
CREATE POLICY "Anyone can view venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Owner can insert venue" ON venues FOR INSERT WITH CHECK (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Owner can update venue" ON venues FOR UPDATE USING (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Owner can delete venue" ON venues FOR DELETE USING (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Courts: الكل يرى الملاعب
CREATE POLICY "Anyone can view courts" ON courts FOR SELECT USING (true);
CREATE POLICY "Venue owner can manage courts" ON courts FOR INSERT WITH CHECK (auth.uid() IN (SELECT owner_id FROM venues WHERE id = venue_id) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Venue owner can update courts" ON courts FOR UPDATE USING (auth.uid() IN (SELECT owner_id FROM venues WHERE id = venue_id) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Venue owner can delete courts" ON courts FOR DELETE USING (auth.uid() IN (SELECT owner_id FROM venues WHERE id = venue_id) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Bookings: العميل يرى حجوزاته، المالك يرى حجوزات منشأته
CREATE POLICY "Customer can view own bookings" ON bookings FOR SELECT USING (auth.uid() = customer_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() IN (SELECT owner_id FROM venues WHERE id IN (SELECT venue_id FROM courts WHERE id = bookings.court_id)));
CREATE POLICY "Customer can create booking" ON bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customer or owner can update booking" ON bookings FOR UPDATE USING (auth.uid() = customer_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() IN (SELECT owner_id FROM venues WHERE id IN (SELECT venue_id FROM courts WHERE id = court_id)));

-- Coaches: الكل يرى المدربين
CREATE POLICY "Anyone can view coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "Coach owner can manage" ON coaches FOR INSERT WITH CHECK (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Coach owner can update" ON coaches FOR UPDATE USING (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Coach owner can delete" ON coaches FOR DELETE USING (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Coach Bookings: العميل والمدرب يرون جلساتهم
CREATE POLICY "Users see their coach bookings" ON coach_bookings FOR SELECT USING (auth.uid() = customer_id OR auth.uid() IN (SELECT owner_id FROM coaches WHERE id = coach_id) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Customer can create coach booking" ON coach_bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Reviews: الكل يرى التقييمات
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coach Reviews
CREATE POLICY "Anyone can view coach reviews" ON coach_reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create coach reviews" ON coach_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Customer Reviews
CREATE POLICY "Providers can view customer reviews" ON customer_reviews FOR SELECT USING (auth.uid() = reviewer_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Providers can create customer reviews" ON customer_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Promos: الأدمن فقط
CREATE POLICY "Admin manages promos" ON promos USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Favorites: المستخدم يرى مفضلته فقط
CREATE POLICY "Users see own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Open Invitations: الكل يرى الدعوات
CREATE POLICY "Anyone can view invitations" ON open_invitations FOR SELECT USING (true);
CREATE POLICY "Users can create invitations" ON open_invitations FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Stores: الكل يرى المتاجر
CREATE POLICY "Anyone can view stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Owner can manage store" ON stores FOR INSERT WITH CHECK (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Owner can update store" ON stores FOR UPDATE USING (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Owner can delete store" ON stores FOR DELETE USING (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Products: الكل يرى المنتجات
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Store owner can manage products" ON products FOR INSERT WITH CHECK (auth.uid() IN (SELECT owner_id FROM stores WHERE id = store_id) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Store owner can update products" ON products FOR UPDATE USING (auth.uid() IN (SELECT owner_id FROM stores WHERE id = store_id) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Store owner can delete products" ON products FOR DELETE USING (auth.uid() IN (SELECT owner_id FROM stores WHERE id = store_id) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Store Cart: المستخدم يرى سلته
CREATE POLICY "Users see own cart" ON store_cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to cart" ON store_cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update cart" ON store_cart FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from cart" ON store_cart FOR DELETE USING (auth.uid() = user_id);

-- Store Orders: العميل يرى طلباته، صاحب المتجر يرى طلبات متجره
CREATE POLICY "Customer sees own orders" ON store_orders FOR SELECT USING (auth.uid() = customer_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Customer can create order" ON store_orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Teams: الكل يرى الفرق
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Users can create team" ON teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update team" ON teams FOR UPDATE USING (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Owner can delete team" ON teams FOR DELETE USING (auth.uid() = owner_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Team Members: الكل يرى الأعضاء
CREATE POLICY "Anyone can view team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join team" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can remove member" ON team_members FOR DELETE USING (auth.uid() IN (SELECT owner_id FROM teams WHERE id = team_id) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Team Invitations: الكل يرى الدعوات
CREATE POLICY "Anyone can view team invitations" ON team_invitations FOR SELECT USING (true);
CREATE POLICY "Owner can create invitation" ON team_invitations FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Blackouts: صاحب المنشأة أو المدرب يدير الإغلاقات
CREATE POLICY "Owner can manage blackouts" ON blackouts FOR ALL USING (auth.uid() IN (SELECT owner_id FROM venues WHERE id = item_id) OR auth.uid() IN (SELECT owner_id FROM coaches WHERE id = item_id) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Notifications: المستخدم يرى إشعاراته فقط
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true); -- يمكن التضييق لاحقا

-- Custom Sports: الكل يرى، الأدمن يضيف
CREATE POLICY "Anyone can view sports" ON custom_sports FOR SELECT USING (true);
CREATE POLICY "Admin can insert sports" ON custom_sports FOR INSERT WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Pending Payments: المستخدم يرى مدفوعاته المعلقة
CREATE POLICY "Users see own pending payments" ON pending_payments FOR SELECT USING (auth.uid() = customer_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- User Settings: المستخدم يدير إعداداته
CREATE POLICY "Users manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 10. إنشاء دالة لإنشاء الملف الشخصي تلقائياً عند التسجيل
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف التريجر إذا كان موجوداً ثم إنشاؤه
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
