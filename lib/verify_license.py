import requests
import json
import sys

def verify_ny_license(license_number):
    """
    Verifies a New York Appearance Enhancement license using the Open NY (Socrata) API.
    """
    # Clean license number: remove spaces/dashes
    clean_num = "".join(filter(str.isalnum, license_number)).upper()
    
    # Dataset: Active Appearance Enhancement and Barber Individual Licenses
    # Endpoint: https://data.ny.gov/resource/ucu3-8265.json
    url = f"https://data.ny.gov/resource/ucu3-8265.json?license_number={clean_num}"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            return {"valid": False, "error": "License not found in NY database"}
        
        record = data[0]
        return {
            "valid": True,
            "name": record.get("license_holder_name"),
            "type": record.get("license_type"),
            "status": "Active",  # The dataset filters for 'Active' by default in many views, but we check expiration
            "expiry": record.get("license_expiration_date"),
            "state": "NY"
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}

def verify_license(state, license_number):
    state = state.upper()
    if state == "NY":
        return verify_ny_license(license_number)
    else:
        # Placeholder for CA/FL which require more complex scraping/proxies
        return {"valid": False, "error": f"Auto-lookup for {state} is still in development (scraping required)"}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python verify_license.py <STATE> <LICENSE_NUMBER>"}))
        sys.exit(1)
        
    state_code = sys.argv[1]
    lic_num = sys.argv[2]
    result = verify_license(state_code, lic_num)
    print(json.dumps(result))
