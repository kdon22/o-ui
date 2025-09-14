# Complex Helper Metadata Example - Vendor Remarks

## What gets saved in source code:

```python
# HELPER_START:helper-1753044853124-6jiprnthh:add-vendor-remark
# {"selectedVendors":[{"vendor":"amadeus","remarkType":"Miscellaneous - RM<cat>/","category":"T","remark":"TEST","enabled":true},{"vendor":"galileo","remarkType":"General - NP<cat>","category":"T","remark":"TEST","enabled":true},{"vendor":"worldspan","remarkType":"General - 5","category":"","remark":"processPath","enabled":true}],"insertAsFirst":false,"condition":"exactMatch","isErrorRemark":false,"conditionText":"","schemaVersion":"1.0"}
add_vendor_remarks([
    {"gds": "amadeus", "type": "RM", "category": "T", "text": "TEST"},
    {"gds": "galileo", "type": "NP", "category": "T", "text": "TEST"}, 
    {"gds": "worldspan", "type": "5", "category": "", "text": "processPath"}
], insert_first=False, condition="exact_match")
# HELPER_END:helper-1753044853124-6jiprnthh:add-vendor-remark
```

## How it works:

### 1. **Complex Nested Data Structure**
```typescript
interface VendorRemarkMetadata {
  selectedVendors: Array<{
    vendor: 'amadeus' | 'galileo' | 'sabre' | 'worldspan' | 'apollo' | 'abacus'
    remarkType: string  // "Miscellaneous - RM<cat>/", "General - NP<cat>", etc.
    category: string    // "T", "5", etc.
    remark: string      // "TEST", "processPath", etc.
    enabled: boolean
  }>
  insertAsFirst: boolean
  condition: 'always' | 'exactMatch' | 'notContained'
  conditionText?: string  // For "notContained" condition
  isErrorRemark: boolean
  schemaVersion: string   // For future compatibility
}
```

### 2. **Perfect Restoration**
When you click to edit the helper block days later:

```typescript
// The metadata manager extracts this EXACT data:
const originalData = {
  selectedVendors: [
    {
      vendor: "amadeus",
      remarkType: "Miscellaneous - RM<cat>/", 
      category: "T",
      remark: "TEST",
      enabled: true
    },
    {
      vendor: "galileo",
      remarkType: "General - NP<cat>",
      category: "T", 
      remark: "TEST",
      enabled: true
    },
    {
      vendor: "worldspan",
      remarkType: "General - 5",
      category: "",
      remark: "processPath", 
      enabled: true
    }
  ],
  insertAsFirst: false,
  condition: "exactMatch",
  isErrorRemark: false,
  schemaVersion: "1.0"
}

// Modal opens with EXACTLY this state restored
```

### 3. **Schema Evolution Support**
```typescript
// Helper schemas can evolve over time
interface VendorRemarkSchema_v2 {
  // ... existing fields ...
  newFeature?: string
  schemaVersion: "2.0"  // Bump version
}

// Migration function handles old data
function migrateVendorRemarkData(data: any): VendorRemarkSchema_v2 {
  if (data.schemaVersion === "1.0") {
    return {
      ...data,
      newFeature: "defaultValue",
      schemaVersion: "2.0"
    }
  }
  return data
}
```

## Key Benefits:

✅ **Unlimited Complexity** - Arrays, nested objects, any data structure  
✅ **Perfect Fidelity** - Exactly what you configured is restored  
✅ **Version Safe** - Schema evolution with migration support  
✅ **Human Readable** - Metadata is visible in source code  
✅ **Merge Friendly** - Git can diff the JSON metadata  
✅ **Backup Proof** - All data embedded in source, not external DB 