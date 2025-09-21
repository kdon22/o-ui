# Python SDK Guide

The Python SDK provides **incredibly simple** prompt execution - just 4 lines of code to launch beautiful web forms from your Python scripts.

## 🎯 **The 4-Line Solution**

### Complete Working Example
```python
from prompt_renderer import prompt

response = prompt.display(
    prompts=["ads", "next"],
    rule_name="Booking Validation Rule")

print(response)
```

**That's literally it!** No complex setup, no debugging, no configuration. The system:
- ✅ Finds your rule automatically  
- ✅ Locates the specified prompts
- ✅ Opens the browser to a perfectly-sized form
- ✅ Returns the user's response data
- ✅ Handles all errors gracefully

## 📦 **Quick Setup**

The SDK is included in your project at `scripts/prompt_renderer.py`. Just import and use:

```python
# Single import - everything works
from prompt_renderer import prompt
```

## 🎨 **Perfect UI Automatically**

### Auto-Sized Forms
Your prompts automatically render with:
- **Perfect fit** - No wasted whitespace  
- **Consistent width** - Multiple prompts align beautifully
- **Mobile responsive** - Works on all devices
- **Professional styling** - Clean, modern appearance

### Single Prompt
```python
response = prompt.display(
    prompts="customer-details",
    rule_name="Insurance Quote"
)

# New response shape: list of entries (one per prompt)
values = response[0]["values"]  # {'fullName': 'Alice', ...}
```

### Multiple Prompts (Aligned Perfectly)
```python
response = prompt.display(
    prompts=["customer-info", "vehicle-details", "coverage-options"],
    rule_name="Auto Insurance"
)

# Access per-prompt values
values_by_prompt = {entry["prompt"]: entry["values"] for entry in response}
# e.g., values_by_prompt['customer-info']['firstName']
```

## 📋 **Method Reference**

### `prompt.display(prompts, rule_name)`

**Parameters:**
- `prompts` (str | list): Single prompt name or list of prompt names
- `rule_name` (str): Name of the rule containing the prompts

**Returns:**
- `list[dict]`: One entry per prompt with stable `values` dict

**Example Response (multiple prompts):**
```python
[
    {
        "prompt": "customer-info",
        "executionId": "cmfok8fz...",
        "status": "COMPLETED",
        "values": {
            "customerName": "John Doe",
            "age": "35"
        },
        "fields": [
            {"id": "customerName", "label": "Customer Name", "type": "text"}
        ],
        "error": None
    },
    {
        "prompt": "vehicle-details",
        "executionId": "cmfok8fz...",
        "status": "COMPLETED",
        "values": {
            "vehicleType": "sedan"
        },
        "fields": [],
        "error": None
    }
]
```

## 🚨 **Error Handling (Bulletproof)**

The system handles all common errors automatically:

```python
try:
    response = prompt.display("my-form", "My Rule")
    values = response[0]["values"]
    print("Success:", values)
except Exception as e:
    print(f"Error: {e}")
    # All errors are clear and actionable
```

### Common Error Messages
- `"Rule 'RuleName' not found"` - Check your rule name spelling
- `"No prompts found for rule 'RuleName' with names: ['prompt1']"` - Check prompt names  
- `"Timeout waiting for response"` - User didn't complete form in 5 minutes

## 💡 **Best Practices**

### 1. Use Descriptive Names
```python
# ✅ Good - Clear and descriptive
response = prompt.display("customer-onboarding", "New Account Setup")

# ❌ Avoid - Generic names  
response = prompt.display("form1", "rule1")
```

### 2. Handle Response Data
```python
response = prompt.display("user-info", "Registration")
values = response[0]["values"]

# Access data safely with defaults
name = values.get('fullName', 'Unknown')
age = int(values.get('age', 0))
email = values.get('email', '')

if not email:
    print("Email is required!")
```

### 3. Sequential Workflows
```python
# Step 1: Basic info
basic_entries = prompt.display("basic-info", "User Setup")
basic = basic_entries[0]["values"]

# Step 2: Use previous data for next step
if basic.get('accountType') == 'premium':
    details_entries = prompt.display("premium-features", "Account Setup")
else:
    details_entries = prompt.display("standard-features", "Account Setup")

details = details_entries[0]["values"]

# Combine results
final_data = {**basic, **details}
```

## 🔧 **Advanced Configuration** 

### Environment Variables (Optional)
```bash
# Only needed for custom deployments
export API_URL="https://your-domain.com/api"
export APP_URL="https://your-domain.com" 
export SHOULD_OPEN_BROWSER="true"  # Set to "false" for headless
```

### Custom Instance (Rarely Needed)
```python
from prompt_renderer import PromptRenderer

# For different environments
custom_prompt = PromptRenderer("https://staging.myapp.com")
response = custom_prompt.display("my-form", "My Rule")
```

## 🔄 **Real-World Examples**

### Insurance Quote System
```python
from prompt_renderer import prompt

# Get customer details
response = prompt.display(
    prompts=["customer-info", "vehicle-details", "coverage-selection"],
    rule_name="Auto Insurance Quote"
)

values_by_prompt = {e["prompt"]: e["values"] for e in response}
customer_name = values_by_prompt["customer-info"].get('customerName')
vehicle_year = int(values_by_prompt["vehicle-details"].get('vehicleYear', 0))
coverage_level = values_by_prompt["coverage-selection"].get('coverageLevel')

print(f"Quote for {customer_name}: {coverage_level} coverage on {vehicle_year} vehicle")
```

### Multi-Step Workflow
```python
# Step 1: Initial assessment
assessment_entry = prompt.display("risk-assessment", "Insurance Processing")[0]
assessment = assessment_entry["values"]

# Step 2: Conditional follow-up
if assessment.get('riskLevel') == 'high':
    additional_entry = prompt.display("additional-details", "High Risk Review")[0]
    additional = additional_entry["values"]
    final_data = {**assessment, **additional}
else:
    final_data = assessment

# Process the complete data
process_application(final_data)
```

### Data Validation
```python
response = prompt.display("application-form", "Loan Processing")
values = response[0]["values"]

# Validate required fields
required_fields = ['applicantName', 'ssn', 'income', 'loanAmount']
missing = [field for field in required_fields if not values.get(field)]

if missing:
    print(f"Missing required fields: {', '.join(missing)}")
    exit(1)

# Convert data types  
income = float(values.get('income', 0))
loan_amount = float(values.get('loanAmount', 0))

# Business logic
debt_ratio = loan_amount / income
if debt_ratio > 0.4:
    print("Debt-to-income ratio too high")
else:
    print("Application approved for review")
```

## 🎉 **Why It's So Simple**

We fixed all the underlying complexity:
- ✅ **Field Name Issues** - API now uses correct `promptNames` field
- ✅ **Database Constraints** - Proper user ID handling for Python scripts
- ✅ **Auto-Sizing** - Forms fit content perfectly with no manual sizing
- ✅ **Consistent Layout** - Multiple prompts align beautifully
- ✅ **Error Handling** - Clear, actionable error messages
- ✅ **Performance** - Fast API responses and form rendering

---

**Next**: Check out [API Reference](./api-reference.md) for technical details or [Frontend Components](./frontend-components.md) for UI features. 