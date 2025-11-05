# Programmatic SEO Tool

A powerful MERN stack application for generating hundreds of SEO-optimized landing pages automatically from CSV data and custom templates.

## 🚀 Features

### Core Functionality
- **CSV Upload & Processing**: Upload CSV files with your data (keywords, locations, services, etc.)
- **Template System**: Create custom JSON templates with variable placeholders
- **Bulk Page Generation**: Generate hundreds of unique landing pages automatically
- **Server-Side Rendering**: SEO-friendly pages with proper meta tags and structured data

### Advanced SEO Features
- **Enhanced Meta Tags**: Automatic title, description, OpenGraph, and Twitter card tags
- **Canonical URLs**: Proper canonical URL structure for each page
- **JSON-LD Structured Data**: FAQ schema and organization markup
- **Dynamic XML Sitemap**: Automatically updated sitemap with lastmod dates and proper priorities
- **Robots.txt**: Dynamic robots.txt with sitemap reference and admin protection
- **Related Pages**: Cross-linking between similar pages for improved SEO
- **Unique Slug Generation**: Automatic slug deduplication to prevent conflicts

### Production Features
- **Basic Authentication**: Secure admin panel with username/password protection
- **Compression Middleware**: Gzip compression for faster page loads
- **Cache Headers**: Optimized cache headers for better performance
- **View Tracking**: Page view counts and last accessed timestamps
- **Error Handling**: Comprehensive error pages and logging
- **Environment Configuration**: Complete .env setup with production variables

### Admin Panel
- **React Dashboard**: Modern admin interface built with React + Vite
- **Template Editor**: JSON template editor with syntax highlighting
- **Page Management**: View, edit, and delete generated pages
- **Real-time Statistics**: View page generation progress and analytics

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- EJS templating
- Multer (file uploads)
- Papaparse (CSV parsing)
- Compression middleware
- Basic authentication

**Frontend:**
- React 18
- Vite (build tool)
- Modern ES6+ JavaScript
- Responsive CSS

**SEO & Performance:**
- Server-side rendering
- JSON-LD structured data
- Compression middleware
- Advanced meta tags
- Dynamic sitemaps

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or Atlas)
- Git

## ⚡ Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd programmatic-seo-tool

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
cd ..
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# Minimum required:
# MONGODB_URI=mongodb://localhost:27017/programmatic-seo-tool
# SITE_URL=http://localhost:3000
# BASIC_AUTH_USERNAME=admin
# BASIC_AUTH_PASSWORD=changeme123
```

### 3. Start Development Servers
```bash
# Terminal 1 - Backend server
cd backend
npm run dev
# Runs on http://localhost:3000

