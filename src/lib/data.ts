export type ProjectMedia = {
  id: string;
  type: 'image' | 'video' | 'story';
  before: string; // URL for image/video, text for story
  after: string; // URL for image/video, text for story
  description: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  goal: number;
  raised: number;
  media?: ProjectMedia[];
};

export type TransactionMode = 'Online' | 'Refund' | 'Wallet' | 'Manual';

export type Payment = {
  id: string;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number;
  date: string;
  projectId: string;
  projectName: string;
  mode: TransactionMode;
  reason?: string;
  attachmentName?: string;
  attachmentUri?: string;
};

export type Debit = {
  id: string;
  description: string;
  amount: number;
  date: string;
  projectId: string;
  projectName: string;
  reason?: string;
  attachmentName?: string;
  attachmentUri?: string;
};

export type Permissions = {
  dashboard: boolean;
  projects: boolean;
  emergency: boolean;
  payments: boolean;
  donors: boolean;
  staff: boolean;
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  avatar: string;
  permissions: Permissions;
  workingHours: { start: string; end: string; };
};

export type EmergencyCampaign = {
  id: string;
  name: string;
  description: string;
  goal: number;
  isActive: boolean;
  broadcastMessage: string;
  projectId: string;
};

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const todayString = `${year}-${month}-${day}`;

export const projects: Project[] = [
  { 
    id: 'proj-1', 
    name: 'Mukkam Muslim Orphanage', 
    description: 'Providing care and education for orphaned children.', 
    goal: 50000, 
    raised: 35000,
    media: [
      {
        id: 'media-1',
        type: 'image',
        before: 'https://placehold.co/600x400.png',
        after: 'https://placehold.co/600x400.png',
        description: 'New well construction site before and after completion.'
      },
      {
        id: 'media-2',
        type: 'story',
        before: 'Villagers had to walk 5 miles every day to fetch water from a contaminated river.',
        after: 'With the new well, clean water is now accessible within the village, drastically improving health and daily life.',
        description: 'A local resident shares their story.'
      }
    ]
  },
  { 
    id: 'proj-2', 
    name: 'JDT Islam Orphanage & School', 
    description: 'A leading institution for education and social welfare.', 
    goal: 75000, 
    raised: 60000,
    media: [
      {
        id: 'media-3',
        type: 'image',
        before: 'https://placehold.co/600x400.png',
        after: 'https://placehold.co/600x400.png',
        description: 'The old, dilapidated classroom vs. the newly constructed one.'
      }
    ]
  },
  { id: 'proj-3', name: 'kerala jama-ath council charitable trust', description: 'Promoting higher education and islamic studies.', goal: 100000, raised: 45000 },
  { id: 'proj-4', name: 'Markazu Ssaqafathi Ssunniyya', description: 'Cultural and educational center for the community.', goal: 25000, raised: 26500 },
  { id: 'proj-5', name: 'Samastha Vidyabhyasa Board', description: 'Educational board promoting moral and secular education.', goal: 200000, raised: 150000 },
];

