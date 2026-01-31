import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const reasons = [
    {
        icon: Sparkles,
        title: "AI Maturity",
        description: "LLMs can now reliably grade open-ended technical responses.",
    },
    {
        icon: Globe,
        title: "Remote First",
        description: "Companies hire globally. They need trusted signals, fast.",
    },
    {
        icon: Clock,
        title: "Credential Inflation",
        description: "Degrees matter less. Demonstrated skills matter more.",
    },
];

export function WhyNow() {
    return (
        <section id="why-now" className="py-32 bg-foreground text-background relative overflow-hidden">
            {/* Geometric decorations */}
            <div className="absolute top-10 left-10 w-40 h-40 border-8 border-highlight opacity-20" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-highlight opacity-15" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-20"
                >
                    <span className="font-mono text-sm font-bold text-foreground bg-highlight uppercase tracking-widest px-5 py-3 border-4 border-background inline-block mb-6">
                        Why Now
                    </span>
                    <h2 className="font-display text-5xl md:text-7xl font-black mt-6 mb-6 leading-tight">
                        The Perfect Storm
                    </h2>
                    <p className="text-2xl font-body font-bold max-w-2xl border-l-6 border-background pl-6 opacity-90">
                        Three forces have converged to make skill verification inevitable.
                    </p>
                </motion.div>

                {/* Reasons List */}
                <div className="space-y-8 mb-20 max-w-4xl">
                    {reasons.map((reason, index) => (
                        <motion.div
                            key={reason.title}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex gap-6 items-start border-l-6 border-highlight pl-6 py-4"
                        >
                            <div className="w-16 h-16 flex items-center justify-center bg-highlight text-foreground border-4 border-background flex-shrink-0">
                                <reason.icon className="w-8 h-8" />
                            </div>
                            <div className="pt-2">
                                <h3 className="font-display font-black text-3xl mb-3">
                                    {reason.title}
                                </h3>
                                <p className="text-xl opacity-80 font-body">
                                    {reason.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="border-t-4 border-background pt-16"
                >
                    <p className="font-body text-3xl font-bold mb-10 opacity-90">
                        Be among the first to verify your skills.
                    </p>
                    <Link to="/dashboard">
                        <Button className="h-16 px-12 text-base font-display font-black bg-highlight text-foreground hover:bg-highlight/90 border-4 border-background uppercase tracking-wider group shadow-brutal">
                            Start Free Assessment
                            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
