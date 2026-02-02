# nx-oxfmt

An Nx plugin for [oxfmt](https://oxc.rs/docs/guide/usage/formatter/cli.html) - the high-performance JavaScript/TypeScript formatter.

## Manual Setup

### Install

```bash
npx nx add @0zd0/nx-oxfmt
```

### Add the executor to `project.json`:

```json
{
    "targets": {
        "fmt": {
            "executor": "@nx-oxfmt/plugin:fmt",
            "options": {
                "write": true
            }
        }
    }
}
```

## Run Formatting:

```bash
nx run your-project:fmt
```

or

```bash
nx run-many --target fmt
```

## Executor Options

All options are optional. The executor defaults to writing changes in place.

- `check` _(optional)_ - Check if files are formatted, show statistics (default: `false`)
- `write` _(optional)_ - Format and write files in place (default: `true`)
- `listDifferent` _(optional)_ - List files that would be changed (default: `false`)
- `config` _(optional)_ - Path to the configuration file (default: auto-detected by oxfmt)
- `ignorePath` _(optional)_ - Path to ignore file(s) (default: `.gitignore` and `.prettierignore`)
- `threads` _(optional)_ - Number of threads to use (default: auto-detected)
- `withNodeModules` _(optional)_ - Format code in node_modules directory (default: `false`)
- `noErrorOnUnmatchedPattern` _(optional)_ - Do not exit with error when pattern is unmatched (default: `false`)
- `additionalArguments` _(optional)_ - Additional arguments to pass to oxfmt as a string

## Configuration

If no config file is passed, **oxfmt** will automatically look for configuration files (e.g. `.oxfmtrc.json`).

See [oxfmt documentation](https://oxc.rs/docs/guide/usage/formatter/cli.html) for configuration options.
