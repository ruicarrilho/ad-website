# Local Development Setup Guide

## Prerequisites

- **Node.js**: v16 or higher
- **Python**: 3.9 or higher
- **MongoDB**: 4.4 or higher (running locally)
- **Yarn**: 1.22 or higher

## Project Structure

```
/app/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── tests/           # Test files
└── scripts/         # Utility scripts
```

## Backend Setup (FastAPI)

### 1. Navigate to backend directory
```bash
cd /app/backend
```

### 2. Create virtual environment (optional but recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

> **Note about `emergentintegrations`**: The `emergentintegrations` library is only available in the Emergent platform environment. For local development, the backend automatically falls back to using the standard `stripe` library. You can safely ignore any warnings about `emergentintegrations` not being found - Stripe payments will work using the standard library.

### 4. Configure environment variables
Edit `/app/backend/.env`:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="http://localhost:3000"
STRIPE_API_KEY=sk_test_your_stripe_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  # Optional for local testing
```

> **Getting Stripe Keys**: 
> - Get your test API key from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
> - For webhook testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks locally

### 5. Start MongoDB (if not running)
```bash
# On Linux/Mac
sudo systemctl start mongod

# On Mac with Homebrew
brew services start mongodb-community

# On Windows
net start MongoDB
```

### 6. Run backend server
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Backend will be available at: `http://localhost:8001`
API documentation: `http://localhost:8001/docs`

## Frontend Setup (React)

### 1. Navigate to frontend directory
```bash
cd /app/frontend
```

### 2. Install dependencies
```bash
yarn install
```

### 3. Configure environment variables
Edit `/app/frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 4. Start development server
```bash
yarn start
```

Frontend will be available at: `http://localhost:3000`

## Debugging

### React DevTools
1. Install React DevTools browser extension
2. Open browser developer tools
3. Navigate to "React" or "Components" tab

### Backend Debugging
1. Use FastAPI's interactive docs at `http://localhost:8001/docs`
2. Add breakpoints in your Python IDE (VSCode, PyCharm)
3. Use `print()` statements or `logging` module

### Frontend Debugging

#### Chrome DevTools
1. Open Chrome DevTools (F12)
2. Go to "Sources" tab
3. Find your files under `webpack://` → `src/`
4. Set breakpoints
5. Refresh page

#### VSCode Debugging
Install "Debugger for Chrome" extension and use the launch configuration provided below.

### Network Debugging
- Open DevTools → Network tab
- Filter by "Fetch/XHR" to see API calls
- Check request/response headers and payloads

## VS Code Launch Configuration

Create `.vscode/launch.json` in project root:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    },
    {
      "name": "Debug Backend",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "server:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8001"
      ],
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      }
    }
  ]
}
```

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 8001 (backend)
lsof -ti:8001 | xargs kill -9
```

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check MONGO_URL in backend/.env
- Verify port 27017 is accessible

### CORS Errors
- Ensure CORS_ORIGINS in backend/.env includes your frontend URL
- Check browser console for specific CORS errors

### Module Not Found
```bash
# Frontend
cd /app/frontend
yarn install

# Backend
cd /app/backend
pip install -r requirements.txt
```

## Hot Reload

- **Frontend**: Automatic via Create React App
- **Backend**: Automatic via `--reload` flag

Changes will be reflected immediately without restarting servers.

## Production Build

### Frontend
```bash
cd /app/frontend
yarn build
```

Output: `/app/frontend/build/`

### Backend
The backend runs the same in production, just without `--reload` flag:
```bash
uvicorn server:app --host 0.0.0.0 --port 8001
```

## Testing

### Run Frontend Tests
```bash
cd /app/frontend
yarn test
```

### Run Backend Tests
```bash
cd /app/backend
pytest
```

## Additional Tools

### MongoDB Compass
- GUI tool for MongoDB
- Download: https://www.mongodb.com/products/compass
- Connect to: `mongodb://localhost:27017`

### Postman
- API testing tool
- Import backend API endpoints from `http://localhost:8001/docs`

### React Developer Tools
- Chrome extension for React debugging
- Shows component tree, props, state

## Useful Commands

```bash
# Check all running processes
ps aux | grep -E "(uvicorn|react|mongo)"

# View backend logs
tail -f /var/log/supervisor/backend.err.log

# View frontend logs
tail -f /var/log/supervisor/frontend.err.log

# Restart services (in Docker/Kubernetes environment)
sudo supervisorctl restart backend frontend

# Clear React cache
cd /app/frontend
rm -rf node_modules/.cache
```

## Environment Differences

### Development (Local)
- Backend: `http://localhost:8001`
- Frontend: `http://localhost:3000`
- MongoDB: `mongodb://localhost:27017`

### Production (Kubernetes)
- Backend: Internal port 8001, external via ingress
- Frontend: Internal port 3000, external via ingress
- MongoDB: Same local instance
- URLs configured via environment variables

## Tips for Debugging

1. **Use console.log() liberally** in React components
2. **Use React DevTools** to inspect component state
3. **Check Network tab** for API call failures
4. **Use FastAPI docs** at `/docs` for API testing
5. **Enable source maps** (already enabled by default)
6. **Use browser breakpoints** in Sources tab
7. **Check backend terminal** for Python errors
8. **Monitor MongoDB** with Compass or CLI

## Getting Help

- Check browser console for frontend errors
- Check terminal output for backend errors
- Review MongoDB logs if database errors occur
- Use `/docs` endpoint for API reference
