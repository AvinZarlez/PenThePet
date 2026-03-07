# Debugging and Testing Branches

## Running Tests and Starting the Game

See [TESTING.md](TESTING.md) for full test commands and [DEVELOPMENT.md](DEVELOPMENT.md) for starting the local server and debugging in the browser.

## VSCode Launch Configurations

Open **Run and Debug** (`Ctrl+Shift+D` / `Cmd+Shift+D`) and pick from the dropdown:

| Configuration | What it does |
|---|---|
| **Start in web browser** | Starts the HTTP server and opens `http://localhost:8080` |
| **Jest: Run All Tests** | Runs all tests with coverage |
| **Jest: Run Webapp Tests** | Runs only `test/webapp/` tests |
| **Jest: Run Generation Tests** | Runs only `test/generation/` tests |
| **Jest: Run Current Test File** | Runs the currently open test file |
| **Run Map Generation Script** | Generates 5 maps at sizes 7 and 9 |

VSCode tasks (`Ctrl+Shift+P` → "Run Task") mirror most of these for test and lint workflows.

---

**Related:** [TESTING.md](TESTING.md) · [DEVELOPMENT.md](DEVELOPMENT.md)
