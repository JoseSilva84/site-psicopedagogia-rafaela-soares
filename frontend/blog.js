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

async function carregarPosts() {
    if (!grid || !empty) return;

    try {
        const q = query(collection(db, 'posts'), orderBy('publishedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            empty.classList.remove("hidden");
            grid.innerHTML = "";
            return;
        }

        empty.classList.add("hidden");
        
        const postsHTML = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            postsHTML.push(`
            <article class="blog-card group flex flex-col rounded-2xl border border-[#833675]/12 bg-white/70 p-6 shadow-[0_8px_30px_rgb(131,54,117,0.08)] backdrop-blur-sm transition-all duration-300 hover:border-[#833675]/25 hover:shadow-[0_16px_40px_rgb(131,54,117,0.12)] hover:-translate-y-1">
                <time class="text-xs font-medium uppercase tracking-wider text-[#833675]/60">${formatDate(data.publishedAt)}</time>
                <h3 class="font-serif text-xl text-[#833675] mt-3 mb-2 leading-snug group-hover:text-[#6f2c5f] transition-colors">${escapeHtml(data.title)}</h3>
                <p class="text-[#5c4a58] text-sm leading-relaxed flex-grow">${escapeHtml(data.excerpt)}</p>
                <a href="post.html?id=${id}" class="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#833675] hover:text-[#6f2c5f] transition-colors cursor-pointer">
                    Ler artigo
                    <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
                </a>
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
});
