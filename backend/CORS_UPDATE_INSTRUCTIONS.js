// CORS Configuration Update Instructions
// ==========================================
// 
// STEP 1: Get your Vercel URL
// - Go to vercel.com and find your deployed app
// - Copy the URL (e.g., https://movie-app-xyz.vercel.app)
//
// STEP 2: Replace line 25 in backend/server.js with this code:
// - Find the line that says: origin: ['http://localhost:5173', 'http://localhost:3000'],
// - Replace it with the code below
// - Change 'YOUR-VERCEL-URL-HERE' to your actual Vercel URL
//
// UPDATED CORS CONFIGURATION:

app.use(cors({
    origin: [
        'http://localhost:5173',                    // Local development
        'http://localhost:3000',                    // Alternative local port
        'https://YOUR-VERCEL-URL-HERE.vercel.app'   // ⚠️ REPLACE THIS with your actual Vercel URL
    ],
    credentials: true
}));

// EXAMPLE (after replacement):
// app.use(cors({
//     origin: [
//         'http://localhost:5173',
//         'http://localhost:3000',
//         'https://movie-tracker-abc123.vercel.app'  // Your actual URL
//     ],
//     credentials: true
// }));

// STEP 3: Save the file
// STEP 4: Commit and push to git
// STEP 5: Redeploy your backend (Render/Railway/Heroku)
