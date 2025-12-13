import requests
import sys
import json
from datetime import datetime

class AdsAPITester:
    def __init__(self, base_url="https://classifieds-hub-28.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return response.json() if response.content else {}
                except:
                    return {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return {}

    def test_categories(self):
        """Test categories endpoint"""
        response = self.run_test("Get Categories", "GET", "categories", 200)
        if response:
            categories = response
            expected_categories = ["jobs", "real_estate_renting", "real_estate_selling", "vehicles", "sales_of_products", "services"]
            found_categories = [cat['id'] for cat in categories]
            
            if all(cat in found_categories for cat in expected_categories):
                self.log_test("Categories Content Validation", True)
            else:
                self.log_test("Categories Content Validation", False, f"Missing categories: {set(expected_categories) - set(found_categories)}")
        
        return response

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        response = self.run_test("User Registration", "POST", "auth/register", 200, test_user)
        
        if response and 'session_token' in response:
            self.session_token = response['session_token']
            self.user_data = response
            self.log_test("Registration Session Token", True)
        else:
            self.log_test("Registration Session Token", False, "No session token in response")
        
        return response

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.user_data:
            self.log_test("Login Test", False, "No user data from registration")
            return {}
        
        login_data = {
            "email": self.user_data['email'],
            "password": "TestPass123!"
        }
        
        response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        
        if response and 'session_token' in response:
            self.session_token = response['session_token']
            self.log_test("Login Session Token", True)
        else:
            self.log_test("Login Session Token", False, "No session token in response")
        
        return response

    def test_auth_me(self):
        """Test get current user"""
        if not self.session_token:
            self.log_test("Get Current User", False, "No session token available")
            return {}
        
        response = self.run_test("Get Current User", "GET", "auth/me", 200)
        return response

    def test_create_free_ad(self):
        """Test creating a free ad"""
        if not self.session_token:
            self.log_test("Create Free Ad", False, "No session token available")
            return {}
        
        ad_data = {
            "title": "Test Free Ad - iPhone 13",
            "description": "A great iPhone 13 in excellent condition. Barely used, comes with original box and charger.",
            "category": "sales_of_products",
            "price": 599.99,
            "images": [
                "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"
            ],
            "is_paid": False
        }
        
        response = self.run_test("Create Free Ad", "POST", "ads", 200, ad_data)
        return response

    def test_create_premium_ad(self):
        """Test creating a premium ad"""
        if not self.session_token:
            self.log_test("Create Premium Ad", False, "No session token available")
            return {}
        
        ad_data = {
            "title": "Test Premium Ad - Luxury Car",
            "description": "Premium luxury car with all features. Excellent condition, low mileage.",
            "category": "vehicles",
            "price": 45000.00,
            "images": [
                "https://images.unsplash.com/photo-1600709928175-83626df9883d?w=400",
                "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400",
                "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400",
                "https://images.unsplash.com/photo-1563720223185-11003d516935?w=400",
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
                "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400"
            ],
            "is_paid": True
        }
        
        response = self.run_test("Create Premium Ad", "POST", "ads", 200, ad_data)
        return response

    def test_free_ad_image_limit(self):
        """Test free ad image limit enforcement"""
        if not self.session_token:
            self.log_test("Free Ad Image Limit", False, "No session token available")
            return {}
        
        # Try to create free ad with more than 5 images
        ad_data = {
            "title": "Test Free Ad - Too Many Images",
            "description": "Testing image limit for free ads",
            "category": "sales_of_products",
            "price": 100.00,
            "images": [f"https://images.unsplash.com/photo-{i}?w=400" for i in range(6)],  # 6 images
            "is_paid": False
        }
        
        # This should fail with 400 status
        response = self.run_test("Free Ad Image Limit Enforcement", "POST", "ads", 400, ad_data)
        return response

    def test_get_ads(self):
        """Test getting all ads"""
        response = self.run_test("Get All Ads", "GET", "ads", 200)
        return response

    def test_get_ads_with_filters(self):
        """Test getting ads with category filter"""
        response = self.run_test("Get Ads - Category Filter", "GET", "ads?category=vehicles", 200)
        
        # Test search filter
        search_response = self.run_test("Get Ads - Search Filter", "GET", "ads?search=iPhone", 200)
        
        return response

    def test_get_my_ads(self):
        """Test getting user's own ads"""
        if not self.session_token:
            self.log_test("Get My Ads", False, "No session token available")
            return {}
        
        response = self.run_test("Get My Ads", "GET", "my-ads", 200)
        return response

    def test_payment_session_creation(self):
        """Test creating payment session"""
        if not self.session_token:
            self.log_test("Create Payment Session", False, "No session token available")
            return {}
        
        payment_data = {
            "ad_id": "test_ad_123",
            "origin_url": self.base_url
        }
        
        response = self.run_test("Create Payment Session", "POST", "payment/create-session", 200, payment_data)
        
        if response and 'url' in response and 'session_id' in response:
            self.log_test("Payment Session Response", True)
        else:
            self.log_test("Payment Session Response", False, "Missing url or session_id in response")
        
        return response

    def test_logout(self):
        """Test user logout"""
        if not self.session_token:
            self.log_test("User Logout", False, "No session token available")
            return {}
        
        response = self.run_test("User Logout", "POST", "auth/logout", 200)
        
        if response:
            # Clear session token after logout
            self.session_token = None
            self.log_test("Logout Session Clear", True)
        
        return response

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting Ads Platform API Tests")
        print("=" * 50)
        
        # Test public endpoints
        self.test_categories()
        
        # Test authentication flow
        self.test_user_registration()
        self.test_user_login()
        self.test_auth_me()
        
        # Test ad operations
        free_ad = self.test_create_free_ad()
        premium_ad = self.test_create_premium_ad()
        self.test_free_ad_image_limit()
        
        # Test ad retrieval
        self.test_get_ads()
        self.test_get_ads_with_filters()
        self.test_get_my_ads()
        
        # Test payment
        self.test_payment_session_creation()
        
        # Test logout
        self.test_logout()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check details above.")
            return 1

def main():
    tester = AdsAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())