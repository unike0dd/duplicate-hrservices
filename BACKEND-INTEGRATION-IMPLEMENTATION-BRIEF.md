# Backend Integration Implementation Brief

**Status:** Mandatory temporary implementation control document  
**Applies to:** `consumer`, `freelance`, `independentHR`, `hrpro`, `smb`, and `duplicate-hrservices`  
**Purpose:** Connect every role-specific frontend through one trusted, server-authoritative recruiting and onboarding platform without direct browser-to-repository, browser-to-database, or cross-tenant access.

> [!CAUTION]
> **MANDATORY DELETION COMMAND:** This file is temporary. As soon as the backend is connected, security-tested, working as instructed, deployed to the approved environment, and all completion gates in this document have passed, the implementing team **MUST delete `BACKEND-INTEGRATION-IMPLEMENTATION-BRIEF.md` from every repository listed above in the same release cycle**. The deletion must be committed, reviewed, merged, and verified on every default branch. This file must not remain in production repositories after completion.

## 1. Executive finding

The connection is technically feasible and should be implemented as one shared backend platform. The repositories must remain separate presentation surfaces for their assigned users; they must not exchange data directly or contain shared secrets.

The current `consumer` repository already supplies a strong frontend prototype for:

- Professional profile: summary, skills, proficiency, evidence, experience, education, projects, interests, name, and picture.
- Documents: résumé upload, profile-generated résumé, PDF preview, and section ordering.
- Opportunities: job listings, job descriptions, saved jobs, tracking, prepared applications, résumé attachment, and matches.
- Candidate workflow: tasks, applications, statuses, interviews, completion, archive, focus, and rescheduling.
- Privacy: recruiter visibility for résumé, picture, location, contact information, and individual contact fields.
- Responsive and accessible desktop, tablet, and mobile presentation.

These functions are currently prototype-only. Candidate profiles and documents use browser IndexedDB; settings and job workflow use browser `localStorage`; jobs are embedded sample JavaScript records. There is no trusted server persistence, authoritative recruiter search, real application delivery, server-enforced consent, tenant isolation, or cross-repository synchronization.

## 2. Non-negotiable architecture

All clients must connect only to one authenticated backend API. The backend owns every authorization, privacy, workflow, and data-isolation decision.

```text
consumer ───────────────┐
freelance ──────────────┤
independentHR ──────────┤
hrpro ──────────────────┼──> Trusted Backend API ──> Authorized services and data
smb ────────────────────┤
duplicate-hrservices ───┘
```

Required rules:

1. No repository may call another repository as an integration mechanism.
2. No browser may connect directly to a database, privileged storage bucket, internal service, or administrative endpoint.
3. No API key, service-account credential, database credential, signing secret, payment secret, or privileged configuration may be shipped to the browser.
4. Browser code must never be the authority for identity, tenant, role, permissions, consent, pricing entitlement, application state, hiring state, or onboarding state.
5. Every backend request must evaluate authenticated identity, immutable account assignment, tenant context, membership, role, permission, entitlement, resource ownership, field scope, workflow state, purpose, and current consent.
6. Authorization must be deny-by-default and server-authoritative. UI hiding is not authorization.
7. A tenant user must never search, read, infer, export, cache, or mutate another tenant's private records.
8. Cloudflare or another edge may provide TLS, WAF, DDoS protection, bot control, and rate limiting, but it must never replace application authorization.

The browser will necessarily know the public API origin and send authenticated requests to it. "No browser exposure" means that secrets, internal topology, raw databases, unauthorized records, hidden PII, privileged policies, and cross-tenant data are never exposed—not that the public API address is invisible.

## 3. Identity and account authorization

`duplicate-hrservices` is the login and registration entry surface. It must authenticate users through the selected identity provider and exchange the authenticated identity with the backend. It must not decide the destination dashboard from a query parameter alone.

Backend requirements:

- One email address belongs to one platform account as previously required.
- Each account receives an immutable platform `user_id`/UID.
- The server maintains the authoritative UID-to-account assignment.
- The server returns only the dashboard/account type assigned to that UID.
- A username may be an alternate sign-in identifier, but it must resolve server-side and must not reveal the associated email.
- Enable email-enumeration protection and mask email addresses in the interface.
- Use short-lived sessions, secure cookies where applicable, CSRF protection, reauthentication for sensitive changes, and phishing-resistant MFA for privileged roles.
- Reject dashboard/account parameters that conflict with the server-side account assignment.
- Log successful and rejected account-routing decisions without recording secrets or unnecessary PII.

