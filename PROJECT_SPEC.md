# HR Portal — Complete Project Specification

## Project Overview
A web-based HR Management Portal with two panels:
- **Admin Panel** (HR / Manager)
- **Employee Panel** (Staff)

---

## Two Login Panels

### Admin Can:
- View/manage all employees
- Approve/reject leaves
- Upload payslips, policies, SOPs
- Post announcements
- View performance, feedback, daily updates
- Access exit interview responses

### Employee Can:
- Check-in / Check-out
- Apply for leave
- View attendance & payslips
- Submit daily work update
- Read announcements & policies
- Fill feedback & exit interview forms

---

## Core Modules

### 1. Attendance — Check-in / Check-out
- Employee checks in/out via portal with live location detection (GPS)
- System records timestamp + location coordinates
- Late login = Half Day LOP (auto-calculated)
- Attendance calendar view per employee

### 2. Leave Management
- Each employee gets 1 Casual Leave
- All other leaves = LOP (Loss of Pay)
- Employee can apply for leave with reason
- Admin can approve / reject
- Leave balance & history visible to employee

### 3. Employee Profile & Performance
- Personal details, role, department
- Responsibilities listed per employee
- Remarks added by manager
- Performance Graph (monthly/quarterly)
- Feedback from manager to employee

### 4. Daily Work Update
- Employee submits end-of-day work report
- Admin can view all updates team-wise / date-wise

### 5. Payslips
- Admin uploads payslip → Employee can view & download
- Both admin and employee can maintain payslip records
- Monthly payslip archive

### 6. Employee Documents
- Upload & store employee documents (Aadhar, PAN, Offer Letter, etc.)
- Both admin & employee can upload/view
- Secure document management

### 7. Notice / Announcements
- Admin posts company-wide notices
- Visible on employee dashboard as a feed

### 8. Annual Calendar
- Company holidays, events marked on calendar
- Visible to all employees

### 9. Company Policies & SOP
- Upload and display Company Policy documents
- Upload Standard Operating Procedures (SOPs)
- Employees can read/download

### 10. Feedback Forms
- Employee Feedback Form — employees give feedback about workplace
- Admin views all submitted feedback

### 11. Exit Interview Form
- Triggered when employee is leaving
- Standard exit interview questions
- Submitted to admin/HR

---

## Missing / Must-Have Features

### 1. Authentication & Access Control
- Login / Logout for Admin & Employee
- Role-based access (Admin sees everything, Employee sees only their data)
- Password reset / forgot password

### 2. Employee Management (Admin Side)
- Add / Edit / Delete employees
- Assign Department & Role
- Employee ID generation
- Active / Resigned / Terminated status

### 3. Payroll / Salary Management
- Salary structure per employee (Basic, HRA, Allowances)
- LOP deduction auto-calculated from attendance
- Net salary calculation before generating payslip

### 4. Leave Balance Tracker
- Track how many leaves used / remaining
- Auto update when leave is approved
- Show LOP count for the month

### 5. Leave Approval Workflow
- Admin gets notification when leave is applied
- Admin can Approve / Reject with a reason
- Employee gets notified of decision

### 6. Attendance Reports
- Monthly attendance summary per employee
- Present / Absent / Half-day / LOP count
- Export as PDF or Excel

### 7. Notification System
- Notify employee when leave is approved/rejected
- Notify when payslip is uploaded
- Notify when new announcement is posted

### 8. Department / Team Management
- Create departments (HR, Dev, Sales etc.)
- Assign employees to departments
- Manager can view only their team

### 9. Offer Letter / Appointment Letter
- Generate and store offer letters
- Part of employee documents

### 10. Overtime Tracking
- If employee works beyond office hours, log it
- Can be used for compensation or records

---

## Complete Feature List

| # | Feature | Source |
|---|---------|--------|
| 1 | Check-in / Check-out + Live Location | Her |
| 2 | Leave Apply (1 CL, rest LOP) | Her |
| 3 | Late Login = Half Day LOP | Her |
| 4 | Responsibilities, Remarks, Performance, Feedback | Her |
| 5 | Exit Interview Form | Her |
| 6 | Feedback Form | Her |
| 7 | Employee Documents | Her |
| 8 | Payslips | Her |
| 9 | Company Policies & SOP | Her |
| 10 | Annual Calendar | Her |
| 11 | Notices / Announcements | Her |
| 12 | Daily Work Update | Her |
| 13 | Login / Authentication / Roles | Missing |
| 14 | Add / Manage Employees | Missing |
| 15 | Salary Structure + LOP Auto Deduction | Missing |
| 16 | Leave Balance Tracker | Missing |
| 17 | Leave Approval Workflow | Missing |
| 18 | Attendance Reports & Export | Missing |
| 19 | Notification System | Missing |
| 20 | Department / Team Management | Missing |
| 21 | Offer / Appointment Letter | Missing |
| 22 | Overtime Tracking | Missing |

---

## Bonus Features

| Feature | Description |
|---------|-------------|
| Birthday / Work Anniversary | Auto display on dashboard |
| HR Dashboard | Total headcount, present today, on leave, LOP count |
| Notifications | Alerts for approvals, announcements, payslips |
| Dark Mode | Modern UI toggle |
| Mobile Responsive | Works on phone too |
| Role-based Login | Admin vs Employee access control |

---

## Suggested Tech Stack

| Part | Technology |
|------|-----------|
| Frontend | HTML, CSS, JavaScript (or React) |
| Backend | Node.js / Python (Flask/Django) |
| Database | MySQL / MongoDB |
| Location | Browser Geolocation API |
| Auth | JWT / Session Login |
| File Storage | Local server / Firebase Storage |
