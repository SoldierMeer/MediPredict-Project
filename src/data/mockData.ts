// export interface Medication {
//   id: string;
//   name: string;
//   dosage: string;
//   quantity: string;
//   time: string;
//   isTaken: boolean;
//   category: string;
//   frequency: string;
//   selectedDays?: string[]; // ✅ New: Stores days like ["Mon", "Wed"]
//   status: string;
//   isArchived: boolean;
//   snoozeUntil: string | null; // e.g., "10:50 AM"
//   snoozeCount: number; // 0-3
// }

// export interface HistoryLog {
//   id: string;
//   medicationId: string;
//   medicationName: string;
//   dosage: string;
//   scheduledTime: string;
//   takenTime: string | null;
//   status: 'taken' | 'late' | 'missed';
//   date: string;
// }

// /**
//  * MASTER_MEDICATIONS is now the single source of truth for the entire app.
//  * Using one list prevents UI misalignment between different screens.
//  */
// export const MASTER_MEDICATIONS: Medication[] = [
//   {
//     id: '1',
//     name: 'Panadol',
//     dosage: '500mg',
//     quantity: '1 Pill', // ✅ Added
//     time: '10:47 AM',
//     category: 'Analgesic',
//     isTaken: false,
//     frequency: 'As needed',
//     status: 'routine',
//     isArchived: false,
//     snoozeUntil: null,
//     snoozeCount: 0
//   },
//   {
//     id: '2',
//     name: 'Amoxicillin',
//     dosage: '250mg',
//     quantity: '1 Capsule', // ✅ Added
//     time: '02:30 PM',
//     category: 'Antibiotic',
//     isTaken: false,
//     frequency: 'Three times daily',
//     status: 'active',
//     isArchived: false,
//     snoozeUntil: null,
//     snoozeCount: 0
//   },
//   {
//     id: '3',
//     name: 'Lisinopril',
//     dosage: '10mg',
//     quantity: '1 Pill', // ✅ Added
//     time: '11:15 AM',
//     category: 'Heart',
//     isTaken: false,
//     frequency: 'Daily',
//     status: 'active',
//     isArchived: false,
//     snoozeUntil: null,
//     snoozeCount: 0
//   },
//   {
//     id: '4',
//     name: 'Metformin',
//     dosage: '500mg',
//     quantity: '1 Pill', // ✅ Added
//     time: '01:30 PM',
//     category: 'Diabetes',
//     isTaken: false,
//     frequency: 'Daily',
//     status: 'upcoming',
//     isArchived: false,
//     snoozeUntil: null,
//     snoozeCount: 0
//   },
//   {
//     id: '5',
//     name: 'Atorvastatin',
//     dosage: '20mg',
//     quantity: '1 Pill', // ✅ Added
//     time: '09:00 PM',
//     category: 'Cholesterol',
//     isTaken: false,
//     frequency: 'Nightly',
//     status: 'missed',
//     isArchived: false,
//     snoozeUntil: null,
//     snoozeCount: 0
//   },
//   {
//     id: '6',
//     name: 'Multivitamin',
//     dosage: 'Daily Vit',
//     quantity: '1 Capsule', // ✅ Added
//     time: '10:48 AM',
//     category: 'Supplement',
//     isTaken: false,
//     frequency: 'Daily',
//     status: 'routine',
//     isArchived: false,
//     snoozeUntil: null,
//     snoozeCount: 0
//   },
//   {
//     id: '7',
//     name: 'Gaviscon',
//     dosage: '10ml',
//     quantity: '2 Spoons', // ✅ Added "Wildcard" for your spoon logic
//     time: '08:00 PM',
//     category: 'Antacid',
//     isTaken: false,
//     frequency: 'As needed',
//     status: 'routine',
//     isArchived: false,
//     snoozeUntil: null,
//     snoozeCount: 0
//   }
// ];

// export const MOCK_HISTORY: HistoryLog[] = [
//   {
//     id: 'h1',
//     medicationId: '3',
//     medicationName: 'Lisinopril 10mg',
//     dosage: '10mg',
//     scheduledTime: '08:00 AM',
//     takenTime: '08:00 AM',
//     status: 'taken',
//     date: '2026-05-01'
//   },
//   {
//     id: 'h2',
//     medicationId: '4',
//     medicationName: 'Metformin 500mg',
//     dosage: '500mg',
//     scheduledTime: '02:00 PM',
//     takenTime: '03:45 PM',
//     status: 'late',
//     date: '2026-04-30'
//   },
//   {
//     id: 'h3',
//     medicationId: '5',
//     medicationName: 'Atorvastatin 20mg',
//     dosage: '20mg',
//     scheduledTime: '09:00 PM',
//     takenTime: null,
//     status: 'missed',
//     date: '2026-04-29'
//   }
// ];

// export const MOCK_INSIGHTS = {
//   adherenceRate: 94,
//   onTimeRate: 98.2,
//   missedDoses: 1,
//   totalDoses: 28,
//   riskLevel: 'Low',
//   riskTrend: '+2% vs LW',
//   weeklyData: [
//     { day: 'Mon', rate: 85 },
//     { day: 'Tue', rate: 95 },
//     { day: 'Wed', rate: 100 },
//     { day: 'Thu', rate: 92 },
//     { day: 'Fri', rate: 94 },
//     { day: 'Sat', rate: 30 },
//     { day: 'Sun', rate: 30 }
//   ],
//   aiAdvisory: "Consistency is key! You've taken your Lisinopril within a 15-minute window for 5 days straight. Your cardiovascular risk score is improving."
// };