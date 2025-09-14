#!/usr/bin/env python3
"""
Enterprise-Grade AST-Based Python Debugger
🎯 Clean, reliable, extensible approach to business rule debugging
"""

import ast
import json
import sys
from typing import Any, Dict, List, Optional

class BusinessRuleDebugger(ast.NodeVisitor):
    """
    Professional AST-based debugger for business rules
    """
    
    def __init__(self):
        self.steps: List[Dict[str, Any]] = []
        self.globals: Dict[str, Any] = {}
        self.locals: Dict[str, Any] = {}
        self.line_number = 0
        
        # Set up safe execution environment
        self.setup_environment()
    
    def setup_environment(self):
        """Set up safe execution environment with helper functions"""
        # Add helper functions to globals
        def log_message(message, **kwargs):
            print(f"LOG: {message}")
            return message
            
        self.globals.update({
            'log_message': log_message,
            'log': log_message,
            '__builtins__': __builtins__,
        })
    
    def execute_code(self, code: str) -> List[Dict[str, Any]]:
        """
        Execute business rule code and return debug steps
        """
        try:
            # Parse code into AST
            tree = ast.parse(code)
            
            # Execute each statement
            for node in tree.body:
                self.visit(node)
            
            return self.steps
            
        except Exception as e:
            self.steps.append({
                'line': self.line_number,
                'variables': dict(self.locals),
                'error': str(e),
                'output': f'Error: {str(e)}'
            })
            return self.steps
    
    def capture_step(self, node: ast.AST, description: str):
        """Capture current execution step"""
        self.line_number = getattr(node, 'lineno', self.line_number)
        
        # Clean variables for JSON serialization
        clean_vars = {}
        for name, value in self.locals.items():
            try:
                json.dumps(value)  # Test serialization
                clean_vars[name] = value
            except:
                clean_vars[name] = str(value)
        
        self.steps.append({
            'line': self.line_number,
            'variables': clean_vars,
            'output': description
        })
    
    def visit_Assign(self, node: ast.Assign):
        """Handle variable assignments: x = 5"""
        # Evaluate the right-hand side
        value = self.eval_expression(node.value)
        
        # Assign to all targets (handles multiple assignment)
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.locals[target.id] = value
                self.capture_step(node, f"{target.id} = {repr(value)}")
    
    def visit_If(self, node: ast.If):
        """Handle if statements"""
        # Evaluate condition
        condition = self.eval_expression(node.test)
        self.capture_step(node, f"if {self.expr_to_string(node.test)}: # {condition}")
        
        # Execute appropriate branch
        if condition:
            for stmt in node.orelse:
                self.visit(stmt)
        else:
            for stmt in node.orelse:
                self.visit(stmt)
    
    def visit_Expr(self, node: ast.Expr):
        """Handle expression statements (like function calls)"""
        result = self.eval_expression(node.value)
        self.capture_step(node, f"Expression result: {repr(result)}")
    
    def eval_expression(self, node: ast.AST) -> Any:
        """Safely evaluate an expression"""
        # Compile the expression
        code = compile(ast.Expression(node), '<string>', 'eval')
        
        # Execute in our controlled environment
        return eval(code, self.globals, self.locals)
    
    def expr_to_string(self, node: ast.AST) -> str:
        """Convert AST expression back to string"""
        return ast.unparse(node)

def debug_business_rule(code: str) -> Dict[str, Any]:
    """
    Main entry point for debugging business rules
    """
    debugger = BusinessRuleDebugger()
    steps = debugger.execute_code(code)
    
    return {
        'success': True,
        'debugSteps': steps
    }

if __name__ == "__main__":
    # Test with sample business rule
    test_code = """
new_bool = True
new_bool = False
if new_bool:
    log_message("m")
else:
    log_message("b")
"""
    
    result = debug_business_rule(test_code)
    print(json.dumps(result, indent=2))
