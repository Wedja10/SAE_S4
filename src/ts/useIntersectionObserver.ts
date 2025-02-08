import { useEffect } from "react";

const useIntersectionObserver = (className: string, threshold: number = 0.5) => {
    useEffect(() => {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold });

        const elements = document.querySelectorAll(`.${className}`);
        elements.forEach(el => observer.observe(el));

        return () => {
            elements.forEach(el => observer.unobserve(el));
        };
    }, [className, threshold]);
};

export default useIntersectionObserver;
