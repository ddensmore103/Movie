# TMDB API Setup Instructions

## Getting Your TMDB API Key

1. **Create a TMDB Account**:
   - Go to https://www.themoviedb.org/signup
   - Sign up for a free account

2. **Request an API Key**:
   - Once logged in, go to your account settings
   - Navigate to the "API" section: https://www.themoviedb.org/settings/api
   - Click "Request an API Key"
   - Choose "Developer" option
   - Fill out the form:
     - **Application Name**: MovieTrack (or any name)
     - **Application URL**: Use `http://localhost:5173` or `https://example.com` (placeholder is fine)
     - **Application Summary**: Personal movie tracking app for learning
     - **Type of Use**: Education or Personal
   - Accept the terms of use

3. **Copy Your API Key**:
   - Once approved (usually instant), you'll see your API Key (v3 auth)
   - Copy the API key

> **Note**: The URL field is required but you can use `http://localhost:5173` (your local dev server) or any placeholder URL like `https://example.com`. TMDB doesn't verify the URL for developer keys.

4. **Add to Your Project**:
   - Open `src/services/tmdb.js`
   - Find the line: `const TMDB_API_KEY = 'YOUR_TMDB_API_KEY_HERE';`
   - Replace `YOUR_TMDB_API_KEY_HERE` with your actual API key
   - Save the file

## Example Configuration

```javascript
// src/services/tmdb.js
const TMDB_API_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'; // Your actual key
```

## Important Notes

- **Keep your API key secure**: Don't commit it to public repositories
- **Rate Limits**: TMDB has rate limits (40 requests per 10 seconds)
- **For Production**: Use environment variables instead of hardcoding
  ```javascript
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  ```
  Then create a `.env` file:
  ```
  VITE_TMDB_API_KEY=your_api_key_here
  ```

## Testing the API

Once configured, the app will automatically fetch:
- Trending movies
- Popular movies
- Search results
- Movie details

If the API key is not set, the app will fall back to mock data for demonstration purposes.
