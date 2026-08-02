"use client";
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import AnimatedButton from "@/components/AnimatedButton";

export const Hero = () => {
    const firstSlideRef = useRef<HTMLDivElement>(null);
    const secondSlideRef = useRef<HTMLDivElement>(null);
    const thirdSlideRef = useRef<HTMLDivElement>(null);
    const section1Ref = useRef<HTMLElement>(null);

    const headline1Ref = useRef<HTMLHeadingElement>(null);
    const subtitle1Ref = useRef<HTMLHeadingElement>(null);
    const desc1Ref = useRef<HTMLParagraphElement>(null);

    const headline2Ref = useRef<HTMLHeadingElement>(null);

    const icon3Ref = useRef<HTMLImageElement>(null);
    const headline3Ref = useRef<HTMLHeadingElement>(null);
    const desc3Ref = useRef<HTMLParagraphElement>(null);
    const btn3Ref = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const mainTlRef = useRef<gsap.core.Timeline | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleSkip = () => {
        if (mainTlRef.current) {
            mainTlRef.current.kill();
        }

        // Reset child elements to hidden state first
        gsap.set(icon3Ref.current, { y: 30, autoAlpha: 0 });
        gsap.set(headline3Ref.current, { y: 40, autoAlpha: 0 });
        gsap.set(desc3Ref.current, { y: 30, autoAlpha: 0 });
        gsap.set(btn3Ref.current, { y: 30, autoAlpha: 0 });
        gsap.set(scrollRef.current, { autoAlpha: 0 });
      

        const skipTl = gsap.timeline({
            onComplete: () => {
                if (typeof window !== "undefined") {
                    document.body.classList.remove("no-scroll");
                    document.documentElement.classList.remove("no-scroll");
                    if ((window as any)._scrollLockInterval) {
                        clearInterval((window as any)._scrollLockInterval);
                    }
                    if ((window as any).lenis) {
                        (window as any).lenis.start();
                    }
                }
            }
        });

        skipTl
            .to(secondSlideRef.current, {
                autoAlpha: 0,
                scale: 0.95,
                duration: 1.2,
                ease: "power2.inOut"
            })
            .to(thirdSlideRef.current, {
                autoAlpha: 1,
                scale: 1,
                duration: 1.2,
                ease: "power2.inOut"
            }, "<")
           
            .to(icon3Ref.current, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }, "-=0.8")
            .to(headline3Ref.current, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }, "-=0.6")
            .to(desc3Ref.current, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }, "-=0.6")
            .to(btn3Ref.current, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out" }, "-=0.4")
            .to(scrollRef.current, { autoAlpha: 1, duration: 0.8, ease: "power3.out" }, "-=0.4");
    };

    useGSAP(() => {
        // Initial setup for Cross-Fade
        gsap.set([secondSlideRef.current, thirdSlideRef.current], { autoAlpha: 0, scale: 1.05 });
        gsap.set(firstSlideRef.current, { autoAlpha: 1, scale: 1 });

        // Robust Scroll Lock & Reset
        if (typeof window !== "undefined") {
            document.body.classList.add("no-scroll");
            document.documentElement.classList.add("no-scroll");

            const stopLenis = () => {
                if ((window as any).lenis) {
                    (window as any).lenis.stop();
                }
            };
            stopLenis();
            const interval = setInterval(stopLenis, 100);
            (window as any)._scrollLockInterval = interval;
        }

        const mainTl = gsap.timeline();
        mainTlRef.current = mainTl;

        // 1. Initial Entry Animation for Slide 1
        mainTl
            .from(headline1Ref.current, {
                rotationX: -90,
                opacity: 0,
                transformOrigin: "50% 0%",
                duration: 1.2,
                ease: "power4.out",
            })
            .from(
                subtitle1Ref.current,
                {
                    rotationX: -90,
                    opacity: 0,
                    transformOrigin: "50% 0%",
                    duration: 1,
                    ease: "power4.out",
                },
                "-=0.8"
            )
            .from(
                desc1Ref.current,
                {
                    rotationX: -90,
                    opacity: 0,
                    transformOrigin: "50% 0%",
                    duration: 1,
                    ease: "power4.out",
                },
                "-=0.6"
            )
            // 2. Wait and then fade to second slide
            .to({}, { duration: 2.5 })
            .to(firstSlideRef.current, {
                autoAlpha: 0,
                scale: 0.95,
                duration: 1.2,
                ease: "power2.inOut"
            })
            .to(secondSlideRef.current, {
                autoAlpha: 1,
                scale: 1,
                duration: 1.2,
                ease: "power2.inOut"
            }, "<")
            .from(headline2Ref.current, {
                y: 40,
                opacity: 0,
                duration: 1,
                ease: "power3.out"
            }, "-=0.8")
            // 3. Wait and then fade to third slide
            .to({}, { duration: 2.5 })
            .to(secondSlideRef.current, {
                autoAlpha: 0,
                scale: 0.95,
                duration: 1.2,
                ease: "power2.inOut"
            })
            .to(thirdSlideRef.current, {
                autoAlpha: 1,
                scale: 1,
                duration: 1.2,
                ease: "power2.inOut"
            }, "<")

            .from(icon3Ref.current, {
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out"
            }, "-=0.8")
            .from(headline3Ref.current, {
                y: 40,
                opacity: 0,
                duration: .8,
                ease: "power3.out"
            }, "-=0.6")

            .from(desc3Ref.current, {
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out"
            }, "-=0.6")
            .from(btn3Ref.current, {
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out"
            }, "-=0.4")
            .from(scrollRef.current, {

                opacity: 0,
                duration: 0.8,
                ease: "power3.out"
            }, "-=0.4")
            .add(() => {
                if (typeof window !== "undefined") {
                    document.body.classList.remove("no-scroll");
                    document.documentElement.classList.remove("no-scroll");

                    if ((window as any)._scrollLockInterval) {
                        clearInterval((window as any)._scrollLockInterval);
                    }

                    if ((window as any).lenis) {
                        (window as any).lenis.start();
                    }
                }
            });

        setTimeout(() => ScrollTrigger.refresh(), 1000);

        return () => {
            if (typeof window !== "undefined") {
                document.body.classList.remove("no-scroll");
                document.documentElement.classList.remove("no-scroll");
                if ((window as any)._scrollLockInterval) {
                    clearInterval((window as any)._scrollLockInterval);
                }
            }
        };
    });

    return (
        <section id="home"
            ref={section1Ref}
            className="text-white relative min-h-screen flex flex-col items-center justify-center overflow-hidden  w-full bg-black"
        >
            {/* Optimized Background Image */}
            <Image
                src="/hero.webp"
                alt="Rank Path"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center pointer-events-none"
            />
             <span className="absolute bottom-0 left-0 h-[200px] w-full bg-gradient-to-t from-[#000606] via-[#00000063]  to-transparent"></span>

           
            {/* Main Content Area */}
            <div className="relative w-full flex-1  flex flex-col items-center justify-center overflow-hidden">
                {/* Slide 1 */}
                <div
                    ref={firstSlideRef}
                    className="first-slide px-4 absolute inset-0 flex flex-col items-center justify-center text-center  perspective-1000"
                >
                    <div className="relative z-10 max-w-5xl">
                        <h1 ref={headline1Ref} className="text-5xl md:text-6xl text-white">
                            RankPath
                        </h1>
                        <h2 ref={subtitle1Ref} className="text-2xl mx-auto md:text-[30px] pt-7 pb-2 text-gradient2 font-semibold">
                            Engineered for High Performance
                        </h2>
                        <p ref={desc1Ref} className="mx-auto mt-3 max-w-2xl text-sm md:text-lg white-text">
                           Elevate your preparation with premium mock tests, real-time leaderboards, and AI-driven performance insights designed for top-tier candidates.
                        </p>
                    </div>
                    <div className="load-anim text-center">
                        <Image
                            src="/favicon.png"
                            alt="logo"
                            width={30}
                            height={30}
                            className="object-contain mx-auto mb-1 jelly"
                        />
                        <div className="ml-[10px]">
                            Loading<span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                </div>

                {/* Slide 2 */}
                <div
                    ref={secondSlideRef}
                    className="second-slide px-4 absolute inset-0 flex flex-col items-center justify-center text-center"
                >
                    <div className="relative z-10 max-w-5xl">
                        <h3 ref={headline2Ref} className="font-bold mx-auto max-w-[850px] text-3xl md:text-6xl text-white leading-tighter">
                           The good news is, your digital future is finally back in your hands.

                        </h3>
                    </div>
                    <div className="load-anim text-center skip cursor-pointer" onClick={handleSkip}>
                        <Image
                            src="/favicon.png"
                            alt="logo"
                            width={30}
                            height={30}
                            className="object-contain mx-auto mb-1 jelly"
                        />
                        <div>
                            Skip Introduction
                        </div>
                    </div>

                </div>

                {/* Slide 3 */}
                <div
                    ref={thirdSlideRef}
                    className="third-slide px-4 absolute inset-0 pt-20 flex flex-col items-center justify-center text-center"
                >
                   

                    <div className="relative z-10 max-w-5xl text-center mx-auto pb-28">
                       
                        <h2 ref={headline3Ref} className="max-w-4xl mx-auto text-4xl md:text-6xl font-bold leading-tight ">
                           Master Your Exam With<br /><span className="text-gradient text-5xl md:text-8xl text-gradient mt-[-10px] block ml-auto mr-auto">Rank Path</span>
                        </h2>

                        <p ref={desc3Ref} className="my-8 mx-auto max-w-[700px] text-sm md:text-[16px] white-text font-light">
                          The premium mock test platform designed for Kerala PSC, SSC, Railway, Banking, and UPSC aspirants. Practice, track, and succeed with our comprehensive test series.

                        </p>
                        <div className="flex items-center flex-wrap justify-center gap-4" ref={btn3Ref}>
                             <AnimatedButton href="/auth/login" label="Get Started" className="w-fit" />
                                            <AnimatedButton href="/auth/login" label="Mocktest" className="w-fit btn-2" />

                        </div>
                    </div>
                    <div ref={scrollRef} className="scroll-indicator pt-[100px] w-fit">
                        <span>SCROLL DOWN</span>

                        <div className="scroll-arrow">
                            ↓
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
