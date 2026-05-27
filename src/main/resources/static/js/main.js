let serverConfig = {};
let worldCreatorConfig = {};
let currentWorkflow = '';

/* ================================================================
   Auth wrapper
   ================================================================ */
async function authFetch(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }
    const storedPassword = localStorage.getItem('panelPassword');
    if (storedPassword) {
        options.headers['X-Password'] = storedPassword;
    }

    let response = await fetch(url, options);

    if (response.status === 401) {
        const newPassword = prompt('请输入管理面板密码:');
        if (!newPassword) {
            throw new Error('未提供密码');
        }
        localStorage.setItem('panelPassword', newPassword);
        options.headers['X-Password'] = newPassword;
        response = await fetch(url, options);
    }

    return response;
}

/* ================================================================
   Sidebar toggle (mobile/tablet)
   ================================================================ */
function initSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!toggle || !sidebar || !overlay) return;

    function open() {
        sidebar.classList.add('open');
        overlay.classList.add('show');
    }
    function close() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    }

    toggle.addEventListener('click', () => {
        sidebar.classList.contains('open') ? close() : open();
    });
    overlay.addEventListener('click', close);

    // Close sidebar when a nav button is clicked (mobile)
    sidebar.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.innerWidth <= 900) close();
        });
    });

    // Auto-close on window resize to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        }
    });
}

/* ================================================================
   Sidebar server status
   ================================================================ */
function updateSidebarStatus() {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    if (!dot || !text) return;

    authFetch('/manage/serverlist')
        .then(res => res.ok ? res.json() : [])
        .then(list => {
            if (list && list.length > 0) {
                dot.className = 'status-dot online';
                text.textContent = `运行中: ${list.length} 个服务器`;
            } else {
                dot.className = 'status-dot';
                text.textContent = '无运行中服务器';
            }
        })
        .catch(() => {
            dot.className = 'status-dot';
            text.textContent = '状态未知';
        });
}

/* ================================================================
   Dynamic view loader
   ================================================================ */
function loadView(view, params = {}) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = view.html;
    if (typeof view.init === 'function') {
        view.init.bind(view)(params);
    }
    // Scroll to top on view change
    contentArea.scrollTop = 0;
}

/* ================================================================
   Helper: send creation step config
   ================================================================ */
async function postCreatorStep(dataToSend, nextView, buttonElement, statusElement, successMessage) {
    buttonElement.disabled = true;
    statusElement.style.color = 'var(--cream-dim)';
    statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在发送配置...';

    try {
        const response = await authFetch('/create/worldconfig', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: dataToSend
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '服务器返回错误');
        }

        await response.text();

        if (nextView) {
            loadView(nextView);
        } else {
            statusElement.innerHTML = `<span class="status-success">${successMessage || '操作成功！'}</span>`;
            buttonElement.style.display = 'none';
        }

    } catch (err) {
        statusElement.innerHTML = `<span class="status-fail">发送失败: ${err.message}</span>`;
        buttonElement.disabled = false;
    }
}

