/**
 * galeria.js — Galeria de fotos com UX/UI premium
 * Carrega imagens do Firestore (Base64) ou usa fallback locais
 *
 * Funcionalidades:
 * - Transição suave fade entre imagens
 * - Indicadores visuais (dots) clicáveis
 * - Thumbnails navegáveis
 * - Barra de progresso circular do auto-play
 * - Pausa ao passar mouse / toque
 * - Lightbox (tela cheia)
 * - Teclado (setas) e gestos touch (swipe)
 * - Acessibilidade completa (aria-live, aria-current, focus visible)
 */

import { db, collection, getDocs, query, orderBy } from './firebase-config.js';

// Imagens de fallback (locais) caso Firestore esteja vazio
const FALLBACK_IMAGES = ['./img/1.png', './img/11.jpg'];

/* ─────────────────────────────────────────────
   Carrega Base64 do Firestore
   ───────────────────────────────────────────── */
async function carregarFotos() {
  try {
    const q    = query(collection(db, 'galeria'), orderBy('criadoEm', 'asc'));
    const snap = await getDocs(q);

    if (snap.empty) return FALLBACK_IMAGES;

    return snap.docs.map(d => d.data().base64).filter(Boolean);
  } catch (err) {
    console.warn('[galeria.js] Falha ao carregar do Firestore, usando imagens locais.', err);
    return FALLBACK_IMAGES;
  }
}

/* ─────────────────────────────────────────────
   Classe Slider com fade, progresso e acessibilidade
   ───────────────────────────────────────────── */
class Slider {
  constructor({ elementId, containerId = null, images, interval = 4000, enableLightbox = true }) {
    this.imgEl       = document.getElementById(elementId);
    this.containerEl = containerId ? document.getElementById(containerId) : null;
    this.images      = images;
    this.interval    = interval;
    this.duration    = 700; // ms da transição fade
    this.index       = 0;
    this.timer       = null;
    this.progress    = 0;
    this.progressInc = 100 / (this.interval / 50); // atualiza a cada 50ms
    this.isPaused    = false;
    this.rafId       = null;
    this.enableLightbox = enableLightbox;

    // Elementos dinâmicos
    this.dotsEl         = document.getElementById('galeriaDots');
    this.thumbsEl       = document.getElementById('galeriaThumbnails');
    this.progressCircle = document.getElementById('progressCircle');
    this.lightboxEl     = document.getElementById('lightbox');
    this.lightboxImg    = document.getElementById('lightboxImage');
    this.lightboxCap    = document.getElementById('lightboxCaption');

    // Bind methods
    this._next         = this._next.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);