## 4. Tenant and authorization model

Define and freeze these minimum identifiers before business integration:

- `user_id`: immutable human or service principal.
- `tenant_id`: immutable organization boundary for employer/recruiter workspaces.
- `membership_id`: user membership in one tenant.
- `candidate_id`: stable consumer/talent identity, separate from tenant employee records.
- `job_id`, `match_id`, `invitation_id`, `application_id`, `interview_id`, `offer_id`, `onboarding_id`, and `consent_id`.

Use RBAC plus attribute, relationship, resource, field, and workflow-state checks. Roles never grant global cross-tenant access. A platform owner or support identity must not become an unrestricted SaaS superuser. Support access requires separate identities, ticket binding, just-in-time elevation, short expiry, MFA, purpose limitation, and audit evidence.

Every query must be tenant-filtered and authorization-filtered at the server and persistence layers. Enforce isolation across APIs, database queries, search indexes, files, caches, queues, background jobs, exports, analytics, logs, and support tools.

## 5. Candidate privacy and recruiter visibility

Recruiters may see what a candidate offers only after the candidate enables discoverability and only within the selected visibility scope.

Recommended visibility stages:

### A. Discoverable professional overview

- Professional headline and summary.
- Skills, proficiency, evidence type, experience summary, education, certifications, projects, languages, work arrangement, general location, availability, and candidate preferences.
- Anonymous or minimally identified presentation when appropriate.
- No direct contact information.

### B. Candidate-authorized profile

- Generated résumé, complete professional history, profile picture, certification links, portfolio links, and individually approved fields.
- Access granted through an invitation, application, or explicit candidate permission.
- Permission must have purpose, scope, tenant, recipient, issue time, expiry, and revocation state.

### C. Hiring and onboarding disclosure

- Contact and hiring information only after the workflow reaches an authorized stage.
- Government IDs, full address, background checks, banking, tax, payroll, medical, and other sensitive records must remain segregated and field-permissioned.
- Recruiters must not automatically inherit HR, onboarding, payroll, or administrative access.

Candidate controls must support:

- Accept, decline, or request more information.
- Invite-to-apply and request-introduction workflows.
- Allow selected fields without allowing all fields.
- Tenant-specific permission, expiry, withdrawal, and blocking.
- Visibility OFF by default for contact details and sensitive information.
- A candidate-facing access history showing who accessed which category, for what purpose, and when.

The backend—not `localStorage`—must enforce every toggle. All authorized disclosures must be audited.

## 6. Required backend services

Implement bounded services or well-separated modules behind one gateway:

1. **Identity and session service:** authentication exchange, account routing, session management, MFA state, and security events.
2. **Tenant and membership service:** tenant lifecycle, membership, roles, entitlements, and deny-by-default policies.
3. **Candidate profile service:** versioned professional profiles, evidence, preferences, visibility, and publication state.
4. **Document service:** secure upload, malware scanning, file validation, encrypted storage, generated résumé, authorized download, expiry, and deletion.
5. **Job service:** tenant-owned job creation, approval, publication, closure, requirements, compensation, location, and visibility.
6. **Search and matching service:** authorized candidate/job indexes, transparent scoring, exclusions, consent filtering, and result explanations.
7. **Invitation and application service:** invitations, introductions, applications, withdrawals, status transitions, communication permissions, and receipts.
8. **Recruiting workflow service:** shortlist, pipeline, interview coordination, evaluation, decision, separation of duties, and candidate notifications.
9. **Offer and hiring service:** approvals, offer state, acceptance, rejection, expiry, and immutable decision history.
10. **Onboarding service:** post-acceptance handoff, required tasks, documents, access scopes, and completion state.
11. **Notification service:** privacy-safe in-app/email events with idempotency, preference enforcement, and no sensitive data in message URLs.
12. **Audit and compliance service:** append-only security, authorization, consent, workflow, export, and support-access evidence.

## 7. Search and matching instructions

Begin with deterministic and explainable matching. Compare only authorized fields:

- Required and preferred skills.
- Candidate proficiency and evidence.
- Relevant experience.
- Education, licenses, and certifications.
- Language.
- General location and work arrangement.
- Availability and candidate preferences.
- Compensation compatibility.
- Job-specific eligibility questions that are lawful and necessary.

Return a score explanation such as: `87% match — 8 of 9 required skills, relevant operations experience, remote availability, and matching language requirements.`

