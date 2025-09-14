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
```

### Multiple Prompts (Aligned Perfectly)
```python
response = prompt.display(
    prompts=["customer-info", "vehicle-details", "coverage-options"],
    rule_name="Auto Insurance"
)
```

## 📋 **Method Reference**

### `prompt.display(prompts, rule_name)`

**Parameters:**
- `prompts` (str | list): Single prompt name or list of prompt names
- `rule_name` (str): Name of the rule containing the prompts

**Returns:**
- `dict`: Combined response data from all prompts

**Example Response:**
```python
{
    "customerName": "John Doe",
    "age": "35",
    "hasLicense": True,
    "vehicleType": "sedan",
    "comments": "Looking for full coverage"
}
```

## 🚨 **Error Handling (Bulletproof)**

The system handles all common errors automatically:

```python
try:
    response = prompt.display("my-form", "My Rule")
    print("Success:", response)
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

# Access data safely with defaults
name = response.get('fullName', 'Unknown')
age = int(response.get('age', 0))
email = response.get('email', '')

if not email:
    print("Email is required!")
```

### 3. Sequential Workflows
```python
# Step 1: Basic info
basic = prompt.display("basic-info", "User Setup") 

# Step 2: Use previous data for next step
if basic.get('accountType') == 'premium':
    details = prompt.display("premium-features", "Account Setup")
else:
    details = prompt.display("standard-features", "Account Setup")

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

# Use the data
customer_name = response.get('customerName')
vehicle_year = int(response.get('vehicleYear', 0))
coverage_level = response.get('coverageLevel')

print(f"Quote for {customer_name}: {coverage_level} coverage on {vehicle_year} vehicle")
```

### Multi-Step Workflow
```python
# Step 1: Initial assessment
assessment = prompt.display("risk-assessment", "Insurance Processing")

# Step 2: Conditional follow-up
if assessment.get('riskLevel') == 'high':
    additional = prompt.display("additional-details", "High Risk Review")
    final_data = {**assessment, **additional}
else:
    final_data = assessment

# Process the complete data
process_application(final_data)
```

### Data Validation
```python
response = prompt.display("application-form", "Loan Processing")

# Validate required fields
required_fields = ['applicantName', 'ssn', 'income', 'loanAmount']
missing = [field for field in required_fields if not response.get(field)]

if missing:
    print(f"Missing required fields: {', '.join(missing)}")
    exit(1)

# Convert data types  
income = float(response.get('income', 0))
loan_amount = float(response.get('loanAmount', 0))

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