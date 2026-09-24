# Remix of Study Flow Hub

 https://github.com/pawanbishnoiii/bs17 es project ki main repo ko complete clone karo and eska database bhi build kro and ye images me jo jo tables hai same to same banao and today page me phone me illstater study page me card me jese show ho rha hai vese nahi ye niche show ho rha hai and logo show nahi ho rha hai login ke bad and logo ka background me ye sercel nahi hoga sirf logo hoga and vercel par jo deply kiya hai usme google se login karne par ( https://learn-sculpt-studio.vercel.app/~oauth/initiate?provider=google&redirect_uri=https%3A%2F%2Flearn-sculpt-studio.vercel.app&state=67062608e10cdbe6d9b4e3677f2d8f02 ) es url par redirect karta hai or "Page not found" show hota hai esko fix kro and admin authorized refirect urls copy kar payega settings me and admin client id and client secret add kar paeyga and smtp system upgrade kro usme proper settings ko manage nahi kar pa rhe hai and sahi se work nahi kar rha hai and most importent chij "Your plan" section me jo time table diya hai vo task banao and top 5 show hoge and see more button se or dekh payege and esme subjects and chapter automatic selacted hoge and classes page me kuch bhi media upload nahi ho rha hai esko investigate karo and carts add karo esko pura working banao and admin bhi logo and orhter chije upload nahi kar pa raha hai en sabko aik sath fix kro and esko task system and algoritum build kro advance ho and user kuch kuch chapter ko bich me bandh kar dete hai to next time shuru karte hai to algoritum ko alagata hai ki usne and eska read.me update karo file and ui thoda or batter banao and graph me sahi se view nahi milta hai kis din kitne ghante padhayi ki and users apni classes me folder type manage kar payege and upload bhi and downlaod bhi like  file manager ye liye ye componet use kro "3D Folder" ( Copy-paste this component to /components/ui folder:
