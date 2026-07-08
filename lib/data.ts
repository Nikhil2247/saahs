// Centralized mock data for the SAAHS portal.
// Structured to be easily swappable with Supabase queries later.

export type UserRole = "student" | "admin"
export type NoticePriority = "high" | "medium" | "low"

export interface User {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  rollNo?: string
  department?: string
  phone?: string
  bio?: string
  profileImage?: string // base64 encoded
  createdAt: string
}

export interface Notice {
  id: string
  title: string
  category: string
  date: string
  priority: NoticePriority
  pinned: boolean
  body: string
}

export interface SaahsEvent {
  id: string
  title: string
  type: "Academic" | "Cultural" | "Sports"
  date: string
  time: string
  venue: string
  description: string
}

export interface OfficeBearer {
  id: string
  name: string
  position: string
  department: string
  email: string
  tenure: string
}

export interface Department {
  id: string
  name: string
  short: string
  members: number
  coordinator: string
}

export interface LibraryResource {
  id: string
  title: string
  type: "Notes" | "Previous Papers" | "SOP" | "Guideline"
  department: string
  format: string
  size: string
  updated: string
}

export interface Ticket {
  id: string
  subject: string
  category: string
  status: "Open" | "In Review" | "Resolved"
  submitted: string
  anonymous: boolean
}

export interface Grievance {
  id: string
  subject: string
  category: string
  description: string
  submitted: string
  status: "Open" | "In Review" | "Resolved"
  anonymous: boolean
  studentName?: string
  rollNo?: string
}

export interface MembershipRequest {
  id: string
  name: string
  rollNo: string
  department: string
  year: string
  applied: string
  status: "Pending" | "Approved" | "Rejected"
}

export const stats = [
  { label: "Departments", value: 11, suffix: "+" },
  { label: "Active Members", value: 1240, suffix: "+" },
  { label: "Events Conducted", value: 86, suffix: "" },
  { label: "Student Participation", value: 92, suffix: "%" },
]

export const notices: Notice[] = [
  {
    id: "N-2041",
    title: "Annual Allied Health Sciences Convention 2026 — Registration Open",
    category: "Event",
    date: "2026-07-02",
    priority: "high",
    pinned: true,
    body: "Registrations for the flagship annual convention are now open for all member departments. Delegates must confirm participation through the portal dashboard before the closing date. Certificates will be issued to all registered attendees.",
  },
  {
    id: "N-2040",
    title: "Revised Stipend Disbursement Schedule for MLT & Radiography",
    category: "Administrative",
    date: "2026-06-28",
    priority: "high",
    pinned: true,
    body: "The finance office has revised the monthly stipend disbursement cycle. Students are advised to verify their bank details on the portal to avoid delays in credit for the current quarter.",
  },
  {
    id: "N-2039",
    title: "Elective Skill Workshop: Point-of-Care Diagnostics",
    category: "Academic",
    date: "2026-06-24",
    priority: "medium",
    pinned: false,
    body: "A two-day hands-on workshop covering modern point-of-care diagnostic instrumentation will be held in Research Block B. Seats are limited to 40 participants on a first-come basis.",
  },
  {
    id: "N-2038",
    title: "Hostel Allotment Grievance Window Now Active",
    category: "Welfare",
    date: "2026-06-20",
    priority: "medium",
    pinned: false,
    body: "Students facing hostel allotment issues can raise grievances through the Help Desk. The welfare committee will review submissions on a rolling basis.",
  },
  {
    id: "N-2037",
    title: "Library Digitization Drive — Submit Your Notes",
    category: "E-Library",
    date: "2026-06-15",
    priority: "low",
    pinned: false,
    body: "Contribute peer-reviewed notes and question banks to the growing SAAHS e-library. Approved submissions will be credited to the contributing member.",
  },
]

export const events: SaahsEvent[] = [
  {
    id: "E-101",
    title: "National Allied Health Research Symposium",
    type: "Academic",
    date: "2026-07-18",
    time: "09:30 AM",
    venue: "Bhargava Auditorium, PGIMER",
    description: "Poster presentations, keynote lectures and inter-departmental research showcases.",
  },
  {
    id: "E-102",
    title: "Inter-Department Cultural Night — Aarambh",
    type: "Cultural",
    date: "2026-07-25",
    time: "06:00 PM",
    venue: "Open Air Theatre, Campus",
    description: "An evening of music, dance and drama celebrating allied health student talent.",
  },
  {
    id: "E-103",
    title: "SAAHS Premier Sports League",
    type: "Sports",
    date: "2026-08-02",
    time: "07:00 AM",
    venue: "Sports Complex Ground",
    description: "Cricket, badminton and athletics fixtures across all member departments.",
  },
  {
    id: "E-104",
    title: "Clinical Documentation & SOP Bootcamp",
    type: "Academic",
    date: "2026-08-09",
    time: "10:00 AM",
    venue: "Seminar Hall, Research Block B",
    description: "Practical training on standardized clinical documentation practices.",
  },
  {
    id: "E-105",
    title: "Wellness & Yoga Retreat",
    type: "Sports",
    date: "2026-08-14",
    time: "06:30 AM",
    venue: "Central Lawns",
    description: "A morning of guided yoga and mindfulness for members and faculty.",
  },
  {
    id: "E-106",
    title: "Photography & Arts Exhibition",
    type: "Cultural",
    date: "2026-08-20",
    time: "11:00 AM",
    venue: "Gallery, Research Block B",
    description: "Curated exhibition of student artwork and campus photography.",
  },
]

