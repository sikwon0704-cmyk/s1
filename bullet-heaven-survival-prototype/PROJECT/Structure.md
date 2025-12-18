# Project Structure

## Directories
- `src/game/`: Core game logic (Vanilla JS/TS).
  - `Game.ts`: Main game engine. Manages `GameState` (Start, Playing, Paused, GameOver) and Loop.
  - `InputManager.ts`: Handles Keyboard and Joystick inputs.
  - `ObjectPool.ts`: Generic object pooling system.
  - `Enemy.ts`: Enemy behavior and rendering.
  - `Projectile.ts`: Projectile behavior and rendering.
  - `types.ts`: Game interfaces, Enums (`GameState`), and Constants (`MAX_SLOTS`). 
    - `PlayerStats` now includes `score`.
- `src/components/`: React UI components.
  - `VirtualJoystick.tsx`: On-screen control for mobile feel.
  - `LevelUpModal.tsx`: **Redesigned** Upgrade selection overlay. Features "Survivor.io" style bright UI, pop-up animations, confetti, and focused selection state.
- `src/`: Root application files.

## Key Files
- `src/App.tsx`: Main React component. Handles UI Overlays (Start, Pause, GameOver) and Game instance. Displays Score.
- `src/assets.json`: Asset references.

## Architecture Notes
- **State Management**: 
  - `Game.ts` holds the authoritative game state.
  - `App.tsx` subscribes to state changes (`onStateChange`, `onUIUpdate`) to render React UI overlays.
- **Game Loop**:
  - `update()`: Only runs when `state === PLAYING`.
  - `render()`: Runs in all states to maintain visuals (e.g., behind pause menu).
