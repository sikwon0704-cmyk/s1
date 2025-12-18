# Project Context

## Overview
A "Bullet Heaven" / "Roguelite Survival" game prototype (similar to Survivor.io / Vampire Survivors).
The game features a **"Bright & Casual Modern Zombie"** theme with high-contrast, cartoon-style visuals and arcade audio.

## Tech Stack
- **Framework**: React + Vite
- **Language**: TypeScript
- **Rendering**: HTML5 Canvas (2D Context) with LOD optimization.
- **Audio**: Web Audio API (Procedural 8-bit Synthesizer).
- **Styling**: Tailwind CSS
- **State Management**: React (UI) + Vanilla JS Classes (Game Loop)
- **Persistence**: LocalStorage (Gold, High Score, Permanent Stats).

## Core Gameplay
- **Player**: Cartoon Soldier (Procedurally Generated).
- **Combat**: Auto-fire mechanics, Object Pooling, QuadTree Collision, Physics-based Knockback.
- **Progression**: 
  - **In-Game**: XP collection, Level Up system, Weapon Evolution.
  - **Meta-Game**: Gold collection, Shop/Evolution system for permanent stats.
- **Game Feel**: Bouncy damage numbers, screen shake (planned), impactful sound effects.

## Key Systems
- **Procedural Assets**: 
  - `AssetGenerator`: Generates bright, vector-style sprites (Outlined) via Canvas API.
  - `Synthesizer`: Generates arcade SFX (Pew, Pop, Ding, Cha-Ching) and BGM loops.
- **Physics**: 
  - `QuadTree`: Collision detection.
  - `Enemy`: Supports velocity-based knockback and friction.
  - `DamageText`: Gravity-based bouncing physics.
- **Data**:
  - `DataManager`: Handles persistence for Gold and `PermanentStats` (Base Damage, HP, Speed, Gold Gain).

## User Constraints
- **Zero External Assets**: No images, mp3s, or external URLs allowed. All assets must be generated via code.
- **Visual Style**: Bright, Pop, Arcade (No Dark/Gothic).
- **Performance**: Optimized for 60 FPS with 200+ entities.
