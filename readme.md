# Image Resizer

A web application for resizing images with separate frontend (Netlify) and backend (Render with Docker).

## Project Structure
image-resizer/
├── frontend/ # Static files for Netlify deployment
│ ├── index.html
│ ├── style.css
│ └── script.js
├── backend/ # PHP backend for Render deployment
│ ├── resize.php
│ ├── Dockerfile
│ └── .htaccess
└── README.md


## Features

- Upload images via drag & drop or file browser
- Preview original image with dimensions and file size
- Resize to custom dimensions with aspect ratio locking
- Adjust output quality (1-100%)
- Choose output format (JPG, PNG, WebP, or original)
- Download resized images
- Responsive design for mobile and desktop

## Deployment

### Frontend (Netlify)
1. Deploy the `frontend/` folder to Netlify
2. Update `BACKEND_URL` in `frontend/script.js` with your Render backend URL

### Backend (Render)
1. Deploy the `backend/` folder to Render as a Docker web service
2. Update CORS settings in `backend/resize.php` and `backend/.htaccess` with your Netlify frontend URL

## Local Development

### Backend
```bash
cd backend
docker build -t image-resizer-backend .
docker run -p 8080:80 image-resizer-backend

cd frontend
python -m http.server 8000
# or
npx serve .

Technologies Used
Frontend: HTML5, CSS3, JavaScript (ES6+)

Backend: PHP with GD library

Containerization: Docker

Hosting: Netlify (frontend), Render (backend)


## Step 4: Initialize Git and Push to GitHub

Open terminal/command prompt in your project folder and run these commands:

```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Make the first commit
git commit -m "Initial commit: Image resizer with Netlify frontend and Render backend"

# Add your GitHub repository as remote origin
# Replace YOUR_USERNAME and YOUR_REPOSITORY with your actual GitHub info
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# Rename the main branch (if needed)
git branch -M main

# Push to GitHub
git push -u origin main