# Terminal 2 - Frontend dev server  
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 4. Access the Application
- **Main Site**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin (or http://localhost:5173 in dev)
- **Login**: admin / changeme123 (change in .env)
- **Sitemap**: http://localhost:3000/sitemap.xml
- **Robots**: http://localhost:3000/robots.txt

## 📖 How to Use

### 1. Prepare Your Data
Create a CSV file with your data. Example:
```csv
keyword,location,service
plumber,New York,emergency plumbing
electrician,Los Angeles,electrical repair
contractor,Chicago,home renovation
```

### 2. Create a Template
Create a JSON template with placeholders:
```json
{
  "templateKey": "service-location",
  "title": "Best {{keyword}} in {{location}} - Professional {{service}}",
  "metaDescription": "Find the best {{keyword}} in {{location}}. Professional {{service}} services available 24/7. Call now!",
  "h1": "Professional {{keyword}} Services in {{location}}",
  "sections": [
    "Looking for a reliable {{keyword}} in {{location}}? Our expert team provides top-quality {{service}} services.",
    "We've been serving {{location}} for over 10 years with professional {{service}} solutions.",
    "Contact us today for fast, reliable {{keyword}} services in {{location}}."
  ],
  "faq": [
    {
      "q": "Why choose our {{keyword}} services in {{location}}?",
      "a": "We provide professional {{service}} with guaranteed satisfaction and 24/7 availability in {{location}}."
    },
    {
      "q": "How quickly can you respond in {{location}}?",
      "a": "Our {{keyword}} team typically responds within 30 minutes for emergency {{service}} in {{location}}."
    }
  ]
}
```

### 3. Generate Pages
1. Go to admin panel: http://localhost:3000/admin
2. Upload your CSV file
3. Create or select a template
4. Click "Generate Pages"
5. View your generated pages

### 4. Check SEO Features
- **Individual pages**: http://localhost:3000/best-plumber-in-new-york
- **Sitemap**: http://localhost:3000/sitemap.xml
- **Robots**: http://localhost:3000/robots.txt
- **Related pages**: Automatically cross-linked on each page

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:

### Recommended Platforms:
1. **Railway** (Easiest): $5/month with MongoDB included
2. **Render + MongoDB Atlas**: Free tier available
3. **Vercel + Database**: Serverless deployment
4. **DigitalOcean**: $25/month full-stack

### Production Checklist:
- [ ] Set strong admin password in BASIC_AUTH_PASSWORD
- [ ] Configure production MongoDB (Atlas recommended)
- [ ] Set SITE_URL environment variable to your domain
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Submit sitemap to Google Search Console
- [ ] Test basic authentication on admin panel

## 📁 Project Structure

```
programmatic-seo-tool/
├── backend/
│   ├── server.js              # Express server with compression, auth
│   ├── models/
│   │   └── Page.js            # MongoDB page model with indexing
│   ├── routes/
│   │   ├── admin.js           # Protected API routes
│   │   └── pages.js           # Public SSR routes + sitemap
│   ├── utils/
│   │   ├── templating.js      # Template processing + unique slugs
│   │   └── csv.js             # CSV parsing utilities
│   ├── views/
│   │   ├── layout.ejs         # Enhanced SEO template
│   │   ├── page.ejs           # Individual page template
│   │   └── error.ejs          # Professional error pages
│   └── uploads/               # Uploaded CSV files
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # React pages  
│   │   └── config.js          # API configuration
│   └── dist/                  # Production build
├── .env.example               # Complete environment template
├── DEPLOYMENT.md              # Comprehensive deployment guide
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/programmatic-seo-tool

# Site Configuration  
SITE_URL=http://localhost:3000

# Authentication (CHANGE THESE!)
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=changeme123

# Optional Production Settings
SESSION_SECRET=random-secret-key-here
MAX_FILE_SIZE=5242880
GOOGLE_ANALYTICS_ID=
GOOGLE_SITE_VERIFICATION=
```

## 🎯 Advanced SEO Features

### Technical SEO
- ✅ Enhanced meta tags (title, description, OpenGraph, Twitter cards)
- ✅ Canonical URLs for every page to prevent duplicates
- ✅ JSON-LD structured data (FAQ and Organization schema)
- ✅ Dynamic XML sitemap with proper lastmod and priorities
- ✅ SEO-friendly robots.txt with admin panel protection
- ✅ Semantic HTML structure with proper headings

### Performance SEO
- ✅ Server-side rendering for instant content visibility
- ✅ Gzip compression for 70% smaller file sizes
- ✅ Optimized cache headers for repeat visits
- ✅ Efficient database queries with proper indexing
- ✅ Minified assets and optimized images

### Content SEO
- ✅ Unique content generation for each page
- ✅ Related pages section for internal linking
- ✅ FAQ sections optimized for featured snippets
- ✅ Keyword-rich URLs with automatic slug generation
- ✅ Duplicate content prevention with unique slug handling

## 🔨 Development

### Adding New Features
1. Backend changes go in `backend/` directory
2. Frontend changes go in `frontend/src/`
3. SEO templates are in `backend/views/`
4. Database models in `backend/models/`

### Testing Locally
```bash
# Test backend API
curl http://localhost:3000/api/pages

# Check enhanced sitemap
curl http://localhost:3000/sitemap.xml

# Test robots.txt
curl http://localhost:3000/robots.txt

# Verify basic auth
curl -u admin:changeme123 http://localhost:3000/admin
```

### Database Operations
```bash
# Connect to local MongoDB
mongosh programmatic-seo-tool

# View pages with SEO data
db.pages.find({}, {title: 1, slug: 1, views: 1}).limit(5)

# Check for duplicate slugs (should be empty)
db.pages.aggregate([
  {$group: {_id: "$slug", count: {$sum: 1}}},
  {$match: {count: {$gt: 1}}}
])

# View sitemap data
db.pages.find({}, {slug: 1, updatedAt: 1}).sort({updatedAt: -1})
```

## 📊 Production Monitoring

### Key Metrics to Track
- Page generation success rate
- Individual page view counts and trends  
- Sitemap accessibility and freshness
- Search engine crawl rate and indexing
- Page load times and Core Web Vitals
- Admin panel access and security

### SEO Monitoring Checklist
1. Submit sitemap.xml to Google Search Console
2. Monitor for crawl errors and 404s
3. Track keyword rankings for generated pages
4. Check for duplicate content issues
5. Verify structured data with Google Rich Results Test
6. Monitor site speed and mobile usability

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make your changes with tests
4. Update documentation if needed
5. Submit pull request with clear description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues
1. **Database connection errors**: Verify MongoDB is running and MONGODB_URI is correct
2. **Authentication failures**: Check BASIC_AUTH credentials in .env
3. **File upload errors**: Verify MAX_FILE_SIZE and upload directory permissions
4. **Build errors**: Clear node_modules and reinstall dependencies
5. **Slug conflicts**: Tool automatically generates unique slugs

### Getting Help
- Check the comprehensive [DEPLOYMENT.md](DEPLOYMENT.md) guide
- Review all environment variables in .env.example
- Test with sample CSV data first
- Check browser console and server logs for detailed errors
- Verify MongoDB connection and collections

---

**Ready to scale your SEO with advanced features?** This production-ready tool includes everything you need: enhanced SEO, security, performance optimization, and comprehensive deployment guidance. Upload your CSV, create templates, and generate hundreds of optimized landing pages that actually rank! 🚀

## ✨ Features

- 📊 **CSV Upload & Processing** - Upload CSV data with automatic validation and preview
- 🎨 **JSON Template Editor** - Create customizable page templates with variable placeholders
- 🔄 **Bulk Page Generation** - Generate hundreds of pages automatically with one click
- 🎯 **Server-Side Rendering (SSR)** - All pages are server-rendered with Express + EJS for optimal SEO
- 📱 **React Admin Panel** - Modern, responsive admin interface for managing everything
- 🔍 **SEO Optimized** - Each page includes proper meta tags, structured data (JSON-LD), and FAQ schema
- 🗺️ **Dynamic Sitemap** - Auto-generated XML sitemap for search engines
- 🤖 **Robots.txt** - Automatic robots.txt generation with sitemap reference
- 📈 **Dashboard Analytics** - View statistics and manage generated pages
- 🗂️ **MongoDB Integration** - Scalable database with proper indexing
- 🔗 **Related Pages** - Automatic internal linking between similar pages

## 🏗️ Architecture

```
programmatic-seo-tool/
├─ backend/                 # Node.js + Express server
│  ├─ server.js            # Main server file
│  ├─ routes/
│  │  ├─ admin.js          # API routes for admin functions
│  │  └─ pages.js          # SSR routes for public pages
│  ├─ models/
│  │  └─ Page.js           # Mongoose schema
│  ├─ views/               # EJS templates for SSR
│  │  ├─ layout.ejs        # Base layout with SEO tags
│  │  └─ page.ejs          # Page content template
│  ├─ utils/
│  │  ├─ templating.js     # Template processing utilities
│  │  └─ csv.js            # CSV parsing utilities
│  └─ public/
│     ├─ robots.txt        # SEO robots file
│     └─ admin/            # Built React app (after build)
└─ frontend/               # React admin interface
   ├─ src/
   │  ├─ components/       # React components
   │  ├─ App.jsx          # Main app component
   │  └─ index.css        # Styles
   └─ vite.config.js      # Vite configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd programmatic-seo-tool

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Create environment file
cd ../backend
cp .env.example .env
```

Edit `.env` file with your MongoDB connection:

```env
MONGODB_URI=mongodb://localhost:27017/programmatic-seo-tool
PORT=8080
NODE_ENV=development
```

For **MongoDB Atlas**:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/programmatic-seo-tool
```

### 3. Build Frontend

```bash
# Build React app for production
cd frontend
npm run build
```

This builds the React app to `backend/public/admin/`.

### 4. Start the Server

```bash
# Start the backend server
cd ../backend
npm start

# For development with auto-restart:
npm run dev
```

### 5. Access the Application

- 🌐 **Homepage**: http://localhost:8080/
- ⚙️ **Admin Panel**: http://localhost:8080/admin
- 🗺️ **Sitemap**: http://localhost:8080/sitemap.xml
- 🤖 **Robots**: http://localhost:8080/robots.txt

## 📊 How to Use

### Step 1: Upload CSV Data

1. Go to **Admin Panel** → **Upload CSV**
2. Upload a CSV file with your data (or download the sample)
3. Preview your data and column headers

**Example CSV structure:**
```csv
keyword,city,brand,service,count
seo services,Hyderabad,Acme Digital,Local SEO,120
seo services,Bangalore,Acme Digital,Local SEO,120
web design,Mumbai,Acme Digital,Website Development,85
```

### Step 2: Create Template

1. Go to **Template Editor** tab
2. Create or modify the JSON template
3. Use `{variable}` placeholders matching your CSV headers

**Example template:**
```json
{
  "templateKey": "local-seo",
  "title": "{keyword} in {city} | {brand}",
  "metaDescription": "Boost growth with {keyword} in {city}. {brand} offers {service} trusted by {count}+ clients.",
  "h1": "{keyword} in {city}",
  "sections": [
    "Overview: {keyword} helps {city} businesses win local search.",
    "Our Services: {brand} provides {service} packages tailored to {city}.",
    "Proof: We've helped {count}+ brands in {city} succeed."
  ],
  "faq": [
    {"q": "What is {keyword}?", "a": "{keyword} is a set of tactics to improve visibility in {city}."},
    {"q": "Why choose {brand}?", "a": "We specialize in {service} with proven results."}
  ],
  "variables": ["keyword","city","brand","service","count"]
}
```

### Step 3: Generate Pages

1. Click **Generate Pages** button
2. Watch the progress as pages are created
3. View the results and navigate to generated pages

### Step 4: Manage Pages

1. Go to **Generated Pages** tab
2. View all created pages with preview links
3. Filter by template or delete individual/bulk pages

## 🔧 API Endpoints

### Admin API (`/api/`)

- `POST /upload` - Upload and parse CSV file
- `POST /generate` - Generate pages from CSV + template
- `GET /pages` - List all pages (paginated)
- `GET /pages/:slug` - Get specific page details
- `DELETE /pages/:slug` - Delete specific page
- `DELETE /pages?templateKey=key` - Bulk delete by template
- `GET /sample-csv` - Download sample CSV file
- `GET /stats` - Get dashboard statistics

### Public Routes

- `GET /` - Homepage
- `GET /:slug` - Dynamic page (SSR)
- `GET /sitemap.xml` - XML sitemap
- `GET /robots.txt` - Robots file

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev    # Starts with nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev    # Starts Vite dev server on port 3000
```

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

## 🎯 SEO Features

### Server-Side Rendering (SSR)
- All pages rendered by Express + EJS
- Proper `<title>` and `<meta>` tags
- Structured data (JSON-LD) for FAQs
- Search engine friendly URLs

### Auto-Generated SEO Elements
- **Title Tags**: Customizable per page
- **Meta Descriptions**: Unique descriptions
- **Structured Data**: FAQ schema markup
- **Internal Linking**: Related pages section
- **XML Sitemap**: Dynamic sitemap generation
- **Robots.txt**: Search engine instructions

## 📁 Template Structure

### Required Fields
```json
{
  "templateKey": "unique-identifier",
  "title": "Page title with {variables}",
  "metaDescription": "Meta description with {variables}",
  "h1": "Main heading with {variables}",
  "variables": ["array", "of", "csv", "columns"]
}
```

### Optional Fields
```json
{
  "sections": ["Array of content paragraphs"],
  "faq": [
    {"q": "Question with {variables}", "a": "Answer with {variables}"}
  ]
}
```

## 🗄️ Database Schema

### Page Model (MongoDB)
```javascript
{
  slug: String,              // unique URL slug
  title: String,             // SEO title
  metaDescription: String,   // meta description
  h1: String,                // main heading
  sections: [String],        // content sections
  faq: [{q: String, a: String}], // FAQ items
  faqSchema: Object,         // JSON-LD schema
  vars: Object,              // original CSV variables
  templateKey: String,       // template identifier
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Environment Variables (Production)
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
PORT=80
```

### Build Steps
```bash
# 1. Install dependencies
npm install --production

# 2. Build frontend
cd frontend && npm run build && cd ..

# 3. Start server
cd backend && npm start
```

## 📊 Example Use Cases

### Local SEO Agency
- **CSV**: `service,city,state,zip,phone`
- **Template**: "{service} in {city}, {state} | Call {phone}"
- **Result**: 100s of location-specific service pages

### E-commerce Product Pages
- **CSV**: `product,category,price,brand,features`
- **Template**: "{product} by {brand} | {category} from ${price}"
- **Result**: Individual product landing pages

### Directory Listings
- **CSV**: `business,category,city,rating,description`
- **Template**: "{business} - {category} in {city}"
- **Result**: Business listing pages with SEO content

## 🛟 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongod --version

# Or use MongoDB Atlas connection string
```

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Port Already in Use**
```bash
# Change PORT in .env file or kill existing process
lsof -ti:8080 | xargs kill -9
```

### File Upload Issues
- Maximum file size: 5MB
- Only CSV files accepted
- Ensure CSV has proper headers

### Template Validation
- All variables in template must exist in CSV
- Required fields: `templateKey`, `title`, `metaDescription`, `h1`, `variables`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with **MERN Stack** (MongoDB, Express, React, Node.js)
- **Vite** for fast frontend development
- **EJS** for server-side rendering
- **Papaparse** for CSV processing
- **Slugify** for URL generation

---

## 🎉 You're Ready to Go!

Your Programmatic SEO Tool is now set up and ready to generate hundreds of SEO-optimized pages automatically. Upload your CSV data, customize your templates, and watch your SEO pages come to life!

For questions or support, please open an issue on GitHub.