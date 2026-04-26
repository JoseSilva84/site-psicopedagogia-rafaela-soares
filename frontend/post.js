import { db, collection, getDocs, query, doc, getDoc } from './firebase-config.js';

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

const postContainer = document.getElementById('post-container');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');

const postTitle = document.getElementById('post-title');
const postDate = document.getElementById('post-date');
const postContent = document.getElementById('post-content');

// Formatação da data
function formatDate(timestamp) {
    if (!timestamp) return 'Data não informada';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (Number.isNaN(d.getTime())) return String(timestamp);
    return d.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Carregar o post específico
async function loadPost() {
    if (!postId) {
        showError();
        return;
    }

    try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Alterar o título da aba
            document.title = `${data.title} | Rafaela Soares`;
            
            // Injetar dados no HTML
            postTitle.textContent = data.title;
            postDate.textContent = formatDate(data.publishedAt);
            postContent.innerHTML = data.content; // Renderizando HTML gerado pelo Quill

            // Mostrar container
            loadingState.classList.add('hidden');
            postContainer.classList.remove('hidden');
        } else {
            showError();
        }
    } catch (error) {
        console.error("Erro ao puxar o artigo:", error);
        showError();
    }
}

function showError() {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', loadPost);
