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

        const observeElements = () => {
            const elements = document.querySelectorAll(`.${className}`);
            elements.forEach(el => observer.observe(el));
        };

        // Observer les changements du DOM (utile si les éléments apparaissent dynamiquement)
        const mutationObserver = new MutationObserver(() => {
            observeElements();
        });

        mutationObserver.observe(document.body, { childList: true, subtree: true });

        // Observer les éléments au montage
        observeElements();

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
        };
    }, [className, threshold]);
};

export default useIntersectionObserver;
