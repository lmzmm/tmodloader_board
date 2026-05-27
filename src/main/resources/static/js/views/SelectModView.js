const SelectModView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-puzzle-piece"></i> 选择模组</h2>
      <p>为您的新服务器或新世界选择需要的模组。</p>

      <div class="content-wrapper">
        <div class="selection-area" style="width: 100%;">
          <div id="modListContainer" class="scroll-list">
            <div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>正在加载模组列表...</p></div>
          </div>
        </div>
      </div>

      <div class="toggle-section">
        <div class="toggle-header" id="togglePackageListBtn">
          <h3><i class="fas fa-layer-group"></i> 使用整合包</h3>
          <i class="fas fa-chevron-down" id="packageToggleIcon"></i>
        </div>
        <div class="toggle-body" id="packageListSection">
          <p style="font-size: 0.85em; color: var(--cream-dim); margin-bottom: 10px;">注意：选择整合包将覆盖上方手动勾选的模组。</p>
          <div id="packageListContainer"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>加载中...</p></div></div>
        </div>
      </div>

      <button id="submitModsBtn" class="btn-primary" style="width: 100%;">
        <i class="fas fa-arrow-right"></i> 使用选中模组并下一步
      </button>
      <div id="workflowStatus" class="step-status"></div>
    </div>`,

  init: function() {
    this.renderModList();
    this.renderPackageList();

    document.getElementById('togglePackageListBtn').addEventListener('click', function() {
      const section = document.getElementById('packageListSection');
      const icon = document.getElementById('packageToggleIcon');
      if (!section.classList.contains('open')) {
        section.classList.add('open');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
      } else {
        section.classList.remove('open');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
      }
    });

    document.getElementById('submitModsBtn').addEventListener('click', () => {
        const btn = document.getElementById('submitModsBtn');
        if (btn.disabled) return;
        const selectedMods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);
        const statusEl = document.getElementById('workflowStatus');
        const requestData = { packaged: false, mods: selectedMods, packageName: null };
        this.submitConfiguration(requestData, statusEl);
    });
  },

  renderPackageList: function() {
    const container = document.getElementById('packageListContainer');
    authFetch('/resource/packagelist?t=' + Date.now())
      .then(response => response.json())
      .then(packages => {
        if (!packages || packages.length === 0) {
          container.innerHTML = '<div class="empty-state"><i class="fas fa-archive"></i><p>暂无整合包</p><p style="font-size:0.82em;">请在模组管理中创建</p></div>';
          return;
        }
        let listHtml = `<div class="item-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:6px;">`;
        packages.forEach(pkg => {
          const displayName = pkg.replace(/\.json$/, '');
          listHtml += `
            <label>
                <input type="radio" name="package" value="${pkg}">
                <span style="overflow:hidden; text-overflow:ellipsis;">${displayName}</span>
            </label>`;
        });
        listHtml += `</div>
          <button id="usePackageBtn" class="btn-success" style="width:100%; margin-top:14px;">
            <i class="fas fa-check"></i> 使用此整合包并下一步
          </button>`;
        container.innerHTML = listHtml;

        document.getElementById('usePackageBtn').addEventListener('click', () => {
          const selectedPackage = document.querySelector('input[name="package"]:checked');
          if (!selectedPackage) { alert('请先选择一个整合包！'); return; }
          const packageName = selectedPackage.value;
          const statusEl = document.getElementById('workflowStatus');
          const requestData = { packaged: true, mods: [], packageName: packageName };
          this.submitConfiguration(requestData, statusEl);
        });
      })
      .catch(err => {
        container.innerHTML = '<p class="status-fail">加载整合包列表失败。</p>';
      });
  },

  renderModList: function() {
    const container = document.getElementById('modListContainer');
    container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>正在刷新模组列表...</p></div>';

    authFetch('/resource/modlist?t=' + Date.now())
      .then(response => response.json())
      .then(mods => {
        const currentConfig = currentWorkflow === 'createServer' ? serverConfig : worldCreatorConfig;
        if (!mods || mods.length === 0) {
          container.innerHTML = '<div class="empty-state"><i class="fas fa-puzzle-piece"></i><p>暂无可用模组</p></div>';
          return;
        }
        let listHtml = `<div class="item-list">`;
        mods.forEach(mod => {
          const isChecked = currentConfig.mods && currentConfig.mods.includes(mod) ? 'checked' : '';
          listHtml += `
            <label>
              <input type="checkbox" name="mod" value="${mod}" ${isChecked}>
              ${mod}
            </label>`;
        });
        listHtml += `</div>`;
        container.innerHTML = listHtml;
      })
      .catch(err => {
        container.innerHTML = `<p class="status-fail">加载模组列表失败: ${err.message}</p>`;
      });
  },

  submitConfiguration: async function(requestData, statusEl) {
      if (currentWorkflow === 'createServer') {
          serverConfig.packaged = requestData.packaged;
          serverConfig.mods = requestData.mods;
          serverConfig.packageName = requestData.packageName;

          if (requestData.packaged && requestData.packageName) {
              statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在应用整合包...';
              try {
                  const pkgResponse = await authFetch('/resource/usepackage', {
                      method: 'POST',
                      headers: { 'Content-Type': 'text/plain' },
                      body: requestData.packageName
                  });
                  if (!pkgResponse.ok) {
                      const errText = await pkgResponse.text();
                      throw new Error("应用整合包失败: " + errText);
                  }
              } catch (err) {
                  statusEl.innerHTML = `<span class="status-fail">应用整合包失败: ${err.message}</span>`;
                  return;
              }
          }
          loadView(SelectWorldView);
          return;
      }

      if (currentWorkflow === 'createWorld') {
        try {
            worldCreatorConfig.mods = requestData.mods;
            if (requestData.packaged && requestData.packageName) {
                statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在应用整合包...';
                const pkgResponse = await authFetch('/resource/usepackage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: requestData.packageName
                });
                if (!pkgResponse.ok) {
                    const errText = await pkgResponse.text();
                    throw new Error("应用整合包失败: " + errText);
                }
            }
            statusEl.innerHTML = '<i class="fas fa-cog fa-spin"></i> 正在初始化世界生成器...';
            const startResponse = await authFetch('/create/startworldcreator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            if (!startResponse.ok) {
                const errText = await startResponse.text();
                throw new Error(errText);
            }
            statusEl.innerHTML = `<span class="status-success">初始化成功！正在进入配置页面...</span>`;
            setTimeout(() => { loadView(SelectWorldSizeView); }, 500);
        } catch (err) {
            statusEl.innerHTML = `<span class="status-fail">操作失败: ${err.message}</span>`;
        }
      }
  }
};