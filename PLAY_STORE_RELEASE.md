# Athzy Google Play Release

The project is configured to produce an Android App Bundle (`.aab`) from the `production` EAS profile. Do not submit until every item below is complete.

## External Services

1. Deploy `backend` to a public HTTPS domain.
2. Use managed PostgreSQL and run `npx prisma migrate deploy` during deployment.
3. Configure Clerk Native API, the Android package `com.athzy.app`, and production authentication methods.
4. Create the production Stream Chat application, channel types, permissions, and signed webhook.
5. Configure Expo push credentials for the EAS project.
6. Create a private S3 bucket in the same region as the backend.
7. Put CloudFront in front of S3 and set `AWS_S3_PUBLIC_URL` to that HTTPS domain.
8. Give the backend an IAM role limited to `s3:PutObject` for `avatar/*` and `community/*` keys. Do not embed AWS keys in the app.
9. Configure S3 CORS to allow `PUT` with the `Content-Type` header. Native apps do not require a browser origin, but web builds do.

Backend production variables are documented in `backend/.env.example`. Frontend build variables are documented in `.env.example`.

Create EAS variables for the production environment instead of committing `.env`:

```sh
eas env:create --environment production --name EXPO_PUBLIC_API_BASE_URL --value https://new.athzy.in/api/v1 --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value pk_live_YOUR_KEY --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_PRIVACY_POLICY_URL --value https://athzy.in/privacy --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_ACCOUNT_DELETION_URL --value https://athzy.in/delete-account --visibility plaintext
```

`EXPO_PUBLIC_*` values are included in the app bundle. Never put Clerk secret keys, the Stream API secret, webhook secrets, or AWS credentials in them.

## EAS and Signing

1. Confirm `com.athzy.app` is available and final. It cannot be changed after the first Play upload.
2. Run `eas login` and `eas init` from `frontend`. Commit the generated EAS project ID in app configuration.
3. Create a Google Play Developer account and an app using package `com.athzy.app`.
4. Run `eas credentials --platform android` and let EAS create and securely store the upload keystore.
5. Build an installable preview APK:

```sh
eas build --platform android --profile preview
```

1. Test login, account deletion, location denial/grant, events, venue booking, booking history, image uploads, offline errors, and deep links on low- and high-resolution Android devices.
2. Build the Play bundle:

```sh
eas build --platform android --profile production
```

8. Upload the first `.aab` to Play Console internal testing. EAS Submit is configured to create a draft internal release:

```sh
eas submit --platform android --profile production
```

## Play Console

- App category: Sports
- Ads: No, unless advertising is added later
- App access: provide review credentials if content requires login
- Content rating: complete the questionnaire truthfully
- Target audience: do not select children unless child-safety requirements are implemented
- Privacy policy: publish a reviewed version of `PRIVACY_POLICY_TEMPLATE.md`
- Account deletion: publish a web deletion-request page and retain the in-app delete action
- Data safety: declare email/name, approximate location/city, user content/images, bookings, app activity, and diagnostics as applicable
- Store assets: app icon 512x512, feature graphic 1024x500, phone screenshots, short description, full description, and support email

## Release Gates

- Replace all placeholder domains and legal fields.
- Verify Google Play's current target API requirement. Upgrade Expo SDK before release if SDK 54 no longer targets an accepted API level.
- Use a real production email provider for password reset and support.
- Verify S3 object deletion is included in the account-deletion process before users can upload images.
- Add payment-provider privacy and financial-data declarations only when payments are implemented.
- Keep Play App Signing enabled and back up access to the Expo and Google accounts.
