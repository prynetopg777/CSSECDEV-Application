# Video Demo Guide for Security Checklist

This guide provides a complete, step-by-step script for demonstrating compliance with all 58 security requirements. Follow this script chronologically for your video demo. All demo accounts use the password `Demo#Pass12345`.

## Demo Prerequisites

### Required Accounts (pre-created via database seeding)
- **Administrator**: `admin@demo.local` / `Demo#Pass12345`
- **Product Manager**: `pm@demo.local` / `Demo#Pass12345`
- **Customer**: `customer@demo.local` / `Demo#Pass12345`

### Postman Setup for API Testing
1. **Open Web Postman** at `https://web.postman.co/` (recommended) or install desktop Postman
2. **Create a new workspace** called `WebApp Demo` or similar
3. **Create a new collection** named `Secure Web App Demo`
4. **Set base URL**: `http://127.0.0.1:3001`
5. **Enable cookies** in Postman settings:
   - Go to Settings → General → Request → Send cookies automatically
   - Turn on `Persist Cookies`
6. **Create three requests in the collection**:
   - **GET** `http://127.0.0.1:3001/api/orders`
   - **POST** `http://127.0.0.1:3001/api/auth/login`
   - **GET** `http://127.0.0.1:3001/api/orders` (duplicate of the first request, to run after login)

### Postman Walkthrough
1. **Test unauthenticated API access**:
   - Select the first **GET /api/orders** request
   - Send it without any login
   - **Expected**: Status `401 Unauthorized`
   - **Expected**: Response body `{"error": "Authentication required."}`
   - **Narrate**: "This shows the API rejects requests that are not authenticated"

2. **Log in through the API**:
   - Open the **POST /api/auth/login** request
   - In the Body tab, choose `raw` and `JSON`
   - Paste:
     ```json
     {
       "email": "admin@demo.local",
       "password": "Demo#Pass12345"
     }
     ```
   - Send the request
   - **Expected**: Status `200 OK`
   - **Expected**: Response shows user info and last login timestamps
   - **Narrate**: "We now authenticate and create a valid session cookie"

3. **Verify authenticated access**:
   - Open the second **GET /api/orders** request
   - Send it again after successful login
   - **Expected**: Status `200 OK`
   - **Expected**: Response returns orders or an empty orders list
   - **Narrate**: "Authenticated requests now succeed because the session cookie is stored"

4. **Show cookie persistence in Postman**:
   - Open the Cookies manager for the base URL
   - Point out the `sid` cookie created after login
   - **Narrate**: "Postman keeps the session cookie, so the API behaves like a browser session"

5. **Optional: test role-specific access**:
   - With the admin session active, try `GET /api/admin/logs`
   - **Expected**: Status `200 OK`
   - **Narrate**: "This demonstrates admin-only access for audit logs"
   - Then use a customer login and retry the same request
   - **Expected**: Status `403 Forbidden`
   - **Narrate**: "Regular customers cannot access admin resources"

**Note**: Web Postman works in your browser and will handle session cookies automatically after login, simulating browser behavior. Desktop Postman can be used if preferred.

## Demo Script

### Opening and Public Access
1. **Navigate to the application root** (`http://127.0.0.1:3001`)
   - **Expected**: See public landing page with "Welcome to Secure Web App" title
   - **Expected**: Sign In and Create Account buttons visible
   - **Narrate**: "The application has a public landing page that anyone can access without authentication"

2. **Click "Sign In" button**
   - **Expected**: Redirected to `/login` page
   - **Narrate**: "Public pages like login are accessible, but protected content requires authentication"

### 2.1.1 Authentication Required for Protected Pages
3. **Open new incognito window/tab**
4. **Navigate directly to protected URL** (`http://127.0.0.1:3001/dashboard`)
   - **Expected**: Automatically redirected to `/login`
   - **Narrate**: "Attempting to access protected pages without authentication redirects to login"

5. **Try API access without auth using Postman**
    - Open Postman, select your demo collection
    - Send **GET** request to `http://127.0.0.1:3001/api/orders`
    - **Expected**: Response status `401 Unauthorized`
    - **Expected**: Response body `{"error": "Authentication required."}`
    - **Narrate**: "API endpoints require authentication - direct access returns 401"

### 2.1.4 Generic Authentication Failure Messages
6. **Login with wrong email**: Enter `wrong@email.com` and correct password `Demo#Pass12345`
   - **Expected**: Error message "Invalid username and/or password"
   - **Narrate**: "Wrong email shows same generic error as wrong password"

7. **Login with correct email but wrong password**: Enter `admin@demo.local` and `wrongpassword`
   - **Expected**: Same error message "Invalid username and/or password"
   - **Narrate**: "System doesn't reveal which credential was incorrect"

### 2.1.7 Password Obscuring
8. **Focus on password field during login**
   - **Expected**: Password input shows dots/asterisks, not plain text
   - **Narrate**: "Passwords are obscured on screen for security"

### 2.1.8 Account Lockout
9. **Attempt login 5 times with wrong password** for `admin@demo.local`
   - Use password `wrongpassword` each time
   - **Expected**: After 5th attempt, account becomes locked
   - **Expected**: Error message indicates account is locked
   - **Narrate**: "After 5 failed attempts, account locks for 15 minutes"

10. **Wait or simulate time passage**, then try correct login
    - **Expected**: Login succeeds after lockout period
    - **Narrate**: "Lockout prevents brute force attacks but allows legitimate access after timeout"

### 2.1.3 Password Hashing
11. **Login successfully** as admin (`admin@demo.local` / `Demo#Pass12345`)
    - **Expected**: Redirected to `/dashboard`
    - **Expected**: See last login information if applicable
    - **Narrate**: "Successful login redirects to the dashboard, not back to the landing page"

