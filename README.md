# Gym Lifting Web Application

A comprehensive web application for tracking and managing your gym workouts, built as a senior project.

## Features

- Record and track your workouts
- Create and use workout templates
- Track personal records
- View workout history
- Location-based workout tracking
- Exercise library with common exercises
- Activity feed to see your progress

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A Supabase account and project

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd senior-project
```

2. Install dependencies:
```bash
# Core dependencies
npm install @supabase/supabase-js
npm install axios
npm install react-toastify
npm install @types/react-toastify --save-dev

# Additional dependencies
npm install react-router-dom
npm install mapbox-gl
npm install @types/mapbox-gl --save-dev
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
```

## Database Setup

1. Create a new Supabase project
2. Set up the following tables:
   - completed_workouts
   - completed_sets
   - exercises
   - locations
   - location_prs
   - premade_workouts

## Running the Application

1. Start the development server:
```bash
npm start
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
senior-project/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── styles/
├── server/
└── README.md
```

## Technologies Used

- React
- TypeScript
- Supabase (Backend & Database)
- Mapbox (Location Services)
- React Router (Navigation)
- React Toastify (Notifications)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Contact

Your Name - [your-email@example.com](mailto:your-email@example.com)

Project Link: [https://github.com/yourusername/senior-project](https://github.com/yourusername/senior-project)

