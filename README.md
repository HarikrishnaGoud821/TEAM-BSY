# Bsy Community Ledger Hub

MASTER DEVELOPMENT PROMPT — TEAM BSY

1. PROJECT IDENTITY

Build a complete, production-ready organization management and contribution application called:

TEAM BSY

Official organization branding:

BASWESHWARA YOUTH
DAMGANPUR

Use the uploaded TEAM BSY logo as the official application logo and branding asset.

The application must be:

 Clean

 Modern

 Attractive

 Professional

 Interactive

 Responsive

 Easy to use

 Accurate

 Secure

 Scalable

 Mobile-friendly

 Production-ready

The application must support:

Android

iOS / iPhone

Web application

Do not create three unrelated systems. All clients must use the same Spring Boot backend and same MySQL database.

2. TECHNOLOGY STACK

Mobile

Use:

 React Native

 Expo

 TypeScript

The mobile application must work on:

 Android

 iPhone/iOS

Use one shared React Native codebase.

Web

Use:

 React

 TypeScript

 Vite

 Modern CSS/UI system

The web application should primarily serve:

 ADMIN

 MENTOR

 TREASURER

 VOLUNTEER

It should also support appropriate member/viewer functionality where required.

Backend

Use:

 Java

 Spring Boot

 Spring Web

 Spring Data JPA

 Hibernate

 Spring Security

 JWT authentication

 Bean Validation

 Maven

Current development environment uses Java 17.

Database

Use:

 MySQL 8

Development:

localhost:3306
team_bsy_db

Production:

 Use a hosted/managed MySQL database.

 Never depend on MySQL running on the developer's laptop after deployment.

 Database credentials must be environment variables/secrets.

 Never commit production passwords to GitHub.

Payment

Use:

Razorpay

Support Razorpay Test Mode during development and Live Mode after deployment.

Never hard-code:

 Razorpay Key Secret

 Database password

 JWT secret

 Any other credentials

Use environment variables/secrets.

3. OFFICIAL TEAM BSY ARCHITECTURE

The system should follow:

                         TEAM BSY
                            │
             ┌──────────────┴──────────────┐
             │                             │
        ADMIN / MENTOR                   MEMBER
             │                             │
             ▼                             ▼
    COLLECT CONTRIBUTION              DIRECT PAY
             │                             │
       ┌─────┴─────┐                 ONLINE ONLY
       │           │                      │
       ▼           ▼                      ▼
      CASH       ONLINE                RAZORPAY
       │           │                      │
       │      ┌────┴────┐                  │
       │      │         │                  │
       │      ▼         ▼                  ▼
       │     QR      DIRECT PAYMENT     PAYMENT
       │      │         │                  │
       │      └────┬────┘                  │
       │           ▼                       │
       │       RAZORPAY                    │
       │           │                       │
       │        WEBHOOK                     │
       │           │                       │
       └───────────┼───────────────────────┘
                   ▼
             CONTRIBUTIONS
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    Dashboard    Reports    Receipts

This is the canonical contribution/payment architecture.

4. PAYMENT RULES

ADMIN

Admin can:

 Collect offline cash

 Collect online payments

 Create contribution records

 View contributions

 View payment history

 View receipts

 Generate receipts

 Download receipts

 Print receipts

 View reports

MENTOR

Mentor can:

 Collect offline cash

 Collect online contributions

 Record contribution details

 View permitted contribution records

 Generate/view receipts according to permissions

 Use organization money for approved organizational purposes

 Record complete expense/money-usage information

 Upload shop receipts/proof

MEMBER

Members can:

 Make DIRECT ONLINE PAYMENTS ONLY

 Use Razorpay

 Use QR payment

 Use Direct Payment

 View their payment history

 View/download their receipts

Members must NOT have an offline cash contribution option.

Do not display a Cash option to members.

5. ONLINE PAYMENT

Online payment must support:

Option 1 — QR

Member/Admin/Mentor
       ↓
QR
       ↓
Razorpay
       ↓
Payment
       ↓
Verification/Webhook
       ↓
Contribution
       ↓
Receipt

Option 2 — Direct Payment

Member/Admin/Mentor
       ↓
Direct Payment
       ↓
Razorpay Checkout
       ↓
Payment
       ↓
Verification/Webhook
       ↓
Contribution
       ↓
Receipt

Both QR and Direct Payment must ultimately use Razorpay.

