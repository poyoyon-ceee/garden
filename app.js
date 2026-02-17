/**
 * Thought Garden - dev0.1.0.20260217.5
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌱 Thought Garden Initialized. Version: dev0.1.0.20260217.5');

    // UI Elements
    const fabPlant = document.getElementById('fab-plant');
    const editorOverlay = document.getElementById('editor-overlay');
    const btnCloseEditor = document.getElementById('btn-close-editor');
    const btnSaveNote = document.getElementById('btn-save');
    const btnTimerStart = document.getElementById('btn-timer-start');
    const timerText = document.getElementById('timer-text');
    const progressRing = document.querySelector('.progress-ring__circle');
    const gardenGrid = document.getElementById('garden-grid');
    const emptyState = document.getElementById('empty-state');
    const editorTitle = document.querySelector('.editor-title');
    const editorBody = document.querySelector('.editor-body');
    const searchInput = document.getElementById('search-input');

    // State
    let notes = JSON.parse(localStorage.getItem('thought-garden-seeds') || '[]');
    let searchQuery = '';

    // --- Core Logic ---

    function saveToStorage() {
        localStorage.setItem('thought-garden-seeds', JSON.stringify(notes));
    }

    function renderGarden() {
        // Clear except empty state
        const cards = gardenGrid.querySelectorAll('.seed-card');
        cards.forEach(card => card.remove());

        const filteredNotes = notes.filter(note => {
            const query = searchQuery.toLowerCase();
            return (note.title || '').toLowerCase().includes(query) ||
                (note.body || '').toLowerCase().includes(query);
        });

        if (filteredNotes.length === 0) {
            emptyState.style.display = 'block';
            emptyState.querySelector('p').textContent = searchQuery
                ? `「${searchQuery}」に一致する種は見つかりませんでした。`
                : '庭はまだ静かです。右下のボタンから最初の「種」を植えましょう。';
            return;
        }

        emptyState.style.display = 'none';

        // Sort by date (newest first)
        const sortedNotes = [...filteredNotes].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedNotes.forEach((note, index) => {
            const card = createCardElement(note, index);
            gardenGrid.appendChild(card);
        });
    }

    // --- Search Event ---
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderGarden();
    });

    function createCardElement(note, index) {
        const div = document.createElement('div');
        div.className = 'seed-card';
        div.style.setProperty('--delay', `${index * 0.05}s`);

        const dateStr = new Date(note.date).toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).replace(/\//g, '.');

        div.innerHTML = `
            <span class="seed-date">${dateStr}</span>
            <h3 class="seed-title">${note.title || '無題の種'}</h3>
            <p class="seed-preview">${note.body || ''}</p>
            <div class="seed-tags">
                ${(note.tags || []).map(tag => `<span class="tag">#${tag}</span>`).join('')}
            </div>
            <button class="btn-delete" data-id="${note.id}" title="種を取り除く">✕</button>
        `;

        // Delete functionality
        div.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('この種を庭から取り除きますか？')) {
                notes = notes.filter(n => n.id !== note.id);
                saveToStorage();
                renderGarden();
            }
        });

        // Open for edit (simple alert for now, can be expanded)
        div.addEventListener('click', () => {
            editorTitle.value = note.title;
            editorBody.value = note.body;
            currentEditingId = note.id;
            editorOverlay.classList.add('active');
        });

        return div;
    }

    // --- Timer Logic ---
    let timerInterval;
    let timeLeft = 25 * 60;
    const circleRadius = 45;
    const circumference = 2 * Math.PI * circleRadius;
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;

    function updateTimerDisplay() {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const offset = circumference - (timeLeft / (25 * 60)) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }

    btnTimerStart.addEventListener('click', () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            btnTimerStart.textContent = '集中を再開';
            btnTimerStart.classList.remove('running');
        } else {
            btnTimerStart.textContent = '中断する';
            btnTimerStart.classList.add('running');
            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    btnTimerStart.textContent = '集中を始める';
                    alert('静寂の時間が終わりました。少し休憩しましょう。');
                }
            }, 1000);
        }
    });

    // --- Editor Logic ---
    let currentEditingId = null;

    fabPlant.addEventListener('click', () => {
        currentEditingId = null;
        editorTitle.value = '';
        editorBody.value = '';
        editorOverlay.classList.add('active');
        editorTitle.focus();
    });

    btnCloseEditor.addEventListener('click', () => {
        editorOverlay.classList.remove('active');
    });

    btnSaveNote.addEventListener('click', () => {
        const title = editorTitle.value.trim();
        const body = editorBody.value.trim();

        if (title || body) {
            if (currentEditingId) {
                // Update existing
                const note = notes.find(n => n.id === currentEditingId);
                note.title = title;
                note.body = body;
                note.date = new Date().toISOString();
            } else {
                // Add new
                const newNote = {
                    id: Date.now().toString(),
                    title: title,
                    body: body,
                    date: new Date().toISOString(),
                    tags: ['庭の記憶']
                };
                notes.push(newNote);
            }

            saveToStorage();
            renderGarden();
            editorOverlay.classList.remove('active');

            // Visual feedback
            showToast(currentEditingId ? '種を更新しました' : '新しい種を植えました');
        } else {
            showToast('何かを書いてから植えましょう');
        }
    });

    function showToast(message) {
        // Simple alert for now, can be a nice div later
        console.log('Toast:', message);
    }

    // Initialize
    renderGarden();
    updateTimerDisplay();
});
