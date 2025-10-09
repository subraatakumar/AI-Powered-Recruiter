# AI-Powered Recruiter Expo App

This Expo app provides a cross-platform interface for recruiters and candidates to interact with the AI-Powered Recruiter system. It is designed for both web and mobile devices, following the project vision outlined in the chapters.

## Key Features & User Flows

1. **Home Page:**

   - Displays a list of job openings.
   - Admin login button at the top right.

2. **Job Details & Application:**

   - Anyone can view job details without logging in.
   - “Apply” button on job details page.
   - On apply: user enters email, system checks if already applied for this job.
   - If not applied, user can upload a PDF resume.

3. **Admin (HR) Login:**

   - Top right login for HR/admin.
   - Login via email and password.

4. **HR Dashboard:**

   - Upload job descriptions (form or PDF).
   - Suspend job listings.
   - View number of applicants per job.
   - View uploaded resumes.

5. **Job List for HR:**

   - Shows job titles and applicant counts.

6. **Applicant List for Job:**

   - Flatlist of candidates, showing name and “best fit” rank (out of 10).
   - Sorted by rank, highest first.

7. **Candidate Details:**

   - View uploaded PDF resume.
   - Display useful summary extracted from PDF.

8. **AI Matching:**

   - Local LLM in app for offline best-fit ranking.
   - Uses vector data from backend for candidate-job matching.

9. **HR Actions:**
   - Shortlist, reject, or keep candidates on hold.
   - View status of all candidates (shortlisted, rejected, on hold, etc.).

## Architecture

- Built with Expo for web and mobile compatibility
- Connects to backend via RESTful APIs
- Modern UI/UX for ease of use
- State management for smooth navigation
- Local LLM integration for offline candidate ranking

---

This Expo app is designed to deliver a seamless experience for all users, leveraging both backend and local AI capabilities.