/* ================================================================
   App Startup
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

    initSidebar();
    updateSidebarStatus();
    // Refresh sidebar status every 30 seconds
    setInterval(updateSidebarStatus, 30000);

    const btnCreateServer = document.getElementById('btnCreateServer');
    const btnMapManagement = document.getElementById('btnMapManagement');
    const btnModManagement = document.getElementById('btnModManagement');
    const btnList = document.getElementById('btnServerList');

    const setActive = (selectedBtn) => {
        [btnCreateServer, btnMapManagement, btnModManagement, btnList].forEach(btn => btn.classList.remove('active'));
        selectedBtn.classList.add('active');
    };

    // 1. Create Server
    btnCreateServer.addEventListener('click', () => {
        setActive(btnCreateServer);
        currentWorkflow = 'createServer';
        serverConfig = {};
        loadView(InitialView);
    });

    // 2. Map Management (from template)
    btnMapManagement.addEventListener('click', () => {
        setActive(btnMapManagement);
        currentWorkflow = '';
        const template = document.getElementById('template-mapManagement');
        const view = {
            html: template.innerHTML,
            init: function() {
                const SelectWorldViewInstance = Object.create(SelectWorldView);
                SelectWorldViewInstance.renderWorldList = function() {
                    const container = document.getElementById('worldListContainer');
                    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>正在刷新世界列表...</p></div>';
                    authFetch('/resource/worldlist')
                      .then(response => {
                        if (!response.ok) return [];
                        return response.json();
                      })
                      .then(worlds => {
                        if (!worlds || worlds.length === 0) {
                          container.innerHTML = '<div class="empty-state"><i class="fas fa-globe-americas"></i><p>暂无世界文件</p><p style="font-size:0.82em;">请上传或创建一个新世界</p></div>';
                          return;
                        }
                        let listHtml = `<h3 style="font-family:var(--font-pixel); font-size:0.55rem; color:var(--gold); margin:0 0 10px;"><i class="fas fa-globe"></i> 可用世界</h3><div class="item-list">`;
                        worlds.forEach((world) => {
                          listHtml += `
                            <label>
                              <input type="checkbox" name="world" value="${world}">
                              <span>${world}</span>
                            </label>`;
                        });
                        listHtml += `</div>`;
                        container.innerHTML = listHtml;
                      })
                      .catch(err => {
                        container.innerHTML = `<p class="status-fail">加载失败: ${err.message}</p>`;
                      });
                };

                SelectWorldViewInstance.renderWorldList();

                setupUploader({
                  dropZoneId: 'worldDropZone', fileInputId: 'worldFileInput', fileListId: 'worldFileList',
                  uploadBtnId: 'uploadAllWorldsBtn', showUploaderBtnId: 'showWorldUploaderBtn',
                  uploaderAreaId: 'worldUploadArea', uploadEndpoint: '/resource/uploadworld',
                  statusContainerId: 'worldUploadStatus',
                  onUploadComplete: SelectWorldViewInstance.renderWorldList.bind(SelectWorldViewInstance)
                });

                document.getElementById('deleteSelectedWorldsBtn').addEventListener('click', function() {
                    const selectedWorlds = Array.from(document.querySelectorAll('input[name="world"]:checked')).map(cb => cb.value);
                    if (selectedWorlds.length === 0) return alert('请至少选择一个世界文件');
                    if (!confirm(`确定删除这 ${selectedWorlds.length} 个文件吗？`)) return;

                    authFetch('/resource/deleteworlds', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(selectedWorlds)
                    }).then(() => {
                        SelectWorldViewInstance.renderWorldList();
                    });
                });

                document.getElementById('createWorldBtn').addEventListener('click', () => {
                    currentWorkflow = 'createWorld';
                    worldCreatorConfig = {};
                    loadView(SelectModView);
                });
            }
        };
        loadView(view);
    });

    // 3. Mod Management (from template)
    btnModManagement.addEventListener('click', () => {
        setActive(btnModManagement);
        currentWorkflow = '';
        const template = document.getElementById('template-modManagement');
        const view = {
            html: template.innerHTML,
            init: function() {
                const tabs = {
                    mods: { tab: document.getElementById('tabMods'), view: document.getElementById('viewMods') },
                    packs: { tab: document.getElementById('tabPacks'), view: document.getElementById('viewPacks') }
                };

                function switchTab(name) {
                    Object.values(tabs).forEach(t => {
                        t.tab.classList.remove('active');
                        t.view.classList.remove('active');
                    });
                    tabs[name].tab.classList.add('active');
                    tabs[name].view.classList.add('active');
                    if (name === 'packs') renderPacks();
                    if (name === 'mods') renderMods();
                }

                tabs.mods.tab.addEventListener('click', () => switchTab('mods'));
                tabs.packs.tab.addEventListener('click', () => switchTab('packs'));

                const renderMods = () => {
                    const container = document.getElementById('modListContainer');
                    authFetch('/resource/modlist?t=' + Date.now())
                      .then(res => res.json())
                      .then(mods => {
                        if (!mods || mods.length === 0) {
                          container.innerHTML = '<div class="empty-state"><i class="fas fa-puzzle-piece"></i><p>暂无模组</p><p style="font-size:0.82em;">请在右侧上传模组文件</p></div>';
                          return;
                        }
                        let html = '';
                        mods.forEach(mod => {
                          html += `
                          <label class="mm-item">
                              <input type="checkbox" name="mod" value="${mod}">
                              <span>${mod}</span>
                          </label>`;
                        });
                        container.innerHTML = html;
                      })
                      .catch(err => container.innerHTML = `<p class="status-fail" style="padding:20px;">加载失败: ${err.message}</p>`);
                };

                const renderPacks = () => {
                    const container = document.getElementById('packListContainer');
                    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>加载中...</p></div>';

                    authFetch('/resource/packagelist?t=' + Date.now())
                      .then(res => res.json())
                      .then(pkgs => {
                        if (!pkgs || pkgs.length === 0) {
                          container.innerHTML = '<div class="empty-state"><i class="fas fa-archive"></i><p>暂无整合包</p></div>';
                          return;
                        }
                        let html = '';
                        pkgs.forEach(pkg => {
                          const displayName = pkg.replace(/\.json$/, '');
                          html += `
                          <label class="mm-item">
                              <input type="checkbox" name="package" value="${pkg}">
                              <span><i class="fas fa-archive" style="color:var(--gold-dim); margin-right:8px;"></i>${displayName}</span>
                              <span style="font-size:0.78em; color:var(--cream-dim);">${pkg}</span>
                          </label>`;
                        });
                        container.innerHTML = html;
                      })
                      .catch(err => container.innerHTML = '<p class="status-fail" style="padding:20px;">加载失败</p>');
                };

                renderMods();

                setupUploader({
                  dropZoneId: 'modDropZone',
                  fileInputId: 'modFileInput',
                  fileListId: 'modFileList',
                  uploadBtnId: 'uploadAllModsBtn',
                  showUploaderBtnId: null,
                  uploaderAreaId: 'modUploadArea',
                  uploadEndpoint: '/resource/uploadmod',
                  statusContainerId: 'modUploadStatus',
                  onUploadComplete: () => {
                    renderMods();
                    setTimeout(() => { document.getElementById('modUploadStatus').innerHTML = ''; }, 3000);
                  }
                });

                document.getElementById('delModsBtn').addEventListener('click', () => {
                    const selected = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);
                    if (selected.length === 0) return alert('请先选择模组');
                    if (!confirm(`确定删除 ${selected.length} 个模组吗？`)) return;
                    authFetch('/resource/deletemods', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(selected)
                    }).then(() => renderMods());
                });

                document.getElementById('delPacksBtn').addEventListener('click', () => {
                    const selected = Array.from(document.querySelectorAll('input[name="package"]:checked')).map(cb => cb.value);
                    if (selected.length === 0) return alert('请先选择整合包');
                    if (!confirm(`确定删除 ${selected.length} 个整合包吗？`)) return;
                    authFetch('/resource/deletepackages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(selected)
                    }).then(() => renderPacks());
                });

                document.getElementById('refreshPacksBtn').addEventListener('click', renderPacks);

                document.getElementById('createPkgBtn').addEventListener('click', () => {
                    const name = document.getElementById('pkgNameInput').value.trim();
                    if (!name) return alert('请输入名称');
                    const mods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);
                    if (mods.length === 0) return alert('请至少勾选一个模组');

                    const status = document.getElementById('pkgStatus');
                    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

                    authFetch('/resource/packmods', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ packageName: name, mods: mods })
                    })
                    .then(async res => {
                        if (!res.ok) throw new Error(await res.text());
                        status.style.color = 'var(--green-bright)';
                        status.innerHTML = '整合包创建成功!';
                        document.getElementById('pkgNameInput').value = '';
                        document.querySelectorAll('input[name="mod"]:checked').forEach(cb => cb.checked = false);
                        setTimeout(() => status.innerHTML = '', 3000);
                    })
                    .catch(err => {
                        status.style.color = 'var(--red-bright)';
                        status.innerHTML = `${err.message}`;
                    });
                });
            }
        };
        loadView(view);
    });

    // 4. Server List
    btnList.addEventListener('click', () => {
        setActive(btnList);
        currentWorkflow = '';
        loadView(ServerListView);
        setTimeout(updateSidebarStatus, 1000);
    });

    // Default view
    setActive(btnCreateServer);
    currentWorkflow = 'createServer';
    loadView(InitialView);
});