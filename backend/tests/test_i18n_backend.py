"""
Backend API tests for i18n multi-language classified ads platform
Tests: Auth, Categories, Ads CRUD operations
"""
import pytest
import requests
import os
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndCategories:
    """Test health and categories endpoints"""
    
    def test_categories_endpoint(self):
        """Test categories endpoint returns all categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 6  # 6 categories defined
        
        # Verify category structure
        category_ids = [cat['id'] for cat in data]
        assert 'jobs' in category_ids
        assert 'real_estate_renting' in category_ids
        assert 'real_estate_selling' in category_ids
        assert 'vehicles' in category_ids
        assert 'sales_of_products' in category_ids
        assert 'services' in category_ids
        
        # Verify each category has subcategories
        for cat in data:
            assert 'id' in cat
            assert 'name' in cat
            assert 'subcategories' in cat
            assert isinstance(cat['subcategories'], list)
            assert len(cat['subcategories']) > 0
        
        print(f"✅ Categories endpoint returns {len(data)} categories with subcategories")

    def test_ads_endpoint_public(self):
        """Test public ads endpoint"""
        response = requests.get(f"{BASE_URL}/api/ads?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Public ads endpoint returns {len(data)} ads")


class TestUserAuth:
    """Test user authentication endpoints"""
    
    @pytest.fixture
    def test_user_data(self):
        """Generate unique test user data"""
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return {
            "name": f"Test User {random_suffix}",
            "email": f"test_backend_{random_suffix}@example.com",
            "password": "TestPass123!"
        }
    
    def test_user_registration(self, test_user_data):
        """Test user registration"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'user_id' in data
        assert 'email' in data
        assert 'name' in data
        assert 'session_token' in data
        assert data['email'] == test_user_data['email']
        assert data['name'] == test_user_data['name']
        
        print(f"✅ User registration successful: {data['email']}")
        return data
    
    def test_user_login(self, test_user_data):
        """Test user login"""
        # First register the user
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user_data
        )
        assert register_response.status_code == 200
        
        # Then login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": test_user_data['email'],
                "password": test_user_data['password']
            }
        )
        assert login_response.status_code == 200
        
        data = login_response.json()
        assert 'user_id' in data
        assert 'session_token' in data
        assert data['email'] == test_user_data['email']
        
        print(f"✅ User login successful: {data['email']}")
        return data
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        print("✅ Invalid credentials correctly rejected")
    
    def test_duplicate_registration(self, test_user_data):
        """Test duplicate registration is rejected"""
        # First registration
        response1 = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user_data
        )
        assert response1.status_code == 200
        
        # Second registration with same email
        response2 = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user_data
        )
        assert response2.status_code == 400
        print("✅ Duplicate registration correctly rejected")


class TestAuthenticatedEndpoints:
    """Test authenticated endpoints"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Create authenticated session"""
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        user_data = {
            "name": f"Auth Test User {random_suffix}",
            "email": f"test_auth_{random_suffix}@example.com",
            "password": "TestPass123!"
        }
        
        # Register user
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data
        )
        assert response.status_code == 200
        
        data = response.json()
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {data['session_token']}",
            "Content-Type": "application/json"
        })
        
        return {
            "session": session,
            "user_data": data,
            "session_token": data['session_token']
        }
    
    def test_get_current_user(self, authenticated_session):
        """Test get current user endpoint"""
        session = authenticated_session['session']
        
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        
        data = response.json()
        assert 'user_id' in data
        assert 'email' in data
        assert data['email'] == authenticated_session['user_data']['email']
        
        print(f"✅ Get current user successful: {data['email']}")
    
    def test_get_my_ads_empty(self, authenticated_session):
        """Test get my ads endpoint (empty for new user)"""
        session = authenticated_session['session']
        
        response = session.get(f"{BASE_URL}/api/my-ads")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0  # New user has no ads
        
        print("✅ Get my ads returns empty list for new user")
    
    def test_unauthenticated_access_rejected(self):
        """Test unauthenticated access to protected endpoints"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        
        response = requests.get(f"{BASE_URL}/api/my-ads")
        assert response.status_code == 401
        
        print("✅ Unauthenticated access correctly rejected")


class TestAdsFiltering:
    """Test ads filtering and search"""
    
    def test_filter_by_category(self):
        """Test filtering ads by category"""
        response = requests.get(f"{BASE_URL}/api/ads?category=vehicles&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # All returned ads should be in vehicles category
        for ad in data:
            assert ad['category'] == 'vehicles'
        
        print(f"✅ Category filter works: {len(data)} vehicles ads")
    
    def test_filter_by_search(self):
        """Test search functionality"""
        response = requests.get(f"{BASE_URL}/api/ads?search=test&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✅ Search filter works: {len(data)} results for 'test'")
    
    def test_combined_filters(self):
        """Test combined category and search filters"""
        response = requests.get(f"{BASE_URL}/api/ads?category=services&search=test&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✅ Combined filters work: {len(data)} results")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
