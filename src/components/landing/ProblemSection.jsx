import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Counter } from "../ui/counter";

export function ProblemSection() {
    return (
        <section id="problem" className="py-32 bg-concrete">
            <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-20 items-start">
                    {/* Problem */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-3 px-5 py-3 bg-verdict-fail text-white border-4 border-foreground mb-8 shadow-brutal-sm">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-mono text-sm font-bold uppercase tracking-wider">The Problem</span>
                        </div>

                        <h2 className="font-display text-5xl md:text-6xl font-black mb-8 leading-tight border-l-8 border-verdict-fail pl-6">
                            Completion Certificates
                            <br />
                            <span className="text-muted-foreground">Mean Nothing</span>
                        </h2>

                        <div className="space-y-6 font-body text-xl leading-relaxed border-l-6 border-foreground pl-6">
                            <p className="font-bold">
                                <span className="bg-foreground text-background px-2 py-1">87% of hiring managers</span> don't trust online course certificates.
                            </p>
                            <p className="text-muted-foreground">
                                Watching a video doesn't prove competency. Finishing a course doesn't mean mastery.
                            </p>
                            <p className="text-muted-foreground">
                                The internet democratized learning—but <span className="font-black text-foreground underline decoration-4 decoration-verdict-fail">destroyed trust</span> in the process.
                            </p>
                        </div>

                        {/* Inline Stats */}
                        <div className="mt-12 space-y-4">
                            <div className="flex items-baseline gap-4">
                                <span className="font-display text-6xl font-black">
                                    <Counter value={87} />%
                                </span>
                                <span className="text-lg text-muted-foreground">Distrust certificates</span>
                            </div>
                            <div className="h-1 w-full bg-verdict-fail" />
                            <div className="flex items-baseline gap-4 pt-4">
                                <span className="font-display text-6xl font-black">
                                    $<Counter value={400} />B
                                </span>
                                <span className="text-lg text-muted-foreground">Wasted on credentials</span>
                            </div>
                            <div className="h-1 w-full bg-verdict-fail" />
                        </div>
                    </motion.div>

                    {/* Solution */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="inline-flex items-center gap-3 px-5 py-3 bg-verdict-pass text-white border-4 border-foreground mb-8 shadow-brutal-sm">
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-mono text-sm font-bold uppercase tracking-wider">The Solution</span>
                        </div>

                        <h2 className="font-display text-5xl md:text-6xl font-black mb-8 leading-tight border-l-8 border-verdict-pass pl-6">
                            Verify Knowledge,
                            <br />
                            <span className="text-primary">Not Attendance</span>
                        </h2>

                        <div className="space-y-6 font-body text-xl leading-relaxed border-l-6 border-foreground pl-6">
                            <p className="text-muted-foreground">
                                SkillMeter doesn't care <span className="font-black text-foreground">where</span> you learned.
                                We care <span className="font-black text-foreground">what</span> you know.
                            </p>
                            <p className="text-muted-foreground">
                                Our AI-powered assessments test real understanding through
                                scenario-based questions, code challenges, and explanation requirements.
                            </p>
                            <p className="font-bold">
                                <span className="bg-primary text-white px-2 py-1">Pass our assessment</span>,
                                and your certificate actually means something.
                            </p>
                        </div>

                        {/* Inline Stats */}
                        <div className="mt-12 space-y-4">
                            <div className="flex items-baseline gap-4">
                                <span className="font-display text-6xl font-black">
                                    <Counter value={94} />%
                                </span>
                                <span className="text-lg text-muted-foreground">Employer trust rate</span>
                            </div>
                            <div className="h-1 w-full bg-verdict-pass" />
                            <div className="flex items-baseline gap-4 pt-4">
                                <span className="font-display text-6xl font-black">$0</span>
                                <span className="text-lg text-muted-foreground">Cost to learn</span>
                            </div>
                            <div className="h-1 w-full bg-verdict-pass" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
