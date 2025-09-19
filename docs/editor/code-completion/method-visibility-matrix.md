## Method Visibility Matrix (by context)

This grid lists which string methods appear in completion for each context.

Legend:
- condition = can be used directly in if/when/while
- expression = usable inside expressions/chains
- assignment = usable on right side of assignment

### String

| Method | condition | expression | assignment |
| --- | --- | --- | --- |
| isEmail | ✓ | ✓ | ✓ |
| isNumeric | ✓ | ✓ | ✓ |
| isEmpty | ✓ | ✓ | ✓ |
| contains | ✓ | ✓ | ✓ |
| length | ✓ | ✓ | ✓ |
| match | ✓ | ✓ | ✓ |
| toProperCase | ✓ | ✓ | ✓ |
| toLowerCase | ✓ | ✓ | ✓ |
| toUpperCase | ✓ | ✓ | ✓ |
| trimWhite |  | ✓ | ✓ |
| toBase64 | ✓ | ✓ | ✓ |
| fromBase64 | ✓ | ✓ | ✓ |
| toUrlSafe |  | ✓ | ✓ |
| maskData |  | ✓ | ✓ |
| truncate |  | ✓ | ✓ |
| toCurrency |  | ✓ | ✓ |
| toInt |  | ✓ | ✓ |
| replace |  | ✓ | ✓ |
| split |  | ✓ | ✓ |

Notes:
- Condition context is strictly driven by schema `allowedIn` or `isPredicate`.
- `toInt` is intentionally excluded from condition to prevent numeric coercion-as-boolean ambiguity.

