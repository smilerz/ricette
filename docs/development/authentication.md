# Authentication

Local email-and-password accounts (MVP). Implements the sign-up and sign-in mechanism and the unique account
identity requirement; everything not listed under "Not included" is out of scope for now.

## Behavior

- **Register** (`/register`): name, email, password and confirmation. The password must be at least 12
  characters. Registration never signs the person in; it redirects to sign-in with a notice.
- **Sign in** (`/login`): email and password. A wrong password and an unknown account get the same error.
  The session id is renewed on sign-in, and sign-out invalidates the session and rotates the CSRF token.
- **Sign out** (`POST /logout`): signed-in users only.

## Email identity

`App\Support\EmailAddress::normalize` is the single definition: lowercase and trimmed. The `User` model applies
it whenever an email is set, and the registration and sign-in requests apply it to input, so `Ana@Example.com`
and `ana@example.com` are one account.

## Passwords

Passwords are hashed with **Argon2id** (`config/hashing.php`, `HASH_DRIVER`, memory/time/threads settings) and
never stored or logged in plaintext. Hash verification is strict: a hash from a different algorithm does not
verify.

## Unique account identity

Uniqueness of the normalized email is enforced by the database's unique index on `users.email`, not by a
check-then-insert that two concurrent requests could both pass. The registration insert runs in a
transaction so a violation rolls back cleanly on both SQLite and PostgreSQL.

A duplicate registration creates nothing and returns exactly the response a new registration returns (a
redirect to sign-in with the same notice). The response never tells the caller whether the address was already
registered. The MVP does not require that signal, and keeping the response uniform leaves room for the later
account-existence non-disclosure requirement. The consequence is that someone who forgot they registered sees a
failed sign-in; password reset is a later feature.

## Error messages

Server messages for the forms are translation keys (`validation.required`, `auth.failed`, and so on) defined
in `lang/en.json`; the Svelte pages translate them (ADR-0024).

## Not included

Login throttling and lockout, email verification, password reset, remember-me, multi-factor authentication,
and third-party sign-in. Login throttling in particular is worth adding soon: sign-in currently has no
brute-force protection beyond the cost of Argon2id.
