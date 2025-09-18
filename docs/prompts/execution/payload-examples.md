# Payload Examples

Real-world examples of API requests, responses, and data structures used in the Prompt Execution System.

## 🚀 **Execution Creation**

### Simple Single Prompt

**Request:**
```json
POST /api/prompt/execute

{
  "ruleName": "Customer Onboarding",
  "promptNames": "Basic Information",
  "sessionId": "onboarding-session-123"
}
```

**Response:**
```json
{
  "execution": {
    "id": "cm4x8y9z1000abc123def456",
    "status": "PENDING",
    "executionUrl": "https://myapp.com/prompt/execute/cm4x8y9z1000abc123def456",
    "expiresAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Multiple Prompts (Composite Form)

**Request:**
```json
POST /api/prompt/execute

{
  "ruleName": "Insurance Quote",
  "promptNames": [
    "Customer Details",
    "Vehicle Information", 
    "Coverage Preferences"
  ],
  "sessionId": "quote-session-456"
}
```

**Response:**
```json
{
  "execution": {
    "id": "cm4x8y9z1000xyz789ghi012",
    "status": "PENDING", 
    "executionUrl": "https://myapp.com/prompt/execute/cm4x8y9z1000xyz789ghi012",
    "expiresAt": "2024-01-15T11:00:00.000Z"
  }
}
```

## 📊 **Execution Status Responses**

### Pending Execution

```json
GET /api/prompt/executions/cm4x8y9z1000abc123def456

{
  "id": "cm4x8y9z1000abc123def456",
  "status": "PENDING",
  "inputData": {},
  "responseData": {},
  "executionUrl": "/prompt/execute/cm4x8y9z1000abc123def456",
  "startedAt": null,
  "completedAt": null,
  "expiresAt": "2024-01-15T11:00:00.000Z",
  "prompts": [
    {
      "id": "prompt-basic-info-123",
      "promptName": "Basic Information",
      "order": 1,
      "layout": {
        "items": [
          {
            "x": 50,
            "y": 50,
            "id": "comp_name",
            "type": "text-input",
            "config": {
              "componentId": "fullName",
              "label": "Full Name",
              "placeholder": "Enter your full name",
              "width": 300,
              "height": 40,
              "required": true,
              "textColor": "#374151"
            }
          },
          {
            "x": 50,
            "y": 120,
            "id": "comp_email", 
            "type": "text-input",
            "config": {
              "componentId": "emailAddress",
              "label": "Email Address",
              "placeholder": "you@example.com",
              "width": 300,
              "height": 40,
              "required": true
            }
          },
          {
            "x": 50,
            "y": 190,
            "id": "comp_age",
            "type": "text-input",
            "config": {
              "componentId": "age",
              "label": "Age",
              "placeholder": "25",
              "width": 100,
              "height": 40,
              "required": true
            }
          }
        ],
        "canvasWidth": 800,
        "canvasHeight": 400
      }
    }
  ]
}
```

### Completed Execution

```json
GET /api/prompt/executions/cm4x8y9z1000abc123def456

{
  "id": "cm4x8y9z1000abc123def456",
  "status": "COMPLETED",
  "inputData": {},
  "responseData": {
    "fullName": "Sarah Johnson",
    "emailAddress": "sarah.johnson@email.com",
    "age": "28"
  },
  "executionUrl": "/prompt/execute/cm4x8y9z1000abc123def456",
  "startedAt": "2024-01-15T10:30:00.000Z",
  "completedAt": "2024-01-15T10:32:15.000Z",
  "expiresAt": "2024-01-15T11:00:00.000Z",
  "prompts": [
    {
      "id": "prompt-basic-info-123",
      "promptName": "Basic Information",
      "order": 1,
      "layout": {
        "items": [
          // ... same layout as above
        ],
        "canvasWidth": 800,
        "canvasHeight": 400
      }
    }
  ]
}
```

## 📝 **Form Submission Payloads**

### Simple Form Data

**Request:**
```json
POST /api/prompt/executions/cm4x8y9z1000abc123def456

{
  "responseData": {
    "fullName": "Sarah Johnson",
    "emailAddress": "sarah.johnson@email.com", 
    "age": "28",
    "phoneNumber": "+1-555-0123"
  }
}
```

**Response:**
```json
{
  "id": "cm4x8y9z1000abc123def456",
  "status": "COMPLETED",
  "completedAt": "2024-01-15T10:32:15.000Z"
}
```

### Complex Form with All Field Types

**Request:**
```json
POST /api/prompt/executions/cm4x8y9z1000xyz789ghi012

