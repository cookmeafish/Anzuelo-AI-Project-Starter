# Game dev: engine commands

## Godot 4
| Job | Command |
|---|---|
| Import assets and check scripts load | `godot --headless --import` (Godot 4.2 and later), or `godot --headless --editor --quit` |
| Run tests with GUT | `godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://tests -gexit` |
| Run tests with GdUnit4 | `godot --headless -s res://addons/gdUnit4/bin/GdUnitCmdTool.gd -a res://tests --ignoreHeadlessMode` |
| C# build and tests | `dotnet build`, `dotnet test` |
| Export a release build | `godot --headless --export-release "<preset>" <out file>` |
| Export a debug build | `godot --headless --export-debug "<preset>" <out file>` |
| Start the build once | `<out file> --headless --quit-after 300` |

GUT and GdUnit4 are add-ons in the project's `addons/` folder. Adding one is a third-party install: ask first.

All in one run, with the tests:

```
node skills/game-dev/scripts/export-smoke.mjs --preset "Windows Desktop" --out builds/windows/Game.exe --test "godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://tests -gexit"
```

### Output file per preset
| Preset platform | `--out` ends in | Smoke start here? |
|---|---|---|
| Windows Desktop | `.exe` | on Windows |
| Linux | `.x86_64` | on Linux |
| macOS | `.zip` or `.app` | no: `--no-smoke "macOS build"` unless on a Mac and unzipped |
| Web | `.html` | no: `--no-smoke "web build"`, then try it in a browser |
| Android | `.apk` or `.aab` | no: install on an emulator (mobile-app skill, when enabled) |

### Common export failures
- "No export template found": templates for this exact Godot version are not installed.
- The build starts, then fails to load a scene: the resource is only loaded by a path string, and the preset's export
  filter left it out. Add it to the preset's resources or load it with `preload`.
- C# build exports but crashes: the assembly name in the `.csproj` differs from the project name in `project.godot`.

## Unity
| Job | Command |
|---|---|
| Edit mode tests | `Unity -batchmode -nographics -projectPath . -runTests -testPlatform EditMode -testResults .cache/unity-tests.xml` |
| Play mode tests | the same with `-testPlatform PlayMode` |
| Build | `Unity -batchmode -nographics -quit -projectPath . -executeMethod <BuildClass.Method> -logFile .cache/unity-build.log` |
| Start the player | `<player> -batchmode -nographics -logFile .cache/unity-player.log`, with a test scene that quits after a set time |

Check the log files for `Exception` and `Error` lines: the exit code alone misses some failures.

## Frame budget
| Target | Budget per frame |
|---|---|
| 30 fps | 33.3 ms |
| 60 fps | 16.6 ms |
| 120 fps | 8.3 ms |

Leave headroom (about 20%) for slower machines and background work.

## Save file sketch (Godot)
```
const SAVE_VERSION := 3
func save_game(data: Dictionary) -> void:
    data["version"] = SAVE_VERSION
    var tmp := "user://save.json.tmp"
    var f := FileAccess.open(tmp, FileAccess.WRITE)
    f.store_string(JSON.stringify(data))
    f.close()
    DirAccess.rename_absolute(ProjectSettings.globalize_path(tmp), ProjectSettings.globalize_path("user://save.json"))
```
Loading reads `version`, then runs each migration from that version up to `SAVE_VERSION` in order.
