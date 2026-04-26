import { db, collection, getDocs, query, orderBy } from './firebase-config.js';

const grid = document.getElementById("blogGrid");
const empty = document.getElementById("blogEmpty");

function formatDate(value) {
    if (!value) return "";
    try {
        const d = value.toDate ? value.toDate() : new Date(value);
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

function extractImage(htmlStr) {
    if (!htmlStr) return null;
    const match = htmlStr.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
}

async function carregarPosts() {
    const sliderWrapper = document.getElementById("blogSliderWrapper");
    
    if (!grid || !empty) return;

    try {
        const q = query(collection(db, 'posts'), orderBy('publishedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            empty.classList.remove("hidden");
            if (sliderWrapper) sliderWrapper.classList.add("hidden");
            grid.innerHTML = "";
            return;
        }

        empty.classList.add("hidden");
        if (sliderWrapper) sliderWrapper.classList.remove("hidden");
        
        const postsHTML = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            const coverImage = extractImage(data.content);
            const imageHtml = coverImage 
                ? `<img src="${escapeAttr(coverImage)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Capa do post">` 
                : `<div class="w-full h-full flex items-center justify-center bg-[#833675]/5 text-[#833675]/30"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg></div>`;

            postsHTML.push(`
            <article class="blog-card group flex flex-col rounded-2xl border border-[#833675]/12 bg-white/70 shadow-[0_8px_30px_rgb(131,54,117,0.08)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_16px_40px_rgb(131,54,117,0.12)] min-w-[85vw] sm:min-w-[320px] md:min-w-[350px] w-[350px] shrink-0 snap-center overflow-hidden h-[450px]">
                <div class="w-full h-48 sm:h-52 overflow-hidden relative shrink-0">
                    ${imageHtml}
                </div>
                <div class="p-5 sm:p-6 flex flex-col flex-grow">
                    <time class="text-xs font-medium uppercase tracking-wider text-[#833675]/60 mb-2">${formatDate(data.publishedAt)}</time>
                    <h3 class="font-serif text-xl sm:text-lg lg:text-xl text-[#833675] mb-2 leading-snug group-hover:text-[#6f2c5f] transition-colors line-clamp-2">${escapeHtml(data.title)}</h3>
                    <p class="text-[#5c4a58] text-sm leading-relaxed flex-grow line-clamp-3">${escapeHtml(data.excerpt)}</p>
                    
                    <div class="mt-4 pt-3 border-t border-[#833675]/10 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                           <div class="w-6 h-6 rounded-full bg-[#833675]/10 flex items-center justify-center text-[#833675] text-xs font-bold shrink-0">R</div>
                           <span class="text-xs font-medium text-[#5c4a58]">Rafaela Soares</span>
                        </div>
                        <a href="post.html?id=${id}" class="inline-flex items-center gap-1 text-sm font-medium text-[#833675] hover:text-[#6f2c5f] transition-colors cursor-pointer shrink-0">
                            Ler <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
                        </a>
                    </div>
                </div>
            </article>
            `);
        });

        grid.innerHTML = postsHTML.join("");
        
    } catch (error) {
        console.error("Erro ao puxar dados do Firestore:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    carregarPosts();

    // Eventos do Slider do Blog
    const gridEl = document.getElementById("blogGrid");
    const prevBtn = document.getElementById("blogPrev");
    const nextBtn = document.getElementById("blogNext");

    if (gridEl && prevBtn && nextBtn) {
        const scrollToNext = () => {
            const cardWidth = gridEl.querySelector('.blog-card')?.offsetWidth || 350;
            // Se chegou no final, volta para o começo
            if (gridEl.scrollLeft + gridEl.clientWidth >= gridEl.scrollWidth - 10) {
                gridEl.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                gridEl.scrollBy({ left: cardWidth + 24, behavior: 'smooth' }); // 24 is gap-6
            }
        };

        let autoScroll = setInterval(scrollToNext, 4000);

        const resetAutoScroll = () => {
            clearInterval(autoScroll);
            autoScroll = setInterval(scrollToNext, 4000);
        };

        prevBtn.addEventListener("click", () => {
            const cardWidth = gridEl.querySelector('.blog-card')?.offsetWidth || 350;
            gridEl.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
            resetAutoScroll();
        });

        nextBtn.addEventListener("click", () => {
            scrollToNext();
            resetAutoScroll();
        });
        
        // Pausa ao focar ou colocar o mouse
        gridEl.addEventListener("mouseenter", () => clearInterval(autoScroll));
        gridEl.addEventListener("mouseleave", () => resetAutoScroll());
    }
});
