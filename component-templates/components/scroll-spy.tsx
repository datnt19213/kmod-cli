"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface ScrollSpyContextValue {
    activeId: string | null;
    register: (id: string, el: HTMLElement) => void;
    unregister: (id: string) => void;
    setUpdatedActiveId: (id: string | null) => void;
}

const ScrollSpyContext = createContext<ScrollSpyContextValue | null>(null);

export interface ScrollSpyProviderProps {
    children: React.ReactNode;
    /**
     * container/viewport to scroll, default = viewport
     * how to container to scroll? - set root is 'containerRef.current'
     */
    root?: HTMLElement | null;
    /**
     * active area (default is middle of viewport)
     * ex: center - "-50% 0px -50% 0px"
     * ex: top - "0% 0px -50% 0px"
     * ex: bottom - "100% 0px -50% 0px"
     */
    rootMargin?: string;
    scrollOptions?: ScrollOptions;
}

/**
 * @param behavior default = smooth
 * @param block default = start
 * @param inline default = center
 * @param distanceDeviation default = 80 -  The distance the user has to scroll before the element is considered in view
 */
export interface ScrollOptions {
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
    inline?: ScrollLogicalPosition;
    distanceDeviation?: number;
}

export function ScrollSpyProvider({
    children,
    root = null,
    rootMargin = "-50% 0px -50% 0px",
    scrollOptions = {
        behavior: "smooth",
        block: "start",
        inline: "center",
        distanceDeviation: 80,
    },
}: ScrollSpyProviderProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
    const isManualScrollRef = useRef(false);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (isManualScrollRef.current) return;
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute("data-scrollspy-id");
                        if (id) setActiveId(id);
                    }
                });
            },
            {
                root,
                rootMargin,
                threshold: 0,
            }
        );

        elementsRef.current.forEach((el) => {
            observerRef.current?.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, [root, rootMargin]);

    const register = (id: string, el: HTMLElement) => {
        elementsRef.current.set(id, el);
        observerRef.current?.observe(el);
    };

    const unregister = (id: string) => {
        const el = elementsRef.current.get(id);
        if (el) observerRef.current?.unobserve(el);
        elementsRef.current.delete(id);
    };

    const setUpdatedActiveId = (id: string | null) => {
        if (!id) return;


        const el = elementsRef.current.get(id);
        if (!el) return;


        // turn on manual mode
        isManualScrollRef.current = true;


        // set active when clicking
        setActiveId(id);


        // scroll to section (center viewport)
        const deviation = scrollOptions?.distanceDeviation ?? 0;
        // ===== WINDOW SCROLL =====
        if (!root) {
            const rect = el.getBoundingClientRect();


            const y =
                rect.top +
                window.scrollY -
                deviation;


            window.scrollTo({
                top: y,
                behavior: scrollOptions?.behavior ?? "smooth",
            });
        }
        // ===== CONTAINER SCROLL =====
        else {
            const container = root;
            const rect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();


            const y =
                rect.top -
                containerRect.top +
                container.scrollTop -
                deviation;


            container.scrollTo({
                top: y,
                behavior: scrollOptions?.behavior ?? "smooth",
            });
        }

        // after scroll settle → open observer again
        // (300–500ms at any smooth scroll)
        window.setTimeout(() => {
            isManualScrollRef.current = false;
        }, 500);
    };

    return (
        <ScrollSpyContext.Provider
            value={{ activeId, register, unregister, setUpdatedActiveId }}
        >
            {children}
        </ScrollSpyContext.Provider>
    );
}

export function useScrollSpy() {
    const ctx = useContext(ScrollSpyContext);
    if (!ctx) {
        throw new Error("useScrollSpy must be used inside ScrollSpyProvider");
    }
    return ctx;
}

interface ScrollSpySectionProps extends React.HTMLAttributes<HTMLDivElement> {
    id: string;
    children: React.ReactNode;
    className?: string;
}


export function ScrollSpySection({
    id,
    children,
    className,
    ...props
}: ScrollSpySectionProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const { register, unregister } = useScrollSpy();


    useEffect(() => {
        if (!ref.current) return;


        const el = ref.current;
        el.setAttribute("data-scrollspy-id", id);


        register(id, el);
        return () => unregister(id);
    }, [id, register, unregister]);


    return (
        <div ref={ref} id={id} className={className} {...props} >
            {children}
        </div>
    );
}

// USAGE:
// #wrap your layout to ScrollSpyProvider
// <ScrollSpyProvider>
//      <YourLayout />
// </ScrollSpyProvider>
// 
// #inside <ScrollSpyProvider> use hook useScrollSpy to get 'activeId' to show active
//
// const { activeId, setUpdatedActiveId } = useScrollSpy();
//
// <div>
//      items.map((item) => (
//          <button key={item.id} onClick={() => setUpdatedActiveId(item.id)} className={`${activeId === item.id && "bg-gray-100"}`}>
//              <Section title={item.title} />
//          </button>
//      ))
// </div>
// <div>
//      <ScrollSpySection id="id-1">
//          <Section title="General settings" />
//      </ScrollSpySection>
// 
//      <ScrollSpySection id="id-2">
//          <Section title="Security" />
//      </ScrollSpySection>
// </div>
//
// =========================================================================================
//
// CUSTOM USAGE SECTION:
// const ref = useRef<HTMLDivElement>(null);
//
// const { register, unregister } = useScrollSpy();
//
// useEffect(() => {
// if (!ref.current) return;
//
// this id is unique for each section
// ref.current.setAttribute("data-scrollspy-id", id);
//
// // register section to ScrollSpy
// register(id, ref.current);
//
// // cleanup when unmount
// return () => unregister(id);
// }, [id, register, unregister]);
//
// <ScrollSpySection id="id-1">
//      <Section title="General settings" />
// </ScrollSpySection>


