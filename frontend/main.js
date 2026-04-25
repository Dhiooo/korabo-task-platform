const BASE_URL = 'http://localhost:5000/api';

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    // Auto remove after 3s
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

const mainContent = document.getElementById('main-content');
const navbar = document.getElementById('navbar');
const userDisplay = document.getElementById('user-display');

let currentUser = JSON.parse(sessionStorage.getItem('user')) || null;
let currentToken = sessionStorage.getItem('token') || null;
let logInterval = null;

// Helper: Handle API calls
async function apiCall(endpoint, method = 'GET', body = null, isMultipart = false) {
    const headers = {};
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    if (!isMultipart) headers['Content-Type'] = 'application/json';

    const options = {
        method,
        headers,
        body: isMultipart ? body : (body ? JSON.stringify(body) : null)
    };

    console.log(`Fetching: ${BASE_URL}${endpoint} [${method}]`);
    const res = await fetch(`${BASE_URL}${endpoint}`, options);

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
    return data;
}

// Router
function navigate(view, params = {}) {
    // Clear any active interval when navigating
    if (logInterval) {
        clearInterval(logInterval);
        logInterval = null;
    }

    // Auth Guard: Only allow login/register if not authenticated
    const publicViews = ['login', 'register'];
    if (!currentUser && !publicViews.includes(view)) {
        return navigate('login');
    }

    const tpl = document.getElementById(`tpl-${view}`);
    if (!tpl) return;
    
    mainContent.innerHTML = '';
    mainContent.appendChild(tpl.content.cloneNode(true));

    if (view === 'login') initLogin();
    if (view === 'register') initRegister();
    if (view === 'dashboard') initDashboard();
    if (view === 'kanban') initKanban(params.groupId, params);
    if (view === 'activities') initActivities(params.groupId);
    if (view === 'report') initReport(params.groupId);

    updateNavbarVisibility();
}


function updateNavbarVisibility() {
    if (currentUser) {
        navbar.classList.remove('hidden');
        userDisplay.textContent = `${currentUser.name} (${currentUser.nim})`;
    } else {
        navbar.classList.add('hidden');
    }
}

// Auth Logics
function initLogin() {
    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        const nim = document.getElementById('login-nim').value;
        const password = document.getElementById('login-pass').value;
        try {
            const data = await apiCall('/login', 'POST', { nim, password });
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
            currentToken = data.token;
            currentUser = data.user;

            navigate('dashboard');
        } catch (err) { showToast(err.message, 'error'); }
    };
    document.getElementById('go-register').onclick = (e) => { e.preventDefault(); navigate('register'); };
}

function initRegister() {
    document.getElementById('register-form').onsubmit = async (e) => {
        e.preventDefault();
        const body = {
            name: document.getElementById('reg-name').value,
            nim: document.getElementById('reg-nim').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-pass').value
        };
        try {
            await apiCall('/register', 'POST', body);
            showToast('Registrasi berhasil, silakan login');

            navigate('login');
        } catch (err) { showToast(err.message, 'error'); }
    };
    document.getElementById('go-login').onclick = (e) => { e.preventDefault(); navigate('login'); };
}

// Dashboard Logics
async function initDashboard() {
    try {
        const groups = await apiCall('/groups');
        const list = document.getElementById('group-list');
        list.innerHTML = groups.map(g => `
            <div class="glass-card p-lg d-flex flex-column justify-between h-full">
                <div onclick="window.goKanban(${g.id}, '${g.name}', '${g.code}')" class="cursor-pointer">
                    <h3 class="mb-sm">${g.name}</h3>
                    <p class="text-muted">Kode grup: <strong>${g.code}</strong></p>
                </div>
                ${g.admin_id === currentUser.id ? `
                    <div class="d-flex gap-md mt-xl pt-lg" style="border-top: 1px solid var(--border)">
                        <button class="btn btn-sm" onclick="editGroup(${g.id}, '${g.name}')">Ganti Nama</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteGroup(${g.id})">Hapus Grup</button>
                    </div>
                ` : `
                    <div class="mt-xl pt-lg" style="border-top: 1px solid var(--border)">
                        <button class="btn btn-sm btn-danger" onclick="leaveGroup(${g.id})">Keluar Grup</button>
                    </div>
                `}
            </div>
        `).join('');

        document.getElementById('show-create-modal').onclick = () => openCreateGroupModal();
        document.getElementById('show-join-modal').onclick = () => openJoinGroupModal();

    } catch (err) { console.error(err); }
}

