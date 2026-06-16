# Changelog

All notable changes to `events-app` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### In progress
- Export attendance to CSV
- Password reset flow for internal users
- Badge print improvements

---

## [1.0.0] — 2026-06-15

### Added
- Public registration portal (4-step flow)
- PDF badge auto-download on registration completion
- PIN-based internal access with 5 roles: Admin, Atendente, Pastor, GA Leader, Team Leader
- Payment tracking with family-level exemptions and deadline management
- Waitlist management
- Bulk registration mode
- Confirmation emails via Resend (sent to registrations inbox + participant)
- Thermal label badge printing (3"×2" landscape, B&W, BY48BT printer)
- CSV import module for members, churches, families, assistance groups, categories
- Supabase schema v2 (11 tables)
- Bilingual support — Portuguese (PT) primary, English (EN) available
- Vercel deployment with GitHub Actions integration
- MkDocs Material documentation site

### Database
- Initial schema with: `categories`, `functions`, `churches`, `families`, `assistance_groups`, `members`, `events`, `app_users`, `registrations`, `approvals`, `rosters`
- "Outra / Not Listed" and "Sem Igreja" church options included in seed data
- `church_custom` and `is_visitor` fields added to `members`

---

## How to add an entry

When you ship something, add it here under `[Unreleased]` first. On release, move it under the new version with the date.

Use these categories:
- **Added** — new features
- **Changed** — changes to existing features
- **Fixed** — bug fixes
- **Removed** — removed features
- **Security** — security patches
- **Database** — schema changes
