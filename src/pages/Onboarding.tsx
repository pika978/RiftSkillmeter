import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { useLearning } from '@/contexts/LearningContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { SkillLevel, OnboardingData } from '@/types';
import { availableLanguages, availableTools, learningGoals } from '@/data/mockData';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const skillLevels: { value: SkillLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting out, little to no experience' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience, know the basics' },
  { value: 'advanced', label: 'Advanced', description: 'Solid experience, looking to master' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);

  const { completeOnboarding } = useAuth();
  const { generateRoadmap, courses } = useLearning();
  const navigate = useNavigate();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const toggleItem = (item: string, list: string[], setList: (items: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    const onboardingData: OnboardingData = {
      skillLevel,
      knownLanguages: selectedLanguages,
      knownTools: selectedTools,
      learningGoal: selectedGoal,
      dailyMinutes,
    };
    
    completeOnboarding(onboardingData);
    
    // Map goal to course
    const courseMap: Record<string, string> = {
      'react': 'course-react',
      'python-dsa': 'course-python-dsa',
      'web-basics': 'course-web-basics',
    };
    
    const courseId = courseMap[selectedGoal] || 'course-react';
    await generateRoadmap(courseId);
    
    navigate('/roadmap');
  };

  return (
    <PublicLayout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
              <Progress value={progress} className="w-32 h-2" />
            </div>
            <CardTitle className="font-heading text-2xl">
              {step === 1 && "What's your skill level?"}
              {step === 2 && "What do you already know?"}
              {step === 3 && "What do you want to learn?"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "This helps us customize your learning path."}
              {step === 2 && "Select languages and tools you're familiar with."}
              {step === 3 && "Choose your primary learning goal."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                {step === 1 && (
                  <div className="grid gap-3">
                    {skillLevels.map((level) => (
                      <div
                        key={level.value}
                        onClick={() => setSkillLevel(level.value)}
                        className={cn(
                          'p-4 rounded-lg border-2 cursor-pointer transition-all',
                          skillLevel === level.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        )}
                      >
                        <h3 className="font-medium">{level.label}</h3>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {availableLanguages.map((lang) => (
                          <Badge
                            key={lang}
                            variant={selectedLanguages.includes(lang) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleItem(lang, selectedLanguages, setSelectedLanguages)}
                          >
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Tools & Frameworks</h4>
                      <div className="flex flex-wrap gap-2">
                        {availableTools.map((tool) => (
                          <Badge
                            key={tool}
                            variant={selectedTools.includes(tool) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleItem(tool, selectedTools, setSelectedTools)}
                          >
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="grid gap-3">
                      {learningGoals.slice(0, 3).map((goal) => (
                        <div
                          key={goal.id}
                          onClick={() => setSelectedGoal(goal.id)}
                          className={cn(
                            'p-4 rounded-lg border-2 cursor-pointer transition-all',
                            selectedGoal === goal.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          )}
                        >
                          <h3 className="font-medium">{goal.label}</h3>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Daily learning time: {dailyMinutes} minutes</h4>
                      <Slider value={[dailyMinutes]} onValueChange={([v]) => setDailyMinutes(v)} min={15} max={120} step={15} />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              {step < totalSteps ? (
                <Button onClick={() => setStep(s => s + 1)}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={!selectedGoal || isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate My Roadmap
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
