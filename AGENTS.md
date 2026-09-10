# GastroFlow agent contract

## SPECTRA pilot

The current-format SPECTRA pilot covers only the table-service payment flow.
Read `.spectra/00-vision.md` for its exact scope before changing payment
behaviour. The legacy `specs/` tree remains the reference for domains not yet
migrated.

For an in-scope change:

1. Update the relevant `.spectra/` layer before code.
2. Use the canonical terms from `.spectra/01-glossary.md`.
3. Preserve all invariants in `.spectra/04-invariants.md`.
4. Link implementation artefacts with `@spectra` IDs.
5. Add or update independent tests for the linked acceptance criteria.
6. Run `npm run spectra:validate`, the relevant tests, and
   `npm run spectra:trace`.

Do not invent or silently update legal rules. A trace tag is a declaration, not
proof that behaviour is correct.

