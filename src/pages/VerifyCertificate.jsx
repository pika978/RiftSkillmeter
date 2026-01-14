import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function VerifyCertificate() {
    const [searchParams] = useSearchParams();
    const certId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fireConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    };

    useEffect(() => {
        if (!certId) {
            setLoading(false);
            return;
        }

        const verifyCert = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/certificates/verify/${certId}/`);
                if (!response.ok) {
                    throw new Error('Certificate not found or invalid');
                }
                const result = await response.json();
                setData(result);

                // Trigger celebration only on success
                if (result.valid) {
                    fireConfetti();
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        verifyCert();
    }, [certId]);

    if (!certId) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-100 p-4 font-mono">
                <div className="w-full max-w-md border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-2xl font-black text-red-600 uppercase mb-2">Error: Missing ID</h2>
                    <p className="font-bold">No certificate ID provided in the URL.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-100">
                <Loader2 className="h-12 w-12 animate-spin text-black" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4 font-sans selection:bg-yellow-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-full max-w-2xl"
            >
                <Card className={`relative overflow-hidden border-4 border-black bg-white md:p-12 p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${error ? 'bg-red-50' : ''}`}>

                    {/* Top Badge */}
                    <div className="absolute top-0 right-0 border-b-4 border-l-4 border-black bg-yellow-400 px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
                        <span className="font-black uppercase tracking-widest text-sm">Official Record</span>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-8 relative z-0">

                        {/* Header / Logo */}
                        <div className="mb-4">
                            <img src="/logo.png" alt="SkillMeter AI" className="h-16 w-auto mix-blend-multiply" />
                        </div>

                        {/* Status Icon & Title */}
                        <div className="space-y-4">
                            {error ? (
                                <motion.div
                                    initial={{ rotate: -10 }}
                                    animate={{ rotate: 0 }}
                                    className="inline-flex rounded-full border-4 border-black bg-red-500 p-3 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <XCircle className="h-12 w-12" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ rotate: -10, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                    className="inline-flex rounded-full border-4 border-black bg-green-500 p-3 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <CheckCircle2 className="h-12 w-12" />
                                </motion.div>
                            )}

                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                                {error ? 'Invalid Certificate' : 'Certificate Verified'}
                            </h1>
                        </div>

                        {!error && data && (
                            <div className="w-full space-y-8">
                                {/* Main Content */}
                                <div className="border-y-4 border-black py-8 space-y-6 bg-zinc-50/50">
                                    <div>
                                        <p className="font-mono text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Awarded To</p>
                                        <h2 className="text-3xl md:text-4xl font-black text-black">{data.student_name}</h2>
                                    </div>

                                    <div>
                                        <p className="font-mono text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">For Completing</p>
                                        <h3 className="text-2xl md:text-3xl font-bold text-blue-700 max-w-lg mx-auto leading-tight">
                                            {data.course_title}
                                        </h3>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                    <div className="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                                        <p className="font-mono text-xs font-bold uppercase text-zinc-500 mb-1">Issue Date</p>
                                        <p className="font-bold text-lg">{new Date(data.issue_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>

                                    <div className="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                                        <p className="font-mono text-xs font-bold uppercase text-zinc-500 mb-1">Certificate ID</p>
                                        <p className="font-mono font-bold text-lg tracking-wider">{data.certificate_id}</p>
                                    </div>
                                </div>

                                {/* Footer / Signature */}
                                <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-8 w-full border-t-2 border-dashed border-zinc-300">
                                    <div className="text-center md:text-left">
                                        <img src="/logo.png" alt="SkillMeter" className="h-8 w-auto opacity-50 grayscale mb-2 mx-auto md:mx-0" />
                                        <p className="font-mono text-xs text-zinc-400">Verified by SkillMeter AI</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="font-handwriting text-3xl text-zinc-800 -rotate-6 mb-2" style={{ fontFamily: 'cursive' }}>
                                            SkillMeter Director
                                        </div>
                                        <div className="h-0.5 w-32 bg-black mx-auto"></div>
                                        <p className="font-mono text-xs font-bold uppercase mt-1">Authorized Signature</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="border-4 border-black bg-red-100 p-6 w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-bold text-lg text-red-900">
                                    {error === 'Certificate ID not found'
                                        ? "This ID does not match any records in our secure database."
                                        : "Unable to verify this certificate at this time."}
                                </p>
                            </div>
                        )}

                    </div>
                </Card>
            </motion.div>
        </div>
    );
}

