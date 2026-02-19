import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLearning } from '@/contexts/LearningContext';
import { useAuth } from '@/contexts/AuthContext';
import { PlayCircle, FileText, CheckSquare, CheckCircle2, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
// import { mockAssessments } from '@/data/mockData'; // Removed
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

// Helper to convert YouTube URLs to embed format
const convertToEmbedUrl = (url) => {
  if (!url) return null;

  // Already an embed URL
  if (url.includes('youtube.com/embed/')) return url;

  // Watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  // Short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  // Search results URL - can't embed, return null to show fallback
  if (url.includes('youtube.com/results')) return null;

  return url; // Return as-is for other URLs
};

export default function Learn() {
  const { currentRoadmap, markConceptComplete, selectConcept, submitAssessment } = useLearning();
  const { authFetch } = useAuth();
  const [currentTab, setCurrentTab] = useState('video');
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [notes, setNotes] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001/api');

  // Generate notes on-demand when Notes tab is clicked
  const handleGenerateNotes = async (conceptId) => {
    if (notes || notesLoading) return; // Already loaded or loading
    setNotesLoading(true);
    try {
      const response = await authFetch(`${API_URL}/concepts/${conceptId}/generate-notes/`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
        if (!data.cached) {
          toast({ title: 'Notes Generated! 📝', description: 'AI-powered notes are ready.' });
        }
      } else {
        toast({ title: 'Error', description: 'Failed to generate notes', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Notes generation error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setNotesLoading(false);
    }
  };

  // Generate quiz on-demand when Quiz tab is clicked
  const handleGenerateQuiz = async (conceptId) => {
    if (quiz || quizLoading) return; // Already loaded or loading
    setQuizLoading(true);
    try {
      const response = await authFetch(`${API_URL}/concepts/${conceptId}/generate-quiz/`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setQuiz(data.quiz);
        setAssessmentId(data.assessment_id);  // store ID for backend submission
        if (!data.cached) {
          toast({ title: 'Quiz Generated! 🧠', description: 'Test your knowledge!' });
        }
      } else {
        toast({ title: 'Error', description: 'Failed to generate quiz', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setQuizLoading(false);
    }
  };

  // Handle tab change - trigger generation when switching to Notes or Quiz
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    if (tab === 'notes' && currentConcept) {
      handleGenerateNotes(currentConcept.id);
    } else if (tab === 'assessment' && currentConcept) {
      handleGenerateQuiz(currentConcept.id);
    }
  };

  if (!currentRoadmap) {
    return (<DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">No active course</p>
        <Button onClick={() => navigate('/onboarding')}>Get Started</Button>
      </div>
    </DashboardLayout>);
  }
  const currentChapter = currentRoadmap.course.chapters[currentRoadmap.currentChapter];
  const currentConcept = currentChapter?.concepts[currentRoadmap.currentConcept];
  // const assessment = mockAssessments.find(a => a.conceptId === currentConcept?.id); // Removed
  const handleComplete = async () => {
    if (currentConcept) {
      await markConceptComplete(currentConcept.id);
      toast({ title: 'Concept completed! 🎉', description: 'Loading next module...' });

      // Clear current session state
      setNotes(null);
      setQuiz(null);
      setAssessmentAnswers({});
      setShowResults(false);
      setAssessmentResult(null);
      setAssessmentId(null);
      setCurrentTab('video');

      // Calculate next concept/chapter indices
      const currentChapterIdx = currentRoadmap.currentChapter || 0;
      const currentConceptIdx = currentRoadmap.currentConcept || 0;
      const chapters = currentRoadmap.course.chapters;
      const currentChapterData = chapters[currentChapterIdx];

      let nextChapterIdx = currentChapterIdx;
      let nextConceptIdx = currentConceptIdx + 1;

      // If we've reached the end of this chapter, move to next chapter
      if (nextConceptIdx >= currentChapterData.concepts.length) {
        nextChapterIdx = currentChapterIdx + 1;
        nextConceptIdx = 0;
      }

      // Check if course is complete
      if (nextChapterIdx >= chapters.length) {
        toast({ title: 'Course Complete! 🎓', description: 'Congratulations!' });
        navigate('/roadmap');
        return;
      }

      // Navigate to next concept
      selectConcept(nextChapterIdx, nextConceptIdx);
    }
  };
  const handleSubmitAssessment = async () => {
    const quizQuestions = quiz || [];
    if (quizQuestions.length === 0) return;

    // Calculate score locally
    let correct = 0;
    quizQuestions.forEach((q, i) => {
      if (assessmentAnswers[i] === q.correctAnswer || assessmentAnswers[q.id] === q.correctAnswer)
        correct++;
    });
    const scorePercent = Math.round((correct / quizQuestions.length) * 100);
    setShowResults(true);

    // Submit to backend (triggers badge NFT + $SKILL rewards)
    if (assessmentId) {
      setSubmitting(true);
      try {
        const result = await submitAssessment(
          assessmentId,
          scorePercent,
          Object.entries(assessmentAnswers).map(([k, v]) => ({ question_index: k, answer: v }))
        );
        setAssessmentResult(result);
        if (result?.badge_asset_id) {
          toast({
            title: `🏅 Skill Badge NFT Minted! Score: ${scorePercent}%`,
            description: `ASA #${result.badge_asset_id} on Algorand TestNet — check your Profile!`,
          });
        } else {
          toast({
            title: `Score: ${correct}/${quizQuestions.length} (${scorePercent}%)`,
            description: correct === quizQuestions.length ? '🌟 Perfect score! Bonus $SKILL earned!' : 'Keep practicing!',
          });
        }
      } catch (e) {
        console.error('Submit error:', e);
        toast({ title: `Score: ${correct}/${quizQuestions.length} (${scorePercent}%)`, description: 'Keep practicing!' });
      } finally {
        setSubmitting(false);
      }
    } else {
      // No assessment_id (quiz not from DB) - just show local result
      toast({
        title: `Score: ${correct}/${quizQuestions.length} (${scorePercent}%)`,
        description: correct === quizQuestions.length ? '🌟 Perfect score!' : 'Keep practicing!',
      });
    }
  };
  if (!currentConcept) {
    return (<DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <CheckCircle2 className="h-16 w-16 text-success mb-4" />
        <h2 className="font-heading text-2xl font-bold mb-2">Course Completed! 🎉</h2>
        <p className="text-muted-foreground mb-6">You've finished all the content.</p>
        <Button onClick={() => navigate('/progress')}>View Progress</Button>
      </div>
    </DashboardLayout>);
  }
  return (<DashboardLayout>
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground mb-1">{currentChapter.title}</p>
        <h1 className="font-heading text-2xl font-bold">{currentConcept.title}</h1>
        <p className="text-muted-foreground">{currentConcept.description}</p>
      </motion.div>

      {/* Content Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 rounded-none border-2 border-black bg-white h-auto p-0">
          <TabsTrigger value="video" className="rounded-none border-r-2 border-black data-[state=active]:bg-black data-[state=active]:text-white h-12 bg-transparent"><PlayCircle className="h-4 w-4 mr-2" />Video</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-none border-r-2 border-black data-[state=active]:bg-black data-[state=active]:text-white h-12 bg-transparent"><FileText className="h-4 w-4 mr-2" />Notes</TabsTrigger>
          <TabsTrigger value="assessment" className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white h-12 bg-transparent"><CheckSquare className="h-4 w-4 mr-2" />Quiz</TabsTrigger>
        </TabsList>



        <TabsContent value="video" className="mt-4">
          <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
            <CardContent className="p-0">
              {(() => {
                const embedUrl = convertToEmbedUrl(currentConcept.videoUrl);
                if (embedUrl) {
                  return (

                    <div className="aspect-video">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full rounded-none border-2 border-black"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );

                } else if (currentConcept.videoUrl) {
                  return (
                    <div className="aspect-video bg-muted flex flex-col items-center justify-center rounded-lg gap-4">
                      <PlayCircle className="h-16 w-16 text-muted-foreground" />
                      <p className="text-muted-foreground">Video cannot be embedded</p>
                      <Button asChild>
                        <a href={currentConcept.videoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in YouTube
                        </a>
                      </Button>
                    </div>
                  );
                } else {
                  return (
                    <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                      <p className="text-muted-foreground">No video available</p>
                    </div>
                  );
                }
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
            <CardContent className="p-6 prose prose-sm max-w-none">
              {notesLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating AI notes...</p>
                </div>
              ) : notes ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{notes}</ReactMarkdown>
                </div>
              ) : currentConcept.notes && !currentConcept.notes.includes('*Notes will be generated') ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{currentConcept.notes}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Notes not generated yet</p>
                  <Button onClick={() => handleGenerateNotes(currentConcept.id)}>
                    <FileText className="mr-2 h-4 w-4" /> Generate Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="mt-4">
          <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
            <CardHeader>
              <CardTitle>Knowledge Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {quizLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating AI quiz...</p>
                </div>
              ) : quiz && quiz.length > 0 ? (
                <>
                  {quiz.map((q, i) => (
                    <div key={i} className="space-y-3">
                      <p className="font-medium">{i + 1}. {q.question}</p>
                      <RadioGroup
                        value={assessmentAnswers[i]}
                        onValueChange={(v) => setAssessmentAnswers({ ...assessmentAnswers, [i]: v })}
                      >
                        {q.options?.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${i}-${option}`} />
                            <Label htmlFor={`${i}-${option}`} className="cursor-pointer">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {showResults && (
                        <p className={`text-sm ${assessmentAnswers[i] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                          {assessmentAnswers[i] === q.correctAnswer ? '✓ Correct!' : `✗ Correct answer: ${q.correctAnswer}`}
                        </p>
                      )}
                      {showResults && q.explanation && (
                        <p className="text-sm text-muted-foreground italic">{q.explanation}</p>
                      )}
                    </div>
                  ))}
                  {assessmentResult?.badge_asset_id && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border-2 border-yellow-400 rounded text-sm">
                      <span>🏅</span>
                      <span className="font-bold text-yellow-800">Badge NFT Minted!</span>
                      <a
                        href={`https://lora.algokit.io/testnet/asset/${assessmentResult.badge_asset_id}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-blue-700 underline font-mono text-xs"
                      >ASA #{assessmentResult.badge_asset_id}</a>
                    </div>
                  )}
                  <Button
                    onClick={handleSubmitAssessment}
                    disabled={Object.keys(assessmentAnswers).length < quiz.length || submitting || showResults}
                  >
                    {submitting ? '⏳ Submitting...' : showResults ? '✓ Submitted' : 'Submit Answers'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Quiz not generated yet</p>
                  <Button onClick={() => handleGenerateQuiz(currentConcept.id)}>
                    <CheckSquare className="mr-2 h-4 w-4" /> Generate Quiz
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/roadmap')}
          className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all bg-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roadmap
        </Button>
        <Button
          onClick={handleComplete}
          disabled={currentConcept.completed}
          className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all bg-black text-white hover:bg-black/90"
        >
          {currentConcept.completed ? 'Completed' : 'Mark as Complete'} <CheckCircle2 className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div >
  </DashboardLayout >);
}
