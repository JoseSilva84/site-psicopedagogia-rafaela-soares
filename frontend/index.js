document.addEventListener("DOMContentLoaded", function () {
  // MENU MOBILE
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.contains("max-h-96");

      mobileMenu.classList.toggle("max-h-96", !isOpen);
      mobileMenu.classList.toggle("opacity-100", !isOpen);
    });

    // Fecha o menu ao clicar em um link
    document.querySelectorAll(".mobile-link").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("max-h-96");
      });
    });
  }

  const phoneNumber = "5588997891564";

  // ===== PRELOADER =====
  const preloader = document.getElementById("preloader");
  if (preloader) {
    window.addEventListener("load", () => {
      preloader.classList.add("opacity-0");
      setTimeout(() => preloader.remove(), 4000);
    });
  }

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
    whatsappBtn.addEventListener("click", () => {
      window.open(
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
          "Olá! Gostaria de agendar um atendimento psicopedagógico.",
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
          "Olá! Gostaria de agendar um atendimento psicopedagógico.",
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
      this.start();
    }

    start() {
      setInterval(() => this.nextImage(), this.interval);
    }

    nextImage() {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
      this.element.src = this.images[this.currentIndex];
    }
  }

  new ImageRotator({
    elementId: "slider",
    images: ["./img/1.png", "./img/2.png"],
    interval: 2000,
  });

  // ===== FAQ =====
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const answer = button.nextElementSibling;
      const icon = button.querySelector("span");

      const isOpen = answer.classList.contains("max-h-96");

      document.querySelectorAll(".faq-answer").forEach((p) => {
        p.classList.remove("max-h-96");
        p.classList.add("max-h-0");
      });

      document.querySelectorAll(".faq-question span").forEach((s) => {
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
});
