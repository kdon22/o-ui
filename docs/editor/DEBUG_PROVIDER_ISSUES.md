# 🔧 **Debug Guide: Provider Issues**

## 🎯 **CURRENT STATUS**

### ✅ **WORKING**
- ✅ Completion provider triggers
- ✅ Monaco editor uses `language="business-rules"`
- ✅ Language registration successful
- ✅ Schema system integration works

### ❌ **ISSUES TO DEBUG**

#### **1. Type Detection Issue**
**Problem**: When typing on an `int`, shows ALL methods instead of just number methods
**Expected**: Should show only number-specific methods like `toFixed`, `toString`, etc.

#### **2. Hover Provider Not Working**  
**Problem**: Hover provider registered but not showing popups
**Expected**: Hover over method names should show rich documentation

#### **3. Variable Completion Missing**
**Problem**: When typing "air2" (without dot), it doesn't appear in completions
**Expected**: Should suggest "air2" as a variable name

---

## 🔍 **DEBUGGING STEPS**

### **Step 1: Check Console Logs**
Look for these specific debug messages:

```
🚨🚨🚨 [DirectSchemaMonaco] COMPLETION PROVIDER TRIGGERED! 🚨🚨🚨
🔍 [TypeDetection] Analyzing variable: air2
🔍 [TypeDetection] Detected NUMBER based on name pattern
🔍 [MethodFilter] Found X methods for type: number

🟡🟡🟡 [DirectSchemaMonaco] HOVER PROVIDER TRIGGERED! 🟡🟡🟡
✅ [HoverProvider] Found schema by method name: string-is-email
```

### **Step 2: Test Type Detection**
1. **Type**: `air2.` (note the dot)
2. **Expected Console**: 
   - Should detect `air2` as variable name
   - Should detect type as `number` (based on "2" in name)
   - Should filter to show only number methods
3. **Expected UI**: Only number methods like `toFixed()`, `toString()`

### **Step 3: Test Hover Provider**
1. **Type**: `air2.isEmail` 
2. **Hover over**: `isEmail`
3. **Expected Console**: Hover provider triggered messages
4. **Expected UI**: Rich documentation popup

### **Step 4: Test Variable Completion**
1. **Type**: `air` (without dot)
2. **Trigger**: Press `Ctrl+Space` or just continue typing
3. **Expected Console**: VARIABLE/HELPER COMPLETION MODE
4. **Expected UI**: Should suggest `air2` in completions

---

## 🛠️ **POTENTIAL FIXES**

### **Fix 1: Improve Type Detection**
The current type detection uses simple heuristics. May need to:
- Check actual variable assignments in the code
- Use more sophisticated pattern matching
- Handle edge cases better

### **Fix 2: Debug Hover Registration**
Possible issues:
- Monaco not recognizing the `business-rules` language for hover
- Hover provider registration timing issue
- Word detection not working properly

### **Fix 3: Enhance Variable Detection**
Current variable completion may need:
- Better regex for extracting variable names
- Include variables from current context
- Trigger on partial matches

---

## 🧪 **MANUAL TESTING SCRIPT**

### **Test 1: Type-Specific Completion**
```
# In the editor, type exactly this:
customerAge = 25
customerAge.

# Expected: Should see number methods only
# Console should show: "Detected NUMBER" and filtered methods
```

### **Test 2: Hover Documentation**
```
# Type this, then hover over "isEmail":
email.isEmail

# Expected: Hover popup with method documentation
# Console should show: "HOVER PROVIDER TRIGGERED" and "Found schema"
```

### **Test 3: Variable Suggestion**
```
# Type this and look for completions:
air

# Expected: Should suggest "air2" in completion list
# Console should show: "VARIABLE/HELPER COMPLETION MODE"
```

---

## ⚡ **QUICK DEBUG TEST**

**Copy/paste this into the editor and test:**

```
# Test variables with different types
customerAge = 25
customerName = "John Doe"  
bookingList = []

# Test completions:
customerAge.     # Should show: toFixed, toString, valueOf
customerName.    # Should show: toUpper, toLowerCase, isEmail
bookingList.     # Should show: length, push, filter

# Test hover:
# Hover over any method name above
```

---

## 🎯 **SUCCESS CRITERIA**

1. **✅ Type Detection**: `customerAge.` shows only number methods
2. **✅ Hover Works**: Hovering over `isEmail` shows documentation popup  
3. **✅ Variable Completion**: Typing `cust` suggests `customerAge` and `customerName`
4. **✅ Console Clean**: No errors, only debug messages

**If any of these fail, check the console logs and follow the debugging steps above.** 