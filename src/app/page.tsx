import Link from 'next/link';
import { Button } from '@/components/ui';
import { Header } from '@/components/layout';
import { Hero } from "@/components/hero";


import { Values } from "@/components/values";


import { BookOpen, Trophy, BarChart3, Bookmark, Clock, Shield } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: BookOpen,
      title: 'Quality Questions',
      description: 'Access a vast repository of carefully curated questions from Kerala PSC, SSC, Railway, Banking, and UPSC syllabi.',
    },
    {
      icon: Trophy,
      title: 'Performance Tracking',
      description: 'Track your progress with detailed analytics, identify weak areas, and improve your scores over time.',
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Get comprehensive insights into your performance with category-wise breakdowns and improvement suggestions.',
    },
    {
      icon: Bookmark,
      title: 'Bookmark Questions',
      description: 'Save important questions for later review. Build your personal question bank for effective revision.',
    },
    {
      icon: Clock,
      title: 'Real Exam Experience',
      description: 'Practice with timed mock tests that simulate the actual exam environment. Improve your time management skills.',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Your data is safe with us. We use industry-standard security measures to protect your information.',
    },
  ];

  const stats = [
    { label: 'Questions', value: '10,000+' },
    { label: 'Mock Tests', value: '500+' },
    { label: 'Active Users', value: '50,000+' },
    { label: 'Success Rate', value: '85%' },
  ];

  return (
    <div className="flex flex-col">
      <Header />
      <Hero />
    

      <Values />



     

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform provides all the tools and resources you need to prepare effectively for your exams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Get started in minutes and begin your journey to exam success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Account
              </h3>
              <p className="text-gray-600">
                Sign up for free and get instant access to our free mock test.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Take Mock Tests
              </h3>
              <p className="text-gray-600">
                Choose from our extensive collection of mock tests and practice at your own pace.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analyze & Improve
              </h3>
              <p className="text-gray-600">
                Review your performance, identify weak areas, and track your progress over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Your Preparation?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of successful candidates who have achieved their dreams with Terrah Prep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100">
                View Subscription Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}