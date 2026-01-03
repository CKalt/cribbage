# Create Account Workflow Improvements Plan

## Table of Contents

- [ ] [Overview](#overview)
- [ ] [Problem Statement](#problem-statement)
- [ ] [Current Behavior Analysis](#current-behavior-analysis)
- [ ] [Phase 1: Handle Unverified Account Re-signup](#phase-1-handle-unverified-account-re-signup-🤖)
  - [ ] [1.1: Detect "User already exists" error in signup](#step-11-detect-user-already-exists-error-in-signup-🤖)
  - [ ] [1.2: Check user verification status](#step-12-check-user-verification-status-🤖)
  - [ ] [1.3: Resend confirmation code and redirect](#step-13-resend-confirmation-code-and-redirect-🤖)
- [ ] [Phase 2: Improve Confirm Page UX](#phase-2-improve-confirm-page-ux-🤖)
  - [ ] [2.1: Allow email entry on confirm page](#step-21-allow-email-entry-on-confirm-page-🤖)
  - [ ] [2.2: Add "Request New Code" with email input](#step-22-add-request-new-code-with-email-input-🤖)
- [ ] [Phase 3: Handle Forgot Password for Unverified Users](#phase-3-handle-forgot-password-for-unverified-users-🤖)
  - [ ] [3.1: Detect unverified user in forgot password flow](#step-31-detect-unverified-user-in-forgot-password-flow-🤖)
  - [ ] [3.2: Redirect to confirmation flow instead](#step-32-redirect-to-confirmation-flow-instead-🤖)
- [ ] [Phase 4: Testing](#phase-4-testing-👤)
  - [ ] [4.1: Test interrupted signup recovery](#step-41-test-interrupted-signup-recovery-👤)
  - [ ] [4.2: Test forgot password for unverified user](#step-42-test-forgot-password-for-unverified-user-👤)
  - [ ] [4.3: Test normal workflows still function](#step-43-test-normal-workflows-still-function-👤)
- [ ] [Phase 5: Commit and Deploy](#phase-5-commit-and-deploy-🤖👤)

---

## Overview

This plan improves the account creation workflow to handle edge cases where users don't complete the email verification step. The goal is to make the signup process robust so users can always recover from interrupted flows.

[Back to TOC](#table-of-contents)

---

## Problem Statement

**Scenario 1: Interrupted Signup**
1. User visits site, clicks "Create Account"
2. User enters email and password, clicks "Sign Up"
3. Cognito creates unverified account and sends verification code
4. App closes/crashes before user enters the code
5. User returns later and tries to sign up again
6. **Current Problem:** Gets error "An account with the given email already exists" - user is stuck

**Scenario 2: Forgot Password on Unverified Account**
1. User has unverified account (from interrupted signup)
2. User clicks "Forgot Password" thinking they already have an account
3. **Current Problem:** Cognito may not allow password reset for unverified users

**Desired Behavior:**
- When signing up with email that has unverified account, automatically resend code and redirect to confirm page
- User should be able to enter email on confirm page directly (without going through signup again)
- Forgot password should detect unverified accounts and guide user to complete signup first

[Back to TOC](#table-of-contents)

---

## Current Behavior Analysis

### Files Involved:
- `app/signup/page.js` - Creates account with `userPool.signUp()`
- `app/confirm/page.js` - Confirms account with `cognitoUser.confirmRegistration()`, has "Resend Code" button
- `app/forgot-password/page.js` - Initiates password reset with `ForgotPasswordCommand`
- `app/login/page.js` - Authenticates user

### Current Signup Flow:
1. `/signup` → `userPool.signUp()` → redirect to `/confirm?email=...`
2. `/confirm` → enter code → `cognitoUser.confirmRegistration()` → redirect to `/login`

### Current Limitations:
- If signup fails with "User already exists", no recovery path offered
- `/confirm` page requires email in URL query param - can't access directly
- No detection of unverified vs verified accounts

[Back to TOC](#table-of-contents)

---

## Phase 1: Handle Unverified Account Re-signup 🤖

### Step 1.1: Detect "User already exists" error in signup 🤖

**File:** `app/signup/page.js`

Modify the signup error handler to detect when a user already exists:

```javascript
userPool.signUp(email, password, attributeList, null, (err, result) => {
  if (err) {
    if (err.code === 'UsernameExistsException') {
      // User exists - check if they need to verify
      handleExistingUser(email);
      return;
    }
    setError(err.message || JSON.stringify(err));
    return;
  }
  // ... success handling
});
```

[Back to TOC](#table-of-contents)

---

### Step 1.2: Check user verification status 🤖

**File:** `app/signup/page.js`

Add function to attempt resending confirmation code (which only works for unverified users):

```javascript
const handleExistingUser = async (email) => {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  cognitoUser.resendConfirmationCode((err, result) => {
    if (err) {
      // If resend fails, user is likely already confirmed
      // Show appropriate message directing to login or forgot password
      if (err.code === 'InvalidParameterException' ||
          err.message?.includes('confirmed')) {
        setError('An account with this email already exists. Please log in or use "Forgot Password".');
      } else {
        setError(err.message || 'Account exists. Please try logging in.');
      }
      return;
    }
    // Successfully resent code - user was unverified
    router.push(`/confirm?email=${encodeURIComponent(email)}`);
  });
};
```

[Back to TOC](#table-of-contents)

---

### Step 1.3: Resend confirmation code and redirect 🤖

**File:** `app/signup/page.js`

Add import for CognitoUser and update the error handling to show informative messages:

- If resend succeeds: "We found your account! A new verification code has been sent."
- If resend fails (already verified): "Account exists. Please log in or use Forgot Password."

[Back to TOC](#table-of-contents)

---

## Phase 2: Improve Confirm Page UX 🤖

### Step 2.1: Allow email entry on confirm page 🤖

**File:** `app/confirm/page.js`

Currently the confirm page requires `?email=` in URL. Modify to:
- Show email input if no email in URL
- Allow user to request a code by entering their email
- Pre-fill email if provided in URL

[Back to TOC](#table-of-contents)

---

### Step 2.2: Add "Request New Code" with email input 🤖

**File:** `app/confirm/page.js`

Add a mode where user can:
1. Enter their email
2. Click "Send Code" to receive a new verification code
3. Then enter the code to confirm

This allows users to navigate directly to `/confirm` without going through signup.

[Back to TOC](#table-of-contents)

---

## Phase 3: Handle Forgot Password for Unverified Users 🤖

### Step 3.1: Detect unverified user in forgot password flow 🤖

**File:** `app/forgot-password/page.js`

When `ForgotPasswordCommand` fails for an unverified user, Cognito returns specific error. Detect this:

```javascript
try {
  await cognitoClient.send(command);
  setCodeSent(true);
} catch (err) {
  if (err.code === 'InvalidParameterException' &&
      err.message?.includes('not confirmed')) {
    // User exists but not verified
    handleUnverifiedUser(email);
    return;
  }
  setError(err.message);
}
```

[Back to TOC](#table-of-contents)

---

### Step 3.2: Redirect to confirmation flow instead 🤖

**File:** `app/forgot-password/page.js`

For unverified users:
1. Show message: "Your account hasn't been verified yet. We'll send you a new verification code."
2. Resend confirmation code
3. Redirect to `/confirm?email=...`

[Back to TOC](#table-of-contents)

---

## Phase 4: Testing 👤

### Step 4.1: Test interrupted signup recovery 👤

1. Create account with new email, don't enter verification code
2. Close browser/app
3. Return and try to sign up with same email
4. **Expected:** Should receive new code and be redirected to confirm page

[Back to TOC](#table-of-contents)

---

### Step 4.2: Test forgot password for unverified user 👤

1. Have an unverified account
2. Go to "Forgot Password"
3. Enter the unverified email
4. **Expected:** Should be redirected to confirm page with message about completing verification first

[Back to TOC](#table-of-contents)

---

### Step 4.3: Test normal workflows still function 👤

1. Normal signup → confirm → login works
2. Normal forgot password → reset works for verified users
3. Login works for verified users

[Back to TOC](#table-of-contents)

---

## Phase 5: Commit and Deploy 🤖👤

1. 🤖 Git add and commit changes
2. 👤 Review and approve
3. 🤖 Push and deploy to EC2

[Back to TOC](#table-of-contents)
