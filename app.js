/**
 * Thought Garden - dev0.1.0.20260217.9
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌱 Thought Garden Initialized. Version: dev0.1.0.20260217.9');

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
    const toastContainer = document.getElementById('toast-container');
    const appBody = document.getElementById('app-body');
    const timerSection = document.querySelector('.timer-display');
    const settingsView = document.getElementById('settings-view');
    const timerDurationInput = document.getElementById('timer-duration');
    const btnExport = document.getElementById('btn-export');
    const btnResetAll = document.getElementById('btn-reset-all');

    // Navigation
    const btnGarden = document.getElementById('btn-garden');
    const btnArchives = document.getElementById('btn-archives');
    const btnSettings = document.getElementById('btn-settings');
    const viewTitle = document.querySelector('.current-view-title');

    // State
    let notes = JSON.parse(localStorage.getItem('thought-garden-seeds') || '[]');
    let settings = JSON.parse(localStorage.getItem('thought-garden-settings') || '{"timerDuration": 25}');
    let searchQuery = '';
    let currentView = 'garden'; // 'garden', 'archives', or 'settings'

    // --- Core Logic ---

    function saveToStorage() {
        localStorage.setItem('thought-garden-seeds', JSON.stringify(notes));
        localStorage.setItem('thought-garden-settings', JSON.stringify(settings));
    }

    function renderGarden() {
        // Handle view visibility
        gardenGrid.style.display = currentView === 'settings' ? 'none' : 'grid';
        settingsView.style.display = currentView === 'settings' ? 'block' : 'none';
        fabPlant.style.display = currentView === 'settings' ? 'none' : 'flex';

        if (currentView === 'settings') return;

        // Clear except empty state
        const cards = gardenGrid.querySelectorAll('.seed-card');
        cards.forEach(card => card.remove());

        const filteredNotes = notes.filter(note => {
            // Filter by view
            const isArchived = note.archived || false;
            if (currentView === 'garden' && isArchived) return false;
            if (currentView === 'archives' && !isArchived) return false;

            // Filter by search
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (note.title || '').toLowerCase().includes(query) ||
                (note.body || '').toLowerCase().includes(query);
        });

        if (filteredNotes.length === 0) {
            emptyState.style.display = 'block';
            let message = '';
            if (searchQuery) {
                message = `「${searchQuery}」に一致する種は見つかりませんでした。`;
            } else {
                message = currentView === 'garden'
                    ? '庭はまだ静かです。右下のボタンから最初の「種」を植えましょう。'
                    : '記録の壺はまだ空っぽです。';
            }
            emptyState.querySelector('p').textContent = message;
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
            <button class="btn-archive" title="${note.archived ? '庭に戻す' : '記録の壺へ'}">${note.archived ? '🌱' : '🏺'}</button>
            <button class="btn-delete" title="完全に取り除く">✕</button>
        `;

        // Archive functionality
        div.querySelector('.btn-archive').addEventListener('click', (e) => {
            e.stopPropagation();
            note.archived = !note.archived;
            saveToStorage();
            renderGarden();
            showToast(note.archived ? '種を記録の壺へ移しました' : '種を元の庭へ戻しました');
        });

        // Delete functionality
        div.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('この種を完全に取り除きますか？（元に戻せません）')) {
                notes = notes.filter(n => n.id !== note.id);
                saveToStorage();
                renderGarden();
                showToast('種を完全に取り除きました');
            }
        });

        // Open for edit
        div.addEventListener('click', () => {
            editorTitle.value = note.title;
            editorBody.value = note.body;
            currentEditingId = note.id;
            editorOverlay.classList.add('active');
            editorTitle.focus();
        });

        return div;
    }

    // --- Notifications ---
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>✨</span><span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // --- Navigation Events ---
    btnGarden.addEventListener('click', () => {
        currentView = 'garden';
        viewTitle.textContent = 'わたしの庭';
        btnGarden.classList.add('active');
        btnArchives.classList.remove('active');
        renderGarden();
    });

    btnArchives.addEventListener('click', () => {
        currentView = 'archives';
        viewTitle.textContent = '記録の壺';
        btnArchives.classList.add('active');
        btnGarden.classList.remove('active');
        btnSettings.classList.remove('active');
        renderGarden();
    });

    btnSettings.addEventListener('click', () => {
        currentView = 'settings';
        viewTitle.textContent = '設定';
        btnSettings.classList.add('active');
        btnGarden.classList.remove('active');
        btnArchives.classList.remove('active');
        renderGarden();
    });

    // --- Search Event ---
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderGarden();
    });

    // --- Timer Logic ---
    let timerInterval;
    let timeLeft = settings.timerDuration * 60;
    const circleRadius = 45;
    const circumference = 2 * Math.PI * circleRadius;
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;

    function updateTimerDisplay() {
        const totalSeconds = settings.timerDuration * 60;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const offset = circumference - (timeLeft / totalSeconds) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }

    btnTimerStart.addEventListener('click', () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            btnTimerStart.textContent = '集中を再開';
            btnTimerStart.classList.remove('running');
            appBody.classList.remove('timer-glow');
            timerSection.classList.remove('finished');
        } else {
            btnTimerStart.textContent = '中断する';
            btnTimerStart.classList.add('running');
            appBody.classList.add('timer-glow');
            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    btnTimerStart.textContent = '集中を終える';
                    timerSection.classList.add('finished');
                    showToast('静寂の時間が終わりました');
                    // Notification sound or visual could go here
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
                const note = notes.find(n => n.id === currentEditingId);
                note.title = title;
                note.body = body;
                note.date = new Date().toISOString();
            } else {
                const newNote = {
                    id: Date.now().toString(),
                    title: title,
                    body: body,
                    date: new Date().toISOString(),
                    tags: ['庭の記憶'],
                    archived: false
                };
                notes.push(newNote);
            }

            saveToStorage();
            renderGarden();
            editorOverlay.classList.remove('active');
            showToast(currentEditingId ? '種を更新しました' : '新しい種を庭に植えました');
        } else {
            showToast('何かを書いてから植えましょう');
        }
    });

    // --- Settings Events ---
    timerDurationInput.value = settings.timerDuration;
    timerDurationInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        if (val > 0 && val <= 120) {
            settings.timerDuration = val;
            saveToStorage();
            if (!timerInterval) {
                timeLeft = val * 60;
                updateTimerDisplay();
            }
            showToast('タイマー設定を更新しました');
        }
    });

    btnExport.addEventListener('click', () => {
        const dataStr = JSON.stringify({ notes, settings }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thought-garden-seeds-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('データを書き出しました');
    });

    btnResetAll.addEventListener('click', () => {
        if (confirm('本当に庭を更地に戻しますか？すべての「思考の種」が失われます。')) {
            notes = [];
            settings = { timerDuration: 25 };
            saveToStorage();
            location.reload();
        }
    });

    // Initialize
    renderGarden();
    updateTimerDisplay();
});