Do not use protected characteristics or proxies for protected characteristics. Do not allow AI or ML to make autonomous hiring decisions. AI may recommend, summarize, or rank only with human accountability, bias testing, explainability, override, appeal, monitoring, and auditability.

Search indexes must store only the minimum discoverable projection, be tenant/purpose filtered, exclude private fields, support consent revocation, and delete or update stale index entries promptly.

## 8. Authoritative workflow

The required lifecycle is:

1. An authorized tenant user creates and publishes a job.
2. The backend stores the job under its immutable `tenant_id`.
3. Matching evaluates eligible jobs and consented candidate projections.
4. The consumer receives a match or invitation.
5. The recruiter sees only an authorized professional overview.
6. The recruiter requests an introduction or invites the candidate to apply.
7. The candidate accepts, declines, requests information, applies, or grants selected fields.
8. The application appears in both candidate and authorized tenant pipelines.
9. Server-controlled states synchronize interviews, evaluations, decisions, and notifications.
10. Offer creation and approval enforce separation of duties.
11. Acceptance creates an onboarding handoff; it does not broaden every recruiter's permissions.
12. Onboarding information is disclosed only to specifically authorized personnel.
13. Every state transition creates an atomic audit event and an idempotent response receipt.

State transitions must validate the current state and fresh authorization. Retries must bind tenant, actor, action, resource/aggregate, request fingerprint, and expected version. Persist the aggregate mutation, audit event, and receipt atomically so partial mutations cannot occur.

## 9. API and data-contract instructions

- Publish versioned OpenAPI contracts before frontend integration.
- Use stable identifiers; never place sensitive PII in URLs.
- Define standard error envelopes without internal stack traces.
- Require request IDs and actor/action/fingerprint-bound idempotency keys for commands.
- Use optimistic concurrency or equivalent expected-version protection.
- Validate request bodies using allowlists, type limits, length limits, file limits, and state-specific schemas.
- Apply pagination, rate limits, timeouts, size limits, and abuse controls.
- Return field-filtered DTOs; never serialize full persistence objects.
- Define retention, deletion, legal-hold, correction, export, and consent-revocation behavior for each data class.
- Maintain a shared workflow/state catalog so every repository uses identical names and permitted transitions.

## 10. Browser-data migration

The current browser stores must not be treated as trusted records. Implement a one-time, user-initiated migration:

1. Authenticate and reauthorize the consumer.
2. Read only recognized keys and IndexedDB object stores.
3. Show the candidate exactly what will be imported.
4. Validate, normalize, scan files, reject unsafe content, and assign server identifiers.
5. Upload through authenticated, short-lived, purpose-bound endpoints.
6. Write an import receipt and show successful/failed items.
7. Compare server results with the approved import set.
8. After verified success and an appropriate recovery window, ask the candidate to remove the old browser copy.
9. Never silently import sample jobs, seeded records, or prototype statuses as production truth.

## 11. Security and privacy controls

- Separate DEV, STAGING, BETA, and PRODUCTION projects, credentials, data, origins, and audit streams.
- Encrypt data in transit and at rest; manage secrets in an approved secret manager.
- Protect file uploads through MIME/content verification, malware scanning, quarantine, size limits, random object names, and authorized signed access.
- Enforce secure headers, CSP, CORS allowlists, CSRF defenses, input validation, output encoding, session hardening, WAF, DDoS protection, and rate limiting.
- Do not record sensitive PII, tokens, résumés, contact details, or authorization headers in logs or telemetry.
- Create tamper-resistant audit evidence with controlled access and retention.
- Implement backup, tested restoration, disaster recovery, rollback, key rotation, incident response, privacy requests, and breach-response procedures.
- Maintain dependency, secret, SAST, DAST, IaC, container, and software-supply-chain scanning.
- Add a backend feature kill switch that can immediately disable candidate search, matching, invitations, disclosure, applications, or onboarding independently without redeploying browsers.

## 12. Frontend conversion by repository

### `duplicate-hrservices`

- Authenticate and register accounts.
- Obtain server-authoritative account destination.
- Remove prototype routing authority from URL parameters and client storage.
- Support secure sign-out, recovery, verification, enumeration protection, and MFA entry.

### `consumer`

- Replace IndexedDB/localStorage as production authority with authenticated APIs.
- Retain offline/browser storage only as an explicitly designed cache, encrypted where appropriate, revocable, expiry-bound, and never authoritative.
- Connect profile, documents, settings, matching, invitations, applications, interviews, tasks, offers, and onboarding status.
- Display recruiter-access history and consent management.