    if (this.imgEl && this.images.length > 0) {
      this._init();
    }
  }

  _init() {
    // Estado inicial
    this.imgEl.style.opacity = '1';
    this.imgEl.src = this.images[0];

    // Cria UI: dots, thumbnails
    this._createDots();
    this._createThumbnails();
    this._updateAriaLive();

    // Inicia auto-play
    this._startAuto();

    // Event listeners
    this._bindEvents();

    // Lightbox apenas se habilitado
    if (this.enableLightbox) {
      this._initLightbox();
    }
  }

  _createDots() {
    if (!this.dotsEl) return;

    this.dotsEl.innerHTML = '';
    this.images.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === 0 ? 'bg-[#833675] scale-110' : 'bg-[#833675]/30 hover:bg-[#833675]/60'}`;
      btn.setAttribute('aria-label', `Ver foto ${i + 1}`);
      btn.setAttribute('aria-current', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => {
        this.go(i);
        this._restartAuto();
      });
      this.dotsEl.appendChild(btn);
    });
  }

  _updateDots() {
    if (!this.dotsEl) return;
    const dots = this.dotsEl.querySelectorAll('button');
    dots.forEach((dot, i) => {
      const isActive = i === this.index;
      dot.className = `w-2.5 h-2.5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#833675] scale-110' : 'bg-[#833675]/30 hover:bg-[#833675]/60'}`;
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  _createThumbnails() {
    if (!this.thumbsEl || this.images.length <= 1) return;

    this.thumbsEl.innerHTML = '';
    this.images.forEach((src, i) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = `shrink-0 w-16 sm:w-20 h-14 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 snap-center ${i === 0 ? 'border-[#833675] ring-2 ring-[#833675]/30' : 'border-transparent hover:border-[#833675]/40'}`;
      thumb.setAttribute('aria-label', `Ver foto ${i + 1}`);

      const img = document.createElement('img');
      img.src = src;
      img.alt = `Miniatura ${i + 1}`;
      img.className = 'w-full h-full object-cover';
      img.loading = 'lazy';

      thumb.appendChild(img);
      thumb.addEventListener('click', () => {
        this.go(i);
        this._restartAuto();
      });
      this.thumbsEl.appendChild(thumb);
    });
  }

  _updateThumbnails() {
    if (!this.thumbsEl) return;
    const thumbs = this.thumbsEl.querySelectorAll('button');
    thumbs.forEach((thumb, i) => {
      const isActive = i === this.index;
      thumb.className = `shrink-0 w-16 sm:w-20 h-14 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 snap-center ${isActive ? 'border-[#833675] ring-2 ring-[#833675]/30' : 'border-transparent hover:border-[#833675]/40'}`;
    });
    // Removido scrollIntoView — evitou saltos da página
  }

  _startAuto() {
    if (this.timer) return;
    this.progress = 0;
    this._updateProgressCircle();
    this.timer = setInterval(this._next, this.interval);
    this._startProgressLoop();
  }

  _startProgressLoop() {
    let lastTime = performance.now();
    const step = (currentTime) => {
      if (this.isPaused) {
        lastTime = currentTime;
        this.rafId = requestAnimationFrame(step);
        return;
      }
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      this.progress += (this.progressInc * delta) / 50;
      if (this.progress >= 100) this.progress = 0;
      this._updateProgressCircle();
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  _updateProgressCircle() {
    if (!this.progressCircle) return;
    const circumference = 2 * Math.PI * 16; // r=16
    const offset = circumference - (this.progress / 100) * circumference;
    this.progressCircle.style.strokeDashoffset = offset;
  }

  _stopAuto() {
    clearInterval(this.timer);
    this.timer = null;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  _restartAuto() {
    this._stopAuto();
    this.progress = 0;
    this._updateProgressCircle();
    this._startAuto();
  }

  _next() {
    this.go(this.index + 1);
  }

  go(newIndex) {
    this.progress = 0; // reseta barra de progresso a cada troca
    const prevIndex = this.index;
    this.index = (newIndex + this.images.length) % this.images.length;

    // Transição fade
    if (this.imgEl) {
      this.imgEl.style.transition = 'none';
      this.imgEl.style.opacity = '0';
      this.imgEl.offsetHeight; // trigger reflow
      this.imgEl.style.transition = `opacity ${this.duration}ms ease-in-out`;
      this.imgEl.src = this.images[this.index];
      // Força redesenho antes de mudar opacidade
      requestAnimationFrame(() => {
        this.imgEl.style.opacity = '1';
      });
    }

    this._updateDots();
    this._updateThumbnails();
    this._updateAriaLive();
  }

  _updateAriaLive() {
    if (this.imgEl) {
      this.imgEl.setAttribute('aria-label', `Galeria de fotos - imagem ${this.index + 1} de ${this.images.length}`);
    }
  }

  _onMouseEnter() {
    this.isPaused = true;
  }

  _onMouseLeave() {
    this.isPaused = false;
  }

  _bindEvents() {
    // Botões de navegação
    const prevBtn = document.getElementById('prevGaleria');
    const nextBtn = document.getElementById('nextGaleria');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.prev();
        this._restartAuto();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.next();
        this._restartAuto();
      });
    }

    // Pausa ao passar mouse
    if (this.containerEl) {
      this.containerEl.addEventListener('mouseenter', this._onMouseEnter);
      this.containerEl.addEventListener('mouseleave', this._onMouseLeave);
      this.containerEl.addEventListener('touchstart', this._onMouseEnter);
      this.containerEl.addEventListener('touchend', this._onMouseLeave);
    }

    // Teclado
    document.addEventListener('keydown', (e) => {
      if (!this._isVisible()) return;
      if (e.key === 'ArrowLeft') {
        this.prev();
        this._restartAuto();
      } else if (e.key === 'ArrowRight') {
        this.next();
        this._restartAuto();
      } else if (e.key === 'Escape' && this.lightboxEl && !this.lightboxEl.hidden) {
        this._closeLightbox();
      }
    });

    // Touch / swipe
    this._initTouch();

    // Lightbox
    this._initLightbox();
  }

  _initTouch() {
    if (!this.containerEl) return;
    let startX = 0;
    let threshold = 50;

    this.containerEl.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    });

    this.containerEl.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
        this._restartAuto();
      }
    });
  }

  _initLightbox() {
    if (!this.lightboxEl) return;

    const openBtn = document.getElementById('openLightbox');
    const closeBtn = document.getElementById('closeLightbox');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    if (openBtn) {
      openBtn.addEventListener('click', () => this._openLightbox());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this._closeLightbox());
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.prev();
        this._updateLightboxImage();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.next();
        this._updateLightboxImage();
      });
    }

    // Fechar ao clicar fora da imagem
    this.lightboxEl.addEventListener('click', (e) => {
      if (e.target === this.lightboxEl) {
        this._closeLightbox();
      }
    });

    // Teclado no lightbox
    document.addEventListener('keydown', (e) => {
      if (this.lightboxEl && !this.lightboxEl.hidden) {
        if (e.key === 'ArrowLeft') {
          this.prev();
          this._updateLightboxImage();
        } else if (e.key === 'ArrowRight') {
          this.next();
          this._updateLightboxImage();
        } else if (e.key === 'Escape') {
          this._closeLightbox();
        }
      }
    });
  }

  _openLightbox() {
    if (!this.lightboxEl) return;
    this._wasPlaying = this.timer !== null;
    this._stopAuto();
    this._updateLightboxImage();
    this.lightboxEl.classList.remove('hidden');
    this.lightboxEl.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  _closeLightbox() {
    if (!this.lightboxEl) return;
    this.lightboxEl.classList.add('hidden');
    this.lightboxEl.classList.remove('flex');
    document.body.style.overflow = '';
    if (this._wasPlaying) {
      this._startAuto();
    }
  }

  _updateLightboxImage() {
    if (!this.lightboxImg || !this.lightboxCap) return;
    this.lightboxImg.style.opacity = '0';
    this.lightboxImg.src = this.images[this.index];
    this.lightboxImg.alt = `Galeria de fotos - imagem ${this.index + 1} de ${this.images.length}`;
    this.lightboxCap.textContent = `Imagem ${this.index + 1} de ${this.images.length}`;
    requestAnimationFrame(() => {
      this.lightboxImg.style.transition = 'opacity 300ms ease-in-out';
      this.lightboxImg.style.opacity = '1';
    });
  }

  _isVisible() {
    // Verifica se o slider está na viewport
    if (!this.containerEl) return false;
    const rect = this.containerEl.getBoundingClientRect();
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  }

  prev() {
    this.go(this.index - 1);
  }

  next() {
    this.go(this.index + 1);
  }
}

/* ─────────────────────────────────────────────
   Inicialização
   ───────────────────────────────────────────── */
async function init() {
  const fotosGaleria = await carregarFotos(); // Imagens do Firestore (galeria)
  const fotosSobre   = FALLBACK_IMAGES;        // Imagens locais fixas (1.png e 11.jpg)

  // ── Slider da seção "Galeria" ──────────────
  new Slider({
    elementId:  'galeriaSlider',
    containerId: 'galeriaContainer',
    images:    fotosGaleria,
    interval:  4000,
  });

  // ── Slider da seção "Sobre" ─────────────────
  new Slider({
    elementId: 'slider',
    images:    fotosSobre,
    interval:  2000,
    enableLightbox: false,
  });
}

// Executa init imediatamente se DOM já estiver pronto, senão aguarda evento
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
