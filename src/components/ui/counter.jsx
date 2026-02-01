import { useEffect, useRef } from "react";
import { useInView, animate } from "framer-motion";

export function Counter({ value, from = 0, duration = 1.5, className }) {
    const nodeRef = useRef();
    const isInView = useInView(nodeRef, { once: true, margin: "-10%" });

    useEffect(() => {
        const node = nodeRef.current;
        if (!node || !isInView) return;

        const controls = animate(from, value, {
            duration,
            onUpdate(v) {
                node.textContent = Math.floor(v).toLocaleString();
            },
            ease: "easeOut",
        });

        return () => controls.stop();
    }, [from, value, duration, isInView]);

    return <span ref={nodeRef} className={className} />;
}
