import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Target, BarChart3, Zap, CheckCircle2 } from 'lucide-react';

const features = [
  { icon: Target, title: 'Personalized Roadmaps', description: 'AI creates a custom learning path based on your goals and experience level.' },
  { icon: BookOpen, title: 'Curated Free Content', description: 'Learn from the best free resources, organized into structured lessons.' },
  { icon: BarChart3, title: 'Track Your Progress', description: 'Visual analytics to monitor your growth and identify weak areas.' },
  { icon: Zap, title: 'Smart Assessments', description: 'AI-powered quizzes that adapt to reinforce your learning.' },
];

const steps = [
  { step: '01', title: 'Tell Us Your Goal', description: 'Share what you want to learn and your current skill level.' },
  { step: '02', title: 'Get Your Roadmap', description: 'AI generates a personalized learning path just for you.' },
  { step: '03', title: 'Learn Daily', description: 'Watch videos, read notes, and complete assessments.' },
  { step: '04', title: 'Track & Improve', description: 'Monitor progress and master concepts through practice.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Turn free content into a{' '}
              <span className="gradient-text">structured learning journey</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              SkillMeter uses AI to create personalized roadmaps from the best free resources online. 
              Learn systematically, track progress, and achieve your goals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/signup')} className="w-full sm:w-auto">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="w-full sm:w-auto">
                Log In
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Everything you need to learn effectively</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Powerful features designed to accelerate your learning journey.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card p-6 rounded-xl border border-border card-hover"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Four simple steps to transform your learning.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-5xl font-heading font-bold text-primary/20 mb-4">{step.step}</div>
                <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Ready to start learning?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of learners who are achieving their goals with personalized AI-powered roadmaps.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/signup')}>
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
