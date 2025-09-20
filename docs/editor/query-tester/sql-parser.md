### Simple SQL Parser

File: `utils/simple-sql-parser.ts`

Scope: lightweight SELECT/WHERE parsing for Query Tester; not a general SQL engine.

Rules:
- SELECT grammar: `SELECT <cols> FROM [Table Name] [WHERE <conditions>]`
- Columns: either `*` or a comma‑separated list of bracketed identifiers: `[Col A], [Col B]`
- Table identifier MUST be bracketed: `[Table]`
- WHERE conditions: `[,AND|OR]` joined comparisons using brackets for columns
  - Operators: `=, !=, >, <, >=, <=, LIKE, NOT LIKE`
  - Values: number, boolean, or quoted string

API:
- `parseSimpleSQL(query): ParsedQuery`
  - `isValid` false with message when grammar invalid
  - returns `tableName`, `columns`, `whereConditions[]`
- `applyWhereConditions(rows, conditions)`
  - Evaluates conditions left‑to‑right using explicit logical operators
  - Case‑insensitive column matching

Examples:
```sql
SELECT [name], [age] FROM [Customer Data] WHERE [vipStatus] = true AND [age] >= 65
SELECT * FROM [Agent Data]
SELECT [amount] FROM [Booking Data] WHERE [status] LIKE "conf"
```

Design notes:
- Enforces bracketed identifiers to align with project SQL conventions
- Filters happen client‑side after server returns rows
- For production SQL, defer to backend capabilities; this parser is UI‑only