6. CASH PAYMENT

Cash is different from online payment.

Only:

 ADMIN

 MENTOR

can record cash contributions.

Flow:

Physical Cash Received
        ↓
Admin/Mentor records details
        ↓
Contribution saved
        ↓
Receipt generated

Do not send cash payments through Razorpay.

7. CONTRIBUTIONS — SINGLE SOURCE OF TRUTH

The contributions table must remain the central source of truth for collected contributions.

All of these should read from contributions:

 Dashboard

 Reports

 Contribution history

 Payment history

 Receipts

 Collection statistics

 Financial contribution summaries

Do not create multiple competing contribution tables for the same payment.

8. CONTRIBUTION INFORMATION

Each contribution should support:

Payment

 Contribution ID

 Amount

 Currency

 Donation mode

 Payment method

 Payment provider

 Payment status

 Razorpay order ID

 Razorpay payment ID

 Transaction ID

 Receipt number

Donor

 Donor name

 Donor mobile

 User ID when applicable

Location

Do NOT use GPS.

Do NOT use MapTiler.

Do NOT collect latitude/longitude.

Use manual location information:

 Village

 Mandal

 District

 Pincode

Other

 Purpose

 Notes

 Donation date

 Entered by

 Created date

 Updated date

9. AUTOMATIC RECEIPT GENERATION

After every successful contribution, generate a receipt.

Online

The receipt must be generated only after:

Razorpay payment
       ↓
Signature/payment verification
       ↓
Payment SUCCESS
       ↓
Contribution saved/updated
       ↓
Receipt generated

Cash

Cash recorded
      ↓
Contribution saved
      ↓
Receipt generated

10. RECEIPT CONTENT

TEAM BSY receipts must be professional and attractive.

Receipt should contain:

 TEAM BSY

 BASWESHWARA YOUTH

 DAMGANPUR

 Official logo

 Receipt number

 Contribution ID

 Donor name

 Donor mobile

 Amount

 Amount in words

 Payment method

 Payment status

 Razorpay transaction/payment information where applicable

 Donation date

 Purpose

 Village

 Mandal

 District

 Pincode

 Received/entered by

 Generated date/time

 Official signature

 Official stamp

Provide:

 View Receipt

 Download PDF

 Print Receipt

 Share receipt where supported

The existing receipt generation system should be reused/extended rather than creating a duplicate receipt system.

11. MENTOR MONEY USAGE / EXPENSE MODULE

Mentors can use TEAM BSY organizational money for approved purposes.

Every usage of money must be recorded completely.

Create an:

Expense & Money Usage Management

module.

Expense information

Store:

 Expense ID

 Amount

 Expense date

 Category

 Purpose

 Description

 Notes

 Mentor ID

 Mentor name

 Mentor mobile

 Created date

 Updated date

Shop/vendor information

Store:

 Shop name

 Shop owner name if available

 Shop contact number if available

 Shop address

 Village

 Mandal

 District

 Pincode

Purchased items

Do not store only one generic description.

Allow multiple expense items.

Example:

Sri Lakshmi Decorations

Decoration cloth     ₹1,200
Flowers                ₹800
LED lights           ₹2,500
Other                  ₹500

Total                ₹5,000

Each item should ideally have:

 Item name

 Quantity

 Unit price

 Total price

Then automatically calculate:

Total = sum of all items

12. EXPENSE PAYMENT INFORMATION

Support:

 Cash

 UPI

 Bank transfer

 Other

Store:

 Payment method

 Transaction/reference number where applicable

13. SHOP RECEIPT IMAGE

Mentor must be able to:

 Take a photo of the shop receipt

 Upload receipt image

 Preview image

 Replace image if necessary

 View receipt later

Do not store large image binaries directly in MySQL if avoidable.

Use:

Object/File Storage
        ↓
actual receipt image

and MySQL stores:

 File URL

 File key/reference

 File name

 Uploaded date

 Content type

The same architecture should later support:

 Gallery photos

 Event photos

 Documents

 Other attachments

14. EXPENSE APPROVAL

Recommended workflow:

MENTOR
   ↓
Uses organization money
   ↓
Creates expense
   ↓
Uploads shop receipt
   ↓
PENDING
   ↓
ADMIN reviews
   ├── APPROVE
   └── REJECT + reason

Expense statuses:

PENDING
APPROVED
REJECTED

Admin must be able to see complete expense details and proof before approval.

