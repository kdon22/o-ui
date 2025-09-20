### Testing Guide

Unit tests (suggested):
- `simple-sql-parser` — columns parsing, WHERE operators, LIKE, error messages
- `use-query-variables` — detection and substitution, auto‑quotes

Integration tests:
- Tables list renders categories and tables from mocked actions
- Selecting a table auto‑seeds query to `SELECT * FROM [<table>]`
- Entering WHERE with placeholders disables Run until values provided
- Run triggers `tableData.list` with skipCache and displays rows
- Results modal opens and renders columns/rows

Manual checks:
- Branch switch updates completion columns after next run
- Large tables show “wide table” hint and full‑screen button


