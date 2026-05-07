/**
 * galeria.js — Módulo de galeria via Firestore (Base64)
 * Carrega todas as fotos da coleção "galeria" do Firestore e
 * alimenta os dois sliders do site (#galeriaSlider e #slider).
 */

import { db, collection, getDocs, query, orderBy } from './firebase-config.js';

// Imagens de fallback (locais) caso o Firestore esteja vazio ou inacessível
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
   Classe genérica de Slider
───────────────────────────────────────────── */
class Slider {
  constructor({ elementId, images, interval }) {
    this.el       = document.getElementById(elementId);
    this.images   = images;
    this.index    = 0;
    this.interval = interval;
    this.timer    = null;
    if (this.el && this.images.length > 0) {
      this.el.src = this.images[0];
      this._startAuto();
    }
  }

  _startAuto() {
    this.timer = setInterval(() => this.next(), this.interval);
  }

  _stopAuto() {
    clearInterval(this.timer);
    this.timer = null;
  }

  _restartAfter(ms = 5000) {
    this._stopAuto();
    setTimeout(() => this._startAuto(), ms);
  }

  go(newIndex) {
    this.index = (newIndex + this.images.length) % this.images.length;
    if (this.el) this.el.src = this.images[this.index];
  }

  next() { this.go(this.index + 1); }
  prev() { this.go(this.index - 1); }
}

/* ─────────────────────────────────────────────
   Inicialização
 ───────────────────────────────────────────── */
async function init() {
  const fotosGaleria = await carregarFotos(); // Imagens do Firestore (galeria)
  const fotosSobre   = FALLBACK_IMAGES;        // Imagens locais fixas (1.png e 11.jpg)

  // ── Slider da seção "Galeria" ──────────────
  const sliderGaleria = new Slider({
    elementId: 'galeriaSlider',
    images:    fotosGaleria,
    interval:  3000,
  });

  document.getElementById('prevGaleria')?.addEventListener('click', () => {
    sliderGaleria.prev();
    sliderGaleria._restartAfter(5000);
  });
  document.getElementById('nextGaleria')?.addEventListener('click', () => {
    sliderGaleria.next();
    sliderGaleria._restartAfter(5000);
  });

  // ── Slider da seção "Sobre" ─────────────────
  new Slider({
    elementId: 'slider',
    images:    fotosSobre,
    interval:  2000,
  });
}

document.addEventListener('DOMContentLoaded', init);
