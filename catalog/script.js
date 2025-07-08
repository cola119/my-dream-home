class MansionCatalog {
    constructor() {
        this.filterTabs = document.querySelectorAll('.filter-tab');
        this.mansionCards = document.querySelectorAll('.mansion-card');
        this.navbar = document.querySelector('.navbar');
        this.init();
    }

    init() {
        this.setupFilterTabs();
        this.setupScrollEffects();
        this.setupSmoothScrolling();
        this.setupIntersectionObserver();
    }

    setupFilterTabs() {
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                this.filterMansions(filter);
                this.setActiveTab(tab);
            });
        });
    }

    filterMansions(filter) {
        this.mansionCards.forEach(card => {
            const categories = card.dataset.category;
            
            if (filter === 'all' || categories.includes(filter)) {
                this.showCard(card);
            } else {
                this.hideCard(card);
            }
        });
    }

    showCard(card) {
        card.classList.remove('hidden');
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    }

    hideCard(card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.classList.add('hidden');
        }, 300);
    }

    setActiveTab(activeTab) {
        this.filterTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }

    setupScrollEffects() {
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            // ナビバーの背景透明度調整
            if (currentScrollY > 100) {
                this.navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                this.navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                this.navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                this.navbar.style.boxShadow = 'none';
            }

            lastScrollY = currentScrollY;
        });
    }

    setupSmoothScrolling() {
        // ナビゲーションリンクのスムーススクロール
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 80; // ナビバーの高さを考慮
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // マンションカードの遅延アニメーション
        this.mansionCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            card.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(card);
        });

        // その他の要素のアニメーション
        const animatedElements = document.querySelectorAll('.feature-card, .about-feature');
        animatedElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'all 0.6s ease';
            element.style.transitionDelay = `${index * 0.2}s`;
            observer.observe(element);
        });
    }

    // パフォーマンス最適化のための画像遅延読み込み
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
}

// パフォーマンス最適化
class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.preloadCriticalImages();
        this.optimizeScrollPerformance();
    }

    preloadCriticalImages() {
        // ヒーロー画像の事前読み込み
        const heroImage = document.querySelector('.hero-image img');
        if (heroImage) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = heroImage.src;
            document.head.appendChild(link);
        }
    }

    optimizeScrollPerformance() {
        // スクロールイベントのスロットリング
        let ticking = false;
        
        function updateScrollEffects() {
            // スクロール関連の処理をここに集約
            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestTick, { passive: true });
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new MansionCatalog();
    new PerformanceOptimizer();
});

// ページロード完了後の処理
window.addEventListener('load', () => {
    // ローディングアニメーションがある場合の処理
    document.body.classList.add('loaded');
    
    // 画像の読み込み完了を確認
    const images = document.querySelectorAll('img');
    let loadedImages = 0;
    
    images.forEach(img => {
        if (img.complete) {
            loadedImages++;
        } else {
            img.addEventListener('load', () => {
                loadedImages++;
                if (loadedImages === images.length) {
                    document.body.classList.add('images-loaded');
                }
            });
        }
    });
    
    if (loadedImages === images.length) {
        document.body.classList.add('images-loaded');
    }
});

// エラーハンドリング
window.addEventListener('error', (e) => {
    console.warn('リソースの読み込みエラー:', e.filename, e.message);
});

// サービスワーカーの登録（PWA対応の準備）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/catalog/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}