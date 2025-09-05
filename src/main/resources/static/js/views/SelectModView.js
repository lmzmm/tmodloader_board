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

  init: function() {
    this.renderModList();

    // setupUploader 现在只需要处理它自己的按钮逻辑，
    // showModUploaderBtn 的点击由我们的委托处理。
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

    // 【核心修复】使用事件委托和 .closest()
    const container = document.getElementById('modListContainer');
    container.addEventListener('click', (event) => {

      // *** 关键修正 1: 使用 .closest() 查找按钮 ***
      // 无论用户点击的是按钮本身、文字还是图标，这都能找到父级的按钮元素。
      const submitBtn = event.target.closest('#submitModsBtn');
      const showUploaderBtn = event.target.closest('#showModUploaderBtn');

      // --- 处理 "下一步" 按钮的点击 ---
      if (submitBtn) { // 如果找到了 submitBtn (即点击发生在按钮内部)
        if (submitBtn.disabled) {
          console.warn("按钮已被禁用，点击被忽略。");
          return;
        }

        console.log("Submit button clicked via delegation and closest()!");

        const selectedMods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);

        if (currentWorkflow === 'createServer') {
          serverConfig.mods = selectedMods;
          alert(`模组选择成功! 已选: ${serverConfig.mods.join(', ') || '无'}`);
          loadView(SelectWorldView);

        } else if (currentWorkflow === 'createWorld') {
          worldCreatorConfig.mods = selectedMods;
          const statusEl = document.getElementById('workflowStatus');

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
      }

      // --- 处理 "上传新模组" 按钮的点击 ---
      if (showUploaderBtn) { // 如果找到了 showUploaderBtn
        // 阻止默认行为，以防万一
        event.preventDefault();
        document.getElementById('modUploadArea').classList.toggle('visible');
      }
    });
  },

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