{
  "responseData": {
    // Text inputs
    "customerName": "John Smith",
    "companyName": "Acme Corp",
    "emailAddress": "john.smith@acme.com",
    
    // Number inputs (stored as strings)
    "age": "42",
    "annualIncome": "95000",
    "yearsOfExperience": "15",
    
    // Checkboxes (boolean values)
    "hasDriversLicense": true,
    "agreeToTerms": true,
    "wantsNewsletter": false,
    "isPreviousCustomer": false,
    
    // Select dropdowns
    "state": "california",
    "vehicleType": "suv",
    "coverageLevel": "comprehensive",
    "paymentPlan": "annual",
    
    // Radio button groups
    "contactMethod": "email",
    "marketingSource": "google_ads",
    "riskTolerance": "moderate",
    
    // Text areas / longer text
    "additionalComments": "I'm looking for the best coverage for my family vehicle. We drive approximately 15,000 miles per year.",
    "specialRequests": "Please contact me before 5 PM on weekdays."
  }
}
```

**Response:**
```json
{
  "id": "cm4x8y9z1000xyz789ghi012",
  "status": "COMPLETED",
  "completedAt": "2024-01-15T10:45:30.000Z"
}
```

### Normalized Entries (SDK Response Example)

The Python SDK (and client helpers) normalize prompt results into an entries array (one per prompt) with `fields[]` and a flat `values{}` map. This is an example of the response you read in Python after completion, not the POST body.

```json
[
  {
      "prompt": "pr1",
      "executionId": "cmfpm75730001c59cmpssc5nw",
      "status": "COMPLETED",
      "submittedAt": "2025-09-18T16:18:18.539Z",
      "error": "None",
      "fields": [
        {
          "id": "comp_1758195855879_fzzk59vmm",
          "text": "Reason for decling hotel",
          "type": "label",
          "label": "Reason for decling hotel",
          "errors": [],
          "isRequired": false,
          "isAnswerable": false
        },
        {
          "id": "decline_text",
          "type": "text-input",
          "label": "Reason for Decline",
          "value": "lkdjdflasjkdk",
          "errors": [],
          "isAnswered": true,
          "isRequired": false
        },
        {
          "id": "no_car_select",
          "type": "select",
          "label": "Select Option",
          "value": "Busy",
          "errors": [],
          "options": [
            { "id": "Busy", "label": "I'm Busy" },
            { "id": "Ride", "label": "I have a ride" },
            { "id": "License", "label": "No License" }
          ],
          "isAnswered": true,
          "isRequired": false,
          "displayText": "I'm Busy"
        },
        {
          "id": "test_radio",
          "type": "radio",
          "label": "Radio Option",
          "value": "opt2",
          "errors": [],
          "options": [
            { "id": "opt1", "label": "test1" },
            { "id": "opt2", "label": "test2" },
            { "id": "opt3", "label": "test3" }
          ],
          "isAnswered": true,
          "isRequired": false,
          "displayText": "test2"
        },
        {
          "id": "later_check",
          "type": "checkbox",
          "label": "Checkbox",
          "value": true,
          "errors": [],
          "isAnswered": true,
          "isRequired": false
        },
        {
          "id": "comp_1758200559559_fisyl4834",
          "type": "divider",
          "label": "Divider",
          "errors": [],
          "isRequired": false,
          "isAnswerable": false
        },
        {
          "id": "comp_1758200720818_9mx8qey2x",
          "text": "why no car?",
          "type": "label",
          "label": "why no car?",
          "errors": [],
          "isRequired": false,
          "isAnswerable": false
        },
        {
          "id": "comp_1758200792318_voh6kpmls",
          "text": "Do they need one later?",
          "type": "label",
          "label": "Do they need one later?",
          "errors": [],
          "isRequired": false,
          "isAnswerable": false
        }
      ],
      "values": {
        "test_radio": "opt2",
        "later_check": true,
        "decline_text": "lkdjdflasjkdk",
        "no_car_select": "Busy"
      }
  }
]
```

## 🎨 **Layout Examples**

### Insurance Quote Form Layout

```json
{
  "items": [
    // Header Label
    {
      "x": 50,
      "y": 20,
      "id": "header_label",
      "type": "label",
      "config": {
        "componentId": "header_text",
        "label": "Auto Insurance Quote Request",
        "fontSize": 24,
        "textColor": "#1f2937",
        "fontWeight": "bold"
      }
    },
    
    // Customer Name Input
    {
      "x": 50,
      "y": 80,
      "id": "comp_customer_name",
      "type": "text-input",
      "config": {
        "componentId": "customerName",
        "label": "Full Name",
        "placeholder": "Enter your full name",
        "width": 300,
        "height": 40,
        "required": true,
        "borderColor": "#d1d5db",
        "backgroundColor": "#ffffff"
      }
    },
    
    // Age Input
    {
      "x": 370,
      "y": 80,
      "id": "comp_age",
      "type": "text-input", 
      "config": {
        "componentId": "age",
        "label": "Age",
        "placeholder": "25",
        "width": 80,
        "height": 40,
        "required": true
      }
    },
    
    // Vehicle Type Dropdown
    {
      "x": 50,
      "y": 160,
      "id": "comp_vehicle_type",
      "type": "select",
      "config": {
        "componentId": "vehicleType",
        "label": "Vehicle Type",
        "placeholder": "Select vehicle type",
        "width": 200,
        "height": 40,
        "required": true,
        "options": [
          {
            "label": "Sedan",
            "value": "sedan",
            "isDefault": false
          },
          {
            "label": "SUV",
            "value": "suv", 
            "isDefault": true
          },
          {
            "label": "Truck",
            "value": "truck",
            "isDefault": false
          },
          {
            "label": "Coupe",
            "value": "coupe",
            "isDefault": false
          }
        ]
      }
    },
    
    // Has License Checkbox
    {
      "x": 270,
      "y": 165,
      "id": "comp_has_license",
      "type": "checkbox",
      "config": {
        "componentId": "hasLicense",
        "label": "Valid Driver's License",
        "checkboxSize": "md",
        "color": "#10b981"
      }
    },
    
    // Contact Method Radio Group
    {
      "x": 50,
      "y": 240,
      "id": "comp_contact_email",
      "type": "radio",
      "config": {
        "componentId": "contactMethod_email",
        "label": "Email",
        "color": "#3b82f6"
      }
    },
    {
      "x": 150,
      "y": 240,
      "id": "comp_contact_phone",
      "type": "radio",
      "config": {
        "componentId": "contactMethod_phone",
        "label": "Phone",
        "color": "#3b82f6"
      }
    },
    {
      "x": 250,
      "y": 240,
      "id": "comp_contact_mail",
      "type": "radio",
      "config": {
        "componentId": "contactMethod_mail",
        "label": "Mail",
        "color": "#3b82f6"
      }
    }
  ],
  "canvasWidth": 500,
  "canvasHeight": 320
}
```

### Expected Response Data

```json
{
  "customerName": "Michael Rodriguez",
  "age": "34",
  "vehicleType": "suv",
  "hasLicense": true,
  "contactMethod": "email"
}
```

## 🔄 **Multi-Prompt Example**

### Three-Step Insurance Application

**Execution Response with Multiple Prompts:**

```json
{
  "id": "cm4x8y9z1000multi789",
  "status": "COMPLETED",
  "responseData": {
    // From Prompt 1: Customer Details
    "customerName": "Lisa Chen",
    "dateOfBirth": "1985-03-15",
    "ssn": "***-**-1234",
    "emailAddress": "lisa.chen@example.com",
    "phoneNumber": "555-0199",
    
    // From Prompt 2: Vehicle Information
    "vehicleMake": "honda",
    "vehicleModel": "accord",
    "vehicleYear": "2020",
    "vin": "1HGCV1F30JA123456",
    "annualMileage": "12000",
    
    // From Prompt 3: Coverage Preferences
    "coverageType": "comprehensive",
    "deductible": "500",
    "liabilityLimit": "100000",
    "wantsRentalCar": true,
    "wantsRoadsideAssistance": true
  },
  "startedAt": "2024-01-15T14:00:00.000Z",
  "completedAt": "2024-01-15T14:08:45.000Z",
  "prompts": [
    {
      "id": "prompt-customer-details",
      "promptName": "Customer Details",
      "order": 1,
      "layout": {
        // Layout for customer information form
        "items": [...],
        "canvasWidth": 600,
        "canvasHeight": 400
      }
    },
    {
      "id": "prompt-vehicle-info",
      "promptName": "Vehicle Information", 
      "order": 2,
      "layout": {
        // Layout for vehicle details form
        "items": [...],
        "canvasWidth": 600,
        "canvasHeight": 350
      }
    },
    {
      "id": "prompt-coverage-prefs",
      "promptName": "Coverage Preferences",
      "order": 3,
      "layout": {
        // Layout for coverage options form
        "items": [...],
        "canvasWidth": 600,
        "canvasHeight": 450
      }
    }
  ]
}
```

## ❌ **Error Response Examples**

### Rule Not Found

**Request:**
```json
POST /api/prompt/execute

