# Sticky Notes App

A fun, collaborative web app which lets you stick sticky notes to virtual backgrounds, and see your friends sticky notes. Create a group and invite your friends, or join a group to track things in a new and exciting way!

## Features

- **User Authentication**: Register and login with email/password
- **Group Collaboration**: Create groups and invite others by email
- **Interactive Sticky Notes**: Create, edit, move, and resize sticky notes
- **Multiple Scenes**: Choose from different background scenes
- **Real-time Updates**: Changes are saved automatically to the database

## Tech Stack

- **Backend**: Express.js
- **Database**: MongoDB (cloud-hosted, if you're running locally please use your own instance and setup collections, otherwise just use the demo)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Frontend**: HTML, CSS, Tailwind CSS, and JavaScript 
- **Session Management**: HTTP-only cookies

## Security Considerations

- Passwords are properly hashed using bcrypt
- JWT tokens are stored in HTTP-only cookies
- Input validation is implemented for user registration
- CORS is configured for cross-origin requests
- Inputs for some api's are are NOT validated yet (work in progress)
- FYI We leaked the .env file in a previous commit, feel free to try the values, they don't work anymore 

## Prerequisites

Before running this project locally, make sure you have:

- **Node.js** 
- **npm cli** 

## Database Requirements

⚠️ **Important**: This project requires access to a MongoDB database. The current configuration uses a cloud-hosted MongoDB Atlas database with specific credentials. You will need to either:

1. **Set up your own MongoDB database** (local or cloud)
2. **Get access credentials** for the existing database from the project owner
3. **Configure .env file**: 
The application connects to MongoDB using these environment variables:
- `MONGODB_PASSWORD` - Password for the MongoDB connection
- `JWT_SIGN_KEY` - Secret key for JWT token signing

## Local Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/saisrikar8/sticky-notes.git
cd sticky-notes
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

The project includes a `.env` file with database credentials. **If you're setting up your own database**, you'll need to:

1. Create your own MongoDB database (local or MongoDB Atlas)
2. Update the `.env` file with your credentials:

```env
MONGODB_PASSWORD=your_mongodb_password
JWT_SIGN_KEY=your_jwt_secret_key
```

3. Update the MongoDB connection URL in both `index.cjs` and `utils.cjs` files:

```javascript
// Replace this line in both files (don't mind the name lol):
const mongodb_URL = `mongodb+srv://tummalasaisrikar:${process.env.MONGODB_PASSWORD}@yichangs-temu-storage.irg9scu.mongodb.net/?retryWrites=true&w=majority&appName=YICHANGS-TEMU-STORAGE`;

// With your own MongoDB connection string:
const mongodb_URL = `mongodb://localhost:27017/sticky-notes-game`; // For local MongoDB
// OR
const mongodb_URL = `mongodb+srv://yourusername:${process.env.MONGODB_PASSWORD}@your-cluster.mongodb.net/?retryWrites=true&w=majority&appName=YourAppName`; // For MongoDB Atlas
```

### 4. Database Setup

The application will automatically create the necessary collections when you first run it:
- `users` - User accounts and authentication
- `groups` - Group information and membership
- `stickies` - Sticky note data and positions

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

## Usage

### Getting Started

1. **Login**: Login or register
3. **Create Groups**: Create groups to organize your sticky notes
4. **Invite Others**: Add people to your groups using their email addresses
5. **Add Sticky Notes**: Click to add sticky notes to your workspace
6. **Collaborate**: Multiple users can work on the same group simultaneously

## API Endpoints

The application provides several REST API endpoints:

- `POST /api/register` - Create new user account
- `POST /api/login` - User authentication
- `GET  /api/get-joined-groups` - Get user's groups
- `POST /api/create-group` - Create new group
- `POST /api/post-sticky` - Create new sticky note
- `POST /api/get-stickies` - Retrieve sticky notes
- `POST /api/update-sticky-position` - Update sticky note position
- `POST /api/update-sticky-size` - Update sticky note size
- `POST /api/update-sticky-text` - Update sticky note content
- `POST /api/remove-sticky` - Delete sticky note
- `POST /api/add-person-to-group` - Add user to group

## File Structure

```
sticky-notes/
├── index.cjs              # Main server file
├── utils.cjs              # Utility functions (auth, password hashing)
├── package.json           
├── .env                   # Environment variables
├── public/                # Static frontend files
    ├── mainscreen/        # Main dashboard
    ├── onboarding/        # Login/register pages
    ├── scene-controller/  # Group workspace
    ├── scenes/            # Background images
    └── *.js, *.css        # Other files

```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Ensure your MongoDB database is running
   - Check your connection string and credentials
   - Verify network connectivity to MongoDB Atlas (if using cloud)

2. **Port Already in Use**
   - The app runs on port 3000 by default
   - Kill any existing processes on port 3000 or change the port in `index.cjs`

3. **Environment Variables Not Loading**
   - Ensure `.env` file is in the root directory
   - Check that variable names match exactly
   - Restart the server after changing environment variables
   - ```console.log``` to debug 

4. **JWT Token Errors**
   - Generate a new JWT secret key if needed: https://jwt.io/
   - Clear browser cookies if experiencing authentication issues


