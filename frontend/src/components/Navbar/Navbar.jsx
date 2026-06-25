import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useAuth } from '../../context/useAuth.js';
import "./Navbar.css";

gsap.registerPlugin(SplitText);

const linkBlocks = [
    ".nav-socials .line, .nav-legal .line",
    ".nav-primary-links .line",
    ".nav-secondary-links .line",
];

export default function Navbar() {
    const { isAuthenticated, isAdmin, logout, user } = useAuth();
    const navigate  = useNavigate();
    const location  = useLocation();

    const isHome   = location.pathname === '/';
    const isCursus = location.pathname.startsWith('/cursus/');
    const [inHero, setInHero] = useState(true);

    useEffect(() => {
        if (!isHome && !isCursus) { setInHero(false); return; }
        const check = () => setInHero(window.scrollY < window.innerHeight * 0.72);
        check();
        window.addEventListener('scroll', check, { passive: true });
        return () => window.removeEventListener('scroll', check);
    }, [isHome, isCursus]);

    const togglerRef      = useRef(null);
    const contentRef      = useRef(null);
    const transitionRef   = useRef(null);
    const profileRef      = useRef(null);
    const isMenuOpen      = useRef(false);
    const isAnimating     = useRef(false);
    const isTransitioning = useRef(false);
    const tlRef           = useRef(null);
    const splitRef        = useRef(null);
    const outsideClickRef = useRef(null);

    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        if (!profileOpen) return;
        function handler(e) {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [profileOpen]);

    function playTransitionOut() {
        const layers = transitionRef.current.querySelectorAll(".pt-layer");
        gsap.to(layers, {
            scaleY: 0,
            duration: 0.9,
            stagger: 0.1,
            ease: "power2.inOut",
            transformOrigin: "top",
            onComplete: () => { isTransitioning.current = false; },
        });
    }

    useEffect(() => {
        if (!isTransitioning.current) {
            if (isMenuOpen.current) closeMenu();
            return;
        }
        playTransitionOut();
    }, [location.pathname]);

    useEffect(() => {
        const tl = gsap.timeline({
            paused: true,
            onComplete: () => { isAnimating.current = false; },
            onReverseComplete: () => {
                gsap.set(linkBlocks.join(", "), { y: "100%" });
                contentRef.current?.classList.remove("open");
                togglerRef.current?.classList.add("styled");
                isAnimating.current = false;
            },
        });

        tl.to(".nav-bg", {
            scaleY: 1, duration: 0.75, stagger: 0.1, ease: "power3.inOut",
        });
        tl.to(".nav-items", {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            duration: 0.75, ease: "power3.inOut",
        }, "-=0.6");

        tlRef.current = tl;
    }, []);

    useEffect(() => {
        if (splitRef.current) splitRef.current.revert();
        splitRef.current = SplitText.create(".nav-items a, .nav-items button", {
            type: "lines", mask: "lines", linesClass: "line",
        });
    }, [isAuthenticated, isAdmin]);

    function closeMenu() {
        if (!isMenuOpen.current || isAnimating.current) return;
        isAnimating.current = true;
        togglerRef.current?.classList.remove("open");
        tlRef.current?.reverse();
        isMenuOpen.current = false;
        document.body.style.overflow = '';
        if (outsideClickRef.current) {
            document.removeEventListener("mousedown", outsideClickRef.current);
            outsideClickRef.current = null;
        }
    }

    function animateLinksIn() {
        linkBlocks.forEach((selector) => {
            const els = document.querySelectorAll(selector);
            if (!els.length) return;
            gsap.fromTo(els,
                { y: "100%" },
                { y: "0%", duration: 0.75, stagger: 0.05, ease: "power3.out", delay: 0.85 },
            );
        });
    }

    function handleToggle() {
        if (isAnimating.current) return;
        isAnimating.current = true;
        setProfileOpen(false);
        togglerRef.current.classList.toggle("open");

        if (!isMenuOpen.current) {
            contentRef.current.classList.add("open");
            togglerRef.current.classList.remove("styled");
            tlRef.current.play();
            animateLinksIn();
            isMenuOpen.current = true;
            document.body.style.overflow = 'hidden';

            outsideClickRef.current = (e) => {
                const wrapper = contentRef.current?.querySelector(".nav-menu-wrapper");
                if (wrapper && !wrapper.contains(e.target)) closeMenu();
            };
            setTimeout(() => {
                document.addEventListener("mousedown", outsideClickRef.current);
            }, 50);
        } else {
            closeMenu();
        }
    }

    function navigateTo(path) {
        if (isTransitioning.current) return;
        isTransitioning.current = true;
        setProfileOpen(false);
        closeMenu();

        const layers = transitionRef.current.querySelectorAll(".pt-layer");
        gsap.fromTo(layers,
            { scaleY: 0, transformOrigin: "bottom" },
            {
                scaleY: 1,
                duration: 0.55,
                stagger: 0.07,
                ease: "power3.inOut",
                onComplete: () => {
                    if (location.pathname === path) {
                        playTransitionOut();
                    } else {
                        navigate(path);
                    }
                },
            },
        );
    }

    async function handleLogout() {
        await logout();
        navigateTo("/");
    }

    return (
        <>
            <div className="page-transition" ref={transitionRef} aria-hidden="true">
                <div className="pt-layer" />
                <div className="pt-layer" />
                <div className="pt-layer" />
                <div className="pt-layer" />
            </div>

            <nav className={`nav${inHero ? ' nav--home' : ' nav--page'}`}>
                <button className="nav-toggler styled" ref={togglerRef} onClick={handleToggle} aria-label="Menu">
                    <span></span>
                    <span></span>
                </button>

                <div className="nav-logo">
                    <a href="/" onClick={(e) => { e.preventDefault(); navigateTo("/"); }}>
                        <img src="/logo.png" alt="Logo" />
                    </a>
                </div>

                <div className="nav-profile" ref={profileRef}>
                    {isAuthenticated ? (
                        <>
                            <button
                                className="nav-profile-btn"
                                onClick={() => setProfileOpen(o => !o)}
                                aria-label="Profiel menu"
                            >
                                <div className="nav-profile-avatar">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="nav-profile-name">{user?.name?.split(' ')[0] || 'Profiel'}</span>
                            </button>

                            {profileOpen && (
                                <div className="nav-dropdown">
                                    <div className="nav-dropdown__user">
                                        <p className="nav-dropdown__name">{user?.name}</p>
                                        <p className="nav-dropdown__email">{user?.email}</p>
                                    </div>
                                    <a
                                        href="/profiel"
                                        className="nav-dropdown__item"
                                        onClick={(e) => { e.preventDefault(); setProfileOpen(false); navigateTo('/profiel'); }}
                                    >
                                        Mijn profiel
                                    </a>
                                    <a
                                        href="/dashboard"
                                        className="nav-dropdown__item"
                                        onClick={(e) => { e.preventDefault(); setProfileOpen(false); navigateTo('/dashboard'); }}
                                    >
                                        Dashboard
                                    </a>
                                    {isAdmin && (
                                        <a
                                            href="/admin"
                                            className="nav-dropdown__item"
                                            onClick={(e) => { e.preventDefault(); setProfileOpen(false); navigateTo('/admin'); }}
                                        >
                                            Beheer
                                        </a>
                                    )}
                                    <div className="nav-dropdown__divider" />
                                    <button
                                        className="nav-dropdown__item nav-dropdown__item--danger"
                                        onClick={() => { setProfileOpen(false); handleLogout(); }}
                                    >
                                        Uitloggen
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="nav-auth-links">
                            <a href="/login" onClick={(e) => { e.preventDefault(); navigateTo("/login"); }}>Inloggen</a>
                            <a href="/registreren" className="nav-register-btn" onClick={(e) => { e.preventDefault(); navigateTo("/registreren"); }}>Registreren</a>
                        </div>
                    )}
                </div>
            </nav>

            <div className="nav-content" ref={contentRef}>
                <div className="nav-menu-wrapper">
                <div className="nav-bg"></div>
                <div className="nav-bg"></div>
                <div className="nav-bg"></div>
                <div className="nav-bg"></div>

                <div className="nav-items">
                    <div className="nav-items-col">
                        <div className="nav-socials">
                            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a>
                        </div>
                        <div className="nav-legal">
                            <a href="/cookie-policy" onClick={(e) => { e.preventDefault(); navigateTo("/cookie-policy"); }}>Cookie policy</a>
                            <a href="/privacy" onClick={(e) => { e.preventDefault(); navigateTo("/privacy"); }}>Privacybeleid</a>
                            <a href="/algemene-voorwaarden" onClick={(e) => { e.preventDefault(); navigateTo("/algemene-voorwaarden"); }}>Algemene voorwaarden</a>
                        </div>
                    </div>

                    <div className="nav-items-col">
                        <div className="nav-primary-links">
                            <a href="/" onClick={(e) => { e.preventDefault(); navigateTo("/"); }}>Home</a>
                            <a href="/cursus/binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit" onClick={(e) => { e.preventDefault(); navigateTo("/cursus/binnen-6-weken-gezond-tandvlees-en-een-gezond-gebit"); }}>Cursus programma</a>

                            {isAuthenticated && (
                                <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigateTo("/dashboard"); }}>Dashboard</a>
                            )}
                        </div>
                    </div>

                    <div className="nav-items-col">
                        <div className="nav-secondary-links">
                            {!isAuthenticated && (
                                <a href="/wachtwoord-vergeten" onClick={(e) => { e.preventDefault(); navigateTo("/wachtwoord-vergeten"); }}>Wachtwoord vergeten</a>
                            )}
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </>
    );
}
