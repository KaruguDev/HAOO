import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  Leaf,
  Globe,
  Mail,
  MapPin,
  FileDigit,
  ShieldCheck,
  Users,
  Lightbulb,
  TreePine,
  ArrowRight,
  Menu,
  X,
  CheckCircle2,
  Building2,
  Scale,
  ChevronDown,
  Download,
} from 'lucide-react';
import ProductPage from './pages/ProductPage';
import ProductsSection from './components/ProductsSection';
import { HAOO_PRODUCT } from './products/haoo';
import { PRODUCTS, productsNavLink } from './products/registry';
import type { ProductDefinition } from './products/types';

function downloadCompanyProfile() {
  const content = `ZERO-PAPER HUB
Strategic Digital Workflows
Digital. Paperless. Impact.

========================================
EXECUTIVE SUMMARY
========================================
We digitize workflows to assist businesses and organizations in strategically reducing their reliance on paper in day-to-day operations, thereby saving trees, protecting the environment and its ecosystems, and lowering their carbon footprint daily.

========================================
BUSINESS HISTORY & OVERVIEW
========================================
Founded on June 10, 2026, as a sole proprietorship with the goal of becoming a limited liability company. We exist and offer digital solutions in the real estate and legal sectors, but not exclusively.

========================================
MISSION
========================================
Help businesses and organizations to strategically go paperless to reduce carbon footprint by saving trees, ecosystems, and the environment day by day.

========================================
VISION
========================================
Positioning ZERO-PAPER HUB as the ultimate catalyst for a paperless, regenerative economy driven entirely by zero-emission digital workflows in Kenya by 2032.

========================================
VALUES
========================================
- Innovation with Purpose
- Customer-Centricity
- Integrity & Transparency
- Sustainability
- Trust

========================================
SERVICES
========================================
1. Real Estate
   Digitize property listings, contracts, lease agreements, and compliance documents — eliminating paper at every step of the transaction lifecycle.

2. Legal Sector
   Transform legal workflows with e-signatures, digital case files, and automated document management that keep firms compliant and efficient.

3. Business Workflows
   End-to-end digitization of any business process — from onboarding forms to approvals — tailored to your organization's unique needs.

========================================
CONTACT
========================================
Location: Nexus Business Centre, Eastern Bypass, Ruiru
Email: info@zero-paperhub.com
Website: www.zero-paperhub.com

© 2026 ZERO-PAPER HUB. All rights reserved.
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Zero-Paper-Hub-Company-Profile.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Mission', href: '#mission' },
  { label: 'Services', href: '#services' },
  { label: 'Values', href: '#values' },
  { label: 'Contact', href: '#contact' },
];

const MOBILE_MENU_ID = 'home-mobile-navigation';

const focusRingClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2';

/**
 * Product discovery is derived from collection presence, so the navigation entry
 * and the Products landmark can never disagree about whether products exist.
 */
function homeNavLinks(products: readonly ProductDefinition[]) {
  const productsLink = productsNavLink(products);
  if (!productsLink) {
    return NAV_LINKS;
  }

  const valuesIndex = NAV_LINKS.findIndex((link) => link.href === '#values');
  const insertAt = valuesIndex < 0 ? NAV_LINKS.length : valuesIndex;
  return [
    ...NAV_LINKS.slice(0, insertAt),
    { label: productsLink.label, href: productsLink.href },
    ...NAV_LINKS.slice(insertAt),
  ];
}

const CONTACT_FORM_ENDPOINT = 'https://formsubmit.co/info@zero-paperhub.com';
const CONTACT_SUCCESS_URL = 'https://www.zero-paperhub.com/?contact=success#contact';

const VALUES = [
  { icon: Lightbulb, label: 'Innovation with Purpose' },
  { icon: Users, label: 'Customer-Centricity' },
  { icon: ShieldCheck, label: 'Integrity & Transparency' },
  { icon: Leaf, label: 'Sustainability' },
  { icon: CheckCircle2, label: 'Trust' },
];

const SERVICES = [
  {
    icon: Building2,
    title: 'Real Estate',
    desc: 'Digitize property listings, contracts, lease agreements, and compliance documents — eliminating paper at every step of the transaction lifecycle.',
  },
  {
    icon: Scale,
    title: 'Legal Sector',
    desc: 'Transform legal workflows with e-signatures, digital case files, and automated document management that keep firms compliant and efficient.',
  },
  {
    icon: FileDigit,
    title: 'Business Workflows',
    desc: 'End-to-end digitization of any business process — from onboarding forms to approvals — tailored to your organization\'s unique needs.',
  },
];

interface HomePageProps {
  readonly products?: readonly ProductDefinition[];
}

export function HomePage({ products = PRODUCTS }: HomePageProps) {
  const navLinks = homeNavLinks(products);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted] = useState(
    () => new URLSearchParams(window.location.search).get('contact') === 'success'
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (contactSubmitted) {
      window.history.replaceState({}, '', `${window.location.pathname}#contact`);
    }
  }, [contactSubmitted]);

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (event.currentTarget.checkValidity()) {
      setContactSubmitting(true);
    }
  };

  const aboutSection = useInView();
  const missionSection = useInView();
  const servicesSection = useInView();
  const valuesSection = useInView();
  const contactSection = useInView();

  return (
    <div className="font-sans text-gray-800 bg-white overflow-x-hidden">

      {/* NAV */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2.5 md:py-3' : 'bg-transparent py-3 md:py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <a href="#" className="flex min-w-0 items-center group" aria-label="ZERO-PAPER HUB home">
            <img src="/zero-paper_hub_hi-def.png" alt="ZERO-PAPER HUB"
              className={`h-14 sm:h-16 md:h-20 max-w-full w-auto rounded-lg object-contain transition-all duration-300 ${scrolled ? 'bg-white/95 p-1 sm:p-1.5 shadow-sm' : 'bg-white/95 p-1 sm:p-1.5'}`} />
          </a>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.label} href={l.href}
                className={`inline-flex min-h-11 items-center rounded-lg text-sm font-medium tracking-wide transition-colors duration-200 hover:text-green-400 ${focusRingClasses} ${scrolled ? 'text-gray-600' : 'text-white/90'}`}>
                {l.label}
              </a>
            ))}
            <a href="#contact"
              className={`ml-2 inline-flex min-h-11 items-center rounded-full bg-green-600 px-5 text-white text-sm font-semibold shadow hover:bg-green-500 transition-colors duration-200 ${focusRingClasses}`}>
              Get Started
            </a>
          </nav>

          <button
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls={MOBILE_MENU_ID}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden inline-flex size-11 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${focusRingClasses} ${scrolled ? 'text-gray-700' : 'text-white'}`}
          >
            {menuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        <nav
          id={MOBILE_MENU_ID}
          aria-label="Primary mobile"
          hidden={!menuOpen}
          className="md:hidden"
        >
          <div className="bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-2">
            {navLinks.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
                className={`inline-flex min-h-11 items-center rounded-lg text-gray-700 font-medium text-sm hover:text-green-700 transition-colors ${focusRingClasses}`}>
                {l.label}
              </a>
            ))}
            <a href="#contact" onClick={() => setMenuOpen(false)}
              className={`inline-flex min-h-11 items-center justify-center rounded-full bg-green-600 px-5 text-white text-sm font-semibold ${focusRingClasses}`}>
              Get Started
            </a>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        {/* background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-blue-900" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        {/* decorative circles */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-green-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold tracking-widest uppercase mb-8 backdrop-blur-sm">
            <Leaf size={12} className="text-green-400" />
            Digital. Paperless. Impact.
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Strategically Digitize<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Business Workflows</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
            We help businesses and organizations reduce their reliance on paper — saving trees, protecting ecosystems, and lowering carbon footprints, one workflow at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#services"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-green-500 hover:bg-green-400 text-white font-bold text-base shadow-lg shadow-green-900/40 transition-all duration-200 hover:scale-105">
              Explore Our Services <ArrowRight size={17} />
            </a>
            <a href="#about"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 backdrop-blur-sm transition-all duration-200">
              Learn More <ChevronDown size={17} />
            </a>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
            <div className="w-1 h-2.5 rounded-full bg-white/50" />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-28 bg-white">
        <div
          ref={aboutSection.ref}
          className={`max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center transition-all duration-700 ${aboutSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-700 mb-3 block">Who We Are</span>
            <h2 className="text-4xl md:text-5xl font-black text-green-900 leading-tight mb-6">
              Executive Summary
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              We digitize workflows to assist businesses and organizations in strategically reducing their reliance on paper in day-to-day operations, thereby saving trees, protecting the environment and its ecosystems, and lowering their carbon footprint daily.
            </p>
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-700 mb-3 block">Our Story</span>
            <h3 className="text-2xl font-bold text-green-900 mb-4">Business History & Overview</h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Founded on June 10, 2026, as a sole proprietorship with the goal of becoming a limited liability company. We exist and offer digital solutions in the real estate and legal sectors, but not exclusively.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Building2, label: 'Real Estate', color: 'bg-green-50 text-green-700 border-green-100' },
                { icon: Scale, label: 'Legal Sector', color: 'bg-blue-50 text-blue-700 border-blue-100' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color} font-semibold text-sm`}>
                  <Icon size={18} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT STATS */}
      <section className="py-16 bg-gradient-to-r from-green-800 to-green-700">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '2026', label: 'Founded' },
            { value: '2032', label: 'Vision Target Year' },
            { value: '0', label: 'Emission Goal' },
            { value: '∞', label: 'Trees Saved' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-black text-white mb-1">{s.value}</div>
              <div className="text-green-200 text-sm font-medium tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MISSION VISION VALUES */}
      <section id="mission" className="py-28 bg-gray-50">
        <div
          ref={missionSection.ref}
          className={`max-w-7xl mx-auto px-6 transition-all duration-700 ${missionSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-700 mb-3 block">Our Foundation</span>
            <h2 className="text-4xl md:text-5xl font-black text-green-900">Mission, Vision & Values</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-5">
                <Leaf size={22} className="text-green-700" />
              </div>
              <div className="h-1 w-10 rounded-full bg-green-500 mb-4" />
              <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-green-700 mb-3">Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                Help businesses and organizations to strategically go paperless to reduce carbon footprint by saving trees, ecosystems, and the environment day by day.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
                <Globe size={22} className="text-blue-700" />
              </div>
              <div className="h-1 w-10 rounded-full bg-blue-500 mb-4" />
              <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-blue-700 mb-3">Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                Positioning ZERO-PAPER HUB as the ultimate catalyst for a paperless, regenerative economy driven entirely by zero-emission digital workflows in Kenya by 2032.
              </p>
            </div>

            {/* Values */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-5">
                <ShieldCheck size={22} className="text-emerald-700" />
              </div>
              <div className="h-1 w-10 rounded-full bg-emerald-500 mb-4" />
              <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-emerald-700 mb-3">Values</h3>
              <ul className="space-y-2.5">
                {VALUES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5 text-gray-600 text-sm">
                    <Icon size={15} className="text-green-600 flex-shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-28 bg-white">
        <div
          ref={servicesSection.ref}
          className={`max-w-7xl mx-auto px-6 transition-all duration-700 ${servicesSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-700 mb-3 block">What We Do</span>
            <h2 className="text-4xl md:text-5xl font-black text-green-900 mb-4">Our Services</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We deliver tailored digital workflow solutions across sectors, replacing inefficient paper-based processes with smart, sustainable systems.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.map(({ icon: Icon, title, desc }, i) => (
              <div key={title}
                className="group relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 p-8"
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center mb-6 shadow-md shadow-green-200 group-hover:scale-105 transition-transform duration-300">
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
                <div className="mt-6 flex items-center gap-1 text-green-700 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn more <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductsSection products={products} />

      {/* VALUES STRIP */}
      <section id="values" className="py-20 bg-gradient-to-br from-green-900 via-green-800 to-blue-900">
        <div
          ref={valuesSection.ref}
          className={`max-w-7xl mx-auto px-6 transition-all duration-700 ${valuesSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">What Drives Us</h2>
            <p className="text-green-200 text-sm">Our core values guide every decision we make</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {VALUES.map(({ icon: Icon, label }) => (
              <div key={label}
                className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-white font-semibold text-sm hover:bg-white/20 transition-colors duration-200">
                <Icon size={16} className="text-green-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold tracking-widest uppercase mb-6">
            <TreePine size={12} />
            Start Your Paperless Journey
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-green-900 mb-5 leading-tight">
            Ready to go<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">paperless?</span>
          </h2>
          <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
            Join the movement toward a regenerative, zero-emission economy. Let us help you digitize your workflows today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#contact"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-base shadow-lg shadow-green-200 hover:shadow-xl hover:scale-105 transition-all duration-200">
              Get in Touch <ArrowRight size={17} />
            </a>
            <button onClick={downloadCompanyProfile}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-white text-green-800 font-bold text-base shadow-lg shadow-gray-200 border-2 border-green-200 hover:shadow-xl hover:scale-105 hover:bg-green-50 transition-all duration-200">
              <Download size={17} /> Download Profile
            </button>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-28 bg-gray-50">
        <div
          ref={contactSection.ref}
          className={`max-w-7xl mx-auto px-6 transition-all duration-700 ${contactSection.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-700 mb-3 block">Reach Out</span>
            <h2 className="text-4xl md:text-5xl font-black text-green-900">Contact Us</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Info */}
            <div>
              <h3 className="text-xl font-bold text-green-900 mb-6">Let's start a conversation</h3>
              <p className="text-gray-500 leading-relaxed mb-8">
                Whether you're ready to digitize your workflows or just want to learn more about how we can help your business go paperless, we'd love to hear from you.
              </p>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={17} className="text-green-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm mb-0.5">Location</div>
                    <div className="text-gray-500 text-sm">Nexus Business Centre, Eastern Bypass, Ruiru</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail size={17} className="text-blue-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm mb-0.5">Email</div>
                    <a href="mailto:info@zero-paperhub.com" className="text-blue-700 text-sm hover:underline">info@zero-paperhub.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe size={17} className="text-emerald-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm mb-0.5">Website</div>
                    <span className="text-gray-500 text-sm">www.zero-paperhub.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form
              action={CONTACT_FORM_ENDPOINT}
              method="POST"
              onSubmit={handleContactSubmit}
              className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5"
            >
              <input type="hidden" name="_subject" value="New website enquiry — ZERO-PAPER HUB" />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_next" value={CONTACT_SUCCESS_URL} />
              <input type="hidden" name="_url" value="https://www.zero-paperhub.com/#contact" />
              <input
                type="hidden"
                name="_autoresponse"
                value="Thank you for contacting ZERO-PAPER HUB. We have received your message and will respond as soon as possible."
              />

              <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="contact-website">Leave this field blank</label>
                <input
                  id="contact-website"
                  type="text"
                  name="_honey"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {contactSubmitted && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                >
                  <CheckCircle2 size={19} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold">Message sent successfully</div>
                    <p className="mt-0.5 text-green-700">Thank you. Our team will get back to you shortly.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-first-name" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">First Name</label>
                  <input id="contact-first-name" type="text" name="first_name" placeholder="Jane" autoComplete="given-name" required minLength={2} maxLength={60}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition" />
                </div>
                <div>
                  <label htmlFor="contact-last-name" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Last Name</label>
                  <input id="contact-last-name" type="text" name="last_name" placeholder="Doe" autoComplete="family-name" required minLength={2} maxLength={60}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition" />
                </div>
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                <input id="contact-email" type="email" name="email" placeholder="jane@company.com" autoComplete="email" required maxLength={254}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition" />
              </div>
              <div>
                <label htmlFor="contact-organization" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Organization <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                <input id="contact-organization" type="text" name="organization" placeholder="Your company name" autoComplete="organization" maxLength={120}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition" />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Message</label>
                <textarea id="contact-message" name="message" rows={4} placeholder="Tell us about your workflow challenges..." required minLength={10} maxLength={3000}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition resize-none" />
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
                <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-green-700" />
                <span>Protected by reCAPTCHA and an automated spam trap. Your details are used only to respond to this enquiry.</span>
              </div>
              <button type="submit" disabled={contactSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-700 to-green-600 text-white font-bold text-sm shadow-md shadow-green-200 hover:shadow-lg hover:from-green-600 hover:to-green-500 transition-all duration-200 disabled:cursor-wait disabled:opacity-70">
                {contactSubmitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-green-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <a href="#" className="flex items-center">
              <img src="/zero-paper_hub_hi-def.png" alt="ZERO-PAPER HUB"
                className="h-16 w-auto rounded-lg object-contain bg-white/95 p-1.5" />
            </a>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-green-300">
              {NAV_LINKS.map(l => (
                <a key={l.label} href={l.href} className="hover:text-white transition-colors">{l.label}</a>
              ))}
            </div>
            <div className="text-green-500 text-xs text-center">
              &copy; 2026 ZERO-PAPER HUB. All rights reserved.
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-green-900 text-center text-green-600 text-xs">
            ZERO-PAPER HUB &middot; Strategic Digital Workflows &middot; Digital. Paperless. Impact.
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  if (document.body.dataset.page === 'haoo-product') {
    return <ProductPage product={HAOO_PRODUCT} />;
  }

  return <HomePage />;
}
