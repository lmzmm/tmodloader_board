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
   * 初始化函数：只执行一次。
   */
  init: function() {
    // 1. 初始加载模组列表
    this.renderModList();

    // 2. 设置 Uploader。它会自己处理 #showModUploaderBtn 的点击事件。
    // 我们不再用事件委托干涉它。
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

    // 3. 【精准修复】只为动态生成的 "下一步" 按钮使用事件委托
    const container = document.getElementById('modListContainer');
    container.addEventListener('click', (event) => {

      const submitBtn = event.target.closest('#submitModsBtn');

      // 如果点击的不是 "下一步" 按钮，则忽略，让其他事件（如上传按钮的）正常处理
      if (!submitBtn) {
        return;
      }

      // --- 统一处理 "下一步" 按钮的点击 ---
      if (submitBtn.disabled) {
        return;
      }

      const selectedMods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);
      const statusEl = document.getElementById('workflowStatus');

      // 【关键修复】根据当前工作流执行不同逻辑
      if (currentWorkflow === 'createServer') {
        serverConfig.mods = selectedMods;
        alert(`模组选择成功! 已选: ${serverConfig.mods.join(', ') || '无'}`);
        loadView(SelectWorldView); // 正确跳转到下一步

      } else if (currentWorkflow === 'createWorld') {
        worldCreatorConfig.mods = selectedMods;

        submitBtn.disabled = true;
        statusEl.style.color = 'var(--text-secondary)';
        statusEl.innerHTML = `
          <i class="fas fa-cog fa-spin"></i> 
          正在初始化世界生成器... 这可能需要几十秒，请耐心等待。
        `;

        fetch('/create/startworldcreator', { method: 'POST' })
          .then(res => {
            if (!res.ok) {
              return res.text().then(text => { throw new Error(text || '启动世界生成器失败'); });
            }
            return res.text();
          })
          .then(text => {
            console.log("服务器已准备好接收配置:", text);
            statusEl.style.color = 'var(--success-color)';
            statusEl.innerHTML = `✅ 初始化成功！正在进入配置页面...`;
            setTimeout(() => { loadView(SelectWorldSizeView); }, 500);
          })
          .catch(err => {
            console.error("初始化世界生成器时出错:", err);
            statusEl.style.color = 'var(--danger-color)';
            statusEl.innerHTML = `❌ 初始化失败: ${err.message}`;
            submitBtn.disabled = false;
          });
      }
    });
  },

  /**
   * 渲染函数：只负责生成HTML内容，不绑定事件。
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
        let listHtml = `<h3>可用模组</h3><div class="item-list">`;
        const currentConfig = currentWorkflow === 'createServer' ? serverConfig : worldCreatorConfig;
        mods.forEach(mod => {
          const isChecked = currentConfig.mods && currentConfig.mods.includes(mod) ? 'checked' : '';
          listHtml += `<label><input type="checkbox" name="mod" value="${mod}" ${isChecked}> ${mod}</label>`;
        });
        listHtml += `</div><br>
          <button id="submitModsBtn">下一步 <i class="fas fa-arrow-right"></i></button>
          <button id="showModUploaderBtn" style="margin-left: 15px;"><i class="fas fa-upload"></i> 上传新模组</button>`;

        container.innerHTML = listHtml;
      })
      .catch(err => {
        container.innerHTML = '加载模组列表失败: ' + err.message;
      });
  }
};