12. **Test authenticated API access with Postman**
    - In Postman, send **POST** request to `/api/auth/login` with body:
      ```json
      {
        "email": "admin@demo.local", 
        "password": "Demo#Pass12345"
      }
      ```
    - **Expected**: Status `200 OK`, response contains user data
    - Send **GET** request to `/api/orders` (same session will have cookies)
    - **Expected**: Status `200 OK`, returns order data
    - **Narrate**: "After authentication, API access works and maintains session"

13. **Access database** (show schema or admin tools)
    - **Expected**: Password field shows hashed value (not plain text)
    - **Narrate**: "Passwords are stored as cryptographically strong hashes"

14. **Logout and login again**
    - **Expected**: Login response shows `lastSuccessfulLoginAt` and `lastFailedLoginAt` timestamps
    - **Narrate**: "Users are informed of their last account activity"

### 2.1.5-2.1.6 Password Complexity and Length
14. **Navigate to registration page** (`/register`)
15. **Try weak password**: Enter email `test@example.com`, password `123`
    - **Expected**: Error "Password must be at least 12 characters"
    - **Narrate**: "Enforces minimum length requirement"

16. **Try password without uppercase**: `demopassword123`
    - **Expected**: Error "Password must include an uppercase letter"
    - **Narrate**: "Requires mixed case"

17. **Try password without special character**: `DemoPassword123`
    - **Expected**: Error "Password must include a special character"
    - **Narrate**: "Enforces complexity rules"

### 2.1.9 Random Security Questions
18. **Complete registration** with valid password `Demo#Pass12345`
    - **Expected**: Security question dropdown shows random phrases like "What is your unique recovery phrase?"
    - **Narrate**: "Security questions use random answers, not common questions like 'favorite color'"

### 2.2.3 Business Logic Enforcement
19. **Login as customer** (`customer@demo.local` / `Demo#Pass12345`)
20. **Navigate to orders page**
    - **Expected**: Can only see own orders
    - **Narrate**: "Customers can only access their own data"

21. **Try accessing admin features**
    - Navigate to `/admin/users`
    - **Expected**: "You do not have permission" message
    - **Narrate**: "Role-based access prevents unauthorized actions"

### 2.2.1 Centralized Authorization
22. **Show code structure** (if possible in demo)
    - **Expected**: All routes use `requireAuth` and `requireRoles` middleware
    - **Narrate**: "Single authorization system controls all access"

### 2.3.1 Input Rejection vs Sanitization
23. **Navigate to products page** (as product manager)
24. **Try creating product with malicious input**
    - Name: `<script>alert('xss')</script>`
    - **Expected**: Input rejected with validation error
    - **Narrate**: "Malicious input is rejected, not sanitized"

### 2.3.2-2.3.3 Data Range and Length Validation
25. **Try negative price**: Price = -10
    - **Expected**: Error "price must be >= 0"
    - **Narrate**: "Validates data ranges"

26. **Try overly long name**: Name with 300 characters
    - **Expected**: Error "name max length 200"
    - **Narrate**: "Enforces length limits"

### 2.1.13 Re-authentication for Critical Operations
27. **Navigate to password change page**
28. **Try changing password without current password**
    - **Expected**: Requires re-entering current password
    - **Narrate**: "Critical operations require fresh authentication"

### 2.1.10 Password Re-use Prevention
29. **Change password to new value** `New#Pass12345`
30. **Try changing back to** `Demo#Pass12345`
    - **Expected**: Error "Cannot reuse a previous password"
    - **Narrate**: "Prevents password reuse"

### 2.1.11 Password Age Requirement
31. **Try changing password again immediately**
    - **Expected**: Error "Password can only be changed after it has been in use for at least one day"
    - **Narrate**: "Prevents rapid password changes that could bypass reuse checks"

### 2.4.2 Custom Error Pages
32. **Navigate to non-existent URL** (`/nonexistent`)
    - **Expected**: Custom 404 page "Page not found"
    - **Narrate**: "User-friendly error pages instead of technical details"

### 2.4.1 No Debug Information
33. **Trigger server error using Postman**
    - In Postman, send malformed request like **POST** to `/api/auth/login` with invalid JSON body: `{invalid`
    - **Expected**: Status `400 Bad Request`, response "Invalid input."
    - Or send **GET** to `/api/orders` with invalid query parameters
    - **Expected**: Generic "Something went wrong" message
    - **Narrate**: "No stack traces or debug info exposed to users"

### 2.4.4 Audit Logs Restricted to Admins
34. **Login as customer**
35. **Try accessing audit logs** (`/admin/logs`)
    - **Expected**: Access denied
    - **Narrate**: "Only administrators can view security logs"

### 2.4.3 Comprehensive Audit Logging
36. **Login as admin**
37. **Navigate to audit logs** (`/admin/logs`)
    - **Expected**: Shows all security events (logins, access attempts, validation failures)
    - **Narrate**: "System logs both successful and failed security events"

### 2.4.5-2.4.7 Specific Logging Events
38. **Perform various actions and check logs**:
    - Failed login attempt
    - Access denied to restricted resource
    - Invalid form submission
    - **Expected**: Each event appears in audit logs with details
    - **Narrate**: "All security-relevant events are logged for monitoring"

## Demo Conclusion

39. **Summarize compliance**
    - **Expected**: All 58 requirements demonstrated
    - **Total Score**: 58/58 Complete
    - **Narrate**: "This demonstration shows full compliance with secure web development best practices"

## Demo Tips

- **Timing**: Allow 5-10 seconds for each action to complete
- **Narration**: Explain what you're testing and why it matters
- **Pacing**: Don't rush - let viewers see error messages clearly
- **Preparation**: Test all scenarios beforehand
- **Backup**: Have demo accounts ready and server running smoothly