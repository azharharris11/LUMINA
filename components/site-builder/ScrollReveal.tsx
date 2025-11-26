
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const Motion = motion as any;

interface ScrollRevealProps {
    children: React.ReactNode;
    delay?: number;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({ children, delay = 0 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    return (
        <Motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, ease: "easeOut", delay }}
        >
            {children}
        </Motion.div>
    );
};

export default ScrollReveal;