### `freelance`, `independentHR`, `hrpro`, and `smb`

- Obtain the authenticated tenant and permissions from the backend.
- Connect tenant-scoped jobs, authorized candidate search, matches, invitations, pipelines, interviews, evaluations, offers, hiring, and onboarding.
- Render only server-returned field-filtered views.
- Never allow a role or repository switch to alter server authorization.

## 13. Delivery sequence

Follow the established Phase 0–10 / M1–M11 plan and the DEV → STAGING → BETA overlay:

1. Inventory, data classification, threat model, abuse cases, RTM, and architecture decision records.
2. Environment separation, trusted deployment foundation, secrets, telemetry, recovery, and CI security gates.
3. Identity, immutable UID-to-account authorization, tenant, membership, role, and entitlement model.
4. Candidate profile, documents, consent, recruiter visibility, access history, and privacy workflows.
5. Jobs, search, matching, invitations, and applications.
6. Recruiting pipeline, interviews, evaluations, offers, hiring, and onboarding handoff.
7. Notifications, audit evidence, exports, retention, deletion, and privacy requests.
8. Browser-data migration and frontend integration repository by repository.
9. Automated positive, negative, abuse, concurrency, replay, and cross-tenant tests.
10. BUILD → SECURE → TEST → STAGING gates, UAT, authorized penetration testing, remediation, retesting, load/failure/recovery testing, and BETA approval.

Do not connect real candidate or employer PII before the trusted backend, tenant-isolation proof, privacy governance, environment separation, monitoring, and recovery controls pass their gates.

## 14. Mandatory tests and stop-ship conditions

Test at minimum:

- Valid and invalid authentication, expired sessions, revocation, account mismatch, and MFA requirements.
- Same-tenant allowed access and cross-tenant read/write/search/export/file denial.
- Candidate visibility OFF, partial consent, expired consent, revoked consent, tenant-specific consent, and blocked organization.
- Search-index revocation and stale-record deletion.
- Unauthorized résumé/document access and signed-link expiry.
- Workflow state tampering, duplicate commands, altered replays, revoked replays, race conditions, and partial-failure rollback.
- Privilege escalation, insecure direct-object reference, mass assignment, injection, XSS, CSRF, CORS, rate-limit, and enumeration tests.
- Backup restoration, regional/service failure, rollback, incident kill switch, and audit completeness.

Stop release for any cross-tenant exposure, authentication or authorization bypass, credential leakage, consent bypass, hidden-PII exposure, unsafe file access, incomplete audit/mutation, critical restore failure, or unresolved critical/high security finding.


## 14A. Staff RBAC, reauthentication, approval, lifecycle, notification, and audit

Apply this section to `duplicate-hrservices`, `smb`, and `hrpro`. The browser controls are interface prototypes only; the backend is the sole authority.

