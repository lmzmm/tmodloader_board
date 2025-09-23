const SelectModView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-puzzle-piece"></i> 选择模组</h2>
      <p>为您的新服务器或新世界选择需要的模组。</p>
      <div class="content-wrapper">
        <div class="selection-area">
          <div id="modListContainer">正在加载模组列表...</div>
        </div>
        <div id="modUploadArea" class="upload-area">
          <h3><i class="fas fa-upload"></i> 上传模组文件</h3>
          <div id="modDropZone" class="drop-zone">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>拖动文件到此处，或点击选择</p>
            <p style="font-size: 0.9em; margin-top: 10px;">支持 .tmod 文件</p>
          </div>
          <input type="file" id="modFileInput" multiple style="display: none;">
          <h4><i class="fas fa-list"></i> 待上传列表：</h4>
          <div id="modFileList" class="file-list-container"></div>
          <div id="modUploadStatus"></div>
          <br>
          <button id="uploadAllModsBtn" style="width: 100%;">
            <i class="fas fa-arrow-up"></i> 开始上传
          </button>
        </div>
      </div>
      <div id="workflowStatus" class="step-status" style="margin-top: 20px;"></div>
    </div>`,

  /**
   * 初始化函数：只负责调用渲染函数。
   */
  init: function() {
    this.renderModList();
  },

  /**
   * 渲染函数：是所有逻辑的中心。
   * 它负责获取数据、渲染HTML，然后在渲染完成后设置所有相关的JS功能。
   */
  renderModList: function() {
    const container = document.getElementById('modListContainer');
    const statusEl = document.getElementById('workflowStatus');

    container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在刷新模组列表...</p>';
    if (statusEl) {
        statusEl.innerHTML = '';
    }

    fetch('/create/modlist')
      .then(response => {
        if (!response.ok) return ['高清修复', '小地图', '物品整理', '血量显示'];
        return response.json();
      })
      .then(mods => {
        // 1. 准备 HTML
        let listHtml = `<h3><i class="fas fa-boxes"></i> 可用模组</h3><div class="item-list">`;
        const currentConfig = currentWorkflow === 'createServer' ? serverConfig : worldCreatorConfig;
        mods.forEach(mod => {
          const isChecked = currentConfig.mods && currentConfig.mods.includes(mod) ? 'checked' : '';
          listHtml += `<label><input type="checkbox" name="mod" value="${mod}" ${isChecked}> ${mod}</label>`;
        });
        listHtml += `</div><br>
          <div style="display: flex; gap: 15px; flex-wrap: wrap;">
            <button id="submitModsBtn" style="flex: 1; min-width: 200px;">
              <i class="fas fa-arrow-right"></i> 下一步
            </button>
            <button id="showModUploaderBtn" style="flex: 1; min-width: 200px;">
              <i class="fas fa-upload"></i> 上传新模组
            </button>
          </div>`;

        // 2. 将 HTML 插入到 DOM
        container.innerHTML = listHtml;

        // 3. 在 HTML 渲染完成后，才执行依赖这些DOM元素的代码

        // 3a. 设置 Uploader
        setupUploader({
          dropZoneId: 'modDropZone',
          fileInputId: 'modFileInput',
          fileListId: 'modFileList',
          uploadBtnId: 'uploadAllModsBtn',
          showUploaderBtnId: 'showModUploaderBtn',
          uploaderAreaId: 'modUploadArea',
          uploadEndpoint: '/create/uploadmod',
          statusContainerId: 'modUploadStatus',
          onUploadComplete: this.renderModList.bind(this)
        });

        // 3b. 设置 "下一步" 按钮的事件监听器
        const submitBtn = document.getElementById('submitModsBtn');
        submitBtn.addEventListener('click', () => {
          if (submitBtn.disabled) return;

          const selectedMods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);

          if (currentWorkflow === 'createServer') {
            serverConfig.mods = selectedMods;
            alert(`模组选择成功! 已选: ${serverConfig.mods.join(', ') || '无'}`);
            loadView(SelectWorldView);

          } else if (currentWorkflow === 'createWorld') {
            worldCreatorConfig.mods = selectedMods; // (可选) 在前端也保存一份

            submitBtn.disabled = true;
            statusEl.style.color = 'var(--text-secondary)';
            statusEl.innerHTML = `<i class="fas fa-cog fa-spin"></i> 正在初始化世界生成器...这可能需要一些时间...`;

            // 构造只包含 mods 的请求数据
            const requestData = {
                mods: selectedMods
            };

            fetch('/create/startworldcreator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })
              .then(res => {
                if (!res.ok) {
                  return res.text().then(text => { throw new Error(text || '启动失败'); });
                }
                return res.text();
              })
              .then(text => {
                console.log("服务器已准备好:", text);
                statusEl.style.color = 'var(--success-color)';
                statusEl.innerHTML = `✅ 初始化成功！正在进入配置页面...`;
                setTimeout(() => { loadView(SelectWorldSizeView); }, 500);
              })
              .catch(err => {
                console.error("初始化出错:", err);
                statusEl.style.color = 'var(--danger-color)';
                statusEl.innerHTML = `❌ 初始化失败: ${err.message}`;
                submitBtn.disabled = false;
              });
          }
        });
      })
      .catch(err => {
        container.innerHTML = '<p style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> 加载模组列表失败: ' + err.message + '</p>';
      });
  }
};