15. EXPENSE VOUCHER / RECEIPT

For mentor expenses, provide a professional expense voucher/record.

It should contain:

 Expense ID

 Mentor

 Date

 Amount

 Shop

 Items

 Payment method

 Purpose

 Approval status

 Receipt image reference

 Admin approval information

The original shop receipt image must remain attached as proof.

16. FINANCE MODULE

Keep Contributions and Finance/Expenses logically separate.

Contributions

Money collected from:

 Members

 Donors

 Other contributors

Finance

Tracks:

 Income

 Expenses

 Money usage

 Categories

 Financial summaries

Finance should provide:

 Total income

 Total expenses

 Balance

 Expense breakdown

 Mentor-wise expenses

 Date-wise expenses

 Category-wise expenses

 Contribution summaries

Existing working Finance functionality must not be broken.

17. ROLES

Use these roles:

ADMIN
MENTOR
TREASURER
VOLUNTEER
MEMBER
VIEWER

18. ROLE PERMISSIONS

ADMIN

Full access:

 Users

 Mentors

 Members

 Contributions

 Payments

 Receipts

 Expenses

 Finance

 Events

 Gallery

 Volunteers

 Announcements

 Notifications

 Reports

 Complaints

 Feedback

 Documents

 Audit logs

 Settings

MENTOR

Depending on assigned permissions:

 Collect contributions

 Cash collection

 Online collection

 View permitted contributions

 Events

 Volunteers

 Announcements

 Money usage

 Expenses

 Upload shop receipts

 View own expense history

TREASURER

Primarily:

 Finance

 Contributions

 Expenses

 Financial reports

 Collection reports

 Expense reports

Do not give unnecessary administrative user-management permissions.

VOLUNTEER

 Assigned tasks

 Events

 Attendance

 Volunteer information

 Allowed announcements

MEMBER

 Direct online contribution

 Razorpay

 QR/direct payment

 Payment history

 Receipts

 Events

 Gallery

 Announcements

 Notifications

 Feedback

 Complaints

 Profile

No cash contribution option.

VIEWER

Read-only access to information permitted by the system.

19. USER MANAGEMENT

Admin should be able to:

 View users

 Search users

 Filter users

 Add users

 Edit users

 Activate/deactivate users

 Assign roles

 View profiles

 View activity

Do not allow unauthorized role changes.

20. AUTHENTICATION

Use:

 Login

 Registration where appropriate

 JWT

 Spring Security

 BCrypt password hashing

 Stateless authentication

 Role-based authorization

Never store plain-text passwords.

Use secure JWT configuration.

21. DASHBOARD

Create an attractive interactive dashboard.

Display:

 Total members

 Total mentors

 Total volunteers

 Total contributions

 Total collection

 Online collection

 Cash collection

 Pending payments

 Total expenses

 Pending expenses

 Upcoming events

 Recent contributions

 Recent expenses

 Recent complaints

 Recent activities

Use interactive charts.

Examples:

 Contribution trend

 Cash vs online

 Expense categories

 Monthly collection

 Monthly expenses

 Mentor-wise collection

 Mentor-wise expenses

22. EVENTS MODULE

Support:

 Create event

 Edit event

 Delete event

 Event name

 Date

 Time

 Venue

 Description

 Status

 Event image

 Participants

 Upcoming events

 Past events

Existing Events functionality must not be broken.

23. ANNOUNCEMENTS

Support:

 Create announcement

 Edit

 Delete

 Publish/unpublish

 Important notices

 Event announcements

 Target roles/groups

 Announcement history

24. GALLERY

Support:

 Photos

 Videos

 Albums

 Event-wise gallery

 Upload

 Delete

 Preview

 Moderation

Members can submit photos if allowed.

Admin/Mentor moderation should be supported.

25. VOLUNTEERS

Support:

 Volunteer registration

 Volunteer list

 Assign tasks

 Task status

 Event-wise volunteers

 Volunteer history

 Attendance

26. ATTENDANCE

Support:

 Event attendance

 Volunteer attendance

 Member attendance

 Date-wise records

 Event-wise records

27. NOTIFICATIONS

Support notifications for:

 Payment success

 Receipt generated

 Event reminders

 Announcements

 Volunteer task assignment

 Complaint updates

 Expense status where applicable

 Important alerts

Later integrate:

Firebase Cloud Messaging (FCM)

