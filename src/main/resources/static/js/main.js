let serverConfig = {};      // 存储"创建服务器"流程的配置信息
let worldCreatorConfig = {};// 存储"创建世界"流程的配置信息
let currentWorkflow = '';   // 追踪当前流程

/**
 * 动态加载视图
 */
function loadView(view, params = {}) {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = view.html;
    if (typeof view.init === 'function') {
        view.init.bind(view)(params);
    }
}

/**
 * 辅助函数：发送创建步骤数据
 */
async function postCreatorStep(dataToSend, nextView, buttonElement, statusElement, successMessage) {
    buttonElement.disabled = true;
    statusElement.style.color = 'var(--text-secondary)';
    statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在发送配置...';

    try {
        const response = await fetch('/create/worldconfig', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: dataToSend
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '服务器返回错误');
        }

        await response.text();
        console.log(`成功发送: '${dataToSend}'`);

        if (nextView) {
            loadView(nextView);
        } else {
            statusElement.innerHTML = `<span class="status-success">✅ ${successMessage || '操作成功！'}</span>`;
            buttonElement.style.display = 'none';
        }

    } catch (err) {
        statusElement.innerHTML = `<span class="status-fail">❌ 发送失败: ${err.message}</span>`;
        buttonElement.disabled = false;
    }
}

