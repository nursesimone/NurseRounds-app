# MedRounds - Home Nurse Visit Management System

## Original Problem Statement
Build an app that allows conducting home nurse visits with:
- Patient permanent info setup (Race, Gender, Height, Address, Caregiver, DOB, Medications, Allergies, Adult Day Program, Medical/Psychiatric Diagnoses, Visit Frequency)
- Per-visit questions: Vital Signs (with repeat BP if abnormal), Physical Assessment, Head-to-Toe Assessment, GI/GU/Respiratory/Endocrine Assessments, Changes Since Last Visit, Overall Health Status
- Data persistence for permanent info and last vitals

## User Personas
1. **Home Nurse** - Primary user conducting patient visits, documenting assessments, managing patient records
2. **Nurse Supervisor** - Reviews documentation, manages nurse assignments (future feature)

## Core Requirements (Static)
- [x] JWT email/password authentication
- [x] PDF export for visit reports
- [x] Multiple nurse support
- [x] Clean medical/clinical light theme
- [ ] No reminders needed

## Tech Stack
- Frontend: React with Tailwind CSS, Shadcn UI components
- Backend: FastAPI (Python)
- Database: MongoDB
- PDF Generation: jsPDF (client-side)

## What's Been Implemented - December 31, 2025

### Authentication
- [x] Nurse registration with email, password, full name, license number
- [x] Nurse login with JWT tokens (7-day expiry)
- [x] Protected routes requiring authentication
- [x] Logout functionality

### Visit Type Selection (NEW - Dec 31)
- [x] Post-login visit type selection screen
- [x] Three visit types: NURSE Visit, Vital Signs ONLY, Resident's Daily Note
- [x] Organization dropdown for Nurse Visit (POSH-Able Living, Ebenezer Private Home Care)
- [x] Visit type stored in session and passed to visit forms

### Monthly Reports (NEW - Dec 31)
- [x] Monthly reports page with filters (Year, Month, Patient, Organization)
- [x] Generate reports for any full calendar month
- [x] Current month-to-date reporting
- [x] Visit breakdown by type (Nurse Visits, Vitals Only, Daily Notes)
- [x] Organization-wise visit counts
- [x] PDF download with full report details
- [x] Tabbed view for filtering visits by type

### Patient Management
- [x] Create new patients
- [x] Edit patient permanent information
- [x] Delete patients (with cascade delete of visits)
- [x] Patient list with search functionality
- [x] Last vitals persistence per patient

### Patient Permanent Information Fields
- [x] Race
- [x] Gender
- [x] Height
- [x] Date of Birth
- [x] Home Address
- [x] Caregiver Name & Phone
- [x] Adult Day Program (Name & Address)
- [x] Medications (array)
- [x] Allergies (array)
- [x] Medical Diagnoses (array)
- [x] Psychiatric Diagnoses (array)
- [x] Visit Frequency

### Visit Documentation
- [x] Visit Type support: Nurse Visit, Vitals Only, Daily Note
- [x] Organization tracking per visit
- [x] Vital Signs (Weight, Temp, BP, SpO2, Pulse, Respirations)
- [x] Repeat BP fields when initial BP is abnormal
- [x] Physical Assessment (General Appearance, Skin, Mobility, Speech, Orientation)
- [x] Head-to-Toe Assessment (Head/Neck, Eyes, Ears, Nose, Mouth)
- [x] Gastrointestinal (Bowel Movement, Bowel Sounds, Diet Type)
- [x] Genito-Urinary (Toileting Level)
- [x] Respiratory (Lung Sounds, Oxygen Type)
- [x] Endocrine (Diabetic status, Blood Sugar)
- [x] Changes Since Last Visit (Meds, Diagnoses, ER Visits, Appointments)
- [x] Overall Health Status (Stable/Unstable/Deteriorating/Immediate Attention)
- [x] Nurse Notes
- [x] Daily Note content field (for Daily Note type)

### Reports
- [x] PDF download for individual visits
- [x] Visit history display per patient

### UI/UX
- [x] Clinical Zen theme (teal/white color scheme)
- [x] Responsive design
- [x] Manrope + Public Sans fonts
- [x] Toast notifications
- [x] Loading states
- [x] Empty states

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Visit editing capability (currently read-only after creation)
- [ ] Duplicate patient check (prevent same name duplicates)

### P1 - Important
- [ ] Patient photo upload
- [ ] Nurse profile editing
- [ ] Visit history export (all visits to PDF)
- [ ] Print-friendly visit view
- [ ] Patient sharing between nurses

### P2 - Nice to Have
- [ ] Dashboard charts/analytics
- [ ] Visit templates for quick entry
- [ ] Medication reminders integration
- [ ] Voice-to-text for notes
- [ ] Offline mode with sync
- [ ] HIPAA compliance audit logging

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new nurse
- `POST /api/auth/login` - Login nurse
- `GET /api/auth/me` - Get current nurse info

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/{id}` - Get patient detail
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient

### Visits
- `GET /api/patients/{id}/visits` - List visits for patient
- `POST /api/patients/{id}/visits` - Create visit (supports visit_type, organization)
- `GET /api/visits/{id}` - Get visit detail
- `DELETE /api/visits/{id}` - Delete visit

### Reports
- `POST /api/reports/monthly` - Generate monthly report with filters

## Test Credentials
- Email: demo@test.com
- Password: demo123