for Android/iOS push notifications.

28. FEEDBACK & COMPLAINTS

Users must be able to report feedback or complaints directly to Admin.

Workflow:

USER
 ↓
Feedback / Complaint
 ↓
ADMIN
 ↓
Review
 ↓
Investigate
 ↓
Reply
 ↓
Resolve
 ↓
USER SEES RESOLUTION

Complaint fields

Store:

 Complaint ID

 User ID

 User name

 Subject

 Category

 Description

 Attachment/image if applicable

 Created date

 Updated date

 Status

 Admin response

 Resolution

 Resolved by

 Resolved date

Status

OPEN
UNDER_REVIEW
IN_PROGRESS
RESOLVED
CLOSED

Optionally support:

REJECTED

with rejection reason.

Only authorized Admin users can solve/close complaints.

User view

User should see:

#CMP-0012
Payment Issue

Status: IN PROGRESS

Admin Response:
"We are checking the payment record."

After resolution:

#CMP-0012

Status: RESOLVED

Resolution:
"Your payment has been verified and the receipt
has been generated."

Resolved by: Admin
Resolved on: ...

29. DOCUMENTS

Support:

 Important documents

 Event documents

 Permission letters

 Reports

 Receipts

 Download/view

Use secure file storage.

30. EMERGENCY / IMPORTANT CONTACTS

Support:

 Emergency contacts

 Organizers

 Mentor contacts

 Volunteer contacts

 Important phone numbers

31. REPORTS

Create professional reports for:

Contributions

 Total contributions

 Cash

 Online

 Razorpay

 Date range

 Donor

 Mentor

 Purpose

Expenses

 Total expenses

 Category

 Mentor

 Shop

 Date

 Payment method

 Approval status

Finance

 Income

 Expenses

 Balance

Events

 Event information

 Participants

 Attendance

Volunteers

 Volunteer activity

 Tasks

 Attendance

Provide:

 Search

 Filters

 Date ranges

 Sorting

 Pagination

 PDF export where appropriate

 Excel/CSV export where appropriate

32. AUDIT LOG

Create an activity/audit log.

Examples:

Admin created event
Admin added cash contribution
Mentor recorded expense
Mentor uploaded shop receipt
Admin approved expense
Admin rejected complaint
Admin changed user role
Admin approved gallery image

Store:

 User

 Role

 Action

 Entity

 Entity ID

 Date/time

 Relevant information

This is important because multiple people can manage TEAM BSY.

33. MULTI-YEAR ARCHIVE

TEAM BSY should support multiple years.

Example:

TEAM BSY

2026
 ├── Contributions
 ├── Expenses
 ├── Events
 ├── Gallery
 └── Reports

2027
 ├── Contributions
 ├── Expenses
 ├── Events
 ├── Gallery
 └── Reports

Users should be able to view historical records according to their permissions.

Do not destroy previous-year information.

34. MOBILE APPLICATION

Build one React Native + Expo + TypeScript application for Android and iOS.

Member mobile navigation

Example:

Home
Payments
Events
Gallery
Announcements
Notifications
Feedback
Profile

Member Home

Show:

 Greeting

 TEAM BSY branding

 Quick Pay

 Recent payment

 Upcoming event

 Announcements

 Notifications

Direct Payment UI

Make it attractive:

Make Contribution

₹ 1,000

[ ₹100 ] [ ₹500 ] [ ₹1,000 ]

Name
Mobile
Purpose

[ PAY NOW ]

Razorpay

After success:

✓ Payment Successful

₹1,000

Contribution #BSY-000125

[ View Receipt ]
[ Download Receipt ]
[ Share Receipt ]

35. MOBILE MENTOR UI

Mentors need additional screens:

Mentor Dashboard
Contributions
Collect Cash
Collect Online
Expenses
Add Expense
Shop Receipt
Events
Volunteers
Announcements
Notifications
Profile

Mentor must be able to easily record expenses from a phone.

Camera/image upload must be easy.

36. ADMIN WEB APPLICATION

Build a professional web dashboard.

Sidebar:

Dashboard
Contributions
Payments
Receipts
Expenses
Finance
Users
Mentors
Members
Events
Gallery
Volunteers
Attendance
Announcements
Notifications
Feedback & Complaints
Reports
Documents
Audit Logs
Settings

Use role-based sidebar visibility.

Do not show Admin-only screens to unauthorized roles.

