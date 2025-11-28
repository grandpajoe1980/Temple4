# Ticket 0008 – Accessibility & UX Sweep (Modal Focus Trap pilot)

Status: IN PROGRESS
Area: Accessibility, UX
Depends on: None

Goal

Implement a robust focus-trap and return-focus pattern for modal/dialog components across the app, and pilot the change on the highest-impact modals. This is the first technical step for Ticket 0008 and will improve keyboard and screen-reader experiences for dialog flows.

Scope

- Add a small, reusable focus-trap hook `useFocusTrap` in `app/lib/a11y.ts` (or `app/hooks/useFocusTrap.ts`), implemented without third-party dependencies.
- Update modal/dialog components to use the hook and ensure:
  - `role="dialog"` or `role="alertdialog"` and `aria-modal="true"`.
  - `aria-labelledby` and/or `aria-describedby` referencing the title/description.
  - Focus moves into the dialog on open and is trapped while open.
  - Focus returns to the opener element when the dialog closes.
- Pilot updates on the following modal components (high-impact first):
  - `app/components/messages/NewMessageModal.tsx`
  - `app/components/tenant/EditUserProfileModal.tsx` (if present)
  - Any other `*Modal.tsx` files found during inventory.

Tasks

1. Inventory: List all modal/dialog components (search for `Modal` filename patterns and `role="dialog"`).
2. Create `app/hooks/useFocusTrap.ts` with a lightweight focus-trap implementation.
3. Update one modal (pilot): `NewMessageModal.tsx` to use the hook, ensure `aria-` attributes, and manage focus return.
4. Test: Add a Playwright test that opens the modal, verifies focus is inside the dialog, tabs through focusable controls, presses Escape to close and verifies focus returns to the trigger.
5. Rollout: Apply the same changes to other modal components in a follow-up commit.

Definition of Done

- `useFocusTrap` implemented and exported.
- At least one modal (`NewMessageModal.tsx`) updated to use the hook and has correct ARIA attributes.
- Playwright test added (or at minimum manual verification documented) that confirms open/trap/close/focus-return.
- `npm run lint` passes. `npm run build` may be blocked by unrelated environment issues (Prisma client permissions), but code compiles locally in TypeScript checks.

Notes / Guardrails

- Keep the implementation dependency-free and minimal.
- Do not change modal visuals or large UI behavior—only accessibility/focus logic.
- If a modal is implemented with a third-party library (e.g., Radix or Headless UI), prefer using that library's built-in focus management instead of reimplementing.

Estimated Effort: 2–4 hours for initial hook + pilot modal + test.

Progress Update

- Created `app/hooks/useFocusTrap.ts` (lightweight no-dependency focus trap).
- Updated `app/components/ui/Modal.tsx` to use `useFocusTrap` and a `ref` on the dialog container so focus is moved into the dialog on open, trapped while open, and restored on close.
- Rolled out `dataTest` attributes and test hooks to additional modal usages:
  - `app/components/tenant/DayEventsModal.tsx` → `dataTest="day-events-modal"`
  - `app/components/tenant/forms/RespondSubmissionModal.tsx` → `dataTest="respond-submission-modal"`
  - `app/components/tenant/tabs/EditUserProfileModal.tsx` → `dataTest="edit-user-profile-modal"`
  - `app/components/tenant/tabs/EditRolesModal.tsx` → `dataTest="edit-roles-modal"`
  - `app/components/account/EditMembershipModal.tsx` → `dataTest="edit-membership-modal"`
- Added `data-test` attributes to modal triggers for deterministic testing:
  - `app/components/tenant/tabs/UserProfilesTab.tsx` → Edit buttons: `data-test={`edit-user-profile-trigger-${member.id}`}`
  - `app/components/tenant/tabs/MembershipTab.tsx` → Edit Roles: `data-test={`edit-roles-trigger-${member.id}`}`
  - `app/components/account/MyMembershipsTab.tsx` → Edit buttons: `data-test={`edit-membership-trigger-${membership.id}`}`
- Added Playwright spec `test-suite/ui-tests/modal-focus-trap-more.spec.ts` to exercise EditUserProfile and EditMembership modals (focus trap, Tab cycling, Escape/Cancel close and focus return).
- Added Playwright spec `test-suite/ui-tests/modal-focus-trap-more.spec.ts` to exercise EditUserProfile and EditMembership modals (focus trap, Tab cycling, Escape/Cancel close and focus return). Both tests pass locally (2/2).
- Added a test-only debug page at `/test/open-edit-user-profile` to deterministically open `EditUserProfileModal` when seeded data or permissions make table triggers unavailable in the test environment.
- Lint checks pass (warnings only) after changes. `npm run build` still may be blocked by an unrelated Prisma client file permission error in this environment.

Next actions

- Run the new Playwright spec locally (`npx playwright test test-suite/ui-tests/modal-focus-trap-more.spec.ts`) and iterate if selectors/timeouts are flaky.
- Roll the `dataTest` pattern out to other modal usages (e.g., `DayEventsModal`, `RespondSubmissionModal`) where integration tests are desired.
- Consider adding a small, test-only query param for deterministic opening of more modals if clicking triggers proves flaky in CI.
- Add documentation note in `ui.md` summarizing that modals now include `data-test` attributes and the `Modal` provides focus-trap behavior.

