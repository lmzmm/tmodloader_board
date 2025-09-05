const SelectModView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-puzzle-piece"></i> 选择模组</h2>
      <p>为您的新服务器或新世界选择需要的模组。</p>
      <div class="content-wrapper">
        <div class="selection-area">
          <div id="modListContainer">正在加载模-组-列表...</div>
        </div>
        <div id="modUploadArea" class="upload-area">
          <h3>上传模组文件</h3>
          <div id="modDropZone" class="drop-zone"><i class="fas fa-cloud-upload-alt"></i><p>拖动文件到此处，或点击选择</p></div>
          <input type="file" id="modFileInput" multiple style="display: none;">
          <h4>待上传列表：</h4>
          <div id="modFileList" class="file-list-container"></div>
          <div id="modUploadStatus"></div>
          <br><button id="uploadAllModsBtn">开始上传</button>
        </div>
      </div>
      <div id="workflowStatus" class="step-status" style="margin-top: 20px;"></div>
    </div>`,

  /**
   * 初始化函数：现在只负责调用渲染函数。
   */
  init: function() {
    this.renderModList();
  },

  /**
   * 渲染函数：现在是所有逻辑的中心。
   * 它负责获取数据、渲染HTML，然后【在渲染完成后】设置所有相关的JS功能。
   */
  renderModList: function() {
    const container = document.getElementById('modListContainer');
    const statusEl = document.getElementById('workflowStatus');

    container.innerHTML = '正在刷新模组列表...';
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
        let listHtml = `<h3>可用模组</h3><div class="item-list">`;
        const currentConfig = currentWorkflow === 'createServer' ? serverConfig : worldCreatorConfig;
        mods.forEach(mod => {
          const isChecked = currentConfig.mods && currentConfig.mods.includes(mod) ? 'checked' : '';
          listHtml += `<label><input type="checkbox" name="mod" value="${mod}" ${isChecked}> ${mod}</label>`;
        });
        listHtml += `</div><br>
          <button id="submitModsBtn">下一步 <i class="fas fa-arrow-right"></i></button>
          <button id="showModUploaderBtn" style="margin-left: 15px;"><i class="fas fa-upload"></i> 上传新模组</button>`;

        // 2. 将 HTML 插入到 DOM
        container.innerHTML = listHtml;

        // 3. 【核心修复】在 HTML 渲染完成后，才执行依赖这些DOM元素的代码

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

        // 3b. 设置 "下一步" 按钮的事件监听器 (这里可以使用直接绑定，因为我们每次都重新设置)
        const submitBtn = document.getElementById('submitModsBtn');
        submitBtn.addEventListener('click', () => {
          if (submitBtn.disabled) return;
          const selectedMods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);

          if (currentWorkflow === 'createServer') {
            serverConfig.mods = selectedMods;
            alert(`模组选择成功! 已选: ${serverConfig.mods.join(', ') || '无'}`);
            loadView(SelectWorldView);
          } else if (currentWorkflow === 'createWorld') {
            worldCreatorConfig.mods = selectedMods;
            submitBtn.disabled = true;
            statusEl.style.color = 'var(--text-secondary)';
            statusEl.innerHTML = `<i class="fas fa-cog fa-spin"></i> 正在初始化世界生成器...`;

            fetch('/create/startworldcreator', { method: 'POST' })
              .then(res => {
                if (!res.ok) throw new Error(res.statusText);
                return res.text();
              })
              .then(text => {
                console.log("服务器已准备好:", text);
                statusEl.style.color = 'var(--success-color)';
                statusEl.innerHTML = `✅ 初始化成功！`;
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
        container.innerHTML = '加载模组列表失败: ' + err.message;
      });
  }
};