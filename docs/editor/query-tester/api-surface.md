### API Surface

#### Components
- `QueryTestBench`: `{ onQueryGenerated?: (q: string) => void; layout?: 'three-panel' | 'integrated'; className?: string }`
- `ThreePanelQueryInterface`: `{ onQueryGenerated?: (q: string) => void; className?: string }`
- `IntegratedQueryInterface`: `{ onQueryGenerated?: (q: string) => void; className?: string }`

#### Hooks
- `useTableSelection()` → `{ availableTables, selectedTable, selectedTableId, selectTable, tablesLoading }`
- `useQueryVariables(queryText)` → `{ variables, hasVariables, hasAllVariableValues, updateVariable, getFinalQuery, substituteVariables }`
- `useQueryExecution(selectedTable)` → `{ queryResult, isExecuting, executeQuery, resetQuery }`

#### Utilities
- `parseSimpleSQL(query)` → `{ isValid, error?, tableName, columns, whereConditions }`
- `applyWhereConditions(rows, conditions)` → filtered rows

#### Events/Callbacks
- `onQueryGenerated(query: string)` — fired when user clicks Copy; suitable to inject into an editor or clipboard


