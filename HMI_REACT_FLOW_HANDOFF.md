# React Flow HMI Handoff

This project contains a Vite + React + React Flow HMI-style machine-room UI. It was built to resemble an industrial PLC/HMI overview screen with conveyors, warehouse bins, chute status indicators, sensors, counters, and control buttons.

Live reference:

```text
https://yifwei.github.io/WebHMI/
```

## What To Copy

Copy these files into another React/Vite project:

```text
src/App.jsx
src/styles.css
src/main.jsx
package.json
vite.config.js
```

If the target project already has its own `main.jsx`, `package.json`, or `vite.config.js`, merge the relevant parts instead of replacing the whole file.

Required dependencies:

```bash
npm install @xyflow/react lucide-react
```

The main React Flow stylesheet must be imported once:

```jsx
import '@xyflow/react/dist/style.css';
```

In this project, that import is in `src/main.jsx`.

## Run Locally

```bash
npm install
npm run dev
```

On Windows PowerShell, if script execution blocks `npm`, use:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

## Main Structure

The HMI screen is implemented in `src/App.jsx`.

Important sections:

```text
Custom React Flow node components
  WarehouseNode
  StationNode
  SensorNode
  ChuteStatusNode
  BeltNode
  MarkerNode
  ZoneNode
  PointNode

Custom edge component
  ConveyorEdge

Flow definitions
  initialNodes
  initialEdges
  bins
  conveyorPoints
```

The visual styling is in `src/styles.css`.

Important style groups:

```text
Page shell and grid background
  .app-shell
  .flow-panel

Top/status controls
  .topbar
  .toolbar
  .system-stats

Machine room elements
  .warehouse-node
  .station-node
  .sensor-node
  .belt-node
  .zone-node
  .point-node

Conveyor lines
  .conveyor-edge
  .conveyor-shadow
```

## How To Adapt For Another Machine Room

### 1. Rename The Screen

In `TopBar()` inside `src/App.jsx`, change:

```jsx
<h1>Warehouse Chute Flow</h1>
```

Example:

```jsx
<h1>Machine Room 2 Overview</h1>
```

### 2. Change The Top Bins Or Chutes

Edit the `bins` array:

```jsx
const bins = [
  ['WM1', 250, 'green', '8', 'green', '8'],
  ['WM2', 420, 'pink', '7', 'pink', '7'],
  ['WM3', 590, 'blue', '3', 'blue', '3'],
];
```

Format:

```text
[label, xPosition, leftTileColor, leftTileValue, rightTileColor, rightTileValue]
```

Supported tile colors:

```text
green
blue
cyan
pink
red
```

### 3. Move Equipment Around

Every node has a `position`:

```jsx
{
  id: 'ou1',
  type: 'station',
  position: { x: 242, y: 280 },
  data: { ... },
}
```

Change `x` and `y` to place it on the canvas.

React Flow coordinates are canvas coordinates, not CSS pixels after zoom. Larger `x` moves right. Larger `y` moves down.

### 4. Add A New Machine Or Sensor

Add a node to `initialNodes`.

Example sensor:

```jsx
{
  id: 'new-sensor-1',
  type: 'sensor',
  position: { x: 760, y: 420 },
  data: { label: 'PS01', value: '1', active: true },
}
```

Example station:

```jsx
{
  id: 'new-station',
  type: 'station',
  position: { x: 820, y: 310 },
  data: {
    label: 'MTR1',
    active: true,
    tiles: [
      { label: '1', value: '4', tone: 'blue' },
      { label: '8', value: '0', tone: 'green' },
    ],
  },
}
```

### 5. Connect Equipment With Conveyors

Add an edge to `initialEdges`.

Example:

```jsx
{
  id: 'new-station-new-sensor',
  source: 'new-station',
  target: 'new-sensor-1',
  type: 'conveyor',
  animated: true,
}
```

For clean conveyor routing, use `PointNode` junctions:

```jsx
{
  id: 'p-machine-room-turn',
  type: 'point',
  position: { x: 900, y: 380 },
  data: { label: 'T1' },
}
```

Then connect through the point:

```jsx
{ id: 'station-to-turn', source: 'new-station', target: 'p-machine-room-turn', type: 'conveyor' },
{ id: 'turn-to-sensor', source: 'p-machine-room-turn', target: 'new-sensor-1', type: 'conveyor' },
```

### 6. Add Background Zones

Zones are translucent machine-room areas, pallet stacks, lift bays, tanks, or equipment footprints.

Example:

```jsx
{
  id: 'zone-machine-a',
  type: 'zone',
  position: { x: 520, y: 570 },
  data: { label: 'Pump Room A', tone: 'blue' },
  draggable: false,
}
```

Supported tones:

```text
green
blue
```

## GitHub Pages Notes

For a GitHub Pages project page, set the Vite base path in `vite.config.js`:

```jsx
export default defineConfig({
  base: '/REPOSITORY_NAME/',
  plugins: [react()],
});
```

For this repo:

```jsx
base: '/WebHMI/'
```

If deploying to a custom domain or root domain, use:

```jsx
base: '/'
```

## Current Validation

The current deployed screen has:

```text
41 React Flow nodes
27 React Flow edges
```

Local build command:

```bash
npm run build
```

Expected result:

```text
vite build completes successfully
```

## Suggested Workflow For A New Machine Room

1. Sketch the machine room as named equipment blocks.
2. List all conveyors, pipes, chutes, or process paths.
3. Convert each physical item into a React Flow node.
4. Use `PointNode` junctions to make clean route turns.
5. Add live/status values later by replacing static `data` values with API, MQTT, OPC-UA, or WebSocket state.
6. Keep layout data in arrays once the design grows beyond one screen.

## Future Data Integration Idea

Right now the status values are static. For a real HMI, use a data object like:

```jsx
const machineState = {
  WM1: { up: true, down: false, request: false },
  SRS9: { active: true, countA: 3, countB: 8 },
  HE1: { weight: '-1.2 kg' },
};
```

Then pass those values into the node `data` fields.

Good next step:

```text
Move initialNodes and initialEdges into a separate machineRoomLayout.js file.
```

That makes it easier to reuse the same React components for many different machine rooms.
