-- =========================================================
-- LPFA Website — Staff & Board Members Tables + Seed Data
-- Run this in Supabase SQL Editor
-- =========================================================

-- Staff Members table
CREATE TABLE IF NOT EXISTS staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  phone text,
  email text,
  photo_url text,
  bio text,
  sort_order int DEFAULT 0,
  is_special boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Board Members table
CREATE TABLE IF NOT EXISTS board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  photo_url text,
  bio text,
  term_text text,
  sort_order int DEFAULT 0,
  is_officer boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read published staff" ON staff_members
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can read published board" ON board_members
  FOR SELECT USING (is_published = true);

-- Authenticated users can do everything (admin)
CREATE POLICY "Authenticated users can manage staff" ON staff_members
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage board" ON board_members
  FOR ALL USING (auth.role() = 'authenticated');

-- =========================================================
-- Seed: Staff Members
-- =========================================================
INSERT INTO staff_members (name, title, phone, email, photo_url, bio, sort_order, is_special) VALUES
('Tiffany McClelland', 'Executive Director', '440-204-1194, Ext. 104', 'tmcclelland@lorainportauthority.com', '/images/Tiffany.jpg', NULL, 0, false),
('Tom Brown', 'Operations Director', '440-204-2265, Ext. 103', 'tbrown@lorainportauthority.com', '/images/Brown-1-450x537.jpg', NULL, 1, false),
('Sarah Gool', 'Project & Site Strategy Manager', '440-296-7363, Ext. 108', 'sgool@lorainportauthority.com', '/images/SGool-2-450x563.jpg', NULL, 2, false),
('Yvonne Smith', 'Accountant', '440-204-2268, Ext. 102', 'ysmith@lorainportauthority.com', '/images/YSmith-2-450x563.jpg', NULL, 3, false),
('Kelsey Smith', 'Office Manager', '440-204-2267, Ext. 101', 'ksmith@lorainportauthority.com', '/images/KSmith-2-450x563.jpg', NULL, 4, false),
('Lil', 'Goose Dog', NULL, NULL, '/images/Lil-2-450x562.jpg', 'A female Border Collie born December 18, 2015 in Scotland. Lil specializes in humanely dispersing wild geese from our waterfront facilities.', 5, true);

-- =========================================================
-- Seed: Board Members
-- =========================================================
INSERT INTO board_members (name, role, photo_url, bio, term_text, sort_order, is_officer) VALUES
('Brad Mullins', 'Chairman', '/images/Mullins-1-450x529.jpg', '<p>Brad Mullins is Chief Operating Officer of Amware Companies. He provides over 22 years experience in executive management, specializing in sales and marketing, distribution, logistics, and business development.</p><p>His experience in business development has provided him a keen understanding of all facets of running a successful business. Brad brings a wide range of experience at an executive level with large companies like Frito-Lay, Nestle USA, and Michael Foods.</p><p>Brad holds an undergraduate degree from Wittenberg University where he played four years of NCAA collegiate football. He was inducted into the Lorain Sports Hall of Fame in 2002.</p><p>Brad is also co-owner in a real estate management company with properties throughout the city of Lorain.</p>', NULL, 0, true),
('Jeff Zellers', 'Vice Chairman', '/images/JZellers-1-450x563.jpg', '<p>A native of Westlake who has lived in Lorain since 1985, Jeff Zellers is Vice President with The Brewer-Garrett Company. He has over 37 years of experience in engineering, energy services, construction support service maintenance and accounting.</p><p>Jeff''s attention to detail, standards of quality and commitment to the client have made him a respected member of the HVAC industry. He served as Treasurer for MCA, and has served on the Pipefitting Apprenticeship Committee.</p><p>Jeff received his undergraduate degree in Industrial Technology from Ball State University. He and his wife Jane have three daughters and attend St. Anthony''s Parish.</p>', NULL, 1, true),
('Jacqueline Jakacki', 'Board Member', '/images/JJakacki-450x562.jpg', '<p>Jacqueline Jakacki was appointed to the port''s board of directors in May 2025. She is a realtor and team leader for the RE/MAX Above & Beyond real estate company.</p><p>Jakacki also serves as an executive board member for Main Street Lorain, as a committee member for the Cinco de Mayo Parade, and as co-chair of the Pets 4 Vets Golf Outing.</p>', 'May 2025 – May 2029', 2, false),
('Hannah Kiraly', 'Board Member', '/images/HKiraly-1-450x562.jpg', '<p>Hannah Kiraly was appointed to the Lorain Port and Finance Authority Board of Directors in May 2022.</p><p>With nearly a decade dedicated to urban environments, Ms. Kiraly specializes in research, analysis, and data-driven solutions for complex community challenges. She serves as Program Manager overseeing the Community and Economic Development Division at the City of Lorain.</p><p>Ms. Kiraly earned her A.A. Degree from Cuyahoga Community College (2015), a B.A. in Regional Planning from Cleveland State University (2017), and a Masters of Nonprofit Organizations from Case Western Reserve University (2021).</p>', 'Appointed: May 2022', 3, false),
('Vassie Scott', 'Board Member', '/images/Scott-2-450x496.jpg', '<p>Vassie Scott was appointed to the Lorain Port and Finance Authority Board of Directors in February 2021. He graduated from Clearview High School and attended the University of Dayton.</p><p>He retired from Prudential Financial after 34 years of service and is currently a member of The Scott Group, Inc. During his career he earned multiple designations including Chartered Life Underwriter (CLU) and Chartered Financial Consultant (ChFC).</p><p>He currently resides in Amherst, Ohio with his family.</p>', 'Appointed: February 2021', 4, false),
('Michele Silva Arredondo', 'Board Member', '/images/Silva-Arredondo-1-450x542.jpg', '<p>Michele Silva Arredondo was appointed to the Lorain Port and Finance Authority Board of Directors in November 2022.</p>', 'Appointed: November 2022', 5, false),
('Aaron Simmons', 'Board Member', '/images/Simmons-1-450x534.jpg', '<p>Aaron Simmons (Jevon Terance) was appointed to the Lorain Port and Finance Authority Board of Directors May 7, 2024. His term continues through May 6, 2028.</p>', 'May 2024 – May 2028', 6, false),
('Jon Veard Jr.', 'Board Member', '/images/Veard-1-450x506.jpg', '<p>Jon R. Veard Jr. was appointed to the Lorain Port and Finance Authority Board of Directors in June 2020. He is the owner of Veard Construction Inc. in Lorain, OH.</p>', 'Appointed: June 2020', 7, false),
('Alan Zgonc', 'Board Member', '/images/AZgonc-1-450x562.jpg', '<p>Alan Zgonc is a Lorain resident who was appointed to the Lorain Port and Finance Authority Board of Directors in January 2015. He graduated from Lorain Admiral King in 1965 and went on to study psychology at The Ohio State University.</p>', 'Appointed: January 2015', 8, false);
