# Classified Ads Website - Product Requirements Document

## Original Problem Statement
Build a generic classified ads website with the following requirements:
- User registration and sign-in (JWT-based)
- Users can post ads (free or paid)
- Free ads: Limited features (max 5 pictures, displayed for 3 weeks)
- Paid ads: All features (15 free images, priority placement)
- Payment integration: Credit Card (Stripe) and PayPal
- Ad Categories: Jobs, Real Estate (Renting/Selling), Vehicles, Products, Services
- Location-based features with map integration (Portugal default)
- Multi-language support (Portuguese default, with English, German, French, Spanish, Polish)
- Currency: Euros (€)

## What's Been Implemented ✅

### Core Features
- [x] **JWT-based Authentication**: User registration and login
- [x] **Ad Management**: Create, view, update, delete ads
- [x] **Category System**: Dynamic categories and subcategories
- [x] **Stripe Payment Integration**: Premium ads and extra image costs
- [x] **Location Features**: Leaflet.js maps for posting and searching ads
- [x] **Image Upload**: Multiple file upload with previews and cost calculation
- [x] **Image Magnifier**: Hover-to-zoom on ad images with fullscreen lightbox (Added: Feb 2026)
- [x] **Multi-language Support (i18next)**: Full translations for 6 languages
  - Portuguese (default) ✅
  - English ✅
  - German ✅ (Updated: Feb 2026)
  - French ✅ (Updated: Feb 2026)
  - Spanish ✅ (Updated: Feb 2026)
  - Polish ✅ (Updated: Feb 2026)
- [x] **Currency**: Euro (€) across platform
- [x] **Success Dialogs**: Confirmation after ad creation/update
- [x] **Local Development Setup**: VSCode launch.json and LOCAL_DEVELOPMENT.md

### Technical Stack
- **Backend**: FastAPI, Pydantic, MongoDB (Motor), python-jose for JWT
- **Frontend**: React, React Router, Tailwind CSS, shadcn/ui, i18next, Leaflet.js
- **Database**: MongoDB with `2dsphere` index for geospatial queries
- **Payments**: Stripe API

## Pending Tasks

### P1 - High Priority
- [ ] **PayPal Integration**: Add PayPal as alternative payment method (originally requested)

### P2 - Medium Priority
- [ ] (None remaining)

### P3 - Future/Backlog
- [ ] **"Bump Ad" Feature**: Allow users to pay to push ad back to top of results
- [ ] **"Recently Viewed Ads"**: Track and display recently viewed ads

## Key Files
- `/app/backend/server.py`: All backend logic
- `/app/frontend/src/pages/PostAd.js`: Ad creation with payment
- `/app/frontend/src/pages/AdDetail.js`: Ad detail view with image magnifier
- `/app/frontend/src/pages/Browse.js`: Ad listing with filters
- `/app/frontend/src/components/ImageMagnifier.js`: Reusable image magnifier component
- `/app/frontend/src/i18n/config.js`: i18next configuration
- `/app/frontend/src/i18n/locales/*.json`: Translation files
- `/app/.vscode/launch.json`: VSCode debugging configuration
- `/app/LOCAL_DEVELOPMENT.md`: Local setup guide

## API Endpoints
- `POST /api/register`: Create user
- `POST /api/login`: Authenticate user
- `GET /api/categories`: Get categories/subcategories
- `POST /api/ads`: Create ad
- `PUT /api/ads/{ad_id}`: Update ad
- `GET /api/ads`: List ads with filters
- `GET /api/ads/{ad_id}`: Get single ad
- `DELETE /api/ads/{ad_id}`: Delete ad
- `GET /api/my-ads`: Get user's ads
- `POST /api/payment/create-session`: Stripe payment

## Database Schema
- **users**: `{_id, email, password_hash}`
- **ads**: `{_id, title, description, price, currency, category, subcategory, images, is_paid, expires_at, user_id, location, country, address}`

---
*Last updated: February 2026*
