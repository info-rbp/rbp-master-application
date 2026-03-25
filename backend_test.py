#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class RBPBackendTester:
    def __init__(self, base_url="https://ea6ac5b2-f4fe-4e50-a5b7-6fe470d615eb.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_time": response.elapsed.total_seconds(),
                "timestamp": datetime.now().isoformat()
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    result["response_data"] = response_data
                except:
                    print(f"   Response: {response.text[:200]}...")
                    result["response_text"] = response.text[:200]
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                result["error_response"] = response.text[:200]

            self.test_results.append(result)
            return success, response

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            self.test_results.append(result)
            return False, None

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_cors_headers(self):
        """Test CORS headers are present"""
        success, response = self.run_test(
            "CORS Headers Check",
            "GET",
            "api/health",
            200
        )
        
        if success and response:
            cors_headers = [
                'access-control-allow-origin',
                'access-control-allow-methods',
                'access-control-allow-headers'
            ]
            
            missing_headers = []
            for header in cors_headers:
                if header not in [h.lower() for h in response.headers.keys()]:
                    missing_headers.append(header)
            
            if missing_headers:
                print(f"⚠️  Missing CORS headers: {missing_headers}")
                return False
            else:
                print("✅ All CORS headers present")
                return True
        
        return False

    def generate_report(self):
        """Generate a test report"""
        report = {
            "test_summary": {
                "total_tests": self.tests_run,
                "passed_tests": self.tests_passed,
                "failed_tests": self.tests_run - self.tests_passed,
                "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
                "timestamp": datetime.now().isoformat()
            },
            "test_results": self.test_results
        }
        
        return report

def main():
    print("🚀 Starting RBP Backend API Tests...")
    print("=" * 50)
    
    # Initialize tester
    tester = RBPBackendTester()
    
    # Run tests
    print("\n📋 Running Backend API Tests:")
    
    # Test 1: Health endpoint
    tester.test_health_endpoint()
    
    # Test 2: CORS headers
    tester.test_cors_headers()
    
    # Generate and save report
    report = tester.generate_report()
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {report['test_summary']['success_rate']:.1f}%")
    
    # Save report to file
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Test report saved to: /app/test_reports/backend_test_results.json")
    
    # Return exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())