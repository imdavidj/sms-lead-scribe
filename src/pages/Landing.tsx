import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageSquare, Bot, Target, Zap, Users, TrendingUp, 
  CheckCircle, Star, ArrowRight, Phone, Shield, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Responses",
      description: "Smart AI automatically handles lead conversations with human-like responses",
      color: "text-purple-600"
    },
    {
      icon: Target,
      title: "Lead Qualification",
      description: "Instantly qualify leads with intelligent conversation analysis",
      color: "text-blue-600"
    },
    {
      icon: Zap,
      title: "Smart Lead Scoring",
      description: "AI analyzes behavior patterns to prioritize your hottest prospects",
      color: "text-green-600"
    },
    {
      icon: TrendingUp,
      title: "Real-Time Analytics",
      description: "Track performance with detailed analytics and conversion metrics",
      color: "text-orange-600"
    }
  ];

  const detailedFeatures = [
    {
      category: "AI Intelligence",
      items: [
        { name: "Natural Language Processing", description: "Understands context and intent in conversations" },
        { name: "Sentiment Analysis", description: "Detects buyer motivation and urgency levels" },
        { name: "Smart Response Generation", description: "Creates personalized responses that convert" },
        { name: "Learning Algorithm", description: "Gets smarter with every conversation" }
      ]
    },
    {
      category: "Lead Management",
      items: [
        { name: "Automated Lead Scoring", description: "AI scores leads based on 50+ data points" },
        { name: "Pipeline Tracking", description: "Visual pipeline with automated stage progression" },
        { name: "Follow-up Automation", description: "Never miss a follow-up opportunity" },
        { name: "Lead Source Attribution", description: "Track which campaigns bring the best leads" }
      ]
    },
    {
      category: "Communication",
      items: [
        { name: "Multi-Channel Messaging", description: "SMS, email, and voice in one platform" },
        { name: "Template Library", description: "Pre-built templates for every scenario" },
        { name: "Smart Scheduling", description: "AI finds the best time to contact each lead" },
        { name: "Bulk Messaging", description: "Send personalized messages to thousands at once" }
      ]
    },
    {
      category: "Analytics & Reporting",
      items: [
        { name: "Conversion Tracking", description: "See exactly which messages close deals" },
        { name: "Performance Dashboard", description: "Real-time metrics and KPIs" },
        { name: "ROI Calculator", description: "Track revenue generated from each campaign" },
        { name: "Team Performance", description: "Compare agent performance and best practices" }
      ]
    }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "$97",
      period: "/month",
      description: "Perfect for individual agents getting started",
      features: [
        "Up to 500 leads/month",
        "AI conversation handling",
        "Basic lead scoring",
        "SMS & email automation",
        "Standard support",
        "Mobile app access"
      ],
      buttonText: "Start Free Trial",
      popular: false,
      color: "border-gray-200"
    },
    {
      name: "Professional",
      price: "$197",
      period: "/month",
      description: "Ideal for growing teams and brokerages",
      features: [
        "Up to 2,000 leads/month",
        "Advanced AI responses",
        "Smart lead scoring",
        "Multi-channel automation",
        "Priority support",
        "Team collaboration tools",
        "Custom integrations",
        "Advanced analytics"
      ],
      buttonText: "Start Free Trial",
      popular: true,
      color: "border-purple-500"
    },
    {
      name: "Enterprise",
      price: "$497",
      period: "/month",
      description: "For large teams that need everything",
      features: [
        "Unlimited leads",
        "White-label solution",
        "Custom AI training",
        "Dedicated account manager",
        "24/7 premium support",
        "Custom integrations",
        "Advanced reporting",
        "API access",
        "HIPAA compliance"
      ],
      buttonText: "Contact Sales",
      popular: false,
      color: "border-gray-200"
    }
  ];

  const benefits = [
    "Save 10+ hours per week on lead follow-up",
    "Increase response rates by 300%",
    "Never miss a hot lead again",
    "Scale your real estate business effortlessly"
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Real Estate Agent",
      company: "Premium Properties",
      content: "This AI SMS system has completely transformed my lead generation. I'm closing 40% more deals!",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Team Leader",
      company: "City Realty Group",
      content: "The AI conversations are so natural, leads think they're talking to a human. Game changer!",
      rating: 5
    },
    {
      name: "Emily Chen",
      role: "Broker",
      company: "Coastal Real Estate",
      content: "ROI was immediate. The system paid for itself in the first month from just 3 closed deals.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">SMS AI Pro</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Reviews</a>
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="mr-2"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/5 to-green-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200">
            🚀 NEW! AI v4 released - 94% accuracy rate
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            The All-In-One
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent"> AI SMS</span>
            <br />
            Lead Conversion Platform
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Effortlessly manage your real estate leads with AI-powered SMS conversations that qualify prospects, 
            book appointments, and close deals while you sleep.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate('/dashboard')}
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-gray-300 hover:border-gray-400 px-8 py-4 text-lg rounded-xl"
            >
              Watch Demo
            </Button>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="ml-4 text-sm text-gray-500">SMS AI Dashboard</span>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <span className="text-2xl font-bold text-green-700">247</span>
                      </div>
                      <p className="text-green-600 font-medium">Qualified Leads</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <MessageSquare className="w-8 h-8 text-blue-600" />
                        <span className="text-2xl font-bold text-blue-700">94.3%</span>
                      </div>
                      <p className="text-blue-600 font-medium">Response Rate</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-purple-200 bg-purple-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-700">$127K</span>
                      </div>
                      <p className="text-purple-600 font-medium">Revenue Generated</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-green-600/20 rounded-3xl blur-xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 mb-8 text-lg">Trusted by the top real estate teams</p>
          <div className="flex justify-center items-center gap-12 opacity-60">
            <div className="text-2xl font-bold text-gray-400">REMAX</div>
            <div className="text-2xl font-bold text-gray-400">Keller Williams</div>
            <div className="text-2xl font-bold text-gray-400">Century 21</div>
            <div className="text-2xl font-bold text-gray-400">Coldwell Banker</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start converting more leads in just 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload Your Lists</h3>
              <p className="text-gray-600 text-lg">
                Import your leads from any source - spreadsheets, CRM, or lead generation tools. Our AI instantly analyzes each prospect.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Starts Conversations</h3>
              <p className="text-gray-600 text-lg">
                Our AI automatically reaches out to sellers with personalized messages, handles responses, and qualifies their motivation to sell.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Close More Deals</h3>
              <p className="text-gray-600 text-lg">
                Get hot, qualified leads delivered to your dashboard. Focus your time only on motivated sellers ready to make a deal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`relative ${tier.color} ${tier.popular ? 'ring-2 ring-purple-500 shadow-xl scale-105' : 'shadow-lg'}`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <p className="text-gray-600 mb-4">{tier.description}</p>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                      <span className="text-gray-600">{tier.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full py-3 ${tier.popular 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                    onClick={() => navigate('/dashboard')}
                  >
                    {tier.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Need a custom solution? We've got you covered.
            </p>
            <Button variant="outline" className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SMS AI Pro?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI just doesn't talk to sellers, it builds relationships, qualifies leads, and closes deals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all group">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 ${feature.color} bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-8">Transform Your Business Today</h3>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0" />
                      <span className="text-lg">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <Phone className="w-8 h-8 text-white" />
                  <span className="text-xl font-semibold">Live AI Conversation</span>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="bg-white/20 rounded-lg p-3">
                    <strong>Lead:</strong> "Is this property still available?"
                  </div>
                  <div className="bg-blue-500/30 rounded-lg p-3 ml-4">
                    <strong>AI:</strong> "Yes! I'd love to tell you more about it. When would be a good time for a quick call to discuss your needs?"
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <strong>Lead:</strong> "How about tomorrow at 2pm?"
                  </div>
                  <div className="bg-blue-500/30 rounded-lg p-3 ml-4">
                    <strong>AI:</strong> "Perfect! I'll send you a calendar invite. What's your email?"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of real estate professionals who've transformed their business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to 10X Your Lead Conversion?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join 5,000+ real estate professionals who've transformed their business with AI SMS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl shadow-lg font-semibold"
              onClick={() => navigate('/dashboard')}
            >
              Start Your Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg rounded-xl"
            >
              Schedule Demo
            </Button>
          </div>
          <div className="flex justify-center items-center gap-2 text-white/80 mt-4">
            <Shield className="w-5 h-5" />
            <span>No credit card required • 14-day free trial</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-8 h-8 text-purple-400" />
                <span className="text-xl font-bold">SMS AI Pro</span>
              </div>
              <p className="text-gray-400">
                The future of real estate lead conversion is here.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SMS AI Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};