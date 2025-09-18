### Drag & Drop, Selection, Properties

Drag sources:
- `ComponentPalette` sets `application/json` payload `{ type, label }`.

Drops & creation (CanvasEditor):
- On drop without `component-move`, parses JSON, creates `ComponentItem` with defaults:
  - Defaults per type: label, text-input, select, radio, checkbox, button, divider
  - New ids via `comp_<timestamp>_<rand>`; `config.componentId` also generated
- Adds to `layout.items` and emits `onLayoutChange`

Move existing components:
- Start: `dataTransfer` key `component-move` contains `{ id, offsetX, offsetY }`
- Drop: calculates new `x,y` based on canvas rect and offset; calls `onComponentUpdate(id, { x, y })`

Selection & multi-select:
- Click selects one; Meta/Ctrl toggles selection; `selectedIds` tracks group
- Group drag: mouse handlers move all selected items by delta
- Delete/Backspace removes selected (handled in `PromptEditor` with keyboard listener)

Canvas resizing:
- Corner handle uses `mousemove` to update `canvasWidth`/`canvasHeight` and `onLayoutChange`

Properties editing (PropertiesModal):
- Opens on double-click of a component
- Local state mirrors `selectedComponent.config`
- `handleConfigChange` immediately calls `onComponentUpdate(componentId, { config: newConfig })`
- Sections:
  - Basic: labels/placeholders/required/disabled
  - Styling: font/color/border/size
  - Options: radio/select options with `isDefault`


