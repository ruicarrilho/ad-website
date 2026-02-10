# AdsHub - Classified Ads Platform

## Original Problem Statement
Create a generic classified ads website for the Portuguese market with:
- User registration and authentication
- Ad posting with categories/subcategories
- Payment system (Stripe for credit cards, PayPal requested but not yet implemented)
- Location-based features using interactive maps
- Image uploads with flexible pricing (€1 per extra image)
- Multi-language support (Portuguese default, English, German, French, Spanish, Polish)

## Core Requirements
- **User Management:** Users can register and sign in (JWT-based auth + Google OAuth)
- **Ad Management:** Full CRUD operations for ads
- **Ad Tiers:**
  - Free Ads: 5 free images, 3-week duration
  - Paid Ads: €10, 15 free images, premium "Featured" status
- **Payment System:** Stripe integration for premium ads and extra images
- **Categories:** 6 main categories with subcategories
- **Location Features:** Map-based ad posting and location search
- **Localization:** Portuguese language default, Euro currency, Portugal location

## Technology Stack
- **Backend:** FastAPI, Python, MongoDB (motor async)
- **Frontend:** React, JavaScript, TailwindCSS, Shadcn/UI
- **Authentication:** JWT + Emergent Google OAuth
- **Payments:** Stripe Checkout
- **Maps:** Leaflet.js, OpenStreetMap
- **Internationalization:** i18next, react-i18next

## What's Been Implemented

### December 2025 - Initial Build & Core Features
- Full-stack application foundation (React + FastAPI + MongoDB)
- JWT-based user authentication with registration/login
- Emergent-managed Google OAuth integration
- Category/subcategory system with 6 main categories
- Location-based ad posting with Leaflet.js maps
- Location search with configurable radius
- Stripe payment integration for premium ads
- Image upload system with base64 encoding
- Flexible pricing: €1 per extra image beyond free limit
- Ad editing feature with full form support
- Default localization for Portugal (map location, EUR currency)
- Confirmation dialogs for ad posting and editing

### December 2025 - Multi-Language Support (Completed)
- Integrated i18next with react-i18next
- Language switcher component in navbar with flags
- Complete translations for 6 languages:
  - Portuguese (PT) - Default
  - English (EN)
  - German (DE)
  - French (FR)
  - Spanish (ES)
  - Polish (PL)
- All pages translated:
  - Landing/Homepage
  - Login
  - Register
  - Browse
  - Dashboard
  - Post Ad
  - Edit Ad
  - Ad Detail
  - Payment Success
- Translation files location: `/app/frontend/src/i18n/locales/`
- i18n configuration: `/app/frontend/src/i18n/config.js`

## Prioritized Backlog

### P1 - High Priority
1. **PayPal Integration** - User requested alongside Stripe but not yet implemented
2. **Translate Subcategories** - Subcategory names are hardcoded in English in backend

### P2 - Medium Priority
3. **Refactor Translation Helper** - Move `translateCategory` function to shared utility
4. **Comprehensive E2E Testing** - Full regression test of all features

### P3 - Low Priority / Future
5. **User profile management**
6. **Ad favoriting/bookmarks**
7. **Contact seller feature**
8. **Search filters (price range, date posted)**
9. **Pagination for ads**

## Key API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/categories` - Get all categories with subcategories
- `POST /api/ads` - Create new ad
- `GET /api/ads` - Get ads with filters (category, search, location)
- `GET /api/ads/{ad_id}` - Get single ad details
- `PUT /api/ads/{ad_id}` - Update ad
- `DELETE /api/ads/{ad_id}` - Delete ad
- `GET /api/my-ads` - Get current user's ads
- `POST /api/payment/create-session` - Create Stripe checkout session
- `GET /api/payment/status/{session_id}` - Check payment status

## Database Schema
- **users:** `{username, email, password_hash}`
- **ads:** `{title, description, price, currency, category, subcategory, images, user_id, is_paid, expires_at, location: { type: "Point", coordinates: [lng, lat] }, country, address}`

## File Structure
```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── server.py
│   └── tests/
└── frontend/
    ├── .env
    ├── package.json
    └── src/
        ├── components/
        │   ├── LanguageSwitcher.js
        │   ├── MapPicker.js
        │   ├── MapSearch.js
        │   ├── Navbar.js
        │   └── ui/
        ├── contexts/
        │   └── AuthContext.js
        ├── i18n/
        │   ├── config.js
        │   └── locales/
        │       ├── en.json
        │       ├── pt.json
        │       ├── de.json
        │       ├── fr.json
        │       ├── es.json
        │       └── pl.json
        ├── pages/
        │   ├── Landing.js
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Browse.js
        │   ├── Dashboard.js
        │   ├── PostAd.js
        │   ├── EditAd.js
        │   ├── AdDetail.js
        │   └── PaymentSuccess.js
        └── App.js
```

## Test Reports
- `/app/test_reports/iteration_1.json` - Initial testing
- `/app/test_reports/iteration_2.json` - i18n testing (100% pass rate)
