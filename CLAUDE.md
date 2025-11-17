**Coding Philosophy**

All code generated for this project must follow these principles:

*1. Clean & Readable*

Code should be easy to read and understand at a glance.

Prefer clarity over cleverness.

Functions and modules must have clear names that describe their purpose.

Add concise comments only where necessary.

*2. Modular Structure*

Break large logic into small, independent, testable components.

Each component should do one thing well.

Avoid long functions — target a maximum of 30–40 lines per function unless absolutely required.

*3. More Files, Fewer Lines*

I prefer:

More files with fewer lines of code
rather than

One large file with hundreds of lines

So:

Split features into separate modules/files.

Group related functions into small files.

Keep each file focused on one clear responsibility.

*4. Maintainable & Extensible*

New features should be easy to add without modifying large parts of the codebase.

Use consistent patterns and folder structures.

Avoid hard-coded values; use configs/envs where appropriate.

*5. Simple, Not Over-Engineered*

Avoid unnecessary abstractions, factories, inheritance trees, or patterns unless clearly needed.

Use straightforward solutions and standard libraries unless otherwise specified.

*6. Error Handling*

Provide clean, predictable error handling.

No silent failures.

Return meaningful error messages.

*7. Testing-Friendly*

Functions and modules should be structured to allow easy unit testing.

Avoid tightly coupled logic.