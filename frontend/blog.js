/**
 * Blog — placeholder até configurar o Firebase.
 *
 * Quando integrar Firestore, chame renderBlogPosts(posts) com um array de:
 * { title: string, excerpt: string, date: string (ISO ou legível), href?: string }
 *
 * Exemplo Firestore (coleção "posts"):
 * - title, excerpt, publishedAt (Timestamp), slug (opcional)
 */
(function () {
  const grid = document.getElementById("blogGrid");
  const empty = document.getElementById("blogEmpty");

  function formatDate(value) {
    if (!value) return "";
    try {
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return String(value);
    }
  }

  function renderBlogPosts(posts) {
    if (!grid || !empty) return;

    if (!posts || posts.length === 0) {
      empty.classList.remove("hidden");
      grid.innerHTML = "";
      return;
    }

    empty.classList.add("hidden");
    grid.innerHTML = posts
      .map(
        (post) => `
      <article class="blog-card group flex flex-col rounded-2xl border border-[#833675]/12 bg-white/70 p-6 shadow-[0_8px_30px_rgb(131,54,117,0.08)] backdrop-blur-sm transition-all duration-300 hover:border-[#833675]/25 hover:shadow-[0_16px_40px_rgb(131,54,117,0.12)] hover:-translate-y-1">
        <time class="text-xs font-medium uppercase tracking-wider text-[#833675]/60">${formatDate(post.date)}</time>
        <h3 class="font-serif text-xl text-[#833675] mt-3 mb-2 leading-snug group-hover:text-[#6f2c5f] transition-colors">${escapeHtml(post.title)}</h3>
        <p class="text-[#5c4a58] text-sm leading-relaxed flex-grow">${escapeHtml(post.excerpt)}</p>
        ${
          post.href
            ? `<a href="${escapeAttr(post.href)}" class="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#833675] hover:text-[#6f2c5f] transition-colors cursor-pointer">
            Ler artigo
            <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
          </a>`
            : `<span class="mt-5 text-sm text-[#833675]/50">Em breve</span>`
        }
      </article>
    `,
      )
      .join("");
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;");
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderBlogPosts([]);
  });

  window.renderBlogPosts = renderBlogPosts;
})();
