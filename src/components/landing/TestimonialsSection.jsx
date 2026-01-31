import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import Marquee from '@/components/ui/marquee';

// Testimonials data
const testimonials = [
    {
        name: 'Ava Green',
        username: '@ava',
        body: 'SkillMeter transformed my learning journey!',
        img: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Ava',
        country: '🇦🇺',
    },
    {
        name: 'Ana Miller',
        username: '@ana',
        body: 'Best assessment platform ever!',
        img: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Ana',
        country: '🇩🇪',
    },
    {
        name: 'Mateo Rossi',
        username: '@mat',
        body: 'The AI feedback is incredible!',
        img: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Mateo',
        country: '🇮🇹',
    },
    {
        name: 'Maya Patel',
        username: '@maya',
        body: 'Finally, verified skill proof!',
        img: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Maya',
        country: '🇮🇳',
    },
    {
        name: 'Noah Smith',
        username: '@noah',
        body: 'Game-changing for job seekers!',
        img: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Noah',
        country: '🇺🇸',
    },
    {
        name: 'Lucas Stone',
        username: '@luc',
        body: 'Love the rigorous assessments!',
        img: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Lucas',
        country: '🇫🇷',
    },
    {
        name: 'Haruto Sato',
        username: '@haru',
        body: 'Impressive AI-powered questions!',
        img: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Haruto',
        country: '🇯🇵',
    },
    {
        name: 'Emma Lee',
        username: '@emma',
        body: 'Perfect for portfolio building!',
        img: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Emma',
        country: '🇨🇦',
    },
    {
        name: 'Carlos Ray',
        username: '@carl',
        body: 'Real skills, real validation!',
        img: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Carlos',
        country: '🇪🇸',
    },
];

function TestimonialCard({ img, name, username, body, country }) {
    return (
        <Card className="w-64 border-4 border-void shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-paper hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b-4 border-void">
                    <Avatar className="size-12 border-4 border-void shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <AvatarImage src={img} alt={name} />
                        <AvatarFallback className="bg-primary text-paper font-black text-lg border-4 border-void">{name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <figcaption className="text-sm font-black text-void flex items-center gap-1.5 uppercase tracking-tight">
                            {name} <span className="text-base">{country}</span>
                        </figcaption>
                        <p className="text-xs font-bold text-muted-foreground uppercase">{username}</p>
                    </div>
                </div>
                <blockquote className="text-sm font-bold text-void leading-tight border-l-4 border-primary pl-3 bg-concrete/30 py-2">
                    "{body}"
                </blockquote>
            </CardContent>
        </Card>
    );
}

export function TestimonialsSection() {
    return (
        <section className="relative py-20 geo-bg overflow-hidden">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <div className="inline-block px-6 py-2 bg-void text-paper font-bold text-sm mb-4 shadow-brutalist">
                        WALL OF PROOF
                    </div>
                    <h2 className="text-5xl md:text-6xl font-bold mb-4">
                        Real Users, Real Results
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        See what our community says about turning learning into verified skills
                    </p>
                </motion.div>

                <div className="relative flex h-[500px] w-full flex-row items-center justify-center overflow-hidden gap-1.5 border-4 border-void shadow-brutalist bg-paper rounded-none"
                    style={{ perspective: '300px' }}
                >
                    <div
                        className="flex flex-row items-center gap-4"
                        style={{
                            transform: 'translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)',
                        }}
                    >
                        {/* Vertical Marquee (downwards) */}
                        <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
                            {testimonials.map((review) => (
                                <TestimonialCard key={review.username} {...review} />
                            ))}
                        </Marquee>
                        {/* Vertical Marquee (upwards) */}
                        <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
                            {testimonials.map((review) => (
                                <TestimonialCard key={review.username} {...review} />
                            ))}
                        </Marquee>
                        {/* Vertical Marquee (downwards) */}
                        <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
                            {testimonials.map((review) => (
                                <TestimonialCard key={review.username} {...review} />
                            ))}
                        </Marquee>
                        {/* Vertical Marquee (upwards) */}
                        <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
                            {testimonials.map((review) => (
                                <TestimonialCard key={review.username} {...review} />
                            ))}
                        </Marquee>
                    </div>

                    {/* Gradient overlays */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-paper"></div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-paper"></div>
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-paper"></div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-paper"></div>
                </div>
            </div>
        </section>
    );
}
