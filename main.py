import requests
import json
#"https://sums.gatech.edu/SUMS_React_Shift_Scheduler/rest/EGInfo/CurrentShift?EGKey=A8GNNU22YD5HXXGZJ2T8&EGId=8"
#"https://sums.gatech.edu/SUMS_React_Shift_Scheduler/rest/EGInfo/DailyToolUsages?EGKey=A8GNNU22YD5HXXGZJ2T8&EGId=8&StartDate=2025-01-01&EndDate=2025-01-31"
#https://sums.gatech.edu/SUMS_React_Shift_Scheduler/rest/EGInfo/IndividualToolUsages?EGKey=A8GNNU22YD5HXXGZJ2T8&EGId=8&StartDate=2025-01-01&EndDate=2025-01-31
#https://sums.gatech.edu/SUMS_React_Shift_Scheduler/rest/EGInfo/TemplateFromUsername?EGKey=A8GNNU22YD5HXXGZJ2T8&EGId=8&Username=adeen3"
#https://sums.gatech.edu/SUMS_React_Shift_Scheduler/rest/EGInfo/ToolStatus?EGKey=A8GNNU22YD5HXXGZJ2T8&EGId=8
# Define API URL and parameters
BASE_URL = "https://sums.gatech.edu/SUMS_React_Shift_Scheduler/rest/EGInfo/ToolStatus?EGKey=A8GNNU22YD5HXXGZJ2T8&EGId=8"
PARAMS = {
    "EGKey": "A8GNNU22YD5HXXGZJ2T8",
    "EGId": 8
}

# Make the API request
response = requests.get(BASE_URL, params=PARAMS)

# Check if request was successful
if response.status_code == 200:
    try:
        data = response.json()
        print("Data:",data)  # Pretty-print JSON response
    except json.JSONDecodeError:
        print("Failed to decode JSON response.")
else:
    print(f"Error: Received status code {response.status_code}")
