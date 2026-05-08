/**
 * galeria.js — Versão estável e SEM lightbox
 * Funcionalidades: auto-play, setas, thumbs, Firestore listener
 */

import { db, collection, getDocs, query, orderBy, onSnapshot } from './firebase-config.js';

const FALLBACK = ['./img/1.jpg', './img/2.jpg', './img/3.jpg'];

async function loadInitial() {
  try {
    const q = query(collection(db, 'galeria'), orderBy('criadoEm', 'asc'));
    const snap = await getDocs(q);
    return snap.empty ? FALLBACK : snap.docs.map(d => d.data().base64).filter(Boolean);
  } catch (e) {
    console.warn('[galeria] Erro, usando fallback:', e);
    return FALLBACK;
  }
}

class Slider {
  constructor({ elId, images, interval }) {
    this.el     = document.getElementById(elId);
    this.images = images;
    this.idx    = 0;
    this.timer  = null;

    if (this.el && this.images.length) {
      this.el.src = this.images[0];
      this._start(interval);
      this._bind(elId, interval);
      if (elId === 'galeriaSlider') this._createThumbs();
    }
  }

  _start(interval) {
    this.timer = setInterval(() => this.next(), interval);
  }

  _stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  go(i) {
    this.idx = (i + this.images.length) % this.images.length;
    if (this.el) this.el.src = this.images[this.idx];
    if (this.el.id === 'galeriaSlider') this._updateThumbs();
  }

  next() { this.go(this.idx + 1); }
  prev() { this.go(this.idx - 1); }

  _bind(elId, interval) {
    if (elId === 'galeriaSlider') {
      document.getElementById('prevGaleria')?.addEventListener('click', () => { this.prev(); this._stop(); setTimeout(() => this._start(interval), 100); });
      document.getElementById('nextGaleria')?.addEventListener('click', () => { this.next(); this._stop(); setTimeout(() => this._start(interval), 100); });
    }
  }

  _createThumbs() {
    const container = document.getElementById('galeriaThumbnails');
    if (!container) return;
    container.innerHTML = '';
    this.images.forEach((src, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `shrink-0 w-16 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === 0 ? 'border-[#833675]' : 'border-transparent hover:border-[#833675]/40'}`;
      btn.onclick = () => { this.go(i); this._stop(); setTimeout(() => this._start(4000), 100); };
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Foto ${i+1}`;
      img.className = 'w-full h-full object-cover';
      img.loading = 'lazy';
      btn.appendChild(img);
      container.appendChild(btn);
    });
  }

  _updateThumbs() {
    const container = document.getElementById('galeriaThumbnails');
    if (!container) return;
    const thumbs = container.querySelectorAll('button');
    thumbs.forEach((t, i) => {
      t.className = `shrink-0 w-16 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === this.idx ? 'border-[#833675]' : 'border-transparent hover:border-[#833675]/40'}`;
    });
  }

  update(newImages) {
    if (!newImages.length) return;
    this.images = newImages;
    this.idx = 0;
    if (this.el) this.el.src = this.images[0];
    if (this.el.id === 'galeriaSlider') this._createThumbs();
    this._stop();
    this._start(this.interval || 4000);
  }
}

/* ─── Inicialização ─── */
let gallery = null;

async function init() {
  const galeriaImgs = await loadInitial();
  const sobreImgs   = FALLBACK;

  gallery = new Slider({ elId: 'galeriaSlider', images: galeriaImgs, interval: 4000 });
  new Slider({ elId: 'slider', images: sobreImgs, interval: 5000 });

  // Firestore listener
  const q = query(collection(db, 'galeria'), orderBy('criadoEm', 'asc'));
  onSnapshot(q, (snap) => {
    const imgs = snap.docs.map(d => d.data().base64).filter(Boolean);
    if (imgs.length && gallery) gallery.update(imgs);
  });

  window.sliderGaleria = gallery;
  window.atualizarGaleriaFront = async () => {
    const fotos = await loadInitial();
    gallery.update(fotos);
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}