import {
  useEffect,
  useState,
} from 'react';

export type FadeOnScrollProps = {
  ref: React.RefObject<HTMLElement>;
  threshold?: number; // Intersection Observer threshold
  repeat?: boolean; // If true, will toggle visibility on entering/exiting viewport
};

/**
 * useFadeUpOnScroll - Hook to track if element is visible in viewport
 * @param {React.RefObject<HTMLElement>} ref - Ref to the element to observe
 * @param {number} [threshold=0.5] - IntersectionObserver threshold
 * @param {boolean} [repeat=false] - If true, will toggle visibility on entering/exiting viewport
 * @return {boolean} - true if element is visible in viewport
 */
export const useFadeUpOnScroll = ({ ref, threshold = 0.5, repeat = false }: FadeOnScrollProps): boolean => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (repeat) {
            // If repeat: toggle in the state in/out Viewport
            setIsVisible(entry.isIntersecting);
          } else {
            // If not repeat: just set true once
            if (entry.isIntersecting) {
              setIsVisible((prev) => prev || true);
            }
          }
        });
      },
      { threshold }
    );

    const node = ref.current;
    if (node) observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
      observer.disconnect();
    };
  }, [threshold, ref, repeat]);

  return isVisible;
};

export default useFadeUpOnScroll;