export const officeBearers: OfficeBearer[] = [
  {
    id: "OB-1",
    name: "Dr. Aditi Sharma",
    position: "President",
    department: "Medical Laboratory Technology",
    email: "president@saahs.pgimer.edu.in",
    tenure: "2025 – 2026",
  },
  {
    id: "OB-2",
    name: "Rohan Verma",
    position: "Vice-President",
    department: "Radiography & Imaging",
    email: "vp@saahs.pgimer.edu.in",
    tenure: "2025 – 2026",
  },
  {
    id: "OB-3",
    name: "Simran Kaur",
    position: "General Secretary",
    department: "Physiotherapy",
    email: "gs@saahs.pgimer.edu.in",
    tenure: "2025 – 2026",
  },
  {
    id: "OB-4",
    name: "Karan Mehta",
    position: "Treasurer",
    department: "Optometry",
    email: "treasurer@saahs.pgimer.edu.in",
    tenure: "2025 – 2026",
  },
  {
    id: "OB-5",
    name: "Neha Gupta",
    position: "Academic Secretary",
    department: "Nutrition & Dietetics",
    email: "academics@saahs.pgimer.edu.in",
    tenure: "2025 – 2026",
  },
  {
    id: "OB-6",
    name: "Arjun Nair",
    position: "Cultural Secretary",
    department: "Operation Theatre Technology",
    email: "cultural@saahs.pgimer.edu.in",
    tenure: "2025 – 2026",
  },
  {
    id: "OB-7",
    name: "Priya Menon",
    position: "Sports Secretary",
    department: "Respiratory Therapy",
    email: "sports@saahs.pgimer.edu.in",
    tenure: "2025 – 2026",
  },
  {
    id: "OB-8",
    name: "Vikram Singh",
    position: "Welfare Secretary",
    department: "Anaesthesia Technology",
    email: "welfare@saahs.pgimer.edu.in",
    tenure: "2025 – 2026",
  },
]

export const departments: Department[] = [
  { id: "D-1", name: "Medical Laboratory Technology", short: "MLT", members: 186, coordinator: "Dr. R. Bansal" },
  { id: "D-2", name: "Radiography & Imaging Technology", short: "RIT", members: 142, coordinator: "Dr. S. Kapoor" },
  { id: "D-3", name: "Physiotherapy", short: "PT", members: 168, coordinator: "Dr. M. Joshi" },
  { id: "D-4", name: "Optometry", short: "OPT", members: 94, coordinator: "Dr. A. Rao" },
  { id: "D-5", name: "Nutrition & Dietetics", short: "N&D", members: 88, coordinator: "Dr. P. Iyer" },
  { id: "D-6", name: "Operation Theatre Technology", short: "OTT", members: 76, coordinator: "Dr. K. Das" },
  { id: "D-7", name: "Respiratory Therapy", short: "RT", members: 64, coordinator: "Dr. L. Fernandes" },
  { id: "D-8", name: "Anaesthesia Technology", short: "AT", members: 71, coordinator: "Dr. N. Bhatt" },
  { id: "D-9", name: "Dialysis Technology", short: "DT", members: 58, coordinator: "Dr. V. Chauhan" },
  { id: "D-10", name: "Perfusion Technology", short: "PFT", members: 43, coordinator: "Dr. T. Reddy" },
  { id: "D-11", name: "Emergency & Trauma Care", short: "ETC", members: 62, coordinator: "Dr. H. Gill" },
]

