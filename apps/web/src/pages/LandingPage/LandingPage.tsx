/**
 * Project: BERSEKA.ID
 * Public Landing Page Component
 * Fully morphed to official BERSEKA design template with live Admin CMS integration.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  Check,
  Phone,
  Mail,
  MapPin,
  Recycle,
  ShoppingBag,
  Users,
  Building2,
  Database,
  Truck,
  Factory,
  Landmark,
  Home,
  UserCheck,
  Scale,
  Trees,
  Calculator,
  Calendar,
  Clock,
  Sparkles,
  Award,
  HeartHandshake
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import {
  loadCmsContent,
  DEFAULT_CMS_CONTENT,
  type LandingContentPayload,
  type HeroSlideItem,
  type MarketProductItem,
  type ActionCampaignItem,
  type NewsArticleItem,
  type FaqItem,
} from "../../utils/cmsStorage";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import "./LandingPage.css";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  // ── CMS Dynamic State ────────────────────────────────────────────────────────
  const [cmsContent, setCmsContent] = useState<LandingContentPayload>(DEFAULT_CMS_CONTENT);
  const [loadingCms, setLoadingCms] = useState<boolean>(true);

  // ── Navigation & Dropdown State ──────────────────────────────────────────────
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);
  const [isBantuanOpen, setIsBantuanOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("tentang");

  // ── Modals State ─────────────────────────────────────────────────────────────
  const [selectedNews, setSelectedNews] = useState<NewsArticleItem | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ActionCampaignItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MarketProductItem | null>(null);
  const [showCalculatorModal, setShowCalculatorModal] = useState<boolean>(false);

  // ── Cart Simulation Feedback ─────────────────────────────────────────────────
  const [cartSuccessId, setCartSuccessId] = useState<string | null>(null);

  // ── Hero Carousel State ──────────────────────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const carouselTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // ── Waste Calculator Simulation State ────────────────────────────────────────
  const [calcOrganicKg, setCalcOrganicKg] = useState<number>(15);
  const [calcPlasticKg, setCalcPlasticKg] = useState<number>(8);
  const [calcOilLiters, setCalcOilLiters] = useState<number>(3);

  // ── Load Dynamic CMS Content (IndexedDB + API Hybrid) ─────────────────────────
  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      // 1. Instant load from local cache (IndexedDB/LocalStorage)
      try {
        const localStored = await loadCmsContent();
        if (isMounted && localStored?.data) {
          setCmsContent(localStored.data);
        }
      } catch (err) {
        console.warn("[LandingPage] Failed to fetch local CMS content:", err);
      } finally {
        if (isMounted) setLoadingCms(false);
      }

      // 2. Fetch latest server-curated configuration
      try {
        const res = await api.get("/system/landing-content");
        if (isMounted && res.data?.success && res.data?.data) {
          const serverData = res.data.data;
          setCmsContent(serverData);
          await saveCmsContent(serverData);
        }
      } catch (err) {
        console.info("[LandingPage] Operating with cached/offline CMS content.");
      }
    };

    fetchContent();

    // Listen to real-time custom CMS update events from admin tab
    const handleCmsUpdate = (e: any) => {
      const detail = e?.detail?.data || e?.detail;
      if (detail && typeof detail === "object") {
        setCmsContent(detail);
      }
    };

    window.addEventListener("berseka_cms_updated", handleCmsUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("berseka_cms_updated", handleCmsUpdate);
    };
  }, []);

  const rawSlides = cmsContent?.heroSlides && cmsContent.heroSlides.length > 0
    ? cmsContent.heroSlides
    : DEFAULT_CMS_CONTENT.heroSlides;
  const slides: HeroSlideItem[] = rawSlides.filter((s) => s.isPublished !== false);

  const rawProducts = cmsContent?.marketProducts && cmsContent.marketProducts.length > 0
    ? cmsContent.marketProducts
    : DEFAULT_CMS_CONTENT.marketProducts;
  const products: MarketProductItem[] = rawProducts.filter((p) => p.isPublished !== false);

  const rawPrograms = cmsContent?.actionCampaigns && cmsContent.actionCampaigns.length > 0
    ? cmsContent.actionCampaigns
    : DEFAULT_CMS_CONTENT.actionCampaigns;
  const programs: ActionCampaignItem[] = rawPrograms.filter((p) => p.isPublished !== false);

  const rawNews = cmsContent?.newsItems && cmsContent.newsItems.length > 0
    ? cmsContent.newsItems
    : DEFAULT_CMS_CONTENT.newsItems;
  const newsList: NewsArticleItem[] = rawNews.filter((n) => n.isPublished !== false);

  const faqList: FaqItem[] = cmsContent?.faqItems && cmsContent.faqItems.length > 0
    ? cmsContent.faqItems
    : DEFAULT_CMS_CONTENT.faqItems;

  // ── Hero Carousel Controls ───────────────────────────────────────────────────
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide((index + slides.length) % slides.length);
  }, [slides.length]);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  const restartTimer = useCallback(() => {
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    carouselTimerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
  }, [slides.length]);

  useEffect(() => {
    restartTimer();
    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, [restartTimer]);

  const handleCarouselMouseEnter = () => {
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
  };

  const handleCarouselMouseLeave = () => {
    restartTimer();
  };

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
        restartTimer();
      } else if (e.key === "ArrowRight") {
        nextSlide();
        restartTimer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, restartTimer]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) nextSlide();
      else prevSlide();
      restartTimer();
    }
    touchStartXRef.current = null;
  };

  // ── Count-Up Intersection Animation for Impact Metrics ────────────────────────
  const [metricCounts, setMetricCounts] = useState({
    managed: 0,
    recycled: 0,
    emissions: 0,
    citizens: 0,
  });
  const metricsSectionRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef<boolean>(false);

  useEffect(() => {
    const targets = {
      managed: 128.4,
      recycled: 67.2,
      emissions: 193.6,
      citizens: 2146,
    };

    const animateMetrics = () => {
      if (animatedRef.current) return;
      animatedRef.current = true;
      const duration = 1500;
      const start = performance.now();

      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        setMetricCounts({
          managed: parseFloat((targets.managed * ease).toFixed(1)),
          recycled: parseFloat((targets.recycled * ease).toFixed(1)),
          emissions: parseFloat((targets.emissions * ease).toFixed(1)),
          citizens: Math.floor(targets.citizens * ease),
        });

        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateMetrics();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (metricsSectionRef.current) {
      observer.observe(metricsSectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // ── Smart Sticky Navbar (Hide on scroll down, show on scroll up) ────────────
  const [isNavbarVisible, setIsNavbarVisible] = useState<boolean>(true);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const lastScrollYRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 20);

      // If mobile nav is open, keep navbar visible
      if (isNavOpen) {
        setIsNavbarVisible(true);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (currentScrollY <= 80) {
        setIsNavbarVisible(true);
      } else if (currentScrollY > lastScrollYRef.current + 8) {
        // Scrolling DOWN -> smoothly hide navbar
        setIsNavbarVisible(false);
        setIsBantuanOpen(false);
      } else if (currentScrollY < lastScrollYRef.current - 8) {
        // Scrolling UP -> smoothly reveal navbar
        setIsNavbarVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isNavOpen]);

  // ── FAQ Accordion Open State ─────────────────────────────────────────────────
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  // ── Cart Simulation Action ───────────────────────────────────────────────────
  const handleAddToCart = (product: MarketProductItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setCartSuccessId(product.id);
    showToast.success(`"${product.title}" berhasil ditambahkan ke keranjang.`);
    setTimeout(() => {
      setCartSuccessId(null);
    }, 1800);
  };

  // ── Calculator Computed Values ───────────────────────────────────────────────
  const calculatedPoints = Math.round(calcOrganicKg * 15 + calcPlasticKg * 25 + calcOilLiters * 40);
  const calculatedCo2 = ((calcOrganicKg * 1.2 + calcPlasticKg * 2.8 + calcOilLiters * 3.5) / 10).toFixed(1);
  const calculatedCashIdr = calculatedPoints * 100;

  return (
    <div className="landing-page-root">
      {/* =========================================================
          1. HEADER NAVIGATION (SMART STICKY)
          ========================================================= */}
      <header
        className={`landing-header ${!isNavbarVisible ? "is-hidden" : ""} ${
          isScrolled ? "is-scrolled" : ""
        }`}
      >
        <div className="landing-container landing-header-inner">
          <a href="#" className="landing-brand" aria-label="BERSEKA.ID — Beranda">
            <img
              src="/image/logo-berseka-baru.jpeg"
              alt="BERSEKA.ID"
              className="landing-brand-logo"
            />
          </a>

          {/* Desktop & Mobile Navigation Links */}
          <nav aria-label="Navigasi utama">
            <ul className={`landing-nav ${isNavOpen ? "is-open" : ""}`} id="mainNav">
              <li>
                <a
                  href="#tentang"
                  className={activeSection === "tentang" ? "active-link" : ""}
                  onClick={() => setIsNavOpen(false)}
                >
                  Beranda
                </a>
              </li>
              <li>
                <a
                  href="#ekosistem"
                  className={activeSection === "ekosistem" ? "active-link" : ""}
                  onClick={() => setIsNavOpen(false)}
                >
                  Ekosistem
                </a>
              </li>
              <li>
                <a
                  href="#program"
                  className={activeSection === "program" ? "active-link" : ""}
                  onClick={() => setIsNavOpen(false)}
                >
                  Program
                </a>
              </li>
              <li>
                <a
                  href="#pasar"
                  className={activeSection === "pasar" ? "active-link" : ""}
                  onClick={() => setIsNavOpen(false)}
                >
                  Pasar Berseka
                </a>
              </li>
              <li>
                <a
                  href="#dampak"
                  className={activeSection === "dampak" ? "active-link" : ""}
                  onClick={() => setIsNavOpen(false)}
                >
                  Dampak
                </a>
              </li>
              <li>
                <a
                  href="#berita"
                  className={activeSection === "berita" ? "active-link" : ""}
                  onClick={() => setIsNavOpen(false)}
                >
                  Berita
                </a>
              </li>
              <li>
                <button
                  type="button"
                  aria-expanded={isBantuanOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBantuanOpen(!isBantuanOpen);
                  }}
                >
                  <span>Bantuan</span>
                  <ChevronDown size={14} />
                </button>
                <div className={`landing-dropdown ${isBantuanOpen ? "is-open" : ""}`} id="dropBantuan">
                  <a
                    href="#faq"
                    onClick={() => {
                      setIsBantuanOpen(false);
                      setIsNavOpen(false);
                    }}
                  >
                    FAQ (Tanya Jawab)
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBantuanOpen(false);
                      setIsNavOpen(false);
                      setShowCalculatorModal(true);
                    }}
                  >
                    Kalkulator BERSEKA
                  </button>
                </div>
              </li>
              <li className="landing-nav-auth-mobile">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNavOpen(false);
                      navigate("/dashboard");
                    }}
                    className="landing-btn landing-btn-primary w-full text-center justify-center"
                  >
                    Dasbor Saya
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsNavOpen(false)}
                    className="landing-btn landing-btn-primary w-full text-center justify-center"
                  >
                    Masuk
                  </Link>
                )}
              </li>
            </ul>
          </nav>

          {/* Action Button & Mobile Hamburger Toggle */}
          <div className="landing-header-actions">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="landing-btn landing-btn-primary landing-btn-sm"
              >
                Dasbor Saya
              </button>
            ) : (
              <Link
                to="/login"
                className="landing-btn landing-btn-outline landing-btn-sm"
              >
                Masuk
              </Link>
            )}

            <button
              type="button"
              className="landing-nav-toggle"
              onClick={() => setIsNavOpen(!isNavOpen)}
              aria-expanded={isNavOpen}
              aria-label={isNavOpen ? "Tutup menu" : "Buka menu"}
            >
              {isNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* =========================================================
            2. HERO SECTION & SLIDING CAROUSEL
            ========================================================= */}
        <section className="landing-hero" id="tentang">
          <div className="landing-container landing-hero-grid">
            <div>
              <p className="landing-hero-kicker">Platform Pengelolaan Sampah Terpadu</p>
              <h1 className="landing-hero-title">
                Sampah Terkelola,<br />Kampung Lebih Berdaya
              </h1>
              <p className="landing-hero-lead">
                BERSEKA menghubungkan warga, petugas, armada, fasilitas pengolahan, pemerintah,
                akademisi, dan pasar sirkular dalam satu ekosistem berbasis Web, Mobile, IoT, AI, GIS,
                QR Code, dan gamifikasi untuk mewujudkan ekonomi sirkular.
              </p>
              <div className="landing-hero-actions">
                <a href="#program" className="landing-btn landing-btn-primary">
                  Jelajahi Program
                </a>
                <Link
                  to="/download"
                  className="landing-btn landing-btn-outline"
                >
                  <ArrowRight size={16} />
                  Download Aplikasi
                </Link>
              </div>
            </div>

            {/* Interactive Carousel */}
            <div
              className="landing-carousel"
              id="heroCarousel"
              role="region"
              aria-roledescription="carousel"
              aria-label="Foto kegiatan BERSEKA"
              onMouseEnter={handleCarouselMouseEnter}
              onMouseLeave={handleCarouselMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="landing-carousel-track"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="landing-carousel-slide"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${idx + 1} dari ${slides.length}`}
                  >
                    <figure className="landing-media" data-label={slide.image}>
                      <img
                        src={slide.image}
                        alt={slide.title}
                        loading={idx === 0 ? "eager" : "lazy"}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/image/kkn-hero-sorting.webp";
                        }}
                      />
                    </figure>
                    <div className="landing-slide-overlay" />
                    <div className="landing-slide-caption">
                      {slide.badge && <span className="landing-slide-badge">{slide.badge}</span>}
                      <div>{slide.title}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Prev / Next Buttons */}
              <button
                type="button"
                className="landing-carousel-btn prev"
                onClick={() => {
                  prevSlide();
                  restartTimer();
                }}
                aria-label="Slide sebelumnya"
              >
                <ChevronLeft size={18} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                className="landing-carousel-btn next"
                onClick={() => {
                  nextSlide();
                  restartTimer();
                }}
                aria-label="Slide berikutnya"
              >
                <ChevronRight size={18} strokeWidth={2.4} />
              </button>

              {/* Dot Indicators */}
              <div className="landing-carousel-dots" role="tablist" aria-label="Pilih slide">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={currentSlide === idx}
                    aria-label={`Ke slide ${idx + 1}`}
                    onClick={() => {
                      goToSlide(idx);
                      restartTimer();
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="landing-container">
            <div className="landing-stats">
              <div className="landing-stat">
                <Users size={30} strokeWidth={1.8} />
                <div>
                  <div className="landing-stat-value">750+</div>
                  <div className="landing-stat-label">Pengguna Pilot</div>
                </div>
              </div>
              <div className="landing-stat">
                <Building2 size={30} strokeWidth={1.8} />
                <div>
                  <div className="landing-stat-value">6</div>
                  <div className="landing-stat-label">Kelurahan</div>
                </div>
              </div>
              <div className="landing-stat">
                <Database size={30} strokeWidth={1.8} />
                <div>
                  <div className="landing-stat-value">Data</div>
                  <div className="landing-stat-label">Tercatat</div>
                </div>
              </div>
              <div className="landing-stat">
                <HeartHandshake size={30} strokeWidth={1.8} />
                <div>
                  <div className="landing-stat-value">Kolaborasi</div>
                  <div className="landing-stat-label">Multi-Pihak</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            3. EKOSISTEM BERSEKA (6 FLOW STEPS)
            ========================================================= */}
        <section className="landing-section" id="ekosistem">
          <div className="landing-container">
            <div className="landing-section-head">
              <h2 className="landing-section-title">Ekosistem BERSEKA</h2>
            </div>
            <ol className="landing-flow" aria-label="Alur ekosistem dari rumah tangga sampai pasar sirkular">
              <li className="landing-flow-item">
                <span className="landing-flow-num">1</span>
                <div className="landing-flow-icon">
                  <Home size={32} strokeWidth={1.6} />
                </div>
                <h3>Rumah Tangga</h3>
                <p>Pilah sampah dari sumber</p>
              </li>
              <li className="landing-flow-item">
                <span className="landing-flow-num">2</span>
                <div className="landing-flow-icon">
                  <UserCheck size={32} strokeWidth={1.6} />
                </div>
                <h3>Petugas</h3>
                <p>Pengumpulan &amp; pendataan</p>
              </li>
              <li className="landing-flow-item">
                <span className="landing-flow-num">3</span>
                <div className="landing-flow-icon">
                  <Truck size={32} strokeWidth={1.6} />
                </div>
                <h3>Armada</h3>
                <p>Pengangkutan terjadwal</p>
              </li>
              <li className="landing-flow-item">
                <span className="landing-flow-num">4</span>
                <div className="landing-flow-icon">
                  <Factory size={32} strokeWidth={1.6} />
                </div>
                <h3>Pengolahan</h3>
                <p>Pemrosesan &amp; valorisasi</p>
              </li>
              <li className="landing-flow-item">
                <span className="landing-flow-num">5</span>
                <div className="landing-flow-icon">
                  <Landmark size={32} strokeWidth={1.6} />
                </div>
                <h3>Pemerintah</h3>
                <p>Kebijakan &amp; pengawasan</p>
              </li>
              <li className="landing-flow-item">
                <span className="landing-flow-num">6</span>
                <div className="landing-flow-icon">
                  <ShoppingBag size={32} strokeWidth={1.6} />
                </div>
                <h3>Pasar Sirkular</h3>
                <p>Produk &amp; material bernilai</p>
              </li>
            </ol>
          </div>
        </section>

        {/* =========================================================
            4. PROGRAM BERSEKA
            ========================================================= */}
        <section className="landing-section" id="program">
          <div className="landing-container">
            <div className="landing-section-head">
              <h2 className="landing-section-title">Program BERSEKA</h2>
            </div>
            <div className="landing-grid-3">
              {programs.slice(0, 3).map((item) => (
                <article key={item.id} className="landing-card">
                  <figure className="landing-media" data-label={item.imageUrl}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                      }}
                    />
                    <span className="landing-badge">{item.categoryLabel || "Program"}</span>
                  </figure>
                  <div className="landing-card-body">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedProgram(item)}
                      className="landing-link-more"
                    >
                      <span>Lihat Program</span>
                      <ArrowRight size={14} strokeWidth={2.2} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            5. PASAR BERSEKA (CIRCULAR ECONOMY PRODUCTS)
            ========================================================= */}
        <section className="landing-section" id="pasar">
          <div className="landing-container">
            <div className="landing-section-head">
              <h2 className="landing-section-title">Pasar BERSEKA</h2>
            </div>
            <div className="landing-grid-3">
              {products.slice(0, 3).map((prod) => (
                <article
                  key={prod.id}
                  className="landing-card landing-product"
                  onClick={() => setSelectedProduct(prod)}
                  style={{ cursor: "pointer" }}
                >
                  <figure className="landing-media" data-label={prod.imageUrl}>
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/image/activity-2.webp";
                      }}
                    />
                  </figure>
                  <div className="landing-card-body">
                    <h3>{prod.title}</h3>
                    <p className="landing-product-meta">{prod.unit || prod.categoryLabel}</p>
                    <div className="landing-product-row">
                      <div className="landing-price-wrap">
                        <span className="landing-price">Rp{prod.priceIdr?.toLocaleString("id-ID") || 0}</span>
                        {prod.pricePoints ? (
                          <span className="landing-points-badge">{prod.pricePoints} Poin</span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className={`landing-icon-btn ${cartSuccessId === prod.id ? "is-success" : ""}`}
                        aria-label={`Tambahkan ${prod.title} ke keranjang`}
                        onClick={(e) => handleAddToCart(prod, e)}
                      >
                        {cartSuccessId === prod.id ? (
                          <Check size={16} strokeWidth={2.4} />
                        ) : (
                          <ShoppingBag size={16} strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            6. DAMPAK YANG TERUKUR (ANIMATED IMPACT METRICS)
            ========================================================= */}
        <section className="landing-section" id="dampak">
          <div className="landing-container" ref={metricsSectionRef}>
            <div className="landing-section-head">
              <h2 className="landing-section-title">Dampak yang Terukur</h2>
            </div>
            <div className="landing-metrics">
              <div className="landing-metric">
                <Scale size={40} strokeWidth={1.6} />
                <div>
                  <div className="landing-metric-label">Sampah Terkelola</div>
                  <div className="landing-metric-value">
                    <span>{metricCounts.managed.toLocaleString("id-ID", { minimumFractionDigits: 1 })}</span>
                    <small>ton</small>
                  </div>
                  <div className="landing-metric-note">Total kumulatif</div>
                </div>
              </div>

              <div className="landing-metric">
                <Recycle size={40} strokeWidth={1.6} />
                <div>
                  <div className="landing-metric-label">Sampah Didaur Ulang</div>
                  <div className="landing-metric-value">
                    <span>{metricCounts.recycled.toLocaleString("id-ID", { minimumFractionDigits: 1 })}</span>
                    <small>ton</small>
                  </div>
                  <div className="landing-metric-note">52,3% dari total</div>
                </div>
              </div>

              <div className="landing-metric">
                <Trees size={40} strokeWidth={1.6} />
                <div>
                  <div className="landing-metric-label">Emisi Terhindari</div>
                  <div className="landing-metric-value">
                    <span>{metricCounts.emissions.toLocaleString("id-ID", { minimumFractionDigits: 1 })}</span>
                    <small>ton CO₂e</small>
                  </div>
                  <div className="landing-metric-note">Setara menanam 8.431 pohon</div>
                </div>
              </div>

              <div className="landing-metric">
                <Users size={40} strokeWidth={1.6} />
                <div>
                  <div className="landing-metric-label">Partisipasi Warga</div>
                  <div className="landing-metric-value">
                    <span>{metricCounts.citizens.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="landing-metric-note">Warga aktif berpartisipasi</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            7. KONTRIBUSI TERHADAP SDGs
            ========================================================= */}
        <section className="landing-section" id="sdgs">
          <div className="landing-container">
            <div className="landing-section-head">
              <h2 className="landing-section-title">Kontribusi terhadap SDGs</h2>
            </div>
            <div className="landing-sdgs">
              {/* SDG 8 */}
              <div className="landing-sdg">
                <div className="landing-sdg-tile" style={{ background: "var(--sdg-8)" }}>
                  <div className="landing-sdg-head">
                    <span className="landing-sdg-num">8</span>
                    <span className="landing-sdg-name">Decent Work and Economic Growth</span>
                  </div>
                  <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 17 9 11l4 4 8-8" /><path d="M15 7h6v6" /><path d="M3 21h18" />
                  </svg>
                </div>
                <p>Mendorong pekerjaan layak dan ekonomi lokal melalui pengelolaan sampah dan pasar sirkular.</p>
              </div>

              {/* SDG 11 */}
              <div className="landing-sdg">
                <div className="landing-sdg-tile" style={{ background: "var(--sdg-11)" }}>
                  <div className="landing-sdg-head">
                    <span className="landing-sdg-num">11</span>
                    <span className="landing-sdg-name">Sustainable Cities and Communities</span>
                  </div>
                  <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" /><path d="M5 21V9l4-3 4 3v12" /><path d="M13 21V5h6v16" /><path d="M8 12h2M8 16h2M16 9h1M16 13h1M16 17h1" />
                  </svg>
                </div>
                <p>Mewujudkan kampung yang inklusif, aman, tangguh, dan berkelanjutan.</p>
              </div>

              {/* SDG 12 */}
              <div className="landing-sdg">
                <div className="landing-sdg-tile" style={{ background: "var(--sdg-12)" }}>
                  <div className="landing-sdg-head">
                    <span className="landing-sdg-num">12</span>
                    <span className="landing-sdg-name">Responsible Consumption and Production</span>
                  </div>
                  <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 12c-2-3-4-4.5-6.5-4.5A4.5 4.5 0 0 0 5.5 16.5C8 16.5 10 15 12 12s4-4.5 6.5-4.5a4.5 4.5 0 0 1 0 9C16 16.5 14 15 12 12Z" />
                  </svg>
                </div>
                <p>Mengurangi sampah, meningkatkan daur ulang, dan konsumsi berkelanjutan.</p>
              </div>

              {/* SDG 13 */}
              <div className="landing-sdg">
                <div className="landing-sdg-tile" style={{ background: "var(--sdg-13)" }}>
                  <div className="landing-sdg-head">
                    <span className="landing-sdg-num">13</span>
                    <span className="landing-sdg-name">Climate Action</span>
                  </div>
                  <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3.5" /><path d="M12 8.5c1 1 1 2 0 3.5s-1 2.5 0 3.5" />
                  </svg>
                </div>
                <p>Mengurangi emisi dan dampak perubahan iklim melalui pengelolaan sampah berkelanjutan.</p>
              </div>

              {/* SDG 17 */}
              <div className="landing-sdg">
                <div className="landing-sdg-tile" style={{ background: "var(--sdg-17)" }}>
                  <div className="landing-sdg-head">
                    <span className="landing-sdg-num">17</span>
                    <span className="landing-sdg-name">Partnerships for the Goals</span>
                  </div>
                  <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3.5" /><circle cx="8" cy="14" r="3.5" /><circle cx="16" cy="14" r="3.5" /><circle cx="12" cy="17" r="3.5" /><circle cx="7" cy="9" r="3.5" /><circle cx="17" cy="9" r="3.5" />
                  </svg>
                </div>
                <p>Menguatkan kolaborasi multi-pihak untuk mencapai tujuan pembangunan berkelanjutan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            8. BERITA & CERITA LAPANGAN
            ========================================================= */}
        <section className="landing-section landing-news" id="berita">
          <div className="landing-container">
            <div className="landing-section-head">
              <h2 className="landing-section-title">Berita &amp; Cerita Lapangan</h2>
              <a href="#berita" className="landing-link-more">
                <span>Lihat Semua Berita</span>
                <ArrowRight size={14} strokeWidth={2.2} />
              </a>
            </div>
            <div className="landing-grid-3">
              {newsList.slice(0, 3).map((news) => (
                <article
                  key={news.id}
                  className="landing-card"
                  onClick={() => setSelectedNews(news)}
                  style={{ cursor: "pointer" }}
                >
                  <figure className="landing-media" data-label={news.imageUrl}>
                    <img
                      src={news.imageUrl}
                      alt={news.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/image/activity-3.webp";
                      }}
                    />
                  </figure>
                  <div className="landing-card-body">
                    <div className="landing-news-meta">
                      <span className="tag">{news.category}</span>
                      <time dateTime="2026-05-01">{news.date}</time>
                    </div>
                    <h3>{news.title}</h3>
                    <p>{news.summary}</p>
                    <button
                      type="button"
                      className="landing-link-more"
                      aria-label={`Baca berita: ${news.title}`}
                    >
                      <ArrowRight size={16} strokeWidth={2.2} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            9. FAQ ACCORDION
            ========================================================= */}
        <section className="landing-section" id="faq">
          <div className="landing-container">
            <div className="landing-section-head">
              <h2 className="landing-section-title">Pertanyaan Umum (FAQ)</h2>
            </div>
            <div className="landing-faq-wrap">
              {faqList.map((faq, idx) => (
                <div key={idx} className="landing-faq-item">
                  <button
                    type="button"
                    className="landing-faq-trigger"
                    aria-expanded={openFaqIndex === idx}
                    onClick={() => toggleFaq(idx)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} />
                  </button>
                  {openFaqIndex === idx && (
                    <div className="landing-faq-body">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            10. KONTAK & CDC UNIKOM BAND
            ========================================================= */}
        <section className="landing-section" id="kontak" style={{ paddingTop: 8 }}>
          <div className="landing-container">
            <div className="landing-contact">
              <div>
                <h2>Butuh Informasi tentang BERSEKA?</h2>
                <p>
                  Hubungi CDC UNIKOM untuk informasi pemilahan sampah, pesanan produk pasar berseka,
                  dan kemitraan wilayah.
                </p>
              </div>
              <div className="landing-contact-list">
                <div className="landing-contact-item">
                  <Phone size={20} strokeWidth={1.8} />
                  <div>
                    <small>WhatsApp Hotline</small>
                    <strong>+62 857-1551-6065</strong>
                  </div>
                </div>
                <div className="landing-contact-item">
                  <Mail size={20} strokeWidth={1.8} />
                  <div>
                    <small>Email Resmi</small>
                    <strong>cdc@unikom.ac.id</strong>
                  </div>
                </div>
                <div className="landing-contact-item wide">
                  <MapPin size={20} strokeWidth={1.8} />
                  <div>
                    <strong>
                      Jl. Dipati Ukur No. 112–116, Lebakgede, Kec. Coblong, Kota Bandung, Jawa Barat 40132
                    </strong>
                  </div>
                </div>
              </div>
              <a
                href="https://wa.me/6285715516065"
                className="landing-btn landing-btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Hubungi CDC UNIKOM</span>
                <ArrowRight size={14} strokeWidth={2.2} />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
          11. FOOTER
          ========================================================= */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div className="landing-footer-about">
              <a href="#" className="landing-brand" aria-label="BERSEKA.ID">
                <img
                  src="/image/logo-berseka-baru.jpeg"
                  alt="BERSEKA.ID"
                  className="landing-brand-logo"
                />
              </a>
              <p>
                Platform pengelolaan sampah terpadu berbasis teknologi dan kolaborasi multi-pihak
                untuk mewujudkan kampung lebih bersih, sehat, dan asri.
              </p>
              <div className="landing-social">
                <a
                  href="https://www.instagram.com/officialberseka.id?igsi=MTU3b2pxdDc1cTNiYQ=="
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/channel/UC63-06Rpun65aeNgxw6lg3A"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3z" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4>Tautan Cepat</h4>
              <ul>
                <li><a href="#">Beranda</a></li>
                <li><a href="#tentang">Tentang</a></li>
                <li><a href="#program">Program</a></li>
                <li><a href="#pasar">Pasar Berseka</a></li>
                <li><a href="#dampak">Dampak</a></li>
                <li><a href="#berita">Berita</a></li>
              </ul>
            </div>

            <div>
              <h4>Program</h4>
              <ul>
                <li><a href="#program">Pemilahan dari Rumah</a></li>
                <li><a href="#program">Bank Sampah &amp; Pengolahan</a></li>
                <li><a href="#program">Edukasi dan KKN Berdampak</a></li>
                <li><a href="#program">Armada &amp; Pengangkutan</a></li>
                <li><a href="#program">Monitoring &amp; Teknologi</a></li>
              </ul>
            </div>

            <div>
              <h4>Bantuan</h4>
              <ul>
                <li><a href="#faq">FAQ</a></li>
                <li>
                  <button type="button" onClick={() => setShowCalculatorModal(true)}>
                    Kalkulator BERSEKA
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4>CDC UNIKOM</h4>
              <ul className="landing-footer-contact">
                <li>
                  <Phone size={16} strokeWidth={1.8} />
                  <span>+62 857-1551-6065</span>
                </li>
                <li>
                  <Mail size={16} strokeWidth={1.8} />
                  <span>cdc@unikom.ac.id</span>
                </li>
                <li>
                  <MapPin size={16} strokeWidth={1.8} />
                  <span>Jl. Dipati Ukur No. 112–116, Lebakgede, Kec. Coblong, Kota Bandung, Jawa Barat 40132</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="landing-footer-bottom">
            © 2026 Universitas Komputer Indonesia. Hak cipta dilindungi.
          </div>
        </div>
      </footer>

      {/* =========================================================
          12. INTERACTIVE MODALS (NEWS, PROGRAM, PRODUCT, CALCULATOR)
          ========================================================= */}

      {/* News Article Reader Modal */}
      {selectedNews && (
        <div className="landing-modal-backdrop" onClick={() => setSelectedNews(null)}>
          <div className="landing-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="landing-modal-close"
              onClick={() => setSelectedNews(null)}
              aria-label="Tutup berita"
            >
              <X size={18} />
            </button>
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
              <img
                src={selectedNews.imageUrl}
                alt={selectedNews.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/image/activity-3.webp";
                }}
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider">
                {selectedNews.category}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
                <span>{selectedNews.date}</span>
                {selectedNews.readTime && <span>• {selectedNews.readTime}</span>}
                {selectedNews.author && <span>• Oleh: {selectedNews.author}</span>}
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {selectedNews.title}
              </h2>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3 whitespace-pre-line border-t border-slate-100 pt-4">
                {selectedNews.content || selectedNews.summary}
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedNews(null)}
                  className="landing-btn landing-btn-primary landing-btn-sm"
                >
                  Tutup Artikel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Detail Modal */}
      {selectedProgram && (
        <div className="landing-modal-backdrop" onClick={() => setSelectedProgram(null)}>
          <div className="landing-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="landing-modal-close"
              onClick={() => setSelectedProgram(null)}
              aria-label="Tutup program"
            >
              <X size={18} />
            </button>
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
              <img
                src={selectedProgram.imageUrl}
                alt={selectedProgram.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                }}
              />
              <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-sm">
                BERSEKA (Bersih, Sehat, Kampung Asri) adalah platform cerdas pengelolaan sampah terintegrasi berbasis partisipasi warga dan civitas akademika Universitas Komputer Indonesia.
              </p>
              <div className="text-xs text-slate-500 font-semibold space-y-1">
                <p>📍 Jl. Dipati Ukur No. 112-116, Coblong, Kota Bandung</p>
                <p>📧 admin@berseka.id <span className="text-[11px] text-slate-400 font-normal">(Cadangan: admin.berseka@gmail.com)</span></p>
                <p>📷 Instagram: <a href="https://www.instagram.com/officialberseka.id?igsi=MTU3b2pxdDc1cTNiYQ==" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">@officialberseka.id</a></p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {selectedProgram.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedProgram.description}
              </p>
              {selectedProgram.impactHighlight && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs font-semibold">
                  🌱 <strong>Capaian Dampak:</strong> {selectedProgram.impactHighlight}
                </div>
              )}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  Inisiator: <strong>{selectedProgram.initiator || "KKN UNIKOM"}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProgram(null)}
                  className="landing-btn landing-btn-primary landing-btn-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="landing-modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="landing-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="landing-modal-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Tutup produk"
            >
              <X size={18} />
            </button>
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/image/activity-2.webp";
                }}
              />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {selectedProduct.title}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {selectedProduct.unit || selectedProduct.categoryLabel}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-700">
                    Rp{selectedProduct.priceIdr?.toLocaleString("id-ID") || 0}
                  </div>
                  {selectedProduct.pricePoints ? (
                    <div className="text-xs font-bold text-amber-600">
                      atau {selectedProduct.pricePoints} Poin
                    </div>
                  ) : null}
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedProduct.description}
              </p>
              {selectedProduct.benefits && selectedProduct.benefits.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-xs font-bold text-slate-700">Manfaat Utama:</div>
                  <ul className="space-y-1">
                    {selectedProduct.benefits.map((b, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                        <Check size={14} className="text-emerald-600 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="pt-4 flex items-center justify-end border-t border-slate-100 gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    handleAddToCart(selectedProduct, e);
                    setSelectedProduct(null);
                  }}
                  className="landing-btn landing-btn-primary landing-btn-sm"
                >
                  <ShoppingBag size={14} />
                  <span>Pesan Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kalkulator BERSEKA Modal */}
      {showCalculatorModal && (
        <div className="landing-modal-backdrop" onClick={() => setShowCalculatorModal(false)}>
          <div className="landing-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="landing-modal-close"
              onClick={() => setShowCalculatorModal(false)}
              aria-label="Tutup kalkulator"
            >
              <X size={18} />
            </button>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Calculator size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Kalkulator Berkah Sampah</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Hitung estimasi perolehan Poin BERSEKA &amp; reduksi emisi karbon rumah tangga Anda.
                  </p>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Sampah Organik / Sisa Dapur</span>
                    <span className="text-emerald-700 font-black">{calcOrganicKg} kg/minggu</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={calcOrganicKg}
                    onChange={(e) => setCalcOrganicKg(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Sampah Anorganik (Plastik/Kardus/Botol)</span>
                    <span className="text-emerald-700 font-black">{calcPlasticKg} kg/minggu</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={calcPlasticKg}
                    onChange={(e) => setCalcPlasticKg(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Minyak Jelantah Sisa Masak</span>
                    <span className="text-emerald-700 font-black">{calcOilLiters} Liter/bulan</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={calcOilLiters}
                    onChange={(e) => setCalcOilLiters(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>

              {/* Estimation Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex sm:flex-col items-center sm:items-center justify-between sm:justify-center text-left sm:text-center">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800">Estimasi Poin</div>
                    <div className="text-[10px] text-emerald-600 sm:hidden">Poin BERSEKA</div>
                  </div>
                  <div className="text-right sm:text-center">
                    <div className="text-base sm:text-lg font-black text-emerald-700">+{calculatedPoints}</div>
                    <div className="text-[10px] text-emerald-600 hidden sm:block">Poin BERSEKA</div>
                  </div>
                </div>
                <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex sm:flex-col items-center sm:items-center justify-between sm:justify-center text-left sm:text-center">
                  <div>
                    <div className="text-[11px] font-bold text-blue-800">Nilai Konversi</div>
                    <div className="text-[10px] text-blue-600 sm:hidden">Sembako / Kebutuhan</div>
                  </div>
                  <div className="text-right sm:text-center">
                    <div className="text-base sm:text-lg font-black text-blue-700">Rp{calculatedCashIdr.toLocaleString("id-ID")}</div>
                    <div className="text-[10px] text-blue-600 hidden sm:block">Sembako/Kebutuhan</div>
                  </div>
                </div>
                <div className="p-3 sm:p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex sm:flex-col items-center sm:items-center justify-between sm:justify-center text-left sm:text-center">
                  <div>
                    <div className="text-[11px] font-bold text-teal-800">Reduksi Emisi</div>
                    <div className="text-[10px] text-teal-600 sm:hidden">CO₂e Tercegah</div>
                  </div>
                  <div className="text-right sm:text-center">
                    <div className="text-base sm:text-lg font-black text-teal-700">{calculatedCo2} kg</div>
                    <div className="text-[10px] text-teal-600 hidden sm:block">CO₂e Tercegah</div>
                  </div>
                </div>
              </div>

              {/* Kontak WhatsApp & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://wa.me/6285715516065"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 bg-green-50 hover:bg-green-100/80 border border-green-200 rounded-2xl flex items-center gap-3 text-green-900 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-green-700 font-bold block uppercase tracking-wider">WhatsApp Hotline</span>
                    <span className="text-xs font-black text-green-950">+62 857-1551-6065</span>
                  </div>
                </a>

                <a
                  href="mailto:admin@berseka.id"
                  className="p-3.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-900 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#0468bf] text-white flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-700 font-bold block uppercase tracking-wider">Email Resmi</span>
                    <span className="text-xs font-black text-blue-950">admin@berseka.id</span>
                    <span className="text-[10px] text-slate-500 block font-normal">Cadangan: admin.berseka@gmail.com</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
