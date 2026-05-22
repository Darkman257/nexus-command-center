# ADMINDASHBOARD SAFE UI PATTERNS POLICY

## Introduction
This policy governs the usage of the UI patterns extracted from the contaminated `Admindashboard` repository. The original repo (`Darkman257/Admindashboard`) was deleted and is classified as contaminated.

## Usage Restrictions
1. **Visual Reference Only:** The extracted folder (`D:\NEXUS\EXTRACTED_SAFE_PATTERNS\admindashboard\`) serves exclusively as a visual and layout reference. 
2. **Safe for direct import:** NO.
3. **Safe as visual reference only:** YES.
4. **No Business Logic:** No business logic, state management, or data transformations can be copied from the extracted files.
5. **No Network Logic:** No `Supabase`, API `fetch`, `axios`, or `Telegram` bot logic can be reused. All such code in the extracted folder has been sanitized and replaced with mock placeholders.

## Migration & Reusability Protocol
Any future reuse of a UI pattern must adhere to the following strict process:
- **One Pattern at a Time:** Do not bulk copy folders or files.
- **Rewrite from Scratch:** Re-implement the visual structure (HTML/CSS/Tailwind) as a completely new NEXUS component.
- **Official Gateway Only:** Connect the rewritten component using ONLY the NEXUS `AppContext` or NEXUS API Gateway. Direct data queries (e.g., `mockDb.from()`) are strictly forbidden.
