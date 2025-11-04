# Contributions

## Justin Contribution

Set up the next.js project, added basic marketing pages, created dashboard layout, setup data fetching patterns, refactor codebase to follow best practices.

NOTE: we have strict code ownership and the frontend was my (Justin)'s job. All others contributions were minimal and constrained to support the assignment (ok from Prof Grewell gotten). 

## Ray Contribution

### Added the "Dashboard Overview" page, allowing users to see how many papers are processed, the date of the last upload, any recent activity(uploading a PDF, processing a storybook, etc), and a basic "How-to-use" tab.

## Jake M Contribution

### Paper Upload Functionality

Implemented the paper upload feature that allows users to upload research papers to the Paper2Notebook platform via both file uploads and URL-based uploads.

**Implementation Date:** November 3, 2025

#### What Was Implemented

- **File Upload Support**: Users can drag-and-drop or select PDF files from their computer
- **URL Upload Support**: Users can provide a direct link to a PDF hosted online
- **Real-time Feedback**: Loading states and error handling during the upload process
- **Automatic Refresh**: Papers list automatically refreshes after successful upload

#### Files Modified

1. **`src/lib/api.ts`**
   - Added `uploadFileAPI()` function for multipart/form-data uploads
   - Enhanced `postAPI()` with proper error handling and headers

2. **`src/app/dashboard/papers/_data/fetchers.ts`**
   - Created `uploadPaper()` function to handle both file and URL uploads
   - Integrated with existing Zod schema validation

3. **`src/app/dashboard/papers/_components/upload-dialog.tsx`**
   - Implemented the `handleUpload()` function (previously a TODO)
   - Added loading state management
   - Integrated error handling with user-friendly messages
   - Connected to Next.js router for page refresh

4. **`.gitignore`**
   - Added `.claude` directory to exclude Claude Code configuration files

#### Technical Details

- **API Endpoint**: `POST /papers/`
- **Request Format**: multipart/form-data with `file` and/or `source_url` fields
- **Response Validation**: Uses existing `PaperSchema` for type safety
- **Error Handling**: Displays descriptive error messages and keeps dialog open for retry
- **Lines Changed**: ~45 lines across 3 core files
- **No New Dependencies**: Used existing React, Next.js, and Zod libraries

#### User Experience Improvements

- Button shows "Uploading..." text during upload
- Button is disabled during upload to prevent double-submission
- Dialog closes automatically on success
- Error messages display detailed API responses
- Form state is cleared after successful upload

## Daewoong Lim Contribution

### Individual Paper Fetch Functionality

Implemented the paper fetch feature that allows users to see information about each research paper at the Paper2Notebook platform.

**Implementation Date:** November 3, 2025

#### What Was Implemented

- **Retrieve File Support**: Users can click on the card at dashboard/paper/ or type in the url to view paper details page at dashboard/papers/[id].
- **Error handling**: Appropriate error message is displayed when there is an error.

#### Files Modified

1. **`src/app/dashboard/papers/[id]/page.tsx`**
   - Wrapped the existing code in try block to catch error
   - Created helper functions formatDate and DetailItem to help in render
   - Modified return html code to render additional information

2. **`src/app/dashboard/papers/_data/fetchers.ts`**
   - Created `getPaper()` function to retrieve from papers table for a single paper

3. **`src/lib/api.ts`**
   - Added conditional statements to throw error and not parse JSON if nothing is fetched

#### Technical Details

- **API Endpoint**: `GET /papers/:id`
- **Request Format**: Uses dynamic route parameter (params.id) from Next.js App Router to fetch a single paper’s data through getPaper() in fetchers.ts
- **Data Handling**: Fetch result is validated before rendering; missing or malformed data triggers a controlled error message.
- **Helper Utilities**: Added formatDate() for date formatting and DetailItem component for consistent UI rendering of each paper detail.
- **Error Handling**: Wrapped API call in try/catch block — displays fallback UI when fetch fails instead of crashing the page.
- **Lines Changed**: ~150 lines across 3 core files
- **No New Dependencies**: Used existing React, Next.js, and Zod libraries

#### User Experience Improvements
- Users can now directly open a specific paper’s detail page from dashboard cards or by URL.
- Error messages clearly describe fetch or network issues.
- Data such as title, status, date added, and paper id are formatted neatly with consistent layout.
- Provides smoother navigation flow within the Paper2Notebook dashboard — no blank screens or unhandled errors when a paper is missing or inaccessible.