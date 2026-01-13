import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

export function ReviewForm() {
    const [rating, setRating] = useState(5);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        // Logic to send review to backend would go here
        setTimeout(() => setSubmitted(false), 3000);
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Share Your Experience</CardTitle>
                <CardDescription>Tell us what you think about SkillMeter.</CardDescription>
            </CardHeader>
            <CardContent>
                {submitted ? (
                    <div className="text-center py-8 animate-in fade-in zoom-in">
                        <div className="text-4xl mb-4">🎉</div>
                        <h3 className="font-semibold text-xl mb-2">Thank you!</h3>
                        <p className="text-muted-foreground">Your review has been submitted successfully.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`h-6 w-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Input placeholder="Your Name" required />
                        </div>

                        <div className="space-y-2">
                            <Input placeholder="@twitter_handle (optional)" />
                        </div>

                        <div className="space-y-2">
                            <Textarea
                                placeholder="What did you like about SkillMeter?"
                                className="min-h-[100px]"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full">
                            Submit Review
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
