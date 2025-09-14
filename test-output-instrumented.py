import sys
import json
import traceback
from typing import Any, Dict, List

# Step control system (simplified for test)
step_control = {"current_step": 0, "mode": "step", "target_step": 1}

def __STEP_CONTROL__(step_id, python_line, business_line, description=""):
    step_control["current_step"] += 1
    return True

try:
    # Execute the original user code with step instrumentation
    
    # this is a test
    class Test:
        name = "ell"
        __STEP_CONTROL__("STMT_3", 3, 3, "name = \"ell\"")
        age = 12
        __STEP_CONTROL__("STMT_4", 4, 4, "age = 12")
    
    air = "123"
    __STEP_CONTROL__("STMT_6", 6, 6, "air = \"123\"")
    
    newS = 5
    __STEP_CONTROL__("STMT_8", 8, 8, "newS = 5")
    
    newCls = Test()
    __STEP_CONTROL__("STMT_10", 10, 10, "newCls = Test()")
    
    newCls.age = 4
    __STEP_CONTROL__("STMT_12", 12, 12, "newCls.age = 4")
    newCls.name = "ger"
    __STEP_CONTROL__("STMT_13", 13, 13, "newCls.name = \"ger\"")
    
    new1Cls = Test()
    __STEP_CONTROL__("STMT_15", 15, 15, "new1Cls = Test()")
    
    
    
    testClasses = [newCls, new1Cls]
    __STEP_CONTROL__("STMT_19", 19, 19, "testClasses = [newCls, new1Cls]")
    
    for testcls in testClasses:
        if testcls.age == 4:
            if newCls.age == 5:
                air = ""
                __STEP_CONTROL__("STMT_24", 24, 24, "air = \"\"")
            elif newCls.age == 3:
                air = "gthan"
                __STEP_CONTROL__("STMT_26", 26, 26, "air = \"gthan\"")
            
            __STEP_CONTROL__("STMT_28", 28, 28, "break")
            break
    else:
        air = "RR"
        __STEP_CONTROL__("STMT_30", 30, 30, "air = \"RR\"")
        if newCls.age == 6:
            air = ""
            __STEP_CONTROL__("STMT_32", 32, 32, "air = \"\"")
        elif newCls.age == 12:
            air = "gthan"
            __STEP_CONTROL__("STMT_34", 34, 34, "air = \"gthan\"")
            air = ""
            __STEP_CONTROL__("STMT_35", 35, 35, "air = \"\"")
            air = "yes"
            __STEP_CONTROL__("STMT_36", 36, 36, "air = \"yes\"")

except Exception as e:
    print("__EXECUTION_ERROR__")
    print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

__STEP_CONTROL__("COMPLETE", 0, 0, "Execution completed")