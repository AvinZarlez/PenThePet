# Debugging and Testing Branches

## Running Tests and Starting the Game

See [TESTING.md](TESTING.md) for full test commands and [DEVELOPMENT.md](DEVELOPMENT.md) for starting the local server and debugging in the browser.

## VSCode Launch Configurations

Open **Run and Debug** (`Ctrl+Shift+D` / `Cmd+Shift+D`) and pick from the dropdown:

| Configuration                   | What it does                                             |
| ------------------------------- | -------------------------------------------------------- |
| **Start in web browser**        | Starts the HTTP server and opens `http://localhost:8080` |
| **Jest: Run All Tests**         | Runs all tests with coverage                             |
| **Jest: Run Webapp Tests**      | Runs only `test/webapp/` tests                           |
| **Jest: Run Generation Tests**  | Runs only `test/generation/` tests                       |
| **Jest: Run Level Editor Tests**| Runs level-editor UI + related generation pipeline tests |
| **Jest: Run Current Test File** | Runs the currently open test file                        |
| **Run Map Generation Script**   | Generates 5 maps at sizes 7 and 9                        |
| **Start Level Editor in browser** | Starts level-editor server and opens the editor URL    |

VSCode tasks (`Ctrl+Shift+P` → "Run Task") mirror these workflows:

- **Run All Tests**
- **Run Webapp Tests**
- **Run Generation Tests**
- **Run Level Editor Tests**
- **Start HTTP Server** (main webapp)
- **Start Level Editor Server** (local level editor)

---

**Related:** [TESTING.md](TESTING.md) · [DEVELOPMENT.md](DEVELOPMENT.md)