// --- 应用启动逻辑 ---
document.addEventListener('DOMContentLoaded', () => {

    // DOM元素选择
    const btnCreateServer = document.getElementById('btnCreateServer');
    const btnMapManagement = document.getElementById('btnMapManagement');
    const btnModManagement = document.getElementById('btnModManagement');
    const btnList = document.getElementById('btnServerList');

    const setActive = (selectedBtn) => {
        [btnCreateServer, btnMapManagement, btnModManagement, btnList].forEach(btn => btn.classList.remove('active'));
        selectedBtn.classList.add('active');
    };

    // 1. 创建服务器逻辑
    btnCreateServer.addEventListener('click', () => {
        setActive(btnCreateServer);
        currentWorkflow = 'createServer';
        serverConfig = {};
        loadView(InitialView);
    });

    // 2. 地图管理逻辑
    btnMapManagement.addEventListener('click', () => {
        setActive(btnMapManagement);
        currentWorkflow = '';
        loadView({
            html: `
            <div class="card">
              <h2><i class="fas fa-map"></i> 地图管理</h2>
              <p>管理您的 Terraria 世界地图文件。</p>
              <div class="content-wrapper">
                <div class="selection-area">
                  <div id="worldListContainer">正在加载世界列表...</div><br>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="showWorldUploaderBtn" style="flex: 1; min-width: 150px;">
                      <i class="fas fa-upload"></i> 上传新世界
                    </button>
                    <button id="deleteSelectedWorldsBtn" style="flex: 1; min-width: 150px; background: #e63946;">
                      <i class="fas fa-trash"></i> 删除选中项
                    </button>
                    <button id="createWorldBtn" style="flex: 1; min-width: 150px;">
                      <i class="fas fa-plus"></i> 创建新世界
                    </button>
                  </div>
                </div>
                <!-- 上传区域：默认隐藏，通过按钮触发 -->
                <div id="worldUploadArea" class="upload-area" style="display: none;">
                  <h3><i class="fas fa-upload"></i> 上传世界文件</h3>
                  <div id="worldDropZone" class="drop-zone">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>拖动文件到此处，或点击选择</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">支持 .wld 文件</p>
                  </div>
                  <input type="file" id="worldFileInput" multiple style="display: none;">
                  <h4><i class="fas fa-list"></i> 待上传列表：</h4>
                  <div id="worldFileList" class="file-list-container"></div>
                  <div id="worldUploadStatus"></div>
                  <br>
                  <button id="uploadAllWorldsBtn" style="width: 100%;">
                    <i class="fas fa-arrow-up"></i> 开始上传
                  </button>
                </div>
              </div>
              <div id="worldOperationStatus"></div>
            </div>`,
            init: function() {
                const SelectWorldViewInstance = Object.create(SelectWorldView);
                SelectWorldViewInstance.renderWorldList = function() {
                    const container = document.getElementById('worldListContainer');
                    container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在刷新世界列表...</p>';
                    fetch('/resource/worldlist')
                      .then(response => {
                        if (!response.ok) return [];
                        return response.json();
                      })
                      .then(worlds => {
                        if (!worlds || worlds.length === 0) {
                          container.innerHTML = '<p>暂无世界文件，请上传或创建一个新世界。</p>';
                          return;
                        }
                        let listHtml = `<h3><i class="fas fa-globe"></i> 可用世界</h3><div class="item-list">`;
                        worlds.forEach((world) => {
                          listHtml += `
                            <div style="display: flex; align-items: center; padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                              <input type="checkbox" name="world" value="${world}" style="margin-right: 15px; width: 18px; height: 18px;">
                              <span>${world}</span>
                            </div>`;
                        });
                        listHtml += `</div>`;
                        container.innerHTML = listHtml;
                      })
                      .catch(err => {
                        container.innerHTML = '<p style="color: var(--danger-color);">加载失败: ' + err.message + '</p>';
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

                    fetch('/resource/deleteworlds', {
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
        });
    });

    // 3. 模组管理逻辑 (优化版)
    btnModManagement.addEventListener('click', () => {
        setActive(btnModManagement);
        currentWorkflow = '';
        loadView({
            html: `
            <style>
                .mod-mgmt-view {
                    /* CSS 作用域，防止污染 */
                    --primary-color: #4361ee;
                    --bg-light: #f8f9fa;
                    --border-color: #e9ecef;
                }
                .mod-mgmt-view * {
                    box-sizing: border-box;
                }
                
                /* Tabs 样式 */
                .mm-tabs {
                    display: flex;
                    border-bottom: 2px solid var(--border-color);
                    margin-bottom: 20px;
                }
                .mm-tab {
                    padding: 12px 25px;
                    cursor: pointer;
                    font-weight: 500;
                    color: #6c757d;
                    transition: all 0.2s;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -2px;
                }
                .mm-tab:hover { color: var(--primary-color); background: var(#f8f9fa); }
                .mm-tab.active {
                    color: var(--primary-color);
                    border-bottom-color: var(--primary-color);
                }

                /* 布局 */
                .mm-content { display: none; }
                .mm-content.active { display: flex; gap: 20px; flex-wrap: wrap; }
                
                .mm-left-panel { flex: 3; min-width: 300px; display: flex; flex-direction: column; gap: 15px; }
                .mm-right-panel { flex: 2; min-width: 280px; display: flex; flex-direction: column; gap: 15px; }

                /* 列表样式 */
                .mm-list-box {
                    height: 500px;
                    overflow-y: auto;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: #fff;
                    padding: 5px;
                }
                .mm-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 15px;
                    border-bottom: 1px solid #f1f3f5;
                    transition: background 0.1s;
                    cursor: pointer;
                }
                .mm-item:hover { background: #f8f9fa; }
                .mm-item input { margin-right: 12px; transform: scale(1.1); }
                .mm-item-text { flex: 1; font-size: 0.95em; color: #333; }
                
                /* 卡片样式 */
                .mm-card {
                    background: var(#f8f9fa);
                    padding: 20px;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                }
                .mm-card-title {
                    margin-top: 0;
                    margin-bottom: 15px;
                    font-size: 1.1em;
                    color: #495057;
                    display: flex; align-items: center; gap: 8px;
                }

                /* 按钮和输入框 */
                .mm-input {
                    width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 5px; margin-bottom: 10px;
                }
                .mm-btn {
                    width: 100%; padding: 10px; border: none; border-radius: 5px; cursor: pointer; color: white; font-weight: 500;
                }
                .mm-btn-primary { background: var(--primary-color); }
                .mm-btn-success { background: #2a9d8f; }
                .mm-btn-danger { background: #e63946; width: auto; padding: 6px 12px; font-size: 0.9em; }

                @media (max-width: 768px) {
                    .mm-content.active { flex-direction: column; }
                    .mm-list-box { height: 350px; }
                }
            </style>

            <div class="card mod-mgmt-view" style="max-width: 1200px;">
              <h2><i class="fas fa-puzzle-piece"></i> 模组管理</h2>
              <p>管理您的模组文件，或将常用模组保存为整合包。</p>
              
              <!-- 一级菜单：Tabs -->
              <div class="mm-tabs">
                <div id="tabMods" class="mm-tab active"><i class="fas fa-cubes"></i> 模组列表</div>
                <div id="tabPacks" class="mm-tab"><i class="fas fa-archive"></i> 整合包管理</div>
              </div>
              
              <!-- 视图1：模组列表 (包含上传和创建整合包) -->
              <div id="viewMods" class="mm-content active">
                <!-- 左侧：模组列表 -->
                <div class="mm-left-panel">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin:0; font-size:1em;">已安装模组</h3>
                        <button id="delModsBtn" class="mm-btn mm-btn-danger"><i class="fas fa-trash"></i> 删除选中</button>
                    </div>
                    <div id="modListContainer" class="mm-list-box">
                        <div style="text-align: center; padding: 40px; color: #999;">
                            <i class="fas fa-spinner fa-spin"></i> 正在加载...
                        </div>
                    </div>
                </div>
                
                <!-- 右侧：操作面板 -->
                <div class="mm-right-panel">
                    <!-- 创建整合包卡片 -->
                    <div class="mm-card" style="background: #fff; border-top: 3px solid #2a9d8f;">
                        <h3 class="mm-card-title" style="color: #2a9d8f;"><i class="fas fa-box"></i> 创建整合包</h3>
                        <p style="font-size: 0.85em; color: #666; margin-bottom: 15px;">勾选左侧模组，保存为预设方案。</p>
                        <input type="text" id="pkgNameInput" class="mm-input" placeholder="输入整合包名称">
                        <button id="createPkgBtn" class="mm-btn mm-btn-success"><i class="fas fa-save"></i> 保存整合包</button>
                        <div id="pkgStatus" style="margin-top: 10px; font-size: 0.9em;"></div>
                    </div>

                    <!-- 上传模组卡片 -->
                    <div id="modUploadArea" class="mm-card" style="background: #fff; border-top: 3px solid #4361ee;">
                        <h3 class="mm-card-title" style="color: #4361ee;"><i class="fas fa-cloud-upload-alt"></i> 上传模组</h3>
                        <div id="modDropZone" class="drop-zone" style="padding: 20px; border: 1px dashed #ccc; background: #f8f9fa; cursor: pointer; text-align: center; margin-bottom: 10px;">
                            <i class="fas fa-file-import" style="font-size: 24px; color: #adb5bd;"></i>
                            <p style="margin: 5px 0 0; color: #666; font-size: 0.9em;">点击或拖拽 .tmod 文件</p>
                        </div>
                        <input type="file" id="modFileInput" multiple style="display: none;">
                        <div id="modFileList" class="file-list-container" style="max-height: 100px; margin-bottom: 10px;"></div>
                        <div id="modUploadStatus" style="font-size: 0.85em; margin-bottom: 5px;"></div>
                        <button id="uploadAllModsBtn" class="mm-btn mm-btn-primary"><i class="fas fa-arrow-up"></i> 开始上传</button>
                    </div>
                </div>
              </div>
              
              <!-- 视图2：整合包列表 (无应用按钮) -->
              <div id="viewPacks" class="mm-content">
                <div style="width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin:0; font-size:1em;">现有整合包</h3>
                        <div style="display: flex; gap: 10px;">
                            <button id="refreshPacksBtn" style="border:none; background:none; color:#4361ee; cursor:pointer;"><i class="fas fa-sync"></i> 刷新</button>
                            <button id="delPacksBtn" class="mm-btn mm-btn-danger"><i class="fas fa-trash"></i> 删除选中</button>
                        </div>
                    </div>
                    <div id="packListContainer" class="mm-list-box">
                        <div style="text-align: center; padding: 40px; color: #999;">
                            <i class="fas fa-spinner fa-spin"></i> 正在加载...
                        </div>
                    </div>
                </div>
              </div>

            </div>`,
            init: function() {
                // --- Tab 切换逻辑 ---
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

                // --- 1. 渲染模组列表 ---
                const renderMods = () => {
                    const container = document.getElementById('modListContainer');
                    fetch('/resource/modlist?t=' + Date.now())
                      .then(res => res.json())
                      .then(mods => {
                        if (!mods || mods.length === 0) {
                          container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">暂无模组，请在右侧上传。</div>';
                          return;
                        }
                        let html = '';
                        mods.forEach(mod => {
                          html += `
                          <label class="mm-item">
                              <input type="checkbox" name="mod" value="${mod}"> 
                              <span class="mm-item-text">${mod}</span>
                          </label>`;
                        });
                        container.innerHTML = html;
                      })
                      .catch(err => container.innerHTML = `<div style="padding:20px; color:red;">加载失败: ${err.message}</div>`);
                };

                // --- 2. 渲染整合包列表 (无应用按钮) ---
                const renderPacks = () => {
                    const container = document.getElementById('packListContainer');
                    container.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i></div>';

                    fetch('/resource/packagelist?t=' + Date.now())
                      .then(res => res.json())
                      .then(pkgs => {
                        if (!pkgs || pkgs.length === 0) {
                          container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">暂无整合包。</div>';
                          return;
                        }
                        let html = '';
                        pkgs.forEach(pkg => {
                          const displayName = pkg.replace(/\.json$/, '');
                          html += `
                          <label class="mm-item">
                              <input type="checkbox" name="package" value="${pkg}"> 
                              <span class="mm-item-text"><i class="fas fa-archive" style="color:#adb5bd; margin-right:8px;"></i>${displayName}</span>
                              <span style="font-size:0.8em; color:#adb5bd;">${pkg}</span>
                          </label>`;
                        });
                        container.innerHTML = html;
                      })
                      .catch(err => container.innerHTML = '<div style="padding:20px; color:red;">加载失败</div>');
                };

                // 初始加载
                renderMods();

                // --- 3. 核心功能绑定 ---

                // 上传
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

                // 删除模组
                document.getElementById('delModsBtn').addEventListener('click', () => {
                    const selected = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);
                    if (selected.length === 0) return alert('请先选择模组');
                    if (!confirm(`确定删除 ${selected.length} 个模组吗？`)) return;

                    fetch('/resource/deletemods', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(selected)
                    }).then(() => renderMods());
                });

                // 删除整合包
                document.getElementById('delPacksBtn').addEventListener('click', () => {
                    const selected = Array.from(document.querySelectorAll('input[name="package"]:checked')).map(cb => cb.value);
                    if (selected.length === 0) return alert('请先选择整合包');
                    if (!confirm(`确定删除 ${selected.length} 个整合包吗？`)) return;

                    fetch('/resource/deletepackages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(selected)
                    }).then(() => renderPacks());
                });

                // 刷新按钮
                document.getElementById('refreshPacksBtn').addEventListener('click', renderPacks);

                // 创建整合包
                document.getElementById('createPkgBtn').addEventListener('click', () => {
                    const name = document.getElementById('pkgNameInput').value.trim();
                    if (!name) return alert('请输入名称');
                    const mods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);
                    if (mods.length === 0) return alert('请至少勾选一个模组');

                    const status = document.getElementById('pkgStatus');
                    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

                    fetch('/resource/packmods', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ packageName: name, mods: mods })
                    })
                    .then(async res => {
                        if (!res.ok) throw new Error(await res.text());
                        status.style.color = 'green';
                        status.innerHTML = '✅ 成功';
                        document.getElementById('pkgNameInput').value = '';
                        document.querySelectorAll('input[name="mod"]:checked').forEach(cb => cb.checked = false);
                        setTimeout(() => status.innerHTML = '', 3000);
                    })
                    .catch(err => {
                        status.style.color = 'red';
                        status.innerHTML = `❌ ${err.message}`;
                    });
                });
            }
        });
    });

    // 4. 服务器列表逻辑
    btnList.addEventListener('click', () => {
        setActive(btnList);
        currentWorkflow = '';
        loadView(ServerListView);
    });

    // 默认视图
    setActive(btnCreateServer);
    currentWorkflow = 'createServer';
    loadView(InitialView);
});