{
  "ruleName": "NonexistentRule",
  "promptNames": "Any Prompt"
}
```

**Response (404):**
```json
{
  "error": "Rule 'NonexistentRule' not found"
}
```

### Prompt Not Found

**Request:**
```json
POST /api/prompt/execute

{
  "ruleName": "Valid Rule",
  "promptNames": ["ValidPrompt", "InvalidPrompt"]
}
```

**Response (404):**
```json
{
  "error": "No prompts found for rule 'Valid Rule' with names: ['InvalidPrompt']"
}
```

### Execution Expired

**Request:**
```json
POST /api/prompt/executions/expired-execution-id

{
  "responseData": {
    "field": "value"
  }
}
```

**Response (410):**
```json
{
  "error": "Execution has expired"
}
```

### Already Completed

**Request:**
```json
POST /api/prompt/executions/completed-execution-id

{
  "responseData": {
    "field": "new value"
  }
}
```

**Response (409):**
```json
{
  "error": "Execution already completed"
}
```

## 🐍 **Python Response Examples**

### Simple Python Usage

```python
from scripts import prompt

# Execute prompt
response = prompt.display("Customer Survey", "Feedback Form")

# New shape: list of entries; access values dict
values = response[0]["values"]
print("Customer Responses:")
for key, value in values.items():
    print(f"  {key}: {value}")

