---
name: game-dev
description: Builds games that run the same on every machine and keep players' saves safe, Godot 4 first with notes for Unity and other engines. After scene or script changes the game is built, tested and exported headless with a preset, and the exported build is started once (a script ending in RESULT: PASS or FAIL); motion is time-based within a frame-time budget; input goes through named actions; save data carries a version and old saves still load; sprites stay on the project's grid (a PNG size check); and playtests leave notes. Use when the project is a game and the user asks to export or package it, add a mechanic or scene, fix a game bug, map controls, change save files, add sprites, or run a playtest.
triggers: godot, gdscript, unity game, unreal engine, game dev, game development, export the game, game build, steam build, itch build, scene tree, tilemap, sprite, sprites, sprite sheet, sprite size, pixel art, input map, controller support, save game, save file version, playtest, playtest notes, frame time budget, delta time
---
# Game dev: a build that starts, saves that load

A game that runs in the editor can still crash as an exported build, stutter on a slower machine, or lose a player's
save after an update. This skill checks each with a command.

Say at the start: "Working on the game (game-dev skill)."

## What the other skills already cover
- **The feature or bug itself:** the app pack runbooks (`docs/playbooks/feature.md`, `docs/playbooks/bugfix.md`) and
  the debug skill. This skill adds the game-specific steps.
- **Frame drops, stutter, load times:** `docs/playbooks/perf.md` (measure first). Section **C** here sets the budget.
- **Menus, HUD and other screens:** the gui-review-loop skill (gui pack) for screenshots and the review loop.
- **Shipping to Steam, itch.io or a console store:** `docs/playbooks/release.md`. Uploading is an outward action.

Scripts (Node only, nothing to install): `skills/game-dev/scripts/export-smoke.mjs` builds, tests, exports and
smoke-starts a Godot build; `skills/game-dev/scripts/sprite-check.mjs` checks PNG sizes against the grid. Engine
commands are in [references.md](references.md).

## Pick the situation
| Situation | Do |
|---|---|
| A scene, script or project setting changed | **A** (export and smoke start) |
| Export or package the game, a tester build | **A**, then **G** for the notes |
| Movement, physics, animation, "runs faster on my PC" | **C** |
| Controls, gamepad, rebinding | **D** |
| Save files, settings files, an update that changes them | **E** |
| New or changed sprites, tiles, textures | **F** |
| A playtest, feedback from players | **G** |

## A. Build, test, export, start (Godot 4)
1. The export preset must exist in `export_presets.cfg`. If not, ask the user to add it in the editor
   (Project > Export): presets hold platform and signing choices. The export templates for this Godot version must be
   installed (Editor > Manage Export Templates); installing them is the user's call.
2. Run: `node skills/game-dev/scripts/export-smoke.mjs --preset "<preset>" --out builds/<target>/<Game>.<ext>`.
   - It checks the preset, runs `dotnet build` for C# projects, runs the tests, exports headless
     (`godot --headless --export-release`, or `--export-debug` with `--debug`), then starts the exported build once
     with `--headless --quit-after 300` (`--frames <n>` changes the count).
   - Tests: `--test "<command>"` (GUT or GdUnit4 commands are in references.md). C# projects default to `dotnet test`.
   - `--project <dir>` when `project.godot` is not in the current folder. `GODOT_BIN` names the Godot binary when it
     is not `godot` on the PATH.
   - A target this machine cannot start (web, another OS): add `--no-smoke "<why>"` and say so in the answer.
3. On `RESULT: FAIL <step>`, fix that step (debug skill) and run the whole script again. The smoke step also fails on
   `SCRIPT ERROR` or `Parse Error` in the output, because Godot can exit with 0 after a script error.
4. `builds/` and `.godot/` stay out of git (`.gitignore`). Note each tester build in `docs/CHANGELOG.md` with the
   version from `project.godot` (`config/version`), date and size.

## B. Other engines
Same idea: build headless, run the tests, start the built game once, and fail on errors in its log.
- **Unity:** `Unity -batchmode -nographics -projectPath . -runTests -testPlatform EditMode -testResults <file>`, then a
  build method through `-executeMethod`, then start the player with `-batchmode -nographics -logFile <file>` and a
  quit after a set time in a test scene.