export const payments: Payment[] = [
  { id: 'pay-1', donorName: 'Aisha Rahman', donorEmail: 'aisha.r@example.com', donorPhone: '9876543210', amount: 500, date: '2024-07-22', projectId: 'proj-1', projectName: 'Mukkam Muslim Orphanage', mode: 'Online', reason: 'Annual charity contribution.' },
  { id: 'pay-2', donorName: 'Biju Varghese', donorEmail: 'biju.v@example.com', donorPhone: '9876543211', amount: 250, date: '2024-07-21', projectId: 'proj-2', projectName: 'JDT Islam Orphanage & School', mode: 'Wallet', reason: 'General donation.' },
  { id: 'pay-3', donorName: 'Chandran Pillai', amount: 1000, date: '2024-07-20', projectId: 'proj-3', projectName: 'kerala jama-ath council charitable trust', mode: 'Manual', reason: 'In memory of my grandfather.' },
  { id: 'pay-4', donorName: 'Divya Menon', amount: 150, date: '2024-07-19', projectId: 'proj-4', projectName: 'Markazu Ssaqafathi Ssunniyya', mode: 'Online', reason: 'In support of animal welfare.' },
  { id: 'pay-5', donorName: 'Elias K. Joseph', amount: 750, date: '2024-07-18', projectId: 'proj-5', projectName: 'Samastha Vidyabhyasa Board', mode: 'Refund', reason: 'Refund requested as donation was intended for a different educational initiative.' },
  { id: 'pay-6', donorName: 'Fathima Basheer', amount: 300, date: '2024-07-17', projectId: 'proj-1', projectName: 'Mukkam Muslim Orphanage', mode: 'Wallet', reason: 'Contribution to clean water access.' },
  { id: 'pay-7', donorName: 'Gopalakrishnan Nair', amount: 50, date: '2024-07-16', projectId: 'proj-2', projectName: 'JDT Islam Orphanage & School', mode: 'Online', reason: 'Supporting education initiatives.' },
  { id: 'pay-8', donorName: 'Hafsa Ibrahim', amount: 2000, date: '2024-07-15', projectId: 'proj-3', projectName: 'kerala jama-ath council charitable trust', mode: 'Manual', reason: 'Donation towards healthcare services.' },
  { id: 'pay-9', donorName: 'Ravi Kumar', donorEmail: 'ravi.k@example.com', amount: 5000, date: todayString, projectId: 'proj-5', projectName: 'Samastha Vidyabhyasa Board', mode: 'Wallet', reason: 'For the children.' },
  { id: 'pay-10', donorName: 'Suresh Gopi', donorEmail: 'suresh.g@example.com', amount: 3000, date: todayString, projectId: 'proj-2', projectName: 'JDT Islam Orphanage & School', mode: 'Online', reason: 'Helping build schools.' },
  { id: 'pay-11', donorName: 'Arun Prasad', amount: 100, date: todayString, projectId: 'proj-4', projectName: 'Markazu Ssaqafathi Ssunniyya', mode: 'Manual', reason: 'For the care of shelter animals.' },
  { id: 'pay-12', donorName: 'Vinod Sharma', amount: 2500, date: todayString, projectId: 'proj-3', projectName: 'kerala jama-ath council charitable trust', mode: 'Online', reason: 'Matching employee donations.' },
  { id: 'pay-13', donorName: 'Sandeep Kumar', amount: 1, date: todayString, projectId: 'proj-1', projectName: 'Mukkam Muslim Orphanage', mode: 'Online', reason: 'Test 1' },
  { id: 'pay-14', donorName: 'Sandeep Kumar', amount: 1, date: todayString, projectId: 'proj-1', projectName: 'Mukkam Muslim Orphanage', mode: 'Online', reason: 'Test 2' },
  { id: 'pay-15', donorName: 'Sandeep Kumar', amount: 1, date: todayString, projectId: 'proj-1', projectName: 'Mukkam Muslim Orphanage', mode: 'Online', reason: 'Test 3' },
  { id: 'pay-16', donorName: 'Sandeep Kumar', amount: 500, date: todayString, projectId: 'proj-1', projectName: 'Mukkam Muslim Orphanage', mode: 'Refund', reason: 'Refunding large amount after tests.' },
];

export const debits: Debit[] = [
  { id: 'debit-1', projectId: 'proj-1', projectName: 'Mukkam Muslim Orphanage', date: '2024-07-20', amount: 5000, description: 'Purchase of water filters', reason: 'Replacement of old, expired filters.' },
  { id: 'debit-2', projectId: 'proj-2', projectName: 'JDT Islam Orphanage & School', date: '2024-07-18', amount: 12000, description: 'Printing and distributing textbooks', reason: 'New curriculum materials for the upcoming school year.' },
  { id: 'debit-3', projectId: 'proj-3', projectName: 'kerala jama-ath council charitable trust', date: '2024-07-15', amount: 25000, description: 'Medical supplies for mobile clinic', reason: 'Restocking essential medicines and equipment for Q3.' },
];

export const staff: Staff[] = [
  { id: 'staff-1', name: 'Admin User', email: 'admin@bairoohafoundation.com', role: 'Admin', avatar: 'https://placehold.co/100x100.png', permissions: { dashboard: true, projects: true, emergency: true, payments: true, donors: true, staff: true }, workingHours: { start: '09:00', end: '17:00' } },
  { id: 'staff-2', name: 'Priya Nair', email: 'priya.nair@bairoohafoundation.com', role: 'Staff', avatar: 'https://placehold.co/100x100.png', permissions: { dashboard: true, projects: true, emergency: true, payments: false, donors: false, staff: false }, workingHours: { start: '09:00', end: '17:00' } },
  { id: 'staff-3', name: 'Rajesh Kumar', email: 'rajesh.kumar@bairoohafoundation.com', role: 'Staff', avatar: 'https://placehold.co/100x100.png', permissions: { dashboard: true, projects: false, emergency: false, payments: true, donors: true, staff: false }, workingHours: { start: '10:00', end: '18:00' } },
  { id: 'staff-4', name: 'Anu Thomas', email: 'anu.thomas@bairoohafoundation.com', role: 'Staff', avatar: 'https://placehold.co/100x100.png', permissions: { dashboard: true, projects: true, emergency: true, payments: true, donors: false, staff: false }, workingHours: { start: '08:30', end: '16:30' } },
];

export const emergencyCampaigns: EmergencyCampaign[] = [];