# Example output:
# Customer Responses:
#   customerName: Sarah Wilson
#   satisfaction: very_satisfied
#   wouldRecommend: true
#   comments: Great service, very helpful staff!
#   contactForFollowup: false
```

### Complex Business Logic Example

```python
from scripts import prompt
import json

def process_insurance_application():
    """Complete insurance application with multiple validation steps"""
    
    # Step 1: Get customer details
    customer_info = prompt.display("Customer Information", "Insurance Application")[0]["values"]
    
    print(f"Processing application for {customer_info['customerName']}")
    
    # Validate age requirement
    age = int(customer_info.get('age', 0))
    if age < 18:
        print("❌ Application rejected: Must be 18 or older")
        return None
    
    # Step 2: Get vehicle information
    vehicle_info = prompt.display("Vehicle Details", "Insurance Application")[0]["values"]
    
    # Step 3: Calculate risk and get coverage preferences
    risk_level = calculate_risk(customer_info, vehicle_info)
    
    if risk_level == 'high':
        coverage_info = prompt.display("High Risk Coverage", "Insurance Application")[0]["values"]
    else:
        coverage_info = prompt.display("Standard Coverage", "Insurance Application")[0]["values"]
    
    # Combine all data
    application_data = {
        'customer': customer_info,
        'vehicle': vehicle_info, 
        'coverage': coverage_info,
        'risk_assessment': risk_level,
        'timestamp': '2024-01-15T10:30:00Z'
    }
    
    # Generate quote
    quote = generate_quote(application_data)
    
    print(f"✅ Quote generated: ${quote['monthly_premium']}/month")
    print(f"   Coverage: {quote['coverage_type']}")
    print(f"   Deductible: ${quote['deductible']}")
    
    return application_data

def calculate_risk(customer, vehicle):
    """Simple risk calculation"""
    risk_factors = 0
    
    if int(customer.get('age', 30)) < 25:
        risk_factors += 1
    
    if vehicle.get('vehicleType') in ['sports_car', 'motorcycle']:
        risk_factors += 2
        
    if int(vehicle.get('vehicleYear', 2020)) < 2015:
        risk_factors += 1
    
    return 'high' if risk_factors >= 2 else 'standard'

def generate_quote(data):
    """Generate insurance quote based on application data"""
    base_premium = 150
    
    # Risk adjustments
    if data['risk_assessment'] == 'high':
        base_premium *= 1.5
    
    # Coverage adjustments  
    if data['coverage']['coverageType'] == 'comprehensive':
        base_premium *= 1.3
        
    return {
        'monthly_premium': round(base_premium, 2),
        'coverage_type': data['coverage']['coverageType'],
        'deductible': data['coverage']['deductible']
    }

# Run the application
if __name__ == "__main__":
    result = process_insurance_application()
    if result:
        print("\n📄 Application Summary:")
        print(json.dumps(result, indent=2))
```

---

**Next**: Learn about [Frontend Components](./frontend-components.md) or [Integration Guide](./integration-guide.md) 