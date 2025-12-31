#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class NurseVisitAPITester:
    def __init__(self, base_url="https://medrounds-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.token = None
        self.nurse_id = None
        self.patient_id = None
        self.visit_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make API request with proper headers"""
        url = f"{self.api_base}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

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
            return success, response.json() if response.content else {}, response.status_code

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0
        except json.JSONDecodeError:
            return False, {"error": "Invalid JSON response"}, response.status_code

    def test_health_check(self):
        """Test API health check"""
        success, response, status = self.make_request('GET', '')
        self.log_test("Health Check", success and response.get('status') == 'healthy', 
                     f"Status: {status}, Response: {response}")
        return success

    def test_register(self):
        """Test nurse registration"""
        test_email = f"test_nurse_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        register_data = {
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test Nurse RN",
            "license_number": "RN-123456"
        }
        
        success, response, status = self.make_request('POST', 'auth/register', register_data, 200)
        
        if success and 'token' in response:
            self.token = response['token']
            self.nurse_id = response['nurse']['id']
            self.log_test("Nurse Registration", True)
            return True
        else:
            self.log_test("Nurse Registration", False, f"Status: {status}, Response: {response}")
            return False

    def test_login(self):
        """Test nurse login with existing credentials"""
        # First register a user for login test
        test_email = f"login_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        register_data = {
            "email": test_email,
            "password": "LoginTest123!",
            "full_name": "Login Test Nurse",
            "license_number": "RN-LOGIN"
        }
        
        # Register first
        reg_success, reg_response, reg_status = self.make_request('POST', 'auth/register', register_data, 200)
        if not reg_success:
            self.log_test("Login Test (Registration)", False, f"Failed to create test user: {reg_response}")
            return False

        # Now test login
        login_data = {
            "email": test_email,
            "password": "LoginTest123!"
        }
        
        success, response, status = self.make_request('POST', 'auth/login', login_data, 200)
        
        if success and 'token' in response:
            # Use this token for subsequent tests if we don't have one
            if not self.token:
                self.token = response['token']
                self.nurse_id = response['nurse']['id']
            self.log_test("Nurse Login", True)
            return True
        else:
            self.log_test("Nurse Login", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_me(self):
        """Test get current nurse info"""
        if not self.token:
            self.log_test("Get Current Nurse", False, "No token available")
            return False
            
        success, response, status = self.make_request('GET', 'auth/me', expected_status=200)
        
        if success and 'id' in response:
            self.log_test("Get Current Nurse", True)
            return True
        else:
            self.log_test("Get Current Nurse", False, f"Status: {status}, Response: {response}")
            return False

    def test_create_patient(self):
        """Test patient creation"""
        if not self.token:
            self.log_test("Create Patient", False, "No token available")
            return False

        patient_data = {
            "full_name": "John Doe Test Patient",
            "permanent_info": {
                "race": "Caucasian",
                "gender": "Male",
                "height": "5ft 10in",
                "home_address": "123 Test St, Test City, TC 12345",
                "caregiver_name": "Jane Doe",
                "caregiver_phone": "(555) 123-4567",
                "date_of_birth": "1950-01-15",
                "medications": ["Lisinopril 10mg", "Metformin 500mg"],
                "allergies": ["Penicillin", "Shellfish"],
                "adult_day_program_name": "Sunrise Adult Day Care",
                "adult_day_program_address": "456 Care Ave, Test City, TC 12345",
                "medical_diagnoses": ["Hypertension", "Type 2 Diabetes"],
                "psychiatric_diagnoses": ["Mild Depression"],
                "visit_frequency": "Weekly"
            }
        }
        
        success, response, status = self.make_request('POST', 'patients', patient_data, 200)
        
        if success and 'id' in response:
            self.patient_id = response['id']
            self.log_test("Create Patient", True)
            return True
        else:
            self.log_test("Create Patient", False, f"Status: {status}, Response: {response}")
            return False

    def test_list_patients(self):
        """Test listing patients"""
        if not self.token:
            self.log_test("List Patients", False, "No token available")
            return False
            
        success, response, status = self.make_request('GET', 'patients', expected_status=200)
        
        if success and isinstance(response, list):
            self.log_test("List Patients", True)
            return True
        else:
            self.log_test("List Patients", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_patient(self):
        """Test getting specific patient"""
        if not self.token or not self.patient_id:
            self.log_test("Get Patient", False, "No token or patient ID available")
            return False
            
        success, response, status = self.make_request('GET', f'patients/{self.patient_id}', expected_status=200)
        
        if success and response.get('id') == self.patient_id:
            self.log_test("Get Patient", True)
            return True
        else:
            self.log_test("Get Patient", False, f"Status: {status}, Response: {response}")
            return False

    def test_update_patient(self):
        """Test updating patient information"""
        if not self.token or not self.patient_id:
            self.log_test("Update Patient", False, "No token or patient ID available")
            return False

        update_data = {
            "permanent_info": {
                "race": "African American",
                "gender": "Male",
                "height": "6ft 0in",
                "visit_frequency": "Bi-weekly"
            }
        }
        
        success, response, status = self.make_request('PUT', f'patients/{self.patient_id}', update_data, 200)
        
        if success and response.get('permanent_info', {}).get('race') == "African American":
            self.log_test("Update Patient", True)
            return True
        else:
            self.log_test("Update Patient", False, f"Status: {status}, Response: {response}")
            return False

    def test_create_visit(self):
        """Test creating a visit"""
        if not self.token or not self.patient_id:
            self.log_test("Create Visit", False, "No token or patient ID available")
            return False

        visit_data = {
            "visit_date": datetime.now().isoformat(),
            "vital_signs": {
                "weight": "180",
                "body_temperature": "98.6",
                "blood_pressure_systolic": "140",
                "blood_pressure_diastolic": "90",
                "pulse_oximeter": "98",
                "pulse": "72",
                "respirations": "16",
                "bp_abnormal": True,
                "repeat_blood_pressure_systolic": "135",
                "repeat_blood_pressure_diastolic": "85"
            },
            "physical_assessment": {
                "general_appearance": "Alert and oriented, well-groomed",
                "skin_assessment": "Intact, no wounds or lesions",
                "mobility_level": "Independent",
                "speech_level": "Clear & Coherent",
                "alert_oriented_level": "x4 - Person, Place, Time, Situation"
            },
            "head_to_toe": {
                "head_neck": "Normal range of motion, no swelling",
                "eyes_vision": "Pupils equal and reactive, wears glasses",
                "ears_hearing": "Hearing aid in place, responds appropriately",
                "nose_nasal_cavity": "Clear, no discharge",
                "mouth_teeth_oral_cavity": "Dentures in place, good oral hygiene"
            },
            "gastrointestinal": {
                "last_bowel_movement": (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'),
                "bowel_sounds": "Present - Normal",
                "nutritional_diet": "Diabetic Diet"
            },
            "genito_urinary": {
                "toileting_level": "Self-Toileting"
            },
            "respiratory": {
                "lung_sounds": "Clear",
                "oxygen_type": "Room Air"
            },
            "endocrine": {
                "is_diabetic": True,
                "diabetic_notes": "Blood sugar well controlled",
                "blood_sugar": "120"
            },
            "changes_since_last": {
                "medication_changes": "Started new blood pressure medication",
                "diagnosis_changes": "No new diagnoses",
                "er_urgent_care_visits": "None",
                "upcoming_appointments": "Cardiology follow-up next week"
            },
            "overall_health_status": "Stable",
            "nurse_notes": "Patient is doing well overall. Blood pressure slightly elevated but repeat reading was better. Continue current medications and monitor BP."
        }
        
        success, response, status = self.make_request('POST', f'patients/{self.patient_id}/visits', visit_data, 200)
        
        if success and 'id' in response:
            self.visit_id = response['id']
            self.log_test("Create Visit", True)
            return True
        else:
            self.log_test("Create Visit", False, f"Status: {status}, Response: {response}")
            return False

    def test_list_visits(self):
        """Test listing visits for a patient"""
        if not self.token or not self.patient_id:
            self.log_test("List Visits", False, "No token or patient ID available")
            return False
            
        success, response, status = self.make_request('GET', f'patients/{self.patient_id}/visits', expected_status=200)
        
        if success and isinstance(response, list):
            self.log_test("List Visits", True)
            return True
        else:
            self.log_test("List Visits", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_visit(self):
        """Test getting specific visit"""
        if not self.token or not self.visit_id:
            self.log_test("Get Visit", False, "No token or visit ID available")
            return False
            
        success, response, status = self.make_request('GET', f'visits/{self.visit_id}', expected_status=200)
        
        if success and response.get('id') == self.visit_id:
            self.log_test("Get Visit", True)
            return True
        else:
            self.log_test("Get Visit", False, f"Status: {status}, Response: {response}")
            return False

    def test_last_vitals_persistence(self):
        """Test that last vitals are saved to patient record"""
        if not self.token or not self.patient_id:
            self.log_test("Last Vitals Persistence", False, "No token or patient ID available")
            return False
            
        success, response, status = self.make_request('GET', f'patients/{self.patient_id}', expected_status=200)
        
        if success and response.get('last_vitals') and response['last_vitals'].get('blood_pressure_systolic'):
            self.log_test("Last Vitals Persistence", True)
            return True
        else:
            self.log_test("Last Vitals Persistence", False, f"Status: {status}, Last vitals: {response.get('last_vitals')}")
            return False

    def test_delete_visit(self):
        """Test deleting a visit"""
        if not self.token or not self.visit_id:
            self.log_test("Delete Visit", False, "No token or visit ID available")
            return False
            
        success, response, status = self.make_request('DELETE', f'visits/{self.visit_id}', expected_status=200)
        
        if success:
            self.log_test("Delete Visit", True)
            return True
        else:
            self.log_test("Delete Visit", False, f"Status: {status}, Response: {response}")
            return False

    def test_create_different_visit_types(self):
        """Test creating different types of visits (nurse_visit, vitals_only, daily_note)"""
        if not self.token or not self.patient_id:
            self.log_test("Create Different Visit Types", False, "No token or patient ID available")
            return False

        # Test nurse visit with organization
        nurse_visit_data = {
            "visit_type": "nurse_visit",
            "organization": "POSH-Able Living",
            "visit_date": datetime.now().isoformat(),
            "vital_signs": {
                "weight": "175",
                "body_temperature": "98.4",
                "blood_pressure_systolic": "125",
                "blood_pressure_diastolic": "82",
                "pulse": "68",
                "respirations": "14"
            },
            "overall_health_status": "Stable",
            "nurse_notes": "Comprehensive nursing assessment completed."
        }
        
        success1, response1, status1 = self.make_request('POST', f'patients/{self.patient_id}/visits', nurse_visit_data, 200)
        
        # Test vitals only visit
        vitals_visit_data = {
            "visit_type": "vitals_only",
            "visit_date": datetime.now().isoformat(),
            "vital_signs": {
                "weight": "176",
                "body_temperature": "98.2",
                "blood_pressure_systolic": "120",
                "blood_pressure_diastolic": "80",
                "pulse": "70"
            },
            "overall_health_status": "Stable"
        }
        
        success2, response2, status2 = self.make_request('POST', f'patients/{self.patient_id}/visits', vitals_visit_data, 200)

        # Test daily note visit
        daily_note_data = {
            "visit_type": "daily_note",
            "visit_date": datetime.now().isoformat(),
            "daily_note_content": "Patient had a good day. Participated in activities, ate well, and was in good spirits.",
            "vital_signs": {
                "weight": "175"
            }
        }
        
        success3, response3, status3 = self.make_request('POST', f'patients/{self.patient_id}/visits', daily_note_data, 200)

        all_success = success1 and success2 and success3
        if all_success:
            self.log_test("Create Different Visit Types", True)
        else:
            details = f"Nurse visit: {success1}, Vitals only: {success2}, Daily note: {success3}"
            self.log_test("Create Different Visit Types", False, details)
        
        return all_success

    def test_monthly_reports(self):
        """Test the new monthly reports endpoint"""
        if not self.token:
            self.log_test("Monthly Reports", False, "No token available")
            return False

        from datetime import date
        current_date = date.today()
        
        # Test basic monthly report
        report_data = {
            "year": current_date.year,
            "month": current_date.month
        }
        
        success1, response1, status1 = self.make_request('POST', 'reports/monthly', report_data, 200)
        
        # Test filtered report by patient
        if self.patient_id:
            filtered_report_data = {
                "year": current_date.year,
                "month": current_date.month,
                "patient_id": self.patient_id
            }
            success2, response2, status2 = self.make_request('POST', 'reports/monthly', filtered_report_data, 200)
        else:
            success2 = True  # Skip if no patient
        
        # Test filtered report by organization
        org_report_data = {
            "year": current_date.year,
            "month": current_date.month,
            "organization": "POSH-Able Living"
        }
        success3, response3, status3 = self.make_request('POST', 'reports/monthly', org_report_data, 200)

        all_success = success1 and success2 and success3
        if all_success:
            # Check response structure
            if 'summary' in response1 and 'visits' in response1:
                self.log_test("Monthly Reports", True)
                print(f"   Report contains {response1['summary'].get('total_visits', 0)} visits")
            else:
                self.log_test("Monthly Reports", False, "Invalid response structure")
                return False
        else:
            details = f"Basic: {success1}, Patient filter: {success2}, Org filter: {success3}"
            self.log_test("Monthly Reports", False, details)
        
        return all_success

    def test_delete_patient(self):
        """Test deleting a patient"""
        if not self.token or not self.patient_id:
            self.log_test("Delete Patient", False, "No token or patient ID available")
            return False
            
        success, response, status = self.make_request('DELETE', f'patients/{self.patient_id}', expected_status=200)
        
        if success:
            self.log_test("Delete Patient", True)
            return True
        else:
            self.log_test("Delete Patient", False, f"Status: {status}, Response: {response}")
            return False

    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }
        
        success, response, status = self.make_request('POST', 'auth/login', login_data, 401)
        
        if success:  # We expect 401, so success means we got the expected error
            self.log_test("Invalid Credentials Test", True)
            return True
        else:
            self.log_test("Invalid Credentials Test", False, f"Expected 401, got {status}")
            return False

    def test_unauthorized_access(self):
        """Test accessing protected endpoints without token"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success, response, status = self.make_request('GET', 'patients', expected_status=401)
        
        # Restore token
        self.token = original_token
        
        if success:  # We expect 401, so success means we got the expected error
            self.log_test("Unauthorized Access Test", True)
            return True
        else:
            self.log_test("Unauthorized Access Test", False, f"Expected 401, got {status}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🏥 Starting Home Nurse Visit API Tests")
        print("=" * 50)
        
        # Test sequence
        tests = [
            self.test_health_check,
            self.test_register,
            self.test_login,
            self.test_get_me,
            self.test_create_patient,
            self.test_list_patients,
            self.test_get_patient,
            self.test_update_patient,
            self.test_create_visit,
            self.test_list_visits,
            self.test_get_visit,
            self.test_last_vitals_persistence,
            self.test_delete_visit,
            self.test_delete_patient,
            self.test_invalid_credentials,
            self.test_unauthorized_access
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = NurseVisitAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())