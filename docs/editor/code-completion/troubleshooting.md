## Troubleshooting

No completions appear
- Verify the model language is `business-rules`.
- Ensure provider registration runs after language/tokenizer initialization.
- Check console for schema load errors.

Wrong or missing types
- Confirm the method exists in `ALL_METHOD_SCHEMAS` and category maps to a base type.
- For local classes, define the class before usage in the same file.

Duplicate suggestions
- Ensure provider disposables are cleaned up on unmount.
- Avoid multiple registration calls for the same editor instance.

Imports missing in generated Python
- Add required `pythonImports` to the method schema.
- Set `debugInfo.helperFunction` so the translator can import the correct helper submodule.

No-parens methods insert with ()
- Set `noParensAllowed: true` and `snippetTemplate` without parentheses.


