-- =============================================================================
-- SAAHS Seed Data SQL Script
-- Run this in your Supabase SQL Editor to populate mock data for testing.
-- =============================================================================

-- 1. Create Mock Profiles (Office Bearers)
INSERT INTO public.profiles (
  id, 
  full_name, 
  email, 
  phone_number, 
  department, 
  course, 
  batch_year, 
  roll_number, 
  avatar_url, 
  role, 
  membership_status, 
  onboarding_complete
) VALUES 
('00000000-0000-0000-0000-000000000001', 'Dr. Rajesh Kumar', 'rajesh.kumar@saahs.org', '+919876543210', 'Physiotherapy', 'BPT', '2022', 'BPT-2022-045', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh', 'President', 'Approved', true),
('00000000-0000-0000-0000-000000000002', 'Dr. Sneha Sharma', 'sneha.sharma@saahs.org', '+919876543211', 'Medical Laboratory Technology', 'BSc MLT', '2023', 'MLT-2023-012', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha', 'Literary Secretary', 'Approved', true),
('00000000-0000-0000-0000-000000000003', 'Dr. Amit Patel', 'amit.patel@saahs.org', '+919876543212', 'Radiography', 'BSc MRIT', '2022', 'MRIT-2022-009', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit', 'General Secretary', 'Approved', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Mock Notices
INSERT INTO public.notices (
  title, 
  content, 
  category, 
  attachment_url, 
  is_pinned, 
  created_by
) VALUES 
('Annual General Body Meeting 2026', 'All members are requested to attend the Annual General Body Meeting scheduled for next Friday at 4:00 PM in the main auditorium. Agenda items include budget review and executive committee elections.', 'Administrative', NULL, true, '00000000-0000-0000-0000-000000000001'),
('Mid-Semester Examination Schedule Out', 'The academic committee has released the schedule for the upcoming mid-semester examinations. Please check the department notice board or download the PDF attached here.', 'Academic', 'http://187.77.188.200:9000/saahs/exams-schedule.pdf', false, '00000000-0000-0000-0000-000000000002'),
('Call for Submissions: SAAHS Annual Magazine', 'Unleash your creativity! The Literary Club invites articles, essays, poems, and artwork for the upcoming edition of our annual magazine "Pulse". Submit your work before the end of this month.', 'General', NULL, false, '00000000-0000-0000-0000-000000000002'),
('Membership Drive Extension', 'Good news! The deadline for SAAHS membership registration has been extended by one week. Interested allied health students can register through the online portal.', 'Circular', NULL, true, '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- 3. Create Mock Events
INSERT INTO public.events (
  title, 
  description, 
  category, 
  banner_url, 
  schedule, 
  venue, 
  organizer_info, 
  past_archive
) VALUES 
('National Allied Health Sciences Conference', 'Join industry leaders and academic pioneers for a two-day national conference discussing emerging trends, clinical research, and technologies in Allied Health Sciences.', 'Conferences', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop', NOW() + INTERVAL '5 days', 'Main Auditorium, PGIMER', 'Organized by SAAHS Executive Committee', false),
('Hands-on Workshop: Advanced Life Support', 'A certified clinical workshop focusing on advanced cardiovascular life support (ACLS) and basic life support (BLS) protocols. Highly recommended for final-year students.', 'Workshops', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop', NOW() + INTERVAL '12 days', 'Clinical Simulation Lab, Block B', 'Organized by Literary & Academic Committee', false),
('Allied Health Cultural Fest - Rhythm 2026', 'Celebrate talent and diversity at our annual cultural fest. Events include dance competitions, music performances, drama, and art exhibitions followed by a guest performance.', 'Cultural', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop', NOW() + INTERVAL '25 days', 'University Playground', 'Organized by Cultural Society', false),
('Academic Seminar on Evidence-Based Practice', 'An interactive seminar focusing on integrating research evidence with clinical expertise in allied health fields.', 'Academic', NULL, NOW() + INTERVAL '1 day', 'Seminar Room 3, Department of Physiotherapy', 'Organized by Dept of Physiotherapy & SAAHS', false),
('Inter-Departmental Football Tournament', 'Register your department teams for the annual SAAHS Football League. Trophies and cash prizes for winners and runners-up.', 'Sports', NULL, NOW() - INTERVAL '5 days', 'Main Sports Ground', 'Organized by Sports Committee', true)
ON CONFLICT DO NOTHING;

-- 4. Create Mock Library Resources
INSERT INTO public.library_resources (
  title, 
  category, 
  file_url, 
  file_size_bytes, 
  mime_type, 
  upload_by
) VALUES 
('Anatomy and Physiology Study Guide', 'Notes', 'http://187.77.188.200:9000/saahs/anatomy_study_guide.pdf', 2451000, 'application/pdf', '00000000-0000-0000-0000-000000000002'),
('Pathology Solved Papers (2020-2024)', 'Previous Year Papers', 'http://187.77.188.200:9000/saahs/pathology_solved_papers.pdf', 4120000, 'application/pdf', '00000000-0000-0000-0000-000000000002'),
('Clinical SOPs for Radiography Practice', 'SOPs', 'http://187.77.188.200:9000/saahs/radiography_sop.pdf', 1250000, 'application/pdf', '00000000-0000-0000-0000-000000000002'),
('Recent Advances in Neurorehabilitation', 'Research Papers', 'http://187.77.188.200:9000/saahs/neurorehab_advances.pdf', 3800000, 'application/pdf', '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;
