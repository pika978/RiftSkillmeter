import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLearning } from '@/contexts/LearningContext';
import { PlayCircle, FileText, CheckSquare, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockAssessments } from '@/data/mockData';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Learn() {
  const { currentRoadmap, markConceptComplete } = useLearning();
  const [currentTab, setCurrentTab] = useState('video');
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!currentRoadmap) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground mb-4">No active course</p>
          <Button onClick={() => navigate('/onboarding')}>Get Started</Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentChapter = currentRoadmap.course.chapters[currentRoadmap.currentChapter];
  const currentConcept = currentChapter?.concepts[currentRoadmap.currentConcept];
  const assessment = mockAssessments.find(a => a.conceptId === currentConcept?.id);

  const handleComplete = () => {
    if (currentConcept) {
      markConceptComplete(currentConcept.id);
      toast({ title: 'Concept completed! 🎉', description: 'Keep up the great work!' });
    }
  };

  const handleSubmitAssessment = () => {
    if (!assessment) return;
    
    let correct = 0;
    assessment.questions.forEach(q => {
      if (assessmentAnswers[q.id] === q.correctAnswer) correct++;
    });
    
    setShowResults(true);
    toast({
      title: `Score: ${correct}/${assessment.questions.length}`,
      description: correct === assessment.questions.length ? 'Perfect score!' : 'Keep practicing!',
    });
  };

  if (!currentConcept) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <CheckCircle2 className="h-16 w-16 text-success mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Course Completed! 🎉</h2>
          <p className="text-muted-foreground mb-6">You've finished all the content.</p>
          <Button onClick={() => navigate('/progress')}>View Progress</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground mb-1">{currentChapter.title}</p>
          <h1 className="font-heading text-2xl font-bold">{currentConcept.title}</h1>
          <p className="text-muted-foreground">{currentConcept.description}</p>
        </motion.div>

        {/* Content Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="video"><PlayCircle className="h-4 w-4 mr-2" />Video</TabsTrigger>
            <TabsTrigger value="notes"><FileText className="h-4 w-4 mr-2" />Notes</TabsTrigger>
            <TabsTrigger value="assessment"><CheckSquare className="h-4 w-4 mr-2" />Quiz</TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {currentConcept.videoUrl ? (
                  <div className="aspect-video">
                    <iframe
                      src={currentConcept.videoUrl}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                    <p className="text-muted-foreground">No video available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="p-6 prose prose-sm max-w-none">
                {currentConcept.notes ? (
                  <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                    {currentConcept.notes}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No notes available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessment" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {assessment ? (
                  <>
                    {assessment.questions.map((q, i) => (
                      <div key={q.id} className="space-y-3">
                        <p className="font-medium">{i + 1}. {q.question}</p>
                        <RadioGroup
                          value={assessmentAnswers[q.id]}
                          onValueChange={(v) => setAssessmentAnswers({ ...assessmentAnswers, [q.id]: v })}
                        >
                          {q.options?.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                              <Label htmlFor={`${q.id}-${option}`} className="cursor-pointer">{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                        {showResults && (
                          <p className={`text-sm ${assessmentAnswers[q.id] === q.correctAnswer ? 'text-success' : 'text-destructive'}`}>
                            {assessmentAnswers[q.id] === q.correctAnswer ? '✓ Correct!' : `✗ Correct answer: ${q.correctAnswer}`}
                          </p>
                        )}
                      </div>
                    ))}
                    <Button onClick={handleSubmitAssessment} disabled={Object.keys(assessmentAnswers).length < assessment.questions.length}>
                      Submit Answers
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">No quiz available for this concept</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/roadmap')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roadmap
          </Button>
          <Button onClick={handleComplete} disabled={currentConcept.completed}>
            {currentConcept.completed ? 'Completed' : 'Mark as Complete'} <CheckCircle2 className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