1. Every staff account has a master lifecycle state: `invited`, `active`, `suspended`, `deactivated`, `deletion_pending`, or `deleted`. Provide an individual Active/Deactivated toggle and, where authorized, a bulk staff activation control. Bulk actions require step-up reauthentication, scope preview, owner confirmation, rate limiting, idempotency, and complete per-account results.
2. Supervisors and lower staff use versioned preset RBAC templates. Each permission is shown as an ON/OFF toggle, but every change is submitted to and validated by the backend. A client-side toggle never grants access.
3. Management Admin, VP, IT SuperUser, security-administration, billing-administration, payroll-administration, and equivalent privileged roles require manual assignment by the SMB Owner. Do not provide an unrestricted global superuser. IT SuperUser access must be tenant-scoped, just-in-time where possible, purpose-bound, MFA-protected, short-lived for elevation, and independently audited.
4. The approver must reauthenticate with the approver's own account using phishing-resistant MFA/passkey when available, or current password plus MFA. Never request, store, transmit, display, log, or email the SMB Owner's password. Never allow one person to enter or share another person's password.
5. Email identifies the authenticated account but does not authorize the action. The backend binds the fresh reauthentication result to the authenticated session, actor UID, tenant, requested change, target user, nonce, expiry, and expected record version.
6. Promotions, senior-role assignments, privilege increases, and sensitive department transfers require owner-final approval. Management may submit or preliminarily approve a request but cannot make the ultimate approval effective. The requester must not approve their own promotion or privilege increase.
7. Use a two-stage state machine: `draft/requested → management_reviewed (optional) → owner_approved → applied`, with `rejected`, `cancelled`, and `expired` terminal paths. Revalidate separation of duties, actor authority, target eligibility, subscription entitlement, and record version when applying.
8. After activation, deactivation, role/permission change, promotion request, approval, rejection, or deletion request, send privacy-safe notifications to the affected staff member and SMB Owner. Do not include passwords, tokens, sensitive RBAC detail, or privileged action links in email. Email delivery failure must not roll back a valid authorization decision; record it and retry safely.
9. Write an append-only audit event for every requested, approved, rejected, applied, failed, or reversed change: tenant, actor, target, action, before/after permission-set identifiers, reason, approval chain, authentication assurance level, timestamp, request ID, IP/risk metadata as lawful, result, and notification delivery status. Never record credentials or authentication secrets.
10. Every end user record must expose Deactivate/Activate and a separately protected Delete action according to authorization. Deactivation must immediately revoke sessions, refresh tokens, active elevation, API tokens, and future access without destroying records.
11. Delete opens a modal that names the target, explains impact, recommends deactivation when appropriate, and requires an explicit confirmation such as typing `DELETE` plus a final Delete button. Permanent deletion requires fresh reauthentication, authorization, owner approval when applicable, dependency and legal-retention checks, delayed/recoverable execution where lawful, audit evidence, and user notification.
12. Authorization changes must invalidate affected sessions and permission caches promptly. Test stale tokens, concurrent approvals, replay, self-approval, horizontal/vertical escalation, bulk-action partial failure, owner lockout prevention, last-owner deletion, notification failure, and audit completeness.
13. `hrpro` receives only the staff-management capabilities allowed by its Premium entitlement. `smb` receives the complete tenant-scoped feature set. `duplicate-hrservices` performs secure sign-in and step-up reauthentication but never decides RBAC or approval outcomes.
14. UI wording must distinguish Authentication (proving identity), Authorization (permission to act), Approval (governance decision), Deactivation (reversible access stop), and Deletion (controlled data-lifecycle action).

## 15. Definition of backend completion

The backend is not "connected and working" until all of the following are true:

- All six repositories use authenticated, versioned backend APIs for their intended production workflows.
- Login routing is server-authoritative and strict UID-to-account authorization is proven.
- Candidate profiles, visibility, search projections, jobs, matches, invitations, applications, interviews, offers, hiring, and onboarding synchronize correctly.
- Tenant, role, resource, field, purpose, workflow-state, and consent checks are enforced on every relevant request.
- Browser stores are no longer production authorities.
- DEV, STAGING, BETA, and PRODUCTION are separated and controlled.
- Required automated tests pass, including cross-tenant negative tests.
- Security review, privacy review, UAT, authorized penetration test, remediation, and retest are accepted.
- Monitoring, alerts, audit evidence, backup, restoration, rollback, incident response, and kill switches are tested.
- API contracts, schemas, state catalog, runbooks, RTM evidence, and operating ownership are stored in permanent controlled documentation.
- The release is explicitly approved according to the established governance gates.

## 16. Mandatory removal procedure for this file

Immediately after Section 15 is fully satisfied:

1. Preserve required permanent architecture, API, security, privacy, operational, and audit evidence in the approved controlled documentation system. Do not use this temporary file as permanent evidence.
2. Delete this exact file from every repository:
   - `consumer/BACKEND-INTEGRATION-IMPLEMENTATION-BRIEF.md`
   - `freelance/BACKEND-INTEGRATION-IMPLEMENTATION-BRIEF.md`
   - `independentHR/BACKEND-INTEGRATION-IMPLEMENTATION-BRIEF.md`
   - `hrpro/BACKEND-INTEGRATION-IMPLEMENTATION-BRIEF.md`
   - `smb/BACKEND-INTEGRATION-IMPLEMENTATION-BRIEF.md`
   - `duplicate-hrservices/BACKEND-INTEGRATION-IMPLEMENTATION-BRIEF.md`
3. Use a reviewed deletion change; do not rewrite history or use a destructive repository-wide command.
4. Merge the deletion into every default branch in the same release cycle.
5. Search every default branch and published artifact to confirm the filename and unique deletion warning are absent.
6. Record the six deletion commit references in the release evidence.

**Final command to the implementing team:** Once the backend meets every completion criterion above, **DELETE THIS FILE FROM ALL SIX REPOSITORIES IMMEDIATELY, REVIEW AND MERGE THE DELETIONS, AND VERIFY THAT NO DEFAULT BRANCH OR DEPLOYED ARTIFACT RETAINS IT.**