```tsx
3d-folder.tsx
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, forwardRef } from 'react';
import { Sun, Moon, X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utilities ---

/**
 * Combines multiple class names and merges Tailwind classes correctly.
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Interfaces & Constants ---

export interface Project {
  id: string;
  image: string;
  title: string;
}

const PLACEHOLDER_IMAGE = "https://cdn.21st.dev/assets/mirror/a6/a6535354cc7145b294c0454885bfcb2b4cfc6d31b7dd724e696fe7173ff89dd4.jpg";

// --- Internal Components ---

interface ProjectCardProps {
  image: string;
  title: string;
  delay: number;
  isVisible: boolean;
  index: number;
  totalCount: number;
  onClick: () => void;
  isSelected: boolean;
}

const ProjectCard = forwardRef(
  ({ image, title, delay, isVisible, index, totalCount, onClick, isSelected }, ref) => {
    const middleIndex = (totalCount - 1) / 2;
    const factor = totalCount > 1 ? (index - middleIndex) / middleIndex : 0;
    
    const rotation = factor * 25; 
    const translationX = factor * 85; 
    const translationY = Math.abs(factor) * 12;

    return (
      

 {
          e.stopPropagation();
          onClick();
        }}
      >
        


           {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />
          


          


            {title}
          


        


      


    );
  }
);
ProjectCard.displayName = "ProjectCard";

interface ImageLightboxProps {
  projects: Project[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  sourceRect: DOMRect | null;
  onCloseComplete?: () => void;
  onNavigate: (index: number) => void;
}

const ImageLightbox: React.FC = ({
  projects,
  currentIndex,
  isOpen,
  onClose,
  sourceRect,
  onCloseComplete,
  onNavigate,
}) => {
  const [animationPhase, setAnimationPhase] = useState<"initial" | "animating" | "complete">("initial");
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [internalIndex, setInternalIndex] = useState(currentIndex);
  const [isSliding, setIsSliding] = useState(false);
  const containerRef = useRef(null);

  const totalProjects = projects.length;
  const hasNext = internalIndex < totalProjects - 1;
  const hasPrev = internalIndex > 0;
  const currentProject = projects[internalIndex];

  useEffect(() => {
    if (isOpen && currentIndex !== internalIndex && !isSliding) {
      setIsSliding(true);
      const timer = setTimeout(() => {
        setInternalIndex(currentIndex);
        setIsSliding(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isOpen, internalIndex, isSliding]);

  useEffect(() => {
    if (isOpen) {
      setInternalIndex(currentIndex);
      setIsSliding(false);
    }
  }, [isOpen, currentIndex]);

  const navigateNext = useCallback(() => {
    if (internalIndex >= totalProjects - 1 || isSliding) return;
    onNavigate(internalIndex + 1);
  }, [internalIndex, totalProjects, isSliding, onNavigate]);

  const navigatePrev = useCallback(() => {
    if (internalIndex <= 0 || isSliding) return;
    onNavigate(internalIndex - 1);
  }, [internalIndex, isSliding, onNavigate]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    onClose();
    setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      setAnimationPhase("initial");
      onCloseComplete?.();
    }, 500);
  }, [onClose, onCloseComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") navigateNext();
      if (e.key === "ArrowLeft") navigatePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose, navigateNext, navigatePrev]);

  useLayoutEffect(() => {
    if (isOpen && sourceRect) {
      setShouldRender(true);
      setAnimationPhase("initial");
      setIsClosing(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationPhase("animating");
        });
      });
      const timer = setTimeout(() => {
        setAnimationPhase("complete");
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sourceRect]);

  const handleDotClick = (idx: number) => {
    if (isSliding || idx === internalIndex) return;
    onNavigate(idx);
  };

  if (!shouldRender || !currentProject) return null;

  const getInitialStyles = (): React.CSSProperties => {
    if (!sourceRect) return {};
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const targetWidth = Math.min(800, viewportWidth - 64);
    const targetHeight = Math.min(viewportHeight * 0.85, 600);
    const targetX = (viewportWidth - targetWidth) / 2;
    const targetY = (viewportHeight - targetHeight) / 2;
    const scaleX = sourceRect.width / targetWidth;
    const scaleY = sourceRect.height / targetHeight;
    const scale = Math.max(scaleX, scaleY);
    const translateX = sourceRect.left + sourceRect.width / 2 - (targetX + targetWidth / 2) + window.scrollX;
    const translateY = sourceRect.top + sourceRect.height / 2 - (targetY + targetHeight / 2) + window.scrollY;
    return {
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
      opacity: 0.5,
      borderRadius: "12px",
    };
  };

  const getFinalStyles = (): React.CSSProperties => ({
    transform: "translate(0, 0) scale(1)",
    opacity: 1,
    borderRadius: "24px",
  });

  const currentStyles = animationPhase === "initial" && !isClosing ? getInitialStyles() : getFinalStyles();

  return (
    


      


       { e.stopPropagation(); handleClose(); }}
        className={cn(
          "absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-muted/30 backdrop-blur-xl border border-white/10 shadow-2xl text-foreground hover:bg-muted transition-all duration-300",
        )}
        style={{
          opacity: animationPhase === "complete" && !isClosing ? 1 : 0,
          transform: animationPhase === "complete" && !isClosing ? "translateY(0)" : "translateY(-30px)",
          transition: "opacity 400ms ease-out 400ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) 400ms",
        }}
      >
        
      
       { e.stopPropagation(); navigatePrev(); }}
        disabled={!hasPrev || isSliding}
        className={cn(
          "absolute left-4 md:left-10 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-muted/30 backdrop-blur-xl border border-white/10 text-foreground hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none shadow-2xl",
        )}
        style={{
          opacity: animationPhase === "complete" && !isClosing && hasPrev ? 1 : 0,
          transform: animationPhase === "complete" && !isClosing ? "translateX(0)" : "translateX(-40px)",
          transition: "opacity 400ms ease-out 600ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) 600ms",
        }}
      >
        
      
       { e.stopPropagation(); navigateNext(); }}
        disabled={!hasNext || isSliding}
        className={cn(
          "absolute right-4 md:right-10 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-muted/30 backdrop-blur-xl border border-white/10 text-foreground hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none shadow-2xl",
        )}
        style={{
          opacity: animationPhase === "complete" && !isClosing && hasNext ? 1 : 0,
          transform: animationPhase === "complete" && !isClosing ? "translateX(0)" : "translateX(40px)",
          transition: "opacity 400ms ease-out 600ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) 600ms",
        }}
      >
        
      
      

 e.stopPropagation()}
        style={{
          ...currentStyles,
          transform: isClosing ? "translate(0, 0) scale(0.92)" : currentStyles.transform,
          transition: animationPhase === "initial" && !isClosing ? "none" : "transform 700ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms ease-out, border-radius 700ms ease",
          transformOrigin: "center center",
        }}
      >
        


          


            


              {projects.map((project, idx) => (
                


                   { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                  />
                  


                


              ))}
            


          


          


            


              


                

{currentProject?.title}


                


                  


                    {projects.map((_, idx) => (
                       handleDotClick(idx)}
                        className={cn("w-1.5 h-1.5 rounded-full transition-all duration-500", idx === internalIndex ? "bg-foreground scale-150" : "bg-muted-foreground/30 hover:bg-muted-foreground/60")}
                      />
                    ))}
                  


                  

{internalIndex + 1} / {totalProjects}


                


              


              
                View Project
                
              
            


          


        


      


    


  );
};

interface AnimatedFolderProps {
  title: string;
  projects: Project[];
  className?: string;
  gradient?: string;
}

const AnimatedFolder: React.FC = ({ title, projects, className, gradient }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [sourceRect, setSourceRect] = useState(null);
  const [hiddenCardId, setHiddenCardId] = useState(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const previewProjects = projects.slice(0, 5);

  const handleProjectClick = (project: Project, index: number) => {
    const cardEl = cardRefs.current[index];
    if (cardEl) setSourceRect(cardEl.getBoundingClientRect());
    setSelectedIndex(index);
    setHiddenCardId(project.id);
  };

  const handleCloseLightbox = () => { setSelectedIndex(null); setSourceRect(null); };
  const handleCloseComplete = () => { setHiddenCardId(null); };
  const handleNavigate = (newIndex: number) => { setSelectedIndex(newIndex); setHiddenCardId(projects[newIndex]?.id || null); };

  const backBg = gradient || "linear-gradient(135deg, var(--folder-back) 0%, var(--folder-tab) 100%)";
  const tabBg = gradient || "var(--folder-tab)";
  const frontBg = gradient || "linear-gradient(135deg, var(--folder-front) 0%, var(--folder-back) 100%)";

  return (
    <>
      

 setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        


        


          


          


          


            {previewProjects.map((project, index) => (
               { cardRefs.current[index] = el; }} image={project.image} title={project.title} delay={index * 50} isVisible={isHovered} index={index} totalCount={previewProjects.length} onClick={() => handleProjectClick(project, index)} isSelected={hiddenCardId === project.id} />
            ))}
          


          


          


        


        


          

{title}


          

{projects.length} {projects.length === 1 ? 'project' : 'projects'}


        


        


          Hover
        


      


      
    
  );
};

// --- Portfolio Data & Main App ---

const portfolioData = [
  {
    title: "Branding",
    gradient: "linear-gradient(135deg, #e73827, #f85032)",
    projects: [
      { id: "b1", image: "https://cdn.21st.dev/assets/mirror/6c/6cb3aeada3fd347bf4641131fdb05a482044f0233b1b6da0ffb5e83593001e3f.jpg", title: "Lumnia Identity" },
      { id: "b2", image: "https://cdn.21st.dev/assets/mirror/31/3183fd08ab1fc4dc6a59c1307a0e392bf99ee416fb29d3cf5bb4094a4389a00a.jpg", title: "Prism Collective" },
      { id: "b3", image: "https://cdn.21st.dev/assets/mirror/28/28f4137c9e6749ee38de3f63e5829c8642bc7f3208679fbec7d7ede3fc7432a0.jpg", title: "Vertex Studio" },
      { id: "b4", image: "https://cdn.21st.dev/assets/mirror/96/968accf6d36acac90f0a167bbe9de759bccadd8de1919a88ec884577708e88db.jpg", title: "Aura Branding" },
      { id: "b5", image: "https://cdn.21st.dev/assets/mirror/9b/9b1f01ce8a1489c6aadbddcf492829600528afeaf13a84c12b3a7eae89ae8bdc.jpg", title: "Zephyr Lab" },
      { id: "b6", image: "https://cdn.21st.dev/assets/mirror/ed/ed26d76944f7c8a6217eda79a5b2305196881b3bd2c8ba4fc69d083d0c5fded0.jpg", title: "Origin Brand" },
    ] as Project[]
  },
  {
    title: "Web Design",
    gradient: "linear-gradient(to right, #f7b733, #fc4a1a)",
    projects: [
      { id: "w1", image: "https://cdn.21st.dev/assets/mirror/d7/d7613b9fe0eec5d371c5711d1ed0ecfa6d332d64615e26779a54b08849a55233.jpg", title: "Nexus Platform" },
      { id: "w2", image: "https://cdn.21st.dev/assets/mirror/98/989720ec48c6525f3dccf262c966a52d7eb62343febe063aba983852404727b3.jpg", title: "Echo Analytics" },
      { id: "w3", image: "https://cdn.21st.dev/assets/mirror/96/968accf6d36acac90f0a167bbe9de759bccadd8de1919a88ec884577708e88db.jpg", title: "Flow Systems" },
      { id: "w4", image: "https://cdn.21st.dev/assets/mirror/13/134f2fb1011e30bc8b6433856be5dad9ee40d8f5315883cdcbb74efd49ee20d7.jpg", title: "Code Nest" },
      { id: "w5", image: "https://cdn.21st.dev/assets/mirror/6a/6a8dafee634763ec77f3660430e416b605bc385b48a93106a5960c37f36d782a.jpg", title: "Dev Port" },
    ] as Project[]
  },
  {
    title: "UI/UX Design",
    gradient: "linear-gradient(135deg, #00c6ff, #0072ff)",
    projects: [
      { id: "u1", image: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?auto=format&fit=crop&q=80&w=800", title: "Crypto Wallet" },
      { id: "u2", image: "https://cdn.21st.dev/assets/mirror/47/475741ea26fa423c3774157106b4990a4ea7167ffb2dc6723490f5e0e08c25f3.jpg", title: "Social Connect" },
      { id: "u3", image: "https://images.unsplash.com/photo-1522542550221-31fd19fe4af0?auto=format&fit=crop&q=80&w=800", title: "Health Tracker" },
      { id: "u4", image: "https://cdn.21st.dev/assets/mirror/79/796a4bc1a44ad9bb150d298243289ad320baabd4a806dc811f8baaaa5f2949ea.jpg", title: "Finance Dash" },
      { id: "u5", image: "https://images.unsplash.com/photo-1541462608141-ad4d4f942177?auto=format&fit=crop&q=80&w=800", title: "UX Wireframe" },
    ] as Project[]
  },
  {
    title: "Photography",
    gradient: "linear-gradient(to right, #414345, #232526)",
    projects: [
      { id: "p1", image: "https://cdn.21st.dev/assets/mirror/f0/f07f6fb47f5a5c204bbe6a69e2427ab4b5091251e2c49850aec8be1648bdaff5.jpg", title: "Urban Rhythms" },
      { id: "p2", image: "https://cdn.21st.dev/assets/mirror/9f/9f4d6686c3ee21321e110920cfd3b8109d15f61ab2972dfafdeb1f1b1099c568.jpg", title: "Natural States" },
      { id: "p3", image: "https://cdn.21st.dev/assets/mirror/84/84e0245c76c92755f89a2a7e207f3bd38b31ec66ee0c71b8ac178604b55ffb83.jpg", title: "Silent Woods" },
    ] as Project[]
  },
  {
    title: "Illustration",
    gradient: "linear-gradient(135deg, #8e2de2, #4a00e0)",
    projects: [
      { id: "i1", image: "https://cdn.21st.dev/assets/mirror/b3/b3bb66d1d5b21d75a8c89375366830cd6a710d461c3e2a82f253dbbabba481aa.jpg", title: "Digital Flora" },
      { id: "i2", image: "https://cdn.21st.dev/assets/mirror/99/99f6d3b7bb35ac21719c0c908decb843999d9f1cadec2dc44e729db463f00887.jpg", title: "Neon Nights" },
      { id: "i3", image: "https://cdn.21st.dev/assets/mirror/78/7899a9cce344ea40d1a4756bdcec9107170846e5aec779c07559ee890aaae51c.jpg", title: "Abstract Worlds" },
    ] as Project[]
  },
  {
    title: "Motion",
    gradient: "linear-gradient(135deg, #f80759, #bc4e9c)",
    projects: [
      { id: "m1", image: "https://cdn.21st.dev/assets/mirror/cc/ccac844900a8ad3d51362f97ce8bb04804745265c65b35857e86925cff92caa9.jpg", title: "3D Sequences" },
      { id: "m2", image: "https://cdn.21st.dev/assets/mirror/0e/0ef7e7f4e7a6981e7385d6c46eb25e3ea96b81f992c1f8559602c11aa2fe37ca.jpg", title: "Glitch Art" },
      { id: "m3", image: "https://cdn.21st.dev/assets/mirror/75/75ae98a0bbe52fbc65e7b31ab5460bca6abd4cde5be0dd1f7a116706b97395e6.jpg", title: "Tech Loops" },
    ] as Project[]
  }
];

export default function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    
      


        


          
            {isDark ?  : }
          
        


      



      


        


          Design Portfolio
        


        


          An interactive catalog of creative work. Hover over folders to reveal project previews.
        


      



      


        


          {portfolioData.map((folder, index) => (
            


              
            


          ))}
        


      


    
  );
}

demo.tsx
import Component from "@/components/ui/3d-folder";

export default function DemoOne() {
  return <Component />;
}

```

Install NPM dependencies:
```bash
clsx, lucide-react, tailwind-merge
```
 ) ye bhi importent hai and today page me notice board hoga users ka indepandit and users target me odd day reading and even day reading bhi add kar payege and or batter ui banao modren app ho and user expirnce batter kro

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bs14.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/248f6db8-5d7c-4993-8f68-54d502b8ed1e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