37. UI/UX REQUIREMENTS

The UI must NOT look like a basic student CRUD application.

It should look like a real production organization platform.

Use:

 Clean spacing

 Consistent typography

 Professional cards

 Good icons

 Clear buttons

 Good form design

 Responsive tables

 Mobile responsiveness

 Interactive charts

 Modal dialogs

 Toast notifications

 Skeleton loading

 Empty states

 Error states

 Success states

 Confirmation dialogs

 Image preview

 PDF preview

 Smooth transitions

 Accessible controls

 Proper validation

Avoid:

 Clutter

 Excessive colors

 Random styles

 Huge unnecessary components

 Broken layouts

 Fake statistics

 Hard-coded production data

 Unnecessary animations

The design must remain professional.

38. BRANDING

Use the provided official TEAM BSY logo.

Brand:

TEAM BSY
BASWESHWARA YOUTH
DAMGANPUR

The logo should be used appropriately in:

 Splash screen

 Login

 Mobile header

 Web sidebar/header

 Receipts

 PDF documents

 App icon where appropriate

Do not distort the logo.

39. FILE STORAGE

Do not store large images directly inside MySQL.

Use object/file storage for:

 Shop receipts

 Expense receipts

 Gallery photos

 Event images

 User profile images

 Documents

 Generated PDFs if needed

MySQL should store metadata and references/URLs.

40. DATABASE DESIGN

Use normalized relational tables.

Expected major tables/modules include:

users
contributions
events
announcements
gallery_items
volunteer_tasks
expenses
expense_items
finance
notifications
feedback
complaints
documents
attendance
audit_logs
mentor_notes

Use foreign keys where appropriate.

Use indexes for:

 User ID

 Contribution date

 Payment status

 Order ID

 Payment ID

 Expense date

 Mentor ID

 Complaint status

 Event date

Do not create unnecessary duplicate tables.

41. EXISTING DATABASE SAFETY

The current database contains existing TEAM BSY data.

Important:

Do not delete existing real contribution records.

There is also an existing backup table:

contributions_backup_20261003

Do not delete it.

Do not reset the database just to make the new code work.

Use migrations/ALTER statements carefully.

Preserve existing data.

42. CURRENT CONTRIBUTIONS TABLE

The existing contributions table contains fields including:

id
amount
created_at
payment_method
payment_status
transaction_id
user_id
currency
order_id
payment_id
payment_provider
receipt_number
updated_at
donation_date
donation_mode
donor_mobile
donor_name
entered_by
notes
purpose
donor_location
latitude
longitude
district
mandal
pincode
village

The new Java entity should not use GPS fields.

Do not unnecessarily drop legacy GPS columns from the database immediately.

New application logic must use:

 village

 mandal

 district

 pincode

and must not use:

 latitude

 longitude

 GPS

 MapTiler

43. EXISTING BACKEND

Existing backend path:

E:\TEAM BSY\backend

Package:

com.teambsy.backend

Current backend uses:

 Spring Boot 4.1.1

 Java 17

 Maven

 MySQL

 Spring Security

 JWT

 JPA

 Validation

 Lombok

Health endpoint:

GET /api/health

returns:

TEAM BSY Backend is running!

Do not break it.

44. EXISTING WORKING MODULES

These already work and must not be broken:

Authentication

Already working.

Finance

Already working.

Events

Already working.

Contribution/payment order creation

Razorpay order creation has already been successfully tested.

Do not rewrite working code unnecessarily.

When modifying the project, first understand the existing implementation and make targeted changes.

45. EXISTING CONTRIBUTION API

Current contribution endpoint:

POST /api/contributions

Expected information includes:

{
  "donationMode": "ONLINE",
  "amount": 100,
  "paymentMethod": "RAZORPAY",
  "donorName": "Example",
  "donorMobile": "9999999999",
  "village": "Damganpur",
  "mandal": "Maddur",
  "district": "Narayanpet",
  "pincode": "509..."
  "purpose": "Ganesh Chaturthi",
  "notes": "",
  "donationDate": "2026-10-03"
}

For offline:

donationMode = OFFLINE
paymentMethod = CASH

Do not allow members to create CASH contributions.

Backend must enforce permissions, not just hide buttons in the UI.

46. PAYMENT VERIFICATION API

Current verification endpoint:

POST /api/contributions/verify

Expected:

{
  "razorpayOrderId": "...",
  "razorpayPaymentId": "...",
  "razorpaySignature": "..."
}

