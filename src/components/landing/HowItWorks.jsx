import { motion, useScroll } from "framer-motion";
import { useRef } from "react";
import { Target, Zap, Trophy, Share2 } from "lucide-react";

const steps = [
    {
        number: "01",
        icon: Target,
        title: "Choose Your Skill",
        description: "Select from hundreds of skills across tech, design, business, and more. Pick what you want to prove.",
        color: "bg-primary",
    },
    {
        number: "02",
        icon: Zap,
        title: "Take Assessment",
        description: "Face our AI-powered rigorous tests. Real scenarios, practical challenges, no memorization.",
        color: "bg-secondary",
    },
    {
        number: "03",
        icon: Trophy,
        title: "Get Verified",
        description: "Earn your certificate with detailed performance metrics. Proof that employers actually trust.",
        color: "bg-verdict-pass",
    },
    {
        number: "04",
        icon: Share2,
        title: "Showcase It",
        description: "Add to your portfolio, LinkedIn, resume. Stand out with verified skills, not just claims.",
        color: "bg-highlight",
    },
];

export function HowItWorks() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    return (
        <section ref={containerRef} className="relative py-32 overflow-hidden bg-concrete">
            {/* Section Header */}
            <div className="container mx-auto px-6 mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <div className="inline-block px-6 py-2 bg-void text-paper font-bold text-sm mb-4 shadow-brutalist">
                        THE PROCESS
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black mb-6 uppercase">
                        How It Works
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-bold">
                        Four simple steps to turn your learning into verified credentials
                    </p>
                </motion.div>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative">
                <div className="container mx-auto px-6">
                    <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
                        {steps.map((step, index) => {
                            const Icon = step.icon;

                            return (
                                <motion.div
                                    key={step.number}
                                    initial={{ opacity: 0, x: 100 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="flex-shrink-0 w-[350px] md:w-[400px] snap-center group"
                                >
                                    {/* Card */}
                                    <div className="relative bg-paper border-4 border-void shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-300 p-8 h-full">
                                        {/* Number Badge */}
                                        <div className={`absolute -top-6 -left-6 w-20 h-20 ${step.color} border-4 border-void shadow-brutalist flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300`}>
                                            <span className="text-3xl font-black text-void">{step.number}</span>
                                        </div>

                                        {/* Icon */}
                                        <div className="mb-6 mt-8">
                                            <div className="w-16 h-16 border-4 border-void bg-paper shadow-brutalist flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <Icon className="w-8 h-8 text-void" strokeWidth={3} />
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-2xl font-black mb-4 uppercase border-l-4 border-primary pl-4">
                                            {step.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-base font-bold text-muted-foreground leading-relaxed">
                                            {step.description}
                                        </p>

                                        {/* Decorative Element */}
                                        <div className="absolute bottom-8 right-8 w-12 h-12 border-4 border-void opacity-10 group-hover:opacity-30 transition-opacity duration-300" />
                                    </div>

                                    {/* Arrow Connector (except last) */}
                                    {index < steps.length - 1 && (
                                        <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 hidden md:block">
                                            <div className="w-0 h-0 border-t-[20px] border-t-transparent border-l-[30px] border-l-void border-b-[20px] border-b-transparent" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex justify-center mt-8 gap-2"
                >
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className="w-12 h-2 border-2 border-void bg-muted hover:bg-void transition-colors cursor-pointer"
                        />
                    ))}
                </motion.div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-20 right-10 w-32 h-32 border-4 border-void opacity-5 rotate-12" />
            <div className="absolute bottom-20 left-10 w-24 h-24 bg-primary opacity-5" />
        </section>
    );
}
