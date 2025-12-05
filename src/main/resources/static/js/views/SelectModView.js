const SelectModView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-puzzle-piece"></i> 选择模组</h2>
      <p>为您的新服务器或新世界选择需要的模组。</p>
      
      <div class="content-wrapper">
        <div class="selection-area" style="width: 100%;">
          <div id="modListContainer" style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
            正在加载模组列表...
          </div>
        </div>
      </div>

      <div style="margin-bottom: 25px; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
        <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" id="togglePackageListBtn">
            <h3 style="margin: 0; font-size: 1.1em; color: #495057;"><i class="fas fa-layer-group"></i>使用整合包</h3>
            <i class="fas fa-chevron-down" id="packageToggleIcon"></i>
        </div>
        
        <div id="packageListSection" style="display: none; margin-top: 15px; padding-top: 10px; border-top: 1px solid #dee2e6;">
          <p style="font-size: 0.9em; color: #666; margin-bottom: 10px;">注意：选择整合包将覆盖上方手动勾选的模组。</p>
          <div id="packageListContainer">正在加载整合包列表...</div>
        </div>
      </div>

      <button id="submitModsBtn" style="width: 100%; padding: 12px; font-size: 1.1em; background-color: #4361ee; color: white; border: none; border-radius: 6px; cursor: pointer;">
        <i class="fas fa-arrow-right"></i> 使用选中模组并下一步
      </button>

      <div id="workflowStatus" class="step-status" style="margin-top: 15px;"></div>
    </div>`,

  init: function() {
    this.renderModList();
    this.renderPackageList();

    document.getElementById('togglePackageListBtn').addEventListener('click', function() {
      const section = document.getElementById('packageListSection');
      const icon = document.getElementById('packageToggleIcon');

      if (section.style.display === 'none') {
        section.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
      } else {
        section.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
      }
    });

    document.getElementById('submitModsBtn').addEventListener('click', () => {
        const btn = document.getElementById('submitModsBtn');
        if (btn.disabled) return;

        const selectedMods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);
        const statusEl = document.getElementById('workflowStatus');

        const requestData = {
            packaged: false,
            mods: selectedMods,
            packageName: null
        };

        this.submitConfiguration(requestData, statusEl);
    });
  },

  renderPackageList: function() {
    const container = document.getElementById('packageListContainer');
    fetch('/resource/packagelist?t=' + Date.now())
      .then(response => response.json())
      .then(packages => {
        if (!packages || packages.length === 0) {
          container.innerHTML = '<p style="color:#888;">暂无整合包，请在【模组管理】中创建。</p>';
          return;
        }

        let listHtml = `<div class="item-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px;">`;
        packages.forEach(pkg => {
          const displayName = pkg.replace(/\.json$/, '');
          listHtml += `
            <label style="background:#fff; padding:10px; border:1px solid #ced4da; border-radius:4px; cursor:pointer; display:flex; align-items:center;">
                <input type="radio" name="package" value="${pkg}" style="margin-right:10px;"> 
                <span style="overflow:hidden; text-overflow:ellipsis;">${displayName}</span>
            </label>`;
        });

        listHtml += `</div>
          <button id="usePackageBtn" style="width: 100%; margin-top:15px; padding:8px; background-color: #2a9d8f; color:white; border:none; border-radius:4px; cursor:pointer;">
            <i class="fas fa-check"></i> 使用此整合包并下一步
          </button>`;

        container.innerHTML = listHtml;

        document.getElementById('usePackageBtn').addEventListener('click', () => {
          const selectedPackage = document.querySelector('input[name="package"]:checked');
          if (!selectedPackage) {
            alert('请先选择一个整合包！');
            return;
          }

          const packageName = selectedPackage.value;
          const statusEl = document.getElementById('workflowStatus');

          const requestData = {
              packaged: true,
              mods: [],
              packageName: packageName
          };

          this.submitConfiguration(requestData, statusEl);
        });
      })
      .catch(err => {
        container.innerHTML = '<p style="color:red;">加载整合包列表失败。</p>';
      });
  },

  renderModList: function() {
    const container = document.getElementById('modListContainer');
    container.innerHTML = '<p style="text-align:center; color:#888;"><i class="fas fa-spinner fa-spin"></i> 正在刷新模组列表...</p>';

    fetch('/resource/modlist?t=' + Date.now())
      .then(response => response.json())
      .then(mods => {
        const currentConfig = currentWorkflow === 'createServer' ? serverConfig : worldCreatorConfig;

        if (!mods || mods.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#888;">暂无可用模组。</p>`;
            return;
        }

        let listHtml = `<div class="item-list">`;
        mods.forEach(mod => {
          const isChecked = currentConfig.mods && currentConfig.mods.includes(mod) ? 'checked' : '';
          listHtml += `
            <label style="display:block; padding:8px 0; border-bottom:1px solid #f1f1f1; cursor:pointer;">
                <input type="checkbox" name="mod" value="${mod}" ${isChecked} style="margin-right:10px;"> 
                ${mod}
            </label>`;
        });
        listHtml += `</div>`;
        container.innerHTML = listHtml;
      })
      .catch(err => {
        container.innerHTML = `<p style="color: #e63946;">加载模组列表失败: ${err.message}</p>`;
      });
  },

  submitConfiguration: async function(requestData, statusEl) {
      if (currentWorkflow === 'createServer') {
          serverConfig.packaged = requestData.packaged;
          serverConfig.mods = requestData.mods;
          serverConfig.packageName = requestData.packageName;

          if (requestData.packaged && requestData.packageName) {
              statusEl.style.color = '#666';
              statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在应用整合包...';

              try {
                  const pkgResponse = await fetch('/resource/usepackage', {
                      method: 'POST',
                      headers: { 'Content-Type': 'text/plain' },
                      body: requestData.packageName
                  });

                  if (!pkgResponse.ok) {
                      const errText = await pkgResponse.text();
                      throw new Error("应用整合包失败: " + errText);
                  }
              } catch (err) {
                  console.error(err);
                  statusEl.style.color = '#e63946';
                  statusEl.innerHTML = `❌ 应用整合包失败: ${err.message}`;
                  return;
              }
          }

          loadView(SelectWorldView);
          return;
      }

      if (currentWorkflow === 'createWorld') {
        try {
            worldCreatorConfig.mods = requestData.mods;
            statusEl.style.color = '#666';

            if (requestData.packaged && requestData.packageName) {
                statusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在应用整合包...`;

                const pkgResponse = await fetch('/resource/usepackage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: requestData.packageName
                });

                if (!pkgResponse.ok) {
                    const errText = await pkgResponse.text();
                    throw new Error("应用整合包失败: " + errText);
                }
            }

            statusEl.innerHTML = `<i class="fas fa-cog fa-spin"></i> 正在初始化世界生成器...`;

            const startResponse = await fetch('/create/startworldcreator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!startResponse.ok) {
                const errText = await startResponse.text();
                throw new Error(errText);
            }

            statusEl.style.color = '#2a9d8f';
            statusEl.innerHTML = `✅ 初始化成功！正在进入配置页面...`;
            setTimeout(() => { loadView(SelectWorldSizeView); }, 500);

        } catch (err) {
            console.error(err);
            statusEl.style.color = '#e63946';
            statusEl.innerHTML = `❌ 操作失败: ${err.message}`;
        }
      }
  }
};