Verification must be secure.

Never mark an online contribution as successful just because the frontend says payment succeeded.

Verify Razorpay payment/signature on the backend.

47. RAZORPAY SECURITY

Use environment variables:

RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET

Never:

 Hard-code secrets

 Print secrets in logs

 Commit secrets to GitHub

 Return secrets from APIs

 Include secrets in frontend code

The public Razorpay key may be exposed where required by Razorpay Checkout, but the secret must remain backend-only.

Remove temporary debug logs that print sensitive configuration information.

48. API SECURITY

Every protected API must enforce authorization.

Never rely only on frontend restrictions.

Examples:

/api/admin/**       → ADMIN
/api/contributions/admin/** → ADMIN
/api/finance/**     → ADMIN/TREASURER
/api/mentor/**      → ADMIN/MENTOR
/api/volunteer/**   → ADMIN/VOLUNTEER

Member-specific endpoints must ensure users can only access their own information unless explicitly authorized.

49. CORS

Configure CORS correctly for:

 Local web development

 Production web domain

 Mobile/API access where applicable

Do not use unrestricted production CORS such as * with credentials.

50. ERROR HANDLING

Create proper API error responses.

For example:

{
  "success": false,
  "message": "Payment verification failed"
}

Do not expose:

 Stack traces

 Database credentials

 Secrets

 Internal implementation details

to the frontend.

51. VALIDATION

Validate:

 Amount

 Mobile number

 Required names

 Dates

 Pincode

 Payment method

 Donation mode

 Expense amount

 Expense items

 Complaint fields

 File type

 File size

Show useful validation messages.

52. PAYMENT IDEMPOTENCY / DUPLICATES

Prevent duplicate contribution creation.

A payment must not create two contributions if:

 User double-clicks

 Network retries

 Razorpay webhook is delivered twice

 Verification request is repeated

Use appropriate unique constraints/reference checks.

53. RECEIPT NUMBER

Generate unique receipt numbers.

Example:

BSY-2026-000001
BSY-2026-000002

Receipt numbers must never duplicate.

54. WEBHOOK

Use Razorpay webhook support for reliable payment state updates.

Flow:

Razorpay
   ↓
Webhook
   ↓
Spring Boot
   ↓
Validate webhook
   ↓
Find contribution/order
   ↓
Update payment status
   ↓
Generate receipt when successful

Do not blindly trust webhook payloads without validation.

55. DEPLOYMENT

Development:

React Native / Expo
       ↓
Spring Boot localhost
       ↓
Local MySQL

Production:

Android App
       │
iOS App
       │
Web App
       │
       ▼
Spring Boot Cloud Server
       │
       ├── Production MySQL
       ├── Object Storage
       ├── Razorpay
       └── Firebase FCM

Production MySQL should be hosted using a suitable managed/cloud database.

Do not require the user's laptop to remain powered on.

56. DOMAIN / HTTPS

Production web/API should use HTTPS.

Do not use plain HTTP for production authentication/payment traffic.

57. DEVELOPMENT DATABASE VS PRODUCTION

Local:

team_bsy_db

is for development.

Production must use a separate production database.

Never connect production to a developer laptop database.

Before deployment:

 Create production database

 Apply schema

 Migrate required data

 Configure environment variables

 Test APIs

 Test payment

 Test receipts

 Test file storage

 Test authentication

58. ANDROID / IOS DEPLOYMENT

The mobile application must eventually be buildable for:

Android

 APK for testing

 AAB for Google Play

iOS

 iOS build

 App Store deployment

Use Expo/EAS where appropriate.

Do not assume iOS can be built/deployed exactly like Android.

59. TESTING

Test all important workflows.

Authentication

 Login

 Invalid password

 Invalid mobile

 Role authorization

Contributions

 Cash

 Online

 QR

 Direct payment

 Payment verification

 Duplicate prevention

 Receipt generation

Member

 Online-only payment

 Cannot create cash contribution

 View own history

 View receipts

Mentor

 Cash collection

 Online collection

 Expense creation

 Shop details

 Receipt upload

 Expense status

Admin

 Contributions

 Finance

 Expenses

 Users

 Events

 Complaints

 Reports

Complaints

 Create

 Admin review

 Reply

 Resolve

 Close

 User sees status

Files

 Upload

 Preview

 Download

 Invalid file

 Large file

60. IMPORTANT EXISTING PROJECT RULES

Do not:

 Rewrite working modules unnecessarily

 Delete existing data

 Delete existing contribution records

 Reintroduce GPS

 Reintroduce MapTiler

 Add unnecessary location APIs

 Create duplicate payment systems

 Create duplicate contribution tables

 Store payment secrets in frontend

 Store production passwords in Git

 Allow members to record cash

 Mark payments successful without backend verification

 Generate fake payment records

 Break existing Events

 Break existing Finance

 Break existing Authentication

61. UI PRINCIPLE

Every screen must answer:

What is the user trying to do?

The interface should make the next action obvious.

Use:

 Clear primary buttons

 Good hierarchy

 Consistent colors

 Consistent spacing

 Clear icons

 Good typography

 Responsive layouts

 Meaningful empty states

 Meaningful error messages

The final application must feel like a real organization management product, not a college CRUD demonstration.

62. FINAL PRODUCT STRUCTURE

The complete TEAM BSY system should contain:

TEAM BSY
│
├── Authentication
│
├── Dashboard
│
├── User Management
│
├── Contributions
│   ├── Cash
│   ├── Online
│   ├── QR
│   ├── Direct Payment
│   ├── Razorpay
│   └── Receipts
│
├── Expenses & Money Usage
│   ├── Mentor Expenses
│   ├── Shop Details
│   ├── Items
│   ├── Payment Details
│   ├── Shop Receipt Images
│   └── Approval
│
├── Finance
│
├── Events
│
├── Announcements
│
├── Gallery
│
├── Volunteers
│
├── Attendance
│
├── Notifications
│
├── Feedback & Complaints
│
├── Documents
│
├── Emergency Contacts
│
├── Reports
│
├── Audit Logs
│
└── Multi-Year Archive

63. CLIENTS

TEAM BSY
│
├── Mobile Application
│   ├── Android
│   └── iOS
│
└── Web Application

All clients:

        ↓
Spring Boot REST API
        ↓
Spring Security + JWT
        ↓
MySQL
        ↓
File/Object Storage

64. FINAL QUALITY REQUIREMENT

Before considering TEAM BSY complete, verify:

 Android works

 iOS works

 Web works

 Backend works

 MySQL works

 Authentication works

 Roles work

 Contributions work

 Cash works

 Razorpay works

 QR works

 Direct payment works

 Payment verification works

 Webhooks work

 Receipts generate automatically

 Receipts download/print correctly

 Mentor expenses work

 Shop details save correctly

 Shop receipt images upload correctly

 Admin approval works

 Finance works

 Events work

 Gallery works

 Volunteers work

 Notifications work

 Feedback works

 Complaints work

 Admin can resolve complaints

 Reports work

 Audit logs work

 Multi-year data works

 No GPS is used

 No MapTiler is used

 No secrets are exposed

 No existing contribution data is lost

 No existing working module is broken

 UI is responsive and attractive

 Error handling is professional

 Loading states are implemented

 Empty states are implemented

 Production configuration is separated from development configuration

65. MOST IMPORTANT IMPLEMENTATION RULE

Do not generate random or incomplete code.

Before changing a file:

 Inspect the existing project structure.

 Inspect the existing implementation.

 Understand the API/database relationship.

 Preserve working functionality.

 Make the smallest correct architectural change.

 Compile the backend.

 Test the API.

 Test the frontend.

 Fix errors before moving to the next module.

When providing code, provide complete, correct files when a file needs replacement, rather than fragments that leave the developer guessing where to put them.

Do not introduce unnecessary dependencies.

Do not invent APIs that do not exist.

Do not change existing working endpoints without a reason.

FINAL GOAL

Build TEAM BSY — BASWESHWARA YOUTH, DAMGANPUR as a complete, secure, attractive and interactive organization-management platform for Android, iOS and Web, with:

Spring Boot + MySQL + React Native/Expo + React Web + Razorpay + secure file storage + Firebase notifications, supporting contributions, online payments, cash collection, automatic receipts, mentor money usage, shop receipt proof, finance, events, gallery, volunteers, announcements, notifications, feedback, complaints, reports, audit logs and multi-year records.

The final result should be something that can realistically be used by the TEAM BSY organization, not merely a demonstration project.
use react

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bsy-community-ledger-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/75b0144e-7fc3-5914-9f6d-d02e27589df1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
