# Atlas Realms

Multiplayer fictional world-simulation strategy game.

## Run locally

Open a terminal in the repository folder and run:

```bash
python -m http.server 8787
```

Then open `http://127.0.0.1:8787`.

The browser connects to the project's Supabase backend. Authenticated game actions are processed by the `game-actions` Edge Function.

## Current systems

- 34 fictional atlas provinces with irregular polygons
- Land area, terrain, climate, elevation, rivers and resource data
- Player-created countries, flags and cultures
- Server-authoritative founding, expansion and turn processing
- Treasury coins plus food, iron, gold, oil and gems
- Infrastructure, education, healthcare and housing development
- Population growth and stability/happiness systems
- Diplomacy and on-the-spot AI trade negotiation
- Responsive desktop/mobile UI
