document.addEventListener("DOMContentLoaded", function () {
  
  // Movimento entre os links do menu
  document.querySelectorAll(".menu-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      const target = document.querySelector(targetId);

      if (!target) return;

      // Força o efeito visual antes do scroll
      this.classList.add("scale-90");

      setTimeout(() => {
        this.classList.remove("scale-90");

        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150); // tempo do efeito
    });
  });

  // MENU MOBILE
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.contains("max-h-96");

      mobileMenu.classList.toggle("max-h-96", !isOpen);
      mobileMenu.classList.toggle("opacity-100", !isOpen);
      menuBtn.setAttribute("aria-expanded", String(!isOpen));
    });

    document.querySelectorAll(".mobile-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
        mobileMenu.classList.remove("max-h-96");
        mobileMenu.classList.remove("opacity-100");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  
  // ===== PRELOADER =====
  const preloader = document.getElementById("preloader");
  if (preloader) {
    window.addEventListener("load", () => {
      preloader.classList.add("opacity-0");
      setTimeout(() => preloader.remove(), 650);
    });
  }
  
  const phoneNumber = "5588997891564";
  // ===== FORMULÁRIO WHATSAPP =====
  const form = document.getElementById("whatsappForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const nome = document.getElementById("nome").value;
      const email = document.getElementById("email").value;
      const whatsapp = document.getElementById("whatsapp").value;
      const mensagem = document.getElementById("mensagem").value;

      const texto = `
Olá, meu nome é ${nome}.
Email: ${email}
WhatsApp: ${whatsapp}

Mensagem:
${mensagem}
      `;

      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(texto)}`;
      window.open(url, "_blank");
    });
  }

  // ===== BOTÕES WHATSAPP =====
  const whatsappBtn = document.getElementById("whatsappBtn");
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
          "Olá! Gostaria de agendar um atendimento.",
        )}`,
        "_blank",
      );
    });
  }

  const contatoWhat = document.getElementById("contatoWhat");
  if (contatoWhat) {
    contatoWhat.addEventListener("click", () => {
      window.open(
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
          "Olá! Gostaria de agendar um atendimento.",
        )}`,
        "_blank",
      );
    });
  }

  // ===== SLIDER =====
  class ImageRotator {
    constructor(config) {
      this.element = document.getElementById(config.elementId);
      if (!this.element) return;

      this.images = config.images;
      this.interval = config.interval || 3000;
      this.currentIndex = 0;
      this.intervalId = null;
      this.start();
    }

    start() {
      this.intervalId = setInterval(() => this.nextImage(), this.interval);
    }

    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }

    nextImage() {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      this.element.src = this.images[this.currentIndex];
    }

    prevImage() {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
      this.element.src = this.images[this.currentIndex];
    }

    goToImage(index) {
      this.currentIndex = index % this.images.length;
      this.element.src = this.images[this.currentIndex];
    }
  }

  const sliderRotator = new ImageRotator({
    elementId: "slider",
    images: ["./img/1.png", "./img/11.jpg"],
    interval: 2000,
  });

  const galeriaRotator = new ImageRotator({
    elementId: "galeriaSlider",
    images: ["./img/1.png", "./img/11.jpg"],
    interval: 3000,
  });

  const prevGaleria = document.getElementById("prevGaleria");
  const nextGaleria = document.getElementById("nextGaleria");
  if (prevGaleria && galeriaRotator.element) {
    prevGaleria.addEventListener("click", () => {
      galeriaRotator.prevImage();
      galeriaRotator.stop();
      setTimeout(() => galeriaRotator.start(), 5000);
    });
  }
  if (nextGaleria && galeriaRotator.element) {
    nextGaleria.addEventListener("click", () => {
      galeriaRotator.nextImage();
      galeriaRotator.stop();
      setTimeout(() => galeriaRotator.start(), 5000);
    });
  }

  // ===== FAQ =====
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const answer = button.nextElementSibling;
      const icon = button.querySelector(".faq-icon");

      const isOpen = answer.classList.contains("max-h-96");

      document.querySelectorAll(".faq-answer").forEach((p) => {
        p.classList.remove("max-h-96");
        p.classList.add("max-h-0");
      });

      document.querySelectorAll(".faq-icon").forEach((s) => {
        s.textContent = "+";
        s.classList.remove("rotate-45");
      });

      if (!isOpen) {
        answer.classList.remove("max-h-0");
        answer.classList.add("max-h-96");
        icon.textContent = "×";
        icon.classList.add("rotate-45");
      }
    });
  });

  // ===== SCROLLSPY (Destacar Menu Ativo) =====
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".menu-link");

  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -60% 0px",
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Remove estado ativo de todos
        navLinks.forEach((link) => {
            link.classList.remove("bg-[#833675]/10", "font-semibold");
        });
        
        // Adiciona estado ativo no link correspondente
        const activeId = entry.target.getAttribute("id");
        const activeLink = document.querySelector(`.menu-link[href="#${activeId}"]`);
        if (activeLink) {
          activeLink.classList.add("bg-[#833675]/10", "font-semibold");
        }
      }
    });
  }, observerOptions);

  sections.forEach((sec) => observer.observe(sec));
});