function openCreateGroupModal() {
    const container = document.getElementById('modal-container');
    const tpl = document.getElementById('tpl-modal-add-group');
    container.innerHTML = '';
    container.appendChild(tpl.content.cloneNode(true));
    container.classList.remove('hidden');

    document.getElementById('add-group-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-group-name').value;
        try {
            const data = await apiCall('/groups', 'POST', { name });
            showToast(`Grup dibuat! Kode grup: ${data.code}`);

            closeModal();
            initDashboard();
        } catch (err) { showToast(err.message, 'error'); }
    };
}

function openJoinGroupModal() {
    const container = document.getElementById('modal-container');
    const tpl = document.getElementById('tpl-modal-join-group');
    container.innerHTML = '';
    container.appendChild(tpl.content.cloneNode(true));
    container.classList.remove('hidden');

    document.getElementById('join-group-form').onsubmit = async (e) => {
        e.preventDefault();
        const code = document.getElementById('join-group-code').value;
        try {
            await apiCall('/groups/join', 'POST', { code });
            showToast('Berhasil bergabung ke grup!');

            closeModal();
            initDashboard();
        } catch (err) { showToast(err.message, 'error'); }
    };
}



window.editGroup = async (id, oldName) => {
    const name = prompt('Ubah Nama Grup:', oldName);
    if (name && name !== oldName) {
        try {
            await apiCall(`/groups/${id}`, 'PUT', { name });
            initDashboard();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.deleteGroup = async (id) => {
    if (confirm('PERINGATAN: Menghapus grup akan menghapus seluruh tugas, anggota, dan log di dalamnya. Lanjutkan?')) {
        try {
            await apiCall(`/groups/${id}`, 'DELETE');
            initDashboard();
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.leaveGroup = async (id) => {
    if (confirm('Apakah anda yakin ingin keluar dari grup ini?')) {
        try {
            await apiCall(`/groups/${id}/leave`, 'POST');
            initDashboard();
        } catch (err) { showToast(err.message, 'error'); }
    }
};


window.goKanban = (id, name, code) => navigate('kanban', { groupId: id, groupName: name, groupCode: code });

// Kanban Logics
async function initKanban(groupId, params = {}) {
    document.getElementById('back-dash').onclick = () => navigate('dashboard');
    
    const nameEl = document.getElementById('group-name-display');
    const codeEl = document.getElementById('group-code-display');
    
    if (params.groupName) {
        nameEl.textContent = params.groupName;
        codeEl.textContent = `Kode Grup: ${params.groupCode}`;
    } else {
        const grp = await apiCall(`/groups`);
        const currentGrp = grp.find(g => g.id == groupId);
        if (currentGrp) {
            nameEl.textContent = currentGrp.name;
            codeEl.textContent = `Kode Grup: ${currentGrp.code}`;
        }
    }

    const tasks = await apiCall(`/tasks/${groupId}`);
    const members = await apiCall(`/groups/${groupId}/members`);
    
    renderAssignmentView(tasks, members, groupId);
    renderMembersSidebar(members, groupId);

    const isAdmin = members.find(m => m.id === currentUser.id)?.is_admin == 1;
    const addBtn = document.getElementById('show-task-modal');
    if (isAdmin) {
        addBtn.classList.remove('hidden');
        addBtn.onclick = () => window.openAddTaskModal(groupId);
    } else {
        addBtn.classList.add('hidden');
    }

    document.getElementById('show-activity-btn').onclick = () => navigate('activities', { groupId });
    document.getElementById('export-report-btn').onclick = () => navigate('report', { groupId });
}

window.openAddTaskModal = async (groupId) => {
    const members = await apiCall(`/groups/${groupId}/members`);
    const tpl = document.getElementById('tpl-modal-add-task');
    const container = document.getElementById('modal-container');
    
    container.innerHTML = '';
    container.appendChild(tpl.content.cloneNode(true));
    container.classList.remove('hidden');

    const select = document.getElementById('task-assignee');
    members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        select.appendChild(opt);
    });

    document.getElementById('add-task-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            group_id: groupId,
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-desc').value,
            deadline: document.getElementById('task-deadline').value || null,
            assigned_to: document.getElementById('task-assignee').value || null
        };

        try {
            await apiCall('/tasks', 'POST', data);
            closeModal();
            initKanban(groupId);
        } catch (err) { showToast(err.message, 'error'); }
    };
};

window.closeModal = () => {
    document.getElementById('modal-container').classList.add('hidden');
};

function renderMembersSidebar(members, groupId) {
    const list = document.getElementById('members-list');
    list.innerHTML = members.map(m => {
        const isAdmin = m.is_admin == 1;
        return `
            <div class="d-flex justify-between align-center p-md glass-card mb-sm" style="border-radius: 0.75rem; padding: 0.5rem 1rem;">
                <span style="font-weight: 500;">${m.name}</span>
                <span class="badge ${isAdmin ? 'badge-admin' : 'badge-member'}" style="font-size: 0.7rem; padding: 0.3rem 0.7rem;">
                    ${isAdmin ? 'Admin' : 'Anggota'}
                </span>
            </div>
        `;
    }).join('');
}

function formatDateFull(dateStr) {
    if (!dateStr) return 'Tidak ada deadline';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }) + ' WIB';
}

function renderAssignmentView(tasks, members, groupId) {
    const container = document.getElementById('kanban-board-container');
    container.innerHTML = '';

    const isAdmin = members.find(m => m.id === currentUser.id)?.is_admin == 1;

    // 1. Backlog Section
    const unassignedTasks = tasks.filter(t => t.assigned_to === null);
    const backlog = document.createElement('div');
    backlog.className = 'backlog-section';
    backlog.innerHTML = `
        <div class="d-flex justify-between align-center mb-md">
            <h3 style="color: var(--primary);">📥 Belum Ditugaskan</h3>
            <span class="status-count">${unassignedTasks.length} Tugas</span>
        </div>
        <div id="unassigned-list"></div>
    `;
    container.appendChild(backlog);

    const unassignedList = backlog.querySelector('#unassigned-list');
    if (unassignedTasks.length === 0) {
        unassignedList.innerHTML = `<p class="text-muted" style="font-size: 0.85rem;">Semua tugas sudah diberikan.</p>`;
    } else {
        unassignedTasks.forEach(t => {
            const row = document.createElement('div');
            row.style.borderBottom = "1px solid rgba(255,219,187,0.05)";
            row.innerHTML = `
                <div class="task-assign-row">
                    <span>${t.title}</span>
                    <span class="more-info-link" onclick="toggleTaskDetail(this)">more info</span>
                </div>
                <div class="task-detail-area">
                    <p class="mb-md"><strong>Deskripsi:</strong><br>${t.description || 'Tidak ada deskripsi.'}</p>
                    <p class="mb-md" style="color: #ff9f43; font-weight: bold;">🚨 Deadline: ${formatDateFull(t.deadline)}</p>
                    <div class="task-footer d-flex gap-sm">
                        ${isAdmin ? `<button class="btn btn-sm" onclick="showAssignPrompt(${t.id}, ${groupId})">Berikan Tugas</button>` : ''}
                        ${isAdmin ? `<button class="btn btn-sm btn-danger" onclick="deleteTask(${t.id}, ${groupId})">Hapus</button>` : ''}
                    </div>
                </div>
            `;
            unassignedList.appendChild(row);
        });
    }

    // 2. Member Accordions
    members.forEach(member => {
        const userTasks = tasks.filter(t => t.assigned_to === member.id);
        const item = document.createElement('div');
        item.className = 'accordion-item mt-md';
        
        const sections = [
            { id: 0, label: 'Not Started', class: 'notstarted' },
            { id: 1, label: 'In Progress', class: 'inprogress' },
            { id: 2, label: 'Done', class: 'done' }
        ];

        let nestedHTML = '';
        sections.forEach(s => {
            const tks = userTasks.filter(t => t.status == s.id);
            nestedHTML += `
                <div class="status-accordion" onclick="this.classList.toggle('active')">
                    <div class="status-accordion-header">
                        <span>${s.label} (${tks.length})</span>
                        <svg class="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="status-accordion-content" onclick="event.stopPropagation()">
                        ${tks.length === 0 ? '<p class="text-muted" style="font-size: 0.8rem">Kosong</p>' : tks.map(t => {
                            const isOwner = currentUser.id == member.id;
                            const isOwnerOrAdmin = isOwner || isAdmin;
                            return `
                            <div style="border-bottom: 1px solid rgba(255,219,187,0.05);">
                                <div class="task-assign-row">
                                    <div class="d-flex flex-column">
                                        <span style="font-weight: 500;">${t.title}</span>
                                        ${t.status == 2 ? `<span class="text-muted" style="font-size: 0.75rem; color: #55efc4;">✅ Selesai: ${formatDateFull(t.completed_at)}</span>` : ''}
                                    </div>
                                    <span class="more-info-link" onclick="toggleTaskDetail(this)">more info</span>
                                </div>
                                <div class="task-detail-area">
                                    <p class="mb-md"><strong>Deskripsi:</strong><br>${t.description || 'Tidak ada deskripsi.'}</p>
                                    <p class="mb-md" style="color: #ff9f43; font-weight: bold;">🚨 Deadline: ${formatDateFull(t.deadline)}</p>
                                    
                                    <div class="task-footer d-flex flex-column gap-sm">
                                        ${t.status == 0 && isOwnerOrAdmin ? `<button class="btn btn-sm" onclick="window.updateStatus(${t.id}, 1, ${groupId})">Mulai</button>` : ''}
                                        
                                        ${t.status == 1 && isOwner ? `
                                            <div class="d-flex flex-column gap-sm p-md glass-card" style="border: 1px dashed var(--primary);">
                                                <label style="font-size: 0.75rem; font-weight: bold;">Lampirkan PDF Bukti:</label>
                                                <input type="file" id="proof-${t.id}" accept=".pdf" class="btn btn-sm mb-sm">
                                                <button class="btn btn-sm btn-primary" onclick="window.submitWithProof(${t.id}, ${groupId})">Kirim & Selesai</button>
                                            </div>
                                        ` : ''}

                                        ${t.status == 2 && t.proof_file ? `
                                            <div class="mb-md p-md glass-card" style="border: 1px solid rgba(85, 239, 196, 0.3);">
                                                <p style="font-size: 0.8rem; margin-bottom: 0.8rem; color: #55efc4; font-weight: bold;">
                                                    Tugas diselesaikan pada: ${formatDateFull(t.completed_at)}
                                                </p>
                                                <div class="d-flex gap-sm">
                                                    <a href="http://localhost:5000/uploads/${t.proof_file}" target="_blank" class="btn btn-sm btn-secondary text-center flex-grow" style="text-decoration: none;">
                                                        📄 Lihat PDF
                                                    </a>
                                                    ${isOwner ? `<button class="btn btn-sm btn-danger" onclick="window.cancelDone(${t.id}, ${groupId})" title="Batalkan & Revisi">✖ Batal</button>` : ''}
                                                </div>
                                            </div>
                                        ` : ''}

                                        <div class="d-flex gap-sm mt-md">
                                            ${isAdmin ? `<button class="btn btn-sm btn-secondary" onclick="showAssignPrompt(${t.id}, ${groupId})">Alihkan Tugas 🔄</button>` : ''}
                                            ${isAdmin ? `<button class="btn btn-sm btn-danger" onclick="deleteTask(${t.id}, ${groupId})">Hapus</button>` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>`;

                        }).join('')}
                    </div>
                </div>
            `;
        });

        item.innerHTML = `
            <div class="accordion-header" onclick="toggleMemberAccordion(this)">
                <div class="d-flex align-center gap-md">
                    <span style="font-weight: 700;">${member.name}</span>
                    <span class="text-muted" style="font-size: 0.8rem;">(${userTasks.length} Tugas)</span>
                </div>
                <svg class="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="accordion-content">
                ${nestedHTML}
            </div>
        `;
        container.appendChild(item);
    });
}

window.toggleTaskDetail = (el) => {
    const parent = el.closest('.task-assign-row').parentElement;
    const detail = parent.querySelector('.task-detail-area');
    detail.classList.toggle('active');
    el.textContent = detail.classList.contains('active') ? 'less info' : 'more info';
};

window.toggleMemberAccordion = (header) => {
    header.parentElement.classList.toggle('active');
};

window.deleteTask = async (taskId, groupId) => {
    if (confirm('Apakah anda yakin ingin menghapus tugas ini?')) {
        try {
            await apiCall(`/tasks/${taskId}`, 'DELETE');
            initKanban(groupId);
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.showAssignPrompt = async (taskId, groupId) => {
    const members = await apiCall(`/groups/${groupId}/members`);
    const options = members.map(m => `${m.id}: ${m.name}`).join('\n');
    const input = prompt(`Pilih ID Anggota:\n${options}`);
    if (input) {
        const userId = input.split(':')[0].trim();
        try {
            await apiCall(`/tasks/${taskId}/assign`, 'PUT', { userId });
            initKanban(groupId);
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.updateStatus = async (taskId, status, groupId) => {
    try {
        await apiCall(`/tasks/${taskId}/status`, 'PUT', { status });
        initKanban(groupId);
    } catch (err) { showToast(err.message, 'error'); }
};

window.cancelDone = async (taskId, groupId) => {
    if (confirm('Batalkan status selesai dan kembalikan ke tahap revisi?')) {
        try {
            await apiCall(`/tasks/${taskId}/status`, 'PUT', { status: 1 });
            initKanban(groupId);
        } catch (err) { showToast(err.message, 'error'); }
    }
};

window.submitWithProof = async (taskId, groupId) => {
    const fileInput = document.getElementById(`proof-${taskId}`);
    if (!fileInput.files[0]) return alert('Harap pilih file PDF bukti tugas');
    
    const formData = new FormData();
    formData.append('status', 2);
    formData.append('proof', fileInput.files[0]);
    
    try {
        await apiCall(`/tasks/${taskId}/status`, 'PUT', formData, true);
        initKanban(groupId);
    } catch (err) { showToast(err.message, 'error'); }
};

async function initActivities(groupId) {
    document.getElementById('back-kanban-log').onclick = () => navigate('kanban', { groupId });
    
    // Check if admin to show clear button
    const members = await apiCall(`/groups/${groupId}/members`);
    const isAdmin = members.find(m => m.id === currentUser.id)?.is_admin == 1;
    const clearBtn = document.getElementById('clear-activity-btn');
    if (isAdmin) {
        clearBtn.classList.remove('hidden');
        clearBtn.onclick = async () => {
            if (confirm('Apakah anda yakin ingin menghapus seluruh riwayat aktivitas grup ini?')) {
                try {
                    await apiCall(`/activities/${groupId}`, 'DELETE');
                    fetchLogs(); // Just refresh logs instead of full init
                } catch (err) { showToast(err.message, 'error'); }

            }
        };
    }

    const fetchLogs = async () => {
        try {
            const activities = await apiCall(`/activities/${groupId}`);
            const list = document.getElementById('activities-list');
            if (!list) return;

            if (activities.length === 0) {
                list.innerHTML = '<p class="text-center text-muted">Belum ada aktivitas tercatat.</p>';
                return;
            }

            const newHtml = activities.map(a => `
                <div class="d-flex justify-between align-center p-md" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div>
                        <strong style="color: var(--primary);">${a.user_name}</strong> 
                        <span class="ml-sm">${a.message}</span>
                    </div>
                    <div class="text-muted" style="font-size: 0.8rem;">
                        ${formatDateFull(a.created_at)}
                    </div>
                </div>
            `).join('');

            // Only update if content changed to prevent disappearing/flickering
            if (list.innerHTML !== newHtml) {
                list.innerHTML = newHtml;
            }
        } catch (err) {
            console.error('Polling error:', err);
        }
    };


    await fetchLogs();
    // Set interval for realtime updates (every 3 seconds)
    logInterval = setInterval(fetchLogs, 3000);
}

async function initReport(groupId) {
    document.getElementById('back-kanban-report').onclick = () => navigate('kanban', { groupId });
    const report = await apiCall(`/reports/${groupId}`);
    const body = document.getElementById('report-body');
    body.innerHTML = report.map(r => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 1rem;">${r.name}</td>
            <td style="padding: 1rem;">${r.nim}</td>
            <td style="padding: 1rem; text-align: center;">${r.total_tasks}</td>
            <td style="padding: 1rem; text-align: center; font-weight: bold; color: ${parseInt(r.punctuality) >= 80 ? '#55efc4' : '#ff7675'}">
                ${r.punctuality}
            </td>
        </tr>
    `).join('');
}

document.getElementById('logout-btn').onclick = () => {
    sessionStorage.clear();
    currentUser = null;
    currentToken = null;
    navigate('login');
};

// Start App: Default to login if no token
if (currentToken && currentUser) {
    navigate('dashboard');
} else {
    navigate('login');
}
