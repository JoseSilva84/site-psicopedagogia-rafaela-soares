import { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, db, collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, query, orderBy } from './firebase-config.js';

// Elementos HTML
const loginContainer = document.getElementById('login-container');
const adminContainer = document.getElementById('admin-container');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const publishBtn = document.getElementById('publish-btn');
const postTitle = document.getElementById('post-title');
const postExcerpt = document.getElementById('post-excerpt');
const publishStatus = document.getElementById('publish-status');
const postsList = document.getElementById('posts-list');

// Inicializar Quill Editor (configurações básicas)
const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'Escreva seu artigo lindo aqui...',
    modules: {
        toolbar: [
            [{ 'header': [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ]
    }
});

// Handler personalizado para imagens (Comprime a imagem para evitar limites e furos do Storage)
function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        // Feedback visual
        publishBtn.textContent = 'Tratando imagem...';
        publishBtn.disabled = true;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Configurações de compressão (até 800px de largura)
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }

                // Desenha no Canvas para compressão pesada
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Converte para JPEG leve com 65% de qualidade (gera um Base64 viável e pequeno)
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);

                // Insere a imagem super leve de volta no editor
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'image', compressedBase64);
                quill.setSelection(range.index + 1);

                publishBtn.textContent = 'Publicar Artigo';
                publishBtn.disabled = false;
            };
            
            img.onerror = () => {
                alert("Erro ao ler a imagem inserida.");
                publishBtn.textContent = 'Publicar Artigo';
                publishBtn.disabled = false;
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    };
}

// Intercepta o botão de imagem do Toolbar
quill.getModule('toolbar').addHandler('image', imageHandler);

// Listener de Autenticação - Verifica se logou
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginContainer.classList.add('hidden');
        adminContainer.classList.remove('hidden');
        loadPosts();
    } else {
        loginContainer.classList.remove('hidden');
        adminContainer.classList.add('hidden');
    }
});

// Fazer Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    
    try {
        await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    } catch (error) {
        loginError.classList.remove('hidden');
        console.error("Erro no login:", error);
    }
});

// Fazer Logout
logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
});

// Auxiliar: Gerar slug (URL amigável) do título
function createSlug(title) {
    return title.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Publicar Texto
publishBtn.addEventListener('click', async () => {
    const title = postTitle.value.trim();
    const excerpt = postExcerpt.value.trim();
    const content = quill.root.innerHTML;
    
    if(!title || !excerpt || quill.getText().trim().length === 0) {
        alert("Preencha título, resumo e conteúdo!");
        return;
    }

    publishBtn.textContent = 'Publicando...';
    publishBtn.disabled = true;

    try {
        const slug = createSlug(title);
        
        await addDoc(collection(db, 'posts'), {
            title: title,
            excerpt: excerpt,
            content: content,
            slug: slug,
            publishedAt: serverTimestamp()
        });

        publishStatus.classList.remove('hidden');
        postTitle.value = '';
        postExcerpt.value = '';
        quill.setContents([]);
        setTimeout(() => publishStatus.classList.add('hidden'), 3000);
        
        loadPosts();
    } catch (error) {
        console.error("Erro ao publicar:", error);
        alert("Erro ao publicar. Verifique o console ou as regras do Firestore.");
    } finally {
        publishBtn.textContent = 'Publicar Artigo';
        publishBtn.disabled = false;
    }
});

// Carregar Posts para Gerenciamento
async function loadPosts() {
    postsList.innerHTML = '<p class="text-sm">Carregando...</p>';
    try {
        const q = query(collection(db, 'posts'), orderBy('publishedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            postsList.innerHTML = '<p class="text-sm text-[#833675]/50">Nenhum artigo publicado ainda.</p>';
            return;
        }

        postsList.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = 'bg-white border border-[#833675]/10 p-4 rounded-xl flex justify-between items-center';
            div.innerHTML = `
                <div class="truncate mr-4">
                    <h3 class="font-medium text-[#833675] truncate">${data.title}</h3>
                </div>
                <button class="text-xs text-red-500 border border-red-500 rounded px-2 py-1 hover:bg-red-50 transition-colors shrink-0 delete-btn" data-id="${docSnap.id}">Excluir</button>
            `;
            postsList.appendChild(div);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Tem certeza que deseja excluir este artigo?")) {
                    const id = e.target.getAttribute('data-id');
                    await deleteDoc(doc(db, 'posts', id));
                    loadPosts();
                }
            });
        });

    } catch (error) {
        console.error("Erro ao carregar posts", error);
        postsList.innerHTML = '<p class="text-sm text-red-500">Erro ao carregar os artigos.</p>';
    }
}
