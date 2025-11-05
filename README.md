# 📚 My Little Library

A beautiful, social book-sharing platform where you can manage your personal library, lend books to friends, and share free books with your community.

![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)

**Live Demo:** [Your Netlify URL here]

---

## ✨ Features

### 📖 Personal Library Management
- Add, edit, and organize your book collection
- Track book details: title, author, ISBN, genre, condition, and more
- Barcode scanning for quick ISBN entry
- Search and filter by title, author, or status
- Multiple view modes: Grid and stunning 3D bookshelf view

### 👥 Social Lending System
- Connect with friends and view their libraries
- Request to borrow books from friends
- Approve/deny lending requests
- Track due dates and overdue books
- Return pending status for easy book returns

### 🎁 Public Book Sharing
- Mark books as "free to good home" for public claiming
- Share free books directly to Facebook
- Public profile page (`/public/[username]`) for sharing your available books
- Claim and release system for community book circulation

### 🎨 Mood-Based Theming
Choose from 7 beautiful themes that transform the entire app:
- 🪵 **Cozy Library** - Warm, wooden vibes
- 🌙 **Midnight Study** - Dark, focused atmosphere
- ☀️ **Morning Glow** - Bright and energizing
- 🌲 **Forest Retreat** - Calm, natural greens
- ⚡ **Electric Dreams** - Vibrant and modern
- 💕 **Romance Novel** - Soft and romantic
- 🔮 **Mystical Realm** - Enchanting purples

### 📊 Dashboard Analytics
- Book statistics (total, available, borrowed, lending)
- Recent activity feed
- Quick actions for common tasks
- Achievement badges and progress tracking

### 🛡️ Admin Features
- User management
- Password reset capabilities
- System oversight tools

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.3** - React framework with App Router
- **React 19** - Latest UI library
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with custom themes

### Backend & Auth
- **Supabase** - PostgreSQL database + authentication
- **Supabase Auth Helpers** - Seamless session management

### Key Libraries
- **React Hook Form** + **Zod** - Form handling and validation
- **Lucide React** - Beautiful icon system
- **Quagga** - Barcode/ISBN scanning
- **date-fns** - Date manipulation
- **React Hot Toast** - User notifications

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- A Supabase account ([supabase.com](https://supabase.com))

### 1. Clone the Repository
```bash
git clone https://github.com/thelittlelibraryapp/little-library.git
cd little-library
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database migrations (schema coming soon - check Supabase dashboard)
3. Enable Authentication providers (Email, Google, etc.)
4. Set up Row Level Security (RLS) policies for your tables

**Required Tables:**
- `users` - User profiles and metadata
- `books` - Book collection data
- `friendships` - Friend connections
- `borrow_requests` - Lending request management
- `friend_invitations` - Pending friend invites

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Where to find these:**
- Go to your Supabase project → Settings → API
- Copy the Project URL and anon/public key

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Netlify

This project is optimized for Netlify deployment:

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
3. Add environment variables in Netlify dashboard
4. Deploy! 🎉

**Netlify Configuration:**
- Serverless functions are automatically handled
- Next.js API routes work seamlessly
- Continuous deployment from your main branch

---

## 📂 Project Structure

```
little-library/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # 29 API endpoints
│   │   ├── auth/              # Login, signup, callback pages
│   │   ├── library/           # Library management page
│   │   ├── friends/           # Friends management
│   │   ├── lending/           # Lending interface
│   │   ├── admin/             # Admin panel
│   │   ├── public/            # Public book sharing profiles
│   │   └── page.tsx           # Dashboard/home page
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── AddBookModal.tsx
│   │   ├── Bookshelf.tsx     # 3D shelf view
│   │   ├── MoodSelector.tsx
│   │   └── ...
│   ├── contexts/              # React Context providers
│   │   └── MoodContext.tsx   # Theme management
│   ├── lib/                   # Utilities
│   │   ├── supabase.ts       # Supabase client
│   │   └── useAuth.tsx       # Auth hook
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
├── .env.local                 # Environment variables (create this)
└── package.json
```

---

## 🎯 API Routes

The app includes 29 serverless API endpoints:

### Books
- `POST /api/books` - Add a new book
- `PUT /api/books/[id]` - Update book details
- `DELETE /api/books/[id]` - Delete a book
- `POST /api/books/[id]/claim` - Claim a free book
- `POST /api/books/[id]/release` - Release a claimed book
- `POST /api/books/upload-image` - Upload book cover image
- `PATCH /api/books/[id]/toggle-free` - Toggle "free to good home" status

### Lending
- `POST /api/borrow` - Create a borrow request
- `GET /api/borrow/requests` - Get pending requests
- `PUT /api/borrow/[id]` - Update request status
- `DELETE /api/borrow/[id]` - Cancel request

### Friends
- `POST /api/friends` - Send friend request
- `GET /api/friends` - Get friends list
- `DELETE /api/friends/[id]` - Remove friend
- `POST /api/friends/invite` - Send friend invitation

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/reset-password` - Reset user password

---

## 🎨 Customization

### Adding a New Mood Theme

Edit `src/contexts/MoodContext.tsx`:

```typescript
{
  id: 'your-theme',
  name: 'Your Theme Name',
  gradient: 'from-color-400 to-color-600',
  bgColor: 'bg-color-50',
  textColor: 'text-color-900',
  // ... more properties
}
```

Update `src/app/globals.css` with corresponding CSS variables.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Release Notes

Check out the [Releases](https://github.com/thelittlelibraryapp/little-library/releases) page for version history and patch notes.

The app automatically displays the latest release notes on the dashboard with a dismissible card.

---

## 🐛 Known Issues & Roadmap

### Current Limitations
- No automated tests yet (coming soon!)
- Book cover images require manual upload
- Email notifications not implemented

### Roadmap
- [ ] Add comprehensive test suite (Jest + React Testing Library)
- [ ] Integrate with Google Books API for automatic cover images
- [ ] Email notifications for due dates and requests
- [ ] PWA support for mobile app-like experience
- [ ] Reading progress tracking
- [ ] Book ratings and personal reviews
- [ ] Export/import library data (CSV/JSON)
- [ ] Reading goals and challenges

---

## 📄 License

[Add your license here - MIT, Apache 2.0, etc.]

---

## 💬 Support

Questions or feedback? Feel free to:
- Open an [issue](https://github.com/thelittlelibraryapp/little-library/issues)
- Reach out on [your contact method]

---

## 🙏 Acknowledgments

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Happy Reading! 📚✨**
