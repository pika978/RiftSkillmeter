import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrowdCanvas } from "@/components/ui/CrowdCanvas";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    },
};

const proofPoints = [
    {
        icon: CheckCircle2,
        title: "Verified Skills",
        description: "AI-powered assessments that validate real competency, not just completion.",
    },
    {
        icon: Shield,
        title: "Employer Trust",
        description: "Tamper-proof certificates that employers can verify instantly.",
    },
    {
        icon: Zap,
        title: "Learn Free, Prove Paid",
        description: "Use any free resource. Pay only to certify your knowledge.",
    },
];

export function LandingHero() {
    return (
        <section className="relative min-h-screen geo-bg overflow-hidden">
            {/* Animated Crowd Background */}
            <div className="absolute inset-0 z-0">
                <CrowdCanvas
                    src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/open-peeps-sheet.png"
                    rows={15}
                    cols={7}
                />
            </div>

            {/* Geometric accent blocks */}
            <div className="absolute top-20 right-10 w-24 h-24 bg-highlight opacity-20 z-10" />
            <div className="absolute bottom-32 left-16 w-32 h-32 border-8 border-primary opacity-10 z-10" />

            <div className="container mx-auto px-6 pt-32 pb-20 relative z-20">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-4xl"
                >
                    {/* Eyebrow */}
                    <motion.div
                        variants={itemVariants}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-primary border-4 border-foreground mb-8 shadow-brutal-sm"
                    >
                        <span className="w-3 h-3 bg-verdict-pass" />
                        <span className="font-mono text-sm font-bold text-white uppercase tracking-wider">Now in Beta</span>
                    </motion.div>

                    {/* Main headline */}
                    <motion.h1
                        variants={itemVariants}
                        className="text-6xl md:text-8xl font-display font-black leading-[0.95] tracking-tight mb-8"
                    >
                        Learn smarter stay structured
                        <br />
                        <span className="relative inline-block">
                            earn verified skills.
                            <div className="absolute -bottom-3 left-0 w-full h-4 bg-highlight" style={{ clipPath: 'polygon(0 50%, 100% 50%, 98% 100%, 2% 100%)' }} />
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        variants={itemVariants}
                        className="text-2xl md:text-3xl font-body font-bold leading-tight max-w-3xl mb-16 thick-border-left"
                    >
                        SkillMeter validates your self-taught knowledge with rigorous,
                        AI-powered assessments. Prove you know it—don't just say you watched it.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col sm:flex-row gap-6 mb-24"
                    >
                        <Link to="/dashboard">
                            <Button className="btn-neural group h-16 text-base">
                                Try Demo Assessment
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="h-16 text-base font-display font-bold border-4 border-foreground bg-background hover:bg-foreground hover:text-background shadow-brutal-sm hover:shadow-brutal uppercase tracking-wide"
                        >
                            Apply for Beta
                        </Button>
                    </motion.div>

                    {/* Proof Points - Brutalist List */}
                    <motion.div
                        variants={containerVariants}
                        className="space-y-6"
                    >
                        {proofPoints.map((point) => (
                            <motion.div
                                key={point.title}
                                variants={itemVariants}
                                className="flex gap-6 items-start border-l-6 border-primary pl-6 py-4"
                            >
                                <div className="w-14 h-14 flex items-center justify-center bg-primary border-4 border-foreground flex-shrink-0">
                                    <point.icon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-display font-black text-2xl mb-2">
                                        {point.title}
                                    </h3>
                                    <p className="text-lg text-muted-foreground font-body">
                                        {point.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