export const libraryResources: LibraryResource[] = [
  { id: "L-1", title: "Clinical Biochemistry — Complete Notes", type: "Notes", department: "MLT", format: "PDF", size: "4.2 MB", updated: "2026-06-30" },
  { id: "L-2", title: "Radiographic Positioning — Previous Year Papers", type: "Previous Papers", department: "RIT", format: "PDF", size: "2.1 MB", updated: "2026-06-27" },
  { id: "L-3", title: "Sterilization SOP — Operation Theatre", type: "SOP", department: "OTT", format: "PDF", size: "1.4 MB", updated: "2026-06-25" },
  { id: "L-4", title: "Musculoskeletal Assessment Handbook", type: "Notes", department: "PT", format: "PDF", size: "6.8 MB", updated: "2026-06-22" },
  { id: "L-5", title: "Refraction Techniques — Question Bank", type: "Previous Papers", department: "OPT", format: "PDF", size: "1.9 MB", updated: "2026-06-18" },
  { id: "L-6", title: "Therapeutic Diet Planning Guidelines", type: "Guideline", department: "N&D", format: "PDF", size: "3.3 MB", updated: "2026-06-14" },
  { id: "L-7", title: "Ventilator Management SOP", type: "SOP", department: "RT", format: "PDF", size: "2.6 MB", updated: "2026-06-11" },
  { id: "L-8", title: "Hemodialysis Procedure Manual", type: "Guideline", department: "DT", format: "PDF", size: "5.1 MB", updated: "2026-06-08" },
]

export const studentTickets: Ticket[] = [
  { id: "TKT-5521", subject: "Delay in stipend credit for June", category: "Stipend", status: "In Review", submitted: "2026-06-29", anonymous: false },
  { id: "TKT-5498", subject: "Request for additional lab access hours", category: "Academic", status: "Open", submitted: "2026-06-21", anonymous: false },
  { id: "TKT-5460", subject: "Hostel water supply issue — Block C", category: "Hostel", status: "Resolved", submitted: "2026-06-10", anonymous: true },
]

export const grievances: Grievance[] = [
  {
    id: "GR-2001",
    subject: "Unfair marks distribution in practical exam",
    category: "Academic",
    description: "The practical exam scoring seems unfair. Students with similar performance received different marks.",
    submitted: "2026-07-03",
    status: "In Review",
    anonymous: false,
    studentName: "Ananya Bose",
    rollNo: "MLT-2026-041",
  },
  {
    id: "GR-2002",
    subject: "Hostel facility maintenance",
    category: "Hostel",
    description: "Water supply is interrupted daily between 2-4 PM in Block C hostel.",
    submitted: "2026-07-02",
    status: "Open",
    anonymous: true,
  },
  {
    id: "GR-2003",
    subject: "Stipend delay issue resolved",
    category: "Stipend",
    description: "June stipend was delayed by 15 days. This has now been rectified.",
    submitted: "2026-06-29",
    status: "Resolved",
    anonymous: false,
    studentName: "Dev Patel",
    rollNo: "RIT-2026-018",
  },
  {
    id: "GR-2004",
    subject: "Library resource availability",
    category: "Library",
    description: "Many reference books mentioned in course curriculum are not available in the library.",
    submitted: "2026-06-28",
    status: "Open",
    anonymous: false,
    studentName: "Ishita Roy",
    rollNo: "PT-2025-112",
  },
]

export const membershipRequests: MembershipRequest[] = [
  { id: "MR-901", name: "Ananya Bose", rollNo: "MLT-2026-041", department: "MLT", year: "1st Year", applied: "2026-07-01", status: "Pending" },
  { id: "MR-902", name: "Dev Patel", rollNo: "RIT-2026-018", department: "RIT", year: "1st Year", applied: "2026-07-01", status: "Pending" },
  { id: "MR-903", name: "Ishita Roy", rollNo: "PT-2025-112", department: "PT", year: "2nd Year", applied: "2026-06-30", status: "Pending" },
  { id: "MR-904", name: "Manav Kohli", rollNo: "OPT-2026-007", department: "OPT", year: "1st Year", applied: "2026-06-30", status: "Pending" },
  { id: "MR-905", name: "Sara Khan", rollNo: "N&D-2025-054", department: "N&D", year: "2nd Year", applied: "2026-06-29", status: "Pending" },
]

export const registeredEvents = [
  { id: "E-101", title: "National Allied Health Research Symposium", date: "2026-07-18", role: "Delegate" },
  { id: "E-102", title: "Inter-Department Cultural Night — Aarambh", date: "2026-07-25", role: "Performer" },
  { id: "E-104", title: "Clinical Documentation & SOP Bootcamp", date: "2026-08-09", role: "Participant" },
]

export const helpDeskCategories = [
  "Academic",
  "Stipend",
  "Hostel",
  "Infrastructure",
  "Examination",
  "Library",
  "Welfare",
  "Other",
]

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Leadership", href: "/leadership" },
  { label: "Departments", href: "/departments" },
  { label: "E-Library", href: "/e-library" },
  { label: "Help Desk", href: "/help-desk" },
  { label: "Notices", href: "/notices" },
]

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
