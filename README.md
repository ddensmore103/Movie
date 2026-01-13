# MovieTrack - Social Movie Tracking Platform

A collaborative social platform for tracking and sharing movie experiences, built with React and Vite.

## Features

- 🎬 **Movie Discovery**: Search and browse movies with TMDB API integration
- 📊 **Activity Feed**: See what your friends are watching and reviewing
- 📋 **Custom Lists**: Create and share movie lists with friends
- 👥 **Social Features**: Connect with friends and see their activity
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 📱 **Mobile Responsive**: Works seamlessly on all devices

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TMDB API** - Movie database
- **CSS3** - Modern styling with custom properties

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TMDB API key (free at https://www.themoviedb.org/settings/api)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure TMDB API**:
   - Get your free API key from [TMDB](https://www.themoviedb.org/settings/api)
   - Open `src/services/tmdb.js`
   - Replace `YOUR_TMDB_API_KEY_HERE` with your actual API key

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
movie-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   ├── SearchBar.jsx    # Movie search component
│   │   ├── MovieCard.jsx    # Movie display card
│   │   └── ActivityCard.jsx # Activity feed item
│   ├── pages/               # Page components
│   │   ├── Home.jsx         # Home page with feed
│   │   ├── Lists.jsx        # Movie lists page
│   │   ├── Friends.jsx      # Friends management
│   │   ├── Profile.jsx      # User profile
│   │   └── Settings.jsx     # App settings
│   ├── services/            # API services
│   │   └── tmdb.js          # TMDB API integration
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # App entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
└── package.json             # Dependencies
```

## Future Enhancements

### Backend Integration (AWS + DynamoDB)
- User authentication and authorization
- Persistent user data and preferences
- Real-time activity feeds
- Friend connections and social features
- Movie reviews and ratings storage
- Collaborative list management

### Recommended AWS Services
- **AWS Amplify** - Full-stack deployment and hosting
- **Amazon Cognito** - User authentication
- **DynamoDB** - NoSQL database for user data, lists, and reviews
- **API Gateway + Lambda** - Serverless API endpoints
- **S3** - User-uploaded content storage

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT License - feel free to use this project as a template for your own movie tracking app.

## Acknowledgments

- Movie data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Icons and emojis from Unicode standard
- Fonts from [Google Fonts](https://fonts.google.com/)
