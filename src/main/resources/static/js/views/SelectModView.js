const SelectModView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-puzzle-piece"></i> 选择模组</h2>
      <p>为您的新服务器或新世界选择需要的模组。</p>
      <div class="content-wrapper">
        <div class="selection-area">
          <div id="modListContainer">正在加载模组列表...</div><br>
          <button id="showModUploaderBtn"><i class="fas fa-upload"></i> 上传新模组</button>
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
    </div>`,
  init: function() {
    this.renderModList();
    setupUploader({
      dropZoneId: 'modDropZone', fileInputId: 'modFileInput', fileListId: 'modFileList',
      uploadBtnId: 'uploadAllModsBtn', showUploaderBtnId: 'showModUploaderBtn',
      uploaderAreaId: 'modUploadArea', uploadEndpoint: '/create/uploadmod',
      statusContainerId: 'modUploadStatus',
      onUploadComplete: this.renderModList
    });
  },
  renderModList: function() {
    const container = document.getElementById('modListContainer');
    container.innerHTML = '正在刷新模组列表...';
    fetch('/create/modlist')
      .then(response => {
        if (!response.ok) return ['高清修复', '小地图', '物品整理', '血量显示']; // Mock data
        return response.json();
      })
      .then(mods => {
        let listHtml = `<h3>可用模组</h3><div class="item-list">`;
        // 根据当前工作流决定默认选中项
        const currentConfig = currentWorkflow === 'createServer' ? serverConfig : worldCreatorConfig;
        mods.forEach(mod => {
          const isChecked = currentConfig.mods && currentConfig.mods.includes(mod) ? 'checked' : '';
          listHtml += `<label><input type="checkbox" name="mod" value="${mod}" ${isChecked}> ${mod}</label>`;
        });
        listHtml += `</div><br><button id="submitModsBtn">下一步 <i class="fas fa-arrow-right"></i></button>`;
        container.innerHTML = listHtml;

        document.getElementById('submitModsBtn').addEventListener('click', () => {
          const selectedMods = Array.from(document.querySelectorAll('input[name="mod"]:checked')).map(cb => cb.value);

          // 根据工作流执行不同操作
          if (currentWorkflow === 'createServer') {
            serverConfig.mods = selectedMods;
            alert(`模组选择成功! 已选: ${serverConfig.mods.join(', ') || '无'}`);
            loadView(SelectWorldView);
          } else if (currentWorkflow === 'createWorld') {
            worldCreatorConfig.mods = selectedMods;
            alert(`模组选择成功! 已选: ${worldCreatorConfig.mods.join(', ') || '无'}`);

            // 发送POST请求到 /startworldcreator
            console.log('正在启动世界创建流程，发送配置:', { mods: worldCreatorConfig.mods });
            fetch('/create/startworldcreator', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mods: worldCreatorConfig.mods })
            })
            .then(res => {
              if (!res.ok) {
                return res.text().then(text => { throw new Error(text || '启动世界创建流程失败'); });
              }
              return res.text();
            })
            .then(text => {
              console.log('服务器响应:', text); // e.g., "OK" or JSON with options
              // 假设服务器返回OK后，进入下一步
              loadView(SelectWorldSizeView);
            })
            .catch(err => {
              alert(`错误: ${err.message}`);
            });
          }
        });
      })
      .catch(err => { container.innerHTML = '加载模组列表失败: ' + err.message; });
  }
};