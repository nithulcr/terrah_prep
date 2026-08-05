# Terrah Qbank - Premium Exam Mock Test Platform

The premium exam mock test platform designed for Kerala PSC, SSC, Railway, Banking, and UPSC aspirants. Practice, track, and succeed with our comprehensive test series.

## 🚀 Features

### For Students
- **Mock Tests**: Access to comprehensive mock tests with 100 questions each
- **Real-time Testing**: Timed tests with question palette and progress tracking
- **Performance Analytics**: Track your progress with detailed analytics
- **Bookmarks**: Save important questions for later review
- **Category-wise Analysis**: Identify strong and weak areas
- **Multiple Subscription Plans**: Free, Starter (₹49/month), Pro (₹99/month), Elite (₹149/month)

### For Administrators
- **Admin Dashboard**: Complete platform overview with statistics
- **User Management**: View and manage user accounts
- **Question Management**: Create, edit, and bulk upload questions
- **Batch Management**: Organize questions into batches
- **Mock Test Management**: Create and assign mock tests
- **Payment Tracking**: Monitor subscriptions and payments

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email + Google)
- **Payments**: Razorpay Integration
- **Deployment**: Vercel
- **Icons**: Lucide React

## 📦 Project Structure

```
terrah-Qbank/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── layout.tsx    # Admin layout with sidebar
│   │   │   └── page.tsx      # Admin dashboard
│   │   ├── api/               # API routes
│   │   │   └── payments/      # Payment API endpoints
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify-email/
│   │   ├── dashboard/         # User dashboard
│   │   ├── mock-tests/        # Mock test pages
│   │   │   └── [id]/          # Individual test page
│   │   ├── bookmarks/         # User bookmarks
│   │   ├── pricing/           # Subscription plans
│   │   ├── checkout/          # Payment checkout
│   │   ├── payment/           # Payment success/failed
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── badge.tsx
│   │   └── layout/            # Layout components
│   │       ├── header.tsx
│   │       └── footer.tsx
│   ├── lib/
│   │   ├── supabase/          # Supabase clients
│   │   │   ├── client.ts
│   │   │   └── auth.ts
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── supabase-schema.sql        # Database schema
├── .env.example               # Environment variables template
├── vercel.json                # Vercel deployment config
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd terrah-Qbank
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay key secret
   - `NEXT_PUBLIC_APP_URL`: Your app URL (e.g., http://localhost:3000)

4. **Set up Supabase database**

   - Go to your Supabase project
   - Open the SQL Editor
   - Run the SQL from `supabase-schema.sql` to create all tables and policies

5. **Configure Supabase Auth**

   - Go to Authentication > Settings in Supabase
   - Enable Email authentication
   - Enable Google OAuth (configure with your Google Cloud credentials)
   - Set redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/verify-email`

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

The application uses the following main tables:

- **profiles**: User profiles with subscription info
- **subscriptions**: User subscription records
- **batches**: Question batch management
- **mock_tests**: Mock test definitions
- **questions**: Individual questions
- **question_options**: Question answer options
- **mock_test_questions**: Junction table for tests and questions
- **user_attempts**: User test attempts
- **user_answers**: User answers to questions
- **bookmarks**: User bookmarked questions
- **payments**: Payment records

All tables have Row Level Security (RLS) policies enabled for data protection.

## 🔐 Authentication

The app supports two authentication methods:

1. **Email/Password**: Traditional email and password authentication
2. **Google OAuth**: Sign in with Google account

Protected routes include:
- `/dashboard/*` - User dashboard
- `/bookmarks/*` - User bookmarks
- `/checkout/*` - Payment pages
- `/admin/*` - Admin panel (admin role required)

## 💳 Payment Integration

Razorpay is integrated for subscription payments:

- **Starter Plan**: ₹49/month (10 tests)
- **Pro Plan**: ₹99/month (30 tests)
- **Elite Plan**: ₹149/month (unlimited tests - coming soon)

Payment flow:
1. User selects a plan
2. Razorpay order is created
3. User completes payment
4. Payment is verified server-side
5. Subscription is activated

## 🎨 UI Components

Reusable UI components built with Tailwind CSS:

- **Button**: Multiple variants (primary, secondary, outline, ghost, danger)
- **Input**: Form inputs with labels and validation
- **Card**: Container components (Card, CardHeader, CardBody, CardFooter)
- **Badge**: Status badges with multiple variants

## 📱 Responsive Design

The application is fully responsive with mobile-first approach:

- Mobile: Single column layouts
- Tablet: 2-column grids
- Desktop: 3-4 column grids
- Hamburger menu for mobile navigation
- Touch-friendly interface

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

The `vercel.json` file is configured for optimal Vercel deployment.

### Environment Variables for Production

Set these in your Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_production_razorpay_key_id
RAZORPAY_KEY_SECRET=your_production_razorpay_key_secret
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL from `supabase-schema.sql` in the SQL Editor
3. Configure authentication providers
4. Set up email templates (optional)

### Razorpay Setup

1. Create a Razorpay account
2. Get your API keys from Settings > API Keys
3. Configure webhook URL for payment verification
4. Test with Razorpay test mode first

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Terrah Qbank - The Premium Exam Mock Test Platform

## 📞 Support

For support, email support@TerrahQbank.com or create an issue in the repository.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] More exam categories (SSC, Railway, Banking, UPSC)
- [ ] Live mock tests with rankings
- [ ] Video explanations
- [ ] Study materials and PDFs
- [ ] Discussion forums
- [ ] AI-powered performance analysis
- [ ] Multi-language support

---

Built with ❤️ for exam aspirants