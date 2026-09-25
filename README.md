# Ricette

Ricette is a recipe and meal-planning app you can run yourself. "Ricette" is the Italian word for recipes and is a working name, not a final one.

It's early. You can sign up, sign in and create a household; recipes, meal plans and shopping lists are what gets built next. Nothing is released yet.

The same code will also power a hosted version for people who would rather not run it themselves. Self-hosting stays free and doesn't depend on any outside service.

## Try it

You need PHP, Composer, Node and pnpm. `./bin/setup` checks your machine and tells you what's missing.

```bash
./bin/setup
./bin/dev --seed
```

Then open <http://localhost:8000>. The demo login is `demo@example.com` with the password `correct horse battery staple`.

`./bin/verify` runs every check the project's CI runs. `docs/development/setup.md` has the details, including debugging in VS Code.

## Built with

Laravel 13 and Svelte 5, connected with Inertia. SQLite by default, PostgreSQL if you prefer it. It ships as a container image. The reasons behind these choices are in `docs/adr/`.

## Contributing

Read `CONTRIBUTING.md` first. Work is tracked as issues on the project board, and a change should start from one. Every commit needs a sign-off (the `-s` flag when you commit); we use the Developer Certificate of Origin instead of a contributor agreement.

Questions are in `SUPPORT.md`. Security problems are in `SECURITY.md`; please don't report those as public issues.

## More

- `docs/operations/deployment.md`: running it for real
- `docs/architecture/principles.md` and `docs/adr/`: how it's designed, and why
- `GOVERNANCE.md`: who decides what
- `AGENTS.md`: the rules AI coding agents follow here
- `PROVENANCE.md`: where the requirements came from

## License

MPL-2.0. See `LICENSE`.
