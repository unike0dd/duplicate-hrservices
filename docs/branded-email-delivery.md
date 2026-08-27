# Branded verification-email delivery gate

The branded templates in `email-templates/` are delivery-ready source assets. They must not be sent until every gate below is complete.

## Required architecture

1. A trusted Firebase Admin runtime generates the one-time verification link.
2. A serverless Cloud Function or Cloud Run service renders the HTML and plain-text templates.
3. A managed transactional email provider sends the message as:
   - Display name: `Gabo Services`
   - From: `no-reply@gabo.services`
4. The link opens:
   `https://unike0dd.github.io/duplicate-hrservices/email-action/`
5. The custom handler validates and applies the Firebase action code.
6. The user continues to the Consumer sign-in page, where email verification and custom claims are checked before redirect.

## Mandatory activation gates

- Verify ownership of `gabo.services` with the selected email provider.
- Publish and validate provider-issued DKIM records.
- Publish an SPF record that authorizes only the selected provider.
- Publish DMARC initially in monitoring mode and review reports before enforcement.
- Store the provider token in Secret Manager; never in GitHub Pages or repository source.
- Require a valid Firebase identity for verification-email requests.
- Apply rate limits and abuse monitoring.
- Preserve Firebase email-enumeration protection.
- Do not log verification URLs, action codes, passwords, or full email addresses.
- Test HTML and plain-text rendering, expired links, reused links, language variants, resend throttling, and delivery failures.

## Deployment boundary

GitHub Pages hosts the login and email-action interface only. It must never generate Admin SDK links or hold email-provider credentials. The serverless sender remains disabled until the domain and provider credentials are approved.
