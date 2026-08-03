"use client";
import Image from "next/image";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import AnimatedButton from "@/components/AnimatedButton";
import { gsap, ScrollTrigger } from "@/lib/gsap";



const scrollItems1 = [
        { type: "image", src: "/profiles/1.jpg" },
    { type: "video", src: "/profiles/2.mp4" },
    { type: "image", src: "/profiles/3.jpg" },
    { type: "image", src: "/profiles/5.jpg" },
    { type: "image", src: "/profiles/6.jpg" },
       { type: "video", src: "/profiles/4.mp4" },
    { type: "image", src: "/profiles/7.png" },
    { type: "image", src: "/profiles/8.jpg" },
    { type: "image", src: "/profiles/9.png" },

];

const scrollItems2 = [
    { type: "image", src: "/profiles/9.png" },

    { type: "video", src: "/profiles/2.mp4" },
    { type: "image", src: "/profiles/5.jpg" },
       { type: "image", src: "/profiles/1.jpg" },
    { type: "image", src: "/profiles/8.jpg" },

    { type: "image", src: "/profiles/6.jpg" },
        { type: "video", src: "/profiles/4.mp4" },
    { type: "image", src: "/profiles/3.jpg" },

    { type: "image", src: "/profiles/7.png" },
];

export const Values = () => {
    const section3Ref = useRef<HTMLElement>(null);
    const joinRef = useRef<HTMLHeadingElement>(null);
    const headline3Ref = useRef<HTMLHeadingElement>(null);
    const subheaderRef = useRef<HTMLHeadingElement>(null);

    const desc2Ref = useRef<HTMLParagraphElement>(null);
    const btnRef = useRef<HTMLParagraphElement>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const counterContainerRef = useRef<HTMLDivElement>(null);
    const aboutContainerRef = useRef<HTMLDivElement>(null);

    const backScrollRef = useRef<HTMLDivElement>(null);
    const frontScrollRef = useRef<HTMLDivElement>(null);


    useGSAP(() => {
      
        const textElements = gsap.utils.toArray([
            joinRef.current, 
            subheaderRef.current, 
            desc2Ref.current,
            counterContainerRef.current?.querySelectorAll("p"),
            counterContainerRef.current?.querySelectorAll("h3")
        ]).filter(Boolean);

        // Store all ScrollTriggers and animations for cleanup
        const scrollTriggers: ScrollTrigger[] = [];
        const animations: gsap.core.Tween[] = [];

      

      


        
       
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section3Ref.current,
                start: "top 85%",
            },
        });

        tl.from(joinRef.current, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
        })
            .from(headline3Ref.current, {
                y: 50,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out",
            }, "-=0.6")
            .from(subheaderRef.current, {
                y: 30,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out",
            }, "-=0.6")
          
             .from(btnRef.current, {
                y: 30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
            }, "-=0.6")
            .from(counterContainerRef.current, {
                y: 40,
                opacity: 0,
                duration: .6,
                stagger: 0.1,

                ease: "power2.out",
            }, "-=0.6")
            .from(frontScrollRef.current?.children || [], {
                y: 50,
                rotateX: 10,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
            }, "-=0.9")
            .from(backScrollRef.current?.children || [], {
                y: 50,
                rotateX: 10,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
            }, "-=0.9");

        if (tl.scrollTrigger) scrollTriggers.push(tl.scrollTrigger);

        // About Section Animation
        if (aboutContainerRef.current) {
            const aboutTl = gsap.from(aboutContainerRef.current.children || [], {
                y: 40,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: aboutContainerRef.current,
                    start: "top 80%",
                }
            });
            if (aboutTl.scrollTrigger) scrollTriggers.push(aboutTl.scrollTrigger);
        }

       

        const marquee = (
            element: HTMLDivElement | null,
            direction: 1 | -1,
            speed = 30
        ) => {
            if (!element) return null;
            
            const width = element.scrollWidth / 2;

            const marqueeTl = gsap.fromTo(
                element,
                { x: direction === 1 ? -width : 0 },
                {
                    x: direction === 1 ? 0 : -width,
                    duration: speed,
                    ease: "none",
                    repeat: -1,
                }
            );
            
            animations.push(marqueeTl);
            return marqueeTl;
        };

        const backMarquee = marquee(backScrollRef.current!, 1, 50);
        const frontMarquee = marquee(frontScrollRef.current!, -1, 50);

        // Return cleanup function
        return () => {
            // Kill all ScrollTriggers
            scrollTriggers.forEach(st => st.kill());
            
            // Kill all animations (including infinite marquees)
            animations.forEach(anim => anim.kill());
            
            // Kill the main timeline
            tl.kill();
        };
        }); // Removed dependency array to ensure refs are populated before animations run

    return (
        <>

            <section
                id="main-section-4"
                ref={section3Ref}
                className="bg-black text-white relative min-h-screen  overflow-hidden py-[60px]  py-[100px]  w-full"
            >
                {/* Background Decorative Elements */}
                <div className="relative  px-4  w-full h-full max-w-[1360px] mx-auto flex  flex-col   ">

                    <div className="relative z-10 max-w-2xl">
                        
                        <h2
                            ref={headline3Ref}
                            className=" text-5xl md:text-8xl uppercase heading-font leading-snug text-gradient mb-5"
                        >
                           Invest in Your Future
                        </h2>
                        <h5 ref={subheaderRef} className=" text-[16px] md:text-[19px]  font-semibold"> Join 100+ candidates who have already unlocked Pro features.<br />Plans start from as low as ₹99/month.</h5>
     
                        <p ref={desc2Ref} className=" max-w-[880px]  text-[14px] md:text-[16px]  opacity-70 mt-3  tracking-normal">


                          
                          Empowering Kerala's next generation of public servants with technology and elite content. Your success journey starts here.

                        </p>
                        {/* <div className="max-w-[450px] mt-6 md:mt-10 rounded-[30px] bg-gradient-to-r from-[var(--yellow)] to-[var(--green)] p-[1px]">
                            <div className="flex  items-center p-[4px] rounded-[30px] bg-[#fff]">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 bg-transparent px-4 py-2 outline-none  text-[14px]"
                                />
                                <button className="bg-gradient-to-r from-[var(--yellow)] to-[var(--green)] text-[var(--text2)]  text-[14px]  px-4 py-3 rounded-full font-semibold  flex items-center gap-1 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(183,245,0,0.3)]">
                                    Claim Your Super ID
                                    <svg className="hidden sm:block" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15.125 6.875L5.5 16.5" stroke="#04393A" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M7.3335 5.67225C7.3335 5.67225 14.7107 5.05036 15.8303 6.16989C16.9499 7.28941 16.3278 14.6667 16.3278 14.6667" stroke="#04393A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>

                                </button>
                            </div>
                        </div> */}
                        <div  ref={btnRef}>
                        <AnimatedButton  href="/contact" label="View Our Plans" className="w-fit mt-8" />
                        </div>



                    </div>
                </div>
                <div ref={scrollContainerRef} className="scroll-container relative overflow-hidden mt-10 md:mt-18 flex flex-col gap-15">


                    <div ref={frontScrollRef} className="scroll-row bottom-scroll relative flex">
                        {[...scrollItems1, ...scrollItems1].map((item, i) => (
                            item.type === "image" ? (
                                <Image
                                    key={i}
                                    src={item.src}
                                    alt="setup super"
                                    width={1600}
                                    height={1600}
                                    className="shrink-0"
                                />
                            ) : (
                                <video
                                    key={i}
                                    src={item.src}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="shrink-0"
                                />
                            )
                        ))}
                    </div>
                    <div ref={counterContainerRef} className="max-w-[800px] w-full mx-auto md:py-8">
                        <div className="flex justify-center  flex-wrap sm:grid grid-cols-3 gap-x-4 text-center gap-y-7">
                            <div className="text-center flex flex-col w-[calc(50%-10px)] sm:w-full">
                                <h3 className="text-gradient text-4xl md:text-5xl font-bold mx-auto">10,000+</h3>
                                <p className="text-sm  mt-2 font-semibold uppercase ">Questions</p>
                            </div>
                            <div className="text-center flex flex-col w-[calc(50%-10px)] sm:w-full">
                                <h3 className="text-gradient text-4xl md:text-5xl font-bold mx-auto">500+</h3>
                                <p className="text-sm  mt-2 font-semibold uppercase ">Mock Tests</p>
                            </div>
                            <div className="text-center flex flex-col w-[calc(50%-10px)] sm:w-full">
                                <h3 className="text-gradient text-4xl md:text-5xl font-bold mx-auto">1000+</h3>
                                <p className="text-sm  mt-2 font-semibold uppercase ">Active Users</p>
                            </div>
                        </div>
                      
                    </div>
                    <div ref={backScrollRef} className="scroll-row top-scroll relative flex">
                        {[...scrollItems2, ...scrollItems2].map((item, i) => (
                            item.type === "image" ? (
                                <Image
                                    key={i}
                                    src={item.src}
                                    alt="setup super"
                                    width={1600}
                                    height={1600}
                                    className="shrink-0"
                                />
                            ) : (
                                <video
                                    key={i}
                                    src={item.src}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="shrink-0"
                                />
                            )
                        ))}

                    </div>
                </div>
               

            </section>
        </>
    );
};


