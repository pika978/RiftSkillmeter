import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLearning } from '@/contexts/LearningContext';
import { PlayCircle, FileText, CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Roadmap() {
  const { currentRoadmap } = useLearning();
  const navigate = useNavigate();

  if (!currentRoadmap) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h2 className="font-heading text-2xl font-bold mb-2">No Roadmap Yet</h2>
          <p className="text-muted-foreground mb-6">Complete the onboarding to get your personalized roadmap.</p>
          <Button onClick={() => navigate('/onboarding')}>Get Started</Button>
        </div>
      </DashboardLayout>
    );
  }

  const { course, progress } = currentRoadmap;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-6">
          <img src={course.thumbnail} alt={course.title} className="w-full lg:w-64 h-40 rounded-xl object-cover" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">{course.difficulty}</Badge>
              <Badge variant="outline">{course.estimatedHours}h</Badge>
            </div>
            <h1 className="font-heading text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-muted-foreground mb-4">{course.description}</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <Button onClick={() => navigate('/learn')}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Chapters */}
        <Card>
          <CardHeader>
            <CardTitle>Course Outline</CardTitle>
            <CardDescription>{course.chapters.length} chapters • {course.chapters.reduce((acc, ch) => acc + ch.concepts.length, 0)} concepts</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {course.chapters.map((chapter, chapterIndex) => {
                const completedConcepts = chapter.concepts.filter(c => c.completed).length;
                const chapterProgress = Math.round((completedConcepts / chapter.concepts.length) * 100);
                
                return (
                  <AccordionItem key={chapter.id} value={chapter.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                          chapterProgress === 100 ? 'bg-success text-success-foreground' : 'bg-muted'
                        )}>
                          {chapterProgress === 100 ? <CheckCircle2 className="h-4 w-4" /> : chapterIndex + 1}
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="font-medium">{chapter.title}</h3>
                          <p className="text-sm text-muted-foreground">{completedConcepts}/{chapter.concepts.length} completed</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="space-y-2 ml-12">
                        {chapter.concepts.map((concept) => (
                          <div
                            key={concept.id}
                            onClick={() => navigate('/learn')}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                              concept.completed ? 'bg-success/10' : 'bg-muted/50 hover:bg-muted'
                            )}
                          >
                            {concept.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{concept.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {concept.duration} min
                              </div>
                            </div>
                            {concept.type === 'video' && <PlayCircle className="h-4 w-4 text-muted-foreground" />}
                            {concept.type === 'reading' && <FileText className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
