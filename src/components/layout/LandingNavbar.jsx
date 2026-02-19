import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinks = [
    { label: "Problem", href: "#problem" },
    { label: "Solution", href: "#solution" },
    { label: "Why Now", href: "#why-now" },
];

export function Navbar({ showLandingNav = false }) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
        >
            <div className="container mx-auto px-6">
                <nav className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary flex items-center justify-center">
                            <span className="font-display font-bold text-primary-foreground text-sm">SM</span>
                        </div>
                        <span className="font-display font-semibold text-lg tracking-tight">
                            SkillMeter
                        </span>
                    </Link>

                    {/* Center nav - only on landing */}
                    {showLandingNav && (
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="font-display text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                                >
                                    {link.label}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {/* "Join as Mentor", "Login" and "Get Started" buttons */}
                        <Link to="/signup?role=mentor">
                            <Button variant="ghost" className="font-display text-sm hidden sm:inline-flex">
                                Join as Mentor
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="ghost" className="font-display text-sm">
                                Login
                            </Button>
                        </Link>
                        <Link to="/signup">
                            <Button className="btn-neural text-sm py-2 px-6">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </nav>
            </div>
        </motion.header>
    );
}
