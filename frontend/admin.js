import {
  auth, signInWithEmailAndPassword, onAuthStateChanged, signOut,
  db, collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, query, orderBy
} from './firebase-config.js';

// ═══════════════════════════════════════════
//  ELEMENTOS HTML
// ═══════════════════════════════════════════
const loginContainer = document.getElementById('login-container');
const adminContainer = document.getElementById('admin-container');
const loginForm      = document.getElementById('login-form');
const emailInput     = document.getElementById('email');
const passwordInput  = document.getElementById('password');
const loginError     = document.getElementById('login-error');
const logoutBtn      = document.getElementById('logout-btn');

// Blog
const publishBtn    = document.getElementById('publish-btn');
const postTitle     = document.getElementById('post-title');
const postExcerpt   = document.getElementById('post-excerpt');
const publishStatus = document.getElementById('publish-status');
const postsList     = document.getElementById('posts-list');

// Galeria
const dropZone          = document.getElementById('drop-zone');
const fotoInput         = document.getElementById('foto-input');
const progressWrap      = document.getElementById('upload-progress-wrap');
const progressBar       = document.getElementById('upload-progress-bar');
const progressPercent   = document.getElementById('upload-percent');
const progressFilename  = document.getElementById('upload-filename');
const uploadSuccess     = document.getElementById('upload-success');
const uploadError       = document.getElementById('upload-error');
const galeriaGrid       = document.getElementById('galeria-grid');
const galeriaEmpty      = document.getElementById('galeria-empty');
const refreshGaleriaBtn = document.getElementById('refresh-galeria');

// ═══════════════════════════════════════════
//  TABS
// ═══════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.panel;
    document.querySelectorAll('#panel-blog, #panel-galeria').forEach(p => {
      p.classList.toggle('hidden', p.id !== target);
    });
    if (target === 'panel-galeria') loadGaleriaAdmin();
  });
});

