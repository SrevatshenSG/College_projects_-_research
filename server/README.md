# AdGen Server - Backend API

Express.js server with MongoDB and OpenAI integration for the AdGen AI campaign generator.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- OpenAI API key

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file in the server directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB Configuration
   MONGO_URI=mongodb://localhost:27017/adgen

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
server/
├── src/
│   ├── models/
│   │   └── Campaign.ts          # Mongoose Campaign model
│   ├── routes/
│   │   ├── campaigns.ts         # Campaign CRUD routes
│   │   └── generate.ts          # AI generation route
│   ├── services/
│   │   └── aiService.ts         # OpenAI integration
│   ├── db.ts                    # MongoDB connection
│   └── index.ts                 # Express server setup
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

## 🔧 API Endpoints

### Campaign Management
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get specific campaign
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### AI Generation
- `POST /api/generate` - Generate creative content

### Health Check
- `GET /health` - Server health status

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run clean        # Clean build directory
```

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/adgen` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🗄️ Database Schema

### Campaign Model
```typescript
interface Campaign {
  name: string;           // Required
  product: string;        // Required
  audience: string;       // Required
  budget: number;         // Required, min: 0
  platform: Platform;     // Required: facebook|instagram|google|linkedin
  headline?: string;      // Optional
  description?: string;   // Optional
  imageUrl?: string;      // Optional, URL validation
  createdAt: Date;        // Auto-generated
  updatedAt: Date;        // Auto-generated
}
```

## 🤖 AI Generation

The server uses OpenAI's GPT-3.5-turbo to generate:
- **Headlines**: Compelling ad headlines (max 60 chars)
- **Descriptions**: Detailed ad descriptions (max 150 chars)
- **Variants**: Alternative headline options
- **Image URLs**: Mock image URLs from Unsplash

### Generation Process
1. **Main Content**: Generate primary headline and description
2. **Variants**: Create alternative headline approaches
3. **Image**: Generate relevant Unsplash image URL
4. **Fallback**: Return default content if AI fails

## 🔧 Development

### MongoDB Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Create database named `adgen`
3. Update `MONGO_URI` in `.env`

### OpenAI Setup
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env` as `OPENAI_API_KEY`

### TypeScript
- Strict mode enabled
- ES modules support
- Source maps for debugging
- Declaration files generated

## 🚀 Production

### Build
```bash
npm run build
```

### Start
```bash
npm start
```

### Environment
Set `NODE_ENV=production` for production deployment.

## 🔍 Error Handling

- **Validation Errors**: 400 Bad Request
- **Not Found**: 404 Not Found
- **Server Errors**: 500 Internal Server Error
- **Detailed Logging**: Console output for debugging

## 🔒 Security

- **CORS**: Configured for frontend origin
- **Input Validation**: Mongoose schema validation
- **Error Sanitization**: Hide sensitive data in production
- **Rate Limiting**: Consider adding for production

## 📊 Monitoring

- **Health Check**: `/health` endpoint
- **Logging**: Console output with timestamps
- **Graceful Shutdown**: SIGTERM/SIGINT handling

---

**Built with Express.js, MongoDB, and OpenAI** 