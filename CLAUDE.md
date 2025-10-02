# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

日田市移住定住相談フォーム (Hita City Relocation Consultation Form) - A web application for collecting relocation and vacant house bank registration applications. The form data will be deployed to Netlify and stored in kintone.

## Project Structure

```
/job/riera-hita/
├── index.html          # Main form page (single-file application)
├── docs/               # Documentation directory (empty)
└── .claude/            # Claude Code settings
```

## Architecture

**Current State**: Single-file static HTML application with embedded CSS and JavaScript

**Target Architecture** (as per user requirements):
- Frontend: HTML form (existing)
- Hosting: Netlify
- Backend: kintone (cybozu cloud database)
- Data Flow: Form → Netlify Function/Handler → kintone API

## Form Structure

The application contains a comprehensive relocation consultation form with the following sections:

### Main Sections (Q1-Q11)
- Q1: Applicant information (name, address, contact)
- Q2: Number of immigrants
- Q3: Applicant details (age, occupation)
- Q4: Family members (dynamic add/remove)
- Q5: Birthplace
- Q6-Q10: Relocation details (timing, reasons, plans, employment, consultation)
- Q11: Permission for mail information

### Vacant House Bank Registration (Q12-Q20)
- Q12: Agreement checkboxes (4 required agreements)
- Q13: Usage purpose (permanent/villa/dual residence)
- Q14: Preferred property and area
- Q15-Q20: Property requirements (transaction type, layout, parking, pets, other conditions)

### Pre-Registration Survey (Q21-Q29)
- Q21: Priority requirements (conditional sections)
- Q22-Q28: Detailed conditions (location, water, building type, floors, onsen, garden)
- Q29: School size preferences

## Dynamic Form Behaviors

### Family Member Management
- `addFamilyMember()`: Dynamically creates family member input sections with unique IDs
- `removeFamilyMember(id)`: Removes specific family member section
- Each member requires: name (kanji/kana), relationship, age, occupation

### Conditional Display Logic
- `togglePetDetails(show)`: Shows/hides pet details (Q19) based on Q18 answer
- `toggleSurveySection(section, show)`: Shows/hides survey subsections (Q22-Q28) based on Q21 checkboxes

### Form Submission
- Currently: `preventDefault()` → data collection → console.log → alert
- **TODO**: Implement actual server submission to kintone via Netlify Function

## Implementation Requirements

### Backend Integration (Required)
1. **Netlify Functions**: Create serverless function handler for form submission
2. **kintone API Integration**:
   - Configure kintone app with matching field structure
   - Implement authentication (API token or OAuth)
   - Map form fields to kintone record fields
   - Handle family members as subtable or related records
3. **Environment Variables**: Store kintone credentials securely in Netlify

### Data Mapping Considerations
- Checkbox arrays (Q14 area, Q21 priority) need proper serialization
- Dynamic family member data requires array/subtable handling
- Radio button groups ensure single values
- Optional fields must handle empty/null values

### Critical Constraint from User Instructions
⚠️ **S3 Operations**: S3 storage must ONLY be handled within Netlify Function handlers. No direct S3 operations outside handlers.

## Deployment Workflow

1. **Netlify Configuration**:
   - Create `netlify.toml` for build settings
   - Define serverless function routes
   - Set environment variables for kintone API credentials

2. **Build Process**:
   - Static site: No build required (pure HTML/CSS/JS)
   - Functions: Node.js-based handler for kintone integration

3. **kintone Setup**:
   - Create kintone app matching form structure
   - Generate API token with write permissions
   - Configure CORS if needed for direct API calls

## Development Commands

Currently no package.json or build tools configured.

**Recommended setup**:
```bash
# Initialize Node.js project
npm init -y

# Install Netlify CLI for local development
npm install -D netlify-cli

# Install kintone SDK
npm install @kintone/rest-api-client

# Local development with functions
netlify dev

# Deploy to Netlify
netlify deploy --prod
```

## Data Privacy Notes

- Personal information used ONLY for Hita City relocation services (as stated in privacy notice)
- Required agreements include anti-social force declaration (Q12.3)
- Mail permission tracking for information distribution (Q11)

## Language & Localization

- **Primary language: Japanese**
- **Communication**: Always respond to users in Japanese (日本語で回答すること)
- All form labels, placeholders, and messages in Japanese
- Code comments should be in Japanese for maintainability
- Consider adding English version if international relocations are expected

## Browser Compatibility

Pure HTML5/CSS3/ES6 JavaScript - ensure compatibility:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design with `@media` breakpoints
- Viewport meta tag configured for mobile