// ═══════════════════════════════════════════
//  EDITOR QUILL (Blog)
// ═══════════════════════════════════════════
const quill = new Quill('#editor-container', {
  theme: 'snow',
  placeholder: 'Escreva seu artigo aqui...',
  modules: {
    toolbar: [
      [{ header: [2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  }
});

// Compressão de imagem inline no editor
function imageHandler() {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    publishBtn.textContent = 'Processando imagem...';
    publishBtn.disabled = true;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        let w = img.width, h = img.height;
        if (w > MAX_WIDTH) { h = Math.round(h * MAX_WIDTH / w); w = MAX_WIDTH; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL('image/jpeg', 0.65);
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', base64);
        quill.setSelection(range.index + 1);
        publishBtn.textContent = 'Publicar Artigo';
        publishBtn.disabled = false;
      };
      img.onerror = () => {
        alert('Erro ao ler a imagem.');
        publishBtn.textContent = 'Publicar Artigo';
        publishBtn.disabled = false;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
}
quill.getModule('toolbar').addHandler('image', imageHandler);

// ═══════════════════════════════════════════
//  AUTENTICAÇÃO
// ═══════════════════════════════════════════
onAuthStateChanged(auth, user => {
  if (user) {
    loginContainer.classList.add('hidden');
    adminContainer.classList.remove('hidden');
    loadPosts();
  } else {
    loginContainer.classList.remove('hidden');
    adminContainer.classList.add('hidden');
  }
});

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginError.classList.add('hidden');
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (err) {
    loginError.classList.remove('hidden');
    console.error('Erro no login:', err);
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

// ═══════════════════════════════════════════
//  BLOG — Publicar artigo
// ═══════════════════════════════════════════
function createSlug(title) {
  return title.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

publishBtn.addEventListener('click', async () => {
  const title   = postTitle.value.trim();
  const excerpt = postExcerpt.value.trim();
  const content = quill.root.innerHTML;
  if (!title || !excerpt || quill.getText().trim().length === 0) {
    alert('Preencha título, resumo e conteúdo!'); return;
  }
  publishBtn.textContent = 'Publicando...';
  publishBtn.disabled = true;
  try {
    await addDoc(collection(db, 'posts'), {
      title, excerpt, content, slug: createSlug(title), publishedAt: serverTimestamp()
    });
    publishStatus.classList.remove('hidden');
    postTitle.value = '';
    postExcerpt.value = '';
    quill.setContents([]);
    setTimeout(() => publishStatus.classList.add('hidden'), 3000);
    loadPosts();
  } catch (err) {
    console.error('Erro ao publicar:', err);
    alert('Erro ao publicar. Verifique o console ou as regras do Firestore.');
  } finally {
    publishBtn.textContent = 'Publicar Artigo';
    publishBtn.disabled = false;
  }
});

// ═══════════════════════════════════════════
//  BLOG — Listar posts
// ═══════════════════════════════════════════
async function loadPosts() {
  postsList.innerHTML = '<p class="text-sm text-[#833675]/50">Carregando...</p>';
  try {
    const q = query(collection(db, 'posts'), orderBy('publishedAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) {
      postsList.innerHTML = '<p class="text-sm text-[#833675]/50">Nenhum artigo publicado ainda.</p>';
      return;
    }
    postsList.innerHTML = '';
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement('div');
      div.className = 'bg-white border border-[#833675]/10 p-4 rounded-xl flex justify-between items-center';
      div.innerHTML = `
        <div class="truncate mr-4">
          <h3 class="font-medium text-[#833675] truncate">${data.title}</h3>
        </div>
        <button class="text-xs text-red-500 border border-red-500 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors shrink-0 delete-post-btn" data-id="${docSnap.id}">
          Excluir
        </button>`;
      postsList.appendChild(div);
    });
    document.querySelectorAll('.delete-post-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        if (confirm('Excluir este artigo permanentemente?')) {
          await deleteDoc(doc(db, 'posts', e.target.dataset.id));
          loadPosts();
        }
      });
    });
  } catch (err) {
    console.error('Erro ao carregar posts:', err);
    postsList.innerHTML = '<p class="text-sm text-red-500">Erro ao carregar os artigos.</p>';
  }
}

// ═══════════════════════════════════════════
//  GALERIA — Compressão para Base64 (Firestore)
// ═══════════════════════════════════════════

/**
 * Comprime qualquer imagem (PNG, JPEG, WebP) para JPEG e retorna
 * um data URL Base64 — pronto para salvar no Firestore.
 */
function comprimirParaBase64(file, maxWidth = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.onload  = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao decodificar a imagem.'));
      img.onload  = () => {
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ═══════════════════════════════════════════
//  GALERIA — Eventos de upload
// ═══════════════════════════════════════════

dropZone.addEventListener('click', () => fotoInput.click());

dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (files.length) uploadFotos(files);
});

fotoInput.addEventListener('change', () => {
  const files = Array.from(fotoInput.files);
  if (files.length) uploadFotos(files);
  fotoInput.value = '';
});

async function uploadFotos(files) {
  uploadSuccess.classList.add('hidden');
  uploadError.classList.add('hidden');
  for (const file of files) {
    await uploadSingleFoto(file);
  }
  progressWrap.classList.add('hidden');
  loadGaleriaAdmin();
}

// ═══════════════════════════════════════════
//  GALERIA — Salvar foto no Firestore
// ═══════════════════════════════════════════
async function uploadSingleFoto(file) {
  progressWrap.classList.remove('hidden');
  progressFilename.textContent = file.name;
  progressBar.style.width = '0%';
  progressPercent.textContent = 'Comprimindo…';
  uploadSuccess.classList.add('hidden');
  uploadError.classList.add('hidden');

  try {
    // 1. Comprimir para Base64
    const base64 = await comprimirParaBase64(file);
    progressBar.style.width     = '70%';
    progressPercent.textContent = '70%';

    // 2. Salvar no Firestore (coleção "galeria")
    await addDoc(collection(db, 'galeria'), {
      base64,
      nome:     file.name,
      criadoEm: serverTimestamp()
    });

    progressBar.style.width     = '100%';
    progressPercent.textContent = '100%';
    uploadSuccess.classList.remove('hidden');
    setTimeout(() => uploadSuccess.classList.add('hidden'), 3000);

  } catch (err) {
    console.error('Erro ao salvar foto:', err);
    let msg = '❌ Erro ao enviar a foto.';
    if (err.code === 'permission-denied' || err.message?.includes('permission')) {
      msg = '🔒 Sem permissão. Verifique as regras do Firestore para a coleção "galeria".';
    } else {
      msg = '❌ ' + (err.message || 'Erro desconhecido.');
    }
    uploadError.textContent = msg;
    uploadError.classList.remove('hidden');
  } finally {
    progressWrap.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════
//  GALERIA — Carregar fotos do Firestore
// ═══════════════════════════════════════════
async function loadGaleriaAdmin() {
  galeriaGrid.innerHTML = `<p class="col-span-full text-sm text-[#833675]/50 text-center py-8">⏳ Carregando fotos…</p>`;
  galeriaEmpty.classList.add('hidden');

  try {
    const q    = query(collection(db, 'galeria'), orderBy('criadoEm', 'asc'));
    const snap = await getDocs(q);

    if (snap.empty) {
      galeriaGrid.innerHTML = '';
      galeriaEmpty.classList.remove('hidden');
      return;
    }

    galeriaGrid.innerHTML = '';
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const card = document.createElement('div');
      card.className = 'foto-card relative group rounded-2xl overflow-hidden border border-[#833675]/10 shadow-soft bg-white';
      card.innerHTML = `
        <div class="aspect-square overflow-hidden">
          <img src="${data.base64}" alt="${data.nome}"
               class="w-full h-full object-cover" loading="lazy">
        </div>
        <div class="p-2 flex items-center justify-between gap-1">
          <span class="text-[0.65rem] text-[#5c4a58]/60 truncate" title="${data.nome}">${data.nome}</span>
          <button
            class="shrink-0 text-xs text-red-500 border border-red-400 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors delete-foto-btn"
            data-id="${docSnap.id}"
            aria-label="Excluir foto">
            🗑
          </button>
        </div>`;
      galeriaGrid.appendChild(card);
    });

    document.querySelectorAll('.delete-foto-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = e.currentTarget.dataset.id;
        if (!confirm('Excluir esta foto permanentemente da galeria?')) return;
        try {
          await deleteDoc(doc(db, 'galeria', id));
          loadGaleriaAdmin();
        } catch (err) {
          console.error('Erro ao excluir foto:', err);
          alert('Erro ao excluir: ' + (err.message || err.code));
        }
      });
    });

  } catch (err) {
    console.error('Erro ao listar galeria:', err);
    galeriaGrid.innerHTML = `<p class="col-span-full text-sm text-red-500 text-center py-8">Erro ao carregar as fotos. Verifique as regras do Firestore.</p>`;
  }
}

refreshGaleriaBtn?.addEventListener('click', loadGaleriaAdmin);