- **Unreal:** `RunUAT BuildCookRun` for the build, automation tests with `-ExecCmds="Automation RunTests <name>"`.
- **Web and code-first engines** (Phaser, Bevy, LOVE, MonoGame): the project's own build and test commands, then a
  headless start (a browser test runner for web games).

## C. Frame time and time-based motion
1. Set the budget with the user: 16.6 ms per frame for 60 fps, 33.3 ms for 30 fps, on the slowest machine the game
   should support. Write it in `docs/BRIEF.md`.
2. Every movement, timer and animation speed is multiplied by `delta` (Godot `_process(delta)`, Unity
   `Time.deltaTime`). Physics goes in the fixed step (`_physics_process`, `FixedUpdate`), not the frame step.
3. Measure with the engine profiler (Godot Debugger > Monitors, Unity Profiler) on a build, not in the editor, and
   follow `docs/playbooks/perf.md` for any fix.

## D. Input
1. All input goes through named actions (Godot Input Map, Unity Input System actions), never raw key codes in
   gameplay code, so keys can be rebound and gamepads work.
2. Each action has a keyboard key and a gamepad button. Test both, and test the menus with a gamepad alone.
3. Rebinding, when offered, is saved in the settings file (**E**) and has a reset to defaults.

## E. Save data
1. Every save and settings file holds a `version` number. Write to `user://` (Godot) or
   `Application.persistentDataPath` (Unity), never next to the game files.
2. A change to the save format bumps the version and adds a migration from each older version. Keep a sample save
   from each released version in `tests/fixtures/saves/` and a test that loads every one.
3. Write safely: write a temporary file, then rename it over the old one, so a crash mid-save keeps the last good save.
4. A save that fails to load is kept (renamed, not deleted), and the player is told in plain words.

## F. Sprites and assets
1. Agree the grid with the user (for example 16, 32 or 48 pixels) and the folder sprites live in.
2. Check after adding or changing sprites:
   `node skills/game-dev/scripts/sprite-check.mjs <sprite folder> <size>` (`<width>x<height>` for frames that are
   not square). Each sprite is one cell or a sheet of whole cells.
3. Pixel art: nearest filtering (Godot project setting `rendering/textures/canvas_textures/default_texture_filter`
   to Nearest), no mipmaps, and integer scaling for the window.
4. Never overwrite the artist's source files (`.aseprite`, `.psd`, `.kra`); export PNGs from them into the sprite
   folder. Check every asset's license before it goes into the game.

## G. Playtests
1. Before a playtest, write in `docs/playtests/<date>.md`: the build version, what to watch (one or two questions),
   and the tasks for the player.
2. During and after: what players did, where they got stuck, what they said, in their words. Note bugs as steps to
   repeat them.
3. Turn each finding into a task or a bug, and link it from the playtest note. Do not fix during the playtest.

## Done when
- [ ] After scene, script or project changes, `export-smoke.mjs` or the engine's tests ran this turn (hook: game-smoke-ran).
- [ ] The export script printed RESULT: PASS, or the answer names the failing step (judgment: a failure may be the honest result).
- [ ] Motion and timers use delta; physics runs in the fixed step (judgment: needs a reader).
- [ ] A save format change bumped the version and added a migration, with a test loading old saves (judgment: only save turns).
- [ ] Changed sprites passed `sprite-check.mjs` (judgment: only asset turns; a project can add a runEach check on its sprite folder).

## Pitfalls
- Trusting the editor: an exported build can miss resources that are only loaded by path, or an autoload.
- Export templates missing for the installed Godot version, so the export step fails with no build.
- Godot printing `SCRIPT ERROR` and still exiting 0, so a plain exit-code check passes a broken build.
- Speed tied to frame rate: the game runs twice as fast on a 120 Hz screen.
- A save format change with no version number, so old saves crash the update.
- Sprites one pixel off the grid, which show seams or blur once scaled.
- Fixing things during a playtest instead of